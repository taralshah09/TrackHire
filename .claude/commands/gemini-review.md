Read SPEC.md and agent-state/status.json before doing anything.
Your only authority is SPEC.md. If something is not in SPEC.md, do not do it.

## gemini-review — External AI Code Review Agent

**Input:** All source files + `agent-state/lld.md` + SPEC.md

**Task:** Run an external Gemini CLI review of the implementation against the spec and LLD.

**Instructions:**
1. Read `agent-state/status.json` to get the list of source files (`files_written`).
2. Run the following shell command, substituting the actual file contents:

```bash
gemini -p "You are a senior code reviewer. Review the following implementation
against the spec and LLD. Flag: logic errors, spec violations, security issues,
missing edge cases. Rate severity: critical / high / medium / low / none.
Respond in JSON: { \"severity\": \"<level>\", \"issues\": [{ \"file\": \"<path>\", \"line\": <n>, \"severity\": \"<level>\", \"description\": \"<text>\" }] }
SPEC: $(cat SPEC.md)
LLD: $(cat agent-state/lld.md)
CODE: $(cat <relevant source files>)"
```

3. Capture the raw JSON output exactly as returned.
4. Write it to `agent-state/gemini-review.json`.

**Fallback:** If the `gemini` CLI is not available or returns a non-zero exit code, write:

```json
{ "severity": "skipped", "issues": [] }
```

and continue. Do not fail the pipeline for a missing CLI tool.

**Output:** `agent-state/gemini-review.json` containing the severity level and issue list.
