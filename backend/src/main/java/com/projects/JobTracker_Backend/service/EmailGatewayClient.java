package com.projects.JobTracker_Backend.service;

import com.projects.JobTracker_Backend.exception.EmailDeliveryException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.Map;

/**
 * Sends transactional mail through the deployed Cloudflare Worker, which holds
 * the Resend key. The backend never sees that key and no Worker redeploy is
 * needed to change a template.
 *
 * <p>The Worker's {@code POST /} route wants {@code {to, subject, html}} —
 * that, not the {@code {email, otp}} shape the gateway README described, is what
 * the deployed handler validates.
 *
 * <p>Deliberately no {@code from} and no {@code reply_to}: the Worker resolves
 * {@code payload.from || env.FROM_EMAIL}, so omitting it makes the Worker's
 * {@code FROM_EMAIL} secret the one place the sender is defined for every
 * caller. A backend copy of the address would be a second place to change and a
 * way for the two to disagree.
 */
@Service
@Slf4j
public class EmailGatewayClient {

    private final RestClient client;
    private final String gatewaySecret;
    private final boolean configured;
    private final int otpTtlSeconds;

    public EmailGatewayClient(@Value("${app.email.gateway-url:}") String gatewayUrl,
                              @Value("${app.email.gateway-secret:}") String gatewaySecret,
                              @Value("${app.email.otp-ttl-seconds:600}") int otpTtlSeconds,
                              @Value("${app.email.connect-timeout-ms:3000}") int connectTimeoutMs,
                              @Value("${app.email.read-timeout-ms:5000}") int readTimeoutMs) {

        this.gatewaySecret = gatewaySecret;
        this.otpTtlSeconds = otpTtlSeconds;
        this.configured = StringUtils.hasText(gatewayUrl) && StringUtils.hasText(gatewaySecret);

        // A default RestClient has no read timeout at all, which would let a hung
        // gateway pin a request thread for the whole container timeout.
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofMillis(connectTimeoutMs));
        factory.setReadTimeout(Duration.ofMillis(readTimeoutMs));

        this.client = RestClient.builder()
                .baseUrl(StringUtils.hasText(gatewayUrl) ? gatewayUrl : "http://localhost")
                .requestFactory(factory)
                .build();

        if (!configured) {
            log.warn("Email gateway is not configured (WORKER_URL / WORKER_SECRET unset). "
                    + "OTP signup will fail with a 502 until they are.");
        }
    }

    /** Sends the six-digit code. Never logs the code itself. */
    public void sendOtp(String to, String otp) {
        send(to, "Your TrackHire verification code", otpHtml(otp));
    }

    private void send(String to, String subject, String html) {
        if (!configured) {
            throw new EmailDeliveryException("Email gateway is not configured");
        }

        try {
            // The Worker answers {"success":true,"data":{"id":...}} on the way out.
            Map<?, ?> body = client.post()
                    .uri("/")
                    .header("x-api-key", gatewaySecret)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(Map.of("to", to, "subject", subject, "html", html))
                    .retrieve()
                    .body(Map.class);

            Object data = body == null ? null : body.get("data");
            Object id = (data instanceof Map<?, ?> map) ? map.get("id") : null;
            log.info("Verification email accepted by gateway (resend id={})", id);
        } catch (EmailDeliveryException ex) {
            throw ex;
        } catch (Exception ex) {
            // The gateway's own body can carry Resend's error detail; it stays in
            // the log and never reaches the caller.
            throw new EmailDeliveryException("Email gateway rejected the send: " + ex.getMessage(), ex);
        }
    }

    /**
     * Inline styles only — mail clients strip {@code <style>} blocks. Brand
     * colours per frontend/BRAND_GUIDELINES.md, and the trackhire.me domain in
     * the footer so the visible brand matches the From: domain (a mismatch there
     * is itself a spam signal).
     */
    private String otpHtml(String otp) {
        int minutes = Math.max(1, otpTtlSeconds / 60);
        return """
                <div style="margin:0;padding:32px 16px;background:#f5f5f0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
                  <div style="max-width:480px;margin:0 auto;background:#ffffff;border:4px solid #060608;box-shadow:8px 8px 0 #060608;">
                    <div style="background:#060608;padding:20px 24px;">
                      <span style="color:#ffffff;font-size:20px;font-weight:900;letter-spacing:-0.5px;text-transform:uppercase;">TRACK<span style="color:#FF6B00;">HIRE</span></span>
                    </div>
                    <div style="padding:32px 24px;">
                      <h1 style="margin:0 0 12px;font-size:24px;font-weight:900;text-transform:uppercase;color:#060608;">Verify your email</h1>
                      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#060608;">Enter this code to finish creating your TrackHire account.</p>
                      <div style="border:3px solid #060608;background:#FF6B00;padding:20px;text-align:center;">
                        <span style="font-family:'Courier New',Courier,monospace;font-size:38px;font-weight:900;letter-spacing:10px;color:#ffffff;">%s</span>
                      </div>
                      <p style="margin:24px 0 0;font-size:13px;font-weight:700;text-transform:uppercase;color:#060608;">This code expires in %d minutes.</p>
                      <p style="margin:12px 0 0;font-size:13px;line-height:1.6;color:#555555;">If you did not ask to create an account, you can ignore this email — nothing was created.</p>
                    </div>
                    <div style="border-top:3px solid #060608;padding:16px 24px;background:#f5f5f0;">
                      <p style="margin:0;font-size:11px;color:#555555;">TrackHire &middot; trackhire.me &middot; This mailbox is not monitored.</p>
                    </div>
                  </div>
                </div>
                """.formatted(otp, minutes);
    }
}
