const { describe, it } = require("node:test");
const assert = require("node:assert");
const { execFileSync } = require("child_process");
const path = require("path");

const CLI = path.resolve(__dirname, "..", "bin", "obrain.js");

function run(args = []) {
  try {
    const out = execFileSync("node", [CLI, ...args], {
      encoding: "utf-8",
      timeout: 5000,
    });
    return { stdout: out, code: 0 };
  } catch (e) {
    return { stdout: e.stdout || "", stderr: e.stderr || "", code: e.status };
  }
}

describe("obrain CLI", () => {
  it("shows help with --help", () => {
    const { stdout, code } = run(["--help"]);
    assert.strictEqual(code, 0);
    assert.ok(stdout.includes("obrain"));
    assert.ok(stdout.includes("npx obrain"));
    assert.ok(stdout.includes("/brain-setup"));
    assert.ok(stdout.includes("/morning"));
    assert.ok(stdout.includes("/weekly"));
    assert.ok(stdout.includes("/recap"));
    assert.ok(stdout.includes("/todo"));
    assert.ok(stdout.includes("/digest"));
    assert.ok(stdout.includes("/import-vault"));
  });

  it("shows help with -h", () => {
    const { stdout, code } = run(["-h"]);
    assert.strictEqual(code, 0);
    assert.ok(stdout.includes("npx obrain"));
  });

  it("shows help with help", () => {
    const { stdout, code } = run(["help"]);
    assert.strictEqual(code, 0);
    assert.ok(stdout.includes("npx obrain"));
  });

  it("rejects unknown commands", () => {
    const { stderr, code } = run(["bogus"]);
    assert.strictEqual(code, 1);
    assert.ok(stderr.includes("Unknown command"));
  });
});

describe("obrain CLI, non-interactive", () => {
  const fs = require("fs");
  const os = require("os");
  const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), "obrain-cli-"));
  const env = { ...process.env, HOME: sandbox, XDG_CONFIG_HOME: path.join(sandbox, ".config") };
  const brain = path.join(sandbox, "obrain");
  const sh = (args) => {
    try {
      return { stdout: execFileSync("node", [CLI, ...args], { encoding: "utf-8", env, cwd: sandbox, timeout: 15000 }), code: 0 };
    } catch (e) {
      return { stdout: (e.stdout || "") + (e.stderr || ""), code: e.status };
    }
  };

  it("prints the version", () => {
    const { stdout, code } = run(["--version"]);
    assert.strictEqual(code, 0);
    assert.match(stdout.trim(), /^\d{4}\.\d+\.\d+$/);
  });

  it("commands that need a brain fail clearly without one", () => {
    const { stdout, code } = sh(["status"]);
    assert.strictEqual(code, 1);
    assert.ok(stdout.includes("No brain found"));
  });

  it("init --yes --no-install builds a brain at ~/obrain", () => {
    const { code } = sh(["init", "--yes", "--no-install"]);
    assert.strictEqual(code, 0);
    assert.ok(fs.existsSync(path.join(brain, "CLAUDE.md")));
    assert.ok(fs.existsSync(path.join(brain, ".claude", "skills", "morning", "SKILL.md")));
    assert.ok(!fs.existsSync(path.join(sandbox, ".claude", "skills")), "installed skills globally");
  });

  it("drop copies files into drop/", () => {
    const file = path.join(sandbox, "notes.txt");
    fs.writeFileSync(file, "hi");
    const { stdout, code } = sh(["drop", file]);
    assert.strictEqual(code, 0);
    assert.ok(stdout.includes("Copied 1"));
    assert.ok(fs.existsSync(path.join(brain, "drop", "notes.txt")));
  });

  it("status reports on the brain", () => {
    const { stdout, code } = sh(["status"]);
    assert.strictEqual(code, 0);
    assert.ok(stdout.includes("1 in drop/"));
    assert.ok(stdout.includes("skills installed"));
  });

  it("uninstall --yes keeps notes", () => {
    const { code } = sh(["uninstall", "--yes"]);
    assert.strictEqual(code, 0);
    assert.ok(!fs.existsSync(path.join(brain, ".claude")));
    assert.ok(fs.existsSync(path.join(brain, "drop", "notes.txt")));
    fs.rmSync(sandbox, { recursive: true, force: true });
  });
});
