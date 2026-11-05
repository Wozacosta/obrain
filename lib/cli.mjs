import fs from "node:fs";
import path from "node:path";
import { styleText } from "node:util";
import * as p from "@clack/prompts";
import * as brainOps from "./brain.mjs";
import * as tools from "./tools.mjs";

const { expand, tildify } = brainOps;
const pkg = JSON.parse(fs.readFileSync(path.join(brainOps.ROOT, "package.json"), "utf8"));

const dim = (s) => styleText("dim", s);
const bold = (s) => styleText("bold", s);
const cyan = (s) => styleText("cyan", s);

const COMMANDS = [
  ["/brain-setup", "one-time personalization"],
  ["/morning", "start-of-day ritual"],
  ["/weekly", "end-of-week review"],
  ["/recap", "capture this session"],
  ["/todo", "manage tasks"],
  ["/digest", "read and summarize files"],
  ["/import-vault", "pull notes from another vault"],
];

const HELP = `
  ${bold("obrain")} — hook Obsidian into Claude Code

  ${bold("Usage")}
    npx obrain                  set up a brain, or open the menu if you have one
    npx obrain init [path]      set up (or top up) a brain, default ~/obrain
    npx obrain start            open Claude Code in your brain
    npx obrain morning          open Claude Code and run /morning
    npx obrain open             open your brain in Obsidian
    npx obrain drop <files...>  copy files or folders into drop/
    npx obrain status           health check: apps, skills, today's note, todos
    npx obrain update           update the skills (keeps ones you've edited)
    npx obrain uninstall        remove obrain, keep your notes

  ${bold("Options")}
    -y, --yes          accept the defaults, no questions
    --no-install       don't install Obsidian or Claude Code
    -v, --version      print the version

  ${bold("Inside Claude Code")}
${COMMANDS.map(([c, d]) => `    ${c.padEnd(16)}${d}`).join("\n")}
`;

// ── args ─────────────────────────────────────────────────────────────────────

function parse(argv) {
  const flags = { yes: false, install: true };
  const args = [];
  for (const a of argv) {
    if (a === "-y" || a === "--yes") flags.yes = true;
    else if (a === "--no-install") flags.install = false;
    else args.push(a);
  }
  if (!process.stdin.isTTY) flags.yes = true;
  return { command: args[0], args: args.slice(1), flags };
}

/** Exit cleanly when the user hits Ctrl-C or Esc on a prompt */
function answer(value) {
  if (p.isCancel(value)) {
    p.cancel("Nothing else changed.");
    process.exit(0);
  }
  return value;
}

function requireBrain() {
  const brain = brainOps.findBrain();
  if (!brain) {
    console.error(`No brain found. Run ${cyan("npx obrain init")} first.`);
    process.exit(1);
  }
  return brain;
}

// ── init ─────────────────────────────────────────────────────────────────────

async function ensureApps(flags) {
  const s = p.spinner();
  s.start("Checking for Obsidian and Claude Code");
  const claude = tools.claudeVersion();
  const obsidian = tools.hasObsidian();
  s.stop("Checked your apps");

  if (obsidian) p.log.success("Obsidian");
  else {
    const installer = tools.obsidianInstaller();
    const go =
      flags.install &&
      installer &&
      (flags.yes || answer(await p.confirm({ message: `Install Obsidian with ${installer.label}?` })));
    if (go) {
      s.start(`Installing Obsidian (${installer.cmd})`);
      const r = await tools.run(installer.cmd);
      r.ok ? s.stop("Installed Obsidian") : s.error(`Couldn't install Obsidian. Get it from ${tools.OBSIDIAN_DOWNLOAD}`);
    } else p.log.warn(`Obsidian isn't installed. Get it from ${cyan(tools.OBSIDIAN_DOWNLOAD)}`);
  }

  if (claude) p.log.success(`Claude Code ${dim(claude)}`);
  else {
    const go = flags.install && (flags.yes || answer(await p.confirm({ message: "Install Claude Code?" })));
    if (go) {
      s.start("Installing Claude Code");
      const r = await tools.run(tools.CLAUDE_INSTALL);
      r.ok
        ? s.stop(`Installed ${tools.claudeVersion() ?? "Claude Code"}`)
        : s.error(`Couldn't install Claude Code. Run: ${tools.CLAUDE_INSTALL}`);
    } else p.log.warn(`Claude Code isn't installed. Run: ${cyan(tools.CLAUDE_INSTALL)}`);
  }
}

