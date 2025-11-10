# Available Icons Reference

This document catalogs icons available for use by the pf1-psionics module scrapers, including both Foundry VTT base icons and PF1 system-specific icons.

**Last Updated:** November 08, 2025

## Purpose

This reference helps developers and AI agents:
- Select icons that actually exist in Foundry VTT or the PF1 system
- Avoid broken image references
- Find appropriate thematic icons for powers, feats, and classes
- Maintain consistency across the module
- Understand available icon categories and naming conventions

## Icon Sources

### Foundry VTT Base Icons
Path: `icons/` (relative to Foundry data directory)
- Comprehensive set of fantasy RPG icons
- Used by the base Foundry application
- See "Quick Reference: Currently Used Icons" section below

### PF1 System Icons
Path: `systems/pf1/icons/` (relative to Foundry data directory)
- **Total:** 1,635 icons across 8 categories
- PF1-specific artwork optimized for the Pathfinder 1e system
- Should be preferred over base Foundry icons when available for PF1-specific content

**PF1 Icon Categories:**
- **Actions** (18 icons) - Character actions, activities, and general UI elements
- **Conditions** (49 icons) - Status effects (blinded, frightened, stunned, etc.)
- **Feats** (176 icons) - Feat and special ability icons
- **Items** (668 icons) - Equipment, weapons, armor, jewelry, potions
  - `items/armor/` - Armor pieces and shields
  - `items/equipment/` - General equipment and tools
  - `items/inventory/` - Consumables and miscellaneous items
  - `items/jewelry/` - Rings, amulets, and magical accessories
  - `items/potions/` - Potions, elixirs, and liquid items
  - `items/weapons/` - Melee and ranged weapons
- **Misc** (6 icons) - Miscellaneous icons
- **Races** (47 icons) - Race portraits and creature type icons
  - `races/creature-types/` - Animal, aberration, construct, dragon, elemental, fey, humanoid, magical beast, monstrous humanoid, ooze, outsider, plant, undead, vermin
- **Skills** (387 icons) - Skill check and ability icons
- **Spells** (402 icons) - Spell effects categorized by type (beam, burst, enchant, etc.)

## Quick Reference: Currently Used Icons

### Powers Scraper Icons (✅ All Verified)

These icons are currently used by `tools/scrapers/powers-scraper.mjs`:

**Descriptors:**
- Fire: `icons/magic/fire/flame-burning-skull-orange.webp`
- Cold: `icons/magic/water/barrier-ice-crystal-wall-faceted-blue.webp`
- Electricity: `icons/magic/lightning/bolt-strike-blue-white.webp`
- Acid: `icons/magic/unholy/projectile-missile-green.webp`
- Sonic: `icons/magic/sonic/projectile-sound-rings-wave.webp`
- Mind-affecting: `icons/magic/perception/eye-ringed-glow-angry-small-teal.webp`
- Force: `icons/magic/defensive/shield-barrier-glowing-triangle-blue.webp`
- Light: `icons/magic/light/explosion-star-glow-silhouette.webp`
- Darkness: `icons/magic/unholy/orb-glowing-purple.webp`

**Disciplines:**
- Telepathy: `icons/magic/perception/eye-ringed-glow-angry-small-teal.webp`
- Psychokinesis: `icons/magic/unholy/projectile-fireball-green.webp`
- Psychoportation: `icons/magic/movement/trail-streak-zigzag-yellow.webp`
- Metacreativity: `icons/magic/symbols/runes-star-magenta.webp`
- Clairsentience: `icons/magic/perception/third-eye-blue-red.webp`
- Psychometabolism: `icons/magic/life/heart-glowing-red.webp`
- Athanatism: `icons/magic/death/skull-energy-light-purple.webp`

### Feats Scraper Icons (✅ All Verified)

These icons are currently used by `tools/scrapers/feats-scraper.mjs`:

- Psicrystal: `icons/commodities/gems/gem-faceted-diamond-blue.webp`
- Focus/Meditation: `icons/magic/perception/third-eye-blue-red.webp`
- Empower/Maximize: `icons/magic/symbols/runes-triangle-orange.webp`
- Shield/Armor: `icons/equipment/shield/heater-crystal-blue.webp`

## PF1 System Icons Detail

The PF1 system provides 1,635 icons specifically designed for Pathfinder content. These should be preferred over Foundry base icons when scraping PF1-specific content like classes, feats, and powers.

### How to Use PF1 Icons

**Path Format:** `systems/pf1/icons/{category}/{filename}`

**Example:** `systems/pf1/icons/spells/beam-magenta-3.jpg`

### PF1 Spell Icons (Most Relevant for Powers)

The PF1 system includes 402 spell icons organized by visual effect type. These are ideal for psionic powers:

**Naming Convention:** `{effect-type}-{color}-{variant}.jpg`

#### Available Effect Types

1. **Air Burst** - Explosive air effects (3 color variants × 3 levels = 9 icons)
   - Colors: air, jade, magenta, sky
   - Example: `systems/pf1/icons/spells/air-burst-magenta-1.jpg`

2. **Beam** - Ray and beam effects (8 colors × 3 levels = 24 icons)
   - Colors: acid, blue, eerie, jade, magenta, orange, red, royal, sky
   - Example: `systems/pf1/icons/spells/beam-eerie-2.jpg`

3. **Enchant** - Magical enhancement effects (8 colors × 3 levels = 24 icons)
   - Colors: acid, blue, eerie, jade, magenta, orange, red, royal
   - Example: `systems/pf1/icons/spells/enchant-magenta-1.jpg`

4. **Fire Burst** - Fire explosion effects (8 colors × 3 levels)
   - Colors: air, eerie, jade, magenta, orange, red, royal, sky
   - Example: `systems/pf1/icons/spells/fire-burst-red-2.jpg`

5. **Holy Smite** - Divine/radiant effects (7 colors × 3 levels)
   - Colors: acid, air, eerie, orange, red, royal, sky
   - Example: `systems/pf1/icons/spells/holy-smite-eerie-1.jpg`

6. **Lightning Bolt** - Electricity effects (8 colors × 3 levels)
   - Colors: acid, air, blue, eerie, magenta, orange, red, sky
   - Example: `systems/pf1/icons/spells/lightning-bolt-blue-3.jpg`

7. **Missile** - Projectile effects (8 colors × 3 levels)
   - Colors: acid, air, eerie, jade, magenta, red, royal, sky
   - Example: `systems/pf1/icons/spells/missile-magenta-2.jpg`

8. **Shield** - Protective barrier effects (8 colors × 3 levels)
   - Colors: acid, air, eerie, jade, orange, red, royal, sky
   - Example: `systems/pf1/icons/spells/shield-royal-1.jpg`

9. **Snowball** - Cold/ice effects (7 colors × 3 levels)
   - Colors: air, blue, eerie, jade, magenta, royal, sky
   - Example: `systems/pf1/icons/spells/snowball-sky-3.jpg`

10. **Summoning** - Conjuration effects (8 colors × 3 levels)
    - Colors: acid, air, blue, eerie, magenta, orange, red, sky
    - Example: `systems/pf1/icons/spells/summoning-eerie-2.jpg`

#### Recommended Spell Icons for Psionic Disciplines

**Telepathy (Mind-Affecting):**
- `systems/pf1/icons/spells/enchant-eerie-1.jpg` (mental influence)
- `systems/pf1/icons/spells/enchant-magenta-2.jpg` (charm/compulsion)
- `systems/pf1/icons/spells/holy-smite-eerie-1.jpg` (mind blast)

**Psychokinesis (Force/Energy):**
- `systems/pf1/icons/spells/missile-magenta-2.jpg` (force projectiles)
- `systems/pf1/icons/spells/beam-royal-3.jpg` (energy beams)
- `systems/pf1/icons/spells/fire-burst-magenta-2.jpg` (energy explosions)

**Psychoportation (Teleportation):**
- `systems/pf1/icons/spells/summoning-magenta-1.jpg` (teleportation)
- `systems/pf1/icons/spells/air-burst-jade-2.jpg` (dimension door)

**Metacreativity (Creation):**
- `systems/pf1/icons/spells/summoning-sky-2.jpg` (object creation)
- `systems/pf1/icons/spells/shield-jade-1.jpg` (force constructs)

**Clairsentience (Detection):**
- `systems/pf1/icons/spells/enchant-sky-1.jpg` (divination)
- `systems/pf1/icons/spells/holy-smite-sky-2.jpg` (remote viewing)

**Psychometabolism (Body Enhancement):**
- `systems/pf1/icons/spells/enchant-orange-2.jpg` (physical enhancement)
- `systems/pf1/icons/spells/shield-orange-1.jpg` (damage reduction)

**Athanatism (Death/Undeath):**
- `systems/pf1/icons/spells/enchant-eerie-3.jpg` (necromantic)
- `systems/pf1/icons/spells/holy-smite-eerie-3.jpg` (death effects)

### PF1 Feat Icons (176 files)

Feat icons are located in `systems/pf1/icons/feats/` and use descriptive filenames.

**Examples:**
- `systems/pf1/icons/feats/combat-reflexes.jpg`
- `systems/pf1/icons/feats/power-attack.jpg`
- `systems/pf1/icons/feats/improved-initiative.jpg`
- `systems/pf1/icons/feats/spell-focus.jpg`

To see all available feat icons:
```bash
ls /home/cobrien/Applications/Foundry/userdata/Data/systems/pf1/icons/feats/
```

### PF1 Skill Icons (387 files)

Skill check icons with numbered variants for different skill types.

**Categories:** affliction, armor, arrow, athletics, buff, construction, debuff, dodge, hands, melee, ranged, stealth, thrown, and more.

**Examples:**
- `systems/pf1/icons/skills/affliction_01.jpg` through `affliction_26.jpg`
- `systems/pf1/icons/skills/melee_01.jpg` through `melee_23.jpg`
- `systems/pf1/icons/skills/magic_01.jpg` through `magic_35.jpg`

### PF1 Condition Icons (49 files)

Status effect icons in both PNG and SVG formats.

**Examples:**
- `systems/pf1/icons/conditions/blinded.png`
- `systems/pf1/icons/conditions/frightened.png`
- `systems/pf1/icons/conditions/stunned.svg`
- `systems/pf1/icons/conditions/paralyzed.png`

### PF1 Race Icons (47 files)

Race portraits and creature type icons.

**Playable Races:**
- `systems/pf1/icons/races/human.jpg`
- `systems/pf1/icons/races/elf.png`
- `systems/pf1/icons/races/dwarf.png`
- `systems/pf1/icons/races/halfling.png`
- Plus many more exotic races

**Creature Types:** (`races/creature-types/` subdirectory)
- `aberration.png`, `animal.png`, `construct.png`, `dragon.png`
- `elemental.png`, `fey.png`, `humanoid.jpg`, `magical-beast.png`
- `monstrous-humanoid.png`, `ooze.jpg`, `outsider.png`, `plant.png`
- `undead.png`, `vermin.png`

### PF1 Item Icons (668 files)

Equipment, weapons, armor, and treasure icons organized by subcategory.

**Subcategories:**
- `systems/pf1/icons/items/armor/` - Armor and shields
- `systems/pf1/icons/items/weapons/` - Weapons of all types
- `systems/pf1/icons/items/jewelry/` - Rings, amulets, magical accessories
- `systems/pf1/icons/items/potions/` - Potions and elixirs
- `systems/pf1/icons/items/equipment/` - Tools and adventuring gear
- `systems/pf1/icons/items/inventory/` - General items and consumables

### Finding the Right PF1 Icon

**Method 1: Browse by Category**
```bash
# List all spell icons
ls systems/pf1/icons/spells/

# List all feat icons
ls systems/pf1/icons/feats/

# List items by subcategory
ls systems/pf1/icons/items/weapons/
```

**Method 2: Search by Keyword**
```bash
# Find icons matching a keyword
find systems/pf1/icons/ -name "*mind*"
find systems/pf1/icons/ -name "*teleport*"
find systems/pf1/icons/ -name "*energy*"
```

**Method 3: Use This Document**
Reference the "Recommended Spell Icons for Psionic Disciplines" section above for curated suggestions.
- Mental/Mind: `icons/magic/perception/eye-ringed-glow-angry-small-teal.webp`
- Body/Physical: `icons/magic/life/heart-glowing-red.webp`
- Weapon: `icons/weapons/swords/greatsword-crossguard-blue.webp`
- Manifesting: `icons/magic/symbols/question-stone-yellow.webp`
- Metapsionic tag: `icons/magic/symbols/runes-carved-stone-purple.webp`
- Psionic tag: `icons/magic/symbols/runes-star-magenta.webp`
- Combat tag: `icons/skills/melee/hand-grip-sword-orange.webp`
- Item Creation tag: `icons/containers/chest/chest-oak-steel-brown.webp`
- Default: `icons/sundries/books/book-embossed-blue.webp`

---

## Icon Categories

### Summary Statistics

| Category | WebP Icons | SVG Icons | Total |
|----------|------------|-----------|-------|
| magic | 1097 | 0 | 1097 |
| skills | 309 | 0 | 309 |
| commodities | 1117 | 0 | 1117 |
| containers | 281 | 0 | 281 |
| equipment | 1064 | 0 | 1064 |
| sundries | 369 | 0 | 369 |
| weapons | 686 | 0 | 686 |
| svg (fallback) | 0 | 118 | 118 |

---

## Detailed Icon Listings

### Magic Icons (For Powers)

High-quality WebP icons organized by magic type. **Use these for powers whenever possible.**

#### magic/acid (18 icons)

```
icons/magic/acid/dissolve-arm-flesh.webp
icons/magic/acid/dissolve-bone-ribs-skull.webp
icons/magic/acid/dissolve-bone-skull.webp
icons/magic/acid/dissolve-bone-white.webp
icons/magic/acid/dissolve-drip-droplet-smoke.webp
icons/magic/acid/dissolve-pool-bubbles.webp
icons/magic/acid/dissolve-vomit-green-brown.webp
icons/magic/acid/orb-bubble-smoke-drip.webp
icons/magic/acid/pouring-gas-smoke-liquid.webp
icons/magic/acid/projectile-beams-salvo-green.webp
icons/magic/acid/projectile-bolts-salvo-green.webp
icons/magic/acid/projectile-faceted-glob.webp
icons/magic/acid/projectile-flame-smoke-green.webp
icons/magic/acid/projectile-glowing-bubbles.webp
icons/magic/acid/projectile-needles-salvo-green.webp
icons/magic/acid/projectile-smoke-glowing.webp
icons/magic/acid/projectile-stream-bubbles.webp
icons/magic/acid/projectiles-trio-salvo.webp
```

#### magic/air (68 icons)

```
icons/magic/air/air-burst-spiral-blue-gray.webp
icons/magic/air/air-burst-spiral-large-blue.webp
icons/magic/air/air-burst-spiral-large-pink.webp
icons/magic/air/air-burst-spiral-large-teal-green.webp
icons/magic/air/air-burst-spiral-large-yellow.webp
icons/magic/air/air-burst-spiral-pink.webp
icons/magic/air/air-burst-spiral-teal-green.webp
icons/magic/air/air-burst-spiral-yellow.webp
icons/magic/air/air-pressure-shield-blue.webp
icons/magic/air/air-smoke-casting.webp
icons/magic/air/air-wave-gust-blue.webp
icons/magic/air/air-wave-gust-smoke-yellow.webp
icons/magic/air/fog-gas-smoke-blue-gray.webp
icons/magic/air/fog-gas-smoke-brown.webp
icons/magic/air/fog-gas-smoke-dense-blue.webp
icons/magic/air/fog-gas-smoke-dense-brown.webp
icons/magic/air/fog-gas-smoke-dense-gray.webp
icons/magic/air/fog-gas-smoke-dense-green.webp
icons/magic/air/fog-gas-smoke-dense-orange.webp
icons/magic/air/fog-gas-smoke-dense-pink.webp
icons/magic/air/fog-gas-smoke-dense-white.webp
icons/magic/air/fog-gas-smoke-gray.webp
icons/magic/air/fog-gas-smoke-green.webp
icons/magic/air/fog-gas-smoke-orange.webp
icons/magic/air/fog-gas-smoke-purple-blue.webp
icons/magic/air/fog-gas-smoke-purple.webp
icons/magic/air/fog-gas-smoke-swirling-blue.webp
icons/magic/air/fog-gas-smoke-swirling-gray.webp
icons/magic/air/fog-gas-smoke-swirling-green.webp
icons/magic/air/fog-gas-smoke-swirling-orange.webp
icons/magic/air/fog-gas-smoke-swirling-pink.webp
icons/magic/air/fog-gas-smoke-swirling-white.webp
icons/magic/air/fog-gas-smoke-swirling-yellow.webp
icons/magic/air/weather-clouds-rainbow.webp
icons/magic/air/weather-clouds-rain.webp
icons/magic/air/weather-clouds-snow.webp
icons/magic/air/weather-clouds-sunlight.webp
icons/magic/air/weather-clouds.webp
icons/magic/air/weather-sunlight-sky.webp
icons/magic/air/weather-wind-gust.webp
icons/magic/air/wind-stream-blue-gray.webp
icons/magic/air/wind-stream-purple-blue.webp
icons/magic/air/wind-stream-purple.webp
icons/magic/air/wind-stream-red.webp
icons/magic/air/wind-swirl-gray-blue.webp
icons/magic/air/wind-swirl-pink-purple.webp
icons/magic/air/wind-swirl-purple-blue.webp
icons/magic/air/wind-swirl-red-orange.webp
icons/magic/air/wind-tornado-cyclone-purple-blue.webp
icons/magic/air/wind-tornado-cyclone-purple-pink.webp
icons/magic/air/wind-tornado-cyclone-red-orange.webp
icons/magic/air/wind-tornado-cyclone-white.webp
icons/magic/air/wind-tornado-funnel-blue-grey.webp
icons/magic/air/wind-tornado-funnel-blue.webp
icons/magic/air/wind-tornado-funnel-damage-blue.webp
icons/magic/air/wind-tornado-funnel-gray.webp
icons/magic/air/wind-tornado-funnel-green.webp
icons/magic/air/wind-tornado-spiral-blue-gray.webp
icons/magic/air/wind-tornado-spiral-brown.webp
icons/magic/air/wind-tornado-spiral-pink-purple.webp
icons/magic/air/wind-tornado-spiral-teal-green.webp
icons/magic/air/wind-tornado-wall-blue.webp
icons/magic/air/wind-vortex-swirl-blue-purple.webp
icons/magic/air/wind-vortex-swirl-blue.webp
icons/magic/air/wind-vortex-swirl-purple.webp
icons/magic/air/wind-vortex-swirl-red.webp
icons/magic/air/wind-weather-sailing-ship.webp
icons/magic/air/wind-weather-snow-gusts.webp
```

#### magic/control (106 icons)

```
icons/magic/control/buff-flight-wings-blue.webp
icons/magic/control/buff-flight-wings-purple.webp
icons/magic/control/buff-flight-wings-red.webp
icons/magic/control/buff-flight-wings-runes-blue.webp
icons/magic/control/buff-flight-wings-runes-blue-white.webp
icons/magic/control/buff-flight-wings-runes-purple-orange.webp
icons/magic/control/buff-flight-wings-runes-purple.webp
icons/magic/control/buff-flight-wings-runes-red.webp
icons/magic/control/buff-flight-wings-runes-red-yellow.webp
icons/magic/control/buff-luck-fortune-clover-green.webp
icons/magic/control/buff-luck-fortune-gold.webp
icons/magic/control/buff-luck-fortune-green-gold.webp
icons/magic/control/buff-luck-fortune-green.webp
icons/magic/control/buff-luck-fortune-rainbow.webp
icons/magic/control/buff-strength-muscle-damage-orange.webp
icons/magic/control/buff-strength-muscle-damage-red.webp
icons/magic/control/buff-strength-muscle-damage.webp
icons/magic/control/control-influence-crown-gold.webp
icons/magic/control/control-influence-crown-yellow.webp
icons/magic/control/control-influence-puppet.webp
icons/magic/control/control-influence-rally-purple.webp
icons/magic/control/debuff-chains-blue.webp
icons/magic/control/debuff-chains-green.webp
icons/magic/control/debuff-chains-orb-movement-blue.webp
icons/magic/control/debuff-chains-purple.webp
icons/magic/control/debuff-chains-red.webp
icons/magic/control/debuff-chains-ropes-blue.webp
icons/magic/control/debuff-chains-ropes-green.webp
icons/magic/control/debuff-chains-ropes-net-green.webp
icons/magic/control/debuff-chains-ropes-net-purple-blue.webp
icons/magic/control/debuff-chains-ropes-net-red-orange.webp
icons/magic/control/debuff-chains-ropes-net-white.webp
icons/magic/control/debuff-chains-ropes-purple.webp
icons/magic/control/debuff-chains-ropes-red.webp
icons/magic/control/debuff-chains-shackle-movement-red.webp
icons/magic/control/debuff-chains-shackles-movement-blue.webp
icons/magic/control/debuff-chains-shackles-movement-purple.webp
icons/magic/control/debuff-energy-hold-blue-yellow.webp
icons/magic/control/debuff-energy-hold-green.webp
icons/magic/control/debuff-energy-hold-levitate-blue-yellow.webp
icons/magic/control/debuff-energy-hold-levitate-green.webp
icons/magic/control/debuff-energy-hold-levitate-pink.webp
icons/magic/control/debuff-energy-hold-levitate-teal-blue.webp
icons/magic/control/debuff-energy-hold-levitate-yellow.webp
icons/magic/control/debuff-energy-hold-pink.webp
icons/magic/control/debuff-energy-hold-teal-blue.webp
icons/magic/control/debuff-energy-hold-yellow.webp
icons/magic/control/debuff-energy-snare-blue.webp
icons/magic/control/debuff-energy-snare-brown.webp
icons/magic/control/debuff-energy-snare-green.webp
icons/magic/control/debuff-energy-snare-purple-blue.webp
icons/magic/control/debuff-energy-snare-purple-pink.webp
icons/magic/control/encase-creature-humanoid-hold.webp
icons/magic/control/encase-creature-monster-hold.webp
icons/magic/control/encase-creature-spider-hold.webp
icons/magic/control/energy-stream-link-blue.webp
icons/magic/control/energy-stream-link-large-blue.webp
icons/magic/control/energy-stream-link-large-orange.webp
icons/magic/control/energy-stream-link-large-teal.webp
icons/magic/control/energy-stream-link-large-white.webp
icons/magic/control/energy-stream-link-orange.webp
icons/magic/control/energy-stream-link-spiral-blue.webp
icons/magic/control/energy-stream-link-spiral-orange.webp
icons/magic/control/energy-stream-link-spiral-teal.webp
icons/magic/control/energy-stream-link-spiral-white.webp
icons/magic/control/energy-stream-link-teal.webp
icons/magic/control/energy-stream-link-white.webp
icons/magic/control/fear-fright-jackolantern-yellow.webp
icons/magic/control/fear-fright-jackolanter-orange.webp
icons/magic/control/fear-fright-mask-orange.webp
icons/magic/control/fear-fright-mask-yellow.webp
icons/magic/control/fear-fright-monster-green.webp
icons/magic/control/fear-fright-monster-grin-green.webp
icons/magic/control/fear-fright-monster-grin-purple-blue.webp
icons/magic/control/fear-fright-monster-grin-red-orange.webp
icons/magic/control/fear-fright-monster-purple-blue.webp
icons/magic/control/fear-fright-monster-red.webp
icons/magic/control/fear-fright-shadow-monster-green.webp
icons/magic/control/fear-fright-shadow-monster-purple.webp
icons/magic/control/fear-fright-shadow-monster-red.webp
icons/magic/control/fear-fright-white.webp
icons/magic/control/hypnosis-mesmerism-eye-tan.webp
icons/magic/control/hypnosis-mesmerism-eye.webp
icons/magic/control/hypnosis-mesmerism-pendulum.webp
icons/magic/control/hypnosis-mesmerism-swirl.webp
icons/magic/control/hypnosis-mesmerism-watch.webp
icons/magic/control/modfiy-luck-fortune-brown.webp
icons/magic/control/modfiy-luck-fortune-gray.webp
icons/magic/control/modfiy-luck-fortune-red.webp
icons/magic/control/mouth-smile-deception-purple.webp
icons/magic/control/orb-web-hold.webp
icons/magic/control/sihouette-hold-beam-green.webp
icons/magic/control/silhouette-aura-energy.webp
icons/magic/control/silhouette-fall-slip-prone.webp
icons/magic/control/silhouette-grow-shrink-blue.webp
icons/magic/control/silhouette-grow-shrink-tan.webp
icons/magic/control/silhouette-hold-beam-blue.webp
icons/magic/control/silhouette-hold-change-blue.webp
icons/magic/control/silhouette-hold-change-green.webp
icons/magic/control/sleep-bubble-purple.webp
icons/magic/control/voodoo-doll-pain-damage-green.webp
icons/magic/control/voodoo-doll-pain-damage-pink.webp
icons/magic/control/voodoo-doll-pain-damage-purple.webp
icons/magic/control/voodoo-doll-pain-damage-red.webp
icons/magic/control/voodoo-doll-pain-damage-tan.webp
icons/magic/control/voodoo-doll-pain-damage-yellow.webp
```

