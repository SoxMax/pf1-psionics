---
name: author-power
description: Write, audit, or fix a psionic power YAML (and its optional companion buff) in packs-source/. Use when the user asks to author a new power, review a power, fix a power, port a power from the wiki, or check a high-level power against the conventions established by the hand-coded level 0–2 powers. Also use for the buff side (packs-source/buffs/powers.9ybKxaq2jUL8O8NW/) when the buff is tied to a power via @PsionicApply.
user-invocable: true
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - WebFetch
---

# author-power — Write, Audit, and Fix Psionic Powers

A psionic power is a YAML item file under `packs-source/powers/<discipline>.<folder-id>/<slug>.<16-char-id>.yaml`. Some powers also have a companion **buff** under `packs-source/buffs/powers.9ybKxaq2jUL8O8NW/<slug>.<16-char-id>.yaml`, applied at runtime via the `@PsionicApply` enricher. Together they describe the rules text, the action mechanics (range / duration / save / damage), the PP cost, the augment options, and any persistent on-actor effect.

This skill teaches you to:
1. **Write** a new power from a source URL or a description.
2. **Audit** a power against the conventions of the hand-coded level 0–2 powers (the trusted reference set).
3. **Fix** a broken or incomplete power without changing its identity (`_id`, `_key`, filename).
4. **Author / audit / fix the companion buff** when the power applies a numeric on-actor effect.

Augment automation patterns are documented in detail in `docs/power-automation-reference.md` — read it before doing buff or augment work. This SKILL focuses on the *whole* YAML, including everything that file already covers and everything around it.

---

## Trusted reference set

When in doubt, pattern-match against the hand-coded level 0–2 powers. They are correct.

Good exemplars to read before authoring:

| Pattern | File |
|---|---|
| Self-buff, dismiss, augment + buff | `packs-source/powers/psychokinesis.wv2tB7DsEYZGDsBW/ablative-armor.H2gR4z7RYfmdlC47.yaml` |
| Save-or-suck, concentration, multiple augments | `packs-source/powers/telepathy.vmC9cd7m69t9cDF3/brain-lock.QeWfHtINq28BM3RS.yaml` |
| Swift-action movement buff | `packs-source/powers/psychoportation.6Bkw9brK1X0cgxHD/burst.eGEBJOwcb4BwlGm4.yaml` |
| Detection + concentration + augment-flips-duration | `packs-source/powers/clairsentience.zLApB2FfLIaP0Z63/detect-psionics.6Z0JRDul58kVdB2H.yaml` |
| Multi-action energy ray (one action per energy type) | `packs-source/powers/psychokinesis.wv2tB7DsEYZGDsBW/energy-splash.gIiiwwPb6fMecoIK.yaml` |
| Multi-action melee touch + damage augment | `packs-source/powers/psychokinesis.wv2tB7DsEYZGDsBW/energy-touch.MwCxBNw8M25RTILG.yaml` |
| Area save power | `packs-source/powers/psychokinesis.wv2tB7DsEYZGDsBW/blanketing-assault.krofgHRRl7o7Gd7B.yaml` |

Companion buffs to read:

