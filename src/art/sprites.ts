/**
 * Original sprite sheet for Operation Iron Echo, authored as pixel maps.
 *
 * Every texture in the game starts life here as hand-authored, original pixel
 * art (no external or copyrighted assets). Pure data + tiny pure helpers only;
 * the Phaser-side compilation lives in textures.ts. Art direction: dusk-lit
 * jungle war zone, chunky 1px-detail sprites with readable silhouettes.
 */

import type { PixelArtSpec } from './pixelArt';

/* ------------------------------------------------------------------ */
/* Player: jungle commando, facing right. 22x32 to match the hitbox.  */
/* ------------------------------------------------------------------ */

const PLAYER_PALETTE = {
  h: '#3d8549', // helmet shade
  H: '#58b368', // helmet light
  r: '#c84a34', // headband
  s: '#e8b06f', // skin
  S: '#b08a4a', // skin shade
  v: '#1c2733', // eyes / visor
  a: '#58b368', // armor
  A: '#3d8549', // armor shade
  b: '#1d3a2a', // belt
  l: '#2c543a', // fatigues
  L: '#6a8a4a', // fatigues light
  k: '#1d3a2a', // boots
  g: '#31383f', // rifle body
  G: '#9aa7b4' // rifle barrel
} as const;

/** Head shared by every upright player pose (rows 0-8). */
const PLAYER_HEAD: readonly string[] = [
  '        hhhhhh',
  '       hHHHHHHh',
  '      hHHHHHHHHh',
  '      hhhhhhhhhh',
  '      rrrrrrrrrr',
  '      ssssssssss',
  '      ssssvvssss',
  '      SSSSSSSSSS',
  '       SSSSSSSS'
];

/** Torso with rifle held level, shared by idle/run/jump (rows 9-16). */
const PLAYER_TORSO: readonly string[] = [
  '     aaaaaaaaaaaa',
  '    aaAAAAAAAAAAa',
  '    aAAAAAAAAAAAaa',
  '    aAAAAAAAAAggggGGGG',
  '    aAAAAAAAAAAs g',
  '    aAAAAAAAAAAa',
  '    bbbbbbbbbbbb',
  '    llllllllllll'
];

/** Head, torso, and rifle are shared by every player pose (rows 0-16). */
const PLAYER_BODY: readonly string[] = [...PLAYER_HEAD, ...PLAYER_TORSO];

const PLAYER_IDLE_LEGS: readonly string[] = [
  '     lLLLl  lLLLl',
  '     lLLLl  lLLLl',
  '     lLLLl  lLLLl',
  '     lLLLl  lLLLl',
  '     lLLLl  lLLLl',
  '     lLLLl  lLLLl',
  '     lLLLl  lLLLl',
  '     lLLLl  lLLLl',
  '     kkkkk  kkkkk',
  '     kkkkk  kkkkk',
  '    kkkkkk  kkkkkk',
  '    kkkkkk  kkkkkk',
  '    kkkkkk  kkkkkk',
  '    kkkkkk  kkkkkk',
  '    kkkkkk  kkkkkk'
];

const PLAYER_RUN_A_LEGS: readonly string[] = [
  '      lLLLl',
  '     lLLLl',
  '     lLLLl',
  '    lLLLl',
  '    lLLLl',
  '   lLLLl',
  '   kkkkk',
  '   kkkkk',
  '  kkkkk',
  '',
  '          lLLLl',
  '           lLLLl',
  '           lLLLl',
  '            kkkkk',
  '            kkkkk'
];

const PLAYER_RUN_B_LEGS: readonly string[] = [
  '          lLLLl',
  '          lLLLl',
  '          lLLLl',
  '           lLLLl',
  '           lLLLl',
  '           lLLLl',
  '            kkkkk',
  '            kkkkk',
  '             kkkkk',
  '',
  '     lLLLl',
  '    lLLLl',
  '    lLLLl',
  '    kkkkk',
  '    kkkkk'
];

const PLAYER_RUN_C_LEGS: readonly string[] = [
  '      lLLLl',
  '      lLLLl',
  '      lLLLl',
  '      lLLLl',
  '       lLLLl',
  '       lLLLl',
  '       kkkkk',
  '        kkkkk',
  '        kkkkk',
  '',
  '    lLLLl',
  '    lLLLl',
  '     lLLLl',
  '     kkkkk',
  '     kkkkk'
];

const PLAYER_RUN_D_LEGS: readonly string[] = [
  '    lLLLl',
  '    lLLLl',
  '    lLLLl',
  '     lLLLl',
  '     lLLLl',
  '      lLLLl',
  '      kkkkk',
  '       kkkkk',
  '       kkkkk',
  '',
  '         lLLLl',
  '        lLLLl',
  '        lLLLl',
  '        kkkkk',
  '        kkkkk'
];

const PLAYER_JUMP_LEGS: readonly string[] = [
  '     lLLLllLLLl',
  '     lLLLllLLLl',
  '     lLLLllLLLl',
  '     kkkk  kkkk',
  '    kkkk    kkkk'
];

export const PLAYER_IDLE: PixelArtSpec = { palette: PLAYER_PALETTE, rows: [...PLAYER_BODY, ...PLAYER_IDLE_LEGS] };
export const PLAYER_RUN_A: PixelArtSpec = { palette: PLAYER_PALETTE, rows: [...PLAYER_BODY, ...PLAYER_RUN_A_LEGS] };
export const PLAYER_RUN_B: PixelArtSpec = { palette: PLAYER_PALETTE, rows: [...PLAYER_BODY, ...PLAYER_RUN_B_LEGS] };
export const PLAYER_RUN_C: PixelArtSpec = { palette: PLAYER_PALETTE, rows: [...PLAYER_BODY, ...PLAYER_RUN_C_LEGS] };
export const PLAYER_RUN_D: PixelArtSpec = { palette: PLAYER_PALETTE, rows: [...PLAYER_BODY, ...PLAYER_RUN_D_LEGS] };
export const PLAYER_JUMP: PixelArtSpec = { palette: PLAYER_PALETTE, rows: [...PLAYER_BODY, ...PLAYER_JUMP_LEGS] };

/** Crouched commando: knee up, rifle level. 22x20 to match the crouch hitbox. */
export const PLAYER_CROUCH: PixelArtSpec = {
  palette: PLAYER_PALETTE,
  rows: [
    '      hhhhhh',
    '     hHHHHHHh',
    '     hhhhhhhhhh',
    '     rrrrrrrrrr',
    '     ssssvvssss',
    '     SSSSSSSSSS',
    '    aaaaaaaaaaaa',
    '   aaAAAAAAAAAAaa',
    '   aAAAAAAAAAAggggGGGG',
    '   aAAAAAAAAAAs g',
    '   bbbbbbbbbbbb',
    '    llllllll',
    '   lLLLLLLLl',
    '   lLLLl    llll',
    '   kkkk    lLLLl',
    '   kkkk    lLLLl',
    '  kkkkk     kkkkk',
    '  kkkkk     kkkkk',
    '  kkkkk     kkkkk',
    '  kkkkk     kkkkk'
  ]
};

/** Torso with the rifle raised vertical (rows 0-16 include muzzle above head). */
const PLAYER_AIM_UP_BODY: readonly string[] = [
  '        hhhhhh   GG',
  '       hHHHHHHh  GG',
  '      hHHHHHHHHh gg',
  '      hhhhhhhhhh gg',
  '      rrrrrrrrrr gg',
  '      ssssssssss gg',
  '      ssssvvssss gg',
  '      SSSSSSSSSS gg',
  '       SSSSSSSS  gg',
  '     aaaaaaaaaaas g',
  '    aaAAAAAAAAAAs g',
  '    aAAAAAAAAAAAs g',
  '    aAAAAAAAAAAas g',
  '    aAAAAAAAAAAa  g',
  '    aAAAAAAAAAAa',
  '    bbbbbbbbbbbb',
  '    llllllllllll'
];

/** Torso with the rifle angled 45 degrees up-forward (rows 0-16). */
const PLAYER_AIM_DIAG_BODY: readonly string[] = [
  '        hhhhhh',
  '       hHHHHHHh',
  '      hHHHHHHHHh    GG',
  '      hhhhhhhhhh   Gg',
  '      rrrrrrrrrr  gg',
  '      ssssssssss gg',
  '      ssssvvssssgg',
  '      SSSSSSSS gg',
  '       SSSSSSSgg',
  '     aaaaaaaaggssaa',
  '    aaAAAAAAggssAAAa',
  '    aAAAAAAAAAAAAAaa',
  '    aAAAAAAAAAAa',
  '    aAAAAAAAAAAa',
  '    aAAAAAAAAAAa',
  '    bbbbbbbbbbbb',
  '    llllllllllll'
];

export const PLAYER_AIM_UP: PixelArtSpec = { palette: PLAYER_PALETTE, rows: [...PLAYER_AIM_UP_BODY, ...PLAYER_IDLE_LEGS] };
export const PLAYER_AIM_DIAG: PixelArtSpec = { palette: PLAYER_PALETTE, rows: [...PLAYER_AIM_DIAG_BODY, ...PLAYER_IDLE_LEGS] };

/** Hurt flinch: head snapped back, arms flung, rifle slipping. */
const PLAYER_HURT_BODY: readonly string[] = [
  '    hhhhhh',
  '   hHHHHHHh',
  '  hHHHHHHHHh',
  '  hhhhhhhhhh',
  '  rrrrrrrrrr',
  '  ssssssssss',
  '  svvsssssss',
  '  SSSSSSSSSS',
  '   SSSSSSSS',
  ' s aaaaaaaaaa',
  ' s aaAAAAAAAAaa',
  's  aAAAAAAAAAAa',
  's  aAAAAAAAAAAa',
  '   aAAAAAAAAAAa g',
  '   aAAAAAAAAAAa  gg',
  '   bbbbbbbbbbbb     gg',
  '    lllllllllll'
];