#### magic/death (60 icons)

```
icons/magic/death/blood-corruption-vomit-red.webp
icons/magic/death/bones-crossed-gray.webp
icons/magic/death/bones-crossed-orange.webp
icons/magic/death/gallows-hanged-humanoid.webp
icons/magic/death/grave-tombstone-glow-tan.webp
icons/magic/death/grave-tombstone-glow-teal.webp
icons/magic/death/hand-dirt-undead-zombie.webp
icons/magic/death/hand-undead-skeleton-fire-green.webp
icons/magic/death/hand-undead-skeleton-fire-pink.webp
icons/magic/death/hand-withered-gray.webp
icons/magic/death/mouth-bite-fangs-vampire.webp
icons/magic/death/mouth-teeth-fangs-vampire.webp
icons/magic/death/projectile-skull-animal-green.webp
icons/magic/death/projectile-skull-fire-green.webp
icons/magic/death/projectile-skull-fire-orange-red.webp
icons/magic/death/projectile-skull-fire-orange.webp
icons/magic/death/projectile-skull-fire-purple.webp
icons/magic/death/projectile-skull-flaming-green.webp
icons/magic/death/projectile-skull-flaming-yellow.webp
icons/magic/death/skeleton-bird-skull-gray.webp
icons/magic/death/skeleton-dinosaur-skull-tan.webp
icons/magic/death/skeleton-eye-skull-glow-orange.webp
icons/magic/death/skeleton-fish-teal.webp
icons/magic/death/skeleton-glow-yellow-black.webp
icons/magic/death/skeleton-reptile-while-purple.webp
icons/magic/death/skeleton-skull-soul-blue.webp
icons/magic/death/skeleton-snake-skull-pink.webp
icons/magic/death/skeleton-worn-skull-tan.webp
icons/magic/death/skull-cattle-totem-glow-red.webp
icons/magic/death/skull-energy-light-purple.webp
icons/magic/death/skull-energy-light-white.webp
icons/magic/death/skull-fire-white-yellow.webp
icons/magic/death/skull-flames-white-blue.webp
icons/magic/death/skull-horned-goat-pentagram-red.webp
icons/magic/death/skull-horned-white-purple.webp
icons/magic/death/skull-horned-worn-fire-blue.webp
icons/magic/death/skull-humanoid-crown-white-blue.webp
icons/magic/death/skull-humanoid-white-blue.webp
icons/magic/death/skull-humanoid-white-red.webp
icons/magic/death/skull-humanoid-worn-teal.webp
icons/magic/death/skull-pile-glowing-pink.webp
icons/magic/death/skull-poison-green.webp
icons/magic/death/skull-sand-white-yellow.webp
icons/magic/death/skull-trio-badge-purple.webp
icons/magic/death/skull-weapon-staff-glow-pink.webp
icons/magic/death/undead-bird-skeleton-purple.webp
icons/magic/death/undead-ghost-scream-teal.webp
icons/magic/death/undead-ghost-strike-white.webp
icons/magic/death/undead-ghosts-trio-blue.webp
icons/magic/death/undead-mammal-fire-breath-pink.webp
icons/magic/death/undead-skeleton-deformed-red.webp
icons/magic/death/undead-skeleton-energy-green.webp
icons/magic/death/undead-skeleton-fire-green.webp
icons/magic/death/undead-skeleton-lich-armor.webp
icons/magic/death/undead-skeleton-rags-fire-green.webp
icons/magic/death/undead-skeleton-tusk-purple.webp
icons/magic/death/undead-skeleton-worn-blue.webp
icons/magic/death/undead-zombie-grave-green.webp
icons/magic/death/weapon-scythe-rune-green.webp
icons/magic/death/weapon-sword-skull-purple.webp
```

#### magic/defensive (39 icons)

```
icons/magic/defensive/armor-shield-barrier-steel.webp
icons/magic/defensive/armor-stone-skin.webp
icons/magic/defensive/barrier-shield-dome-blue-purple.webp
icons/magic/defensive/barrier-shield-dome-deflect-blue.webp
icons/magic/defensive/barrier-shield-dome-deflect-teal.webp
icons/magic/defensive/barrier-shield-dome-pink.webp
icons/magic/defensive/illusion-evasion-echo-purple.webp
icons/magic/defensive/shield-barrier-blades-teal.webp
icons/magic/defensive/shield-barrier-blue.webp
icons/magic/defensive/shield-barrier-deflect-gold.webp
icons/magic/defensive/shield-barrier-deflect-teal.webp
icons/magic/defensive/shield-barrier-flaming-diamond-acid.webp
icons/magic/defensive/shield-barrier-flaming-diamond-blue.webp
icons/magic/defensive/shield-barrier-flaming-diamond-blue-yellow.webp
icons/magic/defensive/shield-barrier-flaming-diamond-magenta.webp
icons/magic/defensive/shield-barrier-flaming-diamond-orange.webp
icons/magic/defensive/shield-barrier-flaming-diamond-purple-orange.webp
icons/magic/defensive/shield-barrier-flaming-diamond-red.webp
icons/magic/defensive/shield-barrier-flaming-diamond-teal-purple.webp
icons/magic/defensive/shield-barrier-flaming-diamond-teal.webp
icons/magic/defensive/shield-barrier-flaming-pentagon-blue.webp
icons/magic/defensive/shield-barrier-flaming-pentagon-blue-yellow.webp
icons/magic/defensive/shield-barrier-flaming-pentagon-green.webp
icons/magic/defensive/shield-barrier-flaming-pentagon-magenta.webp
icons/magic/defensive/shield-barrier-flaming-pentagon-orange.webp
icons/magic/defensive/shield-barrier-flaming-pentagon-purple-orange.webp
icons/magic/defensive/shield-barrier-flaming-pentagon-red.webp
icons/magic/defensive/shield-barrier-flaming-pentagon-teal-purple.webp
icons/magic/defensive/shield-barrier-flaming-pentagon-teal.webp
icons/magic/defensive/shield-barrier-glowing-blue.webp
icons/magic/defensive/shield-barrier-glowing-triangle-blue.webp
icons/magic/defensive/shield-barrier-glowing-triangle-blue-yellow.webp
icons/magic/defensive/shield-barrier-glowing-triangle-green.webp
icons/magic/defensive/shield-barrier-glowing-triangle-magenta.webp
icons/magic/defensive/shield-barrier-glowing-triangle-orange.webp
icons/magic/defensive/shield-barrier-glowing-triangle-purple-orange.webp
icons/magic/defensive/shield-barrier-glowing-triangle-red.webp
icons/magic/defensive/shield-barrier-glowing-triangle-teal-purple.webp
icons/magic/defensive/shield-barrier-glowing-triangle-teal.webp
```

#### magic/earth (58 icons)

```
icons/magic/earth/barrier-lava-stone-orange.webp
icons/magic/earth/barrier-stone-brown-green.webp
icons/magic/earth/barrier-stone-explosion-debris.webp
icons/magic/earth/barrier-stone-explosion-red.webp
icons/magic/earth/barrier-stone-explosion-spiked.webp
icons/magic/earth/barrier-stone-pillar-purple.webp
icons/magic/earth/construct-stone-long-arms.webp
icons/magic/earth/construct-stone.webp
icons/magic/earth/explosion-lava-orange.webp
icons/magic/earth/explosion-lava-stone-green.webp
icons/magic/earth/explosion-lava-stone-orange.webp
icons/magic/earth/explosion-lava-stone-red.webp
icons/magic/earth/explosion-lava-stone-yellow-orange.webp
icons/magic/earth/explosion-lava-stone-yellow.webp
icons/magic/earth/lava-explosion-orange.webp
icons/magic/earth/laval-stone-orange.webp
icons/magic/earth/lava-stone-fire-eye.webp
icons/magic/earth/lava-stone-fire-yellow.webp
icons/magic/earth/orb-lava-ball-yellow.webp
icons/magic/earth/orb-lava-orange.webp
icons/magic/earth/orb-ringed-lava-black-orange.webp
icons/magic/earth/orb-stone-smoke-teal.webp
icons/magic/earth/projectile-boulder-debris.webp
icons/magic/earth/projectile-boulder-dust.webp
icons/magic/earth/projectile-boulder-yellow.webp
icons/magic/earth/projectile-moonrock-asteroid.webp
icons/magic/earth/projectile-orb-asteroid-yellow.webp
icons/magic/earth/projectiles-fire-stone-salvo.webp
icons/magic/earth/projectiles-lava-salvo-orange.webp
icons/magic/earth/projectiles-magma-stone-orange.webp
icons/magic/earth/projectile-spiked-stone-boulder-blue.webp
icons/magic/earth/projectile-spiked-stone-boulder-brown.webp
icons/magic/earth/projectile-spiked-stone-boulder-green.webp
icons/magic/earth/projectile-spiked-stone-boulder-orange.webp
icons/magic/earth/projectile-spiked-stone-boulder-purple-yellow.webp
icons/magic/earth/projectiles-stone-salvo-gray.webp
icons/magic/earth/projectiles-stone-salvo-red.webp
icons/magic/earth/projectiles-stone-salvo.webp
icons/magic/earth/projectile-stone-ball-blue.webp
icons/magic/earth/projectile-stone-ball-brown.webp
icons/magic/earth/projectile-stone-ball-green.webp
icons/magic/earth/projectile-stone-ball-orange.webp
icons/magic/earth/projectile-stone-ball-purple.webp
icons/magic/earth/projectile-stone-boulder-blue.webp
icons/magic/earth/projectile-stone-boulder-brown.webp
icons/magic/earth/projectile-stone-boulder-green.webp
icons/magic/earth/projectile-stone-boulder-orange.webp
icons/magic/earth/projectile-stone-boulder-purple.webp
icons/magic/earth/projectile-stone-bullet-pink.webp
icons/magic/earth/projectile-stone-landslide.webp
icons/magic/earth/strike-body-stone-crumble.webp
icons/magic/earth/strike-fist-stone-gray.webp
icons/magic/earth/strike-fist-stone-light.webp
icons/magic/earth/strike-fist-stone.webp
icons/magic/earth/strike-stone-stalactite-blood-red.webp
icons/magic/earth/volcano-explosion-lava-orange.webp
icons/magic/earth/volcano-explosion-lava-teal.webp
icons/magic/earth/volcano-explosion-lava-yellow.webp
```

#### magic/fire (149 icons)

```
icons/magic/fire/barrier-shield-explosion-yellow.webp
icons/magic/fire/barrier-wall-explosion-orange.webp
icons/magic/fire/barrier-wall-flame-ring-blue.webp
icons/magic/fire/barrier-wall-flame-ring-yellow.webp
icons/magic/fire/beam-jet-stream-blue.webp
icons/magic/fire/beam-jet-stream-embers.webp
icons/magic/fire/beam-jet-stream-spiral-yellow.webp
icons/magic/fire/beam-jet-stream-trails-orange.webp
icons/magic/fire/beam-jet-stream-yellow.webp
icons/magic/fire/beam-strike-whip-red.webp
icons/magic/fire/blast-jet-stream-embers-orange.webp
icons/magic/fire/blast-jet-stream-embers-red.webp
icons/magic/fire/blast-jet-stream-embers-yellow.webp
icons/magic/fire/blast-jet-stream-splash.webp
icons/magic/fire/dagger-rune-enchant-blue-gray.webp
icons/magic/fire/dagger-rune-enchant-blue.webp
icons/magic/fire/dagger-rune-enchant-flame-blue.webp
icons/magic/fire/dagger-rune-enchant-flame-blue-yellow.webp
icons/magic/fire/dagger-rune-enchant-flame-green.webp
icons/magic/fire/dagger-rune-enchant-flame-orange.webp
icons/magic/fire/dagger-rune-enchant-flame-purple-orange.webp
icons/magic/fire/dagger-rune-enchant-flame-purple.webp
icons/magic/fire/dagger-rune-enchant-flame-red.webp
icons/magic/fire/dagger-rune-enchant-flame-strong-blue.webp
icons/magic/fire/dagger-rune-enchant-flame-strong-blue-yellow.webp
icons/magic/fire/dagger-rune-enchant-flame-strong-green.webp
icons/magic/fire/dagger-rune-enchant-flame-strong-orange.webp
icons/magic/fire/dagger-rune-enchant-flame-strong-purple-pink.webp
icons/magic/fire/dagger-rune-enchant-flame-strong-purple.webp
icons/magic/fire/dagger-rune-enchant-flame-strong-red.webp
icons/magic/fire/dagger-rune-enchant-flame-strong-teal-purple.webp
icons/magic/fire/dagger-rune-enchant-flame-strong-teal.webp
icons/magic/fire/dagger-rune-enchant-flame-teal-purple.webp
icons/magic/fire/dagger-rune-enchant-flame-teal.webp
icons/magic/fire/dagger-rune-enchant-green.webp
icons/magic/fire/dagger-rune-enchant-orange.webp
icons/magic/fire/dagger-rune-enchant-purple-orange.webp
icons/magic/fire/dagger-rune-enchant-purple.webp
icons/magic/fire/dagger-rune-enchant-red.webp
icons/magic/fire/dagger-rune-enchant-teal-purple.webp
icons/magic/fire/dagger-rune-enchant-teal.webp
icons/magic/fire/elemental-creature-horse.webp
icons/magic/fire/elemental-fire-flying.webp
icons/magic/fire/elemental-fire-humanoid.webp
icons/magic/fire/explosion-embers-evade-silhouette.webp
icons/magic/fire/explosion-embers-orange.webp
icons/magic/fire/explosion-fireball-large-blue.webp
icons/magic/fire/explosion-fireball-large-orange.webp
icons/magic/fire/explosion-fireball-large-purple-orange.webp
icons/magic/fire/explosion-fireball-large-purple-pink.webp
icons/magic/fire/explosion-fireball-large-red-orange.webp
icons/magic/fire/explosion-fireball-medium-blue.webp
icons/magic/fire/explosion-fireball-medium-orange.webp
icons/magic/fire/explosion-fireball-medium-purple-orange.webp
icons/magic/fire/explosion-fireball-medium-purple-pink.webp
icons/magic/fire/explosion-fireball-medium-red-orange.webp
icons/magic/fire/explosion-fireball-small-blue.webp
icons/magic/fire/explosion-fireball-small-orange.webp
icons/magic/fire/explosion-fireball-small-purple-orange.webp
icons/magic/fire/explosion-fireball-small-purple.webp
icons/magic/fire/explosion-fireball-small-red.webp
icons/magic/fire/explosion-flame-blue.webp
icons/magic/fire/explosion-flame-lightning-strike.webp
icons/magic/fire/explosion-mushroom-nuke-orange.webp
icons/magic/fire/explosion-mushroom-nuke-yellow.webp
icons/magic/fire/flame-burning-building.webp
icons/magic/fire/flame-burning-campfire-orange.webp
icons/magic/fire/flame-burning-campfire-red.webp
icons/magic/fire/flame-burning-campfire-rocks.webp
icons/magic/fire/flame-burning-campfire-smoke.webp
icons/magic/fire/flame-burning-campfire-yellow-blue.webp
icons/magic/fire/flame-burning-chain.webp
icons/magic/fire/flame-burning-creature-skeleton.webp
icons/magic/fire/flame-burning-earth-orange.webp
icons/magic/fire/flame-burning-earth-yellow.webp
icons/magic/fire/flame-burning-embers-orange.webp
icons/magic/fire/flame-burning-embers-yellow.webp
icons/magic/fire/flame-burning-eye.webp
icons/magic/fire/flame-burning-fence.webp
icons/magic/fire/flame-burning-fist-strike.webp
icons/magic/fire/flame-burning-hand-orange.webp
icons/magic/fire/flame-burning-hand-purple.webp
icons/magic/fire/flame-burning-hand-white.webp
icons/magic/fire/flame-burning-skeleton-explosion.webp
icons/magic/fire/flame-burning-skull-orange.webp
icons/magic/fire/flame-burning-tree-bush.webp
icons/magic/fire/flame-burning-tree-face.webp
icons/magic/fire/flame-burning-tree-log.webp
icons/magic/fire/flame-burning-tree-stump.webp
icons/magic/fire/flame-burning-yellow-orange.webp
icons/magic/fire/orb-fireball-puzzle.webp
icons/magic/fire/orb-lightning-sun.webp
icons/magic/fire/orbs-silhouette-sun.webp
icons/magic/fire/orb-vortex.webp
icons/magic/fire/projectile-arrow-fire-gem-yellow.webp
icons/magic/fire/projectile-arrow-fire-orange.webp
icons/magic/fire/projectile-arrow-fire-orange-yellow.webp
icons/magic/fire/projectile-arrow-fire-purple.webp
icons/magic/fire/projectile-arrow-fire-red-yellow.webp
icons/magic/fire/projectile-arrow-fire-yellow-orange.webp
icons/magic/fire/projectile-beams-salvo-red.webp
icons/magic/fire/projectile-bolts-salvo-red.webp
icons/magic/fire/projectile-bolt-zigzag-orange.webp
icons/magic/fire/projectile-embers-orange.webp
icons/magic/fire/projectile-feathers-embers-gold.webp
icons/magic/fire/projectile-fireball-blue-purple.webp
icons/magic/fire/projectile-fireball-blue.webp
icons/magic/fire/projectile-fireball-embers-yellow.webp
icons/magic/fire/projectile-fireball-green.webp
icons/magic/fire/projectile-fireball-orange-green.webp
icons/magic/fire/projectile-fireball-orange.webp
icons/magic/fire/projectile-fireball-orange-yellow.webp
icons/magic/fire/projectile-fireball-purple.webp
icons/magic/fire/projectile-fireball-red-yellow.webp
icons/magic/fire/projectile-fireball-smoke-blue.webp
icons/magic/fire/projectile-fireball-smoke-green.webp
icons/magic/fire/projectile-fireball-smoke-large-blue.webp
icons/magic/fire/projectile-fireball-smoke-large-green.webp
icons/magic/fire/projectile-fireball-smoke-large-orange.webp
icons/magic/fire/projectile-fireball-smoke-large-teal.webp
icons/magic/fire/projectile-fireball-smoke-orange-red.webp
icons/magic/fire/projectile-fireball-smoke-orange.webp
icons/magic/fire/projectile-fireball-smoke-strong-blue.webp
icons/magic/fire/projectile-fireball-smoke-strong-green.webp
icons/magic/fire/projectile-fireball-smoke-strong-orange.webp
icons/magic/fire/projectile-fireball-smoke-strong-teal.webp
icons/magic/fire/projectile-fireball-smoke-teal.webp
icons/magic/fire/projectile-fireball-sparks-orange.webp
icons/magic/fire/projectile-flaming-eyeball-red.webp
icons/magic/fire/projectile-meteor-salvo-heavy-blue.webp
icons/magic/fire/projectile-meteor-salvo-heavy-pink.webp
icons/magic/fire/projectile-meteor-salvo-heavy-purple-yellow.webp
icons/magic/fire/projectile-meteor-salvo-heavy-red.webp
icons/magic/fire/projectile-meteor-salvo-heavy-teal.webp
icons/magic/fire/projectile-meteor-salvo-light-blue.webp
icons/magic/fire/projectile-meteor-salvo-light-pink.webp
icons/magic/fire/projectile-meteor-salvo-light-purple.webp
icons/magic/fire/projectile-meteor-salvo-light-red.webp
icons/magic/fire/projectile-meteor-salvo-light-teal.webp
icons/magic/fire/projectile-meteor-salvo-strong-blue.webp
icons/magic/fire/projectile-meteor-salvo-strong-pink.webp
icons/magic/fire/projectile-meteor-salvo-strong-purple-yellow.webp
icons/magic/fire/projectile-meteor-salvo-strong-red.webp
icons/magic/fire/projectile-meteor-salvo-strong-teal.webp
icons/magic/fire/projectile-needles-salvo-red.webp
icons/magic/fire/projectile-smoke-swirl-red.webp
icons/magic/fire/projectiles-salvo-trio-orange.webp
icons/magic/fire/projectile-wave-arrow.webp
icons/magic/fire/projectile-wave-yellow.webp
```

#### magic/holy (14 icons)

```
icons/magic/holy/angel-winged-humanoid-blue.webp
icons/magic/holy/angel-wings-gray.webp
icons/magic/holy/barrier-shield-winged-blue.webp
icons/magic/holy/barrier-shield-winged-cross.webp
icons/magic/holy/chalice-glowing-gold-water.webp
icons/magic/holy/chalice-glowing-gold.webp
icons/magic/holy/chalice-glowing-yellow-blue.webp
icons/magic/holy/meditation-chi-focus-blue.webp
icons/magic/holy/prayer-hands-glowing-yellow-green.webp
icons/magic/holy/prayer-hands-glowing-yellow.webp
icons/magic/holy/prayer-hands-glowing-yellow-white.webp
icons/magic/holy/projectiles-blades-salvo-yellow.webp
icons/magic/holy/saint-glass-portrait-halo.webp
icons/magic/holy/yin-yang-balance-symbol.webp
```

