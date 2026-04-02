---
name: brain-setup
description: One-time onboarding for obrain. Two-step conversation — collects context, then builds a tailored brain with personalized CLAUDE.md, folders, and commands.
---

# brain-setup — Configure Your Brain

Run this from inside the brain folder.

## Part A — Collect context

Show this prompt and wait for a response:

---

**Two things and I'll build everything:**

1. What does a typical work week look like for you?
2. What's the stuff that falls off your radar and shouldn't?

(Throw in whether you want personal life tracked too, if you want.)

---

Do NOT follow up with more questions. One response is enough.

## Part B — Derive and propose

From what they wrote, determine:
- Archetype: operator / maker / advisor / learner
- What they lose track of
- Scope: work-only / work + personal

Propose the brain layout:

```
Here's the plan:

  [folder name]/
  ├── drop/         incoming — files, ideas, links
  ├── daily/        one note per day
  ├── weekly/       end-of-week reviews
  ├── [custom]/     [purpose from their context]
  ├── [custom]/     [purpose from their context]
  ├── projects/     active work
  └── done/         completed — archived, never trashed

  Commands you'll get:
    /morning   — start-of-day context + priorities
    /weekly    — review the week, plan the next one
    /recap     — capture this session to the right place
    /todo      — task list (add, check off, reprioritize)
    /[custom]  — [one-liner]

  Ready? Say "go" or tell me what to adjust.
```

Wait for confirmation.

## Part C — Build

On go-ahead:

### Folder structure

Archetype-based additions:
- Operator → `people/ decisions/ ops/`
- Maker → `refs/ specs/`
- Advisor → `clients/ refs/`
- Learner → `courses/ refs/`

Work + personal scope → add `personal/`

```bash
mkdir -p drop daily weekly [archetype-folders] projects done \
  .claude/skills/morning .claude/skills/weekly .claude/skills/recap \
  .claude/skills/todo .claude/skills/[custom]
```

### Open in Obsidian
```bash
open -a Obsidian "$(pwd)"
```

### Write CLAUDE.md

```markdown
# CLAUDE.md — obrain ([archetype])

## Owner Profile
[2-3 sentences capturing who they are and what they do.
Written from Claude's perspective about the user.]

## How This Brain Is Organized
[indented tree with one-line descriptions per folder]

## Working Style
[3-4 bullets derived from their answer:
 what they track, what slips, their rhythm, what they want from AI]

## Behavior
When a project comes up → read projects/[name]/ first
When writing → check recent daily notes for voice
When drop/ has stuff → offer to read and file it
When a person or client is mentioned → check [relevant folder]
```

### Write skills

**`.claude/skills/morning/SKILL.md`:**
Open today's note or create it. Check drop/ for new files. Check todo.md for due items. Surface what's pressing. Ask what to work on.

**`.claude/skills/recap/SKILL.md`:**
Distill this session — what happened, what to remember, what's next. File to the right folder. Update memory.md with any new patterns.

**Archetype-specific:**
- Operator → `.claude/skills/briefing/SKILL.md` — status across projects, people, decisions
- Maker → `.claude/skills/context/SKILL.md` — deep-load a project's full state
- Advisor → `.claude/skills/client/SKILL.md` — pull up everything about a client
- Learner → `.claude/skills/study/SKILL.md` — compile and connect notes on a topic

### Write memory.md
```markdown
# Session Log

## Patterns
[Built up over time as Claude learns how you work]

## History
<!-- entries below -->
```

## Part D — Context reach

Ask:

```
One more thing — should Claude load your brain context everywhere?

1. Yes, always (adds a line to ~/.claude/CLAUDE.md — recommended)
2. Just give me the line and I'll paste it where I need it
3. Only when I'm in this folder
```

If 1: append to `~/.claude/CLAUDE.md`:
```
## obrain
On launch, read [absolute path]/CLAUDE.md for owner context.
```

## Part E — Finish

```
Done. Brain is live.

Enable the Obsidian CLI:
  Obsidian → Settings → General → Enable Command Line Interface

Commands:
  /morning   — tomorrow, first thing
  /weekly    — Friday afternoon
  /recap     — end of any session
  /todo      — whenever
  /[custom]  — [one-liner]

Have files to bring in?
  Drop them in drop/ and say: "digest and sort drop/"
```
