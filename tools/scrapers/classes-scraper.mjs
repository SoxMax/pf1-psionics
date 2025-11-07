/**
 * Psionic Classes Web Scraper
 *
 * This script scrapes psionic class and class ability data from metzo.miraheze.org
 * and outputs YAML files directly to packs-source/classes/ and packs-source/class-abilities/.
 *
 * Usage:
 *   node classes-scraper.mjs                    # Scrape all classes
 *   node classes-scraper.mjs <url>              # Single class
 *   node classes-scraper.mjs --test             # Run tests
 *
 * Features:
 *   - Unified scraper outputs both classes and class ability items
 *   - Filters for Ultimate Psionics and Psionics Augmented sources only
 *   - Parses class stats from infobox (HD, BAB, saves, skills per level)
 *   - Extracts class features from class table "Special" column
 *   - Handles progressive abilities (single item, multiple level associations)
 *   - Creates class ability items as feats with subType: classFeat
 *   - Links abilities to classes via classAssociations with stable UUIDs
 *
 * After scraping, run `npm run packs:compile` to build the LevelDB compendium.
 */

import fs from 'fs';
import path from 'path';
import {
  getScraperPaths,
  fetchHTML,
  extractInfoboxData,
  sluggify,
  generateFoundryId,
  writeYAMLPack
} from './common.mjs';

const { TOOLS_DIR } = getScraperPaths(import.meta.url);

/**
 * Generate a deterministic 16-character ID from a string
 * @param {string} input - Input string to hash
 * @returns {string} - 16-character ID
 */
function generateDeterministicId(input) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Generate 16-character ID from hash
  let id = '';
  let seed = Math.abs(hash);
  for (let i = 0; i < 16; i++) {
    // Use a simple LCG (Linear Congruential Generator) for additional characters
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    id += chars.charAt(seed % chars.length);
  }

  return id;
}

/**
 * Extract class list from Psionic (system) page
 * @param {string} html - HTML content
 * @returns {Array} - Array of {name, url, hd, bab, sources}
 */