#### magic/light (111 icons)

```
icons/magic/light/beam-deflect-path-yellow.webp
icons/magic/light/beam-explosion-orange.webp
icons/magic/light/beam-explosion-pink-purple.webp
icons/magic/light/beam-horizon-strike-yellow.webp
icons/magic/light/beam-impact-deflect-teal.webp
icons/magic/light/beam-layered-teal.webp
icons/magic/light/beam-rays-blue-large.webp
icons/magic/light/beam-rays-blue-small.webp
icons/magic/light/beam-rays-blue.webp
icons/magic/light/beam-rays-green-large.webp
icons/magic/light/beam-rays-green-small.webp
icons/magic/light/beam-rays-green.webp
icons/magic/light/beam-rays-magenta-large.webp
icons/magic/light/beam-rays-magenta-small.webp
icons/magic/light/beam-rays-magenta.webp
icons/magic/light/beam-rays-orange-large.webp
icons/magic/light/beam-rays-orange-small.webp
icons/magic/light/beam-rays-orange.webp
icons/magic/light/beam-rays-red-large.webp
icons/magic/light/beam-rays-red-small.webp
icons/magic/light/beam-rays-red.webp
icons/magic/light/beam-rays-teal-large.webp
icons/magic/light/beam-rays-teal-purple-large.webp
icons/magic/light/beam-rays-teal-purple-small.webp
icons/magic/light/beam-rays-teal-purple.webp
icons/magic/light/beam-rays-teal-small.webp
icons/magic/light/beam-rays-teal.webp
icons/magic/light/beam-rays-yellow-blue-large.webp
icons/magic/light/beam-rays-yellow-blue-small.webp
icons/magic/light/beam-rays-yellow-blue.webp
icons/magic/light/beam-rays-yellow.webp
icons/magic/light/beam-red-orange.webp
icons/magic/light/beams-explosion-blue.webp
icons/magic/light/beams-rays-orange-purple-large.webp
icons/magic/light/beams-rays-orange-purple-small.webp
icons/magic/light/beams-rays-orange-purple.webp
icons/magic/light/beams-strike-blue.webp
icons/magic/light/beam-strike-orange-gold.webp
icons/magic/light/beam-strike-orange.webp
icons/magic/light/beam-strike-village-yellow.webp
icons/magic/light/circle-window-clock-blue.webp
icons/magic/light/explosion-beam-impact-silhouette.webp
icons/magic/light/explosion-glow-spiral-teal.webp
icons/magic/light/explosion-glow-spiral-yellow.webp
icons/magic/light/explosion-impact-purple.webp
icons/magic/light/explosion-star-blue-large.webp
icons/magic/light/explosion-star-blue-small.webp
icons/magic/light/explosion-star-blue.webp
icons/magic/light/explosion-star-blue-yellow.webp
icons/magic/light/explosion-star-glow-blue-purple.webp
icons/magic/light/explosion-star-glow-blue.webp
icons/magic/light/explosion-star-glow-orange.webp
icons/magic/light/explosion-star-glow-purple.webp
icons/magic/light/explosion-star-glow-silhouette.webp
icons/magic/light/explosion-star-glow-yellow.webp
icons/magic/light/explosion-star-large-blue-yellow.webp
icons/magic/light/explosion-star-large-orange-purple.webp
icons/magic/light/explosion-star-large-orange.webp
icons/magic/light/explosion-star-large-pink.webp
icons/magic/light/explosion-star-large-teal-purple.webp
icons/magic/light/explosion-star-large-teal.webp
icons/magic/light/explosion-star-orange-purple.webp
icons/magic/light/explosion-star-orange.webp
icons/magic/light/explosion-star-pink.webp
icons/magic/light/explosion-star-small-blue-yellow.webp
icons/magic/light/explosion-star-small-orange-purple.webp
icons/magic/light/explosion-star-small-orange.webp
icons/magic/light/explosion-star-small-pink.webp
icons/magic/light/explosion-star-small-teal-purple.webp
icons/magic/light/explosion-star-small-teal.webp
icons/magic/light/explosion-star-teal-purple.webp
icons/magic/light/explosion-star-teal.webp
icons/magic/light/hand-sparks-glow-yellow.webp
icons/magic/light/hand-sparks-smoke-green.webp
icons/magic/light/hand-sparks-smoke-teal.webp
icons/magic/light/light-candles-lit-white.webp
icons/magic/light/light-lantern-lit-white.webp
icons/magic/light/orb-beams-green.webp
icons/magic/light/orb-container-orange.webp
icons/magic/light/orb-hand-green.webp
icons/magic/light/orb-hands-humanoid-yellow.webp
icons/magic/light/orb-lightbulb-gray.webp
icons/magic/light/orbs-firefly-hand-yellow.webp
icons/magic/light/orb-shadow-blue.webp
icons/magic/light/orbs-hand-gray.webp
icons/magic/light/orbs-smoke-pink.webp
icons/magic/light/projectile-beams-salvo-white.webp
icons/magic/light/projectile-beams-salvo-yellow.webp
icons/magic/light/projectile-beam-yellow.webp
icons/magic/light/projectile-bolts-salvo-white.webp
icons/magic/light/projectile-bolts-salvo-yellow.webp
icons/magic/light/projectile-flare-blue.webp
icons/magic/light/projectile-flare-expliosion-yellow.webp
icons/magic/light/projectile-halo-teal.webp
icons/magic/light/projectile-needles-salvo-white.webp
icons/magic/light/projectile-needles-salvo-yellow.webp
icons/magic/light/projectile-smoke-blue-light.webp
icons/magic/light/projectile-smoke-blue.webp
icons/magic/light/projectile-smoke-blue-white.webp
icons/magic/light/projectile-smoke-pink.webp
icons/magic/light/projectile-smoke-yellow.webp
icons/magic/light/projectiles-pink-purple.webp
icons/magic/light/projectiles-salvo-blue.webp
icons/magic/light/projectiles-salvo-teal.webp
icons/magic/light/projectiles-star-purple.webp
icons/magic/light/projectile-stars-blue.webp
icons/magic/light/projectiles-trio-pink.webp
icons/magic/light/swords-light-glowing-white.webp
icons/magic/light/torch-fire-hand-green.webp
icons/magic/light/torch-fire-hand-orange.webp
icons/magic/light/torch-fire-orange.webp
```

#### magic/lightning (73 icons)

```
icons/magic/lightning/barrier-shield-crackling-orb-pink.webp
icons/magic/lightning/barrier-shield-orb-pink.webp
icons/magic/lightning/barrier-wall-shield-gray.webp
icons/magic/lightning/bolt-beam-strike-blue.webp
icons/magic/lightning/bolt-blue.webp
icons/magic/lightning/bolt-cloud-sky-green.webp
icons/magic/lightning/bolt-cloud-sky-white.webp
icons/magic/lightning/bolt-forked-blue.webp
icons/magic/lightning/bolt-forked-blue-yellow.webp
icons/magic/lightning/bolt-forked-green.webp
icons/magic/lightning/bolt-forked-large-blue.webp
icons/magic/lightning/bolt-forked-large-blue-yellow.webp
icons/magic/lightning/bolt-forked-large-green.webp
icons/magic/lightning/bolt-forked-large-magenta.webp
icons/magic/lightning/bolt-forked-large-orange-purple.webp
icons/magic/lightning/bolt-forked-large-orange.webp
icons/magic/lightning/bolt-forked-large-red.webp
icons/magic/lightning/bolt-forked-large-teal-purple.webp
icons/magic/lightning/bolt-forked-large-teal.webp
icons/magic/lightning/bolt-forked-magenta.webp
icons/magic/lightning/bolt-forked-orange-purple.webp
icons/magic/lightning/bolt-forked-orange.webp
icons/magic/lightning/bolt-forked-red.webp
icons/magic/lightning/bolt-forked-teal-purple.webp
icons/magic/lightning/bolt-forked-teal.webp
icons/magic/lightning/bolts-forked-large-blue.webp
icons/magic/lightning/bolts-forked-large-blue-yellow.webp
icons/magic/lightning/bolts-forked-large-green.webp
icons/magic/lightning/bolts-forked-large-magenta.webp
icons/magic/lightning/bolts-forked-large-orange-purple.webp
icons/magic/lightning/bolts-forked-large-orange.webp
icons/magic/lightning/bolts-forked-large-red.webp
icons/magic/lightning/bolts-forked-large-teal-purple.webp
icons/magic/lightning/bolts-forked-large-teal.webp
icons/magic/lightning/bolts-salvo-clouds-sky.webp
icons/magic/lightning/bolts-strike-salvo-blue.webp
icons/magic/lightning/bolt-strike-beam-pink.webp
icons/magic/lightning/bolt-strike-beam-purple.webp
icons/magic/lightning/bolt-strike-beam-yellow.webp
icons/magic/lightning/bolt-strike-blue.webp
icons/magic/lightning/bolt-strike-blue-white.webp
icons/magic/lightning/bolt-strike-cloud-gray.webp
icons/magic/lightning/bolt-strike-clouds-blue.webp
icons/magic/lightning/bolt-strike-creature-pink.webp
icons/magic/lightning/bolt-strike-embers-teal.webp
icons/magic/lightning/bolt-strike-explosion-blue.webp
icons/magic/lightning/bolt-strike-explosion-purple.webp
icons/magic/lightning/bolt-strike-explosion-yellow.webp
icons/magic/lightning/bolt-strike-forked-blue.webp
icons/magic/lightning/bolt-strike-forked-sparks-blue.webp
icons/magic/lightning/bolt-strike-hand-gray.webp
icons/magic/lightning/bolt-strike-pink.webp
icons/magic/lightning/bolt-strike-purple-pink.webp
icons/magic/lightning/bolt-strike-purple.webp
icons/magic/lightning/bolt-strike-smoke-yellow.webp
icons/magic/lightning/bolt-strike-sparks-blue.webp
icons/magic/lightning/bolt-strike-sparks-purple.webp
icons/magic/lightning/bolt-strike-sparks-teal.webp
icons/magic/lightning/bolt-strike-sparks-yellow.webp
icons/magic/lightning/bolt-strike-streak-yellow.webp
icons/magic/lightning/bolt-strike-wide-white.webp
icons/magic/lightning/claws-unarmed-strike-teal.webp
icons/magic/lightning/explosion-stone-smoke-teal.webp
icons/magic/lightning/fist-unarmed-strike-blue-green.webp
icons/magic/lightning/fist-unarmed-strike-blue.webp
icons/magic/lightning/orb-ball-blue.webp
icons/magic/lightning/orb-ball-purple.webp
icons/magic/lightning/orb-ball-spiral-blue.webp
icons/magic/lightning/projectile-orb-blue.webp
icons/magic/lightning/projectiles-tendril-salvo-pink.webp
icons/magic/lightning/projectile-tendrils-red.webp
icons/magic/lightning/projectile-tendrils-teal.webp
icons/magic/lightning/strike-arrow-spear-red.webp
```

#### magic/life (27 icons)

```
icons/magic/life/ankh-gold-blue.webp
icons/magic/life/ankh-shadow-green.webp
icons/magic/life/cross-area-circle-green-white.webp
icons/magic/life/cross-beam-green.webp
icons/magic/life/cross-embers-glow-yellow-purple.webp
icons/magic/life/crosses-trio-red.webp
icons/magic/life/cross-explosion-burst-green.webp
icons/magic/life/cross-flared-green.webp
icons/magic/life/cross-worn-green.webp
icons/magic/life/cross-yellow-green.webp
icons/magic/life/heart-area-circle-red-green.webp
icons/magic/life/heart-broken-red.webp
icons/magic/life/heart-cross-blue.webp
icons/magic/life/heart-cross-green.webp
icons/magic/life/heart-cross-purple-orange.webp
icons/magic/life/heart-cross-strong-blue.webp
icons/magic/life/heart-cross-strong-flame-blue.webp
icons/magic/life/heart-cross-strong-flame-green.webp
icons/magic/life/heart-cross-strong-flame-purple-orange.webp
icons/magic/life/heart-cross-strong-green.webp
icons/magic/life/heart-cross-strong-purple-orange.webp
icons/magic/life/heart-glowing-red.webp
icons/magic/life/heart-hand-gold-green-light.webp
icons/magic/life/heart-hand-gold-green.webp
icons/magic/life/heart-pink.webp
icons/magic/life/heart-red-blue.webp
icons/magic/life/heart-shadow-red.webp
```

#### magic/movement (8 icons)

```
icons/magic/movement/abstract-ribbons-red-orange.webp
icons/magic/movement/chevrons-down-yellow.webp
icons/magic/movement/pinwheel-turning-blue.webp
icons/magic/movement/portal-vortex-orange.webp
icons/magic/movement/trail-streak-impact-blue.webp
icons/magic/movement/trail-streak-pink.webp
icons/magic/movement/trail-streak-zigzag-teal.webp
icons/magic/movement/trail-streak-zigzag-yellow.webp
```

#### magic/nature (125 icons)

```
icons/magic/nature/barrier-shield-wood-vines.webp
icons/magic/nature/beam-hand-leaves-green.webp
icons/magic/nature/cornucopia-orange.webp
icons/magic/nature/dreamcatcher-green.webp
icons/magic/nature/elemental-plant-humanoid.webp
icons/magic/nature/hand-weapon-wood-bark-brown.webp
icons/magic/nature/instrument-recorder-leaves.webp
icons/magic/nature/leaf-armor-scale-green.webp
icons/magic/nature/leaf-armor-scale-worn-green.webp
icons/magic/nature/leaf-arrowheads-glow-green.webp
icons/magic/nature/leaf-drip-light-green.webp
icons/magic/nature/leaf-elm-beam-green.webp
icons/magic/nature/leaf-elm-sparkle-glow-green.webp
icons/magic/nature/leaf-flower-wreath-glow-green-blue.webp
icons/magic/nature/leaf-glow-green.webp
icons/magic/nature/leaf-glow-maple-green.webp
icons/magic/nature/leaf-glow-maple-orange-purple.webp
icons/magic/nature/leaf-glow-maple-orange.webp
icons/magic/nature/leaf-glow-maple-teal.webp
icons/magic/nature/leaf-glow-orange-purple.webp
icons/magic/nature/leaf-glow-orange.webp
icons/magic/nature/leaf-glow-teal.webp
icons/magic/nature/leaf-glow-triple-green.webp
icons/magic/nature/leaf-glow-triple-orange-purple.webp
icons/magic/nature/leaf-glow-triple-orange.webp
icons/magic/nature/leaf-glow-triple-teal.webp
icons/magic/nature/leaf-hand-green.webp
icons/magic/nature/leaf-juggle-humanoid-green.webp
icons/magic/nature/leaf-oak-glow-green.webp
icons/magic/nature/leaf-oak-wreath-glow-green.webp
icons/magic/nature/leaf-rune-glow-green.webp
icons/magic/nature/lotus-glow-pink.webp
icons/magic/nature/meteorite-purple.webp
icons/magic/nature/moon-crescent.webp
icons/magic/nature/mushroom-glow-red.webp
icons/magic/nature/mushrooms-fire-glow-blue.webp
icons/magic/nature/plant-bamboo-green.webp
icons/magic/nature/plant-glowing-white-purple.webp
icons/magic/nature/plant-maneater-purple.webp
icons/magic/nature/plant-maneater-yellow.webp
icons/magic/nature/plant-poison-spit-green.webp
icons/magic/nature/plant-seed-hands-glow-yellow.webp
icons/magic/nature/plant-sproud-hands-dirt-green.webp
icons/magic/nature/plant-sprout-coconut-brown.webp
icons/magic/nature/plant-sproutdirt-green.webp
icons/magic/nature/plant-sprout-hand-blue.webp
icons/magic/nature/plant-sprout-hand-flower-pink.webp
icons/magic/nature/plant-sprout-hands-vines.webp
icons/magic/nature/plant-sprout-potted-blue.webp
icons/magic/nature/plant-sprout-snow-green.webp
icons/magic/nature/plant-undersea-glow-green.webp
icons/magic/nature/plant-undersea-orb-purple.webp
icons/magic/nature/plant-undersea-seaweed-glow-green.webp
icons/magic/nature/plant-venus-flytrap-blood.webp
icons/magic/nature/plant-vines-skull-green.webp
icons/magic/nature/root-vine-barrier-wall-brown.webp
icons/magic/nature/root-vine-beanstalk-moon.webp
icons/magic/nature/root-vine-beanstolk-green.webp
icons/magic/nature/root-vine-caduceus-healing.webp
icons/magic/nature/root-vine-coiled-crook.webp
icons/magic/nature/root-vine-entangled-hands.webp
icons/magic/nature/root-vine-entangled-hand.webp
icons/magic/nature/root-vine-entangled-humanoid.webp
icons/magic/nature/root-vine-entangle-foot-green.webp
icons/magic/nature/root-vine-entwined-thorns.webp
icons/magic/nature/root-vine-fire-entangled-hand.webp
icons/magic/nature/root-vine-hand-strike.webp
icons/magic/nature/root-vine-leaves-green.webp
icons/magic/nature/root-vines-entwined-leaves.webp
icons/magic/nature/root-vines-face-glow-green.webp
icons/magic/nature/root-vines-grow-brown.webp
icons/magic/nature/root-vines-knot-brown.webp
icons/magic/nature/root-vine-spiral-thorns-teal.webp
icons/magic/nature/root-vines-silhouette-teal.webp
icons/magic/nature/root-vine-sword-broken.webp
icons/magic/nature/root-vine-thorned-coil-green.webp
icons/magic/nature/root-vine-thorned-fire-purple.webp
icons/magic/nature/root-vine-thorned-pink.webp
icons/magic/nature/root-vine-thorns-poison-green.webp
icons/magic/nature/root-vine-wood-blue.webp
icons/magic/nature/seed-acorn-glowing-green.webp
icons/magic/nature/stealth-hide-beast-eyes-green.webp
icons/magic/nature/stealth-hide-eyes-green.webp
icons/magic/nature/stealth-hide-eyes-pink.webp
icons/magic/nature/symbol-moon-stars-white.webp
icons/magic/nature/symbol-sun-yellow.webp
icons/magic/nature/thorns-hand-glow-green.webp
icons/magic/nature/trap-spikes-thorns-green.webp
icons/magic/nature/tree-animated-smile.webp
icons/magic/nature/tree-animated-squint.webp
icons/magic/nature/tree-animated-strike.webp
icons/magic/nature/tree-animated-stump-mushrooms-teal.webp
icons/magic/nature/tree-bare-glow-yellow.webp
icons/magic/nature/tree-elm-roots-brown.webp
icons/magic/nature/tree-fruit-green.webp
icons/magic/nature/tree-roots-glow-yellow.webp
icons/magic/nature/tree-spirit-black.webp
icons/magic/nature/tree-spirit-blue.webp
icons/magic/nature/tree-spirit-glow-black-yellow.webp
icons/magic/nature/tree-spirit-green.webp
icons/magic/nature/tree-twisted-glow-yellow.webp
icons/magic/nature/vines-thorned-curled-glow-green.webp
icons/magic/nature/vines-thorned-curled-glow-teal-purple.webp
icons/magic/nature/vines-thorned-curled-glow-teal.webp
icons/magic/nature/vines-thorned-curled-green.webp
icons/magic/nature/vines-thorned-entwined-glow-green.webp
icons/magic/nature/vines-thorned-entwined-glow-teal-purple.webp
icons/magic/nature/vines-thorned-entwined-green.webp
icons/magic/nature/vines-thorned-entwined-teal.webp
icons/magic/nature/vines-thorned-glow-green.webp
icons/magic/nature/vines-thorned-glow-teal-purple.webp
icons/magic/nature/vines-thorned-glow-teal.webp
icons/magic/nature/vines-thorned-green.webp
icons/magic/nature/wolf-paw-glow-green.webp
icons/magic/nature/wolf-paw-glow-large-green.webp
icons/magic/nature/wolf-paw-glow-large-orange.webp
icons/magic/nature/wolf-paw-glow-large-purple-teal.webp
icons/magic/nature/wolf-paw-glow-large-teal-blue.webp
icons/magic/nature/wolf-paw-glow-orange.webp
icons/magic/nature/wolf-paw-glow-purple-teal.webp
icons/magic/nature/wolf-paw-glow-small-green.webp
icons/magic/nature/wolf-paw-glow-small-orange.webp
icons/magic/nature/wolf-paw-glow-small-purple-teal.webp
icons/magic/nature/wolf-paw-glow-small-teal-blue.webp
icons/magic/nature/wolf-paw-glow-teal-blue.webp
```

#### magic/perception (22 icons)

```
icons/magic/perception/eye-ringed-glow-angry-large-red.webp
icons/magic/perception/eye-ringed-glow-angry-large-teal.webp
icons/magic/perception/eye-ringed-glow-angry-red.webp
icons/magic/perception/eye-ringed-glow-angry-small-red.webp
icons/magic/perception/eye-ringed-glow-angry-small-teal.webp
icons/magic/perception/eye-ringed-glow-angry-teal.webp
icons/magic/perception/eye-ringed-green.webp
icons/magic/perception/eye-slit-orange.webp
icons/magic/perception/eye-slit-pink.webp
icons/magic/perception/eye-slit-red-orange.webp
icons/magic/perception/eye-tendrils-web-purple.webp
icons/magic/perception/eye-winged-pink.webp
icons/magic/perception/hand-eye-black.webp
icons/magic/perception/hand-eye-fire-blue.webp
icons/magic/perception/hand-eye-pink.webp
icons/magic/perception/mask-stone-eyes-orange.webp
icons/magic/perception/orb-crystal-ball-scrying-blue.webp
icons/magic/perception/orb-crystal-ball-scrying.webp
icons/magic/perception/orb-eye-scrying.webp
icons/magic/perception/shadow-stealth-eyes-purple.webp
icons/magic/perception/silhouette-stealth-shadow.webp
icons/magic/perception/third-eye-blue-red.webp
```

#### magic/symbols (49 icons)