export const PLAYER_HURT: PixelArtSpec = { palette: PLAYER_PALETTE, rows: [...PLAYER_HURT_BODY, ...PLAYER_RUN_A_LEGS] };

/** Death: knocked flat on the back, rifle dropped. 32x16, feet-anchored. */
export const PLAYER_DEATH: PixelArtSpec = {
  palette: PLAYER_PALETTE,
  rows: [
    '',
    '',
    '',
    '   hhhhhh',
    '  hHHHHHHh',
    '  hrrrrrrh',
    '  hssssssh    aaaaaaaaa',
    '   ssssss   aAAAAAAAAAA      ggg',
    '   SSSSSS  aAAAAAAAAAAAAA   gg',
    '           bbbbbbbbbbbbbbb gg',
    '    gg    lllllllllllllllll',
    '      gg  lLLLLLLLLl  lLLLLLl',
    '           lLLLLLLLl   lLLLLl',
    '           kkkkkkkkk   kkkkkk',
    '           kkkkkkkk    kkkkkk',
    '           kkkkkkk     kkkkkk'
  ]
};

/* ------------------------------------------------------------------ */
/* Enemies.                                                            */
/* ------------------------------------------------------------------ */

/** Runner: visored shock trooper in crimson, mid-charge, facing left. */
export const ENEMY_RUNNER: PixelArtSpec = {
  palette: {
    w: '#7a2a20', // armor shade
    W: '#c84a34', // armor
    o: '#ffd23f', // visor
    k: '#413325' // boots / joints
  },
  rows: [
    '       wwwwww',
    '      wWWWWWWw',
    '     wWWWWWWWWw',
    '     wooooooooow',
    '     wooooooooow',
    '     wwwwwwwwww',
    '      wwwwwwww',
    '    WWwWWWWWWwWW',
    '   WWwWWWWWWWWwWW',
    '   WkwWWWWWWWWwkW',
    '   kkwWWwwWWwwWkk',
    '     wWWWWWWWWw',
    '     wWWWWWWWWw',
    '     wwwwwwwwww',
    '      wwWWWWww',
    '     wwWWWWwwww',
    '    wwWWww  wwWWww',
    '    wWWw      wWWw',
    '    wWWw      wWWw',
    '   wWWw        wWWw',
    '   kkkk        kkkk',
    '   kkkk        kkkk',
    '  kkkkk        kkkkk',
    '  kkkkk         kkkk',
    '  kkkk          kkkk',
    ' kkkkk          kkkkk',
    ' kkkk           kkkk',
    ' kkkk           kkkk',
    ' kkkk           kkkk',
    ' kkkk           kkkk'
  ]
};

/** Sentry: armored gun turret on a bolted base, barrel aimed left. */
export const ENEMY_SENTRY: PixelArtSpec = {
  palette: {
    m: '#4c5560', // metal shade
    M: '#68727f', // metal
    w: '#7a2a20', // dome shade
    W: '#c84a34', // dome
    o: '#ffd23f', // optic
    g: '#31383f', // barrel
    G: '#9aa7b4' // muzzle
  },
  rows: [
    '            wwwwww',
    '          wwWWWWWWww',
    '         wWWWWWWWWWWw',
    '         wWoWWWWWWWWw',
    '   ggg   wWoWWWWWWWWw',
    'gggGGGg  wWWWWWWWWWWw',
    'gggGGGg   wWWWWWWWWw',
    '   ggg     wwWWWWww',
    '            mMMMMm',
    '            mMMMMm',
    '            mMMMMm',
    '            mMMMMm',
    '            mMMMMm',
    '            mMMMMm',
    '          mmMMMMMMmm',
    '        mmMMMMMMMMMMmm',
    '      mmMMMMMMMMMMMMMMmm',
    '     mMMMMMMMMMMMMMMMMm',
    '    mMMmMMMMMMMMMMMMmMMm',
    '    mMmMMMMMMMMMMMMMMmMm',
    '    mMMMMMMMMMMMMMMMMMMm',
    '    mMMMMMMMMMMMMMMMMMMm',
    '    mmmmmmmmmmmmmmmmmmmm',
    '    mmmmmmmmmmmmmmmmmmmm'
  ]
};

/** Grenadier: bulky ordnance trooper with a bandolier and arm cannon, facing left. */
export const ENEMY_GRENADIER: PixelArtSpec = {
  palette: {
    p: '#4a2a52', // armor shade
    P: '#7a4a8a', // armor
    o: '#ffd23f', // visor
    g: '#31383f', // cannon
    G: '#9aa7b4', // muzzle
    n: '#6a8a4a', // grenade rounds
    k: '#1c2733', // boots
    l: '#4a2a52', // fatigues
    L: '#7a4a8a' // fatigues light
  },
  rows: [
    '        pppppp',
    '       pPPPPPPp',
    '      pPPPPPPPPp',
    '      pooooooop',
    '      pppppppppp',
    '       pppppppp',
    '    PPppppppppPP',
    '   PpPPPPPPPPPPpP',
    '   PpPnPnPnPnPPpP',
    '  ggPpPnPnPnPnPpP',
    ' gGGpPPPPPPPPPPpP',
    ' gGGpPPppPPppPPpP',
    '  ggPPPPPPPPPPPp',
    '   PpPPPPPPPPPp',
    '   pppppppppppp',
    '    llllllllll',
    '    lLLLLllLLl',
    '   lLLLLl  lLLLl',
    '   lLLLl   lLLLl',
    '   lLLLl   lLLLl',
    '   kkkkk    kkkk',
    '   kkkkk    kkkk',
    '   kkkkk    kkkk',
    '  kkkkkk    kkkkk',
    '  kkkkkk    kkkkk',
    '  kkkkkk    kkkkk',
    '  kkkkkk    kkkkk',
    '  kkkkkk    kkkkk',
    '  kkkkkk    kkkkk',
    '  kkkkkk    kkkkk'
  ]
};

/** Drone: rotor attack craft with a red optic and chin guns, facing left. */
export const ENEMY_DRONE: PixelArtSpec = {
  palette: {
    r: '#9aa7b4', // rotor
    m: '#4c5560', // hull shade
    M: '#68727f', // hull light
    o: '#ff5544', // optic
    g: '#31383f', // chin guns
    f: '#ff8a3a' // thruster
  },
  rows: [
    '         rr',
    '   rrrrrrrrrrrrr',
    '         rr',
    '       mmmmmm',
    '     mmmmmmmmmm',
    '    mmMMMMMMMMmm',
    '   mMMMMooooMMMMm',
    '   mMMMoooooMMMm',
    '   mMMMMooooMMMMm',
    '    mmMMMMMMMMmm',
    '     mmmmmmmmmm',
    '      g      g',
    '      g      g',
    '      g      g',
    '       f    f',
    '       f    f',
    '',
    ''
  ]
};

/* ------------------------------------------------------------------ */
/* Projectiles and pickups.                                            */
/* ------------------------------------------------------------------ */

/** Pulse Rifle bolt: hot core, warm trail. */
export const BULLET_PULSE: PixelArtSpec = {
  palette: { o: '#ff8a3a', y: '#ffd23f', W: '#fff6d8' },
  rows: [' oyyyyo ', 'oyWWWWyo', 'oyWWWWyo', ' oyyyyo ']
};

/** Scatter Blaster pellet: stubby orange chunk (fired in threes). */
export const BULLET_SCATTER: PixelArtSpec = {
  palette: { o: '#ff8a3a', O: '#ffc38a' },
  rows: ['  oo  ', ' oOOo ', 'oOOOOo', ' oOOo ', '  oo  ']
};

/** Rapid Carbine dart: slim cyan tracer with a hot tip. */
export const BULLET_RAPID: PixelArtSpec = {
  palette: { c: '#2a6a8a', C: '#4fc3e8', W: '#e8f1ff' },
  rows: ['   cCCWW', 'ccCCCWWWW', '   cCCWW']
};

/** Lance Laser beam: a long thin violet lance with a white-hot core. */
export const BULLET_LASER: PixelArtSpec = {
  palette: { p: '#4a2a52', P: '#7a4a8a', W: '#e8f1ff' },
  rows: ['pPPPPPPPPPPPp', 'PWWWWWWWWWWWP', 'pPPPPPPPPPPPp']
};

/** Flare Thrower ember: a fat round fireball, hottest at the centre. */
export const BULLET_FLAME: PixelArtSpec = {
  palette: { r: '#c84a34', o: '#ff8a3a', y: '#ffd23f', W: '#fff6d8' },
  rows: [
    '  rroo  ',
    ' royyor ',
    'royWWyor',
    'roWWWWor',
    'roWWWWor',
    'royWWyor',
    ' royyor ',
    '  rroo  '
  ]
};

/** Enemy plasma orb. */
export const BULLET_ENEMY: PixelArtSpec = {
  palette: { r: '#c84a34', R: '#ff5544', W: '#ffd6c8' },
  rows: [
    '  rrrr  ',
    ' rRRRRr ',
    'rRRWWRrr',
    'rRWWWWRr',
    'rRWWWWRr',
    'rRRWWRrr',
    ' rRRRRr ',
    '  rrrr  '
  ]
};

