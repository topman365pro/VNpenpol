import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { buildSeedDatabase } from './story-data.mjs';

const dataDir = path.join(process.cwd(), 'data');
const dataFile = path.join(dataDir, 'db.json');
const timestamp = new Date().toISOString();
const seed = buildSeedDatabase(timestamp);

await mkdir(dataDir, { recursive: true });
await writeFile(dataFile, JSON.stringify(seed, null, 2));
console.log(`Wrote demo database to ${dataFile}`);
