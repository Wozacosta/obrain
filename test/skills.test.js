const { describe, it } = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

const SKILLS_DIR = path.resolve(__dirname, "..", "skills");

const EXPECTED_SKILLS = [
  "brain-setup",
  "morning",
  "weekly",
  "recap",
  "todo",
  "digest",
  "import-vault",
];

describe("skill files", () => {
  it("all expected skill directories exist", () => {
    for (const skill of EXPECTED_SKILLS) {
      const dir = path.join(SKILLS_DIR, skill);
      assert.ok(fs.existsSync(dir), `missing skill dir: ${skill}`);
    }
  });

  it("every skill has a SKILL.md", () => {
    for (const skill of EXPECTED_SKILLS) {
      const file = path.join(SKILLS_DIR, skill, "SKILL.md");
      assert.ok(fs.existsSync(file), `missing SKILL.md in ${skill}`);
    }
  });

  it("every SKILL.md has valid frontmatter with name and description", () => {
    for (const skill of EXPECTED_SKILLS) {
      const file = path.join(SKILLS_DIR, skill, "SKILL.md");
      const content = fs.readFileSync(file, "utf-8");

      assert.ok(content.startsWith("---"), `${skill}: missing frontmatter opening`);

      const endIdx = content.indexOf("---", 3);
      assert.ok(endIdx > 3, `${skill}: missing frontmatter closing`);

      const frontmatter = content.slice(3, endIdx);
      assert.ok(
        frontmatter.includes("name:"),
        `${skill}: frontmatter missing 'name'`
      );
      assert.ok(
        frontmatter.includes("description:"),
        `${skill}: frontmatter missing 'description'`
      );
    }
  });

  it("skill names in frontmatter match directory names", () => {
    for (const skill of EXPECTED_SKILLS) {
      const file = path.join(SKILLS_DIR, skill, "SKILL.md");
      const content = fs.readFileSync(file, "utf-8");
      const nameMatch = content.match(/^name:\s*(.+)$/m);
      assert.ok(nameMatch, `${skill}: could not parse name from frontmatter`);
      assert.strictEqual(
        nameMatch[1].trim(),
        skill,
        `${skill}: frontmatter name '${nameMatch[1].trim()}' doesn't match dir`
      );
    }
  });

  it("skill frontmatter names use current command names only", () => {
    const validNames = new Set(EXPECTED_SKILLS);
    for (const skill of EXPECTED_SKILLS) {
      const file = path.join(SKILLS_DIR, skill, "SKILL.md");
      const content = fs.readFileSync(file, "utf-8");
      const nameMatch = content.match(/^name:\s*(.+)$/m);
      assert.ok(validNames.has(nameMatch[1].trim()), `${skill}: unexpected name in frontmatter`);
    }
  });

  it("no skill references Gemini or API keys", () => {
    for (const skill of EXPECTED_SKILLS) {
      const file = path.join(SKILLS_DIR, skill, "SKILL.md");
      const content = fs.readFileSync(file, "utf-8").toLowerCase();
      assert.ok(
        !content.includes("gemini"),
        `${skill}: references Gemini`
      );
      assert.ok(
        !content.includes("google_api_key"),
        `${skill}: references GOOGLE_API_KEY`
      );
    }
  });
});
