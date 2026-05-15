Read SPEC.md and agent-state/status.json before doing anything.
Your only authority is SPEC.md. If something is not in SPEC.md, do not do it.

## check-for-errors — Error Analysis and Fix Agent

**Input:** `agent-state/test-results.json` + source files + `agent-state/lld.md`

**Task:** For each failure, diagnose root cause and apply minimal in-scope fixes.

**Instructions:**
1. Read `agent-state/test-results.json`. If `failed` is 0, write status and stop — nothing to do.
2. For each failure in `errors`:
   a. Identify the root cause: logic error, missing edge case, wrong assumption, or missing implementation.
   b. Read the relevant source file(s) to understand the current state.
   c. Check `agent-state/lld.md` to verify the fix is within scope of what was planned.
   d. **If in scope:** Apply the minimal fix to the source file. Record it in `fixes_applied`.
   e. **If out of scope:** Add an entry to `blockers` in `agent-state/status.json` and stop immediately. Do not guess or over-engineer.
3. Apply fixes one at a time. Do not refactor unrelated code.
4. Do not re-run tests. The orchestrator will re-trigger `/run-unit-tests`.
5. Do not modify SPEC.md or test files.

**Output:** Update `agent-state/status.json`:

```json
{
  "stage": "errors-checked",
  "fixes_applied": [
    { "file": "path/to/file", "description": "one-line description of fix" }
  ],
  "blockers": []
}
```
