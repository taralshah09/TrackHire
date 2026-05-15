Read SPEC.md and agent-state/status.json before doing anything.
Your only authority is SPEC.md. If something is not in SPEC.md, do not do it.

## doc-sync — Documentation Sync Agent

**Input:** SPEC.md + source files + `agent-state/`

**Task:** Synchronize documentation with the completed implementation. Logic changes are forbidden.

**Instructions:**
1. **Append to SPEC.md** — add an `## Implementation notes` section at the end with:
   - A 2–3 sentence summary of what was built.
   - The list of files written (from `agent-state/status.json`).
   - Any deviations from the original spec (if any).

2. **Update inline docs** — for every public function, class, or interface in the source files:
   - Add or update a docstring/JSDoc comment describing what it does, its parameters, and return value.
   - One short line is enough. No multi-paragraph essays.
   - Do not document private/internal functions unless they are non-obvious.

3. **Append a CHANGELOG entry** — look for a `CHANGELOG.md` at the project root. If it exists, prepend:
   ```
   ## [<date>] <feature name from SPEC.md>
   <one-line summary of what was added>
   ```
   If no CHANGELOG.md exists, create one with this entry.

4. **Final status update** — update `agent-state/status.json`:

```json
{
  "stage": "complete"
}
```

Do not modify any logic. Documentation and comments only. If you find a bug while reading the code, record it in `agent-state/status.json` under `"doc_sync_findings"` — do not fix it.
