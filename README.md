# obrain

Stop re-explaining yourself to AI every session.

obrain hooks [Obsidian](https://obsidian.md) into [Claude Code](https://claude.ai/code). Your notes, your files, your projects — Claude reads them before you type a word.

Runs locally. Nothing phones home. No API keys.

## What happens

You write notes in Obsidian. Claude Code loads them on launch. The more you use it, the more context it has — your projects, your voice, your working patterns. You never have to catch it up.

## Install

```bash
npx obrain
```

A short wizard checks for Obsidian and Claude Code (and offers to install them), asks where
your brain should live, builds it, and opens it in Obsidian. Two minutes. Safe to re-run.

Prefer a clone? `git clone https://github.com/wozacosta/obrain.git && cd obrain && ./setup.sh`

### Got an existing Obsidian vault?

Point the wizard at it. It adds what's missing and leaves your notes and your CLAUDE.md alone.

## Every day

Run `npx obrain` again and you get a menu instead of the wizard:

```
┌  obrain ~/obrain
│
│  no note today yet · 3 in drop/ · 5 todos, 1 overdue
│
◆  What now?
│  ● Start my day (claude /morning)
│  ○ Open Claude Code
│  ○ Open in Obsidian
│  ○ Add files to drop/
│  ○ Check health
│  ○ Update skills
│  ○ Uninstall
│  ○ Quit
└
```

Or skip the menu:

| Command | What it does |
|---------|-------------|
| `npx obrain morning` | Open Claude Code in your brain and run `/morning` |
| `npx obrain start` | Open Claude Code in your brain |
| `npx obrain open` | Open your brain in Obsidian |
| `npx obrain drop <files...>` | Copy files or folders into `drop/` |
| `npx obrain status` | Health check: apps, skills, today's note, todos |
| `npx obrain update` | Update the skills; ones you've edited are kept |
| `npx obrain uninstall` | Remove obrain, keep your notes |

Add `--yes` to accept the defaults without questions (handy in scripts), and `--no-install` to
never install apps. Install it globally (`npm i -g obrain`) to drop the `npx`.

## Inside Claude Code

| Command | What it does |
|---------|-------------|
| `/brain-setup` | One-time setup. Claude asks about your work and builds a tailored config. |
| `/morning` | Start of day. Opens today's note, checks what's new, asks what to focus on. |
| `/weekly` | End of week. Reviews daily notes, finds patterns, plans next week. |
| `/recap` | End of session. Captures what happened and files it. |
| `/todo` | Task manager. Add, complete, reprioritize. Lives in todo.md. |
| `/digest` | Reads a folder of files (PDFs, docs, images) and writes markdown summaries. |
| `/import-vault` | Pulls notes from another Obsidian vault into this brain. |

The skills live in your brain's `.claude/skills/`, so `/brain-setup` can tailor them to your
folders. During setup you can also have Claude load your brain's CLAUDE.md in every session,
wherever you start it.

## Bring in your files

Drop anything into `drop/` — PDFs, Word docs, images, whatever. Claude reads them natively.

```bash
npx obrain drop ~/Downloads/stuff
```

Then: `"digest and sort drop/"`

## Structure

```
~/obrain/
├── CLAUDE.md     your identity — loaded every session
├── memory.md     session log, auto-maintained
├── todo.md       task list
├── drop/         incoming files and ideas
├── daily/        one note per day
├── weekly/       weekly reviews
├── projects/     active work
├── refs/         reference material
└── done/         archived work
```

## Requirements

- macOS or Linux, with Node.js 20.12+
- [Obsidian](https://obsidian.md) (free) and [Claude Code](https://claude.ai/code): the wizard
  installs them if they're missing (Homebrew on macOS, Flatpak on Linux)

## Uninstall

```bash
npx obrain uninstall
```

Removes the skills, the template CLAUDE.md, the `## obrain` block in `~/.claude/CLAUDE.md` and
obrain's config. Your notes, `todo.md`, `memory.md` and a personalized CLAUDE.md stay, and so do
Obsidian and Claude Code.

## Tests

```bash
npm test
```

## License

[The obrain License](LICENSE) — MIT with personality.
