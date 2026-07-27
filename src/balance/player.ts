/**
 * Player physics and life-count balance values.
 *
 * All values are in logical pixels and seconds so the simulation stays
 * deterministic and frame-rate independent. Tune here, not in scene code.
 */

export const PLAYER_WIDTH = 22;
export const PLAYER_HEIGHT = 32;

/**
 * Horizontal speed when a direction is held (px/s).
 *
 * Arcade-feel pass: raised from 190 so traversal feels brisk rather than
 * deliberate, while staying slow enough to react to a telegraphed shot.
 */
export const MOVE_SPEED = 215;

/**
 * Downward acceleration while airborne (px/s^2).
 *
 * Raised together with JUMP_VELOCITY so the jump gets snappier without changing
 * its height: peak height is v^2/(2g), and 560^2/(2*1750) = 89.6px matches the
 * previous 520^2/(2*1500) = 90.1px. Airtime drops from 0.69s to 0.64s, so the
 * jump feels punchier while every platform stays exactly as reachable.
 */
export const GRAVITY = 1750;

/** Initial upward velocity on jump (px/s; negative is up). See GRAVITY. */
export const JUMP_VELOCITY = -560;

/**
 * Fraction of upward velocity retained when the jump button is released early,
 * producing variable jump height.
 */
export const JUMP_CUT_MULTIPLIER = 0.4;

/** Maximum downward fall speed (px/s) to bound tunneling. */
export const MAX_FALL_SPEED = 900;

/** Top surface y of the ground platform in the M1 sandbox arena. */
export const GROUND_Y = 480;

/** Inclusive [x0, x1) horizontal gap in the ground used as a lethal pit. */
export const PIT_X0 = 720;
export const PIT_X1 = 960;

/** Player spawn / checkpoint position. */
export const SPAWN_X = 80;
export const SPAWN_Y = GROUND_Y - PLAYER_HEIGHT;

/** y below which an unsupported player is considered lost to the pit. */
export const DEATH_FALL_Y = 700;

/** Lives granted at the start of a run. */
export const MAX_LIVES = 3;

/** Duration of post-respawn invulnerability (s). */
export const INVULN_DURATION = 1.5;

/** Player collision height while crouching (px; feet stay planted). */
export const CROUCH_HEIGHT = 20;

/** How long a one-way platform stays passable after pressing drop (s). */
export const DROP_THROUGH_DURATION = 0.22;

/** M1 sandbox arena logical bounds. */
export const ARENA_WIDTH = 960;
export const ARENA_HEIGHT = 540;
