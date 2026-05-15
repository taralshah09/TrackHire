Read SPEC.md and agent-state/status.json before doing anything.
Your only authority is SPEC.md. If something is not in SPEC.md, do not do it.

## run-unit-tests — Test Runner Agent

**Input:** Test files listed in `agent-state/status.json` under `test_files`

**Task:** Execute the full test suite and record results. Do not fix anything.

**Instructions:**
1. Read `agent-state/status.json` to get the list of test files.
2. Read CLAUDE.md for the test runner command.
3. Run the test suite using the command from CLAUDE.md. Capture all stdout and stderr completely.
4. Parse the output for:
   - Number of tests passed
   - Number of tests failed
   - Any error messages or stack traces
   - Code coverage percentage (if the test runner reports it)
5. Write the raw output verbatim — do not summarize or truncate.
6. Do not attempt to fix any failures. Do not modify source files. Do not modify test files.

**Output:** Write `agent-state/test-results.json`:

```json
{
  "passed": 0,
  "failed": 0,
  "errors": [],
  "coverage_pct": 0,
  "raw_output": "..."
}
```
