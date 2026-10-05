import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// One source for the page markup: body.html goes into index.html here and into the published page in scripts/build-artifact.mjs.
const body = () => readFileSync(fileURLToPath(new URL('./body.html', import.meta.url)), 'utf8');

export default defineConfig({
  server: { host: '127.0.0.1' },
  plugins: [{ name: 'body-html', transformIndexHtml: (html) => html.replace('<!--BODY-->', body()) }],
});
