/**
 * Psionic Powers Web Scraper
 *
 * This script scrapes psionic power data from metzo.miraheze.org
 * and outputs YAML files directly to packs-source/powers/ for version control.
 *
 * Usage:
 *   node powers-scraper.mjs                                   # Scrape all powers (default category)
 *   node powers-scraper.mjs <url>                             # Single power to YAML
 *   node powers-scraper.mjs --list <file>                     # URL list file to YAML
 *   node powers-scraper.mjs --category <url>                  # Use custom base category URL
 *
 * Examples:
 *   node powers-scraper.mjs                                   # Scrape all → packs-source/powers/*.yaml
 *   node powers-scraper.mjs --list tools/data/power-urls.txt  # Bulk import to YAML
 *   node powers-scraper.mjs "https://metzo.miraheze.org/wiki/Crystal_Shard"  # Single power
 *   node powers-scraper.mjs --category "https://metzo.miraheze.org/wiki/Category:Custom_Powers"
 *
 * After scraping, run `npm run packs:compile` to build the LevelDB compendium.
 */

import fs from 'fs';
import { join } from 'path';
import yaml from 'js-yaml';
import {
  getScraperPaths,
  decodeHTMLEntities,
  fetchHTML,
  extractInfoboxData,
  extractTitle,
  extractDescription,
  extractNextPageLink,
  writeYAMLPack,
  delay,
  extractCategoryLinks,
  parseSourcebooks,
  sluggify,
  generateFoundryId
} from './common.mjs';

const { TOOLS_DIR } = getScraperPaths(import.meta.url);

const CATEGORY_URL = 'https://metzo.miraheze.org/wiki/Category:Dreamscarred_Press_powers';
const BASE_URL = 'https://metzo.miraheze.org/wiki/';

// Discipline mapping
const DISCIPLINE_MAP = {
  'athanatism': 'athanatism',
  'clairsentience': 'clairsentience',
  'metacreativity': 'metacreativity',
  'psychokinesis': 'psychokinesis',
  'psychometabolism': 'psychometabolism',
  'psychoportation': 'psychoportation',
  'telepathy': 'telepathy'
};


/**
 * Parse class availability into learnedAt format
 * @param {string} html - Raw HTML from class1 field
 * @returns {object} - learnedAt.class object with class names and levels
 */
function parseClassAvailability(html) {
  const learnedAt = {};

  // Extract all class entries from the HTML
  // Format: <li><a href="/wiki/ClassName">ClassName</a> Level</li>
  const classRegex = /<a[^>]*>([^<]+)<\/a>\s*(\d+)/g;
  let match;

  while ((match = classRegex.exec(html)) !== null) {
    const className = match[1].trim().toLowerCase();
    const level = parseInt(match[2]);

    // Store with lowercase key for consistency
    learnedAt[className] = level;
  }

  return learnedAt;
}

/**
 * Use AI to infer action data from power description
 * @param {object} power - The power object to enhance
 * @param {object} action - The action object to populate
 */
