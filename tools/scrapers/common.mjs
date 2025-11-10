/**
 * Common utilities for web scraping from metzo.miraheze.org
 *
 * Shared functionality used by both powers-scraper.mjs and feats-scraper.mjs
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import yaml from 'js-yaml';

const execAsync = promisify(exec);

/**
 * Get paths relative to the scrapers directory
 *
 * @param {string} scriptUrl - import.meta.url from the calling script
 * @returns {object} Object containing __filename, __dirname, TOOLS_DIR, and dataDir
 */
export function getScraperPaths(scriptUrl) {
  const __filename = fileURLToPath(scriptUrl);
  const __dirname = dirname(__filename);
  const TOOLS_DIR = dirname(__dirname);

  return {
    __filename,
    __dirname,
    TOOLS_DIR,
    dataDir: join(TOOLS_DIR, 'data')
  };
}

/**
 * Decode HTML entities to their proper characters
 *
 * @param {string} text - Text containing HTML entities
 * @returns {string} - Decoded text
 */
export function decodeHTMLEntities(text) {
  if (!text) return text;

  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…');
}

/**
 * Fetch HTML content from a URL using curl
 * (more reliable than http/https modules for following redirects)
 *
 * @param {string} url - URL to fetch
 * @returns {Promise<string>} - HTML content
 */
export async function fetchHTML(url) {
  try {
    // Parse the URL to separate base and path
    const urlObj = new URL(url);

    // Encode the pathname by first decoding (in case it's already encoded)
    // then re-encoding to normalize it
    // This handles special characters like accents properly
    const decodedPath = decodeURIComponent(urlObj.pathname);
    const encodedPath = decodedPath.split('/').map(encodeURIComponent).join('/');
    const encodedUrl = `${urlObj.protocol}//${urlObj.host}${encodedPath}${urlObj.search}`;

    const { stdout } = await execAsync(`curl -s -L "${encodedUrl}"`);
    return stdout;
  } catch (error) {
    throw new Error(`Failed to fetch ${url}: ${error.message}`);
  }
}

/**
 * Extract text from an infobox data field
 * Handles both <div class="pi-data-value"> and <td> formats
 *
 * @param {string} html - HTML content
 * @param {string} fieldName - Name of the data-source field
 * @returns {string|null} - Extracted and decoded text, or null if not found
 */
export function extractInfoboxData(html, fieldName) {
  // Try div format first (for fields like discipline, display, etc.)
  let regex = new RegExp(`data-source="${fieldName}"[^>]*>[\\s\\S]*?<div class="pi-data-value[^"]*">([\\s\\S]*?)<\\/div>`, 'i');
  let match = html.match(regex);

  // Try td format (for fields like range, duration, target in horizontal tables)
  if (!match) {
    regex = new RegExp(`<td[^>]*data-source="${fieldName}"[^>]*>([\\s\\S]*?)<\\/td>`, 'i');
    match = html.match(regex);
  }

  if (match) {
    const text = match[1]
      .replace(/<[^>]+>/g, '') // Strip HTML tags
      .trim();
    return decodeHTMLEntities(text);
  }
  return null;
}

/**
 * Extract title from infobox or page heading
 *
 * @param {string} html - HTML content
 * @returns {string|null} - Extracted and decoded title, or null if not found
 */
export function extractTitle(html) {
  // Try infobox title first
  const infoboxTitleMatch = html.match(/<h2[^>]*class="pi-item[^"]*pi-title"[^>]*data-source="name">([^<]+)<\/h2>/);
  if (infoboxTitleMatch) {
    return decodeHTMLEntities(infoboxTitleMatch[1].trim());
  }

  // Fall back to page title
  const h1TitleMatch = html.match(/<span class="mw-page-title-main">([^<]+)<\/span>/);
  if (h1TitleMatch) {
    return decodeHTMLEntities(h1TitleMatch[1].trim());
  }

  return null;
}

/**
 * Extract pagination link for Dreamscarred Press categories
 *
 * @param {string} html - HTML content
 * @param {string} categoryType - Type of category (e.g., 'powers', 'feats')
 * @returns {string|null} - Next page URL, or null if no more pages
 */