/** Supply crate for weapon pickups; the floating letter stays a Text label. */
export const PICKUP_CRATE: PixelArtSpec = {
  palette: {
    B: '#6a4e28', // frame
    w: '#b08a4a', // wood
    d: '#6a4e28', // brace shade
    m: '#9aa7b4' // corner rivets
  },
  rows: [
    'mBBBBBBBBBBBBBBBBm',
    'BwwwwwwwwwwwwwwwwB',
    'BwddwwwwwwwwwwddwB',
    'BwwddwwwwwwwwddwwB',
    'BwwwddwwwwwwddwwwB',
    'BwwwwddwwwwddwwwwB',
    'BwwwwwddwwddwwwwwB',
    'BwwwwwwddddwwwwwwB',
    'BwwwwwwddddwwwwwwB',
    'BwwwwwddwwddwwwwwB',
    'BwwwwddwwwwddwwwwB',
    'BwwwddwwwwwwddwwwB',
    'BwwddwwwwwwwwddwwB',
    'BwddwwwwwwwwwwddwB',
    'BwwwwwwwwwwwwwwwwB',
    'BwwwwwwwwwwwwwwwwB',
    'BwwwwwwwwwwwwwwwwB',
    'mBBBBBBBBBBBBBBBBm'
  ]
};

/* ------------------------------------------------------------------ */
/* Environment: tiles and props for the jungle war-zone arena.         */
/* ------------------------------------------------------------------ */

/**
 * Repeating ground tile: mossy grass cap over packed earth. 32x24, generated
 * from a deterministic speckle hash so every row is exactly 32px wide and
 * identical tiles repeat with no transparent seam.
 */
function groundRows(width: number, height: number): string[] {
  const rows: string[] = [];
  for (let y = 0; y < height; y++) {
    let row = '';
    for (let x = 0; x < width; x++) {
      if (y === 0) {
        row += x % 10 === 2 ? 'G' : ' ';
      } else if (y === 1) {
        row += x % 10 === 2 || x % 10 === 3 ? 'G' : 'g';
      } else if (y === 2) {
        row += 'g';
      } else if (y === 3) {
        row += (x * 3) % 7 === 0 ? 'd' : 'g';
      } else if ((x * 5 + y * 17) % 37 === 0) {
        row += 's';
      } else if ((x * 7 + y * 13) % 11 === 0) {
        row += 'D';
      } else {
        row += 'd';
      }
    }
    rows.push(row);
  }
  return rows;
}

export const TILE_GROUND: PixelArtSpec = {
  palette: {
    g: '#3d8549', // grass
    G: '#6a8a4a', // grass light
    d: '#413325', // dirt
    D: '#413325', // dirt shade
    s: '#6a4e28' // stone
  },
  rows: groundRows(32, 24)
};

/** Sparse star field tile for the night sky, hand-placed in a 64x64 tile. */
const STAR_DIMS: readonly (readonly [number, number])[] = [
  [11, 7], [47, 16], [23, 44], [59, 37]
];
const STAR_BRIGHT: readonly (readonly [number, number])[] = [[33, 26]];

function starRows(size: number): string[] {
  const rows: string[] = [];
  for (let y = 0; y < size; y++) {
    let row = '';
    for (let x = 0; x < size; x++) {
      const bright = STAR_BRIGHT.some(([sx, sy]) => sx === x && sy === y);
      const dim = STAR_DIMS.some(([sx, sy]) => sx === x && sy === y);
      row += bright ? 'W' : dim ? 'w' : ' ';
    }
    rows.push(row);
  }
  return rows;
}

export const BG_STARS: PixelArtSpec = {
  palette: { w: '#8ea6c9', W: '#e8f1ff' },
  rows: starRows(64)
};

/** Hazard stripe strip used to mark the lethal pit rim. 16x8. */
export const TILE_HAZARD: PixelArtSpec = {
  palette: { y: '#ffd23f', k: '#1c2733' },
  rows: [
    'yyyykkkkyyyykkkk',
    'yyykkkkyyyykkkky',
    'yykkkkyyyykkkkyy',
    'ykkkkyyyykkkkyyy',
    'kkkkyyyykkkkyyyy',
    'kkkyyyykkkkyyyyk',
    'kkyyyykkkkyyyykk',
    'kyyyykkkkyyyykkk'
  ]
};

/** One-way platform tile: wooden planks with metal edge brackets. 24x12. */
export const TILE_ONEWAY: PixelArtSpec = {
  palette: {
    w: '#6a4e28', // plank
    W: '#b08a4a', // plank light
    d: '#6a4e28', // plank shade
    m: '#68727f' // brackets
  },
  rows: [
    'mwwwwwwwwwwwwwwwwwwwwm',
    'mWWWwWWWWwWWWWwWWWWwWm',
    'mwwwdwwwdwwwdwwwdwwwdm',
    'mwwwwwwwwwwwwwwwwwwwwm',
    'mWWWwWWWWwWWWWwWWWWwWm',
    'mwwwdwwwdwwwdwwwdwwwdm',
    'mwwwwwwwwwwwwwwwwwwwwm',
    'mWWWwWWWWwWWWWwWWWWwWm',
    'mwwwdwwwdwwwdwwwdwwwdm',
    'mddddddddddddddddddddm',
    'mmmmmmmmmmmmmmmmmmmmmm',
    'mmmmmmmmmmmmmmmmmmmmmm'
  ]
};

/** Supply skiff: neutral flying pod that carries a weapon drop. 26x14. */
export const PROP_SKIFF: PixelArtSpec = {
  palette: {
    h: '#3a5a7a', // hull shade
    H: '#9ad1ff', // hull light
    g: '#e8f1ff', // canopy glass
    s: '#ffd23f', // signal light
    p: '#22334a' // underside
  },
  rows: [
    '            s',
    '           sss',
    '      hhhhhhhhh',
    '    hhHHHHHHHHHhh',
    '   hHHgggHHHHHHHHh',
    '  hHHgggHHHHHHHHHHh',
    '  hHHgHHHHHHHHHHHHh',
    '  hHHHHHHHHHHHHHHHHh',
    '   hHHHHHHHHHHHHHHh',
    '    hhhhhhhhhhhhhhh',
    '      ppppppppppp',
    '     p  p     p  p',
    '',
    ''
  ]
};

/**
 * Siege Walker boss: a quadruped siege mech - plated hull, optic visor,
 * dorsal cannon, four hydraulic legs. 64x56, faces left.
 */
export const BOSS_SIEGE_WALKER: PixelArtSpec = {
  palette: {
    m: '#4c5560', // metal shade
    M: '#68727f', // metal
    h: '#9aa7b4', // highlight
    w: '#7a2a20', // red plate shade
    W: '#c84a34', // red plate
    o: '#ffd23f', // optic
    g: '#31383f', // gun
    G: '#9aa7b4', // muzzle
    k: '#1c2733' // joints / feet
  },
  rows: [
    '                                                          o',
    '                                                          g',
    'GGGGGGggggggg                                             g',
    'GGGGGGgggggggggg                                          g',
    'GGGGGGggggggg        mmmmm                                g',
    '                    mmmMMMMMmm',
    '                   mMMMMMMMMMMm',
    '                 mmMMMMMMMMMMMMmm',
    '        mmMMWWWWWWWWWWWWWWWWWWWWWWWWWWWWMMmm',
    '       mMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMm',
    '      mMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMm',
    '      mWWhWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWhWWWMm',
    '      mMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMm',
    '      mMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMm',
    '      mMooooooooooooooooooooooooooooooooooooooMMm',
    '      mMooooooooooooooooooooooooooooooooooooooMMm',
    '      mMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMm',
    '      mMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMm',
    '      mMWhWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWhWMm',
    '      mMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMm',
    '      mMWhWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWhWMm',
    '      mMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMm',
    '       mMWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWWMm',
    '       mMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMm',
    '      mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm',
    '      mMMkMMkMMkMMkMMkMMkMMkMMkMMkMMkMMkMMkMMm',
    '      mMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMm',
    '        kMMMMMMk      kMMMMMMk      kMMMMMMk      kMMMMMMk',
    '        kMMMMMMk      kMMMMMMk      kMMMMMMk      kMMMMMMk',
    '        kMMMMMMk      kMMMMMMk      kMMMMMMk      kMMMMMMk',
    '        kMMMMMMk      kMMMMMMk      kMMMMMMk      kMMMMMMk',
    '        kMMMMMMk      kMMMMMMk      kMMMMMMk      kMMMMMMk',
    '        kMMMMMMk      kMMMMMMk      kMMMMMMk      kMMMMMMk',
    '        kMMMMMMk      kMMMMMMk      kMMMMMMk      kMMMMMMk',
    '        kMMMMMMk      kMMMMMMk      kMMMMMMk      kMMMMMMk',
    '        kMMMMMMk      kMMMMMMk      kMMMMMMk      kMMMMMMk',
    '       kkMMMMMMkk    kkMMMMMMkk    kkMMMMMMkk    kkMMMMMMkk',
    '       kkMMMMMMkk    kkMMMMMMkk    kkMMMMMMkk    kkMMMMMMkk',
    '        kMMMMMMk      kMMMMMMk      kMMMMMMk      kMMMMMMk',
    '        kMMMMMMk      kMMMMMMk      kMMMMMMk      kMMMMMMk',
    '        kMMMMMMk      kMMMMMMk      kMMMMMMk      kMMMMMMk',
    '        kMMMMMMk      kMMMMMMk      kMMMMMMk      kMMMMMMk',
    '        kMMMMMMk      kMMMMMMk      kMMMMMMk      kMMMMMMk',
    '        kMMMMMMk      kMMMMMMk      kMMMMMMk      kMMMMMMk',
    '        kMMMMMMk      kMMMMMMk      kMMMMMMk      kMMMMMMk',
    '        kMMMMMMk      kMMMMMMk      kMMMMMMk      kMMMMMMk',
    '        kMMMMMMk      kMMMMMMk      kMMMMMMk      kMMMMMMk',
    '        kMMMMMMk      kMMMMMMk      kMMMMMMk      kMMMMMMk',
    '       kkkMMMMMMkkk  kkkMMMMMMkkk  kkkMMMMMMkkk  kkkMMMMMMkkk',
    '       kkkMMMMMMkkk  kkkMMMMMMkkk  kkkMMMMMMkkk  kkkMMMMMMkkk',
    '       kkkkkkkkkkkk  kkkkkkkkkkkk  kkkkkkkkkkkk  kkkkkkkkkkkk',
    '       kkkkkkkkkkkk  kkkkkkkkkkkk  kkkkkkkkkkkk  kkkkkkkkkkkk',
    '       kkkkkkkkkkkk  kkkkkkkkkkkk  kkkkkkkkkkkk  kkkkkkkkkkkk',
    '       kkkkkkkkkkkk  kkkkkkkkkkkk  kkkkkkkkkkkk  kkkkkkkkkkkk',
    '       kkkkkkkkkkkk  kkkkkkkkkkkk  kkkkkkkkkkkk  kkkkkkkkkkkk',
    '       kkkkkkkkkkkk  kkkkkkkkkkkk  kkkkkkkkkkkk  kkkkkkkkkkkk'
  ]
};

