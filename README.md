# obrain

Stop re-explaining yourself to AI every session.

obrain hooks [Obsidian](https://obsidian.md) into [Claude Code](https://claude.ai/code). Your notes, your files, your projects — Claude reads them before you type a word.

Runs locally. Nothing phones home. No API keys.

## What happens

You write notes in Obsidian. Claude Code loads them on launch. The more you use it, the more context it has — your projects, your voice, your working patterns. You never have to catch it up.

## Install

```bash
git clone https://github.com/wozacosta/obrain.git && cd obrain && ./setup.sh
```

Or via npm:

```bash
npx obrain
```

Installs Homebrew, Obsidian and Claude Code if they're missing, sets up the brain structure, and installs the slash commands as Claude Code skills (in the brain's `.claude/skills/` and globally in `~/.claude/skills/`, so they work from any folder). Two minutes. Re-runnable.

### Got an existing Obsidian vault?

Point the installer at it. Adds what's missing, backs up your CLAUDE.md, doesn't touch your notes.

## Usage

```bash
cd ~/obrain && claude
```

| Command | What it does |
|---------|-------------|
| `/brain-setup` | One-time setup. Claude asks about your work and builds a tailored config. |
| `/morning` | Start of day. Opens today's note, checks what's new, asks what to focus on. |
| `/weekly` | End of week. Reviews daily notes, finds patterns, plans next week. |
| `/recap` | End of session. Captures what happened and files it. |
| `/todo` | Task manager. Add, complete, reprioritize. Lives in todo.md. |
| `/digest` | Reads a folder of files (PDFs, docs, images) and writes markdown summaries. |
| `/import-vault` | Pulls notes from another Obsidian vault into this brain. |

## Bring in your files

Drop anything into `drop/` — PDFs, Word docs, images, whatever. Claude reads them natively.

```bash
cp ~/Downloads/stuff/* ~/obrain/drop/
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

- macOS (Linux and Windows aren't supported yet)
- [Obsidian](https://obsidian.md) (free)
- [Claude Code](https://claude.ai/code)

The installer fetches whichever of these you don't have.

## Uninstall

```bash
./uninstall.sh   # or: npx obrain uninstall
```

Removes the skills, the `## obrain` block in `~/.claude/CLAUDE.md`, and the brain's scaffolding. Your notes stay unless you choose to delete them.

## Tests

```bash
npm test
```

## License

[The obrain License](LICENSE) — MIT with personality.
