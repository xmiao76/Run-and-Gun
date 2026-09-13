# Self-play evaluation report

Generated 2026-09-13T05:12:13.006Z

- Runs: **39** (completed 25, game over 8, hit budget 6)
- Findings: **4** (4 critical), grouped into 4
- Deaths observed: 240 {"enemyFire":179,"pit":29,"bossShockwave":2,"hazard":30}

## Versus baseline

No regressions.

## Findings

Ordered by whether a competent player hit it, then severity, then how many runs saw it.

| Kind | Level | Near x | Severity | Runs | Policies | Evidence |
|---|---|---|---|---|---|---|
| deathTrap | 2 | 1920 | CRITICAL | 1 | doorCamper | 9 deaths in a row within 96px of x=1936 (causes: enemyFire) - respawning straight back into it |
| deathTrap | 2 | 2304 | CRITICAL | 1 | bossHugger | 30 deaths in a row within 96px of x=2340 (causes: hazard) - respawning straight back into it |
| deathTrap | 1 | 3168 | CRITICAL | 1 | jumper | 25 deaths in a row within 96px of x=3218 (causes: enemyFire) - respawning straight back into it |
| deathTrap | 1 | 768 | CRITICAL | 1 | crouchWalker | 9 deaths in a row within 96px of x=830 (causes: pit) - respawning straight back into it |

## Runs

| Run | Ended | Steps | Furthest x | Deaths | Findings |
|---|---|---|---|---|---|
| L1-start-3lives-pilot | gameOver | 543 | 1881 | 3 | 0 |
| L1-start-30lives-pilot | results | 1438 | 3182 | 4 | 0 |
| L1-mid-3lives-pilot | results | 1132 | 3183 | 1 | 0 |
| L1-mid-30lives-pilot | results | 1132 | 3183 | 1 | 0 |
| L1-preboss-3lives-pilot | results | 1281 | 3182 | 2 | 0 |
| L1-preboss-30lives-pilot | results | 1281 | 3182 | 2 | 0 |
| L2-start-3lives-pilot | gameOver | 1096 | 2960 | 3 | 0 |
| L2-start-30lives-pilot | results | 1882 | 3182 | 5 | 0 |
| L2-mid-3lives-pilot | gameOver | 707 | 2961 | 3 | 0 |
| L2-mid-30lives-pilot | results | 1710 | 3183 | 6 | 0 |
| L2-preboss-3lives-pilot | results | 717 | 3182 | 2 | 0 |
| L2-preboss-30lives-pilot | results | 717 | 3182 | 2 | 0 |
| L1-preboss-30lives-pilot-pulse | results | 1281 | 3182 | 2 | 0 |
| L1-preboss-30lives-pilot-scatter | results | 1325 | 3182 | 2 | 0 |
| L1-preboss-30lives-pilot-rapid | results | 788 | 3182 | 1 | 0 |
| L2-preboss-30lives-pilot-pulse | results | 717 | 3182 | 2 | 0 |
| L2-preboss-30lives-pilot-scatter | results | 1333 | 3182 | 4 | 0 |
| L2-preboss-30lives-pilot-rapid | results | 564 | 3182 | 1 | 0 |
| L2-mid-30lives-hiccup-seed1 | results | 2570 | 3183 | 10 | 0 |
| L1-preboss-30lives-hiccup-seed2 | results | 1281 | 3182 | 2 | 0 |
| L2-start-30lives-hiccup-seed3 | results | 2834 | 3180 | 8 | 0 |
| L1-mid-30lives-hiccup-seed4 | results | 1192 | 3183 | 1 | 0 |
| L2-mid-30lives-doorCamper | gameOver | 5019 | 2058 | 30 | 1 |
| L1-start-30lives-edgeNudger | gameOver | 4356 | 827 | 30 | 0 |
| L1-preboss-30lives-bossHugger | results | 1175 | 3182 | 4 | 0 |
| L2-preboss-30lives-bossHugger | gameOver | 2461 | 2340 | 30 | 1 |
| L1-start-3lives-rusher | gameOver | 539 | 830 | 3 | 0 |
| L2-start-3lives-rusher | gameOver | 527 | 809 | 3 | 0 |
| L1-start-30lives-jumper | budget | 6000 | 3218 | 29 | 1 |
| L1-start-30lives-crouchWalker | budget | 6000 | 830 | 15 | 1 |
| L1-start-30lives-idler | budget | 6000 | 60 | 0 | 0 |
| L2-start-30lives-fuzz-seed1 | budget | 6000 | 851 | 3 | 0 |
| L1-start-30lives-fuzz-seed2 | budget | 6000 | 813 | 2 | 0 |
| L2-start-30lives-fuzz-seed3 | budget | 6000 | 851 | 3 | 0 |
| L1-start-30lives-pilot-chunk1 | results | 1438 | 3182 | 4 | 0 |
| L1-start-30lives-pilot | results | 1438 | 3182 | 4 | 0 |
| L1-start-30lives-pilot-chunk600 | results | 1438 | 3182 | 4 | 0 |
| L1-start-30lives-pilot-chain1 | results | 1438 | 3182 | 4 | 0 |
| L2-start-30lives-pilot-chain2 | results | 1882 | 3182 | 5 | 0 |