function inferActionData(power, action) {
  const description = power.system.description.value.toLowerCase();
  const name = power.name.toLowerCase();

  // Determine if it's an attack power
  const isAttack = description.includes('attack') ||
                   description.includes('ray') ||
                   description.includes('touch') ||
                   description.includes('damage');

  // Determine attack type
  if (isAttack) {
    if (description.includes('ranged touch attack') || description.includes('ray')) {
      action.actionType = 'rsak'; // Ranged spell attack
    } else if (description.includes('melee touch attack') || description.includes('touch')) {
      action.actionType = 'msak'; // Melee spell attack
    } else if (action.save && action.save.type) {
      action.actionType = 'save'; // Saving throw
    }
  }

  // Extract damage dice from description
  const damageMatch = description.match(/(\d+d\d+)\s*(?:points? of)?\s*(damage|cold|fire|electricity|sonic|acid|force)/i);
  if (damageMatch) {
    action.damage = action.damage || { parts: [] };
    const damageDice = damageMatch[1];

    // Determine damage type from context
    let damageType = '';

    // Check if it's a variable energy type power
    const hasVariableEnergy = description.includes('energy type') ||
                              description.includes('choose') ||
                              (description.includes('cold') &&
                               description.includes('fire') &&
                               description.includes('electricity'));

    if (hasVariableEnergy) {
      // For variable damage, use 'untyped' and let the user configure it
      damageType = 'untyped';
    } else {
      // Single damage type - determine from context
      if (description.includes('cold')) damageType = 'cold';
      else if (description.includes('fire')) damageType = 'fire';
      else if (description.includes('electricity')) damageType = 'electricity';
      else if (description.includes('sonic')) damageType = 'sonic';
      else if (description.includes('acid')) damageType = 'acid';
      else if (description.includes('force')) damageType = 'force';
      else damageType = 'untyped';
    }

    // Add damage part
    action.damage.parts.push([damageDice, damageType]);

    // Check for modifiers (e.g., "+1 per die")
    if (description.includes('+1 point') && description.includes('per die')) {
      // This is handled in the description, Foundry will handle it manually
    }
  }

  // Check for area effects (from description or target field which might have area info)
  const areaText = (action.target?.value || '').toLowerCase() + ' ' + description;
  if (areaText.includes('radius') || areaText.includes('cone') || areaText.includes('line') || areaText.includes('burst')) {
    const radiusMatch = areaText.match(/(\d+)[-\s]*(?:ft\.?|foot|feet)[-\s]*(?:radius|cone|line|burst)/i);
    if (radiusMatch) {
      action.area = action.area || {};
      action.area.value = radiusMatch[1];

      if (areaText.includes('cone')) action.area.shape = 'cone';
      else if (areaText.includes('line')) action.area.shape = 'line';
      else if (areaText.includes('burst') || areaText.includes('radius')) action.area.shape = 'sphere';
      else action.area.shape = 'sphere';

      action.area.units = 'ft';
    }
  }

  // Check for healing
  if (description.includes('heal') || description.includes('restore') || description.includes('hit points')) {
    const healMatch = description.match(/(\d+d\d+)\s*(?:points? of)?\s*(?:damage|hit points)/i);
    if (healMatch && (description.includes('heal') || description.includes('restore'))) {
      action.damage = action.damage || { parts: [] };
      action.damage.parts.push([healMatch[1], 'heal']);
      action.actionType = 'heal';
    }
  }

  // Check for buffs/penalties
  if (description.includes('bonus') || description.includes('penalty')) {
    // These are typically handled in the item's changes array, not in action damage
  }

  return action;
}

/**
 * Select an appropriate icon for a power based on its characteristics
 */
