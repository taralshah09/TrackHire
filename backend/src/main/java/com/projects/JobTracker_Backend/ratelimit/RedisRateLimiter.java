package com.projects.JobTracker_Backend.ratelimit;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;

/**
 * Fixed-window request counter backed by Redis.
 *
 * <p>The INCR and the PEXPIRE happen inside one Lua script so two concurrent
 * requests can never both see {@code current == 1} and race to set the TTL,
 * which would otherwise leave a counter without an expiry and lock an IP out
 * permanently.
 *
 * <p>If Redis is unreachable the limiter <b>fails open</b>: a Redis outage
 * degrades protection, it does not take the API down with it.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RedisRateLimiter {

    private static final String LUA = """
            local current = redis.call('INCR', KEYS[1])
            if current == 1 then
              redis.call('PEXPIRE', KEYS[1], ARGV[1])
            end
            local ttl = redis.call('PTTL', KEYS[1])
            return { current, ttl }
            """;

    @SuppressWarnings({"rawtypes", "unchecked"})
    private static final DefaultRedisScript<List> SCRIPT = new DefaultRedisScript<>(LUA, List.class);

    private final StringRedisTemplate redis;

    /**
     * Counts one request against {@code key}.
     *
     * @return the outcome, including how long until the window resets.
     */
    public Decision consume(String key, int limit, Duration window) {
        try {
            List<?> result = redis.execute(SCRIPT, List.of(key), String.valueOf(window.toMillis()));

            if (result == null || result.size() < 2) {
                return Decision.allowed(limit, limit, window.toSeconds());
            }

            long count = ((Number) result.get(0)).longValue();
            long ttlMillis = ((Number) result.get(1)).longValue();
            long resetSeconds = ttlMillis > 0 ? (ttlMillis + 999) / 1000 : window.toSeconds();
            long remaining = Math.max(0, limit - count);

            return new Decision(count <= limit, limit, remaining, resetSeconds);
        } catch (Exception ex) {
            // Fail open — never let a Redis blip become a 500 for the user.
            log.warn("Rate limiter unavailable, allowing request through: {}", ex.getMessage());
            return Decision.allowed(limit, limit, window.toSeconds());
        }
    }

    /**
     * @param allowed        whether the caller may proceed
     * @param limit          the ceiling for this tier
     * @param remaining      requests left in the current window
     * @param resetSeconds   seconds until the window resets
     */
    public record Decision(boolean allowed, long limit, long remaining, long resetSeconds) {
        static Decision allowed(long limit, long remaining, long resetSeconds) {
            return new Decision(true, limit, remaining, resetSeconds);
        }
    }
}