/** Broad-leaf jungle bush prop. */
export const PROP_BUSH: PixelArtSpec = {
  palette: { b: '#1d3a2a', B: '#2c543a', G: '#3d8549' },
  rows: [
    '        bbbb',
    '      bbBBBBbb        bb',
    '     bBBGGBBBbb     bbBBb',
    '   bbBBGGGBBBBbbb  bBGGBb',
    '  bBBBGGGBBBBBBBb bBGGGBb',
    ' bBBBGGBBBBBBBBBBb bBGGBbb',
    'bBBBBBBBBbbbbbBBBb bBBBBbbb',
    'bBBGGBBBb       bbbbBBbbbbb',
    'bBGGGBBb         bBBBb   bb',
    'bBBBBBb          bBb     bBb',
    'bbbbb                  bBBb',
    '                        bbb'
  ]
};

/** Chunk of rubble / rock prop. */
export const PROP_ROCK: PixelArtSpec = {
  palette: { r: '#4c5560', R: '#31383f', h: '#68727f' },
  rows: [
    '          rrrrr',
    '        rrhhrrrrr',
    '      rrhhrrrrrrrrr',
    '     rrhhrrrrrRRrrrr',
    '    rrhrrrrrRRRRRrrrr',
    '   rrrrrrrRRRRRRRRRrr',
    '  rrrrrrRRRRRRRRRRRrr',
    '  rrrrrRRRRRRRRRRRRRr',
    ' rrrrRRRRRRRRRRRRRRRR',
    ' rrrRRRRRRRRRRRRRRRRR',
    'rrRRRRRRRRRRRRRRRRRRR',
    'rrRRRRRRRRRRRRRRRRRRR'
  ]
};

/** Broken masonry ruin silhouette for the horizon line. */
export const BG_RUIN: PixelArtSpec = {
  palette: { r: '#22334a', R: '#22334a', w: '#1c2733' },
  rows: [
    '    rrrr            ',
    '    rRRRr     rrr   ',
    'rrrrrRRRrrrr rrRr   ',
    'rRRRRRRRRRRRrrRRrrrr',
    'rRwwRRRRwwRRRRRRRRRr',
    'rRwwRRRwwRRRRRwwRRRr',
    'rRRRRRRRRRRRRRwwRRRr',
    'rRRRRwwRRRRRRRRRRRRr',
    'rRRRwwRRRRwwRRRRRRRr',
    'rRRRwwRRRwwRRRRwwRRr',
    'rRRRRRRRRRRRRRRwwRRr',
    'rRRRRRRRRRwwRRRRRRRr',
    'rRRwwRRRRRwwRRwwRRRr',
    'rRRwwRRRRRRRRRwwRRRr',
    'rRRRRRRRRRRRRRRRRRRr',
    'rRRRRRRwwRRRRRRRRRRr',
    'rRRRRRwwRRRwwRRRRRRr',
    'rRRRRRwwRRRwwRRRRRRr',
    'rRRRRRRRRRRRRRRRRRRr',
    'rrrrrrrrrrrrrrrrrrrr'
  ]
};

/** Dead jungle tree silhouette for the horizon line. */
export const BG_TREE: PixelArtSpec = {
  palette: { t: '#0b0f1a', T: '#413325' },
  rows: [
    '      t   t',
    '      t   t     t',
    '   t  t   t  t  t',
    '    t t   t t   t',
    '    t t   tt   t',
    '  t  tt  tt   t',
    '   t tt  tt t t',
    '    tt ttt  tt',
    '  t  ttttt tt',
    '   tttTtTttt',
    '     tTTTTt',
    '      tTTt',
    '      tTTt',
    '     tTTt',
    '     tTTt',
    '     tTTt',
    '     tTTt',
    '    tTTt',
    '    tTTt',
    '    tTTt',
    '    tTTt',
    '   tTTt',
    '   tTTt',
    '   tTTt',
    '   tTTt',
    '   tTTtt',
    '  tTTTTTt',
    ' tTTTTTTTt'
  ]
};

/**
 * Jagged distant-canopy ridge, generated from a height profile so the tile
 * repeats seamlessly. 48x20; only the silhouette shows above the baseline.
 */
const RIDGE_PROFILE: readonly number[] = [
  7, 6, 6, 5, 4, 3, 2, 2, 3, 4, 5, 6, 7, 8, 9, 9, 8, 7, 6, 5, 4, 4, 5, 6,
  7, 8, 9, 8, 7, 6, 6, 5, 4, 3, 2, 2, 3, 4, 5, 6, 7, 8, 8, 7, 7, 7, 7, 7
];

function ridgeRows(profile: readonly number[], height: number): string[] {
  const rows: string[] = [];
  for (let y = 0; y < height; y++) {
    let row = '';
    for (const h of profile) {
      row += h >= height - y ? (h >= height - y + 2 ? 'r' : 'R') : ' ';
    }
    rows.push(row);
  }
  return rows;
}

export const BG_RIDGE: PixelArtSpec = {
  palette: { r: '#1c2733', R: '#22334a' },
  rows: ridgeRows(RIDGE_PROFILE, 20)
};

/* ------------------------------------------------------------------ */
/* Ashfall Ridge theme (Level 3).                                      */
/* ------------------------------------------------------------------ */

/**
 * Cooled lava crust: the same generated structure as the jungle ground, in
 * ash and ember. Sharing `groundRows` keeps the silhouette and the grass-line
 * read identical across themes, so only the colour says which stage you are on.
 */
export const TILE_ASH: PixelArtSpec = {
  palette: {
    g: '#31383f', // crust
    G: '#c96f3b', // ember crust line
    d: '#1c2733', // cold rock
    D: '#1c2733', // cold rock shade
    s: '#7a2a20' // cooling vein
  },
  rows: groundRows(32, 24)
};

/** Basalt causeway plank for one-way ledges. 32x12. */
export const TILE_CAUSEWAY: PixelArtSpec = {
  palette: { k: '#0b0f1a', m: '#31383f', M: '#4c5560', e: '#c96f3b' },
  rows: [
    'MMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMM',
    'MmmmmmmmmMmmmmmmmmMmmmmmmmmMmmmM',
    'mmeemmmmmmmmmmeemmmmmmmmmmeemmmm',
    'mmmmmmmmmmmmmmmmmmmmmmmmmmmmmmmm',
    'kmmmmmmmmkmmmmmmmmkmmmmmmmmkmmmk',
    'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
    'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
    'kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk',
    ' kkkkkkkk  kkkkkkkk  kkkkkkkk   ',
    ' kkkkkkkk  kkkkkkkk  kkkkkkkk   ',
    '  kkkkkk    kkkkkk    kkkkkk    ',
    '   kkkk      kkkk      kkkk     '
  ]
};

/** Volcanic spire on the horizon: a jagged cone venting a thread of smoke. */
export const BG_SPIRE: PixelArtSpec = {
  palette: { r: '#1c2733', R: '#31383f', e: '#7a2a20' },
  rows: [
    '            r           ',
    '           rrr          ',
    '          rrRrr         ',
    '          rrRrr         ',
    '         rrRRRrr        ',
    '        rrRReRRrr       ',
    '        rrRReRRrr       ',
    '       rrRRReRRRrr      ',
    '      rrRRRReRRRRrr     ',
    '     rrRRRRReRRRRRrr    ',
    '    rrRRRRRRRRRRRRRrr   ',
    '   rrRRRRRRRRRRRRRRRrr  ',
    '  rrRRRRRRRRRRRRRRRRRrr ',
    ' rrRRRRRRRRRRRRRRRRRRRrr',
    'rrRRRRRRRRRRRRRRRRRRRRRr',
    'rrRRRRRRRRRRRRRRRRRRRRRr'
  ]
};

/** Ground vent: a cracked fumarole glowing from within. 16x10. */
export const PROP_VENT: PixelArtSpec = {
  palette: { k: '#0b0f1a', m: '#31383f', e: '#c96f3b', E: '#ff8a3a' },
  rows: [
    '     mmmmmm     ',
    '   mmkkkkkkmm   ',
    '  mmkeEEEEekmm  ',
    ' mmkeEEEEEEekmm ',
    ' mkeEEEEEEEEekm ',
    ' mkeEEEEEEEEekm ',
    ' mmkeEEEEEEekmm ',
    '  mmkeEEEEekmm  ',
    '   mmkkkkkkmm   ',
    '    mmmmmmmm    '
  ]
};

