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
