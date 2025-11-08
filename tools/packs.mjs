import fsp from "node:fs/promises";
import fs from "node:fs";
import path from "node:path/posix";
import url from "node:url";
import yargs from "yargs";
import { Listr } from "listr2";
import pc from "picocolors";
import yaml from "js-yaml";
import * as fvtt from "@foundryvtt/foundryvtt-cli";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

// Source YAML files (human-editable, committed to git)
const PACK_SRC = path.join(rootDir, "packs-source");
// Compiled LevelDB files (generated, not committed)
const PACK_DIST = path.join(rootDir, "packs");

/**
 * Normalize path to use posix slashes.
 */
const normalizePath = (fpath) => fpath.replaceAll("\\", "/");

/**
 * Check if database is locked by another process (e.g., Foundry)
 */
function isWriteLocked(packpath) {
  try {
    const fd = fs.openSync(path.join(packpath, "LOCK"), "r+");
    fs.closeSync(fd);
    return false;
  } catch (err) {
    if (err.code === "ENOENT") return false;
    else if (["EBUSY", "EPERM", "EACCES"].includes(err.code)) {
      console.error(pc.red("Database locked by another process (e.g. Foundry)"));
    } else {
      console.error(pc.red("Database is not accessible; cause unknown: " + err.code + "\n" + err.message));
    }
    return true;
  }
}

/**
 * Sluggify a string for use in filenames
 */
function sluggify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

/**
 * Sanitize HTML - replace unicode non-breaking spaces
 */
function sanitizeHTML(text) {
  if (typeof text !== "string") return text;
  return text.replaceAll(" ", "&nbsp;");
}

/**
 * Clean up _stats entry to contain only the bare minimum
 */
function sanitizeStats(entry, keep = []) {
  if (!entry?._stats) return;

  keep.push("coreVersion");

  for (const key of Object.keys(entry._stats)) {
    if (keep.includes(key) && entry._stats[key]) continue;
    delete entry._stats[key];
  }

  if (Object.keys(entry._stats).length === 0) delete entry._stats;
}

/**
 * Prune object - remove empty objects, arrays, null, undefined
 */
function pruneObject(obj) {
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val === null || val === undefined || val === "") {
      delete obj[key];
    } else if (Array.isArray(val) && val.length === 0) {
      delete obj[key];
    } else if (typeof val === "object" && !Array.isArray(val)) {
      pruneObject(val);
      if (Object.keys(val).length === 0) delete obj[key];
    }
  }
}

/**
 * Sanitize a compendium entry for export
 */
function sanitizePackEntry(entry, documentType = "", { childDocument = false } = {}) {
  // Delete unwanted fields
  delete entry.ownership;
  delete entry.sort;

  // Move core Foundry document source
  if (entry.flags?.core?.sourceId && !entry._stats?.compendiumSource) {
    if (!entry._stats) entry._stats = {};
    entry._stats.compendiumSource = entry.flags.core.sourceId;
  }

  // Remove core duplication of source
  if (entry._stats?.compendiumSource !== undefined && entry.flags?.core?.sourceId !== undefined) {
    delete entry.flags.core.sourceId;
  }

  sanitizeStats(entry, childDocument ? ["compendiumSource"] : undefined);

  // Delete system migration marker
  if (entry.flags?.pf1?.migration) delete entry.flags.pf1.migration;

  // Delete lingering abundant flag
  if (entry.flags?.["pf1-psionics"]?.abundant) delete entry.flags["pf1-psionics"].abundant;

  // Remove non-system flags
  if (entry.flags) {
    for (const key of Object.keys(entry.flags)) {
      if (!["pf1", "pf1-psionics", "core"].includes(key)) delete entry.flags[key];
    }
    pruneObject(entry.flags);
    if (Object.keys(entry.flags).length === 0) delete entry.flags;
  }

  // Sanitize HTML fields based on document type
  const htmlFields = {
    class: ["system.description.value", "system.description.summary"],
    feat: ["system.description.value"],
    default: ["system.description.value", "system.description.augment"],
  };

  const fieldsToSanitize = htmlFields[entry.type] || htmlFields.default;
  for (const fieldPath of fieldsToSanitize) {
    const parts = fieldPath.split(".");
    let obj = entry;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!obj[parts[i]]) break;
      obj = obj[parts[i]];
    }
    const lastPart = parts[parts.length - 1];
    if (obj && obj[lastPart]) {
      obj[lastPart] = sanitizeHTML(obj[lastPart]);
    }
  }

  // Sanitize actions
  if (entry.system?.actions && Array.isArray(entry.system.actions)) {
    for (const action of entry.system.actions) {
      // Clean up empty ability objects
      if (action.ability && Object.keys(action.ability).length === 0) {
        delete action.ability;
      }
      // Clean up activation cost nulls
      if (action.activation?.cost === null) {
        delete action.activation.cost;
      }
      // Clean up unchained activation cost nulls
      if (action.activation?.unchained?.cost === null) {
        delete action.activation.unchained.cost;
      }
      pruneObject(action);
    }
  }

  // For class items, sanitize the classAssociations links
  if (entry.type === "class" && entry.system?.links?.classAssociations) {
    // Ensure each association has level and uuid
    entry.system.links.classAssociations = entry.system.links.classAssociations.filter(
      assoc => assoc.level !== null && assoc.uuid
    );
  }

  // Remove folder if null or is child document
  if (entry.folder === null || childDocument) delete entry.folder;

  pruneObject(entry);

  return entry;
}


