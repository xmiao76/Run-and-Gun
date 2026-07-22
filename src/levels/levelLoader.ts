import { type LevelDef, type LevelValidationIssue, type Rect } from './levelSchema';

export type { LevelDef } from './levelSchema';

/**
 * Validates a level definition and throws an actionable error when it is
 * malformed, so bad data fails fast during development (ARCHITECTURE.md
 * section 6).
 */

function rectValid(r: Rect): boolean {
  return Number.isFinite(r.x) && Number.isFinite(r.y) && r.width > 0 && r.height > 0;
}

function inBounds(r: Rect, level: LevelDef): boolean {
  return r.x >= 0 && r.y >= 0 && r.x + r.width <= level.width && r.y + r.height <= level.height;
}

export function validateLevel(level: LevelDef): LevelValidationIssue[] {
  const issues: LevelValidationIssue[] = [];
  if (!(level.width > 0) || !(level.height > 0)) {
    issues.push({ path: 'level', message: 'width and height must be positive' });
  }
  if (!level.id) {
    issues.push({ path: 'level.id', message: 'level id is required' });
  }
  if (!rectValid({ x: level.spawn.x, y: level.spawn.y, width: 1, height: 1 }) || !inBounds({ x: level.spawn.x, y: level.spawn.y, width: 1, height: 1 }, level)) {
    issues.push({ path: 'level.spawn', message: 'spawn must be a finite point inside the level bounds' });
  }
  if (level.checkpoints.length < 2) {
    issues.push({ path: 'level.checkpoints', message: 'a level must define at least two checkpoints (including the start)' });
  }
  const checkpointIds = new Set<string>();
  level.checkpoints.forEach((c, i) => {
    if (!c.id || checkpointIds.has(c.id)) {
      issues.push({ path: `level.checkpoints[${i}].id`, message: 'checkpoint ids must be non-empty and unique' });
    }
    checkpointIds.add(c.id);
  });
  level.solids.forEach((r, i) => {
    if (!rectValid(r)) {
      issues.push({ path: `level.solids[${i}]`, message: 'solid rect must have positive finite size' });
    }
  });
  level.oneWays.forEach((r, i) => {
    if (!rectValid(r)) {
      issues.push({ path: `level.oneWays[${i}]`, message: 'one-way rect must have positive finite size' });
    }
  });
  if (!(level.completionX > 0) || level.completionX > level.width) {
    issues.push({ path: 'level.completionX', message: 'completionX must be within (0, width]' });
  }
  if (!level.boss || !level.boss.id) {
    issues.push({ path: 'level.boss', message: 'a boss arena is required' });
  }
  return issues;
}

/** Validates and returns the level, or throws with a readable summary. */
export function loadLevel(level: LevelDef): LevelDef {
  const issues = validateLevel(level);
  if (issues.length > 0) {
    const detail = issues.map((i) => `${i.path}: ${i.message}`).join('; ');
    throw new Error(`Invalid level "${level.id}": ${detail}`);
  }
  return level;
}
