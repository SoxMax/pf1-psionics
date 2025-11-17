/**
 * Psionic Races Web Scraper
 *
 * This script scrapes psionic race data from metzo.miraheze.org
 * and outputs YAML files directly to packs-source/races/ for version control.
 *
 * Usage:
 *   node races-scraper.mjs                                   # Scrape all races (default category)
 *   node races-scraper.mjs <url>                             # Single race to YAML
 *   node races-scraper.mjs --list <file>                     # URL list file to YAML
 *   node races-scraper.mjs --category <url>                  # Use custom base category URL
 *
 * Examples:
 *   node races-scraper.mjs                                   # Scrape all → packs-source/races/*.yaml
 *   node races-scraper.mjs --list tools/data/race-urls.txt   # Bulk import to YAML
 *   node races-scraper.mjs "https://metzo.miraheze.org/wiki/Blue"  # Single race
 *   node races-scraper.mjs --category "https://metzo.miraheze.org/wiki/Category:Ultimate_Psionics_races"
 *
 * After scraping, run `npm run packs:compile` to build the LevelDB compendium.
 */

import fs from 'fs';
import yaml from 'js-yaml';
import { join } from 'path';
import {
  getScraperPaths,
  fetchHTML,
  extractInfoboxData,
  extractTitle,
  extractDescription,
  extractNextPageLink,
  writeItemsWithDeduplication,
  delay,
  extractCategoryLinks,
  extractPageCategories,
  generateFoundryId,
  sluggify
} from './common.mjs';

const { TOOLS_DIR } = getScraperPaths(import.meta.url);

const CATEGORY_URL = 'https://metzo.miraheze.org/wiki/Category:Ultimate_Psionics_races';
const BASE_URL = 'https://metzo.miraheze.org/wiki/';

// Valid psionic source books
const PSIONIC_SOURCES = [
  'Psionics Unleashed',
  'Psionics Expanded',
  'Ultimate Psionics',
  'Psionics Augmented',
  'Psionic Bestiary',
  'Psionics Embodied',
  'Psionic Items of Legend',
  'Seventh Path',
  'Psionic Power Cards',
  'Occult Compilation'
];

/**
 * Extract race links from category page
 */
function extractRaceLinks(html) {
  // Use common function with default skip prefixes
  return extractCategoryLinks(html);
}

/**
 * Check if source book is psionic-related
 */
function isPsionicSource(sourceText) {
  if (!sourceText) return false;

  const sourceLower = sourceText.toLowerCase();
  return PSIONIC_SOURCES.some(src => sourceLower.includes(src.toLowerCase()));
}

/**
 * Check if a race is psionic based on its categories
 */
function isPsionicRaceByCategories(categories) {
  return categories.some(cat => {
    const catName = cat.name || cat.slug;
    return PSIONIC_SOURCES.some(source =>
      catName.includes(`${source}`)
    ) || catName.toLowerCase().includes('psionic');
  });
}

/**
 * Extract sources from categories
 */
function extractSourcesFromCategories(categories) {
  const sources = [];
  const sourceCategories = categories.filter(cat =>
    cat.name.startsWith('Source:') || cat.slug.startsWith('Source:')
  );

  for (const cat of sourceCategories) {
    const sourceName = (cat.name.startsWith('Source:') ? cat.name : cat.slug)
      .replace(/^Source:\s*/, '')
      .trim();

    sources.push({
      title: sourceName,
      pages: '',
      id: '',
      errata: '',
      date: '',
      publisher: 'Dreamscarred Press'
    });
  }

  return sources;
}

/**
 * Parse ability score modifications from the infobox
 * Expected format: "+2 Int, +2 Dex, -2 Str"
 */
function parseAbilityScores(abilityText) {
  const changes = [];

  if (!abilityText) return changes;

  // Match patterns like "+2 Int", "-2 Str", etc.
  const regex = /([+-]?\d+)\s+(Str|Dex|Con|Int|Wis|Cha)/gi;
  let match;

  const abilityMap = {
    'str': 'str',
    'dex': 'dex',
    'con': 'con',
    'int': 'int',
    'wis': 'wis',
    'cha': 'cha'
  };

  while ((match = regex.exec(abilityText)) !== null) {
    const modifier = match[1];
    const ability = abilityMap[match[2].toLowerCase()];

    if (ability) {
      changes.push({
        _id: generateFoundryId().substring(0, 8),
        formula: modifier,
        operator: 'add',
        priority: 0,
        target: ability,
        type: 'racial'
      });
    }
  }

  return changes;
}

