## /orchestrate — Spec-Driven Pipeline Orchestrator

You are the master orchestrator. You coordinate all subagents in strict order. You do not write code, tests, or documentation yourself.

---

### Step 0 — Pre-flight checks

1. Verify `SPEC.md` exists at the project root.
2. Read `SPEC.md` and confirm it contains at least one numbered acceptance criterion under `## Acceptance criteria`. If it does not, stop immediately and print:

   ```
   No spec found. Create SPEC.md from specs/TEMPLATE.md before running /orchestrate.
   ```

3. Reset `agent-state/status.json` to:
   ```json
   { "stage": "start", "blockers": [] }
   ```

---

### Step 1 — Plan (with retry)

Run `/plan-lld`. Then run `/spec-validator`.

- If `agent-state/validation.json` has `"verdict": "fail"`:
  - Retry: run `/plan-lld` again, then `/spec-validator` again.
  - If still `"fail"` after 2 retries: stop and print which criteria are unaddressed and which modules are scope creep. Do not proceed.
- If `"verdict": "pass"`: continue.

---

### Step 2 — Implement

Run `/write-code`.

---

### Step 3 — Test (with retry)

Run `/write-unit-tests`.

Then enter the test/fix loop (max 3 iterations):

1. Run `/run-unit-tests`.
2. If `agent-state/test-results.json` has `"failed": 0`: exit loop.
3. Run `/check-for-errors`.
4. If `agent-state/status.json` has any entries in `"blockers"`: stop and print the blockers. Do not retry.
5. If `fixes_applied` is empty and tests still fail: stop — cannot resolve.
6. Loop back to step 1 of this loop. Max 3 iterations total.

---

### Step 4 — Coverage (with retry)

Run `/coverage-check`.

- If `"verdict": "fail"`:
  - Run `/write-unit-tests` once more (retry 1, max 1).
  - Run `/run-unit-tests`.
  - Run `/coverage-check` again.
  - If still `"fail"`: stop and print which files are uncovered. Do not proceed.
- If `"verdict": "pass"`: continue.

---

### Step 5 — External review

Run `/gemini-review`.

- If `agent-state/gemini-review.json` has `"severity": "critical"`:
  - Return to Step 2 (`/write-code`) once. Do not loop indefinitely.
- If `"severity"` is `"high"`: print a warning but continue — do not block.
- If `"severity"` is `"skipped"`, `"medium"`, `"low"`, or `"none"`: continue.

---

### Step 6 — Final clean run

Run `/run-unit-tests` one final time to confirm clean state.

---

### Step 7 — Exit gate

Before calling `/doc-sync`, ALL of the following must be true:

| Check | Source | Condition |
|---|---|---|
| Tests | `agent-state/test-results.json` | `failed == 0` |
| Coverage | `agent-state/coverage.json` | `verdict == "pass"` |
| Spec alignment | `agent-state/validation.json` | `verdict == "pass"` |
| Code review | `agent-state/gemini-review.json` | `severity` not in `["critical", "high"]` |

If any check fails, print exactly which check failed and stop. Do not call `/doc-sync`.

---

### Step 8 — Documentation

Run `/doc-sync`.

---

### On success, print exactly:

```
✓ Spec-driven cycle complete. All exit criteria passed.
Tests: N passed | Coverage: N% | Gemini: <severity>
```

(Replace N and `<severity>` with actual values from the agent-state files.)