```
icons/magic/symbols/arrowhead-green.webp
icons/magic/symbols/chevron-elipse-circle-blue.webp
icons/magic/symbols/circled-gem-pink.webp
icons/magic/symbols/circle-ouroboros.webp
icons/magic/symbols/clover-luck-white-green.webp
icons/magic/symbols/cog-glowing-green.webp
icons/magic/symbols/cog-orange-red.webp
icons/magic/symbols/cog-shield-white-blue.webp
icons/magic/symbols/cross-circle-blue.webp
icons/magic/symbols/elements-air-earth-fire-water.webp
icons/magic/symbols/fleur-de-lis-yellow.webp
icons/magic/symbols/mask-metal-silver-white.webp
icons/magic/symbols/mask-yellow-orange.webp
icons/magic/symbols/question-stone-yellow.webp
icons/magic/symbols/ring-circle-smoke-blue.webp
icons/magic/symbols/runes-carved-stone-green.webp
icons/magic/symbols/runes-carved-stone-purple.webp
icons/magic/symbols/runes-carved-stone-red.webp
icons/magic/symbols/runes-carved-stone-yellow.webp
icons/magic/symbols/runes-etched-steel-blade.webp
icons/magic/symbols/rune-sigil-black-pink.webp
icons/magic/symbols/rune-sigil-green-purple.webp
icons/magic/symbols/rune-sigil-green.webp
icons/magic/symbols/rune-sigil-hook-white-red.webp
icons/magic/symbols/rune-sigil-horned-blue.webp
icons/magic/symbols/rune-sigil-horned-white-purple.webp
icons/magic/symbols/rune-sigil-red-orange.webp
icons/magic/symbols/rune-sigil-rough-white-teal.webp
icons/magic/symbols/rune-sigil-white-pink.webp
icons/magic/symbols/runes-star-blue.webp
icons/magic/symbols/runes-star-magenta.webp
icons/magic/symbols/runes-star-orange-purple.webp
icons/magic/symbols/runes-star-orange.webp
icons/magic/symbols/runes-star-pentagon-blue.webp
icons/magic/symbols/runes-star-pentagon-magenta.webp
icons/magic/symbols/runes-star-pentagon-orange-purple.webp
icons/magic/symbols/runes-star-pentagon-orange.webp
icons/magic/symbols/runes-triangle-blue.webp
icons/magic/symbols/runes-triangle-magenta.webp
icons/magic/symbols/runes-triangle-orange-purple.webp
icons/magic/symbols/runes-triangle-orange.webp
icons/magic/symbols/squares-3d-green.webp
icons/magic/symbols/star-inverted-yellow.webp
icons/magic/symbols/star-rising-purple.webp
icons/magic/symbols/star-solid-gold.webp
icons/magic/symbols/star-yellow.webp
icons/magic/symbols/symbol-lightning-bolt.webp
icons/magic/symbols/triangle-glowing-green.webp
icons/magic/symbols/triangle-glow-purple.webp
```

#### magic/sonic (7 icons)

```
icons/magic/sonic/bell-alarm-red-purple.webp
icons/magic/sonic/explosion-impact-shock-wave.webp
icons/magic/sonic/explosion-shock-sound-wave.webp
icons/magic/sonic/explosion-shock-wave-teal.webp
icons/magic/sonic/projectile-shock-wave-blue.webp
icons/magic/sonic/projectile-sound-rings-wave.webp
icons/magic/sonic/scream-wail-shout-teal.webp
```

#### magic/unholy (67 icons)

```
icons/magic/unholy/barrier-fire-pink.webp
icons/magic/unholy/barrier-shield-glowing-pink.webp
icons/magic/unholy/beam-impact-green.webp
icons/magic/unholy/beam-impact-purple.webp
icons/magic/unholy/beam-ringed-impact-purple.webp
icons/magic/unholy/beams-impact-pink.webp
icons/magic/unholy/energy-smoke-pink.webp
icons/magic/unholy/hand-claw-fire-blue.webp
icons/magic/unholy/hand-claw-fire-green.webp
icons/magic/unholy/hand-claw-fog-green.webp
icons/magic/unholy/hand-claw-glow-orange.webp
icons/magic/unholy/hand-fire-skeleton-pink.webp
icons/magic/unholy/hand-grasping-green.webp
icons/magic/unholy/hand-light-green.webp
icons/magic/unholy/hand-light-pink.webp
icons/magic/unholy/hand-marked-pink.webp
icons/magic/unholy/hands-circle-light-green.webp
icons/magic/unholy/hands-cloud-light-pink.webp
icons/magic/unholy/hands-praying-fire-green.webp
icons/magic/unholy/hand-weapon-glow-black-green.webp
icons/magic/unholy/orb-beam-pink.webp
icons/magic/unholy/orb-colllecting-energy-green.webp
icons/magic/unholy/orb-contained-pink.webp
icons/magic/unholy/orb-droplet-pink.webp
icons/magic/unholy/orb-glowing-purple.webp
icons/magic/unholy/orb-glowing-yellow-purple.webp
icons/magic/unholy/orb-hands-pink.webp
icons/magic/unholy/orb-rays-blue.webp
icons/magic/unholy/orb-smoking-green.webp
icons/magic/unholy/orb-stone-pink.webp
icons/magic/unholy/orb-swirling-pink.webp
icons/magic/unholy/orb-swirling-teal.webp
icons/magic/unholy/projectile-bolts-salvo-pink.webp
icons/magic/unholy/projectile-bullet-orb-pink.webp
icons/magic/unholy/projectile-fireball-agile-purple.webp
icons/magic/unholy/projectile-fireball-green.webp
icons/magic/unholy/projectile-flame-white-purple.webp
icons/magic/unholy/projectile-helix-blood-red.webp
icons/magic/unholy/projectile-missile-green.webp
icons/magic/unholy/projectiles-binary-pink.webp
icons/magic/unholy/projectiles-blood-salvo-red.webp
icons/magic/unholy/projectile-smoke-tendril-green.webp
icons/magic/unholy/projectile-smoke-trail-pink.webp
icons/magic/unholy/projectile-spear-glow-pink.webp
icons/magic/unholy/silhouette-evil-horned-giant.webp
icons/magic/unholy/silhouette-light-fire-blue.webp
icons/magic/unholy/silhouette-robe-evil-glow.webp
icons/magic/unholy/silhouette-robe-evil-power.webp
icons/magic/unholy/strike-beam-blood-large-red-blue.webp
icons/magic/unholy/strike-beam-blood-large-red-gray.webp
icons/magic/unholy/strike-beam-blood-large-red-green.webp
icons/magic/unholy/strike-beam-blood-large-red-purple.webp
icons/magic/unholy/strike-beam-blood-large-red-teal.webp
icons/magic/unholy/strike-beam-blood-red-blue.webp
icons/magic/unholy/strike-beam-blood-red-gray.webp
icons/magic/unholy/strike-beam-blood-red-green.webp
icons/magic/unholy/strike-beam-blood-red-purple.webp
icons/magic/unholy/strike-beam-blood-red-teal.webp
icons/magic/unholy/strike-beam-blood-small-red-blue.webp
icons/magic/unholy/strike-beam-blood-small-red-gray.webp
icons/magic/unholy/strike-beam-blood-small-red-green.webp
icons/magic/unholy/strike-beam-blood-small-red-purple.webp
icons/magic/unholy/strike-beam-blood-small-red-teal.webp
icons/magic/unholy/strike-body-explode-disintegrate.webp
icons/magic/unholy/strike-body-life-soul-green.webp
icons/magic/unholy/strike-body-life-soul-purple.webp
icons/magic/unholy/strike-hand-glow-pink.webp
```

#### magic/water (85 icons)

```
icons/magic/water/barrier-ice-crystal-wall-faceted-blue.webp
icons/magic/water/barrier-ice-crystal-wall-faceted-light.webp
icons/magic/water/barrier-ice-crystal-wall-faceted.webp
icons/magic/water/barrier-ice-crystal-wall-green.webp
icons/magic/water/barrier-ice-crystal-wall-jagged-blue.webp
icons/magic/water/barrier-ice-crystal-wall-jagged.webp
icons/magic/water/barrier-ice-shield.webp
icons/magic/water/barrier-ice-wall-explosion.webp
icons/magic/water/barrier-ice-wall-snow.webp
icons/magic/water/barrier-ice-water-cube.webp
icons/magic/water/beam-ice-impact.webp
icons/magic/water/bubbles-air-water-blue.webp
icons/magic/water/bubbles-air-water-light.webp
icons/magic/water/bubbles-air-water-pink.webp
icons/magic/water/elemental-water.webp
icons/magic/water/heart-ice-freeze.webp
icons/magic/water/ice-crystal-white.webp
icons/magic/water/ice-snowman.webp
icons/magic/water/orb-ice-glow.webp
icons/magic/water/orb-ice-opaque.webp
icons/magic/water/orb-ice-web.webp
icons/magic/water/orb-water-bubbles-blue.webp
icons/magic/water/orb-water-bubbles-teal.webp
icons/magic/water/orb-water-bubbles.webp
icons/magic/water/orb-water-ice-pink.webp
icons/magic/water/orb-water-transparent.webp
icons/magic/water/projectile-arrow-cold-fire-blue.webp
icons/magic/water/projectile-arrow-ice-gray-blue.webp
icons/magic/water/projectile-arrow-water-ice-blue.webp
icons/magic/water/projectile-beams-salvo-blue.webp
icons/magic/water/projectile-bolts-salvo-blue.webp
icons/magic/water/projectile-ice-chunk-blue.webp
icons/magic/water/projectile-ice-chunks-salvo.webp
icons/magic/water/projectile-ice-chunk.webp
icons/magic/water/projectile-icecicle-glowing.webp
icons/magic/water/projectile-icecicles-salvo.webp
icons/magic/water/projectile-icecicle.webp
icons/magic/water/projectile-ice-faceted-blue.webp
icons/magic/water/projectile-ice-faceted-chunk.webp
icons/magic/water/projectile-ice-faceted-gray.webp
icons/magic/water/projectile-ice-faceted-teal.webp
icons/magic/water/projectile-ice-impact-stone.webp
icons/magic/water/projectile-ice-orb-white.webp
icons/magic/water/projectile-ice-shard.webp
icons/magic/water/projectile-ice-snowball.webp
icons/magic/water/projectile-ice-teardrops-salvo.webp
icons/magic/water/projectile-ice-teardrop.webp
icons/magic/water/projectile-needles-salvo-blue.webp
icons/magic/water/projectiles-ice-explosion.webp
icons/magic/water/projectiles-ice-faceted-salvo-blue.webp
icons/magic/water/projectiles-ice-faceted-salvo-gray.webp
icons/magic/water/projectiles-ice-faceted-shard-salvo-blue.webp
icons/magic/water/projectiles-ice-faceted-shard-salvo-gray.webp
icons/magic/water/projectiles-ice-faceted-shard-teal.webp
icons/magic/water/projectiles-ice-faceted-teal.webp
icons/magic/water/projectile-water-ice-orb.webp
icons/magic/water/projectile-water-rings.webp
icons/magic/water/projectile-water-wave-teal.webp
icons/magic/water/pseudopod-swirl-blue.webp
icons/magic/water/pseudopod-teal.webp
icons/magic/water/snowflake-ice-blue.webp
icons/magic/water/snowflake-ice-blue-white.webp
icons/magic/water/snowflake-ice-gray.webp
icons/magic/water/snowflake-ice-green.webp
icons/magic/water/snowflake-ice-purple.webp
icons/magic/water/snowflake-ice-snow-white.webp
icons/magic/water/strike-ice-blade-axe.webp
icons/magic/water/strike-ice-blade-fang.webp
icons/magic/water/strike-ice-blades.webp
icons/magic/water/strike-weapon-blade-ice-blue.webp
icons/magic/water/tendrils-ice-growth.webp
icons/magic/water/tendrils-ice-thorns.webp
icons/magic/water/vortex-water-whirlpool-blue.webp
icons/magic/water/vortex-water-whirlpool.webp
icons/magic/water/water-drop-swirl-blue.webp
icons/magic/water/water-elemental-blue-teeth.webp
icons/magic/water/water-hand.webp
icons/magic/water/water-iceberg-bubbles.webp
icons/magic/water/water-jet-wave-blue.webp
icons/magic/water/water-well.webp
icons/magic/water/waves-water-blue.webp
icons/magic/water/wave-water-blue.webp
icons/magic/water/wave-water-explosion.webp
icons/magic/water/wave-water-rolling-blue.webp
icons/magic/water/wave-water-teal.webp
```

### Skills Icons (For Combat Feats)

#### skills/melee (118 icons)

```
icons/skills/melee/blade-tip-acid-poison-green.webp
icons/skills/melee/blade-tip-chipped-blood-red.webp
icons/skills/melee/blade-tip-damaged-acid-green.webp
icons/skills/melee/blade-tip-energy-green.webp
icons/skills/melee/blade-tip-orange.webp
icons/skills/melee/blade-tips-double-blue.webp
icons/skills/melee/blade-tip-smoke-green.webp
icons/skills/melee/blade-tips-triple-bent-white.webp
icons/skills/melee/blade-tips-triple-steel.webp
icons/skills/melee/blood-slash-foam-red.webp
icons/skills/melee/hand-grip-axe-strike-orange.webp
icons/skills/melee/hand-grip-hammer-spiked-blue.webp
icons/skills/melee/hand-grip-staff-blue.webp
icons/skills/melee/hand-grip-staff-teal.webp
icons/skills/melee/hand-grip-staff-yellow-brown.webp
icons/skills/melee/hand-grip-sword-orange.webp
icons/skills/melee/hand-grip-sword-red.webp
icons/skills/melee/hand-grip-sword-strike-orange.webp
icons/skills/melee/hand-grip-sword-white-brown.webp
icons/skills/melee/maneuver-daggers-paired-orange.webp
icons/skills/melee/maneuver-greatsword-yellow.webp
icons/skills/melee/maneuver-sword-katana-yellow.webp
icons/skills/melee/shield-block-bash-blue.webp
icons/skills/melee/shield-block-bash-yellow.webp
icons/skills/melee/shield-block-fire-orange.webp
icons/skills/melee/shield-block-gray-orange.webp
icons/skills/melee/shield-block-gray-yellow.webp
icons/skills/melee/shield-damaged-broken-blue.webp
icons/skills/melee/shield-damaged-broken-brown.webp
icons/skills/melee/shield-damaged-broken-gold.webp
icons/skills/melee/shield-damaged-broken-orange.webp
icons/skills/melee/spear-tips-double-purple.webp
icons/skills/melee/spear-tips-quintuple-orange.webp
icons/skills/melee/spear-tips-three-green.webp
icons/skills/melee/spear-tips-three-purple.webp
icons/skills/melee/spear-tips-triple-orange.webp
icons/skills/melee/strike-axe-blood-red.webp
icons/skills/melee/strike-axe-energy-pink.webp
icons/skills/melee/strike-axe-red.webp
icons/skills/melee/strike-blade-blood-red.webp
icons/skills/melee/strike-blade-claw-red.webp
icons/skills/melee/strike-blade-hooked-blue-red.webp
icons/skills/melee/strike-blade-hooked-green-purple.webp
icons/skills/melee/strike-blade-hooked-orange-blue.webp
icons/skills/melee/strike-blade-hooked-white-red.webp
icons/skills/melee/strike-blade-knife-blue-red.webp
icons/skills/melee/strike-blade-knife-green-purple.webp
icons/skills/melee/strike-blade-knife-orange-blue.webp
icons/skills/melee/strike-blade-knife-white-red.webp
icons/skills/melee/strike-blade-poison-green.webp
icons/skills/melee/strike-blade-scimitar-blue-red.webp
icons/skills/melee/strike-blade-scimitar-gray-red.webp
icons/skills/melee/strike-blade-scimitar-green-purple.webp
icons/skills/melee/strike-blade-scimitar-orange-blue.webp
icons/skills/melee/strike-chain-whip-blue.webp
icons/skills/melee/strike-club-red.webp
icons/skills/melee/strike-dagger-arcane-pink.webp
icons/skills/melee/strike-dagger-blood-red.webp
icons/skills/melee/strike-dagger-poison-dripping-green.webp
icons/skills/melee/strike-dagger-poison-green.webp
icons/skills/melee/strike-dagger-skull-white.webp
icons/skills/melee/strike-dagger-white-orange.webp
icons/skills/melee/strike-flail-destructive-yellow.webp
icons/skills/melee/strike-flail-spiked-pink.webp
icons/skills/melee/strike-flail-spiked-red.webp
icons/skills/melee/strike-hammer-destructive-blue.webp
icons/skills/melee/strike-hammer-destructive-orange.webp
icons/skills/melee/strike-morningstar-gray.webp
icons/skills/melee/strike-polearm-glowing-white.webp
icons/skills/melee/strike-polearm-light-orange.webp
icons/skills/melee/strike-scythe-fire-green.webp
icons/skills/melee/strike-slashes-orange.webp
icons/skills/melee/strike-slashes-red.webp
icons/skills/melee/strike-spear-red.webp
icons/skills/melee/strikes-sword-scimitar.webp
icons/skills/melee/strikes-sword-triple-gray.webp
icons/skills/melee/strike-stake-gray.webp
icons/skills/melee/strike-sword-blood-red.webp
icons/skills/melee/strike-sword-dagger-runes-gold.webp
icons/skills/melee/strike-sword-dagger-runes-gray.webp
icons/skills/melee/strike-sword-dagger-runes-red.webp
icons/skills/melee/strike-sword-dagger-runes-yellow.webp
icons/skills/melee/strike-sword-gray.webp
icons/skills/melee/strike-sword-slashing-red.webp
icons/skills/melee/strike-sword-stabbed-brown.webp
icons/skills/melee/strike-sword-steel-yellow.webp
icons/skills/melee/strike-weapon-polearm-ice-blue.webp
icons/skills/melee/strike-weapons-orange.webp
icons/skills/melee/sword-damaged-bent.webp
icons/skills/melee/sword-damaged-broken-blue.webp
icons/skills/melee/sword-damaged-broken-glow-red.webp
icons/skills/melee/sword-damaged-broken-orange.webp
icons/skills/melee/sword-damaged-broken-purple.webp
icons/skills/melee/sword-damaged-broken-red.webp
icons/skills/melee/sword-damaged-chipped-green.webp
icons/skills/melee/sword-echo-stylized-tan.webp
icons/skills/melee/sword-engraved-glow-purple.webp
icons/skills/melee/sword-shield-stylized-white.webp
icons/skills/melee/swords-parry-block-blue.webp
icons/skills/melee/swords-parry-block-yellow.webp
icons/skills/melee/swords-triple-orange.webp
icons/skills/melee/sword-stuck-glowing-pink.webp
icons/skills/melee/sword-twirl-orange.webp
icons/skills/melee/sword-winged-holy-orange.webp
icons/skills/melee/unarmed-punch-fist-blue.webp
icons/skills/melee/unarmed-punch-fist.webp
icons/skills/melee/unarmed-punch-fist-white.webp
icons/skills/melee/unarmed-punch-fist-yellow-red.webp
icons/skills/melee/weapons-crossed-daggers-orange.webp
icons/skills/melee/weapons-crossed-poleaxes-white.webp
icons/skills/melee/weapons-crossed-swords-black-gray.webp
icons/skills/melee/weapons-crossed-swords-black.webp
icons/skills/melee/weapons-crossed-swords-pink.webp
icons/skills/melee/weapons-crossed-swords-purple.webp
icons/skills/melee/weapons-crossed-swords-teal.webp
icons/skills/melee/weapons-crossed-swords-white-blue.webp
icons/skills/melee/weapons-crossed-swords-yellow-teal.webp
icons/skills/melee/weapons-crossed-swords-yellow.webp
```

#### skills/ranged (65 icons)

```
icons/skills/ranged/archery-bow-attack-yellow.webp
icons/skills/ranged/arrow-barbed-flying-gray.webp
icons/skills/ranged/arrow-barbed-flying-poisoned-green.webp
icons/skills/ranged/arrow-flying-broadhead-metal.webp
icons/skills/ranged/arrow-flying-gray-brown.webp
icons/skills/ranged/arrow-flying-ornate-gold.webp
icons/skills/ranged/arrow-flying-poisoned-green.webp
icons/skills/ranged/arrow-flying-spiral-blue.webp
icons/skills/ranged/arrow-flying-white-blue.webp
icons/skills/ranged/arrow-gem-flying-poisoned-green.webp
icons/skills/ranged/arrows-flying-salvo-blue-light.webp
icons/skills/ranged/arrows-flying-salvo-blue.webp
icons/skills/ranged/arrows-flying-salvo-gray.webp
icons/skills/ranged/arrows-flying-salvo-purple.webp
icons/skills/ranged/arrows-flying-salvo-yellow.webp
icons/skills/ranged/arrows-flying-triple-blue.webp
icons/skills/ranged/arrows-flying-triple-brown.webp
icons/skills/ranged/arrows-flying-triple-gray.webp
icons/skills/ranged/arrow-strike-apple-orange.webp
icons/skills/ranged/arrow-strike-glowing-teal.webp
icons/skills/ranged/arrows-triple-yellow-red.webp
icons/skills/ranged/bomb-grenade-thrown-gray.webp
icons/skills/ranged/bomb-grenade-thrown-orange.webp
icons/skills/ranged/bomb-grenade-thrown-purple.webp
icons/skills/ranged/bomb-grenade-thrown-stars-orange.webp
icons/skills/ranged/bomb-grenade-thrown-yellow.webp
icons/skills/ranged/bow-arrows-blue.webp
icons/skills/ranged/bow-arrows-red.webp
icons/skills/ranged/bullet-ball-pink.webp
icons/skills/ranged/bullet-sparks-yellow.webp
icons/skills/ranged/bullets-triple-ball-ice-blue.webp
icons/skills/ranged/bullets-triple-ball-orange.webp
icons/skills/ranged/bullets-triple-ball-yellow.webp
icons/skills/ranged/cannon-barrel-firing-blue.webp
icons/skills/ranged/cannon-barrel-firing-orange.webp
icons/skills/ranged/cannon-barrel-firing-white-yellow.webp
icons/skills/ranged/cannon-barrel-firing-yellow.webp
icons/skills/ranged/cannon-barrel-gray.webp
icons/skills/ranged/daggers-thrown-salvo-green.webp
icons/skills/ranged/daggers-thrown-salvo-orange.webp
icons/skills/ranged/daggers-thrown-salvo-teal.webp
icons/skills/ranged/dagger-thrown-jeweled-green.webp
icons/skills/ranged/dagger-thrown-jeweled-purple.webp
icons/skills/ranged/dart-thrown-poison-green.webp
icons/skills/ranged/person-archery-bow-attack-gray.webp
icons/skills/ranged/person-archery-bow-attack-orange.webp
icons/skills/ranged/projectile-explosion-black-orange.webp
icons/skills/ranged/projectile-spiral-gray.webp
icons/skills/ranged/projectile-strike-egg-blue.webp
icons/skills/ranged/projectile-strike-impale-gray.webp
icons/skills/ranged/rifle-scoped-firing-yellow-green.webp
icons/skills/ranged/rifle-scoped-gray-green.webp
icons/skills/ranged/rocket-skull-fire-blue.webp
icons/skills/ranged/shuriken-thrown-orange.webp
icons/skills/ranged/shuriken-thrown-sawblade-blue.webp
icons/skills/ranged/shuriken-thrown-sawblade-gray.webp
icons/skills/ranged/shuriken-thrown-yellow.webp
icons/skills/ranged/target-bullseye-archer-orange.webp
icons/skills/ranged/target-bullseye-arrow-blue.webp
icons/skills/ranged/target-bullseye-arrow-glowing.webp
icons/skills/ranged/target-bullseye-arrow-green.webp
icons/skills/ranged/target-bullseye-arrow-white.webp
icons/skills/ranged/target-bullseye-arrow-yellow.webp
icons/skills/ranged/tracers-triple-orange.webp
icons/skills/ranged/wand-attack-beam-blue.webp
```