/**
 * Extract packs from LevelDB to YAML
 */
async function extractPacks(packNames = [], options = {}) {
  const entries = await fsp.readdir(PACK_DIST, { withFileTypes: true }).catch(() => []);
  const packDirs = entries.filter((e) => e.isDirectory());

  if (packDirs.length === 0) {
    console.error(pc.red("Nothing to extract; no packs found in " + PACK_DIST));
    return;
  }

  // Test if locked
  const testPath = path.join(PACK_DIST, packDirs[0]?.name);
  if (isWriteLocked(testPath)) return;

  // Filter packs if specified
  const packs = [];
  if (packNames.length > 0) {
    for (const name of packNames) {
      const p = packDirs.find((p) => p.name === name);
      if (p) packs.push(p);
      else console.error(pc.red(`"${name}" does not exist in packs.`));
    }
  } else {
    packs.push(...packDirs);
  }

  const tasks = new Listr(
    packs.map((packDir) => ({
      task: async (_, task) => {
        task.title = `Extracting ${packDir.name}`;

        try {
          const result = await extractPack(packDir.name, options);

          const notifications = [];
          if (result.addedFiles.length > 0) {
            notifications.push(`${pc.green("✓")} Added ${pc.bold(result.addedFiles.length)} files`);
          }
          if (result.removedFiles.length > 0 && options.reset) {
            notifications.push(`${pc.yellow("⚠")} Removed ${pc.bold(result.removedFiles.length)} files`);
          }

          if (notifications.length > 0) {
            task.title = `Extracted ${packDir.name}: ${notifications.join(", ")}`;
          } else {
            task.title = `Extracted ${packDir.name}`;
          }
        } catch (err) {
          if (err.code === "LEVEL_ITERATOR_NOT_OPEN") {
            throw new Error(`Access denied to ${packDir.name}`, { cause: err });
          }
          throw err;
        }
      },
    })),
    { concurrent: false, exitOnError: false }
  );

  return tasks.run();
}

/**
 * Extract a single pack from LevelDB to YAML
 */
