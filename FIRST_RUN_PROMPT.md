# FIRST_RUN_PROMPT.md

Read the following files before making changes:

- CLAUDE.md
- PROJECT.md
- TASKS.md
- PROGRESS.md
- .claude/loop.md

Then do the following:

1. Confirm that you understand this is NOT an abstract block-based prototype.
2. Confirm that the project goal is to build a visually recognizable browser game inspired by Contra-like run-and-gun gameplay, using original assets and presentation.
3. Inspect the repository and identify what already exists.
4. If required setup files are missing, create them.
5. Start with the earliest unfinished task in `TASKS.md`.
6. For this first run, work on exactly one bounded iteration and do not attempt the entire game.
7. Prefer beginning with `TASK-001`.
8. When implementing `TASK-001`, make sure the initial playable scene already includes:
   - a recognizable player character sprite or sprite-based placeholder with clear human silhouette
   - environment art or tile-based scenery
   - a title screen
   - a tiny playable prototype room or scene
   - no pure rectangle-only presentation for the main gameplay view
9. Create or update tests as needed.
10. Run the relevant verification commands.
11. Update `TASKS.md` status fields appropriately.
12. Append a progress entry to `PROGRESS.md`.
13. If verification succeeds, create a local git commit.
14. Do not push to a remote repository.
15. Do not deploy to Cloudflare.
16. Do not use copyrighted Contra assets, names, sprites, or music.

Important visual guidance:

- The gameplay should look like a real game prototype.
- It must show actual character and environment representation.
- Avoid finishing a task if the result is still only colored rectangles or abstract placeholder blocks.

At the end of this iteration, provide:
- what task you worked on
- what files you changed
- what commands you ran
- whether the task remains IN_PROGRESS or is now DONE
- what the next recommended task is