/** Slag boulder: cooled spatter, darker and sharper than a jungle rock. */
export const PROP_SLAG: PixelArtSpec = {
  palette: { k: '#0b0f1a', m: '#31383f', M: '#4c5560', e: '#7a2a20' },
  rows: [
    '     mmMMmm     ',
    '   mmMMMMMMmm   ',
    '  mMMMMMMMMMMm  ',
    ' mMMMeMMMMeMMMm ',
    ' mMMMMMMMMMMMMm ',
    'mMMMMMMMMMMMMMMm',
    'mMMMMMMMMMMMMMMm',
    'kmMMMMMMMMMMMMmk',
    'kkmmMMMMMMMMmmkk',
    'kkkkkkkkkkkkkkkk'
  ]
};

/* ------------------------------------------------------------------ */
/* Fortress Interior theme (Level 2).                                  */
/* ------------------------------------------------------------------ */

/** Repeating metal deck tile: riveted steel plates with seams. 32x24. */
export const TILE_METAL: PixelArtSpec = {
  palette: {
    p: '#4c5560', // panel
    P: '#4c5560', // panel light
    s: '#1c2733', // seam
    r: '#68727f' // rivet
  },
  rows: [
    'ssssssssssssssssssssssssssssssss',
    'srppppppppppppppsrppppppppppppps',
    'spPPPPPPPPPPPPPPspPPPPPPPPPPPPPs',
    'spPpppppppppppppspPppppppppppPps',
    'spppppppppppppppssppppppppppppps',
    'spppppppppppppppssppppppppppppps',
    'spppppppppppppppssppppppppppppps',
    'spppppppppppppppssppppppppppppps',
    'spppppppppppppppssppppppppppppps',
    'spppppppppppppppssppppppppppppps',
    'spppppppppppppppssppppppppppppps',
    'srppppppppppppppsrppppppppppppps',
    'ssssssssssssssssssssssssssssssss',
    'srppppppppppppppsrppppppppppppps',
    'spPPPPPPPPPPPPPPspPPPPPPPPPPPPPs',
    'spPpppppppppppppspPppppppppppPps',
    'spppppppppppppppssppppppppppppps',
    'spppppppppppppppssppppppppppppps',
    'spppppppppppppppssppppppppppppps',
    'spppppppppppppppssppppppppppppps',
    'spppppppppppppppssppppppppppppps',
    'spppppppppppppppssppppppppppppps',
    'spppppppppppppppssppppppppppppps',
    'srppppppppppppppsrppppppppppppps'
  ]
};

/** One-way platform tile for the fortress: metal grate with holes. 24x12. */
export const TILE_GRATE: PixelArtSpec = {
  palette: { m: '#4c5560', M: '#68727f', h: '#141f33' },
  rows: [
    'MMMMMMMMMMMMMMMMMMMMMMMM',
    'MhhMhhMhhMhhMhhMhhMhhM',
    'MhhMhhMhhMhhMhhMhhMhhM',
    'MMMMMMMMMMMMMMMMMMMMMMMM',
    'MhhMhhMhhMhhMhhMhhMhhM',
    'MhhMhhMhhMhhMhhMhhMhhM',
    'MMMMMMMMMMMMMMMMMMMMMMMM',
    'MhhMhhMhhMhhMhhMhhMhhM',
    'MhhMhhMhhMhhMhhMhhMhhM',
    'MMMMMMMMMMMMMMMMMMMMMMMM',
    'mmmmmmmmmmmmmmmmmmmmmmmm',
    'mmmmmmmmmmmmmmmmmmmmmmmm'
  ]
};

/** Fortress interior wall tile: riveted panels with a vent. 32x32. */
export const TILE_WALL: PixelArtSpec = {
  palette: {
    w: '#1c2733', // wall base
    W: '#31383f', // panel
    r: '#4c5560', // rivet
    v: '#0b0f1a' // vent
  },
  rows: [
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww',
    'wrWWWWWWWWWWWWwwrWWWWWWWWWWWWwr',
    'wWWWWWWWWWWWWWWwwWWWWWWWWWWWWWww',
    'wWwwwwwwwwwwwwWwwWwwwwwwwwwwWwww',
    'wWWWWWWWWWWWWWWwwWWWWWWWWWWWWWww',
    'wWWWWWWWWWWWWWWwwWWWWWWWWWWWWWww',
    'wWWWWWWWWWWWWWWwwWWWWWWWWWWWWWww',
    'wWWWWWWWWWWWWWWwwWWWWWWWWWWWWWww',
    'wWWWWWWWWWWWWWWwwWWWWWWWWWWWWWww',
    'wWWWWWWWWWWWWWWwwWWWWWWWWWWWWWww',
    'wWWWWWWWWWWWWWWwwWWWWWWWWWWWWWww',
    'wWWWWWWWWWWWWWWwwWWWWWWWWWWWWWww',
    'wWWWWWWWWWWWWWWwwWWWWWWWWWWWWWww',
    'wWWWWWWWWWWWWWWwwWWWWWWWWWWWWWww',
    'wrWWWWWWWWWWWWwwrWWWWWWWWWWWWwr',
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww',
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww',
    'wrWWWWWWWWWWWWwwrWWWWWWWWWWWWwr',
    'wWWWWWWWWWWWWWWwwWWWWWWWWWWWWWww',
    'wWwwwwwwwwwwwwWwwWwwwwwwwwwwWwww',
    'wWvvvvvvvvvvWwwwwWWWWWWWWWWWWWww',
    'wWvvvvvvvvvvWwwwwWWWWWWWWWWWWWww',
    'wWWWWWWWWWWWWWWwwWWWWWWWWWWWWWww',
    'wWWWWWWWWWWWWWWwwWWWWWWWWWWWWWww',
    'wWWWWWWWWWWWWWWwwWWWWWWWWWWWWWww',
    'wWWWWWWWWWWWWWWwwWWWWWWWWWWWWWww',
    'wWWWWWWWWWWWWWWwwWWWWWWWWWWWWWww',
    'wWWWWWWWWWWWWWWwwWWWWWWWWWWWWWww',
    'wWWWWWWWWWWWWWWwwWWWWWWWWWWWWWww',
    'wWWWWWWWWWWWWWWwwWWWWWWWWWWWWWww',
    'wrWWWWWWWWWWWWwwrWWWWWWWWWWWWwr',
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww'
  ]
};

/** Pipe run band for the fortress ceiling line. 48x24, repeats horizontally. */
export const BG_PIPES: PixelArtSpec = {
  palette: { p: '#2c543a', P: '#68727f', h: '#68727f' },
  rows: [
    '',
    '',
    'pppppppppppppppPPPpppppppppppppppppppppPPPpppppp',
    'pPhhhhhhhhhhhhhPPPPhhhhhhhhhhhhhhhhhhhPPPPhhhhhh',
    'pPhhhhhhhhhhhhhPPPPhhhhhhhhhhhhhhhhhhhPPPPhhhhhh',
    'pppppppppppppppPPPpppppppppppppppppppppPPPpppppp',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    'pppppppppppPPPPPpppppppppppppppppppPPPPPpppppppp',
    'pPhhhhhhhhhPPPPPPhhhhhhhhhhhhhhhhhhhPPPPPPhhhhhh',
    'pPhhhhhhhhhPPPPPPhhhhhhhhhhhhhhhhhhhPPPPPPhhhhhh',
    'pppppppppppPPPPPpppppppppppppppppppPPPPPpppppppp',
    '',
    '',
    '',
    '',
    '',
    ''
  ]
};

/** Machinery silhouette for the fortress ground line: terminal with screen. */
export const BG_MACHINE: PixelArtSpec = {
  palette: {
    m: '#31383f', // body shade
    M: '#31383f', // body
    s: '#57d9a3', // screen
    S: '#2c543a', // screen shade
    o: '#ffd23f' // indicator
  },
  rows: [
    '        o',
    '       mmm',
    '      mMMMmm',
    '     mMMMMMMMmm',
    '    mMMsssssssMMm',
    '    mMssSSSSsssMm',
    '    mMsSSSSSSSSMm',
    '    mMssSSSSsssMm',
    '    mMMsssssssMMm',
    '    mMMMMMMMMMMMm',
    '    mMMMMMMMMMMMm',
    '    mMMmMmMmMMMm',
    '    mMMMMMMMMMMMm',
    '   mMMMMMMMMMMMMM',
    '   mMMMMMMMMMMMMM',
    '   mMMMMMMMMMMMMM',
    '   mMmMMMMMMMMmMm',
    '   mMMMMMMMMMMMMM',
    '   mMMMMMMMMMMMMM',
    '   mMMMMMMMMMMMMM',
    '   mMMMMMMMMMMMMM',
    '   mMMMMMMMMMMMMM',
    '   mMMMMMMMMMMMMM',
    '   mMMMMMMMMMMMMM',
    '   mMMMMMMMMMMMMM',
    '   mMMMMMMMMMMMMM',
    '   mMMMMMMMMMMMMM',
    '   mMMMMMMMMMMMMM',
    '   mMMMMMMMMMMMMM',
    '   mMMMMMMMMMMMMM',
    '   mMMMMMMMMMMMMM',
    '   mMMMMMMMMMMMMM',
    '   mMMMMMMMMMMMMM',
    '   mMMMMMMMMMMMMM',
    '   mMMMMMMMMMMMMM',
    '   mMMMMMMMMMMMMM'
  ]
};

