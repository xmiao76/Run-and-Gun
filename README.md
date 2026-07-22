# Operation Iron Echo - Claude Code `/loop 6h` Starter Pack

This pack supplies specifications and autonomous-agent instructions for an original browser run-and-gun game. It deliberately does not contain Contra assets, maps, code, or ROM content.

## Recommended environment

- Git
- Current Node.js LTS or a Node version supported by the chosen current Vite release
- npm
- Current Claude Code with `/loop` support
- Chromium for Playwright

## Windows quick start

```powershell
mkdir operation-iron-echo
cd operation-iron-echo
# Copy all files from this starter pack into this directory, including .claude

git init
powershell -ExecutionPolicy Bypass -File .\bootstrap.ps1
git add .
git commit -m "Add game specification and agent workflow"
claude
```

Inside Claude Code:

1. Select Auto mode only after confirming that this repository is isolated and contains no secrets.
2. Paste the contents of `FIRST_RUN_PROMPT.md` to start the first iteration immediately.
3. After the first iteration completes, run exactly:

```text
/loop 6h
```

Do not add a prompt after `6h`; a supplied prompt would override `.claude/loop.md`.

## macOS/Linux/WSL quick start

```bash
mkdir operation-iron-echo
cd operation-iron-echo
# Copy all files from this starter pack into this directory, including .claude

git init
bash ./bootstrap.sh
git add .
git commit -m "Add game specification and agent workflow"
claude
```

Then follow the same Claude Code steps above.

## Important `/loop` behavior

- `/loop 6h` uses `.claude/loop.md` because only an interval is supplied.
- It is a fixed scheduled loop, not six hours of continuous work.
- The Claude Code session must remain running and idle when the task becomes due.
- Keep the computer awake.
- Recurring `/loop` tasks expire after seven days and should be recreated if the project is still active.
- Fixed loops continue even after the project is complete, so cancel the task when the agent reports `PROJECT COMPLETE - CANCEL THE FIXED LOOP`.
- Review PROGRESS.md and `git log` regularly.

## Useful checks

```text
what scheduled tasks do I have?
cancel the Operation Iron Echo loop task
```

Pressing Esc while the loop is waiting also cancels its pending wakeup.

## Before public deployment

- Review every asset entry in ASSET_POLICY.md.
- Run the full quality gate.
- Play through both levels manually.
- Inspect the Cloudflare preview deployment.
- Confirm there are no Contra names, graphics, maps, audio, or extracted content.
