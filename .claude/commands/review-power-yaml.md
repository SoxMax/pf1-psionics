Review a power YAML file for correctness and completeness.

The argument should be a power name or path (e.g., `/review-power-yaml crystal-shard` or `/review-power-yaml packs-source/powers/psychokinesis.../crystal-shard.yaml`).

Steps:
1. Find the YAML file matching "$ARGUMENTS" in `packs-source/powers/`
2. Read the file contents
3. Check against these requirements:
   - **Required fields**: `_id`, `_key`, `name`, `folder`, `img`, `system.discipline`, `system.description.value`
   - **Discipline**: Must be one of: athanatism, clairsentience, metacreativity, psychokinesis, psychometabolism, psychoportation, telepathy
   - **Display components**: `system.display` should have boolean fields for: auditory, material, mental, olfactory, visual
   - **Actions**: `system.actions` array should have at least one action with:
     - `activation.type` (standard, swift, move, full, round, minute, hour, etc.)
     - `range.units` (close, medium, long, personal, touch, ft, mi, etc.)
     - `range.value` (human-readable description)
     - `duration.units` (see `tools/docs/PF1-Duration-Units-Reference.md`)
   - **Save** (if applicable): `save.type` (will, ref, fort) and `save.dc` formula
   - **Icon**: `img` should use an appropriate Foundry icon (see `tools/docs/AVAILABLE-ICONS.md`)
   - **Description**: HTML description should not be empty
4. Read the source URL from `flags.pf1-psionics.sourceUrl` if present
5. If the source URL exists, fetch it and compare the key fields (name, discipline, level, description) against the scraped data
6. Report any discrepancies or missing fields