# CLAUDE.md — obrain

## Owner Profile
[Run /brain-setup to generate this. You'll answer a few questions
and Claude builds a profile that loads automatically every session.]

## How This Brain Is Organized

  drop/       — incoming files land here (PDFs, docs, anything)
  daily/      — one note per day, named YYYY-MM-DD.md
  weekly/     — end-of-week digests, named YYYY-Www.md
  projects/   — one subfolder per active project
  refs/       — long-term reference material and research
  done/       — completed work gets moved here, nothing gets deleted
  todo.md     — single task list, managed via /todo

## On Launch
- Open daily/[today].md or offer to create it
- Scan drop/ for new files and read them (handles PDFs, images, anything)
- Check todo.md for overdue or due-today items
- Mention anything relevant from recent project folders

## When Working on a Project
- Read projects/[name]/ before doing anything
- Cross-reference with todo.md for related tasks

## When Writing
- Read the last few daily notes to match tone and voice
- Check refs/ for relevant background

## When Files Land in drop/
- Read them natively (no scripts needed)
- Summarize into markdown
- Ask where to file them or infer from content

## Housekeeping
- New stuff → drop/ first
- Daily notes → daily/YYYY-MM-DD.md
- Weekly reviews → weekly/YYYY-Www.md
- Done with something → move to done/
- Keep this file current as workflows evolve

## Slash Commands
- /brain-setup   — one-time onboarding, builds your profile
- /morning       — start-of-day ritual with context
- /weekly        — end-of-week review and planning
- /recap         — save this session to the right place
- /todo          — manage tasks (add, finish, prioritize)
- /digest        — read and summarize a folder of files
- /import-vault  — merge notes from another Obsidian vault
