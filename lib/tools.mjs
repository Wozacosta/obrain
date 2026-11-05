// Find and install the two apps obrain needs: Obsidian and Claude Code.

import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const mac = process.platform === "darwin";

const has = (cmd) => spawnSync("sh", ["-c", `command -v ${cmd}`], { stdio: "ignore" }).status === 0;
const ok = (cmd, args) => spawnSync(cmd, args, { stdio: "ignore" }).status === 0;

export const supported = () => mac || process.platform === "linux";

export function claudeVersion() {
  for (const bin of ["claude", path.join(os.homedir(), ".local", "bin", "claude")]) {
    const r = spawnSync(bin, ["--version"], { encoding: "utf8" });
    if (r.status === 0) return r.stdout.trim().split("\n")[0].replace(/\s*\(Claude Code\)$/, "");
  }
  return null;
}

export function hasObsidian() {
  if (mac) {
    return ["/Applications", path.join(os.homedir(), "Applications")].some((d) =>
      fs.existsSync(path.join(d, "Obsidian.app")),
    );
  }
  return (
    has("obsidian") ||
    (has("flatpak") && ok("flatpak", ["info", "md.obsidian.Obsidian"])) ||
    (has("snap") && ok("snap", ["list", "obsidian"]))
  );
}

/** How we'd install Obsidian here, or null if the user has to do it by hand */
export function obsidianInstaller() {
  if (mac && has("brew")) return { label: "Homebrew", cmd: "brew install --cask obsidian" };
  if (!mac && has("flatpak")) return { label: "Flatpak", cmd: "flatpak install -y flathub md.obsidian.Obsidian" };
  return null;
}

export const CLAUDE_INSTALL = "curl -fsSL https://claude.ai/install.sh | bash";
export const OBSIDIAN_DOWNLOAD = "https://obsidian.md/download";

/** Run a shell command, capturing output. Resolves to { ok, output }. */
export function run(cmd) {
  return new Promise((resolve) => {
    const child = spawn("sh", ["-c", cmd], { stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    child.stdout.on("data", (d) => (output += d));
    child.stderr.on("data", (d) => (output += d));
    child.on("close", (code) => resolve({ ok: code === 0, output }));
    child.on("error", (err) => resolve({ ok: false, output: err.message }));
  });
}

export function openInObsidian(dir) {
  const r = mac
    ? spawnSync("open", ["-a", "Obsidian", dir], { stdio: "ignore" })
    : spawnSync("xdg-open", [`obsidian://open?path=${encodeURIComponent(dir)}`], { stdio: "ignore" });
  return r.status === 0;
}

/** Hand the terminal to Claude Code inside the brain. Resolves with its exit code. */
export function launchClaude(dir, prompt) {
  const bin = has("claude") ? "claude" : path.join(os.homedir(), ".local", "bin", "claude");
  return new Promise((resolve) => {
    const child = spawn(bin, prompt ? [prompt] : [], { cwd: dir, stdio: "inherit" });
    child.on("close", (code) => resolve(code ?? 0));
    child.on("error", () => resolve(127));
  });
}