function extractClassList(html) {
  const classes = [];
  const tableRegex = /<table[^>]*class="wikitable[^>]*>[\s\S]*?<\/table>/i;
  const tableMatch = html.match(tableRegex);

  if (!tableMatch) return classes;

  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;

  while ((rowMatch = rowRegex.exec(tableMatch[0])) !== null) {
    const row = rowMatch[1];

    // Skip header rows
    if (row.includes('<th')) continue;

    // Extract cells
    const cells = [];
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let cellMatch;

    while ((cellMatch = cellRegex.exec(row)) !== null) {
      cells.push(cellMatch[1]);
    }

    if (cells.length < 8) continue;

    // Extract class name and URL from first cell
    const nameMatch = cells[0].match(/<a[^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/);
    if (!nameMatch) continue;

    const url = nameMatch[1];
    const name = nameMatch[2];

    // Extract HD (column 2)
    const hd = cells[2].trim();

    // Extract BAB (column 4)
    const bab = cells[4].trim();

    // Extract sources (last column - either index 8 for base classes or last available)
    const sourceCell = cells[cells.length - 1];
    const sources = [];
    const sourceRegex = /<a[^>]*>([^<]*)<\/a>/g;
    let sourceMatch;

    while ((sourceMatch = sourceRegex.exec(sourceCell)) !== null) {
      sources.push(sourceMatch[1]);
    }

    // Filter for Ultimate Psionics or Psionics Augmented
    const validSources = sources.filter(s =>
      s.includes('Ultimate Psionics') || s.includes('Psionics Augmented')
    );

    if (validSources.length === 0) continue;

    classes.push({
      name,
      url,
      hd,
      bab,
      sources: validSources
    });
  }

  return classes;
}

/**
 * Convert BAB string to PF1 format
 * @param {string} bab - BAB value ("1", "3/4", "1/2")
 * @returns {string} - "high", "med", or "low"
 */
function convertBAB(bab) {
  const babMap = {
    '1': 'high',
    '3/4': 'med',
    '1/2': 'low'
  };

  return babMap[bab] || 'low';
}

/**
 * Convert save string to PF1 format
 * @param {string} save - Save value ("Good", "Poor")
 * @returns {string} - "high" or "low"
 */
function convertSave(save) {
  if (!save) return 'low';
  return save.toLowerCase().includes('good') ? 'high' : 'low';
}

/**
 * Parse class table to extract features by level
 * @param {string} html - Class page HTML
 * @returns {Map<number, string[]>} - Map of level to feature names
 */
function parseClassTable(html) {
  const features = new Map();

  // Find Class Features section
  const classFeaturesRegex = /<h2[^>]*>Class Features<\/h2>([\s\S]*?)(?=<h2|$)/i;
  const sectionMatch = html.match(classFeaturesRegex);

  if (!sectionMatch) return features;

  // Find table with Special column
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/i;
  const tableMatch = sectionMatch[1].match(tableRegex);

  if (!tableMatch) return features;

  // Parse rows
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch;
  let specialColumnIndex = -1;

  while ((rowMatch = rowRegex.exec(tableMatch[0])) !== null) {
    const row = rowMatch[1];

    // Find Special column index in header
    if (row.includes('<th') && specialColumnIndex === -1) {
      const headers = [];
      const headerRegex = /<th[^>]*>([\s\S]*?)<\/th>/gi;
      let headerMatch;

      while ((headerMatch = headerRegex.exec(row)) !== null) {
        headers.push(headerMatch[1]);
      }

      specialColumnIndex = headers.findIndex(h => h.includes('Special'));
      continue;
    }

    if (specialColumnIndex === -1) continue;

    // Extract cells
    const cells = [];
    const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    let cellMatch;

    while ((cellMatch = cellRegex.exec(row)) !== null) {
      // Remove HTML tags but keep text
      const cellText = cellMatch[1].replace(/<[^>]*>/g, '');
      cells.push(cellText.trim());
    }

    if (cells.length <= specialColumnIndex) continue;

    // Extract level (remove "st", "nd", "rd", "th")
    const levelText = cells[0].replace(/[a-z]+$/i, '');
    const level = parseInt(levelText);

    if (isNaN(level)) continue;

    // Extract features from Special column
    const specialText = cells[specialColumnIndex];

    if (!specialText || specialText === '—' || specialText === '-') continue;

    // Split on comma and clean up
    const featureNames = specialText
      .split(/[,;]/)
      .map(f => f.trim())
      .map(f => f.replace(/\s*\([^)]*\)/, '')) // Remove parenthetical like "(Ex)"
      .map(f => f.replace(/\s*[+\-]\d+$/, '')) // Remove trailing modifiers like "+1" or "-2"
      .filter(f => f.length > 0);

    features.set(level, featureNames);
  }

  return features;
}

/**
 * Extract class description from page
 * @param {string} html - Class page HTML
 * @returns {string} - Class description HTML
 */
