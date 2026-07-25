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
  h: '#356e42', // helmet shade
  H: '#5cab64', // helmet light
  r: '#d6493b', // headband
  s: '#e8b06f', // skin
  S: '#b98548', // skin shade
  v: '#1c2733', // eyes / visor
  a: '#58b368', // armor
  A: '#3d8549', // armor shade
  b: '#2b3a2e', // belt
  l: '#46603c', // fatigues
  L: '#5a7a4c', // fatigues light
  k: '#2a2f26', // boots
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
    k: '#33201c' // boots / joints
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
    m: '#4a525e', // metal shade
    M: '#68727f', // metal
    w: '#8a3a3a', // dome shade
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
    k: '#2a2030', // boots
    l: '#3a2a44', // fatigues
    L: '#584a66' // fatigues light
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
    r: '#8a97a5', // rotor
    m: '#4a525e', // hull shade
    M: '#7a8494', // hull light
    o: '#ff5533', // optic
    g: '#31383f', // chin guns
    f: '#ff9a3a' // thruster
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
  palette: { o: '#ff9a3a', y: '#ffd23f', W: '#fff6d8' },
  rows: [' oyyyyo ', 'oyWWWWyo', 'oyWWWWyo', ' oyyyyo ']
};

/** Scatter Blaster pellet: stubby orange chunk (fired in threes). */
export const BULLET_SCATTER: PixelArtSpec = {
  palette: { o: '#ff8a3a', O: '#ffc38a' },
  rows: ['  oo  ', ' oOOo ', 'oOOOOo', ' oOOo ', '  oo  ']
};

/** Rapid Carbine dart: slim cyan tracer with a hot tip. */
export const BULLET_RAPID: PixelArtSpec = {
  palette: { c: '#2a6a8a', C: '#4fc3e8', W: '#d8f4ff' },
  rows: ['   cCCWW', 'ccCCCWWWW', '   cCCWW']
};

/** Enemy plasma orb. */
export const BULLET_ENEMY: PixelArtSpec = {
  palette: { r: '#d63a3a', R: '#ff6a5a', W: '#ffd6c8' },
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
    B: '#8a6a3a', // frame
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
    g: '#527a3f', // grass
    G: '#6a9a4f', // grass light
    d: '#4a3b2c', // dirt
    D: '#413325', // dirt shade
    s: '#5d4e3a' // stone
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
  palette: { y: '#e8c832', k: '#242424' },
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

/** Broad-leaf jungle bush prop. */
export const PROP_BUSH: PixelArtSpec = {
  palette: { b: '#1d3a2a', B: '#2c543a', G: '#3f7350' },
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
  palette: { r: '#4a4f58', R: '#33373f', h: '#68707d' },
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
  palette: { r: '#22334a', R: '#2e435f', w: '#182639' },
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
  palette: { t: '#241d18', T: '#33291f' },
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
  palette: { r: '#16283a', R: '#24405c' },
  rows: ridgeRows(RIDGE_PROFILE, 20)
};

/** Every sprite texture the game registers at scene start. */
export const SPRITE_SPECS = {
  'art/player-idle': PLAYER_IDLE,
  'art/player-run-a': PLAYER_RUN_A,
  'art/player-run-b': PLAYER_RUN_B,
  'art/player-jump': PLAYER_JUMP,
  'art/player-crouch': PLAYER_CROUCH,
  'art/player-aim-up': PLAYER_AIM_UP,
  'art/player-aim-diag': PLAYER_AIM_DIAG,
  'art/player-hurt': PLAYER_HURT,
  'art/player-death': PLAYER_DEATH,
  'art/enemy-runner': ENEMY_RUNNER,
  'art/enemy-sentry': ENEMY_SENTRY,
  'art/enemy-grenadier': ENEMY_GRENADIER,
  'art/enemy-drone': ENEMY_DRONE,
  'art/bullet-pulse': BULLET_PULSE,
  'art/bullet-scatter': BULLET_SCATTER,
  'art/bullet-rapid': BULLET_RAPID,
  'art/bullet-enemy': BULLET_ENEMY,
  'art/pickup-crate': PICKUP_CRATE,
  'art/tile-ground': TILE_GROUND,
  'art/tile-hazard': TILE_HAZARD,
  'art/prop-bush': PROP_BUSH,
  'art/prop-rock': PROP_ROCK,
  'art/bg-ruin': BG_RUIN,
  'art/bg-tree': BG_TREE,
  'art/bg-ridge': BG_RIDGE,
  'art/bg-stars': BG_STARS
} as const;

export type SpriteKey = keyof typeof SPRITE_SPECS;
