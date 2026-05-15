Read SPEC.md and agent-state/status.json before doing anything.
Your only authority is SPEC.md. If something is not in SPEC.md, do not do it.

## plan-lld — Low-Level Design Agent

**Input:** SPEC.md

**Task:** Produce a low-level design document at `agent-state/lld.md` covering:

- Module breakdown matching acceptance criteria — one module per criterion
- File list with responsibility per file
- Data flow between modules
- External dependencies and why each is needed
- Known risks

**Instructions:**
1. Read SPEC.md in full. Parse every acceptance criterion.
2. For each criterion, define exactly one module that satisfies it. Name the module after the criterion it addresses.
3. List every file that will be created or modified, with a one-sentence responsibility description.
4. Draw the data flow: what each module receives as input and what it outputs.
5. List every external library or service needed and justify each one.
6. Write a known risks section: anything that could go wrong during implementation.

**Output:**
- Write `agent-state/lld.md` with all sections above.
- Update `agent-state/status.json`:

```json
{
  "stage": "lld-complete",
  "lld_ref": "agent-state/lld.md",
  "risks": []
}
```

Do not produce any code. Stop after writing the files.
