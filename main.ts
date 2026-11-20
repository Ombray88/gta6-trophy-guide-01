// Leonida Trophy Tracker: offline GTA VI trophy guide + tracker, 55 trophies with cited guides, roadmap, missable flag
// This entry program copies the guide and its screenshots and writes the judge dossier.

import { cpSync, existsSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

const screenshotsDir = join(here, 'screenshots');
if (!existsSync(screenshotsDir)) {
  throw new Error(`Screenshots directory does not exist: ${screenshotsDir}`);
}
const shotFiles = readdirSync(screenshotsDir).filter(f => /\.(png|jpg|jpeg)$/i.test(f));
if (shotFiles.length < 1 || shotFiles.length > 4) {
  throw new Error(`Expected 1 to 4 PNG/JPEG screenshots in ${screenshotsDir}, but found ${shotFiles.length}: ${shotFiles.join(', ')}`);
}

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
