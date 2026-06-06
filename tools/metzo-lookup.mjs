#!/usr/bin/env node
/**
 * Metzofitz Library lookup CLI.
 *
 * Read-only fetch of a single page from metzo.miraheze.org. Parses it as
 * feat / power / class / race depending on the URL (or --type override) and
 * prints the structured result to stdout as JSON. Does not write any files.
 *
 * Usage:
 *   node tools/metzo-lookup.mjs <url>
 *   node tools/metzo-lookup.mjs --type feat <url>
 *   node tools/metzo-lookup.mjs --field description <url>     # print one field as text
 *   node tools/metzo-lookup.mjs --search "psionic dodge"      # title search
 *
 * Examples:
 *   node tools/metzo-lookup.mjs https://metzo.miraheze.org/wiki/Psionic_Dodge
 *   node tools/metzo-lookup.mjs --field description https://metzo.miraheze.org/wiki/Psionic_Weapon
 */

import { fetchHTML } from "./scrapers/common.mjs";
import { parseFeatData } from "./scrapers/feats-scraper.mjs";
import { parsePowerData } from "./scrapers/powers-scraper.mjs";

const BASE = "https://metzo.miraheze.org/wiki/";

function usage(msg) {
  if (msg) process.stderr.write(`error: ${msg}\n\n`);
  process.stderr.write(
    "usage: node tools/metzo-lookup.mjs [--type feat|power] [--field <key>] <url>\n" +
    "       node tools/metzo-lookup.mjs --search <query>\n"
  );
  process.exit(msg ? 2 : 0);
}

function parseArgs(argv) {
  const args = { type: null, field: null, search: null, url: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") usage();
    else if (a === "--type") args.type = argv[++i];
    else if (a === "--field") args.field = argv[++i];
    else if (a === "--search") args.search = argv[++i];
    else if (!args.url) args.url = a;
    else usage(`unexpected argument: ${a}`);
  }
  return args;
}

function inferType(url) {
  // Best-effort: page categories are the source of truth, so we let the
  // parser tell us if a URL is wrong by returning null.
  if (!url) return null;
  const u = url.toLowerCase();
  if (u.includes("/category:") && u.includes("feat")) return "feat";
  if (u.includes("/category:") && u.includes("power")) return "power";
  return null;
}

async function lookup(url, typeHint) {
  const html = await fetchHTML(url);
  const tried = [];
  const candidates = typeHint ? [typeHint] : ["feat", "power"];
  for (const t of candidates) {
    let parsed = null;
    if (t === "feat") parsed = parseFeatData(html, url);
    else if (t === "power") parsed = parsePowerData(html, url);
    tried.push(t);
    if (parsed) return { kind: t, data: parsed };
  }
  return { kind: null, data: null, tried };
}

async function search(query) {
  const url = `https://metzo.miraheze.org/w/api.php?action=opensearch&format=json&limit=10&search=${encodeURIComponent(query)}`;
  const res = await globalThis.fetch(url, { headers: { "User-Agent": "pf1-psionics-lookup/1.0" } });
  if (!res.ok) throw new Error(`search failed: HTTP ${res.status}`);
  const [, titles, , urls] = await res.json();
  return titles.map((title, i) => ({ title, url: urls[i] }));
}

function pickField(obj, dottedPath) {
  return dottedPath.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.search) {
    const hits = await search(args.search);
    process.stdout.write(JSON.stringify(hits, null, 2) + "\n");
    return;
  }

  if (!args.url) usage("must supply a URL or --search query");

  // Allow bare page names like "Psionic_Dodge" → BASE + name
  const url = /^https?:/i.test(args.url) ? args.url : BASE + args.url;

  const result = await lookup(url, args.type ?? inferType(url));
  if (!result.data) {
    process.stderr.write(
      `no parser matched ${url} (tried: ${result.tried?.join(", ") ?? args.type})\n`
    );
    process.exit(1);
  }

  if (args.field) {
    const value = pickField(result.data, args.field);
    if (value == null) {
      process.stderr.write(`field not found: ${args.field}\n`);
      process.exit(1);
    }
    process.stdout.write(typeof value === "string" ? value + "\n" : JSON.stringify(value, null, 2) + "\n");
    return;
  }

  process.stdout.write(JSON.stringify({ kind: result.kind, data: result.data }, null, 2) + "\n");
}

main().catch((err) => {
  process.stderr.write(`${err.stack || err.message || err}\n`);
  process.exit(1);
});