function validateBrainPath(value) {
  const t = brainOps.inspectTarget(expand(value || "~/obrain"));
  if (t.isFile) return "That's a file, not a folder.";
  if (t.isRepo) return "That's the obrain source folder. Pick another one.";
}

async function init(args, flags) {
  p.intro(`${cyan(bold("obrain"))} ${dim(`v${pkg.version} · hook Obsidian into Claude Code`)}`);

  await ensureApps(flags);

  const suggested = tildify(brainOps.findBrain() ?? brainOps.defaultBrain());
  let raw = args[0];
  if (!raw && !flags.yes) {
    raw = answer(
      await p.text({
        message: "Where should your brain live?",
        placeholder: suggested,
        defaultValue: suggested,
        validate: validateBrainPath,
      }),
    );
  }
  const brain = expand(raw || suggested);
  const problem = validateBrainPath(brain);
  if (problem) {
    p.cancel(problem);
    process.exit(1);
  }

  const target = brainOps.inspectTarget(brain);
  if (target.hasNotes && !brainOps.isBrain(brain) && !flags.yes) {
    const kind = target.isVault ? "an Obsidian vault" : "files";
    const go = answer(
      await p.confirm({
        message: `${tildify(brain)} already has ${kind}. Add obrain to it? Your notes${target.hasClaudeMd ? " and CLAUDE.md" : ""} stay as they are.`,
      }),
    );
    if (!go) {
      p.cancel("Nothing changed.");
      process.exit(0);
    }
  }

  const result = brainOps.scaffold(brain);
  reportScaffold(brain, result);

  if (!flags.yes) {
    const src = answer(
      await p.text({
        message: "Any files to bring in? They'll be copied into drop/.",
        placeholder: "a folder path, or Enter to skip",
        defaultValue: "",
      }),
    );
    if (src) reportDrop(brainOps.dropFiles(brain, [expand(src)]));

    if (!brainOps.hasGlobalBlock()) {
      const everywhere = answer(
        await p.confirm({
          message: "Load your brain in every Claude Code session, wherever you start it?",
          initialValue: true,
        }),
      );
      if (everywhere && brainOps.addGlobalBlock(brain)) p.log.success("Added an obrain block to ~/.claude/CLAUDE.md");
    }
  }

  // Scripts and CI don't want a window popping up
  if (!flags.yes && tools.openInObsidian(brain)) p.log.info(`Opened ${tildify(brain)} in Obsidian`);

  p.note(
    [
      `1. In Obsidian, enable Settings → General → ${bold("Command line interface")}`,
      `2. Run ${cyan("/brain-setup")} in Claude Code to personalize everything`,
      `3. Next time, just run ${cyan("npx obrain")}`,
    ].join("\n"),
    "Next",
  );

  if (!flags.yes && tools.claudeVersion()) {
    const start = answer(await p.confirm({ message: "Start Claude Code and run /brain-setup now?" }));
    if (start) {
      p.outro("Handing over to Claude Code…");
      process.exit(await tools.launchClaude(brain, "/brain-setup"));
    }
  }
  p.outro(`Your brain is at ${cyan(tildify(brain))}`);
}

function reportScaffold(brain, { created, skills, legacy }) {
  if (created.length) p.log.success(`Created ${created.join(", ")} in ${tildify(brain)}`);
  else p.log.info(`${tildify(brain)} already had every folder`);
  reportSkills(skills);
  if (legacy.removed.length) {
    p.log.info(
      `Removed old global copies of ${legacy.removed.join(", ")} from ~/.claude/skills (they overrode your brain's own)`,
    );
  }
  if (legacy.kept.length) {
    p.log.warn(
      `~/.claude/skills has your own ${legacy.kept.join(", ")}; they override the brain's versions of the same name`,
    );
  }
}

