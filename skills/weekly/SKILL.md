---
name: weekly
description: End-of-week review. Reads all daily notes from the past 7 days, surfaces patterns, wins, dropped balls, and open threads. Produces a weekly digest note and helps plan the week ahead.
---

# Weekly Review

## Step 1 — Gather the week

Read all daily notes from the past 7 days (daily/YYYY-MM-DD.md).
Also scan any notes modified this week in projects/, refs/, and drop/.

## Step 2 — Produce the review

Create weekly/YYYY-Www.md (e.g. weekly/2025-W14.md) with this structure:

# Week of [Monday date] → [Friday date]

## Wins
[Things that got done, decisions that landed, progress made.
Pull from daily notes and project files. Be specific.]

## Dropped
[Stuff that was mentioned but never followed up on.
Tasks that appeared in daily notes but never got checked off.
Things promised to people that didn't happen.]

## Patterns
[Recurring themes across the week. What kept coming up?
What ate the most time? What got avoided?]

## Open Threads
[Anything still dangling that needs attention next week.
Conversations waiting for replies. Decisions not yet made.
PRs in limbo. Deadlines approaching.]

## Next Week
[Based on everything above, suggest 3-5 priorities for next week.
Order by impact, not urgency. Flag anything with a hard deadline.]

## Step 3 — Surface insights

After writing the note, tell the user:
- How many daily notes were found for the week
- The single biggest theme of the week
- Anything that showed up in daily notes more than twice but never resolved
- Ask: "Anything you want to add or change before I save this?"

## Step 4 — Update memory

Append any notable patterns to memory.md under Patterns
if they reveal something new about how the user works.