function selectPowerIcon(power) {
  const discipline = power.system.discipline;
  const descriptors = power.system.descriptors || [];
  const name = power.name.toLowerCase();

  // Check descriptors first (most specific)
  // Use high-quality webp icons from Foundry base installation
  if (descriptors.includes('fire')) return 'icons/magic/fire/flame-burning-skull-orange.webp';
  if (descriptors.includes('cold')) return 'icons/magic/water/barrier-ice-crystal-wall-faceted-blue.webp';
  if (descriptors.includes('electricity') || descriptors.includes('electric')) return 'icons/magic/lightning/bolt-strike-blue-white.webp';
  if (descriptors.includes('acid')) return 'icons/magic/unholy/projectile-missile-green.webp';
  if (descriptors.includes('sonic') || descriptors.includes('sound')) return 'icons/magic/sonic/projectile-sound-rings-wave.webp';
  if (descriptors.includes('mind-affecting')) return 'icons/magic/perception/eye-ringed-glow-angry-small-teal.webp';
  if (descriptors.includes('force')) return 'icons/magic/defensive/shield-barrier-glowing-triangle-blue.webp';
  if (descriptors.includes('light')) return 'icons/magic/light/explosion-star-glow-silhouette.webp';
  if (descriptors.includes('darkness')) return 'icons/magic/unholy/orb-glowing-purple.webp';

  // Check name keywords for specific effects
  if (name.includes('heal') || name.includes('cure')) return 'icons/magic/life/heart-cross-strong-blue.webp';
  if (name.includes('teleport') || name.includes('dimension')) return 'icons/magic/movement/trail-streak-zigzag-yellow.webp';
  if (name.includes('shield') || name.includes('armor') || name.includes('protect')) return 'icons/magic/defensive/shield-barrier-glowing-triangle-blue.webp';
  if (name.includes('detect') || name.includes('sense')) return 'icons/magic/perception/eye-ringed-glow-angry-small-teal.webp';
  if (name.includes('summon') || name.includes('call')) return 'icons/magic/holy/angel-winged-humanoid-blue.webp';
  if (name.includes('dominate') || name.includes('control') || name.includes('charm')) return 'icons/magic/control/hypnosis-mesmerism-eye-tan.webp';
  if (name.includes('blast') || name.includes('ray') || name.includes('bolt')) return 'icons/magic/fire/projectile-fireball-smoke-large-orange.webp';
  if (name.includes('wall') || name.includes('barrier')) return 'icons/magic/earth/strike-body-stone-crumble.webp';

  // Check discipline (general category)
  switch (discipline) {
    case 'telepathy':
      return 'icons/magic/perception/eye-ringed-glow-angry-small-teal.webp';
    case 'psychokinesis':
      return 'icons/magic/unholy/projectile-fireball-green.webp';
    case 'psychoportation':
      return 'icons/magic/movement/trail-streak-zigzag-yellow.webp';
    case 'metacreativity':
      return 'icons/magic/symbols/runes-star-magenta.webp';
    case 'clairsentience':
      return 'icons/magic/perception/third-eye-blue-red.webp';
    case 'psychometabolism':
      return 'icons/magic/life/heart-glowing-red.webp';
    case 'athanatism':
      return 'icons/magic/death/skull-energy-light-purple.webp';
    default:
      // Default psionic power icon
      return 'icons/magic/symbols/runes-star-magenta.webp';
  }
}

/**
 * Find existing YAML file for a power by name
 *
 * @param {string} powerName - Name of the power to find
 * @param {string} packsSourceDir - Path to packs-source/powers directory
 * @returns {string|null} - Full path to existing YAML file, or null if not found
 */
function findExistingPowerFile(powerName, packsSourceDir) {
  if (!fs.existsSync(packsSourceDir)) {
    return null;
  }

  const slug = sluggify(powerName);
  const files = fs.readdirSync(packsSourceDir);

  // Look for a file matching the pattern: slug.*.yaml
  const regex = new RegExp(`^${slug}\\..*\\.yaml$`, 'i');
  const matchingFile = files.find(file => regex.test(file));

  if (matchingFile) {
    return join(packsSourceDir, matchingFile);
  }

  return null;
}

/**
 * Parse power data from HTML
 */