function reportSkills({ added, updated, customized, same }) {
  if (added.length) p.log.success(`Installed ${added.length} skills: ${added.join(", ")}`);
  if (updated.length) p.log.success(`Updated ${updated.join(", ")}`);
  if (customized.length) p.log.info(`Kept your edited ${customized.join(", ")}`);
  if (!added.length && !updated.length && same.length) p.log.info("Skills are up to date");
}

function reportDrop({ copied, skipped }) {
  if (copied.length) p.log.success(`Copied ${copied.length} file${copied.length === 1 ? "" : "s"} into drop/`);
  if (skipped.length) p.log.warn(`Skipped ${skipped.length} (missing, or already in drop/)`);
  if (copied.length) p.log.info(`In Claude Code, say ${cyan('"digest and sort drop/"')}`);
}

// ── status ───────────────────────────────────────────────────────────────────

function summary(s) {
  const bits = [
    s.todayNote ? "today's note ✓" : "no note today yet",
    `${s.drop} in drop/`,
    `${s.todos.open} todo${s.todos.open === 1 ? "" : "s"}${s.todos.overdue ? `, ${styleText("yellow", `${s.todos.overdue} overdue`)}` : ""}`,
  ];
  return bits.join(dim(" · "));
}

function statusReport(brain) {
  const s = brainOps.status(brain);
  p.intro(`${cyan(bold("obrain"))} ${dim(tildify(brain))}`);

  const claude = tools.claudeVersion();
  claude ? p.log.success(`Claude Code ${dim(claude)}`) : p.log.error(`Claude Code missing: ${tools.CLAUDE_INSTALL}`);
  tools.hasObsidian() ? p.log.success("Obsidian") : p.log.error(`Obsidian missing: ${tools.OBSIDIAN_DOWNLOAD}`);

  const { missing, outdated, shipped } = s.skills;
  if (missing.length) p.log.warn(`Missing skills: ${missing.join(", ")}. Run ${cyan("npx obrain update")}`);
  else if (outdated.length) p.log.info(`${outdated.join(", ")} differ from v${pkg.version} (edited, or older)`);
  else p.log.success(`${shipped} skills installed`);

  s.personalized
    ? p.log.success("CLAUDE.md is personalized")
    : p.log.warn(`CLAUDE.md is still the template. Run ${cyan("/brain-setup")} in Claude Code`);
  s.globalBlock
    ? p.log.success("Loaded in every Claude Code session")
    : p.log.info("Only loaded when Claude Code runs inside the brain");

  p.log.message(`${s.dailyNotes} daily notes · ${s.projects} projects · ${summary(s)}`);
  p.outro("");
  return s;
}

// ── home menu ────────────────────────────────────────────────────────────────

async function home(brain, flags) {
  const s = brainOps.status(brain);
  p.intro(`${cyan(bold("obrain"))} ${dim(tildify(brain))}`);
  p.log.message(summary(s));

  const action = answer(
    await p.select({
      message: "What now?",
      options: [
        { value: "morning", label: s.todayNote ? "Pick up the day" : "Start my day", hint: "claude /morning" },
        { value: "start", label: "Open Claude Code", hint: "in your brain" },
        { value: "open", label: "Open in Obsidian" },
        { value: "drop", label: "Add files to drop/" },
        { value: "status", label: "Check health" },
        { value: "update", label: "Update skills" },
        ...(s.personalized ? [] : [{ value: "setup", label: "Personalize", hint: "claude /brain-setup" }]),
        { value: "uninstall", label: "Uninstall" },
        { value: "quit", label: "Quit" },
      ],
    }),
  );

  switch (action) {
    case "morning":
      return launch(brain, "/morning");
    case "setup":
      return launch(brain, "/brain-setup");
    case "start":
      return launch(brain);
    case "open":
      tools.openInObsidian(brain) ? p.outro("Opened in Obsidian") : p.outro("Couldn't open Obsidian");
      return;
    case "drop": {
      const src = answer(await p.text({ message: "File or folder to copy into drop/", validate: (v) => (v ? undefined : "Enter a path") }));
      reportDrop(brainOps.dropFiles(brain, [expand(src)]));
      return p.outro("");
    }
    case "status":
      p.outro("");
      return statusReport(brain);
    case "update":
      reportSkills(brainOps.syncSkills(brain));
      return p.outro("");
    case "uninstall":
      return uninstall(brain, flags);
    default:
      p.outro("See you tomorrow.");
  }
}