export function extractNextPageLink(html, categoryType) {
  const regex = new RegExp(`<a href="(\\/wiki\\/Category:Dreamscarred_Press_${categoryType}[^"]*)"[^>]*>next page<\\/a>`, 'i');
  const match = html.match(regex);

  if (match) {
    return 'https://metzo.miraheze.org' + match[1];
  }

  return null;
}

/**
 * Ensure output file path exists and write JSON data
 *
 * @param {string} outputPath - Path to output file
 * @param {any} data - Data to write as JSON
 */
export function writeJSONOutput(outputPath, data) {
  // Ensure output directory exists
  const outputDir = dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
}

/**
 * Write data as YAML files to packs-source directory
 * Each item gets its own file: {slug}.{id}.yaml
 *
 * @param {string} packName - Name of the pack (e.g., 'powers', 'feats')
 * @param {Array<object>} items - Array of items to write
 * @param {string} rootDir - Root directory of the module (default: ../../ from scrapers)
 * @returns {object} Stats about files written
 */
export function writeYAMLPack(packName, items, rootDir = join(dirname(dirname(fileURLToPath(import.meta.url))), '..', '..')) {
  const packsSourceDir = join(rootDir, 'packs-source', packName);

  // Ensure directory exists
  if (!fs.existsSync(packsSourceDir)) {
    fs.mkdirSync(packsSourceDir, { recursive: true });
  }

  const stats = {
    written: 0,
    skipped: 0,
    errors: []
  };

  for (const item of items) {
    try {
      // Generate filename from name and ID
      const slug = sluggify(item.name);
      const filename = `${slug}.${item._id}.yaml`;
      const filepath = join(packsSourceDir, filename);

      // Write YAML file with sorted keys
      const yamlContent = yaml.dump(item, {
        sortKeys: true,
        lineWidth: -1  // Disable line wrapping
      });

      fs.writeFileSync(filepath, yamlContent, 'utf8');
      stats.written++;
    } catch (error) {
      stats.errors.push({ item: item.name, error: error.message });
      stats.skipped++;
    }
  }

  return stats;
}

/**
 * Find existing YAML file for an item by name (and optionally by class association)
 * @param {object|string} item - Item object or item name string
 * @param {string} packsSourceDir - Path to packs-source directory
 * @returns {string|null} - Full path to existing YAML file, or null if not found
 */
function findExistingItemFile(item, packsSourceDir) {
  if (!fs.existsSync(packsSourceDir)) {
    return null;
  }

  // Support both item objects and plain strings for backward compatibility
  const itemName = typeof item === 'string' ? item : item.name;
  const slug = sluggify(itemName);
  const files = fs.readdirSync(packsSourceDir);

  // Look for files matching the pattern: slug.*.(yaml|yml)
  const regex = new RegExp(`^${slug}\\..*\\.(yaml|yml)$`, 'i');
  const matchingFiles = files.filter(file => regex.test(file));

  if (matchingFiles.length === 0) {
    return null;
  }

  // If only one match, return it immediately
  if (matchingFiles.length === 1) {
    return join(packsSourceDir, matchingFiles[0]);
  }

  // Multiple matches found - need to disambiguate for class abilities
  // Check if this item has class associations (class abilities)
  if (typeof item === 'object' && item.system?.associations?.classes) {
    const targetClass = item.system.associations.classes[0];

    for (const file of matchingFiles) {
      try {
        const filepath = join(packsSourceDir, file);
        const content = fs.readFileSync(filepath, 'utf8');
        const existingItem = yaml.load(content);

        // Check if class association matches
        if (existingItem.system?.associations?.classes?.[0] === targetClass) {
          return filepath;
        }
      } catch (error) {
        // Skip files that can't be read or parsed
        continue;
      }
    }

    // No match found with the same class - this is a new ability with same name
    return null;
  }

  // For non-class-ability items with multiple matches, return the first
  // (This shouldn't happen in practice, but provides a fallback)
  return join(packsSourceDir, matchingFiles[0]);
}

