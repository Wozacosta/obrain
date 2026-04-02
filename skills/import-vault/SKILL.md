---
name: import-vault
description: Import notes from another Obsidian vault or markdown folder into this brain. Reads the source structure, previews what will be imported, deduplicates, and files everything into the right folders. Trigger on "import vault", "merge vault", "bring in my old notes", or when a user mentions another vault.
---

# import-vault — Vault Importer

Pull notes from another Obsidian vault (or any folder of markdown files) into this brain.

## Step 1 — Locate the source

Ask:

```
Where's the vault you want to import from?

Paste the path (e.g. ~/Documents/OldVault or ~/Library/Mobile Documents/...)
```

If the user isn't sure where their vaults are, search for them:

```bash
find ~/Library/Mobile\ Documents -name ".obsidian" -type d 2>/dev/null
find ~/Documents -name ".obsidian" -type d 2>/dev/null
find ~ -maxdepth 4 -name ".obsidian" -type d 2>/dev/null
```

List any vaults found and let the user pick.

## Step 2 — Scan and preview

Read the source vault structure. Count files by type and folder.

Show a preview:

```
Found: [path]
  [X] markdown files
  [Y] PDFs / images / attachments
  [Z] folders

Top-level folders:
  daily/          [N files]
  projects/       [N files]
  random-folder/  [N files]
  ...

What to import:
  1. Everything — bring it all into drop/ and I'll sort it
  2. Pick folders — you tell me which ones
  3. Smart merge — match their folders to your brain structure
```

## Step 3 — Handle each mode

### Mode 1: Everything → drop/

Copy all .md files into drop/ with a prefix to avoid name collisions:

`drop/[source-vault-name]--[original-filename].md`

Copy attachments (images, PDFs) into drop/ too.

After copying, offer to sort:
"Everything's in drop/. Want me to read through and sort into the right folders?"

### Mode 2: Pick folders

List all top-level folders from the source. Let the user select which ones.

For each selected folder:
- If a matching folder exists in the brain (e.g. both have `projects/`), ask:
  "projects/ exists in both. Merge into yours, or import as projects-old/?"
- If no match, create it or route to drop/

### Mode 3: Smart merge

Read the source vault's structure and try to map it to the brain:

- `daily/`, `journal/`, `log/` → `daily/`
- `projects/`, `work/`, `active/` → `projects/`
- `research/`, `notes/`, `references/`, `zettelkasten/` → `refs/`
- `archive/`, `done/`, `completed/` → `done/`
- `tasks/`, `todos/` → read them, merge into `todo.md`
- `templates/` → skip (Obsidian templates don't transfer meaningfully)
- `attachments/`, `assets/`, `media/` → `drop/` (user sorts later)
- Everything else → `drop/`

Show the mapping before executing:

```
Here's how I'll map their folders to your brain:

  daily/        → daily/         (merge)
  projects/     → projects/      (merge)
  references/   → refs/           (merge)
  random-stuff/ → drop/           (sort later)
  tasks/        → todo.md        (merge into task list)

Proceed? Or tell me what to change.
```

## Step 4 — Handle conflicts

When a file with the same name exists in both vaults:

1. Read both files
2. If content is identical → skip (already there)
3. If content differs → keep both, rename the incoming one:
   `[filename]--imported-[date].md`

Never silently overwrite.

## Step 5 — Handle non-markdown files

For PDFs, images, and other attachments:
- Copy them to drop/
- Check if any .md files reference them (Obsidian `![[image.png]]` syntax)
- If referenced, update the paths in the imported .md files to point to the new location

## Step 6 — Handle Obsidian-specific syntax

When importing .md files, check for:
- `[[wikilinks]]` — keep them, they'll work in Obsidian
- `![[embeds]]` — keep them, update paths if attachments moved
- Frontmatter/YAML — keep it, it's useful metadata
- Dataview queries — keep but warn the user they need the Dataview plugin
- Tags (#tag) — keep as-is

Do NOT convert or strip Obsidian syntax. The brain is an Obsidian vault.

## Step 7 — Report

After import:

```
Imported from [source path]:
  [X] notes imported
  [Y] attachments copied
  [Z] duplicates skipped
  [N] conflicts renamed

Files landed in:
  drop/     [count]
  daily/     [count]
  projects/  [count]
  refs/      [count]

[If todo items were found:]
  Added [N] tasks to todo.md from their task files.

Want me to read through drop/ and sort the rest?
```

## Step 8 — Update memory

Add a note to memory.md:

```
## Import Log
- [date]: Imported [X] notes from [source path]
  Folders merged: [list]
  Items in inbox awaiting sort: [count]
```

## Edge cases

- **Vault is on iCloud/cloud**: Files might be in `~/Library/Mobile Documents/iCloud~md~obsidian/Documents/[vault-name]/`. Warn that evicted (cloud-only) files can't be read until downloaded.
- **Huge vault (1000+ files)**: Process in batches. Don't try to read everything at once. Copy files first, sort later.
- **Vault has plugins generating files**: Skip `.obsidian/`, `.trash/`, and any dot-folders.
- **Same vault imported twice**: Check memory.md for previous imports from the same path. Warn and offer to skip already-imported files.
