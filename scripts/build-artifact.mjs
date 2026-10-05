// Builds one self-contained page (dist-web/sengoku-soldier.html) for publishing as a claude.ai Artifact.
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const js = await build({ entryPoints: ['web/main.ts'], bundle: true, format: 'iife', minify: true, write: false, target: 'es2020' });
const css = readFileSync('web/style.css', 'utf8');
const body = readFileSync('web/body.html', 'utf8');
const page = `<title>Sengoku Soldier</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@400;600;800&family=Spectral:ital,wght@0,400;0,500;1,400&display=swap">
<style>
${css}</style>
${body}
<script>
${js.outputFiles[0].text}</script>
`;
mkdirSync('dist-web', { recursive: true });
writeFileSync('dist-web/sengoku-soldier.html', page);
console.log(`dist-web/sengoku-soldier.html ${(page.length / 1024).toFixed(1)} KB`);
