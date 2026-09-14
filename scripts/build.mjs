import { cp, mkdir, readdir, rm } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist');
for (const name of await readdir('.')) {
  if (/\.(html|css|js|txt)$/.test(name)) await cp(name, `dist/${name}`);
}
for (const dir of ['assets', 'android-beta']) await cp(dir, `dist/${dir}`, { recursive: true });
console.log('Built static website in dist/');