/** Structural I-beam column silhouette for the fortress. */
export const BG_COLUMN: PixelArtSpec = {
  palette: { c: '#1c2733', C: '#31383f' },
  rows: [
    '  cCCCCCCCccCCCc',
    '  cCCCCCCCccCCCc',
    '    cCCCCCccCCc',
    '    cCCCCCccCCc',
    '    cCCCCCccCCc',
    '    cCCCCCccCCc',
    '    cCCCCCccCCc',
    '    cCCCCCccCCc',
    '    cCCCCCccCCc',
    '    cCCCCCccCCc',
    '    cCCCCCccCCc',
    '    cCCCCCccCCc',
    '    cCCCCCccCCc',
    '    cCCCCCccCCc',
    '    cCCCCCccCCc',
    '    cCCCCCccCCc',
    '    cCCCCCccCCc',
    '    cCCCCCccCCc',
    '    cCCCCCccCCc',
    '    cCCCCCccCCc',
    '    cCCCCCccCCc',
    '    cCCCCCccCCc',
    '    cCCCCCccCCc',
    '    cCCCCCccCCc',
    '    cCCCCCccCCc',
    '    cCCCCCccCCc',
    '    cCCCCCccCCc',
    '    cCCCCCccCCc',
    '    cCCCCCccCCc',
    '    cCCCCCccCCc',
    '    cCCCCCccCCc',
    '    cCCCCCccCCc',
    '    cCCCCCccCCc',
    '    cCCCCCccCCc',
    '    cCCCCCccCCc',
    '    cCCCCCccCCc',
    '  cCCCCCCCccCCCc',
    '  cCCCCCCCccCCCc',
    '  cCCCCCCCccCCCc',
    '  cCCCCCCCccCCCc',
    '  cCCCCCCCccCCCc'
  ]
};

/** Hazard barrel prop: rusty drum with a warning band. */
export const PROP_BARREL: PixelArtSpec = {
  palette: { b: '#6a4e28', B: '#b08a4a', y: '#ffd23f', k: '#413325' },
  rows: [
    '    bbbbbbbb',
    '   bBBBBBBBBbb',
    '   bBBBBBBBBBb',
    '   bBBBBBBBBBb',
    '   byyyyyyyyyb',
    '   byyyyyyyyyb',
    '   bBBBBBBBBBb',
    '   bBBBBBBBBBb',
    '   bBBBBBBBBBb',
    '   bBBBBBBBBBb',
    '   byyyyyyyyyb',
    '   byyyyyyyyyb',
    '   bBBBBBBBBBb',
    '   bBBBBBBBBBb',
    '   bBBBBBBBBBb',
    '   bBkkBBBBkkb',
    '   bbbbbbbbbbb',
    '    bbbbbbbb'
  ]
};

/** Metal storage crate prop for the fortress. */
export const PROP_CRATE_METAL: PixelArtSpec = {
  palette: { m: '#4c5560', M: '#68727f', d: '#31383f', r: '#9aa7b4' },
  rows: [
    'mmmmmmmmmmmmmmmmmm',
    'mMMMMMMMMMMMMMMMMm',
    'mMddMMMMMMMMMMddMm',
    'mMMddMMMMMMMMddMMm',
    'mMMMddMMMMMMddMMM',
    'mMMMMddMMMMddMMMM',
    'mMMMMMddMMddMMMMM',
    'mMMMMMMddddMMMMMM',
    'mMMMMMMddddMMMMMM',
    'mMMMMMddMMddMMMMM',
    'mMMMMddMMMMddMMMM',
    'mMMMddMMMMMMddMMM',
    'mMMddMMMMMMMMddMMm',
    'mMddMMMMMMMMMMddMm',
    'mMMMMMMMMMMMMMMMMm',
    'mMrMMMMMMMMMMMMrMm',
    'mMMMMMMMMMMMMMMMMm',
    'mmmmmmmmmmmmmmmmmm'
  ]
};

/** Security blast door for the fortress: riveted panel, beacon, hazard base. 16x96. */
export const DOOR_SECURITY: PixelArtSpec = {
  palette: {
    d: '#31383f', // panel
    D: '#4c5560', // panel light
    k: '#1c2733', // seam
    o: '#ffd23f', // beacon
    y: '#ffd23f', // hazard
    r: '#68727f' // rivet
  },
  rows: [
    'ddddddkddddddddd',
    'ddDdddkdddDddddd',
    'dddookoookdddddd',
    'dddddkkddddddddd',
    'ddddddkddddddddd',
    'ddDdddkdddDddddd',
    'ddddddkddddddddd',
    'dddddokddddddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddDdddkdddDddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddDdddkdddDddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddDdddkdddDddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddDdddkdddDddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddDdddkdddDddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddDdddkdddDddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddDdddkdddDddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddDdddkdddDddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddDdddkdddDddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddDdddkdddDddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddDdddkdddDddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddDdddkdddDddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddDdddkdddDddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddDdddkdddDddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddDdddkdddDddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddDdddkdddDddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'ddddddkddddddddd',
    'yyyykkkkyyyykkkk',
    'kkkkyyyykkkkyyyy',
    'yyyykkkkyyyykkkk',
    'kkkkyyyykkkkyyyy'
  ]
};

/**
 * Reactor Warden final boss: the fortress core - armored housing with a
 * glowing reactor heart, warning band, conduits, and a bolted base mount.
 * 72x72, symmetric (fires in both directions).
 */
export const BOSS_REACTOR_WARDEN: PixelArtSpec = {
  palette: {
    m: '#4c5560', // metal shade
    M: '#68727f', // metal
    h: '#9aa7b4', // highlight
    w: '#7a2a20', // red plate shade
    W: '#c84a34', // red plate
    o: '#ffd23f', // warning amber
    c: '#2c543a', // reactor shade
    C: '#57d9a3', // reactor glow
    b: '#e8f1ff', // reactor hot core
    k: '#1c2733', // recess
    g: '#31383f', // conduit
    G: '#68727f' // conduit light
  },
  rows: [
    "                                   o",
    "                                   g",
    "                                  ggg",
    "                             ggggggggggg",
    "                            ggGGGGGGGGGgg",
    "                            gGGGGGGGGGGGg",
    "                             ggggggggggg",
    "                          mmmMMMMMMMMMMMmmm",
    "                        mmMMMMMMMMMMMMMMMMMmm",
    "                      mmMMWWWWWWWWWWWWWWWMMmm",
    "                     mMWWWWWWWWWWWWWWWWWWWWMm",
    "                    mMWWWhWWWWWWWWWWWWWhWWWMm",
    "                    mMWWWWWWWWWWWWWWWWWWWWMm",
    "                    mMMMMMMMMMMMMMMMMMMMMMMMm",
    "                   mMMoooooooooooooooooooooMMm",
    "                   mMMoooooooooooooooooooooMMm",
    "                    mMMMMMMMMMMMMMMMMMMMMMMMm",
    "                    mMWhWWWWWWWWWWWWWWWWhWMm",
    "                    mMWWWWWWWWWWWWWWWWWWWWMm",
    "                   mMMMMMMMMMMMMMMMMMMMMMMMMm",
    "                   mMkkkkkkkkkkkkkkkkkkkkkkMm",
    "                   mMkcccccccccccccccccccckMm",
    "                   mMkcccccccccccccccccccckMm",
    "                   mMkccCCCCCCCCCCCCCCCCcckMm",
    "                   mMkcCCCCCCCCCCCCCCCCCCckMm",
    "                   mMkcCCCbbbbbbbbbbbbbCCCkMm",
    "                   mMkcCCbbbbbbbbbbbbbbbCCkMm",
    "                   mMkcCCbbbbbbbbbbbbbbbCCkMm",
    "                   mMkcCCbbbbbbbbbbbbbbbCCkMm",
    "                   mMkcCCCbbbbbbbbbbbbbCCCkMm",
    "                   mMkcCCCCCCCCCCCCCCCCCCckMm",
    "                   mMkccCCCCCCCCCCCCCCCCcckMm",
    "                   mMkcccccccccccccccccccckMm",
    "                   mMkcccccccccccccccccccckMm",
    "                   mMkkkkkkkkkkkkkkkkkkkkkkMm",
    "                   mMMMMMMMMMMMMMMMMMMMMMMMMm",
    "                    mMWhWWWWWWWWWWWWWWWWhWMm",
    "                    mMWWWWWWWWWWWWWWWWWWWWMm",
    "                    mMMMMMMMMMMMMMMMMMMMMMMMm",
    "                   mMMMMMMMMMMMMMMMMMMMMMMMMm",
    "                   mMkMMkMMkMMkMMkMMkMMkMMkMm",
    "                   mMMMMMMMMMMMMMMMMMMMMMMMMm",
    "                  mMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMm",
    "                 mMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMm",
    "                mMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMm",
    "               mMMhMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMhMMm",
    "              mMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMm",
    "             kkMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMkk",
    "            kMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMMk",
    "         kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
    "         kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
    "         kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
    "         kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
    "         kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
    "         kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
    "         kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
    "         kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
    "         kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
    "         kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
    "         kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
    "         kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
    "         kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
    "         kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
    "         kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
    "         kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
    "         kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
    "         kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
    "         kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
    "         kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
    "         kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
    "         kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk",
    "         kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk"
  
  ]
};

