/**
 * Psionic Feats Web Scraper
 *
 * This script scrapes psionic feat data from metzo.miraheze.org
 * and outputs YAML files directly to packs-source/feats/ for version control.
 *
 * Usage:
 *   node feats-scraper.mjs                                   # Scrape all feats (default category)
 *   node feats-scraper.mjs <url>                             # Single feat to YAML
 *   node feats-scraper.mjs --list <file>                     # URL list file to YAML
 *   node feats-scraper.mjs --category <url>                  # Use custom base category URL
 *
 * Examples:
 *   node feats-scraper.mjs                                   # Scrape all → packs-source/feats/*.yaml
 *   node feats-scraper.mjs --list tools/data/feat-urls.txt   # Bulk import to YAML
 *   node feats-scraper.mjs "https://metzo.miraheze.org/wiki/Empower_Power"  # Single feat
 *   node feats-scraper.mjs --category "https://metzo.miraheze.org/wiki/Category:Custom_Feats"
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
  extractPageCategories,
  sluggify,
  generateFoundryId
} from './common.mjs';

const { TOOLS_DIR } = getScraperPaths(import.meta.url);

const CATEGORY_URL = 'https://metzo.miraheze.org/wiki/Category:Dreamscarred_Press_feats';
const BASE_URL = 'https://metzo.miraheze.org/wiki/';

// Valid psionic source books (not Path of War, Akashic, etc.)
// Used for both infobox source validation and category source validation
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
 * Extract feat links from category page
 */
