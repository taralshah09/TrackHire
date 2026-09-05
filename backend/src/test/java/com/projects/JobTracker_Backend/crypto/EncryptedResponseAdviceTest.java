package com.projects.JobTracker_Backend.crypto;

import com.projects.JobTracker_Backend.config.CacheConfig;
import com.projects.JobTracker_Backend.controller.JobController;
import com.projects.JobTracker_Backend.dto.JobDTO;
import com.projects.JobTracker_Backend.model.Job;
import com.projects.JobTracker_Backend.ratelimit.RateLimitFilter;
import com.projects.JobTracker_Backend.ratelimit.RateLimitProperties;
import com.projects.JobTracker_Backend.ratelimit.RedisRateLimiter;
import com.projects.JobTracker_Backend.security.*;
import com.projects.JobTracker_Backend.service.*;
import com.projects.JobTracker_Backend.util.PageRequestFactory;
import com.projects.JobTracker_Backend.util.SecurityUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.mapping.JpaMetamodelMappingContext;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.ObjectMapper;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;

/**
 * End-to-end check that {@link EncryptedResponseAdvice} changes only the
 * transport, never the payload.
 *
 * <p>The important assertion is {@link #encryptedBodyMatchesThePlaintextEndpointExactly()}:
 * an annotated endpoint and an unannotated one are handed the same
 * {@code Page<JobDTO>}, and the decrypted envelope must equal the plaintext body
 * the message converter produced. If Spring's Page serialization ever diverges
 * from what the advice does, this test catches it before the UI does.
 */
@WebMvcTest(controllers = JobController.class)
@Import({CacheConfig.class, WebSecurityConfig.class, AuthEntryPointJwt.class, RateLimitFilter.class, RateLimitProperties.class,
        BrowserGuardFilter.class, BrowserGuardProperties.class, PageRequestFactory.class,
        CryptoService.class, EncryptedResponseAdvice.class})
@TestPropertySource(properties = {
        "frontend.urls=https://trackhire.vercel.app,http://localhost:5173",
        "jwt.secret=dGVzdHNlY3JldHRlc3RzZWNyZXR0ZXN0c2VjcmV0dGVzdDEyMzQ=",
        "jwt.expiration=86400000",
        "app.crypto.enabled=true",
        // 32 zero bytes, base64 — deterministic test key.
        "app.crypto.key=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
        "app.ratelimit.enabled=true",
        "app.browser-guard.enabled=true",
        "app.browser-guard.protected-prefixes=/api/jobs,/api/companies",
        "app.browser-guard.blocked-agent-tokens=curl,python-requests",
        "app.pagination.max-size=50",
})
class EncryptedResponseAdviceTest {

    private static final String CHROME =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
    private static final String ORIGIN = "http://localhost:5173";

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private CryptoService cryptoService;
    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean private JobService jobService;
    @MockitoBean private InternJobsService internJobsService;
    @MockitoBean private FulltimeJobsService fulltimeJobsService;
    @MockitoBean private ForYouService forYouService;
    @MockitoBean private SecurityUtil securityUtil;
    @MockitoBean private CustomUserDetailsService userDetailsService;
    @MockitoBean private JwtUtil jwtUtil;
    @MockitoBean private RedisRateLimiter rateLimiter;
    // @EnableJpaAuditing on the application class drags a JPA mapping context into
    // every web slice; this stands in for it so the slice needs no database.
    @MockitoBean private JpaMetamodelMappingContext jpaMappingContext;

    private Page<JobDTO> page;

    @BeforeEach
    void setUp() {
        JobDTO job = JobDTO.builder()
                .id(42L)
                .externalId("adzuna-42")
                .company("Acme")
                .title("Backend Engineer")
                .location("Remote")
                .employmentType(Job.EmploymentType.FULL_TIME)
                .isRemote(true)
                .minSalary(1_200_000)
                .maxSalary(1_800_000)
                .postedAt(LocalDateTime.of(2026, 9, 1, 10, 30))
                .isActive(true)
                .build();

        Pageable pageable = PageRequest.of(0, 20);
        page = new PageImpl<>(List.of(job), pageable, 137);

        when(rateLimiter.consume(anyString(), anyInt(), any(Duration.class)))
                .thenReturn(new RedisRateLimiter.Decision(true, 120, 119, 60));
        when(jobService.filterJobs(any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any(), any()))
                .thenReturn(page);
        when(jobService.searchJobs(any(), any(), any())).thenReturn(page);
    }

    private MvcResult call(String path) throws Exception {
        return mockMvc.perform(get(path)
                        .header("User-Agent", CHROME)
                        .header("Origin", ORIGIN))
                .andReturn();
    }

    @Test
    @WithMockUser
    void wrapsAnnotatedEndpointsInAnEnvelope() throws Exception {
        String body = call("/api/jobs/filter").getResponse().getContentAsString();

        EncryptedPayload payload = objectMapper.readValue(body, EncryptedPayload.class);
        assertTrue(payload.encrypted());
        assertEquals(1, payload.v());
        assertFalse(body.contains("Backend Engineer"), "the job title must not appear in the clear");
    }

    @Test
    @WithMockUser
    void encryptedBodyMatchesThePlaintextEndpointExactly() throws Exception {
        // /jobs/search is not annotated, so its body is exactly what the message
        // converter produces — the shape the frontend has always received.
        String plaintext = call("/api/jobs/search?keywords=backend").getResponse().getContentAsString();

        String decrypted = cryptoService.decrypt(
                objectMapper.readValue(call("/api/jobs/filter").getResponse().getContentAsString(), EncryptedPayload.class));

        assertEquals(plaintext, decrypted,
                "encryption must not change the JSON shape the UI parses");
        assertTrue(decrypted.contains("Backend Engineer"));
    }

    @Test
    @WithMockUser
    void leavesUnannotatedEndpointsInTheClear() throws Exception {
        String body = call("/api/jobs/search?keywords=backend").getResponse().getContentAsString();
        assertTrue(body.contains("Backend Engineer"));
        assertFalse(body.contains("\"encrypted\":true"));
    }

    @Test
    @WithMockUser
    void marksEncryptedResponsesWithAHeader() throws Exception {
        assertEquals("1", call("/api/jobs/filter").getResponse().getHeader("X-Encrypted"));
    }
}
