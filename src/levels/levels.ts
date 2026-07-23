import { type LevelDef } from './levelSchema';
import { LEVEL_1 } from './level1';
import { LEVEL_2 } from './level2';

/** Ordered list of playable levels; the index drives level sequencing. */
export const LEVELS: readonly LevelDef[] = [LEVEL_1, LEVEL_2];
