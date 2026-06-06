Validate the compendium pack source files and compile them.

Steps:
1. Run `npm run packs:compile` and check for errors
2. Spot-check a sample of YAML files from each pack type:
   - Read 2-3 files from `packs-source/powers/` (from different discipline subdirectories)
   - Read 1-2 files from `packs-source/feats/`
   - Read 1-2 files from `packs-source/classes/`
3. For each sampled power YAML, verify:
   - Has `_id` and `_key` fields
   - Has `name` field
   - Has `system.discipline` set to a valid discipline
   - Has at least one action in `system.actions` array
   - Actions have `range`, `duration`, and `activation` fields
   - `img` path points to a valid Foundry icon
4. Report any issues found, grouped by pack type
5. Report total file counts per pack directory