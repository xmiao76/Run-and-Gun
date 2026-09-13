import { readFileSync, writeFileSync } from 'node:fs';
import { nearestPaletteColour } from '../src/art/palette.ts';

// Hand-tuned exceptions to the nearest-distance mapping: the cases where
// distance and meaning disagree (identity colours, semantic tints).
const OVERRIDES = {
  '#331111': '#7a2a20', // boss bar back: dark red is meaningful (damaged portion)
  '#ffd070': '#ffee88', // boss vulnerable tint: warm gold, not skin
  '#3a2a44': '#4a2a52', // grenadier shade: purple identity
  '#584a66': '#7a4a8a', // purple horizon silhouette: purple identity
  '#3f5e58': '#2c543a'  // jungle dusk horizon: green-teal, not grey
};

const files = ['src/art/sprites.ts', 'src/art/textures.ts'];
let changed = 0;
for (const file of files) {
  let text = readFileSync(file, 'utf8');
  text = text.replace(/#[0-9a-f]{6}\b/gi, (colour) => {
    const lower = colour.toLowerCase();
    const mapped = OVERRIDES[lower] ?? nearestPaletteColour(lower);
    if (mapped.toLowerCase() !== lower) changed += 1;
    return mapped;
  });
  writeFileSync(file, text, 'utf8');
}
console.log(`palette-migrate: rewrote ${changed} colour literals across ${files.join(', ')}`);
