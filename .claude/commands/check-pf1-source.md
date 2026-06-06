Look up PF1 system source code to answer an architectural question.

Use the PF1 system MCP server (pf1-system) to read source files from the PF1 system codebase. The PF1 source is a FoundryVTT game system for Pathfinder 1e.

Key files to reference based on common questions:
- **Spell/Power data model**: `module/models/item/spell-model.mjs`
- **Action item model**: `module/models/item/action-item-model.mjs`
- **Action component**: `module/components/action.mjs`
- **Item document**: `module/documents/item/item-pf.mjs`
- **Actor document**: `module/documents/actor/actor-pf.mjs`
- **Spellbook logic**: `module/documents/actor/utils/spellbook.mjs`
- **Action use system**: `module/action-use/action-use.mjs`
- **Config**: `module/config.mjs`
- **Data fields**: `module/models/fields/`
- **Applications**: `module/applications/`

Based on "$ARGUMENTS", identify which PF1 source files are relevant, read them using the MCP filesystem tools, and summarize the relevant architecture, patterns, and data structures. Focus on details that would inform pf1-psionics module development.