/**
 * Parse size from text (Small, Medium, Large, etc.)
 */
function parseSize(sizeText) {
  if (!sizeText) return 'med';

  const sizeMap = {
    'fine': 'fine',
    'diminutive': 'dim',
    'tiny': 'tiny',
    'small': 'sm',
    'medium': 'med',
    'large': 'lg',
    'huge': 'huge',
    'gargantuan': 'grg',
    'colossal': 'col'
  };

  const sizeLower = sizeText.toLowerCase().trim();
  return sizeMap[sizeLower] || 'med';
}

/**
 * Parse creature types and subtypes
 */
function parseCreatureTypes(typeText) {
  const types = [];
  const subtypes = [];

  if (!typeText) return { types, subtypes };

  // Format can be "humanoid (goblinoid, psionic)" or just "humanoid"
  const match = typeText.match(/^([^(]+)(?:\(([^)]+)\))?/i);

  if (match) {
    // Main type
    const mainType = match[1].trim().toLowerCase();
    types.push(mainType);

    // Subtypes
    if (match[2]) {
      const subtypeList = match[2].split(',').map(s => s.trim().toLowerCase());
      subtypes.push(...subtypeList);
    }
  }

  return { types, subtypes };
}

/**
 * Parse languages from text
 */
function parseLanguages(langText) {
  if (!langText) return [];

  // Split by commas and common conjunctions
  return langText
    .replace(/\sand\s/gi, ',')
    .split(',')
    .map(lang => lang.trim().toLowerCase())
    .filter(lang => lang && lang !== 'and');
}

/**
 * Select an appropriate icon for a race
 */
function selectRaceIcon(race) {
  const name = race.name.toLowerCase();
  const subtypes = race.system.creatureSubtypes || [];

  // Check for specific race keywords
  if (name.includes('blue') || name.includes('goblin')) return 'systems/pf1/icons/races/goblin.png';
  if (name.includes('dromite')) return 'icons/creatures/mammals/elk-moose-marked-green.webp';
  if (name.includes('dwarf')) return 'systems/pf1/icons/races/dwarf.png';
  if (name.includes('elf')) return 'systems/pf1/icons/races/elf.png';
  if (name.includes('half-giant')) return 'systems/pf1/icons/races/half-orc.png';
  if (name.includes('halfling')) return 'systems/pf1/icons/races/halfling.png';
  if (name.includes('maenad')) return 'icons/magic/perception/silhouette-profile-purple.webp';
  if (name.includes('ophiduan')) return 'icons/creatures/reptiles/serpent-horned-green.webp';
  if (name.includes('xeph')) return 'icons/magic/movement/trail-streak-zigzag-yellow.webp';

  // Check subtypes
  if (subtypes.includes('goblinoid')) return 'systems/pf1/icons/races/goblin.png';
  if (subtypes.includes('reptilian')) return 'icons/creatures/reptiles/lizard-iguana-green.webp';
  if (subtypes.includes('insectoid')) return 'icons/creatures/invertebrates/ant-wasp-green.webp';

  // Default to humanoid icon
  return 'icons/environment/people/group.webp';
}

/**
 * Extract race trait names from the page content
 * Looks for racial trait sections and extracts trait names
 */
function extractRaceTraitNames(html) {
  const traits = [];

  // Look for sections that describe racial traits
  // Common patterns: "Racial Traits", list of abilities with bold names

  // Try to find trait listings in various formats
  // Format 1: Bold trait names in description
  const boldTraitRegex = /<strong>([^<:]+):/g;
  let match;

  while ((match = boldTraitRegex.exec(html)) !== null) {
    const traitName = match[1].trim();

    // Filter out section headers and non-trait text
    if (traitName &&
        !traitName.toLowerCase().includes('physical description') &&
        !traitName.toLowerCase().includes('society') &&
        !traitName.toLowerCase().includes('relations') &&
        !traitName.toLowerCase().includes('alignment') &&
        !traitName.toLowerCase().includes('religion') &&
        !traitName.toLowerCase().includes('adventurers') &&
        !traitName.toLowerCase().includes('names') &&
        traitName.length < 50) {
      traits.push(traitName);
    }
  }

  return [...new Set(traits)]; // Remove duplicates
}