function extractClassDescription(html) {
  // Find content between infobox and "Class Features" heading
  const startRegex = /<\/aside>[\s\S]*?<p[^>]*>/;
  const endRegex = /<div[^>]*class="mw-heading[^>]*><h2[^>]*>Class Features<\/h2>/i;

  const startMatch = html.match(startRegex);
  const endMatch = html.match(endRegex);

  if (!startMatch || !endMatch) return '';

  const startPos = startMatch.index + startMatch[0].length - 3; // Keep the <p>
  const endPos = endMatch.index;

  let description = html.substring(startPos, endPos);

  // Clean up the description
  description = description
    .replace(/<p class="mw-empty-elt"><\/p>/g, '')
    .replace(/\n/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/'/g, "'")
    .replace(/×/g, 'x')
    .trim();

  // Remove trailing incomplete tags at start
  description = description.replace(/^[^<]*?>/, '');

  return description;
}

/**
 * Extract saves from infobox horizontal table
 * @param {string} html - Class page HTML
 * @returns {object} - {fort, ref, will} save values
 */
function extractSaves(html) {
  const saves = {};

  // Find the horizontal table with save data
  const tableRegex = /<table class="pi-horizontal-group">[\s\S]*?<\/table>/;
  const tableMatch = html.match(tableRegex);

  if (!tableMatch) return { fort: undefined, ref: undefined, will: undefined };

  const table = tableMatch[0];

  // Extract each save type from <td> elements (not <th>)
  const fortMatch = table.match(/<td[^>]+data-source="savefort"[^>]*>([^<]*(?:<[^>]+>[^<]*<\/[^>]+>)*[^<]*)<\/td>/);
  const refMatch = table.match(/<td[^>]+data-source="saveref"[^>]*>([^<]*(?:<[^>]+>[^<]*<\/[^>]+>)*[^<]*)<\/td>/);
  const willMatch = table.match(/<td[^>]+data-source="savewill"[^>]*>([^<]*(?:<[^>]+>[^<]*<\/[^>]+>)*[^<]*)<\/td>/);

  if (fortMatch) {
    const text = fortMatch[1].replace(/<[^>]+>/g, '').trim();
    saves.fort = text.includes('Good') ? 'Good' : 'Poor';
  }
  if (refMatch) {
    const text = refMatch[1].replace(/<[^>]+>/g, '').trim();
    saves.ref = text.includes('Good') ? 'Good' : 'Poor';
  }
  if (willMatch) {
    const text = willMatch[1].replace(/<[^>]+>/g, '').trim();
    saves.will = text.includes('Good') ? 'Good' : 'Poor';
  }

  return saves;
}

/**
 * Extract starting wealth from page text
 * @param {string} html - Class page HTML
 * @returns {string} - Starting wealth formula (e.g., "4d4 * 10")
 */
function extractStartingWealth(html) {
  const wealthRegex = /<b>Starting Wealth:<\/b>\s*(\d+d\d+)\s*×\s*10/i;
  const match = html.match(wealthRegex);

  if (match) {
    return `${match[1]} * 10`;
  }

  return '2d6 * 10'; // Default
}

/**
 * Extract class skills from page text
 * @param {string} html - Class page HTML
 * @returns {string[]} - Array of skill names
 */
function extractClassSkills(html) {
  const skillsRegex = /<b>Class Skills:?\s*<\/b>\s*(?:The [^']+?'s class skills are\s+)?([^<]+)/i;
  const match = html.match(skillsRegex);

  if (!match) return [];

  // Parse skill names from the text
  const skillText = match[1];
  const skills = skillText
    .split(/,\s*(?:and\s+)?/)
    .map(s => s.trim())
    .map(s => s.replace(/\.$/, ''))
    .filter(s => s.length > 0);

  return skills;
}

/**
 * Map skill names to PF1 skill codes
 * @param {string[]} skillNames - Array of skill names
 * @returns {object} - Object mapping skill codes to boolean
 */
function mapSkillsToCodes(skillNames) {
  const skillMap = {
    'Acrobatics': 'acr',
    'Appraise': 'apr',
    'Artistry': 'art',
    'Autohypnosis': 'ahp',
    'Bluff': 'blf',
    'Climb': 'clm',
    'Craft': 'crf',
    'Diplomacy': 'dip',
    'Disable Device': 'dev',
    'Disguise': 'dis',
    'Escape Artist': 'esc',
    'Fly': 'fly',
    'Handle Animal': 'han',
    'Heal': 'hea',
    'Intimidate': 'int',
    'Knowledge (arcana)': 'kar',
    'Knowledge (dungeoneering)': 'kdu',
    'Knowledge (engineering)': 'ken',
    'Knowledge (geography)': 'kge',
    'Knowledge (history)': 'khi',
    'Knowledge (local)': 'klo',
    'Knowledge (nature)': 'kna',
    'Knowledge (nobility)': 'kno',
    'Knowledge (planes)': 'kpl',
    'Knowledge (psionics)': 'kps',
    'Knowledge (religion)': 'kre',
    'Linguistics': 'lin',
    'Lore': 'lor',
    'Perception': 'per',
    'Perform': 'prf',
    'Profession': 'pro',
    'Ride': 'rid',
    'Sense Motive': 'sen',
    'Sleight of Hand': 'slt',
    'Spellcraft': 'spl',
    'Stealth': 'ste',
    'Survival': 'sur',
    'Swim': 'swm',
    'Use Magic Device': 'umd'
  };

  // Initialize all skills to false
  const result = {};
  for (const code of Object.values(skillMap)) {
    result[code] = false;
  }

  // Set matched skills to true
  for (const skillName of skillNames) {
    const code = skillMap[skillName];
    if (code) {
      result[code] = true;
    } else {
      // Try partial matching for Knowledge skills
      const knowledgeMatch = skillName.match(/Knowledge \(([^)]+)\)/i);
      if (knowledgeMatch) {
        const subject = knowledgeMatch[1].toLowerCase();
        for (const [fullName, skillCode] of Object.entries(skillMap)) {
          if (fullName.toLowerCase().includes(subject)) {
            result[skillCode] = true;
            break;
          }
        }
      }
    }
  }

  return result;
}

/**
 * Parse source information from sourcebook text
 * @param {string} sourceText - Source text (e.g., "Ultimate Psionics, pgs. 69–72")
 * @returns {object} - Source object with title, pages, publisher, date
 */
function parseSourceInfo(sourceText) {
  // Known publication dates and publishers
  const sourceMetadata = {
    'Ultimate Psionics': {
      date: '2013-12-24',
      publisher: 'Dreamscarred Press'
    },
    'Psionics Expanded': {
      date: '2012-07-23',
      publisher: 'Dreamscarred Press'
    },
    'Psionics Augmented': {
      date: '2012-01-01',
      publisher: 'Dreamscarred Press'
    },
    'Psionics Unleashed': {
      date: '2010-08-01',
      publisher: 'Dreamscarred Press'
    }
  };

  // Extract title and pages
  const match = sourceText.match(/([^,]+?)(?:,\s*pgs?\.?\s*([\d–\-]+))?$/);

  if (!match) return null;

  const title = match[1].trim();
  const pages = match[2] || '';

  const metadata = sourceMetadata[title] || {
    date: '2010-01-01',
    publisher: 'Dreamscarred Press'
  };

  return {
    title: title,
    pages: pages,
    publisher: metadata.publisher,
    date: metadata.date
  };
}

/**
 * Extract source information from infobox
 * @param {string} html - Class page HTML
 * @returns {Array} - Array of source objects
 */
function extractSources(html) {
  const sources = [];

  // Find sourcebook data-source element
  const sourceRegex = /data-source="sourcebook"[^>]*>([\s\S]*?)<\/td>/;
  const match = html.match(sourceRegex);

  if (!match) return sources;

  const sourceHTML = match[1];

  // Extract individual source entries (separated by <br />)
  const entries = sourceHTML.split(/<br\s*\/?>/i);

  for (const entry of entries) {
    // Remove HTML tags but keep the text
    const text = entry.replace(/<\/?i>/g, '').replace(/<a[^>]*>([^<]+)<\/a>/g, '$1').trim();

    if (!text) continue;

    const sourceInfo = parseSourceInfo(text);
    if (sourceInfo) {
      sources.push(sourceInfo);
    }
  }

  return sources;
}

/**
 * Extract weapon and armor proficiencies from page text
 * @param {string} html - Class page HTML
 * @returns {object} - {weapons: string[], armor: string[]}
 */
function extractProficiencies(html) {
  const profRegex = /<b>Weapon and Armor Proficiencies:<\/b>\s*([^<]+(?:<[^>]+>[^<]+<\/[^>]+>)*[^<]*)/i;
  const match = html.match(profRegex);

  if (!match) return { weapons: ['simple'], armor: [] };

  const text = match[1].toLowerCase();

  const weapons = [];
  const armor = [];

  // Parse weapons
  if (text.includes('all simple')) weapons.push('simple');
  if (text.includes('all martial')) weapons.push('martial');
  if (text.includes('all exotic')) weapons.push('exotic');

  // Parse armor
  if (text.includes('light armor')) armor.push('lgt');
  if (text.includes('medium armor')) armor.push('med');
  if (text.includes('heavy armor')) armor.push('hvy');
  if (text.includes('all armor')) armor.push('lgt', 'med', 'hvy');

  return {
    weapons: weapons.length > 0 ? weapons : ['simple'],
    armor: armor
  };
}

/**
 * Parse class feature descriptions from Class Features section
 * @param {string} html - Class page HTML
 * @param {string[]} featureNames - Feature names to find
 * @returns {Map<string, string>} - Map of feature name to description HTML
 */
function parseClassFeatures(html, featureNames) {
  const descriptions = new Map();

  // Find Class Features section
  const classFeaturesRegex = /<h2[^>]*>Class Features<\/h2>([\s\S]*?)(?=<h2|$)/i;
  const sectionMatch = html.match(classFeaturesRegex);

  if (!sectionMatch) return descriptions;

  const section = sectionMatch[1];

  for (const featureName of featureNames) {
    // Look for <b>Feature Name:</b> or <b>Feature Name (Ex):</b> patterns
    const escapedName = featureName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const featureRegex = new RegExp(
      `<b>${escapedName}(?:\\s*\\([^)]*\\))?:</b>([^<]*(?:<[^b][^>]*>[^<]*</[^>]+>)*[^<]*)`,
      'i'
    );

    const featureMatch = section.match(featureRegex);

    if (featureMatch) {
      descriptions.set(featureName, `<p><b>${featureName}:</b>${featureMatch[1]}</p>`);
    } else {
      // Fallback: use feature name as description
      descriptions.set(featureName, `<p>${featureName}</p>`);
    }
  }

  return descriptions;
}

/**
 * Detect ability type from description
 * @param {string} description - Feature description
 * @returns {string} - "ex", "su", or "sp"
 */
function detectAbilityType(description) {
  if (description.includes('(Ex)')) return 'ex';
  if (description.includes('(Su)')) return 'su';
  if (description.includes('(Sp)')) return 'sp';
  if (description.toLowerCase().includes('supernatural')) return 'su';
  if (description.toLowerCase().includes('spell-like')) return 'sp';
  return 'ex'; // Default
}

/**
 * Build class ability item
 * @param {string} name - Feature name
 * @param {number} level - Level gained
 * @param {string} className - Class name
 * @param {string} description - Feature description HTML
 * @param {Array} sources - Source information array
 * @returns {object} - Class ability item
 */
function buildClassAbility(name, level, className, description, sources = []) {
  // Generate stable UUID based on class and feature name
  const id = generateDeterministicId(`${className}-${name}`);

  return {
    _id: id,
    _key: `!items!${id}`,
    _stats: {
      coreVersion: '13.350'
    },
    img: 'systems/pf1/icons/feats/skill-focus.jpg',
    name: name,
    type: 'feat',
    system: {
      abilityType: detectAbilityType(description),
      associations: {
        classes: [className]
      },
      description: {
        value: description
      },
      sources: sources,
      subType: 'classFeat',
      tag: sluggify(name)
    }
  };
}

/**
 * Build class item with associations
 * @param {object} classData - Class data extracted from page
 * @param {Array} abilities - Array of class ability items
 * @param {Map} featuresByLevel - Map of level to feature names
 * @returns {object} - Class item
 */
function buildClassItem(classData, abilities, featuresByLevel) {
  const id = generateDeterministicId(classData.name);

  // Build classAssociations array
  const classAssociations = [];

  for (const [level, featureNames] of featuresByLevel) {
    for (const featureName of featureNames) {
      // Find matching ability
      const ability = abilities.find(a => a.name === featureName);
      if (ability) {
        classAssociations.push({
          level: level,
          uuid: `Compendium.pf1-psionics.class-abilities.Item.${ability._id}`
        });
      }
    }
  }

  const system = {
    armorProf: classData.armorProf || [],
    bab: convertBAB(classData.bab),
    classSkills: classData.classSkills || {},
    description: {
      summary: '',
      value: classData.description || ''
    },
    hd: parseInt(classData.hd.replace('d', '')),
    hp: parseInt(classData.hd.replace('d', '')),
    level: 1,
    links: {
      classAssociations: classAssociations
    },
    savingThrows: {
      fort: {
        value: convertSave(classData.saves?.fort)
      },
      ref: {
        value: convertSave(classData.saves?.ref)
      },
      will: {
        value: convertSave(classData.saves?.will)
      }
    },
    skillsPerLevel: parseInt(classData.skillsPerLevel) || 2,
    sources: classData.sources || [],
    subType: 'base',
    tag: sluggify(classData.name),
    wealth: classData.wealth || '2d6 * 10',
    weaponProf: classData.weaponProf || ['simple']
  };

  // Add manifesting section for psionic classes
  if (classData.isPsionic) {
    system.manifesting = {
      ability: 'wis', // Default, could be parsed from page
      cantrips: true,
      progression: 'high' // Default, could be parsed from class table
    };
  }

  return {
    _id: id,
    _key: `!items!${id}`,
    _stats: {
      coreVersion: '13.350'
    },
    img: 'systems/pf1/icons/items/inventory/brain-purple.png',
    name: classData.name,
    type: 'class',
    system: system
  };
}

/**
 * Scrape a single class
 * @param {string} url - Class page URL or class name
 * @param {string} className - Class name (optional if URL)
 * @returns {Promise<{classItem, abilities}>}
 */
async function scrapeClass(url, className) {
  console.log(`  Scraping ${className || url}...`);

  // Fetch class page
  const html = await fetchHTML(url);

  // Extract class name from URL if not provided
  if (!className) {
    const urlMatch = url.match(/\/wiki\/([^/]+)$/);
    className = urlMatch ? urlMatch[1].replace(/_/g, ' ') : 'Unknown';
  }

  // Extract infobox data
  const infoboxData = extractInfoboxData(html, 'name');

  // Extract additional data
  const description = extractClassDescription(html);
  const wealth = extractStartingWealth(html);
  const skillNames = extractClassSkills(html);
  const classSkills = mapSkillsToCodes(skillNames);
  const proficiencies = extractProficiencies(html);
  const saves = extractSaves(html);
  const sources = extractSources(html);

  // Build class data object
  const classData = {
    name: className,
    hd: infoboxData.hitdie || 'd6',
    bab: infoboxData.bab || '1/2',
    saves: {
      fort: saves.fort || infoboxData.savefort,
      ref: saves.ref || infoboxData.saveref,
      will: saves.will || infoboxData.savewill
    },
    skillsPerLevel: infoboxData.skilleachlevel || '2',
    alignment: infoboxData.alignment || 'Any',
    description: description,
    wealth: wealth,
    classSkills: classSkills,
    armorProf: proficiencies.armor,
    weaponProf: proficiencies.weapons,
    isPsionic: true, // All classes from this scraper are psionic
    sources: sources
  };

  // Parse class table
  const featuresByLevel = parseClassTable(html);

  // Collect all unique feature names
  const allFeatureNames = new Set();
  for (const names of featuresByLevel.values()) {
    names.forEach(n => allFeatureNames.add(n));
  }

  // Parse feature descriptions
  const descriptions = parseClassFeatures(html, Array.from(allFeatureNames));

  // Build ability items
  const abilities = [];
  const createdAbilities = new Set(); // Track to avoid duplicates

  for (const [level, featureNames] of featuresByLevel) {
    for (const featureName of featureNames) {
      // Only create ability once (for progressive abilities)
      if (createdAbilities.has(featureName)) continue;

      const description = descriptions.get(featureName) || `<p>${featureName}</p>`;
      const ability = buildClassAbility(featureName, level, className, description, sources);

      abilities.push(ability);
      createdAbilities.add(featureName);
    }
  }

  // Build class item
  const classItem = buildClassItem(classData, abilities, featuresByLevel);

  return { classItem, abilities };
}

/**
 * Scrape all classes from Psionic system page
 * @param {string} systemURL - Psionic system page URL
 * @returns {Promise<void>}
 */
async function scrapeAllClasses(systemURL = 'https://metzo.miraheze.org/wiki/Psionic_(system)') {
  console.log('Fetching class list...');
  const html = await fetchHTML(systemURL);
  const classes = extractClassList(html);

  console.log(`Found ${classes.length} classes to scrape`);

  const allClassItems = [];
  const allAbilities = [];

  for (const classInfo of classes) {
    try {
      const fullURL = `https://metzo.miraheze.org${classInfo.url}`;
      const { classItem, abilities } = await scrapeClass(fullURL, classInfo.name);

      allClassItems.push(classItem);
      allAbilities.push(...abilities);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`  Error scraping ${classInfo.name}:`, error.message);
    }
  }

  // Write outputs
  const rootDir = path.join(TOOLS_DIR, '..');
  const classStats = writeYAMLPack('classes', allClassItems, rootDir);
  const abilityStats = writeYAMLPack('class-abilities', allAbilities, rootDir);

  console.log(`\nClasses: written=${classStats.written}, skipped=${classStats.skipped}, errors=${classStats.errors.length}`);
  console.log(`Abilities: written=${abilityStats.written}, skipped=${abilityStats.skipped}, errors=${abilityStats.errors.length}`);

  if (classStats.errors.length > 0) {
    console.error('Class errors:', classStats.errors);
  }
  if (abilityStats.errors.length > 0) {
    console.error('Ability errors:', abilityStats.errors);
  }

  console.log(`\n✓ Scraped ${allClassItems.length} classes with ${allAbilities.length} total abilities`);
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Scrape all classes
    console.log('Scraping all classes from Psionic (system) page...');
    await scrapeAllClasses();
  } else {
    // Scrape single class
    const url = args[0];
    console.log(`Scraping single class: ${url}`);
    const { classItem, abilities } = await scrapeClass(url);

    // Write outputs
    const rootDir = path.join(TOOLS_DIR, '..');
    const classStats = writeYAMLPack('classes', [classItem], rootDir);
    const abilityStats = writeYAMLPack('class-abilities', abilities, rootDir);

    console.log(`\nClasses: written=${classStats.written}, skipped=${classStats.skipped}`);
    console.log(`Abilities: written=${abilityStats.written}, skipped=${abilityStats.skipped}`);

    if (classStats.errors.length > 0) {
      console.error('Class errors:', classStats.errors);
    }
    if (abilityStats.errors.length > 0) {
      console.error('Ability errors:', abilityStats.errors);
    }

    console.log(`\n✓ Scraped ${classItem.name} with ${abilities.length} abilities`);
  }
}