#### skills/social (16 icons)

```
icons/skills/social/diplomacy-handshake-blue.webp
icons/skills/social/diplomacy-handshake-gray.webp
icons/skills/social/diplomacy-handshake.webp
icons/skills/social/diplomacy-handshake-yellow.webp
icons/skills/social/diplomacy-offering-ritual.webp
icons/skills/social/diplomacy-peace-alliance.webp
icons/skills/social/diplomacy-unity-alliance.webp
icons/skills/social/diplomacy-writing-letter.webp
icons/skills/social/intimidation-impressing.webp
icons/skills/social/peace-luck-insult.webp
icons/skills/social/theft-pickpocket-bribery-brown.webp
icons/skills/social/thumbsup-approval-like.webp
icons/skills/social/trading-injustice-scale-gray.webp
icons/skills/social/trading-justice-scale-gold.webp
icons/skills/social/trading-justice-scale-yellow.webp
icons/skills/social/wave-halt-stop.webp
```

#### skills/trades (52 icons)

```
icons/skills/trades/academics-astronomy-navigation-blue.webp
icons/skills/trades/academics-astronomy-navigation-purple.webp
icons/skills/trades/academics-book-study-purple.webp
icons/skills/trades/academics-book-study-runes.webp
icons/skills/trades/academics-investigation-puzzles.webp
icons/skills/trades/academics-investigation-study-blue.webp
icons/skills/trades/academics-merchant-scribe.webp
icons/skills/trades/academics-scribe-quill-gray.webp
icons/skills/trades/academics-study-archaeology-bones.webp
icons/skills/trades/academics-study-reading-book.webp
icons/skills/trades/baking-bread-rolls-green.webp
icons/skills/trades/construction-carpentry-hammer-gray.webp
icons/skills/trades/construction-carpentry-hammer.webp
icons/skills/trades/construction-mason-bricklayer-red.webp
icons/skills/trades/construction-mason-stonecutter-sculpture.webp
icons/skills/trades/farming-picking-basket-fruit-green.webp
icons/skills/trades/farming-planet-bulb-orange.webp
icons/skills/trades/farming-plant-seedling-gray.webp
icons/skills/trades/farming-plant-seeds-gray.webp
icons/skills/trades/farming-scarecrow-simple-green.webp
icons/skills/trades/farming-sickle-harvest-wheat.webp
icons/skills/trades/farming-watering-can-green.webp
icons/skills/trades/farming-wheat-circle-yellow.webp
icons/skills/trades/farming-wheat-swirl-green.webp
icons/skills/trades/fishing-bobber-red.webp
icons/skills/trades/fishing-rod-gray.webp
icons/skills/trades/fletching-bowyery-arrow-tan.webp
icons/skills/trades/gaming-gambling-dice-gray.webp
icons/skills/trades/mining-pickaxe-iron-blue.webp
icons/skills/trades/mining-pickaxe-stone-black.webp
icons/skills/trades/mining-pickaxe-stone-blue.webp
icons/skills/trades/mining-pickaxe-stone-cart.webp
icons/skills/trades/mining-pickaxe-yellow-blue.webp
icons/skills/trades/music-notes-sound-blue.webp
icons/skills/trades/music-singing-voice-blue.webp
icons/skills/trades/profession-sailing-pirate.webp
icons/skills/trades/profession-sailing-ship.webp
icons/skills/trades/scissors-tailor-barber.webp
icons/skills/trades/security-lockpicking-chest-blue.webp
icons/skills/trades/security-locksmith-key-gray.webp
icons/skills/trades/smithing-anvil-brown.webp
icons/skills/trades/smithing-anvil-horseshoe.webp
icons/skills/trades/smithing-anvil-silver-red.webp
icons/skills/trades/smithing-smelter-tongs.webp
icons/skills/trades/smithing-tongs-metal-red.webp
icons/skills/trades/textiles-cloth-dye-red.webp
icons/skills/trades/textiles-knitting-yarn-red.webp
icons/skills/trades/textiles-stitching-leather-brown.webp
icons/skills/trades/woodcutting-logging-axe-stump.webp
icons/skills/trades/woodcutting-logging-saw.webp
icons/skills/trades/woodcutting-logging-splitting-green.webp
icons/skills/trades/woodcutting-logging-splitting.webp
```

#### skills/wounds (25 icons)

```
icons/skills/wounds/anatomy-bone-joint.webp
icons/skills/wounds/anatomy-organ-brain-pink-red.webp
icons/skills/wounds/anatomy-organ-heart-red.webp
icons/skills/wounds/blood-cells-disease-green.webp
icons/skills/wounds/blood-cells-red.webp
icons/skills/wounds/blood-cells-vessel-blue.webp
icons/skills/wounds/blood-cells-vessel-red-orange.webp
icons/skills/wounds/blood-cells-vessel-red.webp
icons/skills/wounds/blood-drip-droplet-red.webp
icons/skills/wounds/blood-spurt-spray-red.webp
icons/skills/wounds/bone-broken-knee-beam.webp
icons/skills/wounds/bone-broken-marrow-red.webp
icons/skills/wounds/bone-broken-marrow-yellow.webp
icons/skills/wounds/bone-broken-tooth-fang-red.webp
icons/skills/wounds/illness-disease-glowing-green.webp
icons/skills/wounds/injury-body-pain-gray.webp
icons/skills/wounds/injury-eyes-blood-red-pink.webp
icons/skills/wounds/injury-eyes-blood-red.webp
icons/skills/wounds/injury-face-impact-orange.webp
icons/skills/wounds/injury-hand-blood-red.webp
icons/skills/wounds/injury-pain-body-orange.webp
icons/skills/wounds/injury-pain-impaled-hand-blood.webp
icons/skills/wounds/injury-stapled-flesh-tan.webp
icons/skills/wounds/injury-stitched-flesh-red.webp
icons/skills/wounds/injury-triple-slash-bleed.webp
```

### Equipment Icons (For Feats)

#### equipment/shield (66 icons)

```
icons/equipment/shield/buckler-boss-iron-wood-brown.webp
icons/equipment/shield/buckler-iron-cross-gray.webp
icons/equipment/shield/buckler-wooden-boss-brown.webp
icons/equipment/shield/buckler-wooden-boss-glowing-blue.webp
icons/equipment/shield/buckler-wooden-boss-lightning.webp
icons/equipment/shield/buckler-wooden-boss-steel.webp
icons/equipment/shield/buckler-wooden-boss.webp
icons/equipment/shield/buckler-wooden-round-hole.webp
icons/equipment/shield/buckler-wooden-triangle-brown.webp
icons/equipment/shield/heater-crystal-blue.webp
icons/equipment/shield/heater-embossed-gold.webp
icons/equipment/shield/heater-emossed-spiral-green.webp
icons/equipment/shield/heater-steel-boss-red.webp
icons/equipment/shield/heater-steel-crystal-red.webp
icons/equipment/shield/heater-steel-engraved-lance-rest.webp
icons/equipment/shield/heater-steel-gold.webp
icons/equipment/shield/heater-steel-gray.webp
icons/equipment/shield/heater-steel-grey.webp
icons/equipment/shield/heater-steel-segmented-purple.webp
icons/equipment/shield/heater-steel-spiral.webp
icons/equipment/shield/heater-steel-sword-yellow-black.webp
icons/equipment/shield/heater-steel-worn.webp
icons/equipment/shield/heater-stone-orange.webp
icons/equipment/shield/heater-wooden-antlers-blue.webp
icons/equipment/shield/heater-wooden-blue.webp
icons/equipment/shield/heater-wooden-boss-brown.webp
icons/equipment/shield/heater-wooden-brown-axe.webp
icons/equipment/shield/heater-wooden-brown-notched.webp
icons/equipment/shield/heater-wooden-hourglass-purple.webp
icons/equipment/shield/heater-wooden-steel-boss.webp
icons/equipment/shield/heater-wooden-sword-green.webp
icons/equipment/shield/heater-wooden-wolf-brown.webp
icons/equipment/shield/heater-wooden-worn.webp
icons/equipment/shield/kite-bronze-boss-brown.webp
icons/equipment/shield/kite-decorative-steel-claws.webp
icons/equipment/shield/kite-steel-boss-gold.webp
icons/equipment/shield/kite-wooden-axe-blue-black.webp
icons/equipment/shield/kite-wooden-boss-steel-blue.webp
icons/equipment/shield/kite-wooden-boss-steel-brown.webp
icons/equipment/shield/kite-wooden-boss-steel-red.webp
icons/equipment/shield/kite-wooden-dragon-green.webp
icons/equipment/shield/kite-wooden-oak-glow.webp
icons/equipment/shield/kite-wooden-sigil-purple.webp
icons/equipment/shield/kite-wooden-thistle-pink.webp
icons/equipment/shield/oval-wooden-boss-bronze.webp
icons/equipment/shield/oval-wooden-boss-steel.webp
icons/equipment/shield/oval-wooden-clover-green-gold.webp
icons/equipment/shield/pavise-wooden-seahorse-blue-white.webp
icons/equipment/shield/pavise-wooden-wings-blue-white.webp
icons/equipment/shield/round-wooden-axe-brown.webp
icons/equipment/shield/round-wooden-boss-gold-brown.webp
icons/equipment/shield/round-wooden-boss-notched-red.webp
icons/equipment/shield/round-wooden-boss-steel-brown.webp
icons/equipment/shield/round-wooden-boss-steel-red.webp
icons/equipment/shield/round-wooden-boss-steel-yellow-blue.webp
icons/equipment/shield/round-wooden-pointed-boss-steel-brown.webp
icons/equipment/shield/round-wooden-reinforced-boss-steel.webp
icons/equipment/shield/Scutum-steel-worn.webp
icons/equipment/shield/shield-round-boss-wood-brown.webp
icons/equipment/shield/targe-boss-steel-brown.webp
icons/equipment/shield/targe-copper-eye.webp
icons/equipment/shield/targe-steel-blue.webp
icons/equipment/shield/targe-wooden-boss-steel-brown.webp
icons/equipment/shield/targe-wooden-boss-steel.webp
icons/equipment/shield/wardoor-wooden-boss-brown.webp
icons/equipment/shield/wardoor-wooden-plank-boss-steel.webp
```

#### equipment/head (153 icons)

```
icons/equipment/head/cap-leather-brown.webp
icons/equipment/head/cap-simple-leather-brown.webp
icons/equipment/head/cap-simple-leather-green.webp
icons/equipment/head/cap-simple-leather-pink.webp
icons/equipment/head/cap-simple-leather-tan.webp
icons/equipment/head/cap-simple-leather.webp
icons/equipment/head/cap-steel.webp
icons/equipment/head/crown-feather-brown.webp
icons/equipment/head/crown-fur-red-white.webp
icons/equipment/head/crown-gold-blue.webp
icons/equipment/head/crown-gold-red.webp
icons/equipment/head/crown-horns-brown.webp
icons/equipment/head/crown-thorns-gold.webp
icons/equipment/head/goggles-leather-blue.webp
icons/equipment/head/goggles-leather-grey.webp
icons/equipment/head/goggles-leather-tan.webp
icons/equipment/head/greathelm-banded-steel.webp
icons/equipment/head/greathelm-reticulated-steel.webp
icons/equipment/head/greathelm-shemagh.webp
icons/equipment/head/greathelm-slotted-steel.webp
icons/equipment/head/hat-belted-grey.webp
icons/equipment/head/hat-belted-purple.webp
icons/equipment/head/hat-belted-simple-brown.webp
icons/equipment/head/hat-belted-simple-grey.webp
icons/equipment/head/hat-belted-simple.webp
icons/equipment/head/hat-cocked-feather-green.webp
icons/equipment/head/hat-cocked-purple.webp
icons/equipment/head/hat-franklin-pirate-blue.webp
icons/equipment/head/hat-furred-brown.webp
icons/equipment/head/hat-pointed-buckle-leather-purple.webp
icons/equipment/head/hat-pointed-leather-black-glowing.webp
icons/equipment/head/hat-pointed-leather-blue.webp
icons/equipment/head/hat-pointed-leather-brown.webp
icons/equipment/head/hat-pointed-leather-pink.webp
icons/equipment/head/hat-pointed-leather-purple.webp
icons/equipment/head/hat-pointed-leather-red.webp
icons/equipment/head/hat-tricorn-brown.webp
icons/equipment/head/hat-tricorn-pirate-black.webp
icons/equipment/head/headwrap-cloth-purple.webp
icons/equipment/head/headwrap-cloth-white.webp
icons/equipment/head/helm-barbute-band.webp
icons/equipment/head/helm-barbute-brass-steel.webp
icons/equipment/head/helm-barbute-brown-tan.webp
icons/equipment/head/helm-barbute-engraved-steel.webp
icons/equipment/head/helm-barbute-engraved.webp
icons/equipment/head/helm-barbute-evil-green.webp
icons/equipment/head/helm-barbute-horned-copper.webp
icons/equipment/head/helm-barbute-horned-glowing.webp
icons/equipment/head/helm-barbute-horned-gold-pink.webp
icons/equipment/head/helm-barbute-horned-gold-purple.webp
icons/equipment/head/helm-barbute-horned-gold-red.webp
icons/equipment/head/helm-barbute-horned-grey.webp
icons/equipment/head/helm-barbute-horned-tan.webp
icons/equipment/head/helm-barbute-horned.webp
icons/equipment/head/helm-barbute-leather.webp
icons/equipment/head/helm-barbute-reinforced.webp
icons/equipment/head/helm-barbute-rounded-gold.webp
icons/equipment/head/helm-barbute-rounded-grey.webp
icons/equipment/head/helm-barbute-rounded-orange.webp
icons/equipment/head/helm-barbute-rounded-purple.webp
icons/equipment/head/helm-barbute-rounded-steel.webp
icons/equipment/head/helm-barbute-rounded-steel-worn.webp
icons/equipment/head/helm-barbute-steel-grey.webp
icons/equipment/head/helm-barbute-steel.webp
icons/equipment/head/helm-barbute-tan.webp
icons/equipment/head/helm-barbute-thin-steel.webp
icons/equipment/head/helm-barbute-white-purple.webp
icons/equipment/head/helm-barbute-white.webp
icons/equipment/head/helm-basinet-shemagh-steel.webp
icons/equipment/head/helm-basinet-slotted-steel.webp
icons/equipment/head/helm-bassinet-horned.webp
icons/equipment/head/helm-bassinet-kettle-steel.webp
icons/equipment/head/helm-bassinet-pointed-steel.webp
icons/equipment/head/helm-bassinet-steel.webp
icons/equipment/head/helm-bassinet-steel-white.webp
icons/equipment/head/helm-bucket-grey.webp
icons/equipment/head/helmet-viking-iron-gray.webp
icons/equipment/head/helm-evil-immortan.webp
icons/equipment/head/helm-goggles-leather.webp
icons/equipment/head/helm-kettle-worn.webp
icons/equipment/head/helm-norman-barbarian.webp
icons/equipment/head/helm-norman-bird.webp
icons/equipment/head/helm-norman-black-gilded.webp
icons/equipment/head/helm-norman-brown.webp
icons/equipment/head/helm-norman-brutal.webp
icons/equipment/head/helm-norman-engraved.webp
icons/equipment/head/helm-norman-gray-banded.webp
icons/equipment/head/helm-norman-horned-blue.webp
icons/equipment/head/helm-norman-horned-brown.webp
icons/equipment/head/helm-norman-horned-gold.webp
icons/equipment/head/helm-norman-leather-studded.webp
icons/equipment/head/helm-norman-padded-leather.webp
icons/equipment/head/helm-norman-reticulated.webp
icons/equipment/head/helm-norman-rounded.webp
icons/equipment/head/helm-norman-shrouded.webp
icons/equipment/head/helm-norman-simple-leather.webp
icons/equipment/head/helm-rounded-reinforced-leather.webp
icons/equipment/head/helm-sallet-grey.webp
icons/equipment/head/helm-sallet-horned-grey.webp
icons/equipment/head/helm-sallet-horned.webp
icons/equipment/head/helm-sallet-steel.webp
icons/equipment/head/helm-sallet-worn.webp
icons/equipment/head/helm-spangen-engraved-brown.webp
icons/equipment/head/helm-spangen-engraved.webp
icons/equipment/head/helm-spangen-horned-gold.webp
icons/equipment/head/helm-spangen-horned.webp
icons/equipment/head/helm-spangen-horned-worn.webp
icons/equipment/head/helm-spangen-reticulated.webp
icons/equipment/head/helm-spangen-ridged.webp
icons/equipment/head/helm-spangen-rounded.webp
icons/equipment/head/helm-spangen-tan.webp
icons/equipment/head/helm-spangen.webp
icons/equipment/head/hood-chain-worn.webp
icons/equipment/head/hood-cloth-blue.webp
icons/equipment/head/hood-cloth-blue-white.webp
icons/equipment/head/hood-cloth-brown.webp
icons/equipment/head/hood-cloth-gold-pink.webp
icons/equipment/head/hood-cloth-green-white.webp
icons/equipment/head/hood-cloth-mask-red.webp
icons/equipment/head/hood-cloth-pink-gold.webp
icons/equipment/head/hood-cloth-pink-red.webp
icons/equipment/head/hood-cloth-teal-gold.webp
icons/equipment/head/hood-cloth-teal.webp
icons/equipment/head/hood-cloth-trimmed-pink-gold.webp
icons/equipment/head/hood-cloth-white.webp
icons/equipment/head/hood-cloth-white-worn.webp
icons/equipment/head/hood-cowl-mask-purple.webp
icons/equipment/head/hood-green-gilded.webp
icons/equipment/head/hood-green-horns.webp
icons/equipment/head/hood-green.webp
icons/equipment/head/hood-leather-brown.webp
icons/equipment/head/hood-leather-fur-brown.webp
icons/equipment/head/hood-leather-orange-mask.webp
icons/equipment/head/hood-pink-gilded.webp
icons/equipment/head/hood-purple-mask.webp
icons/equipment/head/hood-red.webp
icons/equipment/head/hood-ringed-leather-red.webp
icons/equipment/head/hood-simple-leather-brown.webp
icons/equipment/head/hood-simple-leather-purple.webp
icons/equipment/head/mask-carved-bird-grey-pink.webp
icons/equipment/head/mask-carved-face-orange.webp
icons/equipment/head/mask-carved-gargoyle-grey.webp
icons/equipment/head/mask-carved-scream-tan.webp
icons/equipment/head/mask-carved-wood-brown.webp
icons/equipment/head/mask-carved-wood-pink.webp
icons/equipment/head/mask-carved-wood-white.webp
icons/equipment/head/mask-craved-beige.webp
icons/equipment/head/mask-horned-brown.webp
icons/equipment/head/mask-horned-skull.webp
icons/equipment/head/mask-plague-grey.webp
icons/equipment/head/mask-plague-leather-brown.webp
icons/equipment/head/mask-tiger-silver.webp
icons/equipment/head/mask-wooden-feathered-blue.webp
```

#### equipment/chest (75 icons)

```
icons/equipment/chest/breastplate-banded-blue.webp
icons/equipment/chest/breastplate-banded-leather-brown.webp
icons/equipment/chest/breastplate-banded-leather-purple.webp
icons/equipment/chest/breastplate-banded-simple-leather-brown.webp
icons/equipment/chest/breastplate-banded-steel-gold.webp
icons/equipment/chest/breastplate-banded-steel-grey.webp
icons/equipment/chest/breastplate-banded-steel-studded.webp
icons/equipment/chest/breastplate-banded-steel.webp
icons/equipment/chest/breastplate-collared-leather-brown.webp
icons/equipment/chest/breastplate-collared-leather-grey.webp
icons/equipment/chest/breastplate-collared-steel-green.webp
icons/equipment/chest/breastplate-collared-steel-grey.webp
icons/equipment/chest/breastplate-collared-steel.webp
icons/equipment/chest/breastplate-cuirass-steel-blue.webp
icons/equipment/chest/breastplate-cuirass-steel-grey.webp
icons/equipment/chest/breastplate-gorget-steel-purple.webp
icons/equipment/chest/breastplate-gorget-steel.webp
icons/equipment/chest/breastplate-gorget-steel-white.webp
icons/equipment/chest/breastplate-helmet-metal.webp
icons/equipment/chest/breastplate-layered-gilded-black.webp
icons/equipment/chest/breastplate-layered-gilded-orange.webp
icons/equipment/chest/breastplate-layered-gold.webp
icons/equipment/chest/breastplate-layered-grey.webp
icons/equipment/chest/breastplate-layered-leather-black.webp
icons/equipment/chest/breastplate-layered-leather-blue-gold.webp
icons/equipment/chest/breastplate-layered-leather-blue.webp
icons/equipment/chest/breastplate-layered-leather-brown-silver.webp
icons/equipment/chest/breastplate-layered-leather-brown.webp
icons/equipment/chest/breastplate-layered-leather-green.webp
icons/equipment/chest/breastplate-layered-leather-stitched.webp
icons/equipment/chest/breastplate-layered-leather-studded-black.webp
icons/equipment/chest/breastplate-layered-leather-studded-brown.webp
icons/equipment/chest/breastplate-layered-leather-studded.webp
icons/equipment/chest/breastplate-layered-steel-black.webp
icons/equipment/chest/breastplate-layered-steel-blue-gold.webp
icons/equipment/chest/breastplate-layered-steel-green.webp
icons/equipment/chest/breastplate-layered-steel-grey.webp
icons/equipment/chest/breastplate-layered-steel.webp
icons/equipment/chest/breastplate-leather-brown-belted.webp
icons/equipment/chest/breastplate-metal-scaled-grey.webp
icons/equipment/chest/breastplate-metal-tan.webp
icons/equipment/chest/breastplate-purple.webp
icons/equipment/chest/breastplate-quilted-brown.webp
icons/equipment/chest/breastplate-rivited-red.webp
icons/equipment/chest/breastplate-scale-grey.webp
icons/equipment/chest/breastplate-scale-leather.webp
icons/equipment/chest/breastplate-sculpted-blue.webp
icons/equipment/chest/breastplate-sculpted-green.webp
icons/equipment/chest/breastplate-sculpted-grey.webp
icons/equipment/chest/coat-collared-red-gold.webp
icons/equipment/chest/coat-collared-red.webp
icons/equipment/chest/coat-collared-studded-red.webp
icons/equipment/chest/coat-leather-blue.webp
icons/equipment/chest/collar-steel.webp
icons/equipment/chest/robe-collared-blue.webp
icons/equipment/chest/robe-collared-pink.webp
icons/equipment/chest/robe-layered-blue.webp
icons/equipment/chest/robe-layered-purple.webp
icons/equipment/chest/robe-layered-red.webp
icons/equipment/chest/robe-layered-teal.webp
icons/equipment/chest/robe-layered-white.webp
icons/equipment/chest/shirt-collared-brown.webp
icons/equipment/chest/shirt-collared-green.webp
icons/equipment/chest/shirt-collared-grey.webp
icons/equipment/chest/shirt-collared-pink.webp
icons/equipment/chest/shirt-collared-yellow.webp
icons/equipment/chest/shirt-simple-grey.webp
icons/equipment/chest/shirt-simple-tattered-grey.webp
icons/equipment/chest/shirt-simple-white.webp
icons/equipment/chest/vest-cloth-tattered-orange.webp
icons/equipment/chest/vest-cloth-tattered-tan.webp
icons/equipment/chest/vest-leather-brown-gold.webp
icons/equipment/chest/vest-leather-brown.webp
icons/equipment/chest/vest-leather-pink.webp
icons/equipment/chest/vest-leather-tattered-white.webp
```

