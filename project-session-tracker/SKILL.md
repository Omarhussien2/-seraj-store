---
name: project-session-tracker
description: Create or update a project tracking Markdown file that starts with a project information table, then maintains daily session bullet updates, a tasks table, a challenges table, and a file links table. Use when Codex needs to organize project execution, track progress after each work session, log blockers and risks, or maintain project documentation links in a single structured file.
---

# Project Session Tracker

Create or update a single Markdown tracking file for one project. Keep the file practical, compact, and easy to continue in later sessions.

## Workflow

1. Identify whether the user wants a new tracking file or an update to an existing one.
2. If creating a new file, ask only for the minimum missing project details that cannot be inferred.
3. Build the file in this exact high-level order:
   1. Project information table
   2. Daily session updates in bullet points
   3. Tasks table
   4. Challenges table
   5. Files table
4. Keep labels, notes, and descriptions in Arabic unless the user clearly prefers another language.
5. After every later session, append a new bullet-based update under the daily session section and then update the relevant rows in the tables.

## File Structure

Use the template in [references/project-tracking-template.md](references/project-tracking-template.md).

Preserve this order:

1. `# Project Tracker`
2. `## Basic Info`
3. `## Daily Session Updates`
4. `## Tasks`
5. `## Challenges`
6. `## Files`

If the user already has a different title, keep it unless they ask for restructuring.

## Authoring Rules

- Use Markdown tables.
- Keep the column names exactly as defined in the template.
- Keep section helper text and descriptive notes in Arabic.
- Treat `Task` as the main task title.
- Treat `Sub_Task` as the smaller executable unit under the main task.
- Treat `Category` as the department, workstream, or section the task belongs to.
- Use stable IDs such as `PRJ-001`, `TSK-001`, `CHL-001`, and `DOC-001` unless the user already follows another pattern.
- Use ISO dates in the tables when possible: `YYYY-MM-DD`.
- Leave unknown values as `TBD` instead of inventing them.

## Daily Session Update Rules

When updating after a session:

1. Add a dated bullet block under `## Daily Session Updates`.
2. Summarize what was completed, what changed, and what remains.
3. Keep bullets concise and action-oriented.
4. If a blocker appeared, also add or update a row in the challenges table.
5. If a file or link was created or used, add it to the files table.
6. If progress changed, update `Quantity_Done`, `Status`, dates, owner, or cost fields in the tasks table as needed.

Use a pattern like:

```markdown
### 2026-04-29
- تم تنفيذ ...
- تم تحديث ...
- المتبقي في الجلسة القادمة ...
```

## Update Strategy

When editing an existing tracker:

- Do not rewrite the whole file if a targeted update is enough.
- Preserve existing IDs and historical bullets.
- Normalize obvious inconsistencies only when it improves clarity.
- If a task is finished, update its `Status` clearly, such as `Done` or the user's preferred Arabic equivalent.
- If a challenge is solved, keep the row and update the status and resolution plan rather than deleting it.

## Missing Data

If key project metadata is missing during creation, ask for only the missing essentials:

- `Project_ID`
- `Name`
- `Manager`
- `Project_Path` if the file should reference a local workspace

If the user does not provide the rest, initialize them as `TBD`.