// Tests
function testBABConversion() {
  console.log('Testing BAB conversion...');

  const tests = [
    { input: '1', expected: 'high' },
    { input: '3/4', expected: 'med' },
    { input: '1/2', expected: 'low' },
  ];

  for (const { input, expected } of tests) {
    const result = convertBAB(input);
    console.assert(result === expected, `BAB ${input} should be ${expected}, got ${result}`);
  }

  console.log('✓ BAB conversion tests passed');
}

function testSaveConversion() {
  console.log('Testing save conversion...');

  const tests = [
    { input: 'Good', expected: 'high' },
    { input: 'Poor', expected: 'low' },
    { input: '', expected: 'low' },
  ];

  for (const { input, expected } of tests) {
    const result = convertSave(input);
    console.assert(result === expected, `Save ${input} should be ${expected}, got ${result}`);
  }

  console.log('✓ Save conversion tests passed');
}

function testExtractClassList() {
  console.log('Testing class list extraction...');

  const fixtureHTML = fs.readFileSync(
    path.join(TOOLS_DIR, 'scrapers/test-fixtures/classes/psionic-system-table.html'),
    'utf-8'
  );

  const classes = extractClassList(fixtureHTML);

  console.assert(classes.length === 2, `Expected 2 classes, got ${classes.length}`);
  console.assert(classes[0].name === 'Psion', `Expected Psion, got ${classes[0].name}`);
  console.assert(classes[0].url === '/wiki/Psion', `Expected /wiki/Psion, got ${classes[0].url}`);
  console.assert(classes[0].hd === 'd6', `Expected d6, got ${classes[0].hd}`);
  console.assert(classes[0].bab === '1/2', `Expected 1/2, got ${classes[0].bab}`);
  console.assert(classes[1].name === 'Wilder', `Expected Wilder for second class`);

  console.log('✓ Class list extraction tests passed');
}

