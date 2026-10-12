// Pre-renders the films' fixed narration with Kokoro (voice: George) for web/films/voice-lines.ts.
import { KokoroTTS } from 'kokoro-js';
import { writeFileSync } from 'node:fs';
const LINES = [
  'For four hundred years, one Empire ruled the land.',
  'Then the capital burned.',
  'Seven Wardens crowned themselves. Seven kingdoms.',
  'A hundred years of war.',
  "In Suiren a peasant's son rose with two swords. They called him the Twin Demon.",
  'In Year 95 he fell on a night road. "Kurogane raiders," the songs say.',
  "One boy. Seven kingdoms at war. A father's name he must not say.",
  'Shinken no Ryū.',
];
const SAY = { 'Shinken no Ryū.': 'Shinken no Ryoo.', 'In Year 95 he fell on a night road. "Kurogane raiders," the songs say.': 'In year ninety-five he fell on a night road. "Kurogane raiders," the songs say.' };
const tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'q8', device: 'cpu' });
const out = [];
for (const [k, line] of LINES.entries()) {
  const a = await tts.generate(SAY[line] ?? line, { voice: 'bm_george', speed: 0.92 });
  const file = `line${k}.wav`;
  await a.save(file);
  out.push({ text: line, file, seconds: +(a.audio.length / a.sampling_rate).toFixed(2) });
  console.log(file, out.at(-1).seconds);
}
writeFileSync('lines.json', JSON.stringify(out, null, 2));
