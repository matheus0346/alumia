import { readFile, cp, rm } from 'node:fs/promises';
const source = new URL('../dist/', import.meta.url);
if (JSON.parse(await readFile(new URL('build-mode.json', source))).mode !== 'pilot') throw new Error('Refusing to publish demonstration as pilot.');
const target = new URL('../backend/public/app/', import.meta.url);
await rm(target, { recursive: true, force: true });
await cp(source, target, { recursive: true });
console.log('React pilot copied to backend/public/app.');
