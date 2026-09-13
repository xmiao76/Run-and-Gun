Read `CLAUDE.md`, `PROJECT.md`, `TASKS.md`, and `PROGRESS.md`.

This is the PRODUCER iteration. `.claude/loop.md` consumes tasks and stops with
`IDLE - NO READY WORK` when none remain; this one finds work by playing the game
and measuring what happens.

Execute exactly one bounded producer iteration:

1. Start a target to play against: `npm run preview -- --port 4173 --strictPort`
   (or set `TARGET_URL` to the deployed site).
2. Run `npm run eval -- --baseline`.
   - If it reports REGRESSIONS, stop and report them. A regression means
     something that used to work no longer does, and that outranks any new
     finding.
   - Exit code 0 with standing findings is normal: the game carries known
     findings that chaos policies produce in places a real player never visits.
3. Run `node scripts/eval/proposeTasks.mjs`. It writes
   `docs/eval/proposed-tasks.md` and does NOT modify `TASKS.md`.
4. Read every proposal and judge it. A finding is evidence that something looked
   wrong, not a decision that it must be fixed. For each one decide:
   - **Real and worth fixing** - copy the block into the *Future enhancements*
     section of `TASKS.md`, renumbering to the next free id if the file moved on.
     Keep the `Source:` line: it is what stops the same finding being proposed
     again.
   - **Real but intended** - do not add a task. Record the decision in
     `PROGRESS.md` so the next iteration does not re-litigate it.
   - **A detector problem** - the finding is noise. Fix or narrow the detector in
     `scripts/eval/checks.mjs` and pin the false positive in
     `tests/unit/evalChecks.test.ts`. A detector that cries wolf gets muted and
     then finds nothing, so this is real work, not a workaround.
5. Rank what you added. A finding a competent policy (`pilot`, `hiccup`) hit is
   something a real player hits; one only `fuzz` or a scripted chaos policy hit
   may not be reachable deliberately. Put the former first: file order is
   priority, and the consumer loop takes the first `TODO`.
6. Append a concise evidence-based entry to `PROGRESS.md`: what was run, what was
   proposed, what you accepted, and - importantly - what you rejected and why.
7. Hand off. The next `.claude/loop.md` iteration will pick up the first `TODO`.

Do not implement any proposal in this iteration. Do not edit source files, push,
deploy, or access credentials. Proposing and fixing in one pass is how an
unreviewed detector becomes an unreviewed code change.

If `npm run eval` reports no new findings and no regressions, say
`IDLE - NO NEW FINDINGS` and make no changes. That is a good outcome, not a
failure: it means the game survived everything the harness currently knows how
to throw at it. If that happens repeatedly, the useful next move is a new
variation axis or a new invariant in `scripts/eval/`, not a longer run of the
same matrix.
