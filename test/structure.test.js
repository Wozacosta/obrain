const { describe, it } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

describe("project structure", () => {
  const requiredFiles = [
    "CLAUDE.md",
    "memory.md",
    "LICENSE",
    "README.md",
    "package.json",
    "setup.sh",
    "uninstall.sh",
    "bin/obrain.js",
  ];

  for (const file of requiredFiles) {
    it(`${file} exists`, () => {
      assert.ok(fs.existsSync(path.join(ROOT, file)), `missing: ${file}`);
    });
  }

  it("setup.sh is executable", () => {
    const stat = fs.statSync(path.join(ROOT, "setup.sh"));
    assert.ok(stat.mode & 0o111, "setup.sh is not executable");
  });

  it("uninstall.sh is executable", () => {
    const stat = fs.statSync(path.join(ROOT, "uninstall.sh"));
    assert.ok(stat.mode & 0o111, "uninstall.sh is not executable");
  });

  it("bin/obrain.js is executable", () => {
    const stat = fs.statSync(path.join(ROOT, "bin", "obrain.js"));
    assert.ok(stat.mode & 0o111, "bin/obrain.js is not executable");
  });

  it("bin/obrain.js has shebang", () => {
    const content = fs.readFileSync(path.join(ROOT, "bin", "obrain.js"), "utf-8");
    assert.ok(content.startsWith("#!/usr/bin/env node"), "missing shebang");
  });

  const scaffoldDirs = ["drop", "daily", "weekly", "projects", "refs", "done"];

  for (const dir of scaffoldDirs) {
    it(`vault-scaffold/${dir}/ exists`, () => {
      assert.ok(
        fs.existsSync(path.join(ROOT, "vault-scaffold", dir)),
        `missing vault-scaffold/${dir}`
      );
    });
  }
});

describe("package.json", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf-8"));

  it("has correct name", () => {
    assert.strictEqual(pkg.name, "obrain");
  });

  it("bin points to existing file", () => {
    const binPath = path.join(ROOT, pkg.bin.obrain);
    assert.ok(fs.existsSync(binPath), `bin target missing: ${pkg.bin.obrain}`);
  });

  it("all listed files exist", () => {
    for (const entry of pkg.files) {
      const full = path.join(ROOT, entry);
      assert.ok(fs.existsSync(full), `listed in files but missing: ${entry}`);
    }
  });

  it("does not reference Python or Gemini files", () => {
    const filesStr = JSON.stringify(pkg.files);
    assert.ok(!filesStr.includes("requirements"), "references requirements");
    assert.ok(!filesStr.includes(".env"), "references .env");
    assert.ok(!filesStr.includes("scripts"), "references scripts");
  });
});

describe("CLAUDE.md", () => {
  const content = fs.readFileSync(path.join(ROOT, "CLAUDE.md"), "utf-8");

  it("references all slash commands", () => {
    const commands = ["brain-setup", "morning", "weekly", "recap", "todo", "digest", "import-vault"];
    for (const cmd of commands) {
      assert.ok(content.includes(cmd), `CLAUDE.md missing reference to ${cmd}`);
    }
  });

  it("does not reference Gemini or API keys", () => {
    const lower = content.toLowerCase();
    assert.ok(!lower.includes("gemini"), "references Gemini");
    assert.ok(!lower.includes("api key"), "references API key");
  });

  it("references all brain folders", () => {
    const folders = ["drop/", "daily/", "weekly/", "projects/", "refs/", "done/", "todo.md"];
    for (const f of folders) {
      assert.ok(content.includes(f), `CLAUDE.md missing folder reference: ${f}`);
    }
  });

  it("uses obrain folder names consistently", () => {
    assert.ok(content.includes("drop/"), "missing drop/");
    assert.ok(content.includes("done/"), "missing done/");
    assert.ok(content.includes("refs/"), "missing refs/");
  });
});