function parsePowerData(html, url) {
  const power = {
    name: '',
    type: 'pf1-psionics.power',
    system: {
      description: {
        value: '',
        instructions: ''
      },
      discipline: 'athanatism',
      subdiscipline: [],
      descriptors: [],
      level: 1,
      manifestTime: {
        value: 1,
        units: 'standard'
      },
      display: {
        auditory: false,
        material: false,
        mental: false,
        olfactory: false,
        visual: false
      },
      actions: [],
      tags: [],
      sources: [], // Will be populated from sourcebook field
      learnedAt: {
        class: {}
      },
      sr: true,
      known: false,
      prepared: false,
      manifestor: '',
      uses: {
        autoDeductChargesCost: 'max(0, @sl * 2 - 1)' // Default power point formula
      }
    },
    img: 'icons/svg/mystery-man.svg',
    flags: {
      'pf1-psionics': {
        sourceUrl: url
      }
    }
  };

  // Extract title using common utility
  power.name = extractTitle(html) || '';

  // Strip "(power)" suffix from name if present
  power.name = power.name.replace(/\s*\(power\)\s*$/i, '').trim();

  // Extract discipline from infobox
  const disciplineText = extractInfoboxData(html, 'discipline');
  if (disciplineText) {
    const disciplineMatch = disciplineText.match(/^([a-zA-Z]+)/);
    if (disciplineMatch) {
      const discipline = disciplineMatch[1].toLowerCase();
      if (DISCIPLINE_MAP[discipline]) {
        power.system.discipline = discipline;
      }
    }

    // Extract subdiscipline (shown in parentheses)
    const subdisciplineMatch = disciplineText.match(/\(([^)]+)\)/);
    if (subdisciplineMatch) {
      const subdiscipline = subdisciplineMatch[1].toLowerCase();
      power.system.subdiscipline.push(subdiscipline);
    }
  }

  // Extract level and class availability from "Classes Available" field
  // Need raw HTML to preserve class names
  const classMatch = html.match(/data-source="class1"[^>]*>([\s\S]*?)<\/div>/i);
  if (classMatch) {
    const classHtml = classMatch[1];

    // Parse all class availability into learnedAt.class
    const learnedAtClass = parseClassAvailability(classHtml);
    power.system.learnedAt.class = learnedAtClass;

    // Extract level (use first class's level as the power's level)
    // Get minimum level from all classes
    const levels = Object.values(learnedAtClass);
    if (levels.length > 0) {
      power.system.level = Math.min(...levels);
    }
  }

  // Extract display components
  const displayText = extractInfoboxData(html, 'display');
  if (displayText) {
    const displays = displayText.toLowerCase();
    power.system.display.auditory = displays.includes('auditory');
    power.system.display.material = displays.includes('material');
    power.system.display.mental = displays.includes('mental');
    power.system.display.olfactory = displays.includes('olfactory');
    power.system.display.visual = displays.includes('visual');
  }

  // Extract manifesting time
  const timeText = extractInfoboxData(html, 'time');
  if (timeText) {
    const timeMatch = timeText.match(/(\d+)\s+([a-z\s]+)/i);
    if (timeMatch) {
      power.system.manifestTime.value = parseInt(timeMatch[1]);
      const unit = timeMatch[2].toLowerCase().trim();
      if (unit.includes('standard')) power.system.manifestTime.units = 'standard';
      else if (unit.includes('swift')) power.system.manifestTime.units = 'swift';
      else if (unit.includes('immediate')) power.system.manifestTime.units = 'immediate';
      else if (unit.includes('full')) power.system.manifestTime.units = 'fullRound';
      else if (unit.includes('round')) power.system.manifestTime.units = 'round';
      else if (unit.includes('minute')) power.system.manifestTime.units = 'minute';
      else if (unit.includes('hour')) power.system.manifestTime.units = 'hour';
    }
  }

  // Extract power resistance
  const resistanceText = extractInfoboxData(html, 'resistance');
  if (resistanceText) {
    power.system.sr = !resistanceText.toLowerCase().includes('no');
  }

  // Create a default action object with extracted data
  // Note: _id is omitted - Foundry VTT will auto-generate unique IDs during import
  const action = {
    name: 'Use',
    activation: {
      cost: power.system.manifestTime.value,
      type: power.system.manifestTime.units
    },
    range: {},
    duration: {},
    target: {},
    save: {},
    actionType: ''
  };

  // Extract and populate range
  const rangeText = extractInfoboxData(html, 'range');
  if (rangeText) {
    action.range.value = rangeText;
    const rangeLower = rangeText.toLowerCase();
    if (rangeLower.includes('personal')) action.range.units = 'personal';
    else if (rangeLower.includes('touch')) action.range.units = 'touch';
    else if (rangeLower.includes('close')) action.range.units = 'close';
    else if (rangeLower.includes('medium')) action.range.units = 'med';
    else if (rangeLower.includes('long')) action.range.units = 'long';
    else if (rangeLower.includes('unlimited')) action.range.units = 'unlimited';
    else action.range.units = 'ft';
  }

  // Extract target, effect, or area
  const targetText = extractInfoboxData(html, 'target');
  const effectText = extractInfoboxData(html, 'effect');
  const areaText = extractInfoboxData(html, 'area');

  if (targetText) {
    action.target.value = targetText;
  } else if (effectText) {
    action.target.value = effectText;
  } else if (areaText) {
    action.target.value = areaText;
  }

  // Extract duration
  const durationText = extractInfoboxData(html, 'duration');
  if (durationText) {
    const durationLower = durationText.toLowerCase();

    // Determine units first
    if (durationLower.includes('instantaneous')) {
      action.duration.units = 'inst';
      action.duration.value = '';
    }
    else if (durationLower.includes('concentration')) {
      action.duration.units = 'conc';
      action.duration.concentration = true;
      // Extract any additional duration after concentration
      const concMatch = durationText.match(/concentration[^,]*(?:,\s*)?(.+)?/i);
      if (concMatch && concMatch[1]) {
        action.duration.value = concMatch[1].trim();
      } else {
        action.duration.value = '';
      }
    }
    else if (durationLower.includes('permanent')) {
      action.duration.units = 'perm';
      action.duration.value = '';
    }
    else if (durationLower.includes('see text') || durationLower.includes('special')) {
      action.duration.units = 'spec';
      action.duration.value = durationText;
    }
    else if (durationLower.includes('round') || durationLower.includes('rd')) {
      action.duration.units = 'round';  // PF1 uses singular form
      // Parse formula: "1 round/level" -> "@cl"
      // Handles: "round", "rounds", "rd.", "rds."
      const match = durationText.match(/(\d+)\s*(?:round[s]?|rds?\.?)(?:\/|\s+per\s+)level/i);
      if (match) {
        const multiplier = parseInt(match[1]);
        action.duration.value = multiplier === 1 ? '@cl' : `${multiplier} * @cl`;
      } else {
        // Just a number of rounds
        const numMatch = durationText.match(/(\d+)\s*(?:round[s]?|rds?\.?)/i);
        if (numMatch) {
          action.duration.value = numMatch[1];
        } else {
          action.duration.value = durationText;
        }
      }
    }
    else if (durationLower.includes('minute') || durationLower.includes('min')) {
      action.duration.units = 'minute';  // PF1 uses singular form
      // Parse formula: "1 minute/level" or "10 min./level" -> "@cl" or "10 * @cl"
      // Handles: "minute", "minutes", "min.", "mins."
      const match = durationText.match(/(\d+)\s*(?:minute[s]?|mins?\.?)(?:\/|\s+per\s+)level/i);
      if (match) {
        const multiplier = parseInt(match[1]);
        action.duration.value = multiplier === 1 ? '@cl' : `${multiplier} * @cl`;
      } else {
        // Just a number of minutes
        const numMatch = durationText.match(/(\d+)\s*(?:minute[s]?|mins?\.?)/i);
        if (numMatch) {
          action.duration.value = numMatch[1];
        } else {
          action.duration.value = durationText;
        }
      }
    }
    else if (durationLower.includes('hour') || durationLower.includes('hr')) {
      action.duration.units = 'hour';  // PF1 uses singular form
      // Parse formula: "1 hour/level" or "2 hr./level" -> "@cl" or "2 * @cl"
      // Handles: "hour", "hours", "hr.", "hrs."
      const match = durationText.match(/(\d+)\s*(?:hour[s]?|hrs?\.?)(?:\/|\s+per\s+)level/i);
      if (match) {
        const multiplier = parseInt(match[1]);
        action.duration.value = multiplier === 1 ? '@cl' : `${multiplier} * @cl`;
      } else {
        // Just a number of hours
        const numMatch = durationText.match(/(\d+)\s*(?:hour[s]?|hrs?\.?)/i);
        if (numMatch) {
          action.duration.value = numMatch[1];
        } else {
          action.duration.value = durationText;
        }
      }
    }
    else if (durationLower.includes('day')) {
      action.duration.units = 'day';  // PF1 uses singular form
      // Parse formula: "1 day/level" -> "@cl"
      const match = durationText.match(/(\d+)\s*day[s]?(?:\/|\s+per\s+)level/i);
      if (match) {
        const multiplier = parseInt(match[1]);
        action.duration.value = multiplier === 1 ? '@cl' : `${multiplier} * @cl`;
      } else {
        // Just a number of days
        const numMatch = durationText.match(/(\d+)\s*day/i);
        if (numMatch) {
          action.duration.value = numMatch[1];
        } else {
          action.duration.value = durationText;
        }
      }
    }
    else {
      // Unknown duration type - use special
      action.duration.units = 'spec';
      action.duration.value = durationText;
    }

    // Check for dismissible
    if (durationLower.includes('(d)')) {
      action.duration.dismiss = true;
    }
  }

  // Extract saving throw
  const saveText = extractInfoboxData(html, 'savingthrow');
  if (saveText) {
    action.save.description = saveText;
    const saveLower = saveText.toLowerCase();

    // Determine save type
    if (saveLower.includes('fortitude')) action.save.type = 'fort';
    else if (saveLower.includes('reflex')) action.save.type = 'ref';
    else if (saveLower.includes('will')) action.save.type = 'will';

    // Set action type based on save
    if (action.save.type) {
      action.actionType = 'save';
      action.save.dc = '10 + @sl + @ablMod'; // Standard psionic DC formula
    }

    // Check for harmless
    if (saveLower.includes('harmless')) {
      action.save.harmless = true;
    }
  }

  // Determine action type if not set by save
  if (!action.actionType) {
    // Check if it's an attack or just utility
    const descLower = power.system.description.value?.toLowerCase() || '';
    if (descLower.includes('attack') || descLower.includes('damage')) {
      action.actionType = 'msak'; // Default to melee spell attack, could be refined
    } else {
      action.actionType = 'other';
    }
  }

  // Add the action to the power
  power.system.actions.push(action);

  // Extract description using shared function
  power.system.description.value = extractDescription(html);

  // Add descriptors from text
  // Extract raw HTML to get descriptors from anchor tags
  const descriptorMatch = html.match(/data-source="descriptor1"[^>]*>([\s\S]*?)<\/(?:div|td)>/i);
  if (descriptorMatch) {
    const descriptorHtml = descriptorMatch[1];
    if (!descriptorHtml.toLowerCase().includes('none')) {
      // Extract text from all <a> tags - these are the actual descriptors
      const descriptors = [];
      const linkRegex = /<a[^>]*>([^<]+)<\/a>/gi;
      let match;
      while ((match = linkRegex.exec(descriptorHtml)) !== null) {
        const descriptor = match[1].trim().toLowerCase();
        if (descriptor) {
          descriptors.push(descriptor);
        }
      }
      power.system.descriptors = descriptors;
    }
  }

  // Extract sources from sourcebook field (need raw HTML to preserve <br /> separators)
  const sourcebookMatch = html.match(/data-source="sourcebook"[^>]*>([\s\S]*?)<\/td>/i);
  if (sourcebookMatch) {
    power.system.sources = parseSourcebooks(sourcebookMatch[1]);
  }

  // Use AI inference to enhance action data after we have the description
  if (power.system.actions.length > 0) {
    inferActionData(power, power.system.actions[0]);
  }

  // Select an appropriate icon based on power characteristics
  power.img = selectPowerIcon(power);

  return power;
}

