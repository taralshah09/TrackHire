Read SPEC.md and agent-state/status.json before doing anything.
Your only authority is SPEC.md. If something is not in SPEC.md, do not do it.

## write-unit-tests — Test Writing Agent

**Input:** SPEC.md + `agent-state/lld.md` + source files listed in `agent-state/status.json`

**Task:** Write unit tests that directly correspond to the acceptance criteria in SPEC.md.

**Instructions:**
1. Read every numbered acceptance criterion in SPEC.md.
2. For each criterion, write at least one test that proves it passes or fails in a binary, deterministic way.
3. At the top of every test file, add a comment:
   ```
   # Tests acceptance criterion N: <exact criterion text>
   ```
   (Use the comment syntax appropriate to the language.)
4. Read CLAUDE.md for the test runner command. Tests must be runnable with that single command.
5. Cover happy path AND the most likely failure path for each criterion.
6. Do not alter any source files. Tests only.
7. Do not modify SPEC.md.

**Output:** Test files + update `agent-state/status.json`:

```json
{
  "stage": "tests-written",
  "test_files": ["path/to/test1", "path/to/test2"]
}
```
