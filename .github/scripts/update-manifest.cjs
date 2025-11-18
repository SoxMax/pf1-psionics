#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Get inputs from environment (set by GitHub Actions)
const version = process.env.VERSION;
const repository = process.env.GITHUB_REPOSITORY; // format: "owner/repo"

if (!version) {
  console.error("ERROR: VERSION environment variable is required");
  process.exit(1);
}

if (!repository) {
  console.error("ERROR: GITHUB_REPOSITORY environment variable is required");
  process.exit(1);
}

// Validate semantic version format
const versionRegex = /^\d+\.\d+\.\d+$/;
if (!versionRegex.test(version)) {
  console.error(`ERROR: Invalid version format: ${version}`);
  console.error("Version must follow semantic versioning (e.g., 1.2.3)");
  process.exit(1);
}

// Read module.json
const manifestPath = path.join(__dirname, "../../module.json");
let manifest;

try {
  manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
} catch (error) {
  console.error(`ERROR: Failed to read module.json: ${error.message}`);
  process.exit(1);
}

// Update version and URLs
manifest.version = version;
manifest.download = `https://github.com/${repository}/releases/download/v${version}/module.zip`;

// Write updated module.json
try {
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`✓ Updated module.json to version ${version}`);
  console.log(`  manifest: ${manifest.manifest}`);
  console.log(`  download: ${manifest.download}`);
} catch (error) {
  console.error(`ERROR: Failed to write module.json: ${error.message}`);
  process.exit(1);
}