function testParseClassTable() {
  console.log('Testing class table parsing...');

  const psionHTML = fs.readFileSync(
    path.join(TOOLS_DIR, 'scrapers/test-fixtures/classes/psion-page.html'),
    'utf-8'
  );

  const features = parseClassTable(psionHTML);

  console.assert(features.size === 2, `Expected 2 levels, got ${features.size}`);
  console.assert(features.has(1), 'Should have level 1');
  console.assert(features.has(2), 'Should have level 2');

  const level1 = features.get(1);
  console.assert(level1.length === 2, `Level 1 should have 2 features, got ${level1.length}`);
  console.assert(level1.includes('Discipline'), 'Level 1 should include Discipline');
  console.assert(level1.includes('bonus feat'), 'Level 1 should include bonus feat');

  const level2 = features.get(2);
  console.assert(level2.length === 1, `Level 2 should have 1 feature, got ${level2.length}`);
  console.assert(level2.includes('Discipline ability'), 'Level 2 should include Discipline ability');

  console.log('✓ Class table parsing tests passed');
}

function testParseClassTableProgressive() {
  console.log('Testing progressive abilities...');

  const wilderHTML = fs.readFileSync(
    path.join(TOOLS_DIR, 'scrapers/test-fixtures/classes/wilder-page.html'),
    'utf-8'
  );

  const features = parseClassTable(wilderHTML);

  const level1 = features.get(1);
  console.assert(level1.includes('Wild surge'), 'Level 1 should include Wild surge');
  console.assert(level1.includes('psychic enervation'), 'Level 1 should include psychic enervation');

  const level3 = features.get(3);
  console.assert(level3.includes('Wild surge'), 'Level 3 should include Wild surge (progressive)');

  console.log('✓ Progressive abilities tests passed');
}

