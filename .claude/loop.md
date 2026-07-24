Read `CLAUDE.md`, `PROJECT.md`, `TASKS.md`, and `PROGRESS.md`.

Execute exactly one bounded development iteration:

1. If a task is `IN_PROGRESS`, continue that task.
2. Otherwise, select the first `TODO` task in `TASKS.md`.
3. If there is no `IN_PROGRESS` or `TODO` task, report `IDLE - NO READY WORK` and make no code changes.
4. Confirm the selected task has clear acceptance criteria. If not, mark it `BLOCKED` and explain what information is missing.
5. Inspect the relevant code and implement the smallest coherent change that advances or completes the task.
6. Add or update tests when behavior changes.
7. Run the relevant verification commands from `PROJECT.md`.
8. If verification passes and all acceptance criteria are met, mark the task `DONE`.
9. If work remains, keep it `IN_PROGRESS`.
10. If a genuine blocker remains after reasonable investigation, mark it `BLOCKED`.
11. Append a concise evidence-based entry to `PROGRESS.md`.

Do not create new requirements, start a second task, push, deploy, access credentials, or perform unrelated refactoring.