/**
 * Scrape a single power page
 */
async function scrapePower(url) {
  console.log(`Scraping: ${url}`);

  try {
    const html = await fetchHTML(url);
    console.log(`  Fetched ${html.length} bytes`);

    // Debug: save fetched HTML
    // fs.writeFileSync('debug-fetched.html', html);

    const power = parsePowerData(html, url);

    console.log(`  ✓ Parsed: ${power.name} (Level ${power.system.level} ${power.system.discipline})`);
    return power;
  } catch (error) {
    console.error(`  ✗ Error scraping ${url}:`, error.message);
    return null;
  }
}

/**
 * Extract power links from category page
 */
function extractPowerLinks(html) {
  // Use common function but with power-specific exclusions
  const skipPrefixes = [
    'Category:',
    'Special:',
    'File:',
    'Library_of_Metzofitz',
    'Class',
    'Feat',
    'Equipment',
    'Magic_Items',
    'Martial_Ability',
    'Monster',
    'Mythic_Path',
    'Power',
    'Prestige_Class',
    'Psionic_Items',
    'Race',
    'Rules',
    'Spell',
    'Trait',
    'Veil',
    'Deity'
  ];

  return extractCategoryLinks(html, { skipPrefixes });
}


/**
 * Extract all power URLs from category pages with pagination
 */