/**
 * Find or create folder directory with name.id format
 * @param {string} baseDir - Base directory (e.g., packs-source/powers)
 * @param {string} folderName - Display name for the folder
 * @param {string} type - Foundry document type (e.g., 'Item')
 * @param {Set<string>} existingIds - Set of existing IDs to avoid collisions
 * @returns {object} - { path: folder directory path, folderId: folder ID }
 */
function ensureFolderDirectory(baseDir, folderName, type, existingIds) {
  const slug = sluggify(folderName);

  // Check if a folder directory already exists with this name
  if (fs.existsSync(baseDir)) {
    const entries = fs.readdirSync(baseDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name.startsWith(`${slug}.`)) {
        // Found existing folder directory - check for _Folder.yml
        const folderPath = join(baseDir, entry.name);
        const folderMetadataPath = join(folderPath, '_Folder.yaml');

        if (fs.existsSync(folderMetadataPath)) {
          try {
            const content = fs.readFileSync(folderMetadataPath, 'utf8');
            const folderData = yaml.load(content);
            return { path: folderPath, folderId: folderData._id };
          } catch (error) {
            // If we can't read it, we'll continue to create new
          }
        }
      }
    }
  }

  // Create new folder
  const folderId = generateFoundryId(existingIds);
  existingIds.add(folderId);

  const folderDirName = `${slug}.${folderId}`;
  const folderPath = join(baseDir, folderDirName);

  // Create directory
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  // Create _Folder.yml metadata
  const folderData = {
    _id: folderId,
    name: folderName,
    type: type,
    sorting: 'a',
    _key: `!folders!${folderId}`,
    _stats: { coreVersion: '13.350' }
  };

  const yamlContent = yaml.dump(folderData, {
    sortKeys: true,
    lineWidth: -1
  });

  const folderMetadataPath = join(folderPath, '_Folder.yaml');
  fs.writeFileSync(folderMetadataPath, yamlContent, 'utf8');

  return { path: folderPath, folderId };
}

/**
 * Write items with deduplication (preserves existing IDs)
 *
 * This function handles writing items to YAML files with automatic deduplication:
 * - Existing items (matched by name) have their IDs preserved and content updated
 * - New items get fresh IDs generated
 * - Supports optional subdirectory organization (e.g., powers by discipline)
 *
 * @param {string} packName - Name of the pack (e.g., 'classes', 'feats', 'powers')
 * @param {Array} items - Array of items to write
 * @param {string} rootDir - Root directory path
 * @param {object} options - Optional configuration
 * @param {Function} options.getSubdirectory - Function that returns subdirectory path for an item (e.g., item => item.system.discipline)
 * @returns {object} - Stats object with written, updated, skipped, errors
 */
