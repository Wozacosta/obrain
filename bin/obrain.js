#!/usr/bin/env node

const { spawn } = require("child_process");
const path = require("path");
const os = require("os");
const fs = require("fs");

const ROOT = path.resolve(__dirname, "..");
const platform = os.platform();

function run(cmd, opts = {}) {
  return spawn(cmd, { shell: true, stdio: "inherit", cwd: ROOT, ...opts });
}

const action = process.argv[2] || "setup";

switch (action) {
  case "setup":
  case "install": {
    if (platform === "darwin" || platform === "linux") {
      const sh = path.join(ROOT, "setup.sh");
      fs.chmodSync(sh, 0o755);
      run(`bash "${sh}"`).on("close", process.exit);
    } else {
      console.error(`Unsupported platform: ${platform}. macOS and Linux only for now.`);
      process.exit(1);
    }
    break;
  }

  case "uninstall":
  case "remove": {
    const sh = path.join(ROOT, "uninstall.sh");
    fs.chmodSync(sh, 0o755);
    run(`bash "${sh}"`).on("close", process.exit);
    break;
  }

  case "help":
  case "--help":
  case "-h": {
    console.log(`
  obrain — hook Obsidian into Claude Code

  Usage:
    npx obrain              run the setup wizard
    npx obrain setup        same thing
    npx obrain uninstall    remove obrain components

  After setup:
    cd ~/obrain && claude
    /brain-setup            one-time personalization
    /morning                start-of-day ritual
    /weekly                 end-of-week review
    /recap                  capture this session
    /todo                   manage tasks
    /digest                 read and summarize files
    /import-vault           pull notes from another vault
`);
    break;
  }

  default: {
    console.error(`Unknown command: ${action}`);
    console.error("Run: npx obrain help");
    process.exit(1);
  }
}
