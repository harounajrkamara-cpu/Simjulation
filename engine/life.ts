import { GameState } from './types';

// "Li's life" (owner, Oct 12: "he is a vague slave; I don't know what kind of slave, what he must do, where he must
// sleep"). Only canon: World Bible §10.3–10.4, Atlas §4 and §12, and the engine's own texts. Shown in the Li tab and
// given to the Game Master, so every scene keeps to the same life. Nothing here is new world-building.

export interface LifeLine { label: string; text: string }

export function liLife(s: GameState): LifeLine[] {
  const c = s.characters[s.liId];
  if (c.status !== 'slave') return [];
  return [
    { label: 'Whose', text: 'The slave of Mikumo Raizen, "the Red Crane", a famous rōnin who leads a mercenary band of about 120 men. Raizen bought him at the Kinza slave market in Year 96. The quartermaster, Matsukaze Rokubei, keeps his papers.' },
    { label: 'Where', text: 'With the band in its camp below Kōri fort, Akaishi province, on the Kurogane side of the Kurose river. Lord Hagiwara has hired the band to hold the border. Across the river: Suiren.' },
    { label: 'His work', text: 'Carries gear, cleans armour, cares for the horses, digs latrines, and helps Old Sukezō cook and treat the wounded. On raid days he works in the baggage line.' },
    { label: 'Who gives orders', text: 'Raizen owns him. Gonza "One-Ear", Raizen\'s second, drives the slaves and beats them. Rokubei counts the money and the papers. Sukezō runs the cook fire.' },
    { label: 'Where he sleeps', text: 'On the straw by the horse lines, with the band\'s slaves.' },
    { label: 'His own time', text: 'Evenings and nights: the soldiers\' fire (rumours), letters with Sukezō in secret, and, in secret, practice with two sticks behind the horse lines.' },
    { label: 'What is dangerous', text: 'Idling where Gonza can see. Being caught with a weapon. Running away: a runaway slave is hunted (Tatara, over the Black Hills, has no slavery). Kurogane law is harsh and punishes groups for one man\'s crime.' },
    { label: 'The way out', text: 'The goals panel shows the routes Li knows of. Kurogane law lets even a slave earn freedom in its service.' },
  ];
}

/** The same life as one block of Claude's memory. */
export function liLifeText(s: GameState): string {
  const lines = liLife(s);
  return lines.length ? `LI'S LIFE AS A SLAVE (keep every scene true to it):\n${lines.map((l) => `- ${l.label}: ${l.text}`).join('\n')}` : '';
}
