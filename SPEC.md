# Feature: Smart Job Discovery (Natural Language Search)

## Problem statement

Currently, users must navigate through multiple dropdowns and input fields (role, location, salary range, job type) to filter the 10,000+ job listings. This manual process is tedious and can lead to users missing relevant opportunities if they don't apply the "perfect" combination of filters. 

The desired behavior is a "concierge-like" experience where a user can type a simple sentence—like "Find me SDE-1 roles in Bangalore with a salary above 15 LPA posted today"—and receive precisely filtered results instantly.

## Acceptance criteria

1. **Natural Language Input**: A floating chat widget is available on the job feed page for users to enter queries.
2. **LLM Parsing**: The system successfully extracts structured filter parameters (Title, Location, Min Salary, Remote status, etc.) from the natural language string using an LLM.
3. **Accurate Results**: The search results returned match the extracted parameters against the `jobs` database.
4. **Graceful Fallback**: If no jobs match the specific criteria, the system suggests the "closest" matches or asks for clarification.
5. **Interactive Feedback**: The chatbot displays the "parsed filters" to the user (e.g., "Searching for: Role: SDE-1 | Location: Bangalore | Salary > 15L") so the user can verify the system's understanding.
6. **Premium UI**: The chat interface uses glassmorphism, smooth animations (Framer Motion), and clear typography.

## Out of scope

- Direct application to jobs via the chat interface (this will remain a manual step for now).
- Resume upload/parsing within the chat (reserved for a future "Profile Optimization" feature).
- Real-time web scraping for jobs not already in the database.

## Data contracts

### API endpoints

#### POST /api/v1/chat/search
**Request Body:**
```json
{
  "query": "Find me remote React developer roles with 20+ LPA salary"
}
```

**Response Body:**
```json
{
  "summary": "Found 12 remote React developer roles with salary over 20 LPA.",
  "parsedFilters": {
    "title": "React developer",
    "location": null,
    "minSalary": 2000000,
    "isRemote": true
  },
  "jobs": [
    {
      "id": 101,
      "title": "Senior React Developer",
      "company": "TechCorp",
      "location": "Remote",
      "maxSalary": 2500000,
      "postedAt": "2026-05-12T08:00:00"
    }
  ]
}
```

## Non-functional requirements

- **Performance**: The end-to-end response time (LLM processing + Database query) should be under 2.5 seconds.
- **Security**: Chat input must be sanitized to prevent prompt injection or SQL injection.
- **Reliability**: The system should handle LLM API failures by falling back to standard keyword search.
- **Coverage threshold**: 80% unit test coverage for the query parsing logic.

## Open questions

- Which LLM provider to use (Gemini vs OpenAI) based on latency and cost?
- How to handle ambiguous locations (e.g., "Bangalore" vs "Bengaluru") in the database query?
- Should we store chat history for the user, or keep it session-based?