function extractFeatLinks(html) {
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
 * Determine feat type from text
 */
function determineFeatTypes(typeText) {
  if (!typeText) return [];

  const types = [];
  const typeLower = typeText.toLowerCase();

  if (typeLower.includes('psionic')) types.push('psionic');
  if (typeLower.includes('metapsionic')) types.push('metapsionic');
  if (typeLower.includes('combat')) types.push('combat');
  if (typeLower.includes('item creation')) types.push('itemCreation');
  if (typeLower.includes('metamagic')) types.push('metamagic');
  if (typeLower.includes('teamwork')) types.push('teamwork');
  if (typeLower.includes('critical')) types.push('critical');

  // Default to feat if no specific type found
  if (types.length === 0) types.push('feat');

  return types;
}

/**
 * Extract source information from categories
 * Categories like "Source: Ultimate Psionics" or "Source: Psionics Unleashed"
 *
 * @param {Array} categories - Array of category objects
 * @returns {Array} - Array of source objects
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
      pages: '', // Can't extract pages from categories
      id: '',
      errata: '',
      date: '',
      publisher: 'Dreamscarred Press'
    });
  }

  return sources;
}

/**
 * Check if a feat is psionic based on its categories
 *
 * @param {Array} categories - Array of category objects
 * @returns {boolean} - True if feat belongs to psionic source categories
 */
function isPsionicFeatByCategories(categories) {
  return categories.some(cat => {
    const catName = cat.name || cat.slug;
    return PSIONIC_SOURCES.some(source =>
      catName.includes(`${source}`)
    );
  });
}

/**
 * Check if categories contain "feat" or "feats"
 *
 * @param {Array} categories - Array of category objects
 * @returns {boolean} - True if any category name contains "feat" or "feats"
 */
function hasFeatCategory(categories) {
  return categories.some(cat => {
    const catName = (cat.name || cat.slug || '').toLowerCase();
    return catName.includes('feat');
  });
}

/**
 * Extract feat types from categories
 * Categories like "Metapsionic feats", "Combat feats", "Psionic feats"
 *
 * @param {Array} categories - Array of category objects
 * @returns {Array} - Array of feat type strings
 */
function extractFeatTypesFromCategories(categories) {
  const types = [];

  const typeMap = {
    'metapsionic feats': 'metapsionic',
    'psionic feats': 'psionic',
    'combat feats': 'combat',
    'item creation feats': 'itemCreation',
    'metamagic feats': 'metamagic',
    'teamwork feats': 'teamwork',
    'critical feats': 'critical'
  };

  for (const cat of categories) {
    const catNameLower = (cat.name || cat.slug).toLowerCase();

    // Use exact match instead of includes to prevent "metapsionic feats"
    // from matching both "metapsionic" and "psionic"
    for (const [pattern, type] of Object.entries(typeMap)) {
      if (catNameLower === pattern && !types.includes(type)) {
        types.push(type);
      }
    }
  }

  // Default to feat if no specific type found
  if (types.length === 0) types.push('feat');

  return types;
}

/**
 * Select an appropriate icon for a feat based on its characteristics
 */
function selectFeatIcon(feat) {
  const tags = feat.system.tags || [];
  const name = feat.name.toLowerCase();

  // Check name keywords first for most specific matches
  // Use high-quality webp icons from Foundry base installation (validated against AVAILABLE-ICONS.md)
  if (name.includes('psicrystal')) return 'icons/commodities/gems/gem-faceted-diamond-blue.webp';
  if (name.includes('focus') || name.includes('meditation')) return 'icons/magic/perception/third-eye-blue-red.webp';
  if (name.includes('empower') || name.includes('maximize') || name.includes('augment')) return 'icons/magic/symbols/runes-triangle-orange.webp';
  if (name.includes('shield') || name.includes('defend') || name.includes('armor')) return 'icons/equipment/shield/heater-crystal-blue.webp';
  if (name.includes('mental') || name.includes('mind')) return 'icons/magic/perception/eye-ringed-glow-angry-small-teal.webp';
  if (name.includes('body') || name.includes('physical')) return 'icons/magic/life/heart-glowing-red.webp';
  if (name.includes('weapon')) return 'icons/weapons/swords/greatsword-crossguard-blue.webp';
  if (name.includes('power') && name.includes('attack')) return 'icons/magic/fire/projectile-fireball-smoke-large-orange.webp';
  if (name.includes('manifesting') || name.includes('manifest')) return 'icons/magic/symbols/question-stone-yellow.webp';
  if (name.includes('throw') || name.includes('shot')) return 'icons/weapons/thrown/bomb-fuse-black.webp';

  // Check feat type from tags (more general categories)
  if (tags.includes('metapsionic')) return 'icons/magic/symbols/runes-carved-stone-purple.webp';
  if (tags.includes('psionic')) return 'icons/magic/symbols/runes-star-magenta.webp';
  if (tags.includes('combat')) return 'icons/skills/melee/hand-grip-sword-orange.webp';
  if (tags.includes('itemcreation')) return 'icons/containers/chest/chest-oak-steel-brown.webp';
  if (tags.includes('metamagic')) return 'icons/magic/symbols/runes-etched-steel-blade.webp';
  if (tags.includes('teamwork')) return 'icons/skills/social/diplomacy-unity-alliance.webp';
  if (tags.includes('critical')) return 'icons/skills/melee/hand-grip-sword-strike-orange.webp';

  // Default feat icon
  return 'icons/sundries/books/book-embossed-blue.webp';
}

/**
 * Find existing YAML file for a feat by name
 *
 * @param {string} featName - Name of the feat to find
 * @param {string} packsSourceDir - Path to packs-source/feats directory
 * @returns {string|null} - Full path to existing YAML file, or null if not found
 */
function findExistingFeatFile(featName, packsSourceDir) {
  if (!fs.existsSync(packsSourceDir)) {
    return null;
  }

  const slug = sluggify(featName);
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
 * Parse feat data from HTML page
 */
function parseFeatData(html, url) {
  const feat = {
    name: '',
    type: 'feat',
    system: {
      description: {
        value: ''
      },
      tags: [],
      sources: [], // Will be populated from sourcebook field
      featType: 'feat',
      abilityType: 'none',
      // Required PF1 feat fields
      subType: 'feat',
      acquired: false,
      disabled: false,
      inherited: false,
      showInQuickbar: false,
      simple: false,
      summons: false,
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
  feat.name = extractTitle(html) || '';

  // Strip "(feat)" suffix from name if present
  feat.name = feat.name.replace(/\s*\(feat\)\s*$/i, '').trim();

  // Strip book abbreviations like (PA:FaP), (APG), (UC), etc.
  // These are source book abbreviations that shouldn't be in the feat name
  feat.name = feat.name.replace(/\s*\([A-Z]+:[A-Z]+\)\s*$/i, '').trim();
  feat.name = feat.name.replace(/\s*\([A-Z]+\)\s*$/i, '').trim();

  // Exclude Mythic feats
  if (feat.name.includes('(Mythic)')) {
    return null; // Skip Mythic feats
  }

  // Extract page categories
  const categories = extractPageCategories(html);

  // Check if this is a feat based on categories (must have "feat" in category name)
  if (!hasFeatCategory(categories)) {
    return null; // Not a feat
  }

  // Check if this is a psionic feat based on categories
  if (!isPsionicFeatByCategories(categories)) {
    // Fallback to old method if no categories found
    const sourceText = extractInfoboxData(html, 'sourcebook');
    if (!sourceText || !isPsionicSource(sourceText)) {
      return null; // Not a psionic feat
    }
  }

  // Extract sources from infobox first (preferred - has page numbers), then fall back to categories
  const sourcebookMatch = html.match(/data-source="sourcebook"[^>]*>([\s\S]*?)<\/td>/i);
  if (sourcebookMatch) {
    feat.system.sources = parseSourcebooks(sourcebookMatch[1]);
  } else {
    // Fallback to extracting from categories
    const categorySources = extractSourcesFromCategories(categories);
    if (categorySources.length > 0) {
      feat.system.sources = categorySources;
    }
  }

  // Extract feat types from infobox first (preferred), then fall back to categories
  const typeText = extractInfoboxData(html, 'type');
  let types = [];
  if (typeText) {
    types = determineFeatTypes(typeText);
  } else {
    // Fallback to extracting from categories
    types = extractFeatTypesFromCategories(categories);
  }

  // Always set featType to "feat" (PF1 system requirement)
  feat.system.featType = 'feat';
  // Store type subcategories in tags
  feat.system.tags.push(...types);

  // Extract prerequisites
  const prerequisitesText = extractInfoboxData(html, 'prerequisites');
  if (prerequisitesText && !prerequisitesText.toLowerCase().includes('none')) {
    feat.system.tags.push(`Prerequisite: ${prerequisitesText}`);
  }

  // Extract description using shared function
  feat.system.description.value = extractDescription(html);

  // Note: Sources are already extracted from categories or sourcebook field above

  // Select an appropriate icon based on feat characteristics
  feat.img = selectFeatIcon(feat);

  return feat;
}

/**
 * Scrape a single feat page
 */
async function scrapeFeat(url) {
  console.log(`Scraping: ${url}`);

  try {
    const html = await fetchHTML(url);
    console.log(`  Fetched ${html.length} bytes`);

    const feat = parseFeatData(html, url);

    if (feat) {
      console.log(`  ✓ Parsed: ${feat.name} (${feat.system.featType})`);
      console.log(`  Sources: ${feat.system.sources.length}, Tags: ${feat.system.tags.join(', ')}`);
      return feat;
    } else {
      console.log(`  ⊘ Skipped: Not a psionic feat`);
      return null;
    }
  } catch (error) {
    console.error(`  ✗ Error scraping ${url}:`, error.message);
    console.error(`  Stack:`, error.stack);
    return null;
  }
}

/**
 * Scrape multiple feat pages from a list of URLs
 */
async function scrapeFeats(urls) {
  const feats = [];

  for (const url of urls) {
    const feat = await scrapeFeat(url);
    if (feat) {
      feats.push(feat);
    }

    // Be nice to the server - wait 1 second between requests
    await delay(1000);
  }

  return feats;
}

/**
 * Extract all feat URLs from category pages with pagination
 */
async function extractAllFeatUrls(categoryUrl = CATEGORY_URL) {
  console.log('Extracting feat URLs from category pages...\n');

  const allFeatNames = new Set();
  let currentUrl = categoryUrl;
  let pageNum = 1;

  // Extract the category name pattern from the provided URL for flexible pagination
  // Pattern: https://metzo.miraheze.org/wiki/Category:SomeCategory
  const categoryMatch = categoryUrl.match(/\/Category:([^?&\s]+)/);
  const categoryName = categoryMatch ? categoryMatch[1] : null;

  while (currentUrl) {
    console.log(`Page ${pageNum}: ${currentUrl}`);
    const html = await fetchHTML(currentUrl);
    const featNames = extractFeatLinks(html);
    console.log(`  Found ${featNames.length} feats on this page`);

    featNames.forEach(name => allFeatNames.add(name));

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
      nextUrl = extractNextPageLink(html, 'feats');
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

  console.log(`\nTotal feats found: ${allFeatNames.size}\n`);

  // Convert to full URLs
  return Array.from(allFeatNames).sort().map(name => `${BASE_URL}${name}`);
}

/**
 * Write feats to YAML files, updating existing files or creating new ones
 */
function writeFeatsWithDeduplication(feats, rootDir) {
  const packsSourceDir = join(rootDir, 'packs-source', 'feats');

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

  for (const feat of feats) {
    try {
      // Check if a YAML file already exists for this feat
      const existingFile = findExistingFeatFile(feat.name, packsSourceDir);

      if (existingFile) {
        // Read existing YAML to preserve the ID and _key
        const existingContent = fs.readFileSync(existingFile, 'utf8');
        const existingFeat = yaml.load(existingContent);

        // Preserve the existing ID and _key
        feat._id = existingFeat._id;
        feat._key = existingFeat._key;

        // Update the file
        const yamlContent = yaml.dump(feat, {
          sortKeys: true,
          lineWidth: -1
        });

        fs.writeFileSync(existingFile, yamlContent, 'utf8');
        stats.updated++;
        console.log(`  📝 Updated: ${feat.name}`);
      } else {
        // Create new file - generate a new Foundry-compatible ID
        feat._id = generateFoundryId(existingIds);
        feat._key = `!items!${feat._id}`;
        existingIds.add(feat._id); // Add to set to prevent duplicates in same batch
        const slug = sluggify(feat.name);
        const filename = `${slug}.${feat._id}.yaml`;
        const filepath = join(packsSourceDir, filename);

        const yamlContent = yaml.dump(feat, {
          sortKeys: true,
          lineWidth: -1
        });

        fs.writeFileSync(filepath, yamlContent, 'utf8');
        stats.written++;
        console.log(`  ✨ Created: ${feat.name}`);
      }
    } catch (error) {
      stats.errors.push({ item: feat.name, error: error.message });
      stats.skipped++;
      console.error(`  ✗ Error writing ${feat.name}: ${error.message}`);
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
        console.error('Usage: node feats-scraper.mjs --category <category-url>');
        process.exit(1);
      }
      i++;
    } else if (arg === '--list') {
      // --list <file> - Read URLs from file
      const urlFile = args[++i];
      if (!urlFile) {
        console.error('Error: No URL list file specified');
        console.error('Usage: node feats-scraper.mjs --list <url-list-file>');
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
    console.log('No URLs specified - scraping all feats from category\n');
    urls = await extractAllFeatUrls(categoryUrl);
  }

  console.log(`Scraping ${urls.length} feat(s)...\n`);

  const feats = await scrapeFeats(urls);

  // Filter out nulls (skipped non-psionic feats)
  const psionicFeats = feats.filter(f => f !== null);

  console.log('');
  console.log(`Scraped ${psionicFeats.length} psionic feats successfully`);
  console.log(`Skipped ${feats.length - psionicFeats.length} non-psionic feats\n`);

  // Write as YAML files to packs-source/feats/ with deduplication
  const rootDir = join(TOOLS_DIR, '..');
  const stats = writeFeatsWithDeduplication(psionicFeats, rootDir);

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

export { scrapeFeat, scrapeFeats, parseFeatData };