export function writeItemsWithDeduplication(packName, items, rootDir, options = {}) {
  const basePacksDir = join(rootDir, 'packs-source', packName);

  // Ensure base directory exists
  if (!fs.existsSync(basePacksDir)) {
    fs.mkdirSync(basePacksDir, { recursive: true });
  }

  const stats = {
    written: 0,
    updated: 0,
    skipped: 0,
    errors: []
  };

  // Collect existing IDs to prevent collisions (scan all subdirectories)
  const existingIds = new Set();
  if (fs.existsSync(basePacksDir)) {
    const scanDirectory = (dir) => {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        if (item.isDirectory()) {
          // Recursively scan subdirectories
          scanDirectory(join(dir, item.name));
        } else if (item.name.endsWith('.yaml') || item.name.endsWith('.yml')) {
          const match = item.name.match(/\.([a-zA-Z0-9]{16})\.(yaml|yml)$/);
          if (match) {
            existingIds.add(match[1]);
          }
        }
      }
    };
    scanDirectory(basePacksDir);
  }

  for (const item of items) {
    try {
      // Determine target directory (with optional subdirectory)
      let targetDir = basePacksDir;
      let folderId = null;

      if (options.getSubdirectoryName) {
        const folderName = options.getSubdirectoryName(item);
        const folderInfo = ensureFolderDirectory(basePacksDir, folderName, 'Item', existingIds);
        targetDir = folderInfo.path;
        folderId = folderInfo.folderId;
      }

      // Check if a YAML file already exists for this item
      const existingFile = findExistingItemFile(item, targetDir);

      if (existingFile) {
        // Read existing YAML to preserve the ID
        const existingContent = fs.readFileSync(existingFile, 'utf8');
        const existingItem = yaml.load(existingContent);

        // Preserve the existing ID
        item._id = existingItem._id;
        stats.updated++;

        const displayPath = options.getSubdirectoryName
          ? `${item.name} (${options.getSubdirectoryName(item)})`
          : item.name;
        console.log(`  📝 Updating: ${displayPath}`);
      } else {
        // Generate a new Foundry-compatible ID
        item._id = generateFoundryId(existingIds);
        existingIds.add(item._id);
        stats.written++;

        const displayPath = options.getSubdirectoryName
          ? `${item.name} (${options.getSubdirectoryName(item)})`
          : item.name;
        console.log(`  ✨ Creating: ${displayPath}`);
      }

      // Add required Foundry fields
      item._key = `!items!${item._id}`;
      item._stats = { coreVersion: '13.350' };

      // Set folder reference if item is in a subdirectory
      if (folderId) {
        item.folder = folderId;
      }

      // Write YAML file with .yaml extension
      const slug = sluggify(item.name);
      const filename = `${slug}.${item._id}.yaml`;
      const filepath = join(targetDir, filename);

      const yamlContent = yaml.dump(item, {
        sortKeys: true,
        lineWidth: -1
      });

      fs.writeFileSync(filepath, yamlContent, 'utf8');
    } catch (error) {
      stats.errors.push({ item: item.name, error: error.message });
      stats.skipped++;
      console.error(`  ✗ Error writing ${item.name}: ${error.message}`);
    }
  }

  return stats;
}

/**
 * Sluggify a string for use in filenames
 * @param {string} name - The string to sluggify
 * @returns {string} Sluggified string
 */
export function sluggify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

/**
 * Generate a Foundry VTT-compatible random ID
 * Format: 16-character alphanumeric string (a-zA-Z0-9)
 * @param {Set<string>} existingIds - Optional set of existing IDs to avoid collisions
 * @returns {string} Random ID
 */
export function generateFoundryId(existingIds = null) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  let attempts = 0;
  const maxAttempts = 100;

  do {
    id = '';
    for (let i = 0; i < 16; i++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    attempts++;

    if (attempts >= maxAttempts) {
      throw new Error('Failed to generate unique ID after 100 attempts');
    }
  } while (existingIds && existingIds.has(id));

  return id;
}

/**
 * Delay execution (for rate limiting API/web requests)
 *
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise<void>}
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Extract category links from HTML
 *
 * @param {string} html - HTML content
 * @param {object} options - Options for filtering
 * @param {string[]} options.skipPrefixes - Page name prefixes to skip
 * @returns {string[]} - Array of decoded page names
 */
export function extractCategoryLinks(html, options = {}) {
  const {
    skipPrefixes = [
      'Category:',
      'Special:',
      'File:',
      'Library_of_Metzofitz'
    ]
  } = options;

  const links = new Set();
  const linkRegex = /<a href="\/wiki\/([^"]+)"[^>]*>([^<]+)<\/a>/g;
  let match;

  while ((match = linkRegex.exec(html)) !== null) {
    const pageName = match[1];

    // Skip special pages, categories, etc.
    if (skipPrefixes.some(prefix => pageName.startsWith(prefix)) ||
        pageName.includes('talk:') ||
        pageName.includes('action=edit')) {
      continue;
    }

    const decodedName = decodeURIComponent(pageName);
    links.add(decodedName);
  }

  return Array.from(links).sort();
}

/**
 * Known source metadata for Dreamscarred Press publications
 * Maps book titles to publication dates and publishers
 */
