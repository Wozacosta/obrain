#!/usr/bin/env node

const [major, minor] = process.versions.node.split(".").map(Number);
if (major < 20 || (major === 20 && minor < 12)) {
  console.error(`obrain needs Node.js 20.12 or newer (you have ${process.versions.node}).`);
  process.exit(1);
}

import("../lib/cli.mjs").then(({ main }) => main(process.argv.slice(2)));
