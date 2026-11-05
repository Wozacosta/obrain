import { after, beforeEach, describe, it } from "node:test";
import assert from "node:assert";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Point HOME and the config dir at a sandbox before loading the module
const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "obrain-test-"));
process.env.HOME = path.join(sandbox, "home");
process.env.XDG_CONFIG_HOME = path.join(sandbox, "config");
const brainOps = await import("../lib/brain.mjs");

const brain = path.join(sandbox, "home", "obrain");
const skill = (dir, name) => path.join(dir, ".claude", "skills", name, "SKILL.md");
const globalSkills = () => path.join(process.env.HOME, ".claude", "skills");

beforeEach(() => {
  fs.rmSync(sandbox, { recursive: true, force: true });
  fs.mkdirSync(process.env.HOME, { recursive: true });
});
after(() => fs.rmSync(sandbox, { recursive: true, force: true }));

describe("scaffold", () => {
  it("creates folders, CLAUDE.md, memory.md and every skill in the brain", () => {
    const { created, skills } = brainOps.scaffold(brain);
    for (const f of brainOps.FOLDERS) assert.ok(fs.existsSync(path.join(brain, f)), f);
    assert.ok(created.includes("CLAUDE.md") && created.includes("memory.md"));
    assert.deepStrictEqual(skills.added, brainOps.skillNames());
    for (const s of brainOps.skillNames()) assert.ok(fs.existsSync(skill(brain, s)), s);
    assert.strictEqual(brainOps.findBrain(), brain);
  });

  it("does not install skills globally (they would override the brain's)", () => {
    brainOps.scaffold(brain);
    assert.ok(!fs.existsSync(globalSkills()));
  });

  it("keeps an existing CLAUDE.md and notes", () => {
    fs.mkdirSync(path.join(brain, "notes"), { recursive: true });
    fs.writeFileSync(path.join(brain, "CLAUDE.md"), "# mine\n");
    fs.writeFileSync(path.join(brain, "notes", "a.md"), "hello");
    const { created } = brainOps.scaffold(brain);
    assert.ok(!created.includes("CLAUDE.md"));
    assert.strictEqual(fs.readFileSync(path.join(brain, "CLAUDE.md"), "utf8"), "# mine\n");
    assert.strictEqual(fs.readFileSync(path.join(brain, "notes", "a.md"), "utf8"), "hello");
  });

  it("removes untouched legacy global skills but keeps the user's own", () => {
    const shipped = fs.readFileSync(path.join(brainOps.ROOT, "skills", "morning", "SKILL.md"), "utf8");
    fs.mkdirSync(path.join(globalSkills(), "morning"), { recursive: true });
    fs.writeFileSync(path.join(globalSkills(), "morning", "SKILL.md"), shipped);
    fs.mkdirSync(path.join(globalSkills(), "todo"), { recursive: true });
    fs.writeFileSync(path.join(globalSkills(), "todo", "SKILL.md"), "---\nname: todo\n---\nmy own\n");

    const { legacy } = brainOps.scaffold(brain);
    assert.deepStrictEqual(legacy.removed, ["morning"]);
    assert.deepStrictEqual(legacy.kept, ["todo"]);
    assert.ok(fs.existsSync(path.join(globalSkills(), "todo", "SKILL.md")));
  });
});

describe("syncSkills", () => {
  it("keeps a skill the user edited and updates untouched ones", () => {
    brainOps.scaffold(brain);
    fs.appendFileSync(skill(brain, "morning"), "\nAlso check the calendar.\n");
    fs.writeFileSync(skill(brain, "weekly"), "stale");
    // simulate "weekly" being an older shipped version: record its hash as ours
    const config = brainOps.readConfig();
    config.skills.weekly = crypto.createHash("sha256").update("stale").digest("hex");

    const result = brainOps.syncSkills(brain, { config });
    assert.deepStrictEqual(result.customized, ["morning"]);
    assert.deepStrictEqual(result.updated, ["weekly"]);
    assert.match(fs.readFileSync(skill(brain, "morning"), "utf8"), /calendar/);
  });
});

describe("dropFiles", () => {
  it("copies files and folder contents without overwriting", () => {
    brainOps.scaffold(brain);
    const src = path.join(sandbox, "src");
    fs.mkdirSync(src);
    fs.writeFileSync(path.join(src, "a.pdf"), "a");
    fs.writeFileSync(path.join(src, ".hidden"), "x");
    fs.writeFileSync(path.join(brain, "drop", "b.txt"), "keep");
    const single = path.join(sandbox, "b.txt");
    fs.writeFileSync(single, "new");

    const { copied, skipped } = brainOps.dropFiles(brain, [src, single, path.join(sandbox, "nope")]);
    assert.deepStrictEqual(copied, ["a.pdf"]);
    assert.strictEqual(skipped.length, 2);
    assert.strictEqual(fs.readFileSync(path.join(brain, "drop", "b.txt"), "utf8"), "keep");
  });
});

describe("status", () => {
  it("counts drop/, todos and overdue items", () => {
    brainOps.scaffold(brain);
    fs.writeFileSync(path.join(brain, "drop", "x.md"), "");
    fs.writeFileSync(
      path.join(brain, "todo.md"),
      "## Now\n- [ ] a !due:2000-01-01\n- [ ] b\n- [x] done\n",
    );
    const s = brainOps.status(brain);
    assert.strictEqual(s.drop, 1);
    assert.deepStrictEqual(s.todos, { open: 2, overdue: 1 });
    assert.strictEqual(s.personalized, false);
    assert.deepStrictEqual(s.skills.missing, []);
  });
});

describe("global block", () => {
  it("adds once and removes cleanly", () => {
    const file = path.join(process.env.HOME, ".claude", "CLAUDE.md");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, "# Mine\nkeep me\n");
    assert.ok(brainOps.addGlobalBlock(brain));
    assert.ok(!brainOps.addGlobalBlock(brain));
    assert.match(fs.readFileSync(file, "utf8"), /## obrain\nOn launch, read .*CLAUDE\.md/);
    assert.ok(brainOps.removeGlobalBlock());
    assert.strictEqual(fs.readFileSync(file, "utf8").trim(), "# Mine\nkeep me");
  });
});

describe("removeScaffolding", () => {
  it("removes skills, template CLAUDE.md, block and config; keeps notes, todo and memory", () => {
    brainOps.scaffold(brain);
    brainOps.addGlobalBlock(brain);
    fs.writeFileSync(path.join(brain, "daily", "2026-01-01.md"), "note");
    fs.writeFileSync(path.join(brain, "todo.md"), "- [ ] x");

    brainOps.removeScaffolding(brain);
    assert.ok(!fs.existsSync(path.join(brain, ".claude")));
    assert.ok(!fs.existsSync(path.join(brain, "CLAUDE.md")));
    assert.ok(fs.existsSync(path.join(brain, "daily", "2026-01-01.md")));
    assert.ok(fs.existsSync(path.join(brain, "todo.md")));
    assert.ok(fs.existsSync(path.join(brain, "memory.md")));
    assert.ok(!brainOps.hasGlobalBlock());
    assert.ok(!fs.existsSync(brainOps.configPath()));
  });

  it("keeps a CLAUDE.md personalized by /brain-setup", () => {
    brainOps.scaffold(brain);
    fs.writeFileSync(path.join(brain, "CLAUDE.md"), "# CLAUDE.md — obrain (maker)\n\n## Owner Profile\nSam builds things.\n");
    brainOps.removeScaffolding(brain);
    assert.ok(fs.existsSync(path.join(brain, "CLAUDE.md")));
  });
});