#### equipment/feet (77 icons)

```
icons/equipment/feet/boots-armored-banded-steel.webp
icons/equipment/feet/boots-armored-brass.webp
icons/equipment/feet/boots-armored-gold.webp
icons/equipment/feet/boots-armored-green.webp
icons/equipment/feet/boots-armored-grey.webp
icons/equipment/feet/boots-armored-layered-steel.webp
icons/equipment/feet/boots-armored-leather-brown.webp
icons/equipment/feet/boots-armored-red.webp
icons/equipment/feet/boots-armored-steel-blue.webp
icons/equipment/feet/boots-armored-steel-gold.webp
icons/equipment/feet/boots-armored-steel-purple.webp
icons/equipment/feet/boots-armored-steel.webp
icons/equipment/feet/boots-armored-studded-steel.webp
icons/equipment/feet/boots-collared-blue-gold.webp
icons/equipment/feet/boots-collared-blue.webp
icons/equipment/feet/boots-collared-green.webp
icons/equipment/feet/boots-collared-leather-blue.webp
icons/equipment/feet/boots-collared-leather-brown.webp
icons/equipment/feet/boots-collared-leather-grey.webp
icons/equipment/feet/boots-collared-leather.webp
icons/equipment/feet/boots-collared-leather-white.webp
icons/equipment/feet/boots-collared-pink.webp
icons/equipment/feet/boots-collared-red.webp
icons/equipment/feet/boots-collared-rounded-brown.webp
icons/equipment/feet/boots-collared-rounded-leather.webp
icons/equipment/feet/boots-collared-simple-brown.webp
icons/equipment/feet/boots-collared-simple-leather.webp
icons/equipment/feet/boots-folded-leather-brown.webp
icons/equipment/feet/boots-galosh-white.webp
icons/equipment/feet/boots-layered-blue.webp
icons/equipment/feet/boots-leather-banded-furred.webp
icons/equipment/feet/boots-leather-banded-grey.webp
icons/equipment/feet/boots-leather-banded-pink.webp
icons/equipment/feet/boots-leather-black.webp
icons/equipment/feet/boots-leather-blue.webp
icons/equipment/feet/boots-leather-brown.webp
icons/equipment/feet/boots-leather-engraved-brown.webp
icons/equipment/feet/boots-leather-furred.webp
icons/equipment/feet/boots-leather-green.webp
icons/equipment/feet/boots-leather-grey-gold.webp
icons/equipment/feet/boots-leather-grey.webp
icons/equipment/feet/boots-leather-laced-brown.webp
icons/equipment/feet/boots-leather-pink.webp
icons/equipment/feet/boots-leather-purple.webp
icons/equipment/feet/boots-leather-red-gold.webp
icons/equipment/feet/boots-leather-red.webp
icons/equipment/feet/boots-leather-simple-blue.webp
icons/equipment/feet/boots-leather-simple-brown.webp
icons/equipment/feet/boots-leather-simple-furred.webp
icons/equipment/feet/boots-leather-simple-green.webp
icons/equipment/feet/boots-leather-teal.webp
icons/equipment/feet/boots-leather-white.webp
icons/equipment/feet/boots-plate-banded-steel-grey.webp
icons/equipment/feet/boots-plate-banded-steel.webp
icons/equipment/feet/boots-plate-black.webp
icons/equipment/feet/boots-plate-grey.webp
icons/equipment/feet/boots-plate-pointed.webp
icons/equipment/feet/boots-plate-steel-grey-blue.webp
icons/equipment/feet/boots-plate-steel-grey.webp
icons/equipment/feet/boots-plate-steel.webp
icons/equipment/feet/boots-plate-steel-white.webp
icons/equipment/feet/boots-pointed-cloth-green.webp
icons/equipment/feet/boots-simple-brown.webp
icons/equipment/feet/boots-simple-leather-brown.webp
icons/equipment/feet/boots-simple-red.webp
icons/equipment/feet/boots-simple-rounded-brown.webp
icons/equipment/feet/shoes-collared-blue.webp
icons/equipment/feet/shoes-collared-leather-blue.webp
icons/equipment/feet/shoes-leather-blue.webp
icons/equipment/feet/shoes-leather-simple-brown.webp
icons/equipment/feet/shoes-pointed-blue.webp
icons/equipment/feet/shoes-rounded-brown.webp
icons/equipment/feet/shoes-rounded-leather-blue.webp
icons/equipment/feet/shoes-rounded-pink.webp
icons/equipment/feet/shoes-simple-leaf-green.webp
icons/equipment/feet/wrappings-leather-brown.webp
icons/equipment/feet/wrappings-simple-grey.webp
```

#### equipment/neck (187 icons)

```
icons/equipment/neck/amulet-carved-runed-othila-fehu-grey.webp
icons/equipment/neck/amulet-carved-stone-bottle.webp
icons/equipment/neck/amulet-carved-stone-cross.webp
icons/equipment/neck/amulet-carved-stone-eye.webp
icons/equipment/neck/amulet-carved-stone-hammer.webp
icons/equipment/neck/amulet-carved-stone-purple.webp
icons/equipment/neck/amulet-carved-stone-spiral-blue.webp
icons/equipment/neck/amulet-carved-stone-spiral.webp
icons/equipment/neck/amulet-engraved-wood-blue.webp
icons/equipment/neck/amulet-engraved-wood-green.webp
icons/equipment/neck/amulet-engraved-wood-red.webp
icons/equipment/neck/amulet-engraved-wood.webp
icons/equipment/neck/amulet-geometric-blue-yellow.webp
icons/equipment/neck/amulet-geometric-gold-green.webp
icons/equipment/neck/amulet-geometric-gold-red.webp
icons/equipment/neck/amulet-geometric-green-orange.webp
icons/equipment/neck/amulet-geometric-purple.webp
icons/equipment/neck/amulet-geometric-stone-red.webp
icons/equipment/neck/amulet-geometric-stone.webp
icons/equipment/neck/amulet-heart.webp
icons/equipment/neck/amulet-moth-gold-green.webp
icons/equipment/neck/amulet-round-blue-grey.webp
icons/equipment/neck/amulet-round-blue.webp
icons/equipment/neck/amulet-round-brown.webp
icons/equipment/neck/amulet-round-carved-stone-green.webp
icons/equipment/neck/amulet-round-copper-green.webp
icons/equipment/neck/amulet-round-engraved-blue.webp
icons/equipment/neck/amulet-round-engraved-gold.webp
icons/equipment/neck/amulet-round-engraved-green.webp
icons/equipment/neck/amulet-round-engraved-spiral-gold.webp
icons/equipment/neck/amulet-round-faceted-green.webp
icons/equipment/neck/amulet-round-gold-blue.webp
icons/equipment/neck/amulet-round-gold-green-blue.webp
icons/equipment/neck/amulet-round-gold-green.webp
icons/equipment/neck/amulet-round-gold-red.webp
icons/equipment/neck/amulet-round-silver-blue.webp
icons/equipment/neck/amulet-round-silver-teal.webp
icons/equipment/neck/amulet-round-star-gold.webp
icons/equipment/neck/amulet-simple-carved-stone-spiral.webp
icons/equipment/neck/amulet-simple-rough-teal.webp
icons/equipment/neck/amulet-triangle-blue.webp
icons/equipment/neck/choker-carved-bone.webp
icons/equipment/neck/choker-chain-thick-gold.webp
icons/equipment/neck/choker-chain-thick-silver.webp
icons/equipment/neck/choker-chain-thin-gold.webp
icons/equipment/neck/choker-gold.webp
icons/equipment/neck/choker-rough-green.webp
icons/equipment/neck/choker-round-copper.webp
icons/equipment/neck/choker-rounded-gold-green.webp
icons/equipment/neck/choker-simple-bone-fangs.webp
icons/equipment/neck/choker-simple-bone-skull.webp
icons/equipment/neck/choker-simple-carved-stone.webp
icons/equipment/neck/choker-simple-carved-wood-grey.webp
icons/equipment/neck/choker-simple-claws.webp
icons/equipment/neck/choker-simple-teeth-red.webp
icons/equipment/neck/choker-simple-teeth.webp
icons/equipment/neck/choker-stone-gold-green.webp
icons/equipment/neck/choker-thin-silver-blue.webp
icons/equipment/neck/collar-carved-bone-heavy.webp
icons/equipment/neck/collar-carved-bone-ring.webp
icons/equipment/neck/collar-carved-bone-teeth-brown.webp
icons/equipment/neck/collar-carved-bone-teeth-red.webp
icons/equipment/neck/collar-carved-bone-teeth-ring.webp
icons/equipment/neck/collar-carved-bone-teeth.webp
icons/equipment/neck/collar-carved-bone-teeth-yellow.webp
icons/equipment/neck/collar-carved-bone.webp
icons/equipment/neck/collar-carved-runed-gimel-grey.webp
icons/equipment/neck/collar-carved-stone-cubes.webp
icons/equipment/neck/collar-carved-stone-ring.webp
icons/equipment/neck/collar-rough-blue.webp
icons/equipment/neck/collar-rough-stone-cubes.webp
icons/equipment/neck/collar-rounded-carved-wood-spiral.webp
icons/equipment/neck/collar-rounded-copper.webp
icons/equipment/neck/collar-rounded-gold-blue.webp
icons/equipment/neck/collar-rounded-gold-green.webp
icons/equipment/neck/collar-rounded-gold-pink.webp
icons/equipment/neck/collar-rounded-gold-purple.webp
icons/equipment/neck/collar-rounded-pearl.webp
icons/equipment/neck/collar-rounded-red.webp
icons/equipment/neck/collar-rounded-simple-stone.webp
icons/equipment/neck/collar-stone-red.webp
icons/equipment/neck/handkerchief-bandana-blue.webp
icons/equipment/neck/necklace-anchor.webp
icons/equipment/neck/necklace-animal-lizard.webp
icons/equipment/neck/necklace-animal-scarab.webp
icons/equipment/neck/necklace-animal-scorpion.webp
icons/equipment/neck/necklace-animal-spider-purple.webp
icons/equipment/neck/necklace-animal-spider-silver.webp
icons/equipment/neck/necklace-astrology-moon-blue.webp
icons/equipment/neck/necklace-astrology-moon-gold.webp
icons/equipment/neck/necklace-astrology-moon-purple.webp
icons/equipment/neck/necklace-astrology-sun-gold.webp
icons/equipment/neck/necklace-carved-bone-skull.webp
icons/equipment/neck/necklace-carved-bone.webp
icons/equipment/neck/necklace-carved-lantern-gold.webp
icons/equipment/neck/necklace-carved-stone-spiral.webp
icons/equipment/neck/necklace-carved-stone.webp
icons/equipment/neck/necklace-carved-stone-wood.webp
icons/equipment/neck/necklace-charm-clover.webp
icons/equipment/neck/necklace-eye-orange.webp
icons/equipment/neck/necklace-eye-purple-green.webp
icons/equipment/neck/necklace-faceted-carved-stone.webp
icons/equipment/neck/necklace-faceted-gold-green.webp
icons/equipment/neck/necklace-floral-wood.webp
icons/equipment/neck/necklace-hook-brown.webp
icons/equipment/neck/necklace-jeweled-gold-red.webp
icons/equipment/neck/necklace-jeweled-silver-blue.webp
icons/equipment/neck/necklace-runed-sowelu-teal.webp
icons/equipment/neck/necklace-runed-white-red.webp
icons/equipment/neck/necklace-shell-purple.webp
icons/equipment/neck/necklace-shells-blue.webp
icons/equipment/neck/necklace-shells-brown.webp
icons/equipment/neck/necklace-shells-pink.webp
icons/equipment/neck/necklace-simple-bead-dice.webp
icons/equipment/neck/necklace-simple-bead-green.webp
icons/equipment/neck/necklace-simple-bead-grey.webp
icons/equipment/neck/necklace-simple-bone-claws.webp
icons/equipment/neck/necklace-simple-bone-skull.webp
icons/equipment/neck/necklace-simple-bone.webp
icons/equipment/neck/necklace-simple-carved-arrow.webp
icons/equipment/neck/necklace-simple-carved-spiral-blue.webp
icons/equipment/neck/necklace-simple-carved-stone-grey.webp
icons/equipment/neck/necklace-simple-carved-stone.webp
icons/equipment/neck/necklace-simple-carved-wood-green.webp
icons/equipment/neck/necklace-simple-carved-wood.webp
icons/equipment/neck/necklace-simple-claw-blue.webp
icons/equipment/neck/necklace-simple-claw.webp
icons/equipment/neck/necklace-simple-engraved-stone.webp
icons/equipment/neck/necklace-simple-feather-red-brown.webp
icons/equipment/neck/necklace-simple-feathers-blue.webp
icons/equipment/neck/necklace-simple-hook-stone.webp
icons/equipment/neck/Necklace-simple-jewel-purple.webp
icons/equipment/neck/necklace-simple-leaves.webp
icons/equipment/neck/necklace-simple-mushroom-red.webp
icons/equipment/neck/necklace-simple-mushroom.webp
icons/equipment/neck/necklace-simple-rough-stone.webp
icons/equipment/neck/necklace-simple-round-carved-wood.webp
icons/equipment/neck/necklace-simple-rune-fehu-yellow.webp
icons/equipment/neck/necklace-simple-teeth.webp
icons/equipment/neck/necklace-triquetra-silver.webp
icons/equipment/neck/necklace-vines-orange.webp
icons/equipment/neck/pendant-bronze-gem-blue.webp
icons/equipment/neck/pendant-enamel.webp
icons/equipment/neck/pendant-faceted-blue.webp
icons/equipment/neck/pendant-faceted-gold-green.webp
icons/equipment/neck/pendant-faceted-green-blue.webp
icons/equipment/neck/pendant-faceted-green.webp
icons/equipment/neck/pendant-faceted-orange.webp
icons/equipment/neck/pendant-faceted-purple.webp
icons/equipment/neck/pendant-faceted-red.webp
icons/equipment/neck/pendant-faceted-silver-green.webp
icons/equipment/neck/pendant-faceted-silver-red.webp
icons/equipment/neck/pendant-feather-bead-green.webp
icons/equipment/neck/pendant-gold-anchor.webp
icons/equipment/neck/pendant-gold-crystal-blue.webp
icons/equipment/neck/pendant-gold-crystal-green.webp
icons/equipment/neck/pendant-gold-emerald.webp
icons/equipment/neck/pendant-gold-hook.webp
icons/equipment/neck/pendant-rough-blue.webp
icons/equipment/neck/pendant-rough-copper-green.webp
icons/equipment/neck/pendant-rough-gold-green.webp
icons/equipment/neck/pendant-rough-gold-purple.webp
icons/equipment/neck/pendant-rough-green.webp
icons/equipment/neck/pendant-rough-leaves-green.webp
icons/equipment/neck/pendant-rough-orange.webp
icons/equipment/neck/pendant-rough-pink.webp
icons/equipment/neck/pendant-rough-purple.webp
icons/equipment/neck/pendant-rough-red.webp
icons/equipment/neck/pendant-rough-silver-blue.webp
icons/equipment/neck/pendant-rough-silver-purple.webp
icons/equipment/neck/pendant-rough-silver-red.webp
icons/equipment/neck/pendant-round-blue.webp
icons/equipment/neck/pendant-rounded-blue.webp
icons/equipment/neck/pendant-round-gold-blue.webp
icons/equipment/neck/pendant-round-green.webp
icons/equipment/neck/pendant-round-silver-red.webp
icons/equipment/neck/pendant-round-teal.webp
icons/equipment/neck/pendant-runed-hagalz-blue.webp
icons/equipment/neck/pendant-silver-anchor.webp
icons/equipment/neck/pendant-silver-pink.webp
icons/equipment/neck/pendant-silver-red.webp
icons/equipment/neck/pendant-simple-claw.webp
icons/equipment/neck/pendant-simple-tooth-green.webp
icons/equipment/neck/pendant-simple-tooth.webp
icons/equipment/neck/pendant-tooth.webp
icons/equipment/neck/torc-ball-captive.webp
icons/equipment/neck/torc-striped-blue.webp
```

#### equipment/back (69 icons)

```
icons/equipment/back/cape-layered-blue-accent.webp
icons/equipment/back/cape-layered-blue.webp
icons/equipment/back/cape-layered-brown-gold.webp
icons/equipment/back/cape-layered-green-eye.webp
icons/equipment/back/cape-layered-green.webp
icons/equipment/back/cape-layered-orange.webp
icons/equipment/back/cape-layered-pink.webp
icons/equipment/back/cape-layered-purple.webp
icons/equipment/back/cape-layered-red.webp
icons/equipment/back/cape-layered-red-white.webp
icons/equipment/back/cape-layered-simple-brown.webp
icons/equipment/back/cape-layered-tattered-brown-grey.webp
icons/equipment/back/cape-layered-tattered-brown.webp
icons/equipment/back/cape-layered-tattered-grey.webp
icons/equipment/back/cape-layered-tattered-teal.webp
icons/equipment/back/cape-layered-violet-white-accent.webp
icons/equipment/back/cape-layered-violet-white-swirl.webp
icons/equipment/back/cloak-brown-accent-brown-layered-collared-fur.webp
icons/equipment/back/cloak-brown-collared-fur-white-tied.webp
icons/equipment/back/cloak-brown-collared-padded.webp
icons/equipment/back/cloak-brown-fur-brown.webp
icons/equipment/back/cloak-brown-fur-white.webp
icons/equipment/back/cloak-brown.webp
icons/equipment/back/cloak-collared-blue-gold.webp
icons/equipment/back/cloak-collared-blue-iron.webp
icons/equipment/back/cloak-collared-blue.webp
icons/equipment/back/cloak-collared-feathers-green.webp
icons/equipment/back/cloak-collared-grey-gold.webp
icons/equipment/back/cloak-collared-grey.webp
icons/equipment/back/cloak-collared-leaves-green.webp
icons/equipment/back/cloak-collared-orange.webp
icons/equipment/back/cloak-collared-pink-gold.webp
icons/equipment/back/cloak-collared-pink.webp
icons/equipment/back/cloak-collared-purple-gold.webp
icons/equipment/back/cloak-collared-red-gold.webp
icons/equipment/back/cloakcollared-red-gold.webp
icons/equipment/back/cloak-collared-red-silver.webp
icons/equipment/back/cloak-collared-red.webp
icons/equipment/back/cloak-collared-teal.webp
icons/equipment/back/cloak-fur-brown.webp
icons/equipment/back/cloak-heavy-black-red.webp
icons/equipment/back/cloak-heavy-collared-fur-green.webp
icons/equipment/back/cloak-heavy-fur-blue.webp
icons/equipment/back/cloak-hooded-blue.webp
icons/equipment/back/cloak-hooded-green-gold.webp
icons/equipment/back/cloak-hooded-jewels-green.webp
icons/equipment/back/cloak-hooded-pink.webp
icons/equipment/back/cloak-hooded-red.webp
icons/equipment/back/cloak-hooeded-blue.webp
icons/equipment/back/cloak-layered-green-brown.webp
icons/equipment/back/cloak-layered-green-grey.webp
icons/equipment/back/cloak-layered-green.webp
icons/equipment/back/cloak-layered-green-yellow.webp
icons/equipment/back/cloak-layered-grey.webp
icons/equipment/back/cloak-layered-grey-white.webp
icons/equipment/back/cloak-layered-pink.webp
icons/equipment/back/cloak-layered-red-orange.webp
icons/equipment/back/cloak-layered-tattered-purple.webp
icons/equipment/back/cloak-layered-white.webp
icons/equipment/back/cloak-plain-blue.webp
icons/equipment/back/cloak-plain-green.webp
icons/equipment/back/cloak-plain-white.webp
icons/equipment/back/cloak-simple-tan.webp
icons/equipment/back/mantle-collared-black.webp
icons/equipment/back/mantle-collared-blue.webp
icons/equipment/back/mantle-collared-brown.webp
icons/equipment/back/mantle-collared-green.webp
icons/equipment/back/mantle-collared-leather.webp
icons/equipment/back/mantle-collared-white.webp
```

### Weapons Icons (For Weapon Feats)

#### weapons/swords (88 icons)

