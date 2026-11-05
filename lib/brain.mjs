// Brain operations with no prompts: scaffold, sync skills, status, uninstall.
// Everything here is safe to call from tests with a temporary HOME.

import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const FOLDERS = ["drop", "daily", "weekly", "projects", "refs", "done"];
const GLOBAL_BLOCK = "## obrain";

const sha = (text) => crypto.createHash("sha256").update(text).digest("hex");
const read = (file) => fs.readFileSync(file, "utf8");
const today = () => new Date().toISOString().slice(0, 10);

export function skillNames() {
  return fs
    .readdirSync(path.join(ROOT, "skills"), { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

export function expand(p) {
  if (p === "~") return os.homedir();
  if (p.startsWith("~/")) return path.join(os.homedir(), p.slice(2));
  return path.resolve(p);
}

export const tildify = (p) =>
  p.startsWith(os.homedir()) ? "~" + p.slice(os.homedir().length) : p;

export const defaultBrain = () => path.join(os.homedir(), "obrain");

// ── config: where the brain lives, and what we installed ─────────────────────

export function configPath() {
  const base = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config");
  return path.join(base, "obrain", "config.json");
}

export function readConfig() {
  try {
    return JSON.parse(read(configPath()));
  } catch {
    return {};
  }
}

function writeConfig(config) {
  fs.mkdirSync(path.dirname(configPath()), { recursive: true });
  fs.writeFileSync(configPath(), JSON.stringify(config, null, 2) + "\n");
}

export function isBrain(dir) {
  return fs.existsSync(path.join(dir, "CLAUDE.md")) && fs.existsSync(path.join(dir, ".claude", "skills"));
}

/** The configured brain, else the current folder or ~/obrain if either is one */
export function findBrain() {
  const { brain } = readConfig();
  if (brain && fs.existsSync(brain)) return brain;
  for (const dir of [process.cwd(), defaultBrain()]) if (isBrain(dir)) return dir;
  return null;
}

/** What's already at a prospective brain path */
export function inspectTarget(dir) {
  if (!fs.existsSync(dir)) return { exists: false };
  if (!fs.statSync(dir).isDirectory()) return { exists: true, isFile: true };
  const entries = fs.readdirSync(dir).filter((e) => e !== ".DS_Store");
  return {
    exists: true,
    isRepo: path.resolve(dir) === ROOT,
    isVault: fs.existsSync(path.join(dir, ".obsidian")),
    hasNotes: entries.some((e) => !e.startsWith(".")),
    hasClaudeMd: entries.includes("CLAUDE.md"),
  };
}

// ── skills ───────────────────────────────────────────────────────────────────

/**
 * Copy the shipped skills into <brain>/.claude/skills. A skill the user edited
 * (its hash differs from what we last installed) is kept, never overwritten.
 */
export function syncSkills(brain, { config = readConfig() } = {}) {
  const installed = config.skills ?? {};
  const result = { added: [], updated: [], same: [], customized: [] };

  for (const name of skillNames()) {
    const src = read(path.join(ROOT, "skills", name, "SKILL.md"));
    const dest = path.join(brain, ".claude", "skills", name, "SKILL.md");

    if (!fs.existsSync(dest)) {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, src);
      result.added.push(name);
    } else {
      const current = read(dest);
      if (current === src) result.same.push(name);
      else if (installed[name] && sha(current) !== installed[name]) {
        result.customized.push(name);
        continue; // keep their version and its recorded hash
      } else {
        fs.writeFileSync(dest, src);
        result.updated.push(name);
      }
    }
    installed[name] = sha(src);
  }

  writeConfig({ ...config, brain, skills: installed });
  return result;
}

/**
 * Older versions also copied the skills into ~/.claude/skills, where they
 * override the brain's own copies. Remove the ones that are still untouched.
 */
export function removeLegacyGlobalSkills() {
  const removed = [];
  const kept = [];
  for (const name of skillNames()) {
    const dir = path.join(os.homedir(), ".claude", "skills", name);
    const file = path.join(dir, "SKILL.md");
    if (!fs.existsSync(file)) continue;
    const text = read(file);
    if (text === read(path.join(ROOT, "skills", name, "SKILL.md")) || LEGACY_SKILLS.has(sha(text))) {
      fs.rmSync(dir, { recursive: true, force: true });
      removed.push(name);
    } else kept.push(name);
  }
  return { removed, kept };
}

// SHA-256 of every SKILL.md that setup.sh ever copied into ~/.claude/skills
const LEGACY_SKILLS = new Set([
  // 2026.4.2
  "65603166d6d75d156a8a5e536e3e7dce99a47b9f5aeb02bef78cef7061f10317",
  "ec76abd018ee34cc8c3b49c861f8c1d362076440095f76dec04770fe593862b1",
  "821b540aa372f1ef7a4f771ee1d031c07b081be5006f0df253e8bc965cc0a0ad",
  "a5cdc75aa0ca65bdda5b36ef044ad1296184a069ac8ac4e720367b790b9ce240",
  "c4a50b53bf03d29261dc972015df634af44ff25b0be4839014c8c92e47d990fa",
  "32adc9f7d4a80ff4ff08620264e27e8a5fd5f79ef1c89b269ce14e5b1253bf41",
  "c1d954bac2469807ad14ff65074d4e11d5d92791256738ab5b7c96f8339c70e7",
  // 2026.11.5 (setup.sh, before the CLI)
  "0ad16077839a9945adff067d174fa8af16e36a9b105cd436effe9373bb5246e9",
  "bd45e0c62647b7cdc8a474e06fe9ea832a6f0242be7c5a3f634a1b570a3bd37b",
  "dbe1a6504e34f6177e6df533ec93e3d05d8e0e7dba51603309b4601a973423a6",
  "fcb56d6cdafaaecc70573c028a69fb83095b2964e7a884594d55e80b27d97048",
]);

// ── scaffold ─────────────────────────────────────────────────────────────────

/** Create or top up a brain. Never touches existing notes or a CLAUDE.md. */
export function scaffold(brain) {
  const created = [];
  fs.mkdirSync(brain, { recursive: true });
  for (const folder of FOLDERS) {
    const dir = path.join(brain, folder);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
      created.push(`${folder}/`);
    }
  }
  for (const file of ["CLAUDE.md", "memory.md"]) {
    const dest = path.join(brain, file);
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(path.join(ROOT, file), dest);
      created.push(file);
    }
  }
  const skills = syncSkills(brain);
  const legacy = removeLegacyGlobalSkills();
  return { created, skills, legacy };
}

