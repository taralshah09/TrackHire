# Interview Preparation Document Generator Prompt

You are helping me prepare for technical interviews based on the project already open in the current workspace.

Your task is to deeply analyze the entire project codebase, architecture, folder structure, APIs, infrastructure, configs, database models, and implementation details, then generate a COMPLETE interview preparation document in Markdown format.

The goal is to prepare me to confidently explain and defend the project during backend/software engineering/system design interviews.

---

# Instructions

Analyze the FULL project and produce a structured markdown document containing:

- technical architecture
- business problem
- design decisions
- scalability considerations
- tradeoffs
- APIs
- database schema
- processing flows
- reliability
- deployment
- testing
- security
- performance optimizations
- bottlenecks
- future improvements
- interview questions and answers

Do NOT give shallow summaries.

I want:
- deep technical reasoning
- production-level explanations
- interview-ready talking points
- realistic tradeoffs
- implementation-level details

Assume the interviewer may ask:
- “Why did you design it this way?”
- “What breaks at scale?”
- “How would you improve this?”
- “Why this database?”
- “Why this architecture?”
- “How is consistency handled?”
- “How are failures handled?”
- “What were the biggest challenges?”

The output should help me answer those questions confidently.

---

# Required Output Structure

# 1. Executive Summary

Include:
- what the project does
- target users
- core problem solved
- business value
- key technologies used

---

# 2. High-Level Architecture

Explain:
- frontend architecture
- backend architecture
- service boundaries
- infrastructure
- request lifecycle
- communication patterns
- synchronous vs asynchronous flows

Generate:
- architecture explanation
- textual system flow
- component responsibilities

Also include:
- strengths of this architecture
- weaknesses
- scalability concerns
- possible alternatives

---

# 3. Folder Structure Breakdown

Explain:
- major directories
- responsibility of each module
- layering strategy
- separation of concerns
- dependency flow

Identify:
- architectural patterns used
- anti-patterns if any
- coupling issues
- maintainability concerns

---

# 4. Database Design

Extract and explain:
- all schemas/models/entities
- relationships
- indexes
- constraints
- normalization strategy
- denormalization if present

For each important table/model explain:
- purpose
- why fields exist
- scaling implications
- query patterns

Also explain:
- why this database choice makes sense
- limitations
- future scaling concerns

Generate:
- ERD-style textual explanation

---

# 5. API Design

Document:
- major endpoints
- request/response patterns
- authentication
- authorization
- validation
- error handling
- pagination
- versioning strategy

Explain:
- REST/GraphQL/gRPC decisions
- idempotency handling
- retry behavior
- API security concerns

For important APIs:
- explain request lifecycle internally

---

# 6. Core Processing Logic

Identify and explain:
- critical business workflows
- processing pipelines
- state transitions
- background jobs
- queue handling
- caching logic
- event handling

For each major workflow:
- explain step-by-step execution
- identify bottlenecks
- identify race conditions
- identify failure points
- explain recovery behavior

---

# 7. Authentication & Security

Explain:
- auth flow
- token/session handling
- password handling
- encryption
- RBAC/permissions
- input validation
- secret management

Identify:
- vulnerabilities
- security weaknesses
- improvements

---

# 8. Scalability Analysis

Analyze:
- horizontal scaling capability
- database bottlenecks
- CPU bottlenecks
- memory bottlenecks
- I/O bottlenecks
- network bottlenecks

Explain:
- what breaks at 10x traffic
- what breaks at 100x traffic
- scaling roadmap

Discuss:
- caching opportunities
- queueing opportunities
- sharding possibilities
- CDN opportunities
- async processing opportunities

---

# 9. Performance Optimization

Identify:
- expensive operations
- slow queries
- N+1 query problems
- unnecessary computations
- memory inefficiencies

Explain:
- current optimizations
- missing optimizations
- realistic production improvements

Estimate:
- likely high-latency areas

---

# 10. Reliability & Fault Tolerance

Explain:
- retry mechanisms
- timeout handling
- graceful degradation
- circuit breakers
- dead-letter queues
- logging
- monitoring
- observability

Identify:
- single points of failure
- recovery limitations
- resilience weaknesses

---

# 11. Concurrency & Distributed Systems Concerns

Analyze:
- race conditions
- transactional integrity
- eventual consistency
- locking
- duplicate processing
- idempotency

Explain:
- consistency model
- failure scenarios
- distributed systems tradeoffs

---

# 12. Testing Strategy

Document:
- unit testing
- integration testing
- end-to-end testing
- mocking strategy
- coverage gaps

Explain:
- what should be tested more
- production-risk areas

---

# 13. Deployment & DevOps

Explain:
- deployment flow
- CI/CD
- environment management
- Docker/Kubernetes setup
- infrastructure setup
- rollback strategy

Analyze:
- operational complexity
- deployment risks

---

# 14. Observability

Explain:
- logging strategy
- monitoring strategy
- tracing
- metrics
- alerting

Identify:
- blind spots
- debugging difficulties

---

# 15. Tradeoffs & Design Decisions

For every major architectural choice explain:
- why it was likely chosen
- alternatives
- pros
- cons
- interview-ready reasoning

Examples:
- SQL vs NoSQL
- monolith vs microservices
- sync vs async
- polling vs events
- cache vs DB reads

This section should be VERY detailed.

---

# 16. Production Readiness Assessment

Evaluate:
- how production-ready the project is
- missing enterprise features
- security concerns
- operational risks
- maintainability risks

Assign:
- strengths
- weaknesses
- technical debt

---

# 17. Future Improvements

Generate:
- short-term improvements
- medium-term improvements
- enterprise-scale improvements

Prioritize:
- impact
- complexity

---

# 18. Interview Questions & Answers

Generate:
- likely interviewer questions
- strong sample answers

Include:
- architecture questions
- scaling questions
- database questions
- tradeoff questions
- failure scenario questions
- optimization questions
- behavioral ownership questions

For each answer:
- make it concise but technically strong

---

# 19. Personal Contribution Framing

Help me explain:
- ownership
- technical decisions
- leadership
- debugging
- optimization work
- difficult challenges solved

Generate:
- strong interview phrasing

---

# 20. One-Minute, Five-Minute, and Deep-Dive Explanations

Generate:
- a 1-minute summary
- a 5-minute walkthrough
- a deep technical walkthrough

These should sound natural in interviews.

---

# Output Requirements

- Output EVERYTHING as a single markdown document
- Use proper markdown headings
- Use bullet points heavily
- Use diagrams in text form where useful
- Be highly technical
- Be brutally honest about weaknesses
- Infer architecture from actual code
- Do not hallucinate nonexistent components
- If something is unclear, explicitly state assumptions
- Prioritize implementation reality over theory

The final document should feel like:
- a senior engineer’s project review
- combined with a system design interview prep guide
- combined with production readiness analysis