/**
 * Extract fluff (lore) description and raw traits block from HTML
 * Fluff ends immediately before TOC, racial traits, favored class options, or archetypes.
 * Returns { fluffHTML, traitsHTML }
 */
function extractFluffAndTraits(html) {
  // Extract complete description first
  const fullDesc = extractDescription(html);

  // Find where fluff ends - multiple possible boundaries
  const boundaries = [];

  // 1. Table of Contents (TOC)
  const tocRegex = /<input[^>]*role="button"[^>]*toctogglecheckbox|<h2[^>]*id="mw-toc-heading"/i;
  const tocMatch = fullDesc.match(tocRegex);
  if (tocMatch) {
    boundaries.push(fullDesc.indexOf(tocMatch[0]));
  }

  // 2. Racial Traits heading
  const racialHeadingRegex = /<h[2-4][^>]*>[^<]*Racial Traits[^<]*<\/h[2-4]>/i;
  const headingMatch = fullDesc.match(racialHeadingRegex);
  if (headingMatch) {
    boundaries.push(fullDesc.indexOf(headingMatch[0]));
  }

  // 3. Ability Score Modifiers list (start of traits)
  const abilityListRegex = /<ul>\s*<li>\s*<strong>Ability Score Modifiers/i;
  const listMatch = fullDesc.match(abilityListRegex);
  if (listMatch) {
    boundaries.push(fullDesc.indexOf(listMatch[0]));
  }

  // 4. Favored Class Options heading
  const fcoRegex = /<h[2-4][^>]*>[^<]*Favored Class Options[^<]*<\/h[2-4]>/i;
  const fcoMatch = fullDesc.match(fcoRegex);
  if (fcoMatch) {
    boundaries.push(fullDesc.indexOf(fcoMatch[0]));
  }

  // 5. Archetypes heading
  const archRegex = /<h[2-4][^>]*>[^<]*Archetypes?[^<]*<\/h[2-4]>/i;
  const archMatch = fullDesc.match(archRegex);
  if (archMatch) {
    boundaries.push(fullDesc.indexOf(archMatch[0]));
  }

  // Use the earliest boundary found
  if (boundaries.length === 0) {
    // No boundaries found; treat whole description as fluff
    return { fluffHTML: fullDesc, traitsHTML: '' };
  }

  const boundaryIdx = Math.min(...boundaries);
  const fluffHTML = fullDesc.slice(0, boundaryIdx).trim();
  const traitsHTML = fullDesc.slice(boundaryIdx).trim();
  return { fluffHTML, traitsHTML };
}

/**
 * Parse standard racial traits (first <ul> list containing <strong> labels)
 */
function parseStandardTraits(traitsHTML, raceName) {
  const traits = [];
  // Match list items with <strong>Name</strong>:
  const liRegex = /<li>\s*<strong>([^<:]+):?<\/strong>\s*:?\s*([\s\S]*?)(?=<li>|<\/ul>)/gi;
  let match;
  const skipNames = new Set(['Ability Score Modifiers', 'Size', 'Type', 'Speed', 'Languages']);
  while ((match = liRegex.exec(traitsHTML)) !== null) {
    const rawName = match[1].trim();
    if (skipNames.has(rawName)) continue; // Already handled by base race fields

    // Remove parenthetical ability tags like (Su), (Ex), (Sp) from the name
    // The ability type is stored in abilityType field, not the name
    const cleanName = rawName.replace(/\s*\([^)]*\)\s*$/g, '').trim();

    let bodyHtml = match[2].trim();

    // Separate "This trait replaces" text into its own paragraph for emphasis
    bodyHtml = bodyHtml.replace(
      /\s*(This (?:trait|racial trait) replaces[^.]+\.)/gi,
      '</p><p><em>$1</em></p><p>'
    );

    // Don't include the trait name in the description - it's already in the name field
    let cleanBody = bodyHtml.startsWith('<p>') ? bodyHtml : `<p>${bodyHtml}</p>`;

    // Clean up empty paragraphs
    cleanBody = cleanBody.replace(/<p>\s*<\/p>/g, '');

    traits.push({
      name: cleanName,
      description: cleanBody,
      isAlternate: false
    });
  }
  return traits;
}