/** Copy files into drop/, never overwriting. Returns the names copied. */
export function dropFiles(brain, sources) {
  const copied = [];
  const skipped = [];
  for (const src of sources) {
    const stat = fs.existsSync(src) && fs.statSync(src);
    const files = !stat
      ? []
      : stat.isDirectory()
        ? fs.readdirSync(src).filter((f) => !f.startsWith(".")).map((f) => path.join(src, f))
        : [src];
    if (!stat) skipped.push(src);
    for (const file of files) {
      if (!fs.statSync(file).isFile()) continue;
      const dest = path.join(brain, "drop", path.basename(file));
      if (fs.existsSync(dest)) skipped.push(file);
      else {
        fs.copyFileSync(file, dest);
        copied.push(path.basename(file));
      }
    }
  }
  return { copied, skipped };
}

// ── status ───────────────────────────────────────────────────────────────────

export function status(brain) {
  const list = (dir) => {
    try {
      return fs.readdirSync(path.join(brain, dir)).filter((f) => !f.startsWith("."));
    } catch {
      return [];
    }
  };
  const claudeMd = path.join(brain, "CLAUDE.md");
  const todo = fs.existsSync(path.join(brain, "todo.md")) ? read(path.join(brain, "todo.md")) : "";
  const open = todo.match(/^\s*- \[ \]/gm)?.length ?? 0;
  const overdue = [...todo.matchAll(/^\s*- \[ \].*!due:(\d{4}-\d{2}-\d{2})/gm)].filter(
    (m) => m[1] < today(),
  ).length;
  const shipped = skillNames();
  const missing = shipped.filter((s) => !fs.existsSync(path.join(brain, ".claude", "skills", s, "SKILL.md")));
  const outdated = shipped.filter((s) => {
    const dest = path.join(brain, ".claude", "skills", s, "SKILL.md");
    return fs.existsSync(dest) && read(dest) !== read(path.join(ROOT, "skills", s, "SKILL.md"));
  });

  return {
    brain,
    personalized: fs.existsSync(claudeMd) && !read(claudeMd).includes("[Run /brain-setup"),
    todayNote: fs.existsSync(path.join(brain, "daily", `${today()}.md`)),
    drop: list("drop").length,
    projects: list("projects").length,
    dailyNotes: list("daily").length,
    todos: { open, overdue },
    skills: { shipped: shipped.length, missing, outdated },
    globalBlock: hasGlobalBlock(),
  };
}

