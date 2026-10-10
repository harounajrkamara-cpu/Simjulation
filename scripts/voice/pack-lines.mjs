// Packs the rendered narration (float WAV) as 16-bit mono WAV in base64, keyed by the exact film text.
import { readFileSync, writeFileSync } from 'node:fs';
const lines = JSON.parse(readFileSync('lines.json', 'utf8'));
function toPcm16(file) {
  const b = readFileSync(file);
  // find "fmt " and "data" chunks
  let p = 12, fmt, data;
  while (p < b.length) { const id = b.toString('ascii', p, p + 4); const size = b.readUInt32LE(p + 4); if (id === 'fmt ') fmt = { format: b.readUInt16LE(p + 8), ch: b.readUInt16LE(p + 10), rate: b.readUInt32LE(p + 12), bits: b.readUInt16LE(p + 22) }; if (id === 'data') data = b.subarray(p + 8, p + 8 + size); p += 8 + size; }
  const n = fmt.bits === 32 ? data.length / 4 : data.length / 2;
  const out = Buffer.alloc(44 + n * 2);
  for (let i = 0; i < n; i++) {
    const v = fmt.bits === 32 && fmt.format === 3 ? data.readFloatLE(i * 4) : fmt.bits === 32 ? data.readInt32LE(i * 4) / 2147483648 : data.readInt16LE(i * 2) / 32768;
    out.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(v * 32767))), 44 + i * 2);
  }
  out.write('RIFF', 0); out.writeUInt32LE(36 + n * 2, 4); out.write('WAVE', 8); out.write('fmt ', 12); out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20); out.writeUInt16LE(1, 22); out.writeUInt32LE(fmt.rate, 24); out.writeUInt32LE(fmt.rate * 2, 28); out.writeUInt16LE(2, 32); out.writeUInt16LE(16, 34);
  out.write('data', 36); out.writeUInt32LE(n * 2, 40);
  return { b64: out.toString('base64'), info: fmt };
}
const entries = lines.map((l) => { const r = toPcm16(l.file); return { text: l.text, b64: r.b64, info: r.info }; });
console.log(entries[0].info, entries.reduce((s, e) => s + e.b64.length, 0), 'base64 chars');
const ts = `// Pre-rendered film narration (owner choice Oct 10: the AI voice "George", Kokoro-82M bm_george, made once offline
// with scripts in the session; the live voice is too slow on the owner's PC). Keyed by the exact caption or card text.
export const VOICE_LINES: Record<string, string> = {
${entries.map((e) => `  ${JSON.stringify(e.text)}: '${e.b64}',`).join('\n')}
};
`;
writeFileSync('C:/Users/harou/Simjulation/web/films/voice-lines.ts', ts);
console.log('written');