function testParseClassFeatures() {
  console.log('Testing class feature descriptions...');

  const psionHTML = fs.readFileSync(
    path.join(TOOLS_DIR, 'scrapers/test-fixtures/classes/psion-page.html'),
    'utf-8'
  );

  const featureNames = ['Discipline', 'Bonus feat', 'Discipline ability'];
  const descriptions = parseClassFeatures(psionHTML, featureNames);

  console.assert(descriptions.size === 3, `Expected 3 descriptions, got ${descriptions.size}`);
  console.assert(descriptions.has('Discipline'), 'Should have Discipline description');
  console.assert(descriptions.has('Bonus feat'), 'Should have Bonus feat description');

  const disciplineDesc = descriptions.get('Discipline');
  console.assert(disciplineDesc.includes('Every psion must decide'), 'Discipline description should contain expected text');

  console.log('✓ Class feature description parsing tests passed');
}

function testBuildClassAbility() {
  console.log('Testing class ability building...');

  const ability = buildClassAbility(
    'Discipline',
    1,
    'Psion',
    '<p><b>Discipline:</b> Every psion must decide at 1st level which psionic discipline he will specialize in.</p>'
  );

  console.assert(ability.name === 'Discipline', 'Name should be Discipline');
  console.assert(ability.type === 'feat', 'Type should be feat');
  console.assert(ability.system.subType === 'classFeat', 'SubType should be classFeat');
  console.assert(ability.system.associations.classes.includes('Psion'), 'Should associate with Psion');
  console.assert(ability.system.description.value.includes('Every psion'), 'Should have description');
  console.assert(ability._id.length === 16, 'Should have valid ID');
  console.assert(ability.system.abilityType === 'ex', 'Should default to ex');

  console.log('✓ Class ability building tests passed');
}