async function extractPack(packName, options = {}) {
  const sourcePath = path.join(PACK_SRC, packName);
  const distPath = path.join(PACK_DIST, packName);

  if (!fs.existsSync(distPath)) {
    throw new Error(`${packName} does not exist in ${PACK_DIST}`);
  }

  // Track files before extraction
  const filesBefore = new Set();
  if (fs.existsSync(sourcePath)) {
    const yamlFiles = fs.globSync(path.join(sourcePath, "**/*.yaml"));
    const ymlFiles = fs.globSync(path.join(sourcePath, "**/*.yml"));
    [...yamlFiles, ...ymlFiles].forEach((f) => filesBefore.add(normalizePath(f)));
  }

  // Extract using Foundry CLI with folder structure preserved
  await fvtt.extractPack(distPath, sourcePath, {
    transformEntry: (entry) => {
      return sanitizePackEntry(entry, "Item");
    },
    transformName: (entry, { folder }) => {
      // Check if this is a folder document itself
      if (entry._key?.startsWith('!folders!')) {
        // Place folder metadata inside the folder as _Folder.yml
        const folderName = `${sluggify(entry.name)}.${entry._id}`;
        return `${folderName}/_Folder.yml`;
      }

      // Regular document
      const filename = `${sluggify(entry.name)}.${entry._id}.yml`;
      return folder ? `${folder}/${filename}` : filename;
    },
    transformFolderName: (entry) => {
      return `${sluggify(entry.name)}.${entry._id}`;
    },
    folders: true,
    yaml: true,
    omitVolatile: true,
  });

  // Find files after extraction
  const filesAfter = [];
  if (fs.existsSync(sourcePath)) {
    const yamlFiles = fs.globSync(path.join(sourcePath, "**/*.yaml"));
    const ymlFiles = fs.globSync(path.join(sourcePath, "**/*.yml"));
    [...yamlFiles, ...ymlFiles].forEach((f) => filesAfter.push(normalizePath(f)));
  }

  // Determine added and removed files
  const addedFiles = filesAfter.filter((f) => !filesBefore.has(f));
  const removedFiles = [...filesBefore].filter((f) => !filesAfter.includes(f));

  // Remove files if reset option is set
  if (options.reset && removedFiles.length > 0) {
    await Promise.all(
      removedFiles.map((f) => {
        if (f.endsWith(".yaml") || f.endsWith(".yml")) return fsp.unlink(f).catch(() => {});
      })
    );
  }

  return { packName, addedFiles, removedFiles };
}

/**
 * Compile all YAML packs to LevelDB
 */
async function compileAllPacks() {
  // Create dist directory if it doesn't exist
  await fsp.mkdir(PACK_DIST, { recursive: true });

  // Check if any pack is locked
  const distEntries = await fsp.readdir(PACK_DIST).catch(() => []);
  if (distEntries.length > 0) {
    const testPath = path.join(PACK_DIST, distEntries[0]);
    if (fs.statSync(testPath).isDirectory() && isWriteLocked(testPath)) return;
  }

  // Get all source directories
  const sourceEntries = await fsp.readdir(PACK_SRC, { withFileTypes: true }).catch(() => []);
  const sourceDirs = sourceEntries.filter((e) => e.isDirectory());

  if (sourceDirs.length === 0) {
    console.log(pc.yellow("No source packs found in " + PACK_SRC));
    return;
  }

  console.log(pc.cyan(`Compiling ${sourceDirs.length} pack(s)...`));

  for (const dir of sourceDirs) {
    await compilePack(dir.name);
  }

  console.log(pc.green("✓ All packs compiled successfully"));
}

/**
 * Compile a single YAML pack to LevelDB
 */
async function compilePack(name) {
  const sourcePath = path.join(PACK_SRC, name);
  const distPath = path.join(PACK_DIST, name);

  if (!fs.existsSync(sourcePath)) {
    console.error(pc.red(`Source pack "${name}" not found in ${PACK_SRC}`));
    return;
  }

  console.log(pc.dim(`  Compiling ${name}...`));

  // Remove existing compiled pack
  if (fs.existsSync(distPath)) {
    await fsp.rm(distPath, { recursive: true });
  }

  // Compile using Foundry CLI
  await fvtt.compilePack(sourcePath, distPath, {
    recursive: true,
    yaml: true,
  });
}

// CLI handling
if (process.argv[1] === __filename) {
  yargs(process.argv.slice(2))
    .demandCommand(1, 1, "You must specify a valid command")
    .strict()
    .command({
      command: "extract [packs...]",
      describe: "Extract Foundry database contents into source YAML files",
      builder: (yargs) =>
        yargs
          .positional("packs", {
            describe: "Limit extraction to the defined packs",
            type: "string"
          })
          .option("keepDeleted", {
            alias: "k",
            type: "boolean",
            description: "Keep entries on disk that were deleted from the database",
          }),
      handler: async (argv) => {
        await extractPacks(argv.packs || [], {
          reset: !argv.keepDeleted
        });
      },
    })
    .command({
      command: "compile",
      describe: "Compile YAML files from source into Foundry database",
      handler: async () => {
        await compileAllPacks();
      },
    })
    .help()
    .parse();
}
