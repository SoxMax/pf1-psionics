Add mechanical automation (augments and optionally a buff) to one or more psionic powers.

The argument can be a power name, a file path, or a discipline name to batch-process.

- `/automate-power "Energy Ray"` — single power by name
- `/automate-power packs-source/powers/psychokinesis.wv2tB7DsEYZGDsBW/energy-ray.nQrXRrV10cQ2s39s.yaml` — single power by path
- `/automate-power telepathy` — every non-automated power in that discipline

## What this command does

It is a thin batch-and-dispatch wrapper. The schema, augment patterns, buff template, audit checklist, and fix rules all live in the `author-power` skill (`.claude/skills/author-power/SKILL.md`). Invoke that skill (Skill tool, `skill: author-power`) for every power processed.

## Steps

1. **Resolve `$ARGUMENTS` to a list of power YAML files.**
   - If the argument is a discipline name (e.g. `telepathy`), find every YAML in `packs-source/powers/<discipline>.<id>/` whose action(s) do **not** already contain an `augments:` key with at least one entry. These are the candidates.
   - If the argument is a power name, locate the matching YAML across `packs-source/powers/`. If multiple match, ask the user which one.
   - If the argument is a path, use it directly.

2. **For each candidate power, invoke the `author-power` skill** with instructions to:
   - Operate in **Mode A.5–A.6** (decide automation tier, add augments, author the companion buff if Tier 2+).
   - Skip Mode A.1–A.4 (the power already exists; do **not** rewrite identity, top-level metadata, or `description.value`).
   - Run the relevant audit checks from the skill before declaring done.
   - Surface anything the skill flags as a discrepancy or risk.

3. **Compile once after the batch**: `npm run packs:compile`. Foundry must be closed.

4. **Report**: per power, what tier was applied, whether a buff was created, and any items the skill could not automate (with reasons).

## Boundaries

- Batch ergonomics (discovery, looping, single compile at the end) live here.
- Schema, exemplars, augment shape, `@PsionicApply` syntax, buff structure, change targets, audit checklist, and verification rules live in `author-power`. Do **not** duplicate them in this command — read them from the skill.
- For new powers from scratch, prefer `/scrape-power <url>` (then `author-power` audit) over this command.
- For a deep audit/fix without adding automation, invoke `author-power` directly.
