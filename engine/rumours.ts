import { FADE } from './relations';
import { Draft, GameState, Memory } from './types';

// Rumour spreading (World Bible ch. 8 "NPC memory", ch. 12b #2, Numbers §8).
// Fixed rules, no dice: every night at the fire, each rumour moves one step along who talks to whom.

/** Who passes things on to whom (same place only). Hisame is silent; Ishizue and Sayo do not gossip with the band. */
export const TALKS_TO: Record<string, string[]> = {
  raizen: ['rokubei', 'gonza'],
  gonza: ['raizen', 'rokubei'],
  rokubei: ['raizen', 'sukezo'],
  sukezo: ['hachi'],
  hachi: ['sukezo'],
  kaname: ['daisuke'],
  daisuke: ['kaname'],
};

export const RUMOUR = {
  /** Below this weight or certainty a story is not worth retelling. */
  minWeight: 25,
  minCertainty: 30,
  /** Certainty lost when a witness tells it, and on every later retelling. */
  toldLoss: 10,
  rumourLoss: 20,
  /** Each retelling keeps this share of the weight. */
  weightKeep: 0.75,
  /** Each retelling, numbers grow by this step (ch. 12b #2). */
  numberStep: 1.25,
  /** Details in [brackets] drop out below this certainty. */
  detailCertainty: 60,
  /** Visible signs per night (ch. 11: max 1–3 alerts). */
  maxSigns: 2,
} as const;

/** One retelling: numbers grow by a fixed step, uncertain details drop out. */
export function retell(what: string, certainty: number): string {
  let out = what.replace(/\d+/g, (m) => {
    const n = Number(m);
    if (n < 2) return m;
    const g = n * RUMOUR.numberStep;
    return String(g >= 50 ? Math.round(g / 10) * 10 : Math.round(g));
  });
  if (certainty < RUMOUR.detailCertainty) out = out.replace(/\s*\[[^\]]*\]/g, '');
  return out;
}

/** Memory text without the detail brackets, for showing. */
export function plainMemory(what: string): string {
  return what.replace(/\[([^\]]*)\]/g, '$1');
}

/** The drafts for one night of talk at the fire. Deterministic: memories in id order, listeners in list order. */
export function spreadDrafts(s: GameState, met: (id: string) => boolean): Draft[] {
  const out: Draft[] = [];
  const known = new Set(s.memories.filter((m) => m.key).map((m) => `${m.npc}|${m.key}`));
  const tellers = [...s.memories].filter((m) => m.key).sort((a, b) => a.id - b.id);
  let signs = 0;
  for (const m of tellers) {
    if (m.weight < RUMOUR.minWeight || m.certainty < RUMOUR.minCertainty) continue;
    const teller = s.characters[m.npc];
    if (!teller?.alive) continue;
    for (const hearer of TALKS_TO[m.npc] ?? []) {
      const h = s.characters[hearer];
      if (!h?.alive || h.location !== teller.location || hearer === s.liId) continue;
      if (known.has(`${hearer}|${m.key}`)) continue;
      known.add(`${hearer}|${m.key}`);
      const certainty = m.certainty - (m.source === 'saw' ? RUMOUR.toldLoss : RUMOUR.rumourLoss);
      const heard: Omit<Memory, 'id' | 'day'> = {
        npc: hearer,
        what: retell(m.what, certainty),
        source: m.source === 'saw' ? 'told' : 'rumour',
        certainty,
        weight: Math.floor(m.weight * RUMOUR.weightKeep),
        key: m.key,
        from: m.npc,
        rel: m.rel,
        sign: m.sign,
      };
      out.push({ type: 'memory', fact: `${h.name} hears from ${teller.name}: ${plainMemory(heard.what)} (certainty ${certainty})`, visible: false, data: { ...heard } });
      if (m.rel) {
        // A cruel hearer resents good news about Li instead of respecting it.
        const resents = m.rel.value > 0 && h.traits.includes('cruel');
        const field = resents ? 'rivalry' : m.rel.field;
        const value = Math.round((m.rel.value * certainty) / 100);
        if (value !== 0) out.push({ type: 'relation', fact: `${hearer}: ${field} ${value > 0 ? '+' : ''}${value} (heard a rumour)`, visible: false, data: { npc: hearer, field, value, reason: `Heard: ${plainMemory(heard.what)}`, fade: FADE.rumour } });
        if (m.sign && met(hearer) && signs < RUMOUR.maxSigns && Math.abs(value) >= 3) {
          signs++;
          out.push({ type: 'rumour', fact: m.sign.replace('{name}', h.name), visible: true, data: { npc: hearer, key: m.key } });
        }
      }
    }
  }
  return out;
}
