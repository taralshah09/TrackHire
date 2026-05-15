# Feature: Job Bookmark Toggle

## Problem statement

Users currently have no way to save jobs they want to revisit later. They must manually remember or re-search for positions they found interesting. We need a bookmark toggle so users can save and un-save jobs from any listing view.

## Acceptance criteria

1. Authenticated users can bookmark a job by calling `POST /api/jobs/{id}/bookmark`. The response returns `{ bookmarked: true }`.
2. Authenticated users can un-bookmark a job by calling `DELETE /api/jobs/{id}/bookmark`. The response returns `{ bookmarked: false }`.
3. Calling `GET /api/jobs/bookmarks` returns a paginated list (page/size params) of the calling user's bookmarked jobs, ordered by bookmark creation time descending.
4. Bookmarking a job that is already bookmarked returns `409 Conflict` with body `{ error: "already_bookmarked" }`.
5. Un-bookmarking a job that is not bookmarked returns `404 Not Found` with body `{ error: "bookmark_not_found" }`.
6. Unauthenticated requests to any bookmark endpoint return `401 Unauthorized`.

## Out of scope

- Bookmark folders or tags
- Sharing bookmarks with other users
- Bookmark count shown to other users (privacy)
- Email notifications about bookmarked jobs

## Data contracts

### API endpoints

```
POST /api/jobs/{id}/bookmark
Headers: Authorization: Bearer <token>
Request:  (empty body)
Response 200: { "bookmarked": true, "jobId": "<id>", "bookmarkedAt": "<ISO8601>" }
Response 409: { "error": "already_bookmarked" }
Response 401: { "error": "unauthorized" }

DELETE /api/jobs/{id}/bookmark
Headers: Authorization: Bearer <token>
Request:  (empty body)
Response 200: { "bookmarked": false, "jobId": "<id>" }
Response 404: { "error": "bookmark_not_found" }
Response 401: { "error": "unauthorized" }

GET /api/jobs/bookmarks?page=0&size=20
Headers: Authorization: Bearer <token>
Response 200: {
  "content": [ <Job objects> ],
  "page": 0,
  "size": 20,
  "totalElements": 42,
  "totalPages": 3
}
Response 401: { "error": "unauthorized" }
```

### JPA Entity

```java
@Entity
@Table(name = "job_bookmarks")
class JobBookmark {
  Long id;
  Long userId;
  Long jobId;
  Instant bookmarkedAt;
}
```

## Non-functional requirements

- Coverage threshold: 85%
- Bookmark operations must complete within 200ms at p95 under normal load.
- The `job_bookmarks` table must have a unique index on `(user_id, job_id)` to enforce the 409 at the DB level.
- No caching on bookmark endpoints — results must always reflect current state.

## Open questions

- Should bookmarks survive job deletion? (Assumption: soft-delete bookmark record, job row stays.)
- Which job table(s) do bookmarks reference — `jobs`, `intern_jobs`, or `fulltime_jobs`? (Assumption: all three via a polymorphic `job_type` discriminator column.)