async function launch(brain, prompt) {
  if (!tools.claudeVersion()) {
    p.cancel(`Claude Code isn't installed. Run: ${tools.CLAUDE_INSTALL}`);
    process.exit(1);
  }
  p.outro(prompt ? `Opening Claude Code with ${prompt}…` : "Opening Claude Code…");
  process.exit(await tools.launchClaude(brain, prompt));
}

// ── uninstall ────────────────────────────────────────────────────────────────

async function uninstall(brain, flags) {
  if (!brain) {
    console.log("No brain found; nothing to remove.");
    return;
  }
  if (!flags.yes) {
    const go = answer(
      await p.confirm({
        message: `Remove obrain from ${tildify(brain)}? Its skills and template CLAUDE.md go; your notes, todo.md and memory.md stay.`,
        initialValue: false,
      }),
    );
    if (!go) return p.cancel("Nothing changed.");
  }
  const removed = brainOps.removeScaffolding(brain);
  removed.length ? p.log.success(`Removed ${removed.join(", ")}`) : p.log.info("Nothing to remove");
  p.outro(`Notes are still in ${tildify(brain)}. Obsidian and Claude Code are still installed.`);
}

// ── main ─────────────────────────────────────────────────────────────────────

export async function main(argv) {
  const { command, args, flags } = parse(argv);

  if (["help", "-h", "--help"].includes(command)) return console.log(HELP);
  if (["version", "-v", "--version"].includes(command)) return console.log(pkg.version);

  if (!tools.supported()) {
    console.error(`obrain runs on macOS and Linux; ${process.platform} isn't supported yet.`);
    process.exit(1);
  }

  switch (command) {
    case undefined: {
      const brain = brainOps.findBrain();
      if (!brain) return init(args, flags);
      if (flags.yes) return statusReport(brain);
      return home(brain, flags);
    }
    case "init":
    case "setup":
    case "install":
      return init(args, flags);
    case "start":
      return launch(requireBrain());
    case "morning":
      return launch(requireBrain(), "/morning");
    case "open": {
      const brain = requireBrain();
      if (!tools.openInObsidian(brain)) process.exitCode = 1;
      return;
    }
    case "drop": {
      if (!args.length) {
        console.error("Usage: npx obrain drop <files or folders...>");
        process.exit(1);
      }
      const { copied, skipped } = brainOps.dropFiles(requireBrain(), args.map(expand));
      console.log(`Copied ${copied.length} into drop/${skipped.length ? `, skipped ${skipped.length}` : ""}`);
      return;
    }
    case "status":
    case "doctor":
      return statusReport(requireBrain());
    case "update": {
      const brain = requireBrain();
      p.intro(`${cyan(bold("obrain"))} ${dim(`update · ${tildify(brain)}`)}`);
      reportSkills(brainOps.syncSkills(brain));
      const legacy = brainOps.removeLegacyGlobalSkills();
      if (legacy.removed.length) p.log.info(`Removed old global copies of ${legacy.removed.join(", ")}`);
      return p.outro("");
    }
    case "uninstall":
    case "remove":
      return uninstall(brainOps.findBrain(), flags);
    default:
      console.error(`Unknown command: ${command}`);
      console.error("Run: npx obrain help");
      process.exit(1);
  }
}