// ── global context line in ~/.claude/CLAUDE.md ───────────────────────────────

const globalClaudeMd = () => path.join(os.homedir(), ".claude", "CLAUDE.md");

export function hasGlobalBlock() {
  const file = globalClaudeMd();
  return fs.existsSync(file) && read(file).split("\n").includes(GLOBAL_BLOCK);
}

export function addGlobalBlock(brain) {
  if (hasGlobalBlock()) return false;
  const file = globalClaudeMd();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const before = fs.existsSync(file) ? read(file) : "";
  const sep = before === "" || before.endsWith("\n\n") ? "" : before.endsWith("\n") ? "\n" : "\n\n";
  fs.writeFileSync(
    file,
    `${before}${sep}${GLOBAL_BLOCK}\nOn launch, read ${path.join(brain, "CLAUDE.md")} for owner context.\n`,
  );
  return true;
}

export function removeGlobalBlock() {
  if (!hasGlobalBlock()) return false;
  const lines = read(globalClaudeMd()).split("\n");
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === GLOBAL_BLOCK) {
      if (lines[i + 1]?.startsWith("On launch, read ")) i++;
      continue;
    }
    out.push(lines[i]);
  }
  fs.writeFileSync(globalClaudeMd(), out.join("\n"));
  return true;
}

// ── uninstall ────────────────────────────────────────────────────────────────

/**
 * Remove what obrain added and keep the notes: the shipped skills, the global
 * block, the config, and CLAUDE.md if it's still the template. todo.md,
 * memory.md and a personalized CLAUDE.md are the user's data and stay.
 */
export function removeScaffolding(brain) {
  const removed = [];
  for (const name of skillNames()) {
    const dir = path.join(brain, ".claude", "skills", name);
    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
      removed.push(`.claude/skills/${name}`);
    }
  }
  for (const dir of [path.join(brain, ".claude", "skills"), path.join(brain, ".claude")]) {
    if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) fs.rmdirSync(dir);
  }

  const claudeMd = path.join(brain, "CLAUDE.md");
  const backups = fs.existsSync(brain)
    ? fs.readdirSync(brain).filter((f) => f.startsWith("CLAUDE.md.bak-")).sort()
    : [];
  // Only the untouched template: a /brain-setup profile is the user's
  if (fs.existsSync(claudeMd) && read(claudeMd) === read(path.join(ROOT, "CLAUDE.md"))) {
    if (backups.length) {
      fs.renameSync(path.join(brain, backups.at(-1)), claudeMd);
      removed.push(`CLAUDE.md (restored ${backups.at(-1)})`);
    } else {
      fs.rmSync(claudeMd);
      removed.push("CLAUDE.md");
    }
  }

  if (removeGlobalBlock()) removed.push("~/.claude/CLAUDE.md obrain block");
  removed.push(...removeLegacyGlobalSkills().removed.map((s) => `~/.claude/skills/${s}`));
  fs.rmSync(path.dirname(configPath()), { recursive: true, force: true });
  return removed;
}