function testDetectAbilityType() {
  console.log('Testing ability type detection...');

  const exAbility = buildClassAbility('Test', 1, 'Psion', '<p>Test (Ex): Description</p>');
  console.assert(exAbility.system.abilityType === 'ex', 'Should detect Ex');

  const suAbility = buildClassAbility('Test', 1, 'Psion', '<p>Test (Su): Description</p>');
  console.assert(suAbility.system.abilityType === 'su', 'Should detect Su');

  const spAbility = buildClassAbility('Test', 1, 'Psion', '<p>Test (Sp): Description</p>');
  console.assert(spAbility.system.abilityType === 'sp', 'Should detect Sp');

  console.log('✓ Ability type detection tests passed');
}

function testBuildClassItem() {
  console.log('Testing class item building...');

  const classData = {
    name: 'Psion',
    hd: 'd6',
    bab: '1/2',
    saves: {
      fort: 'Poor',
      ref: 'Poor',
      will: 'Good'
    },
    skillsPerLevel: '2',
    alignment: 'Any',
    description: '<p>The psion learns and masters psionic powers.</p>',
    sources: [{ title: 'Ultimate Psionics', pages: '49-53' }]
  };

  const abilities = [
    { _id: 'abc123', name: 'Discipline', level: 1 },
    { _id: 'def456', name: 'Bonus feat', level: 1 },
    { _id: 'ghi789', name: 'Discipline ability', level: 2 }
  ];

  const featuresByLevel = new Map([
    [1, ['Discipline', 'Bonus feat']],
    [2, ['Discipline ability']]
  ]);

  const classItem = buildClassItem(classData, abilities, featuresByLevel);

  console.assert(classItem.name === 'Psion', 'Name should be Psion');
  console.assert(classItem.type === 'class', 'Type should be class');
  console.assert(classItem.system.hd === 6, 'HD should be 6');
  console.assert(classItem.system.bab === 'low', 'BAB should be low');
  console.assert(classItem.system.savingThrows.will.value === 'high', 'Will save should be high');
  console.assert(classItem.system.skillsPerLevel === 2, 'Skills should be 2');
  console.assert(classItem.system.links.classAssociations.length === 3, 'Should have 3 associations');
  console.assert(classItem.system.links.classAssociations[0].level === 1, 'First association level should be 1');
  console.assert(classItem.system.links.classAssociations[0].uuid.includes('abc123'), 'Should link to correct ability');

  console.log('✓ Class item building tests passed');
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  // Check if running tests or scraper
  const args = process.argv.slice(2);

  if (args.includes('--test')) {
    // Run tests
    testBABConversion();
    testSaveConversion();
    testExtractClassList();
    testParseClassTable();
    testParseClassTableProgressive();
    testParseClassFeatures();
    testBuildClassAbility();
    testDetectAbilityType();
    testBuildClassItem();
  } else {
    // Run scraper
    main().catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
  }
}
