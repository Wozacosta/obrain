---
name: todo
description: Task manager built into the brain. Add, list, complete, and prioritize todos. Stores them in todo.md at the brain root. Trigger on "todo", "add task", "what's on my plate", "mark done", or any task management request.
---

# Todo Manager

All todos live in `todo.md` at the brain root. This is the single source of truth.

## Format

todo.md uses this structure:

```markdown
# Todo

## Now
[Top priority. Do these today or they slip.]

- [ ] Task description `#project-name` `@person` `!due:YYYY-MM-DD`
- [ ] Another task `#client-work`

## Next
[On deck. Do these when Now is clear.]

- [ ] Something coming up `#research`

## Waiting
[Blocked on someone or something else.]

- [ ] Waiting on reply from @name about X `#project`

## Someday
[Ideas and low-priority items. Review weekly.]

- [ ] Nice-to-have thing
```

Tags are optional but useful:
- `#project-name` — links to a project folder
- `@person` — who's involved or blocking
- `!due:YYYY-MM-DD` — hard deadline

## Commands

Respond to these naturally:

**"todo"** or **"what's on my plate"**
→ Read todo.md. Show a clean summary grouped by section.
   Highlight anything overdue (past !due: date).
   Count: X active, Y waiting, Z someday.

**"add todo: [description]"** or **"I need to [thing]"**
→ Add to the right section (Now by default, unless they say otherwise).
   Infer tags from context if obvious (e.g. if we're discussing a project).
   If a due date is mentioned, add !due: tag.

**"done: [description]"** or **"finished [thing]"**
→ Find the matching todo, mark it `[x]`, move it to a `## Done` section
   at the bottom with today's date.

**"bump [description]"** or **"this is urgent now"**
→ Move a task from Next/Someday up to Now.

**"drop [description]"** or **"forget about [thing]"**
→ Remove the task entirely. Don't archive it.

**"clean up todos"**
→ Review all todos. Flag anything that's been sitting in Now for 7+ days.
   Suggest moving stale items to Next or Someday.
   Remove completed items older than 2 weeks from the Done section.

**"plan today"** or **"what should I focus on"**
→ Read todo.md + today's daily note.
   Pick the top 3 tasks from Now based on deadlines and importance.
   Suggest a focus order.

## Cross-references

When adding todos that relate to a project:
- Check if projects/[name]/ exists
- If it does, mention the connection

When completing todos:
- If it's related to a project, note it in today's daily note

## Creating todo.md

If todo.md doesn't exist when the user asks for todos:
1. Create it with the template above (empty sections)
2. Ask: "Brain is clean — what's on your mind? I'll capture it."

## Behavior rules

- Never silently reorder the user's list. Ask first.
- Keep the file clean. No metadata junk, no timestamps on every line.
- Dates only appear in !due: tags and the Done section.
- If the user adds something vague ("do the thing"), ask for one clarifying sentence.
