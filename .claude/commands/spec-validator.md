Read SPEC.md and agent-state/status.json before doing anything.
Your only authority is SPEC.md. If something is not in SPEC.md, do not do it.

## spec-validator — Spec/LLD Alignment Agent

**Input:** SPEC.md + `agent-state/lld.md`

**Task:** Validate that the LLD fully covers the spec and introduces no scope creep.

**Instructions:**
1. Read every numbered acceptance criterion in SPEC.md.
2. For each criterion, search `agent-state/lld.md` for the corresponding module or data contract.
   - If found: mark as addressed.
   - If not found: add to `unaddressed_criteria`.
3. Read every module defined in `agent-state/lld.md`.
4. For each module, verify it maps to at least one acceptance criterion in SPEC.md.
   - If no criterion maps to it: add to `scope_creep`.
5. Set `verdict` to `"pass"` only if both lists are empty. Otherwise set `"fail"`.

**Output:** Write `agent-state/validation.json`:

```json
{
  "unaddressed_criteria": [],
  "scope_creep": [],
  "verdict": "pass|fail"
}
```

If `verdict` is `"fail"`, stop immediately. Do not proceed. The orchestrator will re-trigger `/plan-lld`.
