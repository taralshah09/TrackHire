Read SPEC.md and agent-state/status.json before doing anything.
Your only authority is SPEC.md. If something is not in SPEC.md, do not do it.

## coverage-check — Coverage Threshold Agent

**Input:** `agent-state/test-results.json` + SPEC.md (for threshold)

**Task:** Compare actual coverage against the threshold defined in the spec.

**Instructions:**
1. Read SPEC.md, section "Non-functional requirements". Look for a coverage threshold (e.g. "80% coverage").
2. If no threshold is specified in SPEC.md, default to 80%.
3. Read `agent-state/test-results.json` and extract `coverage_pct`.
4. Compare: if `coverage_pct >= threshold`, verdict is `"pass"`. Otherwise `"fail"`.
5. If verdict is `"fail"`, identify which modules or files are below threshold and list their paths in `uncovered_paths`.
6. Do not write any tests yourself. Do not modify any source files.

**Output:** Write `agent-state/coverage.json`:

```json
{
  "threshold": 80,
  "actual": 0,
  "verdict": "pass|fail",
  "uncovered_paths": []
}
```

If verdict is `"fail"`, list the specific files or modules that need more test coverage. The orchestrator will re-trigger `/write-unit-tests`.