async function extractAllPowerUrls(categoryUrl = CATEGORY_URL) {
  console.log('Extracting power URLs from category pages...\n');

  const allPowerNames = new Set();
  let currentUrl = categoryUrl;
  let pageNum = 1;

  // Extract the category name pattern from the provided URL for flexible pagination
  // Pattern: https://metzo.miraheze.org/wiki/Category:SomeCategory
  const categoryMatch = categoryUrl.match(/\/Category:([^?&\s]+)/);
  const categoryName = categoryMatch ? categoryMatch[1] : null;

  while (currentUrl) {
    console.log(`Page ${pageNum}: ${currentUrl}`);
    const html = await fetchHTML(currentUrl);
    const powerNames = extractPowerLinks(html);
    console.log(`  Found ${powerNames.length} powers on this page`);

    powerNames.forEach(name => allPowerNames.add(name));

    // Extract next page link, looking for the specific category pattern
    let nextUrl = null;
    if (categoryName) {
      // For custom categories, look for the specific category in the next link
      const regex = new RegExp(`<a href="(\\/wiki\\/Category:${categoryName}[^"]*)"[^>]*>next page<\\/a>`, 'i');
      const match = html.match(regex);
      if (match) {
        nextUrl = 'https://metzo.miraheze.org' + match[1];
      }
    } else {
      // Fallback to the standard extraction
      nextUrl = extractNextPageLink(html, 'powers');
    }

    if (nextUrl) {
      currentUrl = nextUrl;
      pageNum++;
      await delay(1000);
    } else {
      console.log('  No more pages found.');
      currentUrl = null;
    }
  }

  console.log(`\nTotal powers found: ${allPowerNames.size}\n`);

  // Convert to full URLs
  return Array.from(allPowerNames).sort().map(name => `${BASE_URL}${name}`);
}