/** Subcomponent node: octagonal shield emitter with a glowing core. 18x18. */
export const SUBCOMPONENT_NODE: PixelArtSpec = {
  palette: {
    m: '#4c5560', // frame shade
    M: '#9aa7b4', // frame light
    c: '#2c543a', // glow shade
    C: '#57d9a3', // glow
    b: '#e8f1ff' // hot center
  },
  rows: [
    '     mMMMMMMm',
    '   mMMCCCCCCMMm',
    '  mMCCCCCCCCCCMm',
    ' mMCCccccccccCCMm',
    ' mMCcbbbbbbbbCcMm',
    'mMCcbbbbbbbbbcCMm',
    'mMCcbbbbbbbbcCMm',
    'mMCcbbbbbbbbcCMm',
    'mMCcbbbbbbbbcCMm',
    'mMCcbbbbbbbbbcCMm',
    ' mMCcbbbbbbbbCcMm',
    ' mMCCccccccccCCMm',
    '  mMCCCCCCCCCCMm',
    '   mMMCCCCCCMMm',
    '     mMMMMMMm',
    '',
    '',
    ''
  ]
};


/**
 * Title-screen emblem: the project's shield + echo-wave motif (the same mark
 * as the favicon, authored at sprite scale). 22x26.
 */
export const LOGO_EMBLEM: PixelArtSpec = {
  palette: {
    b: '#8ea6c9', // shield edge
    B: '#22334a', // shield fill
    g: '#ffd23f'  // echo wave
  },
  rows: [
    '    bbbbbbbbbbbbbb    ',
    '   bBBBBBBBBBBBBBBb   ',
    '  bBBBBBBBBBBBBBBBBBb  ',
    ' bBBBBBBBBBBBBBBBBBBBb ',
    'bBBBBBBBBBBBBBBBBBBBBBBb',
    'bBBBBBBBBBBBBBBBBBBBBBBb',
    'bBBBBBBBBBBBBBBBBBBBBBBb',
    'bBBBBBBBBBBBBBBBBBBBBBBb',
    'bBBBBBBgBBBBBgBBBBBBBb',
    'bBBBBBgBBBgBBBgBBBBBBb',
    'bBBBBBgBBgBBBgBBBBBBBb',
    ' bBBBBgBBBgBBgBBBBBBb ',
    ' bBBBBBgBBBgBBgBBBBBb ',
    '  bBBBBBBBBBBBBBBBBBb  ',
    '  bBBBBBBBBBBBBBBBBBb  ',
    '   bBBBBBBBBBBBBBBb   ',
    '   bBBBBBBBBBBBBBBb   ',
    '    bBBBBBBBBBBBBb    ',
    '    bBBBBBBBBBBBBb    ',
    '     bBBBBBBBBBBb     ',
    '      bBBBBBBBBb      ',
    '      bBBBBBBBBb      ',
    '       bBBBBBBb       ',
    '        bBBBBb        ',
    '         bBBb         ',
    '          bb          '
  ]
};


/** CRT scanline tile: one transparent row over one black row, tiled full-screen. */
export const SCANLINE: PixelArtSpec = {
  palette: { k: '#000000' },
  rows: [' ', 'k']
};


/** Turret emplacement: a squat armoured mount with a levelled barrel. 24x22. */
export const ENEMY_TURRET: PixelArtSpec = {
  palette: {
    m: '#4c5560', // mount shade
    M: '#68727f', // mount
    h: '#9aa7b4', // highlight
    g: '#31383f', // barrel
    G: '#9aa7b4', // muzzle
    o: '#ffd23f', // optic
    k: '#1c2733' // recess
  },
  rows: [
    '          mMMMMMMm',
    '         mMMMMMMMMm',
    '        mMMhMMMMhMMm',
    '   ggg  mMMMMMMMMMMm',
    'gggGGGg mMMoooooooMMm',
    'gggGGGg mMMoooooooMMm',
    '   ggg  mMMMMMMMMMMm',
    '        mMMhMMMMhMMm',
    '         mMMMMMMMMm',
    '          mMMMMMMm',
    '       mmMMMMMMMMMMmm',
    '     mmMMMMMMMMMMMMMMmm',
    '    mMMMMMMMMMMMMMMMMMMm',
    '    mMkkMMMMMMMMMMMMkkMm',
    '    mMkkMMMMMMMMMMMMkkMm',
    '    mMMMMMMMMMMMMMMMMMMm',
    '    mMMMMMMMMMMMMMMMMMMm',
    '    mmmmmmmmmmmmmmmmmmmm',
    '    mmmmmmmmmmmmmmmmmmmm',
    '    kkkkkkkkkkkkkkkkkkkk',
    '    kkkkkkkkkkkkkkkkkkkk',
    '    kkkkkkkkkkkkkkkkkkkk'
  ]
};

/** Turret idle frame: the optic band narrows as it scans. */
export const ENEMY_TURRET_B: PixelArtSpec = {
  palette: ENEMY_TURRET.palette,
  rows: [
    ...ENEMY_TURRET.rows.slice(0, 4),
    'gggGGGg mMMMoooooMMMm',
    'gggGGGg mMMMoooooMMMm',
    ...ENEMY_TURRET.rows.slice(6)
  ]
};

/** Turret firing frame: muzzle flash off the barrel tip. */
export const ENEMY_TURRET_FIRE: PixelArtSpec = {
  palette: ENEMY_TURRET.palette,
  rows: [
    ...ENEMY_TURRET.rows.slice(0, 4),
    'oggGGGg mMMoooooooMMm',
    ...ENEMY_TURRET.rows.slice(5)
  ]
};

/** Runner stride frame: the same trooper mid-passing-stride. */
export const ENEMY_RUNNER_B: PixelArtSpec = {
  palette: ENEMY_RUNNER.palette,
  rows: [
    ...ENEMY_RUNNER.rows.slice(0, 16),
    '    wwWWww  wwWWww',
    '    wWWw      wWWw',
    '    wWWw      wWWw',
    '    wWWw     wWWw',
    '    kkkk     kkkk',
    '    kkkk     kkkk',
    '    kkkkk    kkkkk',
    '    kkkk     kkkk',
    '    kkkk      kkkk',
    '    kkkkk     kkkkk',
    '     kkkk     kkkk',
    '     kkkk     kkkk',
    '      kkkk     kkkk',
    '      kkkk    kkkk'
  ]
};

/** Runner firing frame: gun level, muzzle flash at the left edge. */
export const ENEMY_RUNNER_FIRE: PixelArtSpec = {
  palette: ENEMY_RUNNER.palette,
  rows: [
    ...ENEMY_RUNNER.rows.slice(0, 9),
    ' oWWwWWWWWWWWwWW',
    '  WkwWWWWWWWWwkW',
    ...ENEMY_RUNNER.rows.slice(11)
  ]
};

/** Sentry idle frame: the optic pulses wider. */
export const ENEMY_SENTRY_B: PixelArtSpec = {
  palette: ENEMY_SENTRY.palette,
  rows: [
    ...ENEMY_SENTRY.rows.slice(0, 3),
    '         wWoooWWWWWw',
    '   ggg   wWoooWWWWWw',
    ...ENEMY_SENTRY.rows.slice(5)
  ]
};

/** Sentry firing frame: muzzle flash at the barrel tip. */
export const ENEMY_SENTRY_FIRE: PixelArtSpec = {
  palette: ENEMY_SENTRY.palette,
  rows: [
    ...ENEMY_SENTRY.rows.slice(0, 5),
    'oggGGGg  wWWWWWWWWWWw',
    ...ENEMY_SENTRY.rows.slice(6)
  ]
};

/** Grenadier idle frame: the cannon rides one pixel lower. */
export const ENEMY_GRENADIER_B: PixelArtSpec = {
  palette: ENEMY_GRENADIER.palette,
  rows: [
    ...ENEMY_GRENADIER.rows.slice(0, 9),
    ...ENEMY_GRENADIER.rows.slice(12, 13),
    ...ENEMY_GRENADIER.rows.slice(9, 12),
    ...ENEMY_GRENADIER.rows.slice(13)
  ]
};

/** Grenadier firing frame: cannon up, flash at the muzzle. */
export const ENEMY_GRENADIER_FIRE: PixelArtSpec = {
  palette: ENEMY_GRENADIER.palette,
  rows: [
    ...ENEMY_GRENADIER.rows.slice(0, 8),
    ' o PpPPPPPPPPPPpP',
    ...ENEMY_GRENADIER.rows.slice(9)
  ]
};

/** Drone idle frame: the rotor flicks to its crossed position. */
export const ENEMY_DRONE_B: PixelArtSpec = {
  palette: ENEMY_DRONE.palette,
  rows: [
    '    r  r  r  r',
    '   rrrrrrrrrrrrr',
    '    r  r  r  r',
    ...ENEMY_DRONE.rows.slice(3)
  ]
};

/** Drone firing frame: both chin guns flashing. */
export const ENEMY_DRONE_FIRE: PixelArtSpec = {
  palette: ENEMY_DRONE.palette,
  rows: [
    ...ENEMY_DRONE.rows.slice(0, 11),
    '      g      g',
    '      g      g',
    '      o      o',
    '       f    f',
    '       f    f',
    '',
    ''
  ]
};

/**
 * Boss idle variants, derived from the base frames so the two can never drift
 * apart: a helper transforms the authored rows rather than re-typing 56-72
 * rows of pixel art with an editor's error hiding in it.
 */

/** Lift the 2nd and 4th feet of a quadruped, one pixel, in the bottom rows. */
function liftAlternateFeet(rows: readonly string[], footRows: number, footWidth: number, columns: number[]): string[] {
  return rows.map((row, i) => {
    if (i < rows.length - footRows) {
      return row;
    }
    const cells = row.split('');
    for (const col of columns) {
      for (let x = col; x < col + footWidth && x < cells.length; x++) {
        cells[x] = ' ';
      }
    }
    return cells.join('').replace(/\s+$/, '');
  });
}

