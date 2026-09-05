package com.projects.JobTracker_Backend.config;

import io.lettuce.core.RedisURI;
import io.lettuce.core.SocketOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisPassword;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.util.StringUtils;

import java.time.Duration;

/**
 * Builds the Redis connection from the same environment variables the ingestion
 * scripts already use, so there is one set of Redis credentials for the whole
 * project rather than two.
 *
 * <p>{@code REDIS_URL} wins when it is set; otherwise the host/port/password
 * trio is used. This is deliberately hand-rolled instead of relying on
 * {@code spring.data.redis.url}: that property rejects an empty string outright,
 * so an unset REDIS_URL would stop the whole application from starting rather
 * than falling back to localhost.
 *
 * <p>Timeouts are short on purpose. The rate limiter fails open, so a slow or
 * dead Redis should cost a request a few hundred milliseconds at worst, not
 * hang it.
 */
@Configuration
@Slf4j
public class RedisConfig {

    @Bean
    public RedisConnectionFactory redisConnectionFactory(
            @Value("${REDIS_URL:}") String redisUrl,
            @Value("${REDIS_HOST:127.0.0.1}") String host,
            @Value("${REDIS_PORT:6379}") int port,
            @Value("${REDIS_PASSWORD:}") String password) {

        RedisStandaloneConfiguration server = new RedisStandaloneConfiguration();
        LettuceClientConfiguration.LettuceClientConfigurationBuilder client =
                LettuceClientConfiguration.builder()
                        .commandTimeout(Duration.ofSeconds(1))
                        .clientOptions(io.lettuce.core.ClientOptions.builder()
                                .socketOptions(SocketOptions.builder()
                                        .connectTimeout(Duration.ofSeconds(2))
                                        .build())
                                .build());

        if (StringUtils.hasText(redisUrl)) {
            RedisURI uri = RedisURI.create(redisUrl.trim());
            server.setHostName(uri.getHost());
            server.setPort(uri.getPort());
            if (StringUtils.hasText(uri.getUsername())) {
                server.setUsername(uri.getUsername());
            }
            if (uri.getCredentialsProvider() != null && uri.getPassword() != null) {
                server.setPassword(RedisPassword.of(uri.getPassword()));
            }
            if (uri.isSsl()) {
                client.useSsl();
            }
            log.info("Redis configured from REDIS_URL ({}:{}, ssl={})",
                    uri.getHost(), uri.getPort(), uri.isSsl());
        } else {
            server.setHostName(host);
            server.setPort(port);
            if (StringUtils.hasText(password)) {
                server.setPassword(RedisPassword.of(password));
            }
            // Anything that is not loopback is a managed instance, which means TLS.
            if (!host.contains("127.0.0.1") && !host.equalsIgnoreCase("localhost")) {
                client.useSsl();
            }
            log.info("Redis configured from REDIS_HOST/REDIS_PORT ({}:{})", host, port);
        }

        return new LettuceConnectionFactory(server, client.build());
    }
}