/**
 * Scrape multiple power pages from a list of URLs
 */
async function scrapePowers(urls) {
  const powers = [];

  for (const url of urls) {
    const power = await scrapePower(url);
    if (power) {
      powers.push(power);
    }

    // Be nice to the server - wait 1 second between requests
    await delay(1000);
  }

  return powers;
}

/**
 * Write powers to YAML files, updating existing files or creating new ones
 */
function writePowersWithDeduplication(powers, rootDir) {
  const packsSourceDir = join(rootDir, 'packs-source', 'powers');

  // Ensure directory exists
  if (!fs.existsSync(packsSourceDir)) {
    fs.mkdirSync(packsSourceDir, { recursive: true });
  }

  const stats = {
    written: 0,
    updated: 0,
    skipped: 0,
    errors: []
  };

  // Collect existing IDs to prevent collisions
  const existingIds = new Set();
  if (fs.existsSync(packsSourceDir)) {
    const files = fs.readdirSync(packsSourceDir);
    for (const file of files) {
      if (file.endsWith('.yaml')) {
        const match = file.match(/\.([a-zA-Z0-9]{16})\.yaml$/);
        if (match) {
          existingIds.add(match[1]);
        }
      }
    }
  }

  for (const power of powers) {
    try {
      // Check if a YAML file already exists for this power
      const existingFile = findExistingPowerFile(power.name, packsSourceDir);

      if (existingFile) {
        // Read existing YAML to preserve the ID
        const existingContent = fs.readFileSync(existingFile, 'utf8');
        const existingPower = yaml.load(existingContent);

        // Preserve the existing ID
        power._id = existingPower._id;

        // Update the file
        const yamlContent = yaml.dump(power, {
          sortKeys: true,
          lineWidth: -1
        });

        fs.writeFileSync(existingFile, yamlContent, 'utf8');
        stats.updated++;
        console.log(`  📝 Updated: ${power.name}`);
      } else {
        // Create new file - generate a new Foundry-compatible ID
        power._id = generateFoundryId(existingIds);
        existingIds.add(power._id); // Add to set to prevent duplicates in same batch
        const slug = sluggify(power.name);
        const filename = `${slug}.${power._id}.yaml`;
        const filepath = join(packsSourceDir, filename);

        const yamlContent = yaml.dump(power, {
          sortKeys: true,
          lineWidth: -1
        });

        fs.writeFileSync(filepath, yamlContent, 'utf8');
        stats.written++;
        console.log(`  ✨ Created: ${power.name}`);
      }
    } catch (error) {
      stats.errors.push({ item: power.name, error: error.message });
      stats.skipped++;
      console.error(`  ✗ Error writing ${power.name}: ${error.message}`);
    }
  }

  return stats;
}
async function main() {
  const args = process.argv.slice(2);

  let urls = [];
  let categoryUrl = CATEGORY_URL; // Default category URL

  // Parse arguments
  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === '--category') {
      // --category <url> - Use custom base category URL
      categoryUrl = args[++i];
      if (!categoryUrl) {
        console.error('Error: No category URL specified');
        console.error('Usage: node powers-scraper.mjs --category <category-url>');
        process.exit(1);
      }
      i++;
    } else if (arg === '--list') {
      // --list <file> - Read URLs from file
      const urlFile = args[++i];
      if (!urlFile) {
        console.error('Error: No URL list file specified');
        console.error('Usage: node powers-scraper.mjs --list <url-list-file>');
        process.exit(1);
      }

      const urlsText = fs.readFileSync(urlFile, 'utf8');
      urls = urlsText.split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'));
      i++;
    } else if (arg.startsWith('http')) {
      // Single URL
      urls.push(arg);
      i++;
    } else {
      // Unknown argument
      i++;
    }
  }

  // If no URLs specified, scrape all from category
  if (urls.length === 0) {
    console.log('No URLs specified - scraping all powers from category\n');
    urls = await extractAllPowerUrls(categoryUrl);
  }

  console.log(`Scraping ${urls.length} power(s)...\n`);

  const powers = await scrapePowers(urls);

  console.log('');
  console.log(`Scraped ${powers.length} powers successfully\n`);

  // Write as YAML files to packs-source/powers/ with deduplication
  const rootDir = join(TOOLS_DIR, '..');
  const stats = writePowersWithDeduplication(powers, rootDir);

  console.log('');
  console.log(`✓ Created ${stats.written} new YAML files`);
  console.log(`✓ Updated ${stats.updated} existing YAML files`);
  if (stats.skipped > 0) {
    console.log(`⚠ Skipped ${stats.skipped} items due to errors`);
    stats.errors.forEach(err => {
      console.log(`  - ${err.item}: ${err.error}`);
    });
  }
  console.log('\nRun `npm run packs:compile` to build the compendium');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { scrapePower, scrapePowers, parsePowerData };
