# Self-play evaluation report

Generated 2026-09-13T16:28:35.290Z

- Runs: **54** (completed 38, game over 11, hit budget 5)
- Findings: **6** (6 critical), grouped into 6
- Deaths observed: 297 {"enemyFire":226,"bossShockwave":12,"pit":29,"hazard":30}

## Versus baseline

No regressions.

## Findings

Ordered by whether a competent player hit it, then severity, then how many runs saw it.

| Kind | Level | Near x | Severity | Runs | Policies | Evidence |
|---|---|---|---|---|---|---|
| deathTrap | 2 | 1920 | CRITICAL | 1 | doorCamper | 9 deaths in a row within 96px of x=1936 (causes: enemyFire) - respawning straight back into it |
| deathTrap | 2 | 2016 | CRITICAL | 1 | doorCamper | 4 deaths in a row within 96px of x=2058 (causes: enemyFire) - respawning straight back into it |
| deathTrap | 1 | 2784 | CRITICAL | 1 | bossHugger | 6 deaths in a row within 96px of x=2824 (causes: bossShockwave,enemyFire) - respawning straight back into it |
| deathTrap | 2 | 2304 | CRITICAL | 1 | bossHugger | 30 deaths in a row within 96px of x=2340 (causes: hazard) - respawning straight back into it |
| deathTrap | 1 | 3168 | CRITICAL | 1 | jumper | 26 deaths in a row within 96px of x=3218 (causes: enemyFire) - respawning straight back into it |
| deathTrap | 1 | 768 | CRITICAL | 1 | crouchWalker | 7 deaths in a row within 96px of x=830 (causes: pit) - respawning straight back into it |

## Runs

| Run | Ended | Steps | Furthest x | Deaths | Findings |
|---|---|---|---|---|---|
| L1-start-3lives-pilot | gameOver | 543 | 1881 | 3 | 0 |
| L1-start-30lives-pilot | results | 1508 | 3182 | 6 | 0 |
| L1-mid-3lives-pilot | results | 1196 | 3183 | 1 | 0 |
| L1-mid-30lives-pilot | results | 1196 | 3183 | 1 | 0 |
| L1-preboss-3lives-pilot | results | 1301 | 3182 | 2 | 0 |
| L1-preboss-30lives-pilot | results | 1301 | 3182 | 2 | 0 |
| L2-start-3lives-pilot | gameOver | 996 | 2960 | 3 | 0 |
| L2-start-30lives-pilot | results | 1882 | 3182 | 6 | 0 |
| L2-mid-3lives-pilot | gameOver | 607 | 2961 | 3 | 0 |
| L2-mid-30lives-pilot | results | 1824 | 3183 | 7 | 0 |
| L2-preboss-3lives-pilot | results | 735 | 3182 | 2 | 0 |
| L2-preboss-30lives-pilot | results | 735 | 3182 | 2 | 0 |
| L3-start-3lives-pilot | gameOver | 493 | 1823 | 3 | 0 |
| L3-start-30lives-pilot | results | 1355 | 3181 | 6 | 0 |
| L3-mid-3lives-pilot | gameOver | 482 | 2561 | 3 | 0 |
| L3-mid-30lives-pilot | results | 1009 | 3181 | 5 | 0 |
| L3-preboss-3lives-pilot | results | 689 | 3181 | 2 | 0 |
| L3-preboss-30lives-pilot | results | 689 | 3181 | 2 | 0 |
| L1-preboss-30lives-pilot-pulse | results | 1301 | 3182 | 2 | 0 |
| L1-preboss-30lives-pilot-scatter | results | 1351 | 3182 | 2 | 0 |
| L1-preboss-30lives-pilot-rapid | results | 852 | 3182 | 1 | 0 |
| L1-preboss-30lives-pilot-laser | results | 856 | 3182 | 1 | 0 |
| L1-preboss-30lives-pilot-flame | results | 1299 | 3182 | 2 | 0 |
| L2-preboss-30lives-pilot-pulse | results | 735 | 3182 | 2 | 0 |
| L2-preboss-30lives-pilot-scatter | results | 1422 | 3182 | 5 | 0 |
| L2-preboss-30lives-pilot-rapid | results | 715 | 3182 | 1 | 0 |
| L2-preboss-30lives-pilot-laser | results | 725 | 3182 | 2 | 0 |
| L2-preboss-30lives-pilot-flame | results | 709 | 3182 | 2 | 0 |
| L3-preboss-30lives-pilot-pulse | results | 689 | 3181 | 2 | 0 |
| L3-preboss-30lives-pilot-scatter | results | 1118 | 3181 | 3 | 0 |
| L3-preboss-30lives-pilot-rapid | results | 689 | 3181 | 2 | 0 |
| L3-preboss-30lives-pilot-laser | results | 689 | 3181 | 2 | 0 |
| L3-preboss-30lives-pilot-flame | results | 894 | 3181 | 3 | 0 |
| L2-mid-30lives-hiccup-seed1 | results | 1762 | 3183 | 7 | 0 |
| L3-preboss-30lives-hiccup-seed2 | results | 742 | 3181 | 2 | 0 |
| L1-start-30lives-hiccup-seed3 | results | 2037 | 3182 | 6 | 0 |
| L2-mid-30lives-hiccup-seed4 | results | 1762 | 3183 | 7 | 0 |
| L2-mid-30lives-doorCamper | gameOver | 4704 | 2058 | 30 | 2 |
| L1-start-30lives-edgeNudger | gameOver | 4427 | 813 | 30 | 0 |
| L1-preboss-30lives-bossHugger | results | 1697 | 3182 | 6 | 1 |
| L2-preboss-30lives-bossHugger | gameOver | 2641 | 2340 | 30 | 1 |
| L1-start-3lives-rusher | gameOver | 551 | 830 | 3 | 0 |
| L2-start-3lives-rusher | gameOver | 539 | 809 | 3 | 0 |
| L1-start-30lives-jumper | gameOver | 5928 | 3218 | 30 | 1 |
| L1-start-30lives-crouchWalker | budget | 6000 | 830 | 16 | 1 |
| L1-start-30lives-idler | budget | 6000 | 60 | 0 | 0 |
| L2-start-30lives-fuzz-seed1 | budget | 6000 | 851 | 3 | 0 |
| L3-start-30lives-fuzz-seed2 | budget | 6000 | 813 | 1 | 0 |
| L1-start-30lives-fuzz-seed3 | budget | 6000 | 813 | 2 | 0 |
| L1-start-30lives-pilot-chunk1 | results | 1508 | 3182 | 6 | 0 |
| L1-start-30lives-pilot | results | 1508 | 3182 | 6 | 0 |
| L1-start-30lives-pilot-chunk600 | results | 1508 | 3182 | 6 | 0 |
| L1-start-30lives-pilot-chain1 | results | 1508 | 3182 | 6 | 0 |
| L2-start-30lives-pilot-chain2 | results | 1882 | 3182 | 6 | 0 |