```
icons/weapons/swords/greatsword-blue.webp
icons/weapons/swords/greatsword-crossguard-barbed.webp
icons/weapons/swords/greatsword-crossguard-blue.webp
icons/weapons/swords/greatsword-crossguard-curved.webp
icons/weapons/swords/greatsword-crossguard-embossed-gold.webp
icons/weapons/swords/greatsword-crossguard-engraved-green.webp
icons/weapons/swords/greatsword-crossguard-flanged-purple.webp
icons/weapons/swords/greatsword-crossguard-flanged-red.webp
icons/weapons/swords/greatsword-crossguard-flanged.webp
icons/weapons/swords/greatsword-crossguard-silver.webp
icons/weapons/swords/greatsword-crossguard-steel.webp
icons/weapons/swords/greatsword-evil-green.webp
icons/weapons/swords/greatsword-flamberge.webp
icons/weapons/swords/greatsword-guard-gem-blue.webp
icons/weapons/swords/greatsword-guard-gold.webp
icons/weapons/swords/greatsword-guard-gold-worn.webp
icons/weapons/swords/greatsword-guard-jewel-green.webp
icons/weapons/swords/greatsword-guard-split-eyes.webp
icons/weapons/swords/greatsword-guard.webp
icons/weapons/swords/greatsword-sheathed.webp
icons/weapons/swords/scimitar-blue.webp
icons/weapons/swords/scimitar-bone.webp
icons/weapons/swords/scimitar-broad.webp
icons/weapons/swords/scimitar-guard-brown.webp
icons/weapons/swords/scimitar-guard-gold.webp
icons/weapons/swords/scimitar-guard-red.webp
icons/weapons/swords/scimitar-guard.webp
icons/weapons/swords/scimitar-guard-wood.webp
icons/weapons/swords/scimitar-worn-blue.webp
icons/weapons/swords/shortsword-broad-blue.webp
icons/weapons/swords/shortsword-broad-engraved.webp
icons/weapons/swords/shortsword-broad.webp
icons/weapons/swords/shortsword-green.webp
icons/weapons/swords/shortsword-guard-brass.webp
icons/weapons/swords/shortsword-guard-brown.webp
icons/weapons/swords/shortsword-guard-gold-red.webp
icons/weapons/swords/shortsword-guard-gold.webp
icons/weapons/swords/shortsword-guard-green.webp
icons/weapons/swords/shortsword-guard-silver.webp
icons/weapons/swords/shortsword-guard-steel-worn.webp
icons/weapons/swords/shortsword-guard.webp
icons/weapons/swords/shortsword-guard-worn.webp
icons/weapons/swords/shortsword-hooked-blue.webp
icons/weapons/swords/shortsword-sheathed-brown.webp
icons/weapons/swords/shortsword-simple.webp
icons/weapons/swords/shortsword-winged.webp
icons/weapons/swords/sword-broad-crystal-paired.webp
icons/weapons/swords/sword-broad-red.webp
icons/weapons/swords/sword-broad-serrated-blue.webp
icons/weapons/swords/sword-broad-worn.webp
icons/weapons/swords/sword-flamberge.webp
icons/weapons/swords/sword-flanged-lightning.webp
icons/weapons/swords/sword-gold-holy.webp
icons/weapons/swords/sword-guard-blue.webp
icons/weapons/swords/sword-guard-brass-worn.webp
icons/weapons/swords/sword-guard-bronze.webp
icons/weapons/swords/sword-guard-brown.webp
icons/weapons/swords/sword-guard-embossed-green.webp
icons/weapons/swords/sword-guard-engraved.webp
icons/weapons/swords/sword-guard-engraved-worn.webp
icons/weapons/swords/sword-guard-flanged-purple.webp
icons/weapons/swords/sword-guard-flanged.webp
icons/weapons/swords/sword-guard-gold-red.webp
icons/weapons/swords/sword-guard-purple.webp
icons/weapons/swords/sword-guard-red-jewel.webp
icons/weapons/swords/sword-guard-red.webp
icons/weapons/swords/sword-guard-serrated.webp
icons/weapons/swords/sword-guard-steel-green.webp
icons/weapons/swords/sword-guard.webp
icons/weapons/swords/sword-guard-worn-brown.webp
icons/weapons/swords/sword-guard-worn-gold.webp
icons/weapons/swords/sword-guard-worn-purple.webp
icons/weapons/swords/sword-guard-worn.webp
icons/weapons/swords/sword-hilt-steel-green.webp
icons/weapons/swords/sword-hooked-engraved.webp
icons/weapons/swords/sword-hooked.webp
icons/weapons/swords/sword-hooked-worn.webp
icons/weapons/swords/sword-jeweled-red.webp
icons/weapons/swords/sword-katana-purple.webp
icons/weapons/swords/sword-katana.webp
icons/weapons/swords/sword-machete-white.webp
icons/weapons/swords/sword-ringed-engraved.webp
icons/weapons/swords/sword-runed-glowing.webp
icons/weapons/swords/swords-cutlasses-white.webp
icons/weapons/swords/sword-simple-white.webp
icons/weapons/swords/swords-sharp-worn.webp
icons/weapons/swords/swords-short.webp
icons/weapons/swords/sword-winged-pink.webp
```

#### weapons/thrown (39 icons)

```
icons/weapons/thrown/ball-spiked.webp
icons/weapons/thrown/bolas-steel.webp
icons/weapons/thrown/bolas-stone.webp
icons/weapons/thrown/bomb-detonator.webp
icons/weapons/thrown/bomb-fuse-black-grey.webp
icons/weapons/thrown/bomb-fuse-black-pink.webp
icons/weapons/thrown/bomb-fuse-black.webp
icons/weapons/thrown/bomb-fuse-blue.webp
icons/weapons/thrown/bomb-fuse-brown-grey.webp
icons/weapons/thrown/bomb-fuse-brown.webp
icons/weapons/thrown/bomb-fuse-cloth-pink.webp
icons/weapons/thrown/bomb-fuse-pink.webp
icons/weapons/thrown/bomb-fuse-red-black.webp
icons/weapons/thrown/bomb-gas-grey-purple.webp
icons/weapons/thrown/bomb-metal-brown.webp
icons/weapons/thrown/bomb-pressure-black.webp
icons/weapons/thrown/bomb-purple.webp
icons/weapons/thrown/bomb-spiked-purple.webp
icons/weapons/thrown/bomb-timer.webp
icons/weapons/thrown/dagger-ringed-blue.webp
icons/weapons/thrown/dagger-ringed-engraved-green.webp
icons/weapons/thrown/dagger-ringed-grey.webp
icons/weapons/thrown/dagger-ringed-guard.webp
icons/weapons/thrown/dagger-ringed-hollow.webp
icons/weapons/thrown/dagger-ringed-steel.webp
icons/weapons/thrown/daggers-guard-gold.webp
icons/weapons/thrown/daggers-guard-green.webp
icons/weapons/thrown/dagger-simple.webp
icons/weapons/thrown/dagger-simple-wood.webp
icons/weapons/thrown/daggers-kunai-purple.webp
icons/weapons/thrown/dart-feathered.webp
icons/weapons/thrown/dynamite-black.webp
icons/weapons/thrown/dynamite-red.webp
icons/weapons/thrown/dynamite-simple-brown.webp
icons/weapons/thrown/grenade-round.webp
icons/weapons/thrown/rocket.webp
icons/weapons/thrown/shuriken-blue.webp
icons/weapons/thrown/shuriken-double-red.webp
icons/weapons/thrown/shuriken-triple-purple.webp
```

#### weapons/axes (99 icons)

```
icons/weapons/axes/axe-battle-blackened.webp
icons/weapons/axes/axe-battle-black.webp
icons/weapons/axes/axe-battle-broad-nooks.webp
icons/weapons/axes/axe-battle-broad-stone.webp
icons/weapons/axes/axe-battle-elemental-lava.webp
icons/weapons/axes/axe-battle-engraved-purple.webp
icons/weapons/axes/axe-battle-eyes-red.webp
icons/weapons/axes/axe-battle-green.webp
icons/weapons/axes/axe-battle-heavy-black.webp
icons/weapons/axes/axe-battle-heavy-jagged.webp
icons/weapons/axes/axe-battle-jagged.webp
icons/weapons/axes/axe-battle-orange.webp
icons/weapons/axes/axe-battle-simple-black.webp
icons/weapons/axes/axe-battle-simple.webp
icons/weapons/axes/axe-battle-skull-black.webp
icons/weapons/axes/axe-battle.webp
icons/weapons/axes/axe-battle-worn-black.webp
icons/weapons/axes/axe-battle-worn-eye.webp
icons/weapons/axes/axe-battle-worn.webp
icons/weapons/axes/axe-broad-black.webp
icons/weapons/axes/axe-broad-brown.webp
icons/weapons/axes/axe-broad-chipped-glow-yellow.webp
icons/weapons/axes/axe-broad-crescent-gray.webp
icons/weapons/axes/axe-broad-energy-pink.webp
icons/weapons/axes/axe-broad-engraved-black-grey.webp
icons/weapons/axes/axe-broad-engraved-black.webp
icons/weapons/axes/axe-broad-engraved-chipped-blue.webp
icons/weapons/axes/axe-broad-engraved-grey.webp
icons/weapons/axes/axe-broad-engraved.webp
icons/weapons/axes/axe-broad-grey.webp
icons/weapons/axes/axe-broad-hooked.webp
icons/weapons/axes/axe-broad-jagged.webp
icons/weapons/axes/axe-broad-notched.webp
icons/weapons/axes/axe-broad-purple.webp
icons/weapons/axes/axe-broad-simple-black.webp
icons/weapons/axes/axe-broad-simple.webp
icons/weapons/axes/axe-broad-white.webp
icons/weapons/axes/axe-broad-worn-blue.webp
icons/weapons/axes/axe-broad-worn.webp
icons/weapons/axes/axe-broad-worn-yellow.webp
icons/weapons/axes/axe-crooked-blackened.webp
icons/weapons/axes/axe-crooked-crystal-pink.webp
icons/weapons/axes/axe-double-black.webp
icons/weapons/axes/axe-double-blue.webp
icons/weapons/axes/axe-double-brown.webp
icons/weapons/axes/axe-double-chopping-black.webp
icons/weapons/axes/axe-double-engraved-black.webp
icons/weapons/axes/axe-double-engraved-blue.webp
icons/weapons/axes/axe-double-engraved-runes.webp
icons/weapons/axes/axe-double-engraved.webp
icons/weapons/axes/axe-double-evil.webp
icons/weapons/axes/axe-double-gold.webp
icons/weapons/axes/axe-double-ice-blue.webp
icons/weapons/axes/axe-double-jagged-black.webp
icons/weapons/axes/axe-double-short-orange.webp
icons/weapons/axes/axe-double-simple-black.webp
icons/weapons/axes/axe-double-simple-brown.webp
icons/weapons/axes/axe-double-simple-red.webp
icons/weapons/axes/axe-double-simple-worn-black.webp
icons/weapons/axes/axe-double.webp
icons/weapons/axes/axe-double-white-red.webp
icons/weapons/axes/axe-double-worn-brown.webp
icons/weapons/axes/axe-hammer-blackened.webp
icons/weapons/axes/axe-pick-white.webp
icons/weapons/axes/axe-simple-black.webp
icons/weapons/axes/axe-simple-brown.webp
icons/weapons/axes/axe-simple-grey.webp
icons/weapons/axes/axe-simple-jagged.webp
icons/weapons/axes/axe-simple-purple-black.webp
icons/weapons/axes/axe-tomahawk-engraved.webp
icons/weapons/axes/axe-tomahawk-jagged.webp
icons/weapons/axes/axe-tomahawk-simple-black.webp
icons/weapons/axes/axe-tomahawk-simple-grey.webp
icons/weapons/axes/cleaver-black.webp
icons/weapons/axes/cleaver-red.webp
icons/weapons/axes/pickaxe-bone-black.webp
icons/weapons/axes/pickaxe-bone-purple.webp
icons/weapons/axes/pickaxe-bone-red.webp
icons/weapons/axes/pickaxe-bone.webp
icons/weapons/axes/pickaxe-double-black.webp
icons/weapons/axes/pickaxe-double-brown.webp
icons/weapons/axes/pickaxe-double-stone.webp
icons/weapons/axes/pickaxe-gray.webp
icons/weapons/axes/pickaxe-iron-green.webp
icons/weapons/axes/pickaxe-jagged-black.webp
icons/weapons/axes/pickaxe-stone-black.webp
icons/weapons/axes/pickaxe-stone-green.webp
icons/weapons/axes/pickaxe-stone-jagged-orange.webp
icons/weapons/axes/pickaxe-stone-jagged-red.webp
icons/weapons/axes/pickaxe-stone-red.webp
icons/weapons/axes/pickaxe-stone-simple.webp
icons/weapons/axes/shortaxe-black.webp
icons/weapons/axes/shortaxe-curved-black.webp
icons/weapons/axes/shortaxe-engraved-green.webp
icons/weapons/axes/shortaxe-hammer-steel.webp
icons/weapons/axes/shortaxe-simple-black.webp
icons/weapons/axes/shortaxe-tribal.webp
icons/weapons/axes/shortaxe-worn-black.webp
icons/weapons/axes/shortaxe-yellow.webp
```

#### weapons/hammers (39 icons)

```
icons/weapons/hammers/hammer-double-bronze.webp
icons/weapons/hammers/hammer-double-engraved-gold.webp
icons/weapons/hammers/hammer-double-engraved-green.webp
icons/weapons/hammers/hammer-double-engraved-ruby.webp
icons/weapons/hammers/hammer-double-engraved.webp
icons/weapons/hammers/hammer-double-glowing-yellow.webp
icons/weapons/hammers/hammer-double-simple.webp
icons/weapons/hammers/hammer-double-simple-worn.webp
icons/weapons/hammers/hammer-double-sledge-engraved.webp
icons/weapons/hammers/hammer-double-steel-embossed.webp
icons/weapons/hammers/hammer-double-steel.webp
icons/weapons/hammers/hammer-double-stone.webp
icons/weapons/hammers/hammer-double-stone-worn.webp
icons/weapons/hammers/hammer-double-studded.webp
icons/weapons/hammers/hammer-double-wood-banded.webp
icons/weapons/hammers/hammer-double-wood.webp
icons/weapons/hammers/hammer-drilling-spiked.webp
icons/weapons/hammers/hammer-mallet-black.webp
icons/weapons/hammers/hammer-mallet-gold.webp
icons/weapons/hammers/hammer-mallet-wood-banded.webp
icons/weapons/hammers/hammer-mallet-wood.webp
icons/weapons/hammers/hammer-simple-iron.webp
icons/weapons/hammers/hammer-square-white.webp
icons/weapons/hammers/hammer-war-rounding.webp
icons/weapons/hammers/hammer-war-spiked-simple.webp
icons/weapons/hammers/hammer-war-spiked.webp
icons/weapons/hammers/shorthammer-claw-stone.webp
icons/weapons/hammers/shorthammer-claw.webp
icons/weapons/hammers/shorthammer-double-bronze-worn.webp
icons/weapons/hammers/shorthammer-double-simple.webp
icons/weapons/hammers/shorthammer-double-steel-embossed.webp
icons/weapons/hammers/shorthammer-double-steel.webp
icons/weapons/hammers/shorthammer-double-stone-engraved.webp
icons/weapons/hammers/shorthammer-double-stone.webp
icons/weapons/hammers/shorthammer-embossed-white.webp
icons/weapons/hammers/shorthammer-simple-iron-black.webp
icons/weapons/hammers/shorthammer-simple-stone-brown.webp
icons/weapons/hammers/shorthammer-simple-stone.webp
icons/weapons/hammers/shorthammer-simple-yellow.webp
```

#### weapons/polearms (68 icons)

```
icons/weapons/polearms/glaive-hooked-steel.webp
icons/weapons/polearms/glaive-simple-hooked.webp
icons/weapons/polearms/glaive-simple.webp
icons/weapons/polearms/halberd-crescent-engraved-steel.webp
icons/weapons/polearms/halberd-crescent-engraved.webp
icons/weapons/polearms/halberd-crescent-glowing.webp
icons/weapons/polearms/halberd-crescent-small-spiked.webp
icons/weapons/polearms/halberd-crescent-steel.webp
icons/weapons/polearms/halberd-crescent-stone-worn.webp
icons/weapons/polearms/halberd-crescent-wood.webp
icons/weapons/polearms/halberd-crescent-worn-steel.webp
icons/weapons/polearms/halberd-crescent-worn.webp
icons/weapons/polearms/halberd-curved-steel.webp
icons/weapons/polearms/halberd-engraved-black.webp
icons/weapons/polearms/halberd-engraved-steel.webp
icons/weapons/polearms/halberd-hooked-engraved-steel.webp
icons/weapons/polearms/halberd-worn-steel.webp
icons/weapons/polearms/javelin-flared.webp
icons/weapons/polearms/javelin-hooked.webp
icons/weapons/polearms/javelin-simple.webp
icons/weapons/polearms/javelin.webp
icons/weapons/polearms/pike-flared-brown.webp
icons/weapons/polearms/pike-flared-red.webp
icons/weapons/polearms/spear-barbed-silver.webp
icons/weapons/polearms/spear-flared-blue.webp
icons/weapons/polearms/spear-flared-bronze-teal.webp
icons/weapons/polearms/spear-flared-gold.webp
icons/weapons/polearms/spear-flared-gray.webp
icons/weapons/polearms/spear-flared-green.webp
icons/weapons/polearms/spear-flared-purple.webp
icons/weapons/polearms/spear-flared-silver-pink.webp
icons/weapons/polearms/spear-flared-steel.webp
icons/weapons/polearms/spear-flared-worn-grey.webp
icons/weapons/polearms/spear-flared-worn.webp
icons/weapons/polearms/spear-flared-wrapped.webp
icons/weapons/polearms/spear-hooked-blue.webp
icons/weapons/polearms/spear-hooked-broad.webp
icons/weapons/polearms/spear-hooked-brown.webp
icons/weapons/polearms/spear-hooked-double-engraved.webp
icons/weapons/polearms/spear-hooked-double-jeweled.webp
icons/weapons/polearms/spear-hooked-double.webp
icons/weapons/polearms/spear-hooked-red.webp
icons/weapons/polearms/spear-hooked-rounded.webp
icons/weapons/polearms/spear-hooked-simple-blue.webp
icons/weapons/polearms/spear-hooked-simple.webp
icons/weapons/polearms/spear-hooked-spike.webp
icons/weapons/polearms/spear-ice-crystal-blue.webp
icons/weapons/polearms/spear-ornate-gold.webp
icons/weapons/polearms/spear-ornate-teal.webp
icons/weapons/polearms/spear-simple-barbed.webp
icons/weapons/polearms/spear-simple-crescent.webp
icons/weapons/polearms/spear-simple-double.webp
icons/weapons/polearms/spear-simple-engraved.webp
icons/weapons/polearms/spear-simple-hooked-grey.webp
icons/weapons/polearms/spear-simple-hooked.webp
icons/weapons/polearms/spear-simple-jagged.webp
icons/weapons/polearms/spear-simple-red-blue.webp
icons/weapons/polearms/spear-simple-stone-green.webp
icons/weapons/polearms/spear-simple-stone.webp
icons/weapons/polearms/speartip-simple-stone.webp
icons/weapons/polearms/spear-tips-simple.webp
icons/weapons/polearms/trident-curved-steel.webp
icons/weapons/polearms/trident-fork-white.webp
icons/weapons/polearms/trident-ice-blue.webp
icons/weapons/polearms/trident-jeweled-purple.webp
icons/weapons/polearms/trident-ornate-red.webp
icons/weapons/polearms/trident-silver-blue.webp
icons/weapons/polearms/trident-silver-red.webp
```

#### weapons/staves (68 icons)

```
icons/weapons/staves/broom-yellow-purple.webp
icons/weapons/staves/staff-animal-bird.webp
icons/weapons/staves/staff-animal-bull.webp
icons/weapons/staves/staff-animal-skull-bull.webp
icons/weapons/staves/staff-animal-skull-feathers.webp
icons/weapons/staves/staff-animal-skull-horn-brown.webp
icons/weapons/staves/staff-animal-skull-horned.webp
icons/weapons/staves/staff-animal-skull.webp
icons/weapons/staves/staff-blue-jewel.webp
icons/weapons/staves/staff-crescent-green.webp
icons/weapons/staves/staff-crescent-purple.webp
icons/weapons/staves/staff-engraved-red.webp
icons/weapons/staves/staff-engraved-wood.webp
icons/weapons/staves/staff-forest-gold.webp
icons/weapons/staves/staff-forest-green.webp
icons/weapons/staves/staff-forest-hooked.webp
icons/weapons/staves/staff-forest-jewel.webp
icons/weapons/staves/staff-forest-spiral.webp
icons/weapons/staves/staff-forked-wood.webp
icons/weapons/staves/staff-hooked-banded.webp
icons/weapons/staves/staff-mended.webp
icons/weapons/staves/staff-metal-mask.webp
icons/weapons/staves/staff-nature-spiral.webp
icons/weapons/staves/staff-nature.webp
icons/weapons/staves/staff-obsidian.webp
icons/weapons/staves/staff-orante-gold.webp
icons/weapons/staves/staff-orb-feather.webp
icons/weapons/staves/staff-orb-purple.webp
icons/weapons/staves/staff-orb-red.webp
icons/weapons/staves/staff-ornate-banded-purple.webp
icons/weapons/staves/staff-ornate-bird.webp
icons/weapons/staves/staff-ornate-blue-jewel.webp
icons/weapons/staves/staff-ornate-blue.webp
icons/weapons/staves/staff-ornate-cross.webp
icons/weapons/staves/staff-ornate-engraved-blue.webp
icons/weapons/staves/staff-ornate-eye.webp
icons/weapons/staves/staff-ornate-gold-jeweled.webp
icons/weapons/staves/staff-ornate-green.webp
icons/weapons/staves/staff-ornate-hook.webp
icons/weapons/staves/staff-ornate-jeweled-blue.webp
icons/weapons/staves/staff-ornate-orb-steel-red.webp
icons/weapons/staves/staff-ornate-purple.webp
icons/weapons/staves/staff-ornate-red.webp
icons/weapons/staves/staff-ornate-teal.webp
icons/weapons/staves/staff-ornate.webp
icons/weapons/staves/staff-ornate-wood-red.webp
icons/weapons/staves/staff-ornate-wood.webp
icons/weapons/staves/staff-simple-blue.webp
icons/weapons/staves/staff-simple-brown.webp
icons/weapons/staves/staff-simple-carved.webp
icons/weapons/staves/staff-simple-gold.webp
icons/weapons/staves/staff-simple-green.webp
icons/weapons/staves/staff-simple-hooked.webp
icons/weapons/staves/staff-simple-jeweled-green.webp
icons/weapons/staves/staff-simple-knotted.webp
icons/weapons/staves/staff-simple-spiral-brown.webp
icons/weapons/staves/staff-simple-spiral-green.webp
icons/weapons/staves/staff-simple-spiral-grey.webp
icons/weapons/staves/staff-simple-spiral.webp
icons/weapons/staves/staff-simple.webp
icons/weapons/staves/staff-simple-wrapped.webp
icons/weapons/staves/staff-skull-brown.webp
icons/weapons/staves/staff-skull-feathers-brown.webp
icons/weapons/staves/staff-skull-feathers.webp
icons/weapons/staves/staff-spiked-grey.webp
icons/weapons/staves/staff-spiked.webp
icons/weapons/staves/staff-vines-green.webp
icons/weapons/staves/staff-winged-red.webp
```

#### weapons/bows (22 icons)

```
icons/weapons/bows/bow-ornamental-carved-brown.webp
icons/weapons/bows/bow-ornamental-gold-blue.webp
icons/weapons/bows/bow-ornamental-silver-black.webp
icons/weapons/bows/bow-recurve-black.webp
icons/weapons/bows/longbow-gold-pink.webp
icons/weapons/bows/longbow-leather-green.webp
icons/weapons/bows/longbow-recurve-brown.webp
icons/weapons/bows/longbow-recurve-leather-brown.webp
icons/weapons/bows/longbow-recurve-leather-red.webp
icons/weapons/bows/longbow-recurve-skull-brown.webp
icons/weapons/bows/longbow-recurve.webp
icons/weapons/bows/shortbow-arrows-black.webp
icons/weapons/bows/shortbow-leather.webp
icons/weapons/bows/shortbow-leaves-green.webp
icons/weapons/bows/shortbow-recurve-blue.webp
icons/weapons/bows/shortbow-recurve-bone.webp
icons/weapons/bows/shortbow-recurve-leather.webp
icons/weapons/bows/shortbow-recurve-red.webp
icons/weapons/bows/shortbow-recurve.webp
icons/weapons/bows/shortbow-recurve-yellow-blue.webp
icons/weapons/bows/shortbow-recurve-yellow.webp
icons/weapons/bows/shortbow-white.webp
```

#### weapons/crossbows (16 icons)