/** Pulse one palette letter into another within a row range (e.g. a reactor core brightening). */
function pulseRows(rows: readonly string[], from: string, to: string, rowStart: number, rowEnd: number): string[] {
  return rows.map((row, i) => (i >= rowStart && i <= rowEnd ? row.split(from).join(to) : row));
}

/** Siege Walker idle frame: legs 2 and 4 carry the step. */
export const BOSS_SIEGE_WALKER_B: PixelArtSpec = {
  palette: BOSS_SIEGE_WALKER.palette,
  rows: liftAlternateFeet(BOSS_SIEGE_WALKER.rows, 2, 12, [22, 50])
};

/** Reactor Warden idle frame: the reactor core brightens into its glow colour. */
export const BOSS_REACTOR_WARDEN_B: PixelArtSpec = {
  palette: BOSS_REACTOR_WARDEN.palette,
  rows: pulseRows(BOSS_REACTOR_WARDEN.rows, 'c', 'C', 21, 32)
};

/**
 * Ash Sentinel: a wide, squat artillery platform on short struts.
 *
 * Reads as a different silhouette from either other boss on sight - the Walker
 * is a tall legged box, the Warden a vertical column, this a flat wing with
 * two muzzles under it. 76x48.
 */
const SENTINEL_W = 76;
const SENTINEL_H = 48;

/**
 * Build the Sentinel from a symmetric half-profile.
 *
 * Generated rather than hand-typed because the sprite is 76x48: at that size a
 * miscounted row is invisible in review but stretches the whole boss, since the
 * scene scales the sprite to the hitbox. The generator cannot miscount.
 *
 * Each entry is `[rowCount, inset, fill]` - how many rows, how far the hull is
 * inset from each edge, and the character to fill with.
 */
function sentinelRows(): string[] {
  const bands: [number, number, string][] = [
    [1, 30, 'm'],
    [1, 27, 'M'],
    [2, 23, 'M'],
    [2, 18, 'M'],
    [2, 13, 'M'],
    [2, 9, 'M'],
    [2, 6, 'M'],
    [3, 4, 'W'],
    [2, 4, 'o'],
    [3, 4, 'W'],
    [2, 6, 'M'],
    [2, 9, 'M'],
    [2, 13, 'M'],
    [2, 16, 'M'],
    [2, 19, 'M']
  ];
  const rows: string[] = [];
  for (const [count, inset, fill] of bands) {
    for (let i = 0; i < count; i++) {
      const inner = SENTINEL_W - inset * 2;
      // A darker rim on both edges keeps the silhouette readable against the
      // ash sky, which is the same value range as the hull.
      const body = fill.repeat(Math.max(0, inner - 2));
      rows.push(' '.repeat(inset) + (inner > 1 ? 'm' + body + 'm' : fill.repeat(inner)));
    }
  }
  // Two muzzle housings hanging below the hull, at the quarter points.
  const gunTop = rows.length;
  for (let y = gunTop; y < SENTINEL_H; y++) {
    const deep = y - gunTop;
    const barrel = deep < 6 ? 'g' : deep < 8 ? 'e' : ' ';
    const row = ' '.repeat(SENTINEL_W).split('');
    if (barrel !== ' ') {
      for (const cx of [Math.floor(SENTINEL_W * 0.28), Math.floor(SENTINEL_W * 0.72)]) {
        for (let dx = -2; dx <= 2; dx++) {
          row[cx + dx] = barrel;
        }
      }
    }
    rows.push(row.join('').replace(/\s+$/, ''));
  }
  return rows.slice(0, SENTINEL_H);
}

/**
 * Ash Sentinel: a wide, squat artillery platform on short struts.
 *
 * A different silhouette from either other boss on sight - the Walker is a tall
 * legged box, the Warden a vertical column, this a flat wing with two muzzles
 * slung under it. 76x48.
 */
export const BOSS_ASH_SENTINEL: PixelArtSpec = {
  palette: {
    m: '#31383f', // hull rim
    M: '#4c5560', // hull
    W: '#c84a34', // plate
    o: '#ffd23f', // sensor band
    e: '#ff8a3a', // vent glow
    g: '#1c2733' // muzzle
  },
  rows: sentinelRows()
};

/** Ash Sentinel idle frame: the sensor band dims as it sweeps. */
export const BOSS_ASH_SENTINEL_B: PixelArtSpec = {
  palette: BOSS_ASH_SENTINEL.palette,
  // The sensor band sits at rows 15-16 of the generated profile; pulsing the
  // wrong range would leave the two frames identical and the boss static.
  rows: pulseRows(BOSS_ASH_SENTINEL.rows, 'o', 'e', 15, 16)
};

/** HUD life icon: the commando's helmet. 12x12. */
export const UI_LIFE: PixelArtSpec = {
  palette: {
    h: '#3d8549',
    H: '#58b368',
    r: '#c84a34',
    s: '#e8b06f',
    S: '#b08a4a',
    v: '#1c2733'
  },
  rows: [
    '   hhhhhh',
    '  hHHHHHHh',
    ' hHHHHHHHHh',
    ' hhhhhhhhhh',
    ' rrrrrrrrrr',
    ' ssssssssss',
    ' ssssvvssss',
    ' SSSSSSSSSS',
    '  SSSSSSSS',
    '',
    '',
    ''
  ]
};

/** Every sprite texture the game registers at scene start. */
export const SPRITE_SPECS = {
  'art/player-idle': PLAYER_IDLE,
  'art/player-run-a': PLAYER_RUN_A,
  'art/player-run-b': PLAYER_RUN_B,
  'art/player-run-c': PLAYER_RUN_C,
  'art/player-run-d': PLAYER_RUN_D,
  'art/player-jump': PLAYER_JUMP,
  'art/player-crouch': PLAYER_CROUCH,
  'art/player-aim-up': PLAYER_AIM_UP,
  'art/player-aim-diag': PLAYER_AIM_DIAG,
  'art/player-hurt': PLAYER_HURT,
  'art/player-death': PLAYER_DEATH,
  'art/enemy-turret': ENEMY_TURRET,
  'art/enemy-turret-b': ENEMY_TURRET_B,
  'art/enemy-turret-fire': ENEMY_TURRET_FIRE,
  'art/enemy-runner': ENEMY_RUNNER,
  'art/enemy-runner-b': ENEMY_RUNNER_B,
  'art/enemy-runner-fire': ENEMY_RUNNER_FIRE,
  'art/enemy-sentry': ENEMY_SENTRY,
  'art/enemy-sentry-b': ENEMY_SENTRY_B,
  'art/enemy-sentry-fire': ENEMY_SENTRY_FIRE,
  'art/enemy-grenadier': ENEMY_GRENADIER,
  'art/enemy-grenadier-b': ENEMY_GRENADIER_B,
  'art/enemy-grenadier-fire': ENEMY_GRENADIER_FIRE,
  'art/enemy-drone': ENEMY_DRONE,
  'art/enemy-drone-b': ENEMY_DRONE_B,
  'art/enemy-drone-fire': ENEMY_DRONE_FIRE,
  'art/bullet-pulse': BULLET_PULSE,
  'art/bullet-scatter': BULLET_SCATTER,
  'art/bullet-rapid': BULLET_RAPID,
  'art/bullet-laser': BULLET_LASER,
  'art/bullet-flame': BULLET_FLAME,
  'art/bullet-enemy': BULLET_ENEMY,
  'art/pickup-crate': PICKUP_CRATE,
  'art/tile-ground': TILE_GROUND,
  'art/tile-hazard': TILE_HAZARD,
  'art/tile-oneway': TILE_ONEWAY,
  'art/prop-skiff': PROP_SKIFF,
  'art/boss-siege-walker': BOSS_SIEGE_WALKER,
  'art/boss-siege-walker-b': BOSS_SIEGE_WALKER_B,
  'art/boss-reactor-warden': BOSS_REACTOR_WARDEN,
  'art/boss-ash-sentinel': BOSS_ASH_SENTINEL,
  'art/boss-ash-sentinel-b': BOSS_ASH_SENTINEL_B,
  'art/boss-reactor-warden-b': BOSS_REACTOR_WARDEN_B,
  'art/subcomponent-node': SUBCOMPONENT_NODE,
  'art/logo-emblem': LOGO_EMBLEM,
  'art/scanline': SCANLINE,
  'art/ui-life': UI_LIFE,
  'art/prop-bush': PROP_BUSH,
  'art/prop-rock': PROP_ROCK,
  'art/bg-ruin': BG_RUIN,
  'art/bg-tree': BG_TREE,
  'art/bg-ridge': BG_RIDGE,
  'art/bg-stars': BG_STARS,
  'art/tile-ash': TILE_ASH,
  'art/tile-causeway': TILE_CAUSEWAY,
  'art/bg-spire': BG_SPIRE,
  'art/prop-vent': PROP_VENT,
  'art/prop-slag': PROP_SLAG,
  'art/tile-metal': TILE_METAL,
  'art/tile-grate': TILE_GRATE,
  'art/tile-wall': TILE_WALL,
  'art/bg-pipes': BG_PIPES,
  'art/bg-machine': BG_MACHINE,
  'art/bg-column': BG_COLUMN,
  'art/prop-barrel': PROP_BARREL,
  'art/prop-crate-metal': PROP_CRATE_METAL,
  'art/door-security': DOOR_SECURITY
} as const;

export type SpriteKey = keyof typeof SPRITE_SPECS;