export const SOURCE_METADATA = {
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

/**
 * Parse a single source text into a structured object with metadata
 * @param {string} sourceText - Source text (e.g., "Ultimate Psionics, pgs. 69–72")
 * @returns {object|null} - Source object with title, pages, publisher, date
 */
export function parseSourceInfo(sourceText) {
  // Match pattern: "Book Name, pg(s). page-numbers"
  const match = sourceText.match(/^([^,]+?)(?:,\s*pgs?\.?\s*([\d–\-]+))?$/);

  if (!match) return null;

  const title = match[1].trim();
  const pages = match[2] || '';

  const metadata = SOURCE_METADATA[title] || {
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
 * Parse sourcebook HTML into sources array with metadata
 * Format: "<i>Psionics Unleashed</i>, pgs. 106–107<br /><i>Ultimate Psionics</i>, pg. 196"
 *
 * @param {string} html - Raw HTML from sourcebook field
 * @returns {Array} - Array of source objects with title, pages, publisher, and date
 */
export function parseSourcebooks(html) {
  const sources = [];

  // Split by <br /> tags
  const sourceEntries = html.split(/<br\s*\/?>/i).filter(s => s.trim());

  for (const entry of sourceEntries) {
    // Remove HTML tags but preserve the text
    const cleanEntry = entry
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .trim();

    if (!cleanEntry) continue;

    const sourceInfo = parseSourceInfo(cleanEntry);
    if (sourceInfo) {
      sources.push(sourceInfo);
    }
  }

  return sources;
}

/**
 * Extract page categories from the categories section
 *
 * @param {string} html - HTML content
 * @returns {Array} - Array of category objects with slug and name
 */
export function extractPageCategories(html) {
  const categories = [];

  // Look for the categories section (mw-normal-catlinks)
  const categoryMatch = html.match(/<div id="mw-normal-catlinks"[^>]*>([\s\S]*?)<\/div>/);
  if (!categoryMatch) {
    return categories;
  }

  // Extract category links
  const linkRegex = /<a[^>]*href="\/wiki\/Category:([^"]+)"[^>]*>([^<]+)<\/a>/g;
  let match;

  while ((match = linkRegex.exec(categoryMatch[1])) !== null) {
    const slug = decodeURIComponent(match[1].replace(/_/g, ' '));
    const name = decodeHTMLEntities(match[2]);
    categories.push({ slug, name });
  }

  return categories;
}

/**
 * Extract and clean description content from wiki page HTML
 * Preserves HTML formatting while removing wiki-specific markup
 *
 * @param {string} html - Full HTML content of the page
 * @returns {string} - Cleaned HTML description or empty string if not found
 */
export function extractDescription(html) {
  // Find where content starts
  // Powers have infoboxes (</aside>), feats don't
  let contentStart = html.indexOf('</aside>');

  if (contentStart === -1) {
    // No infobox - look for mw-parser-output div (common for feat pages)
    const parserOutputStart = html.indexOf('<div class="mw-content-ltr mw-parser-output"');
    if (parserOutputStart === -1) {
      return '';
    }
    // Find where the content actually starts (after the opening tag)
    contentStart = html.indexOf('>', parserOutputStart) + 1;
  }

  // Find where content ends using multiple fallback strategies
  let contentEnd = html.indexOf('<hr />', contentStart);

  const notesSection = html.indexOf('id="Notes"', contentStart);
  if (notesSection > -1 && (contentEnd === -1 || notesSection < contentEnd)) {
    contentEnd = html.lastIndexOf('<div class="mw-heading', notesSection);
  }

  if (contentEnd === -1) {
    contentEnd = html.indexOf('<!-- NewPP limit report', contentStart);
  }

  if (contentEnd === -1) {
    const footerStart = html.indexOf('<footer', contentStart);
    const navStart = html.indexOf('<nav', contentStart);
    if (footerStart > -1) contentEnd = footerStart;
    if (navStart > -1 && (contentEnd === -1 || navStart < contentEnd)) contentEnd = navStart;
  }

  // Look for printfooter or catlinks (common end markers on wiki pages)
  if (contentEnd === -1) {
    const printfooter = html.indexOf('printfooter', contentStart);
    const catlinks = html.indexOf('catlinks', contentStart);
    if (printfooter > -1) {
      contentEnd = html.lastIndexOf('<div', printfooter);
    }
    if (catlinks > -1 && (contentEnd === -1 || catlinks < contentEnd)) {
      const catlinksDiv = html.lastIndexOf('<div', catlinks);
      if (catlinksDiv > contentStart) contentEnd = catlinksDiv;
    }
  }

  if (contentEnd === -1) {
    contentEnd = html.indexOf('</div><!-- mw-parser-output -->', contentStart);
  }

  // Look for "Related" section and cut off there (for feats and powers)
  const relatedMatch = html.match(/<h[23][^>]*>\s*Related\s*<\/h[23]>/i);
  if (relatedMatch) {
    const relatedIndex = html.indexOf(relatedMatch[0], contentStart);
    if (relatedIndex > contentStart && (contentEnd === -1 || relatedIndex < contentEnd)) {
      contentEnd = relatedIndex;
    }
  }

  if (contentEnd <= contentStart) {
    return '';
  }

  let descriptionSection = html.substring(contentStart, contentEnd);

  // Remove empty paragraphs at start
  descriptionSection = descriptionSection.replace(/^[\s\S]*?<p class="mw-empty-elt"><\/p>/i, '');

  // Clean up and preserve HTML formatting
  let description = descriptionSection
    // Normalize paragraph tags
    .replace(/<p[^>]*>/gi, '<p>')
    .replace(/<\/p>/gi, '</p>')
    // Convert <b> to <strong> and <i> to <em> for semantic HTML
    .replace(/<b>/gi, '<strong>')
    .replace(/<\/b>/gi, '</strong>')
    .replace(/<i>/gi, '<em>')
    .replace(/<\/i>/gi, '</em>')
    // Convert headings to bold paragraphs
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '<p><strong>$1</strong></p>')
    .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '<p><strong>$1</strong></p>')
    // Handle lists - keep ul/ol/li structure
    .replace(/<ul[^>]*>/gi, '<ul>')
    .replace(/<ol[^>]*>/gi, '<ol>')
    .replace(/<li[^>]*>/gi, '<li>')
    // Handle definition lists and convert to structured format
    .replace(/<dl[^>]*>([\s\S]*?)<\/dl>/gi, (match, content) => {
      return '<ul>' + content
        .replace(/<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi, '<li><strong>$1:</strong> $2</li>')
        .replace(/<dd[^>]*>([\s\S]*?)<\/dd>/gi, '<li>$1</li>')
        + '</ul>';
    })
    // Handle tables - preserve basic structure
    .replace(/<table[^>]*>/gi, '<table>')
    .replace(/<tbody[^>]*>/gi, '')
    .replace(/<\/tbody>/gi, '')
    .replace(/<tr[^>]*>/gi, '<tr>')
    .replace(/<td[^>]*>/gi, '<td>')
    .replace(/<th[^>]*>/gi, '<th>')
    // Remove Wiki-specific elements
    .replace(/<div[^>]*class="[^"]*mw-heading[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<span[^>]*class="mw-editsection"[^>]*>[\s\S]*?<\/span>/gi, '')
    .replace(/<div[^>]*class="[^"]*mw-empty-elt[^"]*"[^>]*><\/div>/gi, '')
    // Remove noscript, script tags that might appear
    .replace(/<noscript>[\s\S]*?<\/noscript>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    // Clean up anchor tags - keep links but remove edit links
    .replace(/<a[^>]*href="\/w\/index\.php\?title=[^"]*&action=edit[^"]*"[^>]*>[\s\S]*?<\/a>/gi, '')
    .replace(/<a[^>]*class="new"[^>]*>/gi, '<a>')
    // Remove remaining spans and divs with classes but keep content
    .replace(/<span[^>]*>/gi, '')
    .replace(/<\/span>/gi, '')
    .replace(/<div[^>]*>/gi, '')
    .replace(/<\/div>/gi, '')
    // Remove comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Clean up excessive whitespace between tags
    .replace(/>\s+</g, '><')
    // Clean up empty paragraphs
    .replace(/<p>\s*<\/p>/gi, '')
    // Ensure proper spacing between block elements
    .replace(/<\/p><p>/gi, '</p>\n<p>')
    .replace(/<\/ul>/gi, '</ul>\n')
    .replace(/<\/ol>/gi, '</ol>\n')
    .replace(/<\/table>/gi, '</table>\n')
    .trim();

  // Decode HTML entities and return
  return decodeHTMLEntities(description);
}

