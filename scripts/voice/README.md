# Film narration (voice "George")

The films' fixed lines are spoken by **Kokoro-82M** (voice `bm_george`, speed 0.92), rendered once offline and stored
in `web/films/voice-lines.ts` (16-bit WAV, base64). Live AI voices were measured too slow on the owner's PC (Kokoro
~5× slower than speech, Piper ~1.8× in the browser), so only fixed text is pre-rendered; scenes use the browser voice.

To add or change lines (needs Node and ~350 MB for the model, outside the repo):
1. In an empty folder with a short path: `npm init -y && npm install kokoro-js@1.2.1`
2. Copy both scripts there, edit `LINES` (and `SAY` for pronunciation) in `render-lines.mjs`, run `node render-lines.mjs`.
3. Run `node pack-lines.mjs` (it writes `web/films/voice-lines.ts`; fix its output path if your clone is elsewhere).
The key of each line is the exact caption or `speak` text in `web/films/scenes.ts`.
