import { cp, mkdir, readdir, rm } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist');
for (const name of await readdir('.')) {
  if (/\.(html|css|js|txt)$/.test(name)) await cp(name, `dist/${name}`);
}
await cp('assets', 'dist/assets', { recursive: true });
console.log('Built static website in dist/');
