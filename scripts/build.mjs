import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

// Windows: esbuild sometimes fails to clean up files in the system temp folder
// (AV / locked handles). Point TEMP at a project-local folder for the build.
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const tmp = path.join(root, '.tmp');
mkdirSync(tmp, { recursive: true });
process.env.TEMP = tmp;
process.env.TMP = tmp;

const { build } = await import('vite');
await build({ root, logLevel: 'info' });
