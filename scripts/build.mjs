import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = path.join(root, 'dist');
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
let html = await readFile(path.join(root, 'index.html'), 'utf8');
for (const file of ['styles.css', 'scene.js', 'favicon.svg']) {
  const content = await readFile(path.join(root, file));
  const hash = createHash('sha256').update(content).digest('hex').slice(0, 12);
  const extension = path.extname(file);
  const versioned = `${path.basename(file, extension)}.${hash}${extension}`;
  await writeFile(path.join(output, versioned), content);
  html = html.replaceAll(`/${file}`, `/${versioned}`);
}
await writeFile(path.join(output, 'index.html'), html);
for (const file of ['_headers', 'robots.txt']) {
  await cp(path.join(root, file), path.join(output, file));
}
await cp(path.join(root, 'assets'), path.join(output, 'assets'), { recursive: true });
console.log('Built static site in dist/');
