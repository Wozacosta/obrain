---
name: digest
description: Reads files from any folder — PDFs, docs, images, code, text — and produces clean markdown summaries. No external tools needed. Trigger on "digest", "summarize folder", "read these files", "scan", or when a folder of documents needs processing.
---

# digest — Read and Summarize Files

Claude reads every file in a folder and produces a markdown note per file.

## Step 1: Where?

Ask:

```
What should I read?
1. drop/ (the incoming folder)
2. A different folder (give me the path)
```

## Step 2: Process

For each file:
- Read it directly (PDFs, images, text, code — Claude handles all of these)
- Pull out what matters
- Write a markdown note:

```markdown
---
from: [original filename]
date: [today]
tags: [relevant tags]
---

# [Descriptive title]

## What's In Here
[3-7 bullets covering the substance]

## Context
[1-2 sentences — what is this thing and why does it exist]

## Keep
[Anything worth preserving verbatim — numbers, quotes, specifics]
```

Save as `[original-name].md` alongside the originals,
or in drop/ if reading from an external path.

## Step 3: Summarize

After processing, tell the user:
- How many files read
- Anything that couldn't be processed
- Offer: "Want me to file these into the right folders?"