```
icons/weapons/crossbows/crossbow-blue.webp
icons/weapons/crossbows/crossbow-golden-bolt.webp
icons/weapons/crossbows/crossbow-heavy-black.webp
icons/weapons/crossbows/crossbow-loaded-black.webp
icons/weapons/crossbows/crossbow-long-brown.webp
icons/weapons/crossbows/crossbow-ornamental-black.webp
icons/weapons/crossbows/crossbow-ornamental-winged.webp
icons/weapons/crossbows/crossbow-purple.webp
icons/weapons/crossbows/crossbow-simple-black.webp
icons/weapons/crossbows/crossbow-simple-brown.webp
icons/weapons/crossbows/crossbow-simple-purple.webp
icons/weapons/crossbows/crossbow-simple-red.webp
icons/weapons/crossbows/crossbow-slotted.webp
icons/weapons/crossbows/crossbow-white.webp
icons/weapons/crossbows/handcrossbow-black.webp
icons/weapons/crossbows/handcrossbow-green.webp
```

### Commodities Icons (For Special Items)

#### commodities/gems (157 icons)

Perfect for psicrystal-related feats.

```
icons/commodities/gems/gem-amber-insect-orange.webp
icons/commodities/gems/gem-cluster-blue-white.webp
icons/commodities/gems/gem-cluster-pink.webp
icons/commodities/gems/gem-cluster-purple.webp
icons/commodities/gems/gem-cluster-red.webp
icons/commodities/gems/gem-cluster-teal.webp
icons/commodities/gems/gem-cut-faceted-princess-purple.webp
icons/commodities/gems/gem-cut-faceted-square-purple.webp
icons/commodities/gems/gem-cut-square-green.webp
icons/commodities/gems/gem-cut-table-green.webp
icons/commodities/gems/gem-faceted-asscher-blue.webp
icons/commodities/gems/gem-faceted-cushion-teal-black.webp
icons/commodities/gems/gem-faceted-cushion-teal.webp
icons/commodities/gems/gem-faceted-diamond-blue.webp
icons/commodities/gems/gem-faceted-diamond-green.webp
icons/commodities/gems/gem-faceted-diamond-pink-gold.webp
icons/commodities/gems/gem-faceted-diamond-pink.webp
icons/commodities/gems/gem-faceted-diamond-silver-.webp
icons/commodities/gems/gem-faceted-hexagon-blue.webp
icons/commodities/gems/gem-faceted-large-green.webp
icons/commodities/gems/gem-faceted-navette-red.webp
icons/commodities/gems/gem-faceted-octagon-yellow.webp
icons/commodities/gems/gem-faceted-oval-blue.webp
icons/commodities/gems/gem-faceted-radiant-blue.webp
icons/commodities/gems/gem-faceted-radiant-red.webp
icons/commodities/gems/gem-faceted-radiant-teal.webp
icons/commodities/gems/gem-faceted-rough-blue.webp
icons/commodities/gems/gem-faceted-rough-green.webp
icons/commodities/gems/gem-faceted-rough-purple.webp
icons/commodities/gems/gem-faceted-rough-red.webp
icons/commodities/gems/gem-faceted-rough-yellow.webp
icons/commodities/gems/gem-faceted-round-black.webp
icons/commodities/gems/gem-faceted-round-teal.webp
icons/commodities/gems/gem-faceted-round-white.webp
icons/commodities/gems/gem-faceted-tapered-blue.webp
icons/commodities/gems/gem-faceted-teardrop-blue.webp
icons/commodities/gems/gem-faceted-teardrop-pink.webp
icons/commodities/gems/gem-faceted-teardrop-teal.webp
icons/commodities/gems/gem-faceted-trillion-blue.webp
icons/commodities/gems/gem-faceted-trillion-orange.webp
icons/commodities/gems/gem-fragmented-pink.webp
icons/commodities/gems/gem-fragments-blue.webp
icons/commodities/gems/gem-fragments-green.webp
icons/commodities/gems/gem-fragments-pink.webp
icons/commodities/gems/gem-fragments-purple.webp
icons/commodities/gems/gem-fragments-red.webp
icons/commodities/gems/gem-fragments-rough-green.webp
icons/commodities/gems/gem-fragments-rough-grey.webp
icons/commodities/gems/gem-fragments-teal.webp
icons/commodities/gems/gem-fragments-turquoise.webp
icons/commodities/gems/gem-oval-red.webp
icons/commodities/gems/gem-raw-rough-green.webp
icons/commodities/gems/gem-raw-rough-green-yellow.webp
icons/commodities/gems/gem-raw-rough-purple.webp
icons/commodities/gems/gem-raw-rough-teal.webp
icons/commodities/gems/gem-rough-ball-purple.webp
icons/commodities/gems/gem-rough-brilliant-green.webp
icons/commodities/gems/gem-rough-can-orange-red.webp
icons/commodities/gems/gem-rough-can-red.webp
icons/commodities/gems/gem-rough-cushion-blue.webp
icons/commodities/gems/gem-rough-cushion-green.webp
icons/commodities/gems/gem-rough-cushion-orange-red.webp
icons/commodities/gems/gem-rough-cushion-orange.webp
icons/commodities/gems/gem-rough-cushion-orange-white.webp
icons/commodities/gems/gem-rough-cushion-pink-yellow.webp
icons/commodities/gems/gem-rough-cushion-purple-pink.webp
icons/commodities/gems/gem-rough-cushion-purple.webp
icons/commodities/gems/gem-rough-cushion-red-pink.webp
icons/commodities/gems/gem-rough-cushion-red.webp
icons/commodities/gems/gem-rough-cushion-red-white.webp
icons/commodities/gems/gem-rough-cushion-teal.webp
icons/commodities/gems/gem-rough-cushion-violet.webp
icons/commodities/gems/gem-rough-cushion-white.webp
icons/commodities/gems/gem-rough-cushion-yellow.webp
icons/commodities/gems/gem-rough-drop-blue.webp
icons/commodities/gems/gem-rough-drop-green.webp
icons/commodities/gems/gem-rough-drop-red.webp
icons/commodities/gems/gem-rough-faceted-green.webp
icons/commodities/gems/gem-rough-heart-pink.webp
icons/commodities/gems/gem-rough-heart-teal.webp
icons/commodities/gems/gem-rough-navette-blue.webp
icons/commodities/gems/gem-rough-navette-green.webp
icons/commodities/gems/gem-rough-navette-pink.webp
icons/commodities/gems/gem-rough-navette-purple-pink.webp
icons/commodities/gems/gem-rough-navette-purple.webp
icons/commodities/gems/gem-rough-navette-red-pink.webp
icons/commodities/gems/gem-rough-navette-red.webp
icons/commodities/gems/gem-rough-navette-yellow-green.webp
icons/commodities/gems/gem-rough-oval-blue.webp
icons/commodities/gems/gem-rough-oval-green.webp
icons/commodities/gems/gem-rough-oval-orange.webp
icons/commodities/gems/gem-rough-oval-pink.webp
icons/commodities/gems/gem-rough-oval-purple.webp
icons/commodities/gems/gem-rough-oval-red.webp
icons/commodities/gems/gem-rough-oval-teal.webp
icons/commodities/gems/gem-rough-oval-white.webp
icons/commodities/gems/gem-rough-pear-orange.webp
icons/commodities/gems/gem-rough-pendeloque-blue.webp
icons/commodities/gems/gem-rough-princess-green.webp
icons/commodities/gems/gem-rough-rectangle-red.webp
icons/commodities/gems/gem-rough-rectangular-red.webp
icons/commodities/gems/gem-rough-rectangular-teal.webp
icons/commodities/gems/gem-rough-rose-red.webp
icons/commodities/gems/gem-rough-rose-teal.webp
icons/commodities/gems/gem-rough-round-blue.webp
icons/commodities/gems/gem-rough-round-orange.webp
icons/commodities/gems/gem-rough-round-pink.webp
icons/commodities/gems/gem-rough-spiral-teal.webp
icons/commodities/gems/gem-rough-square-blue.webp
icons/commodities/gems/gem-rough-square-orange-red.webp
icons/commodities/gems/gem-rough-square-red.webp
icons/commodities/gems/gem-rough-square-yellow.webp
icons/commodities/gems/gem-rough-tapered-blue.webp
icons/commodities/gems/gem-rough-tapered-green.webp
icons/commodities/gems/gem-rough-tapered-purple-pink.webp
icons/commodities/gems/gem-rough-tapered-purple.webp
icons/commodities/gems/gem-rough-tapered-red.webp
icons/commodities/gems/gem-rough-teardrop-orange.webp
icons/commodities/gems/gem-rough-teardrop-pink.webp
icons/commodities/gems/gem-rough-teardrop-red-pink.webp
icons/commodities/gems/gem-rough-teardrop-red.webp
icons/commodities/gems/gem-rough-trapeze-green.webp
icons/commodities/gems/gem-rough-trapeze-yellow-green.webp
icons/commodities/gems/gems-faceted-pink-crate.webp
icons/commodities/gems/gem-shattered-blue.webp
icons/commodities/gems/gem-shattered-orange.webp
icons/commodities/gems/gem-shattered-pink.webp
icons/commodities/gems/gem-shattered-teal.webp
icons/commodities/gems/gem-shattered-violet.webp
icons/commodities/gems/gem-teardrop-blue.webp
icons/commodities/gems/pearl-beige-smooth.webp
icons/commodities/gems/pearl-blue-gold.webp
icons/commodities/gems/pearl-brown-red.webp
icons/commodities/gems/pearl-brown.webp
icons/commodities/gems/pearl-fire-swirl.webp
icons/commodities/gems/pearl-fire.webp
icons/commodities/gems/pearl-glass-purple.webp
icons/commodities/gems/pearl-natural.webp
icons/commodities/gems/pearl-pink.webp
icons/commodities/gems/pearl-purple-cloth.webp
icons/commodities/gems/pearl-purple-dark.webp
icons/commodities/gems/pearl-purple-rough.webp
icons/commodities/gems/pearl-purple-smooth.webp
icons/commodities/gems/pearl-purple.webp
icons/commodities/gems/pearl-red-gold.webp
icons/commodities/gems/pearl-red-oval.webp
icons/commodities/gems/pearl-rock.webp
icons/commodities/gems/pearl-rough-turquoise.webp
icons/commodities/gems/pearl-rough-white.webp
icons/commodities/gems/pearl-storm.webp
icons/commodities/gems/pearls-white.webp
icons/commodities/gems/pearl-swirl-blue.webp
icons/commodities/gems/pearl-swirl-teal.webp
icons/commodities/gems/pearl-turquoise.webp
icons/commodities/gems/pearl-water.webp
icons/commodities/gems/pearl-white-oval.webp
icons/commodities/gems/powder-raw-white.webp
```

### Containers Icons (For Item Creation)

#### containers/chest (29 icons)

```
icons/containers/chest/chest-elm-steel-brown.webp
icons/containers/chest/chest-elm-steel-tan.webp
icons/containers/chest/chest-oak-steel-brown.webp
icons/containers/chest/chest-reinforced-box-brown.webp
icons/containers/chest/chest-reinforced-elm-steel-tan.webp
icons/containers/chest/chest-reinforced-steel-brown.webp
icons/containers/chest/chest-reinforced-steel-cherry.webp
icons/containers/chest/chest-reinforced-steel-green.webp
icons/containers/chest/chest-reinforced-steel-oak-tan.webp
icons/containers/chest/chest-reinforced-steel-pink.webp
icons/containers/chest/chest-reinforced-steel-red.webp
icons/containers/chest/chest-reinforced-steel-tan.webp
icons/containers/chest/chest-reinforced-steel-walnut-brown.webp
icons/containers/chest/chest-reinforced-stone.webp
icons/containers/chest/chest-simple-box-blue.webp
icons/containers/chest/chest-simple-box-brown.webp
icons/containers/chest/chest-simple-box-gold-brown.webp
icons/containers/chest/chest-simple-box-red.webp
icons/containers/chest/chest-simple-box-steel-brown.webp
icons/containers/chest/chest-simple-elm-tan.webp
icons/containers/chest/chest-simple-oak-steel-brown.webp
icons/containers/chest/chest-simple-purple.webp
icons/containers/chest/chest-simple-steel-brown.webp
icons/containers/chest/chest-simple-steel-orange.webp
icons/containers/chest/chest-simple-walnut.webp
icons/containers/chest/chest-small-gold-cherry.webp
icons/containers/chest/chest-steel-purple.webp
icons/containers/chest/chest-wooden-tied-white.webp
icons/containers/chest/chest-worn-oak-tan.webp
```

### Sundries Icons (For Knowledge/Book Feats)

#### sundries/books (88 icons)

```
icons/sundries/books/book-backed-blue-gold.webp
icons/sundries/books/book-backed-silver-gold.webp
icons/sundries/books/book-backed-silver-red.webp
icons/sundries/books/book-backed-wood-tan.webp
icons/sundries/books/book-black-grey.webp
icons/sundries/books/book-clasp-spiral-green.webp
icons/sundries/books/book-embossed-blue.webp
icons/sundries/books/book-embossed-bound-brown.webp
icons/sundries/books/book-embossed-clasp-gold-brown.webp
icons/sundries/books/book-embossed-gold-green.webp
icons/sundries/books/book-embossed-gold-red.webp
icons/sundries/books/book-embossed-jewel-blue-red.webp
icons/sundries/books/book-embossed-jewel-gold-green.webp
icons/sundries/books/book-embossed-jewel-gold-purple.webp
icons/sundries/books/book-embossed-jewel-silver-green.webp
icons/sundries/books/book-embossed-roots-green.webp
icons/sundries/books/book-embossed-spiral-purple-white.webp
icons/sundries/books/book-embossed-steel-brown.webp
icons/sundries/books/book-embossed-steel-green.webp
icons/sundries/books/book-eye-pink.webp
icons/sundries/books/book-eye-purple.webp
icons/sundries/books/book-eye-red.webp
icons/sundries/books/book-face-black.webp
icons/sundries/books/book-face-blue.webp
icons/sundries/books/book-leaves-circle.webp
icons/sundries/books/book-mimic.webp
icons/sundries/books/book-open-brown-black.webp
icons/sundries/books/book-open-brown.webp
icons/sundries/books/book-open-purple.webp
icons/sundries/books/book-open-red.webp
icons/sundries/books/book-open-turquoise.webp
icons/sundries/books/book-plain-orange.webp
icons/sundries/books/book-purple-cross.webp
icons/sundries/books/book-purple-detail.webp
icons/sundries/books/book-purple-gem.webp
icons/sundries/books/book-purple-glyph.webp
icons/sundries/books/book-red-cross.webp
icons/sundries/books/book-red-exclamation.webp
icons/sundries/books/book-red-square.webp
icons/sundries/books/book-reye-reptile-brown.webp
icons/sundries/books/book-rounded-blue.webp
icons/sundries/books/book-rounded-clasp-red.webp
icons/sundries/books/book-rounded-red.webp
icons/sundries/books/book-rounded-teal.webp
icons/sundries/books/book-simple-brown.webp
icons/sundries/books/book-stack.webp
icons/sundries/books/book-symbol-anchor-brown.webp
icons/sundries/books/book-symbol-anchor.webp
icons/sundries/books/book-symbol-axe-brown.webp
icons/sundries/books/book-symbol-bat-red.webp
icons/sundries/books/book-symbol-canterbury-cross.webp
icons/sundries/books/book-symbol-cross-blue.webp
icons/sundries/books/book-symbol-fire-gold-orange.webp
icons/sundries/books/book-symbol-hexagram-silver-red.webp
icons/sundries/books/book-symbol-leaf-gold-green.webp
icons/sundries/books/book-symbol-leaf-green.webp
icons/sundries/books/book-symbol-lightning-silver-blue.webp
icons/sundries/books/book-symbol-link-brown.webp
icons/sundries/books/book-symbol-plant-brown.webp
icons/sundries/books/book-symbol-potion-blue.webp
icons/sundries/books/book-symbol-reverse-blue.webp
icons/sundries/books/book-symbol-skull-grey.webp
icons/sundries/books/book-symbol-spiral-silver-blue.webp
icons/sundries/books/book-symbol-square-blue-green.webp
icons/sundries/books/book-symbol-tree-silver-green.webp
icons/sundries/books/book-symbol-triangle-blue.webp
icons/sundries/books/book-symbol-triangle-silver-blue.webp
icons/sundries/books/book-symbol-triangle-silver-brown.webp
icons/sundries/books/book-symbol-triangle-silver-purple.webp
icons/sundries/books/book-symbol-yellow-grey.webp
icons/sundries/books/book-teal-lightning.webp
icons/sundries/books/book-tooled-blue-yellow.webp
icons/sundries/books/book-tooled-brass-brown.webp
icons/sundries/books/book-tooled-eye-gold-red.webp
icons/sundries/books/book-tooled-gold-brown.webp
icons/sundries/books/book-tooled-gold-purple.webp
icons/sundries/books/book-tooled-green.webp
icons/sundries/books/book-tooled-grey.webp
icons/sundries/books/book-tooled-silver-blue.webp
icons/sundries/books/book-turquoise-moon.webp
icons/sundries/books/book-worn-blue.webp
icons/sundries/books/book-worn-brown-grey.webp
icons/sundries/books/book-worn-brown.webp
icons/sundries/books/book-worn-green.webp
icons/sundries/books/book-worn-purple.webp
icons/sundries/books/book-worn-red.webp
icons/sundries/books/book-worn-teal.webp
icons/sundries/books/symbol-axe-gold-grey.webp
```

### SVG Icons (Fallback Only)

Simple line-art icons. **Use only when no suitable WebP exists.**

```
icons/svg/acid.svg
icons/svg/anchor.svg
icons/svg/angel.svg
icons/svg/aura.svg
icons/svg/barrel.svg
icons/svg/biohazard.svg
icons/svg/blind.svg
icons/svg/blood.svg
icons/svg/bones.svg
icons/svg/book.svg
icons/svg/bridge.svg
icons/svg/burrow.svg
icons/svg/cancel.svg
icons/svg/card-hand.svg
icons/svg/card-joker.svg
icons/svg/castle.svg
icons/svg/cave.svg
icons/svg/chest.svg
icons/svg/circle.svg
icons/svg/city.svg
icons/svg/clockwork.svg
icons/svg/coins.svg
icons/svg/combat.svg
icons/svg/cowled.svg
icons/svg/d10-grey.svg
icons/svg/d12-grey.svg
icons/svg/d20-black.svg
icons/svg/d20-grey.svg
icons/svg/d20-highlight.svg
icons/svg/d20.svg
icons/svg/d4-grey.svg
icons/svg/d6-grey.svg
icons/svg/d8-grey.svg
icons/svg/daze.svg
icons/svg/deaf.svg
icons/svg/degen.svg
icons/svg/dice-target.svg
icons/svg/direction.svg
icons/svg/door-closed-outline.svg
icons/svg/door-closed.svg
icons/svg/door-exit.svg
icons/svg/door-locked-outline.svg
icons/svg/door-open-outline.svg
icons/svg/door-secret-outline.svg
icons/svg/door-steel.svg
icons/svg/downgrade.svg
icons/svg/down.svg
icons/svg/explosion.svg
icons/svg/eye.svg
icons/svg/falling.svg
icons/svg/fire-shield.svg
icons/svg/fire.svg
icons/svg/frozen.svg
icons/svg/hanging-sign.svg
icons/svg/hazard.svg
icons/svg/heal.svg
icons/svg/holy-shield.svg
icons/svg/house.svg
icons/svg/ice-aura.svg
icons/svg/ice-shield.svg
icons/svg/invisible.svg
icons/svg/item-bag.svg
icons/svg/jump.svg
icons/svg/ladder.svg
icons/svg/leg.svg
icons/svg/lever.svg
icons/svg/lightning.svg
icons/svg/light-off.svg
icons/svg/light.svg
icons/svg/mage-shield.svg
icons/svg/mole.svg
icons/svg/mountain.svg
icons/svg/mystery-man-black.svg
icons/svg/mystery-man.svg
icons/svg/net.svg
icons/svg/oak.svg
icons/svg/obelisk.svg
icons/svg/padlock.svg
icons/svg/paralysis.svg
icons/svg/pawprint.svg
icons/svg/pill.svg
icons/svg/poison.svg
icons/svg/portal.svg
icons/svg/radiation.svg
icons/svg/regen.svg
icons/svg/ruins.svg
icons/svg/shield.svg
icons/svg/silenced.svg
icons/svg/skull.svg
icons/svg/sleep.svg
icons/svg/sound-off.svg
icons/svg/sound.svg
icons/svg/statue.svg
icons/svg/stoned.svg
icons/svg/stone-path.svg
icons/svg/sun.svg
icons/svg/sword.svg
icons/svg/tankard.svg
icons/svg/target.svg
icons/svg/teleport.svg
icons/svg/temple.svg
icons/svg/terror.svg
icons/svg/thrust.svg
icons/svg/tower-flag.svg
icons/svg/tower.svg
icons/svg/trap.svg
icons/svg/unconscious.svg
icons/svg/upgrade.svg
icons/svg/up.svg
icons/svg/video.svg
icons/svg/village.svg
icons/svg/walk.svg
icons/svg/wall-direction.svg
icons/svg/waterfall.svg
icons/svg/whale.svg
icons/svg/windmill.svg
icons/svg/wingfoot.svg
icons/svg/wing.svg
```

---

## Usage Guidelines

### Priority Order

1. **WebP from magic/** - Highest quality, most thematic for powers
2. **WebP from skills/** - High quality, appropriate for combat feats
3. **WebP from equipment/** - For equipment-related feats
4. **WebP from weapons/** - For weapon-specific feats
5. **WebP from commodities/** - For special items (psicrystals, etc.)
6. **SVG fallback** - Only when no suitable WebP exists

### Currently Used Icons

See the scrapers for current icon selections:
- `tools/scrapers/powers-scraper.mjs` - Powers icon selection
- `tools/scrapers/feats-scraper.mjs` - Feats icon selection

### Verification

To verify an icon exists before using it:

```bash
# Check if icon exists
test -f /path/to/foundry/resources/app/public/icons/magic/fire/flame-burning-skull-orange.webp && echo "EXISTS" || echo "MISSING"
```

### Best Practices

1. **Always verify** icon paths exist before committing code
2. **Prefer WebP** over SVG for better visual quality
3. **Match theme** - fire icons for fire, mind icons for telepathy, etc.
4. **Stay consistent** - use same icon style across similar items
5. **Test thoroughly** - import items and verify icons display correctly

---

## Note for AI Agents

When modifying icon selections in the scrapers:

1. **Check this document first** - Search the relevant category (magic/, skills/, etc.)
2. **Verify existence** - Icons listed here are confirmed to exist in Foundry VTT base installation
3. **Maintain thematic consistency** - Use similar icons for similar features
4. **Test before committing** - Always verify the icon path exists
5. **Update this document** - Regenerate if you discover icons are missing or incorrect

**To regenerate this document:**
```bash
cd tools
./generate-icon-list.sh
```

This document is automatically generated from the Foundry VTT installation and contains all available icons from the base installation.

**Total Icons Listed:** 2820