| Pattern | File |
|---|---|
| Numeric change with augment scaling | `packs-source/buffs/powers.9ybKxaq2jUL8O8NW/burst.wK2mbancnx8hwdTF.yaml` |
| ContextNote (DR, can't be a numeric change) | `packs-source/buffs/powers.9ybKxaq2jUL8O8NW/biofeedback.c5Fut7112ULaoguM.yaml` |
| Fixed (no augment scaling) | `packs-source/buffs/powers.9ybKxaq2jUL8O8NW/distract.0cIQyvzzh7MVyo3n.yaml` |
| Multiple changes + scriptCall macro | `packs-source/buffs/powers.9ybKxaq2jUL8O8NW/compression.uSvCB6DvADQFqnyD.yaml` |

Read at least one exemplar of the same shape before authoring. Patterns drift if you guess from memory.

---

## Workflow

### Mode A — Write a new power

1. Get the source. If the user gives a `metzo.miraheze.org` URL, prefer running the scraper first: `cd tools/scrapers && node powers-scraper.mjs "<url>"`. Then this skill audits/fixes the result. If the user gives only a name and description, hand-author it.
2. Pick the **discipline directory** by name; the folder id after the dot is the directory's name. Do **not** invent a new folder id. Discipline must be exactly one of: `athanatism`, `clairsentience`, `metacreativity`, `psychokinesis`, `psychometabolism`, `psychoportation`, `telepathy`.
3. Pick a 16-character alphanumeric `_id`. Set `_key: '!items!<same-id>'`. Filename is `<slug>.<id>.yaml`.
4. Fill the schema (see "Power schema" below) using the closest exemplar from the trusted set as a template.
5. Decide automation tier per `docs/power-automation-reference.md`:
   - **Tier 1**: augments only, no buff (damage/summon/narrative).
   - **Tier 2**: augments + buff (numeric on-actor effect).
   - **Tier 3**: augments + buff + macro (temp HP, size change).
6. **Extract augment text** from `description.value`. The wiki convention is `<strong>Augment:</strong>` followed by the options. Each "for every N additional power points" or "if you spend N additional power points" becomes one entry in `augments[]`. If the description has no `<strong>Augment:</strong>` line, see "No-augments powers" below.
7. If Tier 2+, author the companion buff (see "Buff schema") and add `@PsionicApply[...]` to the action's `notes.footer`.
8. Compile and verify (see "Verify").

### Mode B — Audit an existing power

1. Read the power YAML.
2. Run the **audit checklist** below (Power + Buff if `@PsionicApply` is present).
3. If `flags.pf1-psionics.sourceUrl` exists, `WebFetch` it and compare: name, level, discipline, descriptors, components, range, duration, save, target, augment text. Report discrepancies.
4. If `learnedAt.class` lists levels that conflict with the source's class progression table, flag it.
5. Report findings; do **not** edit unless asked.

### Mode C — Fix a power

1. Audit first (Mode B) so the user sees what's broken.
2. Apply the smallest possible edits with the `Edit` tool. **Never** change `_id`, `_key`, or the filename ID. Never rewrite `description.value` (it's the source-of-truth rules text) unless the user explicitly authorized it.
3. If the fix needs a new buff, author it (Mode A.6).
4. Verify (see "Verify").

---

## Power schema (the YAML you write)

Field locations are dictated by `scripts/dataModels/item/power-model.mjs` and the PF1 Action schema. Range / duration / target / save / damage live **inside an action object**, not at the system root.

### Top-level

```yaml
_id: <16-char-alphanum>          # MUST match _key and filename id
_key: '!items!<same-id>'
_stats:
  coreVersion: '13.351'
flags:
  pf1-psionics:
    sourceUrl: <wiki-url>        # Optional but strongly preferred — enables audits
folder: <discipline-folder-id>   # The id segment of the parent directory name
img: <foundry-icon-path>         # See tools/docs/AVAILABLE-ICONS.md
name: <Power Name>               # Title Case
type: pf1-psionics.power         # Always exactly this — namespaced
system:
  ...                            # See below
```

### `system` (the data model)

```yaml
system:
  description:
    value: >-                    # HTML. The rules text. Treat as source of truth.
      <p>...</p>
      <p><strong>Augment:</strong> ...</p>
  discipline: psychokinesis      # one of the seven; lowercase
  subdiscipline:                 # optional; lowercase strings, e.g. ['compulsion']
    - charm
  descriptors:                   # optional; lowercase, e.g. ['mind-affecting', 'force']
    - mind-affecting
  level: 1                       # integer 0..9
  manifestTime:
    units: standard              # standard|swift|immediate|move|full|round|minute|hour
    value: 1
  display:                       # ALL FIVE keys must be present (booleans). Default false.
    auditory: false
    material: false
    mental: false
    olfactory: false
    visual: false
  learnedAt:
    class:                       # Map of class slug (lowercase, spaces preserved) -> level
      psion: 1
      wilder: 1
      psychic warrior: 1
  sources:                       # Array of book attributions
    - date: '2013-12-24'
      pages: '197'
      publisher: Dreamscarred Press
      title: Ultimate Psionics
  sr: true                       # Power Resistance applies. Default true. Set false when text says No.
  uses:
    autoDeductChargesCost: max(0, @sl * 2 - 1)   # Standard PP cost: 1 at L1, 3 at L2, ... 17 at L9.
  known: false                   # Always false on compendium powers
  prepared: false                # Always false on compendium powers
  filePathFields:
    img:
      - IMAGE
  htmlFields:
    - description.value
  actions:                       # See "Actions" below — at least one
    - ...
```

### Actions

Each entry in `system.actions` is an Action object. Range, duration, target, save, and damage all live here, **never** on `system` directly. Use multiple actions when the power has distinct sub-modes (different energy types, different targets, etc. — see `energy-splash` and `energy-touch`).

```yaml
actions:
  - _id: <16-char-alphanum>      # Unique per action
    name: Use                    # Or "Cold", "Fire", etc. for multi-action powers
    actionType: other            # See "actionType" table below
    img: <icon-path>             # Usually the same as the power's img
    activation:
      cost: 1
      type: standard             # MUST match system.manifestTime.units
      unchained:
        cost: 1
        type: nonaction
    ammo:
      type: none
    range:
      units: personal            # See "range.units" table
      value: Personal            # Human-readable label, e.g. "Close (25 ft. + 5 ft./2 levels)"
    duration:
      units: minute              # See PF1-Duration-Units-Reference.md (singular forms)
      value: '@cl'               # Formula in roll data; quote if it starts with @ or contains specials
      dismiss: true              # Optional; for "(D)" durations
      concentration: true        # Optional; pair with `units: conc`
    target:
      value: You                 # Human text. e.g. "One creature", "One humanoid"
    area: 10 ft. radius burst centered on target   # Optional; only when the power has an area
    save:
      type: will                 # fort|ref|will   (omit field entirely for "save: None")
      description: Will negates  # Always set; "None" if no save
      harmless: false            # Set true for harmless save lines
    damage:                      # Only for actions that deal damage
      parts:
        - formula: 1d6+@cl
          types:
            - fire
    powerAttack:
      critMultiplier: 1
      damageBonus: 2
    naturalAttack:               # Only on natural-attack-style actions
      primary: true
      secondary:
        damageMult: 0.5
    augments: []                 # See "Augments"; see docs/power-automation-reference.md
    notes:
      footer:
        - '@PsionicApply[BuffName;level=@cl;dFlags.augmentBonus=@augments.amplify]'
      effect: []                 # Per-attack effect notes
```

#### `actionType` (drives system behavior)

| Value | Use for |
|---|---|
| `other` | Self-buff, manipulation, anything without an attack roll or save |
| `spellsave` | Save-or-X powers (no attack) |
| `rsak` | Ranged spell attack ("ray") |
| `msak` | Melee spell attack ("touch") |
| `rwak` / `mwak` | Ranged/melee weapon attack (rare for powers) |
| `heal` | Healing |

#### `range.units` (drives range computation)

| Value | Meaning |
|---|---|
| `personal` | Self only |
| `touch` | Touch |
| `close` | Close (25 ft. + 5 ft./2 levels) |
| `medium` | Medium (100 ft. + 10 ft./level) |
| `long` | Long (400 ft. + 40 ft./level) |
| `ft` | Fixed distance — `value` is the number of feet |
| `mi` | Miles |
| `unl` / `unlimited` | Unlimited |
| `spec` | "Special; see text" |

When `units: ft`, set `value` to the integer foot count (e.g. `'60'`). For the named ranges, set `value` to a human-readable label like `Close (25 ft. + 5 ft./2 levels)`.

#### `duration.units`

Singular forms only — see `tools/docs/PF1-Duration-Units-Reference.md`. Common: `inst`, `round`, `minute`, `hour`, `day`, `perm`, `conc`, `spec`, `seeText`. For concentration, set `units: conc` AND `concentration: true`.

#### Power point cost

Always `system.uses.autoDeductChargesCost: max(0, @sl * 2 - 1)`. This produces 1 PP at level 1, 3 at 2, 5 at 3, … 17 at 9, and 0 at level 0. Do not deviate without a documented reason.

### Augments

Augments live inside the action's `augments` array. Each augment defines a way to spend extra PP. The `tag` is auto-generated from `name` (lowercase, alphanum-only) and is referenced in formulas as `@augments.<tag>`.

For full augment patterns (Amplify, Damage, DC, Range, Targets, Duration, Swift, conditions) see `docs/power-automation-reference.md`. Skeleton:

```yaml
augments:
  - _id: <16-char-alphanum>
    name: Amplify
    cost: 2                  # PP per purchase
    maxUses: null            # null = unlimited; integer = max purchases
    requiresFocus: false
    img: <icon>              # Defaults to the power's img if omitted
    effects: {}              # Optional structured: damageBonus, dcBonus, clBonus, durationMultiplier, damageMult
    effectNotes: []          # Per-attack lines
    footerNotes: []          # Chat footer lines, e.g. ['+[[@augments.targets]] additional targets']
```

When the augment must drive on-actor state, route it through a buff via `@PsionicApply` (see below) — **don't** try to put `changes` directly on the power.

#### Naming conventions

Use these names verbatim so power-to-buff linkage and grader heuristics stay predictable. Tags are auto-derived (lowercase, alphanum-only): `Amplify` → `@augments.amplify`, `Swift Action` → `@augments.swiftAction`.

| Name | When |
|---|---|
| `Amplify` | Generic "more of the same effect" (most common scaling augment) |
| `Damage` | Additional damage dice |
| `DC` | Increased save DC |
| `Range` | Range increase |
| `Targets` | Additional targets |
| `Duration` | Extended duration |
| `Swift` | Manifest as a swift action for extra PP |
| descriptive (`Blind`, `Prone`, `Nauseate`, `Broader Creature Types I`, …) | Unique per-power effects |

#### Cost mapping from source text

The `cost` field is the literal "for every N additional power points" number from the rules text:

- "for every 2 additional power points you spend" → `cost: 2`, `maxUses: null`
- "if you spend 4 additional power points" → `cost: 4`, `maxUses: 1`
- "you may expend your psionic focus" → `requiresFocus: true`

`maxUses: null` for unlimited stacking, an integer for a hard cap (most "if you spend N" augments are `maxUses: 1`).

#### No-augments powers

Some powers have no `<strong>Augment:</strong>` section in their rules text. They still can warrant a companion buff if the power grants a clean, fixed numeric on-actor effect that PF1's change system can model — examples: `Toughen` (+1 natural armor), `Distract` (-4 to two skills), `Fortify, Lesser` (+1 saves). In these cases create the buff with `changes` that use literal formulas (no `@item.dFlags.augmentBonus`) and emit `@PsionicApply[BuffName;level=@cl]` (no dFlags).

If the power has no augments **and** no automatable numeric effect, leave it Tier 1 with no buff and report why.

---

## `@PsionicApply` (linking a power to its buff)

In the action's `notes.footer`, add an enricher that creates/updates the buff on the manifesting actor at chat-time:

```yaml
notes:
  footer:
    - '@PsionicApply[<BuffName>;level=@cl;dFlags.augmentBonus=@augments.amplify]'
```

Rules:
- `<BuffName>` is matched by **name** in the `pf1-psionics.buffs` compendium. It must equal the buff's `name` field exactly.
- `level=<formula>` sets the buff's `system.level`. Almost always `@cl`.
- `dFlags.<name>=<formula>` sets `system.flags.dictionary.<name>` on the buff. Reference inside the buff via `@item.dFlags.<name>`.
- `bFlags.<name>` sets a boolean dictionary flag.
- `vars=target` switches the formula's roll context to each target actor (rare).
- Quote the entire footer entry in YAML (it starts with `@`).

Multi-flag examples:

```yaml
- '@PsionicApply[Compression;level=@cl;dFlags.augmentBonus=@augments.amplify;dFlags.augmentDuration=ifelse(@augments.duration, 10, 1)]'
- '@PsionicApply[Claws of the Beast;level=@cl;dFlags.augmentBonus=@augments.damage+@augments.expensiveDamage]'
```

---

## Buff schema (`packs-source/buffs/powers.9ybKxaq2jUL8O8NW/`)

A companion buff is a `type: buff` item that holds the on-actor effect. The folder id is always `9ybKxaq2jUL8O8NW`. Filename: `<slug>.<16-char-id>.yaml`.

```yaml
_id: <16-char-alphanum>
_key: '!items!<same-id>'
_stats:
  coreVersion: '13.351'
folder: 9ybKxaq2jUL8O8NW
img: <same-icon-as-power>
name: <Power Name>             # MUST match the @PsionicApply name on the power
type: buff
system:
  active: false                # Always false on compendium template
  subType: spell               # Always spell
  level: 1                     # Default; overridden by level=@cl at apply time
  hideFromToken: false
  showInQuickbar: false
  changeFlags:                 # ALL nine keys must be present, default false
    heavyArmorFullSpeed: false
    immuneToMorale: false
    loseDexToAC: false
    lowLightVision: false
    mediumArmorFullSpeed: false
    noHeavyEncumbrance: false
    noMediumEncumbrance: false
    seeInDarkness: false
    seeInvisibility: false     # NOTE: existing files use `seeInvisibility` (no second 'In')
  changes:                     # Numeric bonuses PF1 can apply automatically
    - _id: <8-char-alphanum>
      formula: 4 + @item.dFlags.augmentBonus
      operator: add            # Almost always add
      priority: 0
      target: aac              # Change target — see docs/power-automation-reference.md
      type: enh                # Bonus type — see docs/power-automation-reference.md
  contextNotes:                # Situational/un-automatable text bonuses
    - target: ac
      text: DR [[2 + @item.dFlags.augmentBonus]]/-
  duration:
    end: turnStart
    units: minute              # round|minute|hour
    value: '@item.level'       # Or '@item.level * 10', or with augment multiplier
  flags:
    dictionary:
      augmentBonus: '0'        # Default for any dFlag the power sets via @PsionicApply
  description:
    value: >-
      <p>@UUID[Compendium.pf1-psionics.powers.Item.<power-id>]{Power Name}</p>
      <p>+[[4 + @item.dFlags.augmentBonus]] armor bonus to AC</p>
  scriptCalls: []              # Tier 3 only — see docs/power-automation-reference.md
```

For change targets / change types / formula patterns / context-note targets / scriptCalls (Tier 3) — read `docs/power-automation-reference.md`. It has the full tables.

### Buff naming and uniqueness

The buff's `name` is the join key. Two powers may both apply the same buff (e.g. multi-augment composition), but one power's `@PsionicApply[X]` will not find a buff named `Lesser X`. Match exactly, including punctuation.

When a power has multiple distinct on-actor effects that should toggle independently, create multiple buffs (e.g. `Elongate Extremities (Arms)` and `Elongate Extremities (Legs)`) and emit two `@PsionicApply` lines.

---

## Audit checklist

Run these checks on every power. Use `Read` first — never edit blind.

### Identity

- [ ] `_id`, `_key`, and the filename's id segment all match.
- [ ] `_key` is exactly `'!items!<id>'`.
- [ ] `type: pf1-psionics.power`.
- [ ] `folder` equals the parent directory's id segment.
- [ ] `_stats.coreVersion: '13.351'`.

### System metadata

- [ ] `discipline` is one of the seven valid values.
- [ ] `subdiscipline` (if present) is an array of lowercase strings.
- [ ] `descriptors` (if present) is an array of lowercase strings.
- [ ] `level` is an integer 0..9.
- [ ] `manifestTime.units` matches every action's `activation.type`.
- [ ] All five `display` booleans are present.
- [ ] `learnedAt.class` keys are lowercase class slugs; values are non-negative integers.
- [ ] `sr` is set deliberately (default true; false only if rules text says "Power Resistance: No").
- [ ] `uses.autoDeductChargesCost: max(0, @sl * 2 - 1)` unless rules require otherwise.
- [ ] `sources` has at least one entry.

### Actions

- [ ] At least one action.
- [ ] Each action has a unique `_id`.
- [ ] `actionType` is appropriate (see table).
- [ ] `range.units` is a valid token; `value` is a sensible human label (or integer-foot for `units: ft`).
- [ ] `duration.units` uses **singular** forms; `concentration: true` paired with `units: conc`.
- [ ] `target.value` present; `area` set when an area is involved.
- [ ] `save.description` always set; `save.type` (`fort`/`ref`/`will`) only when there is a save.
- [ ] `damage.parts[].formula` parses; `types` listed for damaging actions.
- [ ] `notes.footer` quoted (starts with `@`).

### Augments

- [ ] Each augment has a unique 16-char `_id`.
- [ ] `cost` matches the source text's "for every N additional power points".
- [ ] `maxUses` is `null` for unlimited or the correct integer.
- [ ] `requiresFocus: true` only if source says "expend your psionic focus".
- [ ] `effects.damageBonus`/`dcBonus`/`clBonus`/`durationMultiplier`/`damageMult` used only when the system can apply them automatically.
- [ ] `footerNotes` for human-readable narrative; `effectNotes` for per-attack lines.
- [ ] If the augment drives on-actor changes, the action's `notes.footer` includes a matching `@PsionicApply` and the buff exists.

### Companion buff (when `@PsionicApply` is present)

- [ ] A buff exists in `packs-source/buffs/powers.9ybKxaq2jUL8O8NW/` with `name` matching the `@PsionicApply` ident exactly.
- [ ] `folder: 9ybKxaq2jUL8O8NW`, `subType: spell`, `type: buff`, `active: false`.
- [ ] All nine `changeFlags` keys present.
- [ ] Every dFlag referenced in the buff (`@item.dFlags.X`) is set by `@PsionicApply` AND has a default in `flags.dictionary`.
- [ ] Every change has `_id`, `formula`, `target`, `type`. Quote any formula starting with `-`.
- [ ] `description.value` includes a `@UUID[Compendium.pf1-psionics.powers.Item.<power-id>]{Power Name}` link AND an inline-roll preview of the effect.
- [ ] `duration.units` is one of `round`/`minute`/`hour`; `value` formula uses `@item.level` (and `@item.dFlags.augmentDuration` when applicable).
- [ ] No duplicate buff for the same power (search by name).

### Source fidelity (when `flags.pf1-psionics.sourceUrl` is present)

- [ ] `WebFetch` the URL and compare: name, level, discipline, descriptors, components, range, duration, save, target, augment text. Report any mismatch — do not silently "correct" the source.

---

## Common bugs found in the higher-level (less-trusted) powers

When auditing a high-level power, look for these specifically. They are the recurring drift patterns:

1. **`activation.type` ≠ `manifestTime.units`** — the scraper sometimes set them inconsistently.
2. **Plural duration units** (`rounds`, `minutes`) instead of the singular forms PF1 expects.
3. **Missing `display` booleans** — the schema requires all five even if all are false.
4. **`save.type` set when the power has no save** — drop the `type` field, keep `description: None`.
5. **`range.value` is a number when `units` is named** (or a label when `units: ft`).
6. **Missing `concentration: true`** with `duration.units: conc`, or vice versa.
7. **Augment text in description not reflected in `augments[]`** — the rules text mentions an augment but no augment object exists.
8. **`@PsionicApply[...]` references a buff name that doesn't exist** in the buffs pack — typo or buff was never authored.
9. **Buff change formula references a `dFlag`** that the power's `@PsionicApply` never sets — the change silently evaluates to the default.
10. **Buff name has trailing whitespace** that breaks the `@PsionicApply` lookup.
11. **`changeFlags.seeInvisibility` vs `seeInInvisibility`** — both spellings exist in the wild; existing buff YAMLs use `seeInvisibility` (one `In`). Match what the file already has when editing; for new buffs follow the existing exemplars verbatim.
12. **Multi-action powers** missing per-action `tag` fields when actions need to be addressable from formulas (see `energy-splash`).
13. **`uses.autoDeductChargesCost`** changed to a fixed integer for a level >0 power.
14. **`learnedAt.class`** values that contradict the official progression table for a class.

---

## Verify

After any write or edit:

1. **Re-read** the modified file(s).
2. **Compile**: `npm run packs:compile`. This validates YAML and loads it into LevelDB. Resolve any compile errors before declaring done. (Foundry must be closed — LevelDB is single-process.)
3. If a buff was added or changed: re-read the buff and the linked power side-by-side, confirm:
   - Names match between `@PsionicApply[...]` and `buff.name`.
   - Every `@item.dFlags.X` in the buff is set by the power AND defaulted in `buff.system.flags.dictionary`.
   - The `@UUID[...]` in the buff's description points to the correct power id.
4. If `flags.pf1-psionics.sourceUrl` is present, do a final source diff (Mode B step 3).
5. Report what changed and what could not be verified (e.g. UI behavior — say so explicitly rather than claiming success).

---

## Hard rules

- **Never** change `_id`, `_key`, or the filename id of an existing power or buff. They are referenced by saved actor data.
- **Never** rewrite `description.value` — it is the source-of-truth rules text. Fix wrappers around it instead.
- **Never** invent a discipline; use one of the seven.
- **Never** put range / duration / target / save on `system` directly — they live inside an action.
- **Never** use plural duration units.
- **Never** declare success without compiling.
- **Always** quote YAML strings starting with `@` or `-`.
- **Always** read at least one trusted exemplar of the same shape before writing.
- **Always** consult `docs/power-automation-reference.md` for augment / buff change / scriptCall details — this skill points at it deliberately rather than duplicating it.
- **ID widths**: power `_id`, action `_id`, augment `_id`, buff `_id`, macro `_id` are **16 alphanumeric characters**. Buff `changes[]._id` and `scriptCalls[]._id` are **8 alphanumeric characters**. Conditional and modifier `_id`s within action `conditionals` are free-form alphanumeric strings — match the surrounding file's convention. Existing IDs in any file: never change.

---

## Related

- `docs/power-automation-reference.md` — full augment / buff change-target / formula-pattern reference.
- `tools/docs/PF1-Duration-Units-Reference.md` — duration unit values.
- `tools/docs/AVAILABLE-ICONS.md` — Foundry icons.
- `/scrape-power <url>` — pull a fresh draft from the wiki (then audit it with this skill).
- `/review-power-yaml <name>` — light correctness check (this skill is the deeper version).
- `/automate-power <name>` — adds augments + buff to a power that has none (this skill covers writing them from scratch and auditing the result).
- `/validate-packs` — compile + spot-check.