/**
 * Parse alternate racial traits paragraphs following standard traits
 */
function parseAlternateTraits(traitsHTML) {
  const alternates = [];
  // Look for paragraphs that start with <p><strong>Trait Name ( or just Name </strong>:
  const altRegex = /<p>\s*<strong>([^<]+?)<\/strong>\s*:\s*([\s\S]*?)<\/p>/gi;
  let match;
  while ((match = altRegex.exec(traitsHTML)) !== null) {
    const nameSegment = match[1].trim();
    // Skip if it's a sentence explaining section (e.g., "The following racial traits ...")
    if (/^The following/i.test(nameSegment)) continue;

    // Remove parenthetical ability tags like (Su), (Ex)
    let cleanName = nameSegment.replace(/\([^)]*\)/g, '').trim();

    // Check if this looks like ability score modifiers (e.g., "+2 Str, +4 Con, -2 Cha")
    const abilityScorePattern = /^[+-]?\d+\s+(Str|Dex|Con|Int|Wis|Cha|Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)/i;
    if (abilityScorePattern.test(cleanName)) {
      cleanName = 'Ability Score Modifiers';
    }

    let body = match[2].trim();

    // Detect explicit replacement notes
    const replaces = [];
    const replaceRegex = /replaces? the ([A-Z][A-Za-z'\s]+?) trait/gi;
    let rMatch;
    while ((rMatch = replaceRegex.exec(body)) !== null) {
      replaces.push(rMatch[1].trim());
    }

    // Separate "This trait replaces" text into its own paragraph for emphasis
    body = body.replace(
      /\s*(This (?:trait|racial trait) replaces[^.]+\.)/gi,
      '</p><p><em>$1</em></p><p>'
    );

    // Don't include the trait name in the description - it's already in the name field
    let cleanBody = body.startsWith('<p>') ? body : `<p>${body}</p>`;

    // Clean up empty paragraphs
    cleanBody = cleanBody.replace(/<p>\s*<\/p>/g, '');

    alternates.push({
      name: cleanName,
      description: cleanBody,
      isAlternate: true,
      replaces
    });
  }
  return alternates;
}

/**
 * Parse favored class options block into a single trait item if present.
 */
function parseFavoredClassOptions(traitsHTML) {
  const fcoRegex = /The following favored class options[\s\S]*?(<p>[\s\S]*?)(?:<table|$)/i;
  const match = traitsHTML.match(fcoRegex);
  if (!match) return null;
  const raw = match[0]
    .replace(/<br \/>/gi, '\n')
    .replace(/<p>/gi, '<p>')
    .trim();
  return {
    name: 'Favored Class Options',
    description: raw.startsWith('<p>') ? raw : `<p>${raw}</p>`,
    isAlternate: false,
    isAggregate: true
  };
}

/**
 * Infer ability type from trait name and description
 * Returns 'su', 'sp', 'ex', or 'na'
 */
function inferAbilityType(traitName, description) {
  const combined = (traitName + ' ' + description).toLowerCase();

  // Check for explicit ability type tags
  if (/\(su\)/.test(combined) || combined.includes('supernatural')) {
    return 'su';
  }
  if (/\(sp\)/.test(combined) || combined.includes('spell-like')) {
    return 'sp';
  }
  if (/\(ex\)/.test(combined) || combined.includes('extraordinary')) {
    return 'ex';
  }

  // Default to non-ability (most racial traits)
  return 'na';
}

/**
 * Infer trait category from trait name and description
 * Returns appropriate category or undefined if none matches
 */
function inferTraitCategory(traitName, description) {
  const nameLower = traitName.toLowerCase();
  const descLower = description.toLowerCase();
  const combined = nameLower + ' ' + descLower;

  // Check for explicit ability type tags in description - these indicate magical categories
  if (combined.includes('(su)') || combined.includes('supernatural') ||
      combined.includes('(sp)') || combined.includes('spell-like')) {
    return 'magical'; // Supernatural and spell-like abilities
  }
  if (combined.includes('(ex)') || combined.includes('extraordinary')) {
    return 'extraordinary'; // Extraordinary abilities
  }

  // Check for common trait categories by name patterns
  if (nameLower.includes('darkvision') || nameLower.includes('low-light') ||
      nameLower.includes('vision') || nameLower.includes('blindsense') ||
      nameLower.includes('blindsight') || nameLower.includes('scent')) {
    return 'senses';
  }

  if (nameLower.includes('resistance') || nameLower.includes('natural armor') ||
      nameLower.includes('hardy') || nameLower.includes('defensive') ||
      descLower.includes('damage reduction') || descLower.includes('energy resistance')) {
    return 'defensive';
  }

  if (nameLower.includes('weapon') || nameLower.includes('attack') ||
      nameLower.includes('natural weapons')) {
    return 'offense';
  }

  // For psionic abilities (psi-like, power points, etc.)
  if (nameLower.includes('psionic') || nameLower.includes('psi-like') ||
      descLower.includes('power point') || descLower.includes('manifester level') ||
      descLower.includes('psi-like ability')) {
    return 'magical';
  }

  // Return undefined for standard traits without special category
  return undefined;
}

/**
 * Build a racial trait item object suitable for Foundry PF1
 */
function buildTraitItem(race, trait) {
  const item = {
    name: trait.name,
    type: 'feat',
    img: race.img || 'icons/environment/people/group.webp',
    system: {
      description: { value: trait.description },
      abilityType: inferAbilityType(trait.name, trait.description),
      acquired: false,
      subType: 'racial',
      changes: [],
      changeFlags: {
        loseDexToAC: false,
        noHeavyEncumbrance: false,
        noMediumEncumbrance: false,
        mediumArmorFullSpeed: false,
        heavyArmorFullSpeed: false,
        seeInvisibility: false,
        seeInDarkness: false,
        lowLightVision: false,
        immuneToMorale: false
      },
      classSkills: {
        acr: false, ahp: false, apr: false, art: false, blf: false,
        clm: false, crf: false, dev: false, dip: false, dis: false,
        esc: false, fly: false, han: false, hea: false, int: false,
        kar: false, kdu: false, ken: false, kge: false, khi: false,
        klo: false, kna: false, kno: false, kpl: false, kps: false,
        kre: false, lin: false, lor: false, per: false, prf: false,
        pro: false, rid: false, sen: false, slt: false, spl: false,
        ste: false, sur: false, swm: false, umd: false
      }
    },
    flags: { 'pf1-psionics': { fromRace: race.name } }
  };

  // Determine traitCategory
  if (trait.isAlternate) {
    item.system.traitCategory = 'alternate';
  } else if (trait.isAggregate) {
    item.system.traitCategory = 'favored-class';
  } else {
    // Infer category from trait content
    const inferredCategory = inferTraitCategory(trait.name, trait.description);
    if (inferredCategory) {
      item.system.traitCategory = inferredCategory;
    }
    // If undefined, don't set the field at all (it will be omitted from YAML)
  }

  return item;
}

/**
 * Parse race data from HTML page
 */
function parseRaceData(html, url) {
  const race = {
    name: '',
    type: 'race',
    system: {
      description: {
        value: ''
      },
      changes: [],
      changeFlags: {
        loseDexToAC: false,
        noHeavyEncumbrance: false,
        noMediumEncumbrance: false,
        mediumArmorFullSpeed: false,
        heavyArmorFullSpeed: false,
        seeInvisibility: false,
        seeInDarkness: false,
        lowLightVision: false,
        immuneToMorale: false
      },
      classSkills: {
        acr: false, ahp: false, apr: false, art: false, blf: false,
        clm: false, crf: false, dev: false, dip: false, dis: false,
        esc: false, fly: false, han: false, hea: false, int: false,
        kar: false, kdu: false, ken: false, kge: false, khi: false,
        klo: false, kna: false, kno: false, kpl: false, kps: false,
        kre: false, lin: false, lor: false, per: false, prf: false,
        pro: false, rid: false, sen: false, slt: false, spl: false,
        ste: false, sur: false, swm: false, umd: false
      },
      creatureTypes: [],
      creatureSubtypes: [],
      languages: [],
      links: {
        supplements: []
      }
    },
    img: 'icons/environment/people/group.webp',
    flags: {
      'pf1-psionics': {
        sourceUrl: url
      }
    }
  };

  race.name = extractTitle(html) || '';
  race.name = race.name.replace(/\s*\(race\)\s*$/i, '').trim();
  const categories = extractPageCategories(html);
  if (!isPsionicRaceByCategories(categories)) {
    const sourceText = extractInfoboxData(html, 'sourcebook');
    if (!sourceText || !isPsionicSource(sourceText)) {
      return null;
    }
  }
  const abilityText = extractInfoboxData(html, 'ability') || extractInfoboxData(html, 'ability-scores');
  race.system.changes = parseAbilityScores(abilityText);
  const sizeText = extractInfoboxData(html, 'size');
  if (sizeText) race.system.size = parseSize(sizeText);
  const typeText = extractInfoboxData(html, 'type');
  const { types, subtypes } = parseCreatureTypes(typeText);
  race.system.creatureTypes = types;
  race.system.creatureSubtypes = subtypes;
  const langText = extractInfoboxData(html, 'languages');
  race.system.languages = parseLanguages(langText);

  // Split fluff vs trait sections
  const { fluffHTML, traitsHTML } = extractFluffAndTraits(html);
  race.system.description.value = fluffHTML;

  // Parse traits if present (standard and alternate only)
  const stdTraits = parseStandardTraits(traitsHTML, race.name);
  const altTraits = parseAlternateTraits(traitsHTML);
  const allTraits = [...stdTraits, ...altTraits];
  race._parsedTraits = allTraits.map(t => buildTraitItem(race, t));

  race.img = selectRaceIcon(race);
  return race;
}

/**
 * Scrape a single race page
 */
async function scrapeRace(url) {
  console.log(`Scraping: ${url}`);
  try {
    const html = await fetchHTML(url);
    console.log(`  Fetched ${html.length} bytes`);
    const race = parseRaceData(html, url);
    if (race) {
      console.log(`  ✓ Parsed: ${race.name}`);
      const traitCount = race._parsedTraits ? race._parsedTraits.length : 0;
      console.log(`  Traits parsed: ${traitCount}`);
      return race;
    } else {
      console.log(`  ⊘ Skipped: Not a psionic race`);
      return null;
    }
  } catch (error) {
    console.error(`  ✗ Error scraping ${url}:`, error.message);
    return null;
  }
}

/**
 * Scrape all races from category page (with pagination)
 */
async function scrapeAllRaces() {
  console.log('🔍 Scraping races from category...');

  const races = [];
  let currentUrl = CATEGORY_URL;
  let pageNumber = 1;

  while (currentUrl) {
    console.log(`\n📄 Page ${pageNumber}: ${currentUrl}`);

    const categoryHtml = await fetchHTML(currentUrl);
    const raceLinks = extractRaceLinks(categoryHtml);

    console.log(`Found ${raceLinks.length} race links on this page`);

    for (const link of raceLinks) {
      const raceUrl = BASE_URL + link;
      const race = await scrapeRace(raceUrl);

      if (race) {
        races.push(race);
      }

      // Rate limiting
      await delay(500);
    }

    // Check for next page
    currentUrl = extractNextPageLink(categoryHtml, 'races');
    if (currentUrl) {
      pageNumber++;
      await delay(1000); // Extra delay between pages
    }
  }

  return races;
}

/**
 * Scrape races from a list of URLs in a file
 */
async function scrapeFromList(filePath) {
  console.log(`📋 Reading URL list from: ${filePath}`);

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const urls = fileContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'));

  console.log(`Found ${urls.length} URLs to scrape`);

  const races = [];

  for (const url of urls) {
    const race = await scrapeRace(url);

    if (race) {
      races.push(race);
    }

    // Rate limiting
    await delay(500);
  }

  return races;
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  let races = [];
  try {
    if (args.length === 0) {
      races = await scrapeAllRaces();
    } else if (args[0] === '--list' && args[1]) {
      races = await scrapeFromList(args[1]);
    } else if (args[0] === '--category' && args[1]) {
      const customCategoryUrl = args[1];
      console.log(`🔍 Scraping from custom category: ${customCategoryUrl}`);
      const categoryHtml = await fetchHTML(customCategoryUrl);
      const raceLinks = extractRaceLinks(categoryHtml);
      for (const link of raceLinks) {
        const raceUrl = BASE_URL + link;
        const race = await scrapeRace(raceUrl);
        if (race) races.push(race);
        await delay(500);
      }
    } else {
      const race = await scrapeRace(args[0]);
      if (race) races.push(race);
    }

    // Separate base races and trait items
    const baseRaceItems = races.filter(r => r);
    const traitItems = [];
    for (const r of baseRaceItems) {
      if (Array.isArray(r._parsedTraits)) {
        traitItems.push(...r._parsedTraits.map(t => ({ ...t, _raceName: r.name })));
      }
    }

    console.log(`\n🧬 Races: ${baseRaceItems.length}, Trait items: ${traitItems.length}`);

    // Write all items together so trait items get subdirectory folder
    const rootDir = join(TOOLS_DIR, '..');
    const combined = [
      ...baseRaceItems,
      ...traitItems
    ];

    const stats = writeItemsWithDeduplication('races', combined, rootDir, {
      getSubdirectoryName: (item) => item._raceName ? item._raceName : undefined
    });

    // After writing, gather trait IDs per race and update base race links
    for (const r of baseRaceItems) {
      try {
        const packsSourceDir = join(rootDir, 'packs-source', 'races');
        const raceSlug = sluggify(r.name);
        // Locate base race file
        const baseFileRegex = new RegExp(`^${raceSlug}\.[A-Za-z0-9]{16}\.ya?ml$`);
        const files = fs.readdirSync(packsSourceDir);
        const baseFileName = files.find(f => baseFileRegex.test(f));
        if (!baseFileName) continue;
        const baseFilePath = join(packsSourceDir, baseFileName);
        // Locate folder directory
        const entries = fs.readdirSync(packsSourceDir, { withFileTypes: true });
        const folderDir = entries.find(e => e.isDirectory() && e.name.startsWith(`${raceSlug}.`));
        if (!folderDir) continue; // Traits folder may not exist if no traits
        const folderPath = join(packsSourceDir, folderDir.name);
        const traitFiles = fs.readdirSync(folderPath).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
        const supplements = [];
        for (const tf of traitFiles) {
          if (tf === '_Folder.yaml') continue;
          const content = fs.readFileSync(join(folderPath, tf), 'utf8');
          let data; try { data = yaml.load(content); } catch { continue; }
          if (data && data._id && data.name) {
            supplements.push({ name: data.name, uuid: `Compendium.pf1-psionics.races.Item.${data._id}` });
          }
        }
        // Update base race file
        const baseContent = fs.readFileSync(baseFilePath, 'utf8');
        const baseData = yaml.load(baseContent);
        baseData.system = baseData.system || {};
        baseData.system.links = baseData.system.links || {};
        baseData.system.links.supplements = supplements.sort((a, b) => a.name.localeCompare(b.name));
        const updatedYaml = yaml.dump(baseData, { sortKeys: true, lineWidth: -1 });
        fs.writeFileSync(baseFilePath, updatedYaml, 'utf8');
        console.log(`  🔗 Linked ${supplements.length} traits to ${r.name}`);
      } catch (e) {
        console.error(`  ⚠ Failed linking traits for ${r.name}: ${e.message}`);
      }
    }

    console.log(`\n✅ Done! Written: ${stats.written}, Updated: ${stats.updated}, Errors: ${stats.errors.length}`);
    console.log('\n💡 Next: Review trait files, adjust mechanical changes, then run npm run packs:compile');
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the scraper
main();
