// The world's houses and people as records (Phase 6 block B, audit gaps 1, 2, 8; owner Oct 17 "build everything").
// Copied from docs/WORLD_ATLAS.md §3–§5 and §10 (Year 100). Numbers for prestige, Crown loyalty and cohesion are
// PROVISIONAL starting values read from the Atlas text (owner kan terugdraaien). The 🔒 secrets go to Claude only for
// people Li has met (engine/houses.ts), never to the player.

export interface HouseSeed {
  id: string; name: string; kingdom: string; tier: 'royal' | 'A' | 'B' | 'C'; land: string; koku: number; troops: number;
  prestige: number; crownLoyalty: number; cohesion: number; head?: string; heir?: string; faction?: string; liege?: string;
  branches?: { name: string; koku: number }[]; allies?: string[]; hostage?: string; goal?: string; secret?: string;
}

/** [id, name, age, ranks ("S B · C C · W D"), role, kingdom, house, place, goal, secret?, traits?] */
export type PersonRow = [string, string, number, string, string, string, string, string, string, string?, string?];

export const HOUSES: HouseSeed[] = [
  // ── Kurogane (Atlas §3.1) ──
  { id: 'asagiri', name: 'Asagiri', kingdom: 'kurogane', tier: 'royal', land: 'the Crown land of Kurogane (Seikyō)', koku: 3_800_000, troops: 82_000, prestige: 85, crownLoyalty: 100, cohesion: 45, head: 'asagiri_tokinari', goal: 'the young king ruling alone at twenty', secret: 'the Queen Mother bore two secret sons to Gōda Ensai' },
  { id: 'tsurumaki', name: 'Tsurumaki', kingdom: 'kurogane', tier: 'A', land: 'two old heartland provinces', koku: 600_000, troops: 13_000, prestige: 75, crownLoyalty: 35, cohesion: 65, head: 'tsurumaki_sanetaka', heir: 'tsurumaki_kagetoshi', faction: 'old_blood', liege: 'asagiri', goal: 'restore noble privilege', secret: 'in contact with Gōda' },
  { id: 'kamio', name: 'Kamio', kingdom: 'kurogane', tier: 'A', land: 'the northern pass province on the Kitakaze border', koku: 350_000, troops: 7_500, prestige: 60, crownLoyalty: 85, cohesion: 55, head: 'kamio_ujihide', heir: 'kamio_seijuro', faction: 'kings_men', liege: 'asagiri', goal: 'hold the north', secret: 'his border guards are bribed: the Kitakaze assassin will pass here' },
  { id: 'hagiwara', name: 'Hagiwara', kingdom: 'kurogane', tier: 'A', land: 'Akaishi, the southern border province on the Suiren border', koku: 300_000, troops: 6_500, prestige: 50, crownLoyalty: 60, cohesion: 60, head: 'hagiwara_munenori', heir: 'hagiwara_tadaoki', liege: 'asagiri', branches: [{ name: 'Ishizue of Kōri', koku: 8_000 }], goal: 'survive the Suiren raids after losing 2,000 men last year', secret: "smuggles rice to Suiren's western border lords for profit" },
  { id: 'goda', name: 'Gōda', kingdom: 'kurogane', tier: 'A', land: 'two provinces granted by the Queen Mother', koku: 300_000, troops: 6_500, prestige: 40, crownLoyalty: 20, cohesion: 70, head: 'goda_ensai', faction: 'favourite', liege: 'asagiri', goal: 'the coup', secret: 'Gōda is no eunuch; he plans to put his own son on the throne' },
  { id: 'ebisawa', name: 'Ebisawa', kingdom: 'kurogane', tier: 'A', land: 'one granted province', koku: 250_000, troops: 5_500, prestige: 55, crownLoyalty: 50, cohesion: 60, head: 'ebisawa_rokusai', heir: 'ebisawa_toma', faction: 'chancellor', liege: 'asagiri', goal: 'keep governing after the king comes of age', secret: "was the Queen Mother's lover; brought Gōda to court to get rid of her" },
  { id: 'kirishima', name: 'Kirishima', kingdom: 'kurogane', tier: 'A', land: 'one province, granted for merit', koku: 200_000, troops: 4_500, prestige: 65, crownLoyalty: 90, cohesion: 70, head: 'kirishima_hyoe', heir: 'kirishima_ryunosuke', faction: 'kings_men', liege: 'asagiri', goal: 'prove commoners can lead', secret: 'Hyōe can barely read; a scribe hides it' },
  { id: 'ishizue', name: 'Ishizue', kingdom: 'kurogane', tier: 'C', land: 'Kōri District under the Hagiwara; Kōri fort', koku: 8_000, troops: 180, prestige: 25, crownLoyalty: 60, cohesion: 60, head: 'ishizue', liege: 'hagiwara', goal: 'hold Kōri fort' },
  // ── Suiren (Atlas §3.2) ──
  { id: 'hasunuma', name: 'Hasunuma', kingdom: 'suiren', tier: 'royal', land: 'the Crown land of Suiren (Hanaoka); keeps the Jade Seal', koku: 3_000_000, troops: 66_000, prestige: 80, crownLoyalty: 100, cohesion: 40, head: 'hasunuma_tadafusa', heir: 'hasunuma_kiyotaka', goal: 'survive', secret: 'the king writes coded poems to the reformers' },
  { id: 'shirasagi', name: 'Shirasagi', kingdom: 'suiren', tier: 'A', land: 'court and treasury', koku: 1_400_000, troops: 30_000, prestige: 85, crownLoyalty: 30, cohesion: 65, head: 'shirasagi_nobuhisa', faction: 'suiren_families', liege: 'hasunuma', goal: 'keep the Three in power', secret: 'Shirasagi gave the order to murder Hattori Takeshi' },
  { id: 'akabane', name: 'Akabane', kingdom: 'suiren', tier: 'A', land: 'the field army of Suiren', koku: 1_500_000, troops: 32_000, prestige: 85, crownLoyalty: 30, cohesion: 60, head: 'akabane_gendayu', heir: 'akabane_kurodo', faction: 'suiren_families', liege: 'hasunuma', goal: 'the field army forever in Akabane hands', secret: 'Gendayū set the trap for Takeshi and keeps his blade Kage as a trophy' },
  { id: 'kinugasa', name: 'Kinugasa', kingdom: 'suiren', tier: 'A', land: 'silk and trade', koku: 1_300_000, troops: 28_000, prestige: 80, crownLoyalty: 35, cohesion: 70, head: 'kinugasa_ayane', heir: 'kinugasa_haruki', faction: 'suiren_families', liege: 'hasunuma', goal: 'outplay Shirasagi', secret: 'Lady Ayane voted against the murder of Takeshi and kept the proof' },
  { id: 'tono', name: 'Tōno', kingdom: 'suiren', tier: 'A', land: 'the western border facing Kurogane (Sekiba fortress)', koku: 400_000, troops: 9_000, prestige: 55, crownLoyalty: 70, cohesion: 65, head: 'tono_shigemasa', faction: 'suiren_border', liege: 'hasunuma', goal: 'hold the Kurose', secret: 'suspects the truth about the murder' },
  { id: 'okitsu', name: 'Okitsu', kingdom: 'suiren', tier: 'A', land: 'the eastern border march', koku: 500_000, troops: 11_000, prestige: 50, crownLoyalty: 30, cohesion: 70, head: 'okitsu_hirotsugu', heir: 'okitsu_tomaru', faction: 'suiren_border', liege: 'hasunuma', hostage: 'okitsu_tomaru', goal: 'break away when it is safe', secret: 'will break away once his hostage son is safe' },
  // ── Hayate (Atlas §3.3) ──
  { id: 'shinonome', name: 'Shinonome', kingdom: 'hayate', tier: 'royal', land: 'the Crown land of Hayate (Tsujikaze)', koku: 1_600_000, troops: 36_000, prestige: 70, crownLoyalty: 100, cohesion: 55, head: 'shinonome_haruyuki', heir: 'shinonome_akitoshi', goal: 'a kingdom that obeys its king' },
  { id: 'kagami', name: 'Kagami', kingdom: 'hayate', tier: 'A', land: 'the Kagami lands', koku: 500_000, troops: 11_000, prestige: 90, crownLoyalty: 70, cohesion: 75, head: 'kagami_soun', heir: 'kagami_shion', faction: 'hayate_generals', liege: 'shinonome', goal: 'keep the people safe' },
  { id: 'homura', name: 'Homura', kingdom: 'hayate', tier: 'A', land: 'the Homura lands', koku: 400_000, troops: 9_000, prestige: 75, crownLoyalty: 65, cohesion: 70, head: 'homura_tetsuzan', faction: 'hayate_generals', liege: 'shinonome', goal: 'glory in battle', secret: 'hates Ugaki' },
  { id: 'tobita', name: 'Tobita', kingdom: 'hayate', tier: 'A', land: 'the Tobita lands', koku: 300_000, troops: 7_000, prestige: 65, crownLoyalty: 45, cohesion: 65, head: 'tobita_kojuro', faction: 'hayate_generals', liege: 'shinonome', goal: 'rise higher', secret: 'secretly gathering support; in talks with Sakaguchi of Takane' },
  { id: 'kurokoma', name: 'Kurokoma', kingdom: 'hayate', tier: 'A', land: 'the horse farms of the Sea of Grass', koku: 450_000, troops: 10_000, prestige: 70, crownLoyalty: 50, cohesion: 65, head: 'kurokoma_yasuie', liege: 'shinonome', goal: 'sell horses to whoever pays' },
  { id: 'ugaki', name: 'Ugaki', kingdom: 'hayate', tier: 'A', land: 'a granted domain near the capital', koku: 200_000, troops: 4_500, prestige: 45, crownLoyalty: 60, cohesion: 50, head: 'ugaki_joan', faction: 'hayate_favourite', liege: 'shinonome', goal: "the king's ear, and silver from anyone", secret: 'ready to be bought to call Kagami a traitor' },
  // ── Ushio (Atlas §3.4) ──
  { id: 'wadatsumi', name: 'Wadatsumi', kingdom: 'ushio', tier: 'royal', land: 'the Crown land of Ushio (Kaisei)', koku: 1_750_000, troops: 35_000, prestige: 65, crownLoyalty: 100, cohesion: 40, head: 'wadatsumi_chikamaru', goal: 'a child king kept safe' },
  { id: 'tagami', name: 'Tagami', kingdom: 'ushio', tier: 'A', land: 'the Tagami lands', koku: 900_000, troops: 18_000, prestige: 80, crownLoyalty: 40, cohesion: 70, head: 'tagami_kanemitsu', heir: 'tagami_shinsuke', faction: 'ushio_regent', liege: 'wadatsumi', goal: 'the throne, bloodless', secret: 'the regent waits for the moment to claim the throne; his son would murder the child' },
  { id: 'isonokami', name: 'Isonokami', kingdom: 'ushio', tier: 'A', land: 'the Isonokami lands and the fleet', koku: 500_000, troops: 10_000, prestige: 75, crownLoyalty: 85, cohesion: 70, head: 'isonokami_hyobu', heir: 'isonokami_nami', faction: 'ushio_royalists', liege: 'wadatsumi', goal: 'the child king on his throne' },
  { id: 'hamazaki', name: 'Hamazaki', kingdom: 'ushio', tier: 'A', land: 'salt and iron', koku: 400_000, troops: 8_000, prestige: 55, crownLoyalty: 55, cohesion: 60, faction: 'ushio_trade', liege: 'wadatsumi', goal: 'salt and iron prices' },
  // ── Takane (Atlas §3.5) ──
  { id: 'kiriyama', name: 'Kiriyama', kingdom: 'takane', tier: 'royal', land: 'the main house of Takane (Kumoi)', koku: 1_120_000, troops: 24_750, prestige: 70, crownLoyalty: 100, cohesion: 65, head: 'kiriyama_yoritsugu', heir: 'kiriyama_yorinao', faction: 'takane_loyalists', goal: 'balance everyone' },
  { id: 'okura', name: 'Ōkura', kingdom: 'takane', tier: 'A', land: 'the Ōkura lands', koku: 350_000, troops: 7_700, prestige: 55, crownLoyalty: 80, cohesion: 60, head: 'okura_morinaga', faction: 'takane_loyalists', liege: 'kiriyama', goal: 'peace with Hayate' },
  { id: 'shiraiwa', name: 'Shiraiwa', kingdom: 'takane', tier: 'A', land: 'the copper mines (the poorest house)', koku: 230_000, troops: 5_000, prestige: 40, crownLoyalty: 85, cohesion: 80, head: 'shiraiwa_yasutoki', heir: 'shiraiwa_tota', faction: 'takane_loyalists', liege: 'kiriyama', goal: 'keep his oath', secret: "Yasutoki hides Li's mother and sisters in a mining village and holds Takeshi's second blade, Hikari" },
  { id: 'haguro', name: 'Haguro', kingdom: 'takane', tier: 'A', land: 'the Eastern Pass', koku: 270_000, troops: 6_000, prestige: 50, crownLoyalty: 55, cohesion: 65, head: 'haguro_nagatoki', faction: 'takane_ambitious', liege: 'kiriyama', goal: 'a seat at the top table' },
  { id: 'sakaguchi', name: 'Sakaguchi', kingdom: 'takane', tier: 'A', land: 'the Southern Pass and its tolls', koku: 520_000, troops: 11_500, prestige: 60, crownLoyalty: 35, cohesion: 60, head: 'sakaguchi_sadatomo', faction: 'takane_separatists', liege: 'kiriyama', goal: 'the pass for himself', secret: 'in secret talks with Tobita of Hayate' },
  // ── Tatara (Atlas §3.6) ──
  { id: 'tatara', name: 'Tatara', kingdom: 'tatara', tier: 'royal', land: 'the Crown land of Tatara (Hinokuchi)', koku: 960_000, troops: 20_000, prestige: 75, crownLoyalty: 100, cohesion: 85, head: 'tatara_shigekuni', heir: 'tatara_kunimaru', goal: 'a kingdom that obeys and forges' },
  { id: 'kanemori', name: 'Kanemori', kingdom: 'tatara', tier: 'A', land: 'the sword forges', koku: 120_000, troops: 2_500, prestige: 60, crownLoyalty: 95, cohesion: 80, liege: 'tatara', goal: 'the best blades' },
  { id: 'hibiki', name: 'Hibiki', kingdom: 'tatara', tier: 'A', land: 'the crossbow workshops', koku: 120_000, troops: 2_500, prestige: 55, crownLoyalty: 95, cohesion: 80, liege: 'tatara', goal: 'the best crossbows' },
  // ── Kitakaze (Atlas §3.7) ──
  { id: 'fuyutsuki', name: 'Fuyutsuki', kingdom: 'kitakaze', tier: 'royal', land: 'the Crown land of Kitakaze (Shirotori)', koku: 700_000, troops: 15_750, prestige: 65, crownLoyalty: 100, cohesion: 55, head: 'fuyutsuki_takamune', heir: 'fuyutsuki_hayato', faction: 'kitakaze_crown', goal: 'the war chiefs bound to the king', secret: 'the crown prince plans to kill the king of Kurogane' },
  { id: 'garyu', name: 'Garyū', kingdom: 'kitakaze', tier: 'A', land: 'the Garyū lands', koku: 300_000, troops: 6_750, prestige: 85, crownLoyalty: 60, cohesion: 75, head: 'garyu_tessai', faction: 'kitakaze_chiefs', liege: 'fuyutsuki', goal: 'no war with Kurogane' },
  { id: 'shiramine', name: 'Shiramine', kingdom: 'kitakaze', tier: 'A', land: 'the horse-archer clans', koku: 300_000, troops: 6_750, prestige: 65, crownLoyalty: 60, cohesion: 70, head: 'shiramine_akane', heir: 'shiramine_tsubasa', faction: 'kitakaze_chiefs', liege: 'fuyutsuki', goal: 'glory in the north' },
];

export const PEOPLE: PersonRow[] = [
  // Kurogane
  ['asagiri_tokinari', 'King Asagiri Tokinari', 19, 'S B · C C · W D', 'the young King of Kurogane', 'kurogane', 'asagiri', 'seikyo', 'rule alone at twenty, then unite the land', 'suspects his mother is hiding something', 'cold, patient, believes in merit'],
  ['asagiri_kaede', 'Queen Mother Asagiri Kaede', 37, 'S C', 'the Queen Mother of Kurogane', 'kurogane', 'asagiri', 'seikyo', 'keep her power after her son comes of age', 'two secret sons with Gōda Ensai', 'proud, lonely, reckless'],
  ['ebisawa_rokusai', 'Chancellor Ebisawa Rokusai', 56, 'S A', 'Chancellor of Kurogane', 'kurogane', 'ebisawa', 'seikyo', 'stay the real ruler', "was Kaede's lover; terrified of exposure", 'brilliant administrator'],
  ['ebisawa_toma', 'Ebisawa Tōma', 30, 'S C', "the Chancellor's adopted son", 'kurogane', 'ebisawa', 'seikyo', 'inherit his father\'s place'],
  ['goda_ensai', 'Gōda Ensai', 32, 'S C · W C', "the Queen Mother's favourite, lord of two provinces", 'kurogane', 'goda', 'seikyo', 'power, and protecting his sons', 'not a eunuch; plans a coup before the king turns twenty'],
  ['otori_gensai', 'Ōtori Gensai', 58, 'C S- · W B+', 'Pillar seat 1, "the Walking Mountain"', 'kurogane', '', 'seikyo', 'keep the kingdom standing', 'has quietly started choosing successors', 'serves the Crown, not factions'],
  ['kirishima_hyoe', 'Kirishima Hyōe', 44, 'W A · C B', 'Pillar seat 2, born a peasant', 'kurogane', 'kirishima', 'seikyo', 'prove commoners can lead', 'can barely read; a scribe hides it', 'savage, instinctual, the King\'s man'],
  ['kirishima_ryunosuke', 'Kirishima Ryūnosuke', 17, 'W C', "son of the peasant-born general", 'kurogane', 'kirishima', 'seikyo', 'outshine his father', undefined, 'proud, hungry'],
  ['tsurumaki_sanetaka', 'Tsurumaki Sanetaka', 51, 'C B+ · S B', 'Pillar seat 3, head of the Old Blood', 'kurogane', 'tsurumaki', 'seikyo', 'abolish the merit law', 'would back a coup if it brings down the Chancellor'],
  ['tsurumaki_kagetoshi', 'Tsurumaki Kagetoshi', 24, 'W B-', 'heir of the Tsurumaki, a duelist', 'kurogane', 'tsurumaki', 'seikyo', 'prove the Old Blood still rules the field', undefined, 'arrogant'],
  ['nagi_shoma', 'Nagi Shōma', 22, 'C B- · W B', 'Gosennin-shō, prodigy of the merit route', 'kurogane', '', 'seikyo', 'a Pillar seat before thirty', undefined, 'arrogant, gifted'],
  ['kawabe_sekkei', 'Kawabe Sekkei', 45, 'S C', 'canal engineer from Tatara', 'kurogane', '', 'seikyo', 'build the great canal', 'sent by the King of Tatara to drain Kurogane; has begun to love the work'],
  ['kamio_ujihide', 'Kamio Ujihide', 60, 'C B', 'lord of the northern pass', 'kurogane', 'kamio', 'kamio_pass', 'hold the north', 'his border guards are bribed', 'old and loyal'],
  ['kamio_seijuro', 'Kamio Seijūrō', 19, 'S C', "Kamio's grandson, the king's friend", 'kurogane', 'kamio', 'seikyo', 'serve his friend the king'],
  ['hagiwara_munenori', 'Lord Hagiwara Munenori', 49, 'C B-', 'the border lord of Akaishi', 'kurogane', 'hagiwara', 'akaishi', 'survive the Suiren raids', 'smuggles rice to Suiren for profit', 'cautious, pragmatic'],
  ['hagiwara_tadaoki', 'Hagiwara Tadaoki', 26, 'C C · W C', 'heir of the Hagiwara', 'kurogane', 'hagiwara', 'akaishi', 'prove himself to his father'],
  // Suiren
  ['hasunuma_tadafusa', 'King Hasunuma Tadafusa', 44, 'S C', 'the puppet King of Suiren', 'suiren', 'hasunuma', 'hanaoka', 'survive', 'dreams of freedom; writes coded poems to the reformers', 'poet, gentle, tired'],
  ['hasunuma_kiyotaka', 'Crown Prince Hasunuma Kiyotaka', 17, 'S C+ · C D', 'Crown Prince of Suiren', 'suiren', 'hasunuma', 'hanaoka', 'a better Suiren', 'in danger the moment he acts', 'idealistic'],
  ['shirasagi_nobuhisa', 'Shirasagi Nobuhisa', 61, 'S A', 'Grand Chancellor of Suiren', 'suiren', 'shirasagi', 'hanaoka', 'keep the Three in power', 'gave the order to murder Hattori Takeshi'],
  ['akabane_gendayu', 'Akabane Gendayū', 52, 'C A- · W B', 'Dai-Shōgun of Suiren', 'suiren', 'akabane', 'hanaoka', 'the field army forever in Akabane hands', 'set the trap for Takeshi; keeps Kage as a trophy', 'contemptuous of commoners'],
  ['akabane_kurodo', 'Akabane Kurōdo', 28, 'W B+', 'heir of the Akabane', 'suiren', 'akabane', 'hanaoka', 'his father\'s army', undefined, 'cruel'],
  ['akabane_hayame', 'Akabane Hayame', 14, 'W D+', 'youngest son of the Akabane, a sword prodigy', 'suiren', 'akabane', 'hanaoka', 'prove he is the best blade of his age', undefined, 'despises commoners'],
  ['kinugasa_ayane', 'Lady Kinugasa Ayane', 47, 'S S-', 'head of the Kinugasa, "the Silk Spider"', 'suiren', 'kinugasa', 'hanaoka', 'outplay Shirasagi', 'voted against the murder and kept the proof', 'the most cunning of the Three'],
  ['kinugasa_haruki', 'Kinugasa Haruki', 19, 'S C', 'son of Lady Kinugasa', 'suiren', 'kinugasa', 'hanaoka', 'step out of his mother\'s shadow'],
  ['yashiro_seigen', 'Yashiro Seigen', 38, 'S B', 'leader of the Reformers', 'suiren', '', 'hanaoka', 'reform without being murdered for it', undefined, 'afraid but stubborn'],
  ['tono_shigemasa', 'Tōno Shigemasa', 50, 'C B · W B', 'western border lord of Suiren (Sekiba)', 'suiren', 'tono', 'sekiba', 'hold the Kurose', 'suspects the truth about the murder of his old comrade Takeshi'],
  ['okitsu_hirotsugu', 'Okitsu Hirotsugu', 39, 'S B+ · C B', 'eastern border lord of Suiren', 'suiren', 'okitsu', 'okitsu_march', 'his son back', 'will break away when it is safe', 'patient'],
  ['okitsu_tomaru', 'Okitsu Tōmaru', 10, '', 'hostage son of the Okitsu', 'suiren', 'okitsu', 'hanaoka', 'go home'],
  // Hayate
  ['shinonome_haruyuki', 'King Shinonome Haruyuki', 41, 'C C · S C-', 'King of Hayate', 'hayate', 'shinonome', 'tsujikaze', 'generals who obey', undefined, 'proud, insecure, jealous of his generals'],
  ['shinonome_akitoshi', 'Shinonome Akitoshi', 15, '', 'heir of Hayate', 'hayate', 'shinonome', 'tsujikaze', 'live up to the crown', undefined, 'sheltered'],
  ['ugaki_joan', 'Ugaki Jōan', 48, 'S B', "the king's favourite minister", 'hayate', 'ugaki', 'tsujikaze', 'the king\'s ear', 'ready to be bought to call Kagami a traitor', 'greedy, charming'],
  ['kagami_soun', 'Kagami Sōun', 53, 'C S · W B · S B', 'Storm 1, "the Silent Storm"', 'hayate', 'kagami', 'tsujikaze', 'protect the people', 'refuses to flatter the king', 'the best general alive'],
  ['kagami_shion', 'Kagami Shion', 13, 'C D+', "Kagami Sōun's daughter, a strategist prodigy", 'hayate', 'kagami', 'tsujikaze', 'read every battle like a book'],
  ['homura_tetsuzan', 'Homura Tetsuzan', 46, 'W A · C B+', 'Storm 2, a berserker', 'hayate', 'homura', 'tsujikaze', 'glory', 'hates Ugaki', 'his men worship him'],
  ['tobita_kojuro', 'Tobita Kojūrō', 35, 'C A- · S B', 'Storm 3, "the Waiting Snake"', 'hayate', 'tobita', 'tsujikaze', 'rise higher', 'gathering support; in talks with Sakaguchi', 'ambitious'],
  ['kurokoma_yasuie', 'Kurokoma Yasuie', 57, 'S B', 'head of the horse breeders', 'hayate', 'kurokoma', 'sea_of_grass', 'sell horses to whoever pays'],
  // Ushio
  ['wadatsumi_chikamaru', 'King Wadatsumi Chikamaru', 9, '', 'the child King of Ushio', 'ushio', 'wadatsumi', 'kaisei', 'a friend', undefined, 'lonely, clever'],
  ['tagami_kanemitsu', 'Regent Tagami Kanemitsu', 50, 'S A', 'Regent of Ushio', 'ushio', 'tagami', 'kaisei', 'the throne, bloodless', 'waits for the right moment to claim it', 'loved by the people'],
  ['tagami_shinsuke', 'Tagami Shinsuke', 27, 'C B · S C', "the regent's son", 'ushio', 'tagami', 'kaisei', 'the throne soon', 'would murder the child king to speed things up', 'ruthless'],
  ['isonokami_hyobu', 'Grand Admiral Isonokami Hyōbu', 57, 'C B+', 'Grand Admiral of Ushio', 'ushio', 'isonokami', 'kaisei', 'the child king safe'],
  ['isonokami_nami', 'Isonokami Nami', 14, 'C D', "the admiral's granddaughter, born on ships", 'ushio', 'isonokami', 'kaisei', 'a fleet of her own'],
  ['daikokuya_jinbei', 'Daikokuya Jinbei', 60, 'S B+', 'head of the Trade Council', 'ushio', '', 'kaisei', 'open harbours'],
  ['hakuun', 'Master Hakuun', 70, 'S B', 'head of the Seiran Academy', 'ushio', '', 'kaisei', 'learning for the able, whoever they are'],
  // Takane
  ['kiriyama_yoritsugu', 'King Kiriyama Yoritsugu', 55, 'S B · C B-', 'King of Takane', 'takane', 'kiriyama', 'kumoi', 'balance everyone', undefined, 'cautious'],
  ['kiriyama_yorinao', 'Kiriyama Yorinao', 26, 'C C', 'heir of Takane', 'takane', 'kiriyama', 'kumoi', 'serve well', undefined, 'dutiful'],
  ['okura_morinaga', 'Ōkura Morinaga', 58, 'S C', 'head of the Ōkura', 'takane', 'okura', 'kumoi', 'peace with Hayate'],
  ['shiraiwa_yasutoki', 'Shiraiwa Yasutoki', 42, 'W C · S D', 'head of the Shiraiwa (copper mines)', 'takane', 'shiraiwa', 'shiraiwa_village', 'keep his father\'s oath', "hides Li's mother and sisters; holds the blade Hikari", 'honest'],
  ['shiraiwa_tota', 'Shiraiwa Tōta', 13, 'W E', "Yasutoki's son", 'takane', 'shiraiwa', 'shiraiwa_village', 'protect the girl in his village', 'the girl he protects is Li\'s sister Mei'],
  ['haguro_nagatoki', 'Haguro Nagatoki', 35, 'W C+ · C C', 'head of the Haguro (Eastern Pass)', 'takane', 'haguro', 'eastern_pass', 'a seat at the top table', undefined, 'proud, hungry'],
  ['sakaguchi_sadatomo', 'Sakaguchi Sadatomo', 52, 'C B- · W B-', 'head of the Sakaguchi (Southern Pass)', 'takane', 'sakaguchi', 'southern_pass', 'the pass for himself', 'in secret talks with Tobita of Hayate'],
  // Tatara
  ['tatara_shigekuni', 'King Tatara Shigekuni', 63, 'S A- · C B', 'King of Tatara', 'tatara', 'tatara', 'hinokuchi', 'a kingdom that obeys', 'his heart is failing', 'absolute, strict, fair'],
  ['tatara_kunimaru', 'Tatara Kunimaru', 14, '', 'the young heir of Tatara', 'tatara', 'tatara', 'hinokuchi', 'not to fail', undefined, 'frightened of the throne'],
  ['tatara_akifumi', 'Prince Tatara Akifumi', 31, 'S A', "the king's nephew, a scholar", 'tatara', 'tatara', 'hinokuchi', 'to be listened to', 'if ignored long enough, may go to serve Kurogane'],
  ['tobe_ittetsu', 'Tobe Ittetsu', 45, 'C B+', 'commander of the Thousand Strings', 'tatara', '', 'hinokuchi', 'a perfect killing field'],
  ['senjin', 'Old Senjin', 70, '', 'master smith of Tatara', 'tatara', 'kanemori', 'hinokuchi', 'one more perfect blade'],
  // Kitakaze
  ['fuyutsuki_takamune', 'King Fuyutsuki Takamune', 58, 'C B', 'King of Kitakaze', 'kitakaze', 'fuyutsuki', 'shirotori', 'the war chiefs bound to him'],
  ['fuyutsuki_hayato', 'Crown Prince Fuyutsuki Hayato', 25, 'S B- · C C', 'Crown Prince of Kitakaze, once a hostage in Seikyō', 'kitakaze', 'fuyutsuki', 'shirotori', 'revenge on Kurogane', 'plans to kill King Asagiri Tokinari', 'obsessed'],
  ['utsugi_kyosuke', 'Utsugi Kyōsuke', 30, 'W A-', "the prince's sworn swordsman", 'kitakaze', '', 'shirotori', 'serve his prince', 'the chosen assassin'],
  ['garyu_tessai', 'Chief Garyū Tessai', 55, 'W S · C B', '"the Northern Bear", strongest swordsman alive', 'kitakaze', 'garyu', 'long_palisade', 'no war with Kurogane'],
  ['shiramine_akane', 'Chief Shiramine Akane', 34, 'C B+', 'horse-archer chief', 'kitakaze', 'shiramine', 'long_palisade', 'glory in the north'],
  ['shiramine_tsubasa', 'Shiramine Tsubasa', 13, 'W E', 'horse-archer prodigy, son of Chief Akane', 'kitakaze', 'shiramine', 'long_palisade', 'outride everyone'],
  ['bakuta', 'Bakuta', 40, 'W B · C B', 'leader of the Horo clans', 'horo', '', 'horo_steppe', 'grain and plunder in hard winters'],
  // Free places
  ['ebisuya_ganzo', 'Speaker Ebisu-ya Ganzō', 63, 'S A-', 'Speaker of the Council of Kinza', 'kinza', '', 'kinza', 'peace on the trade roads'],
  ['ofuji', 'Ofuji', 16, 'S D', "a merchant's daughter of Kinza, sharp with numbers", 'kinza', '', 'kinza', 'a trading house of her own', 'her true name is Amatsu Sayuri: imperial blood'],
  ['kakushin', 'Abbot Kakushin', 72, 'S B · W B', 'Abbot of Mount Shōgen', 'shogen', '', 'shogen', 'keep the Mirror and the Emperor-in-name safe'],
  ['grey_crow', '"Grey Crow"', 60, 'S B', 'the hidden elder of the Mist Valley', 'mist', '', 'mist_valley', 'sell secrets to all, never twice against one client a year'],
  // Li's family (Atlas §4): hidden, in Takane
  ['yuki', 'Yuki', 38, '', "Li's mother, living under a false name", 'takane', '', 'shiraiwa_village', 'keep her daughters hidden', 'the widow of Hattori Takeshi'],
  ['mei', 'Mei', 15, '', "Li's older sister, living under a false name", 'takane', '', 'shiraiwa_village', 'protect her mother and sister', 'the daughter of Hattori Takeshi'],
  ['kenjiko', 'Kenjiko', 5, '', "Li's younger sister", 'takane', '', 'shiraiwa_village', 'play', 'the daughter of Hattori Takeshi'],
];

/** People the player must never see in Claude's lists until Li has met them (the family secret, Atlas §4 🔒). */
export const HIDDEN_PEOPLE = new Set(['yuki', 'mei', 'kenjiko']);

/** Display names for the new places. */
export const WORLD_PLACES: Record<string, string> = {
  seikyo: 'Seikyō, the capital of Kurogane', kamio_pass: 'the northern pass province (Kamio)', hanaoka: 'Hanaoka, the capital of Suiren',
  sekiba: 'Sekiba fortress (Suiren, across the Kurose)', okitsu_march: 'the eastern march of Suiren (Okitsu)', tsujikaze: 'Tsujikaze, the capital of Hayate',
  sea_of_grass: 'the Sea of Grass (Hayate)', kaisei: 'Kaisei, the capital of Ushio', kumoi: 'Kumoi, the cliff castle of Takane',
  shiraiwa_village: 'a Shiraiwa mining village (Takane)', eastern_pass: 'the Eastern Pass (Takane)', southern_pass: 'the Southern Pass (Takane)',
  hinokuchi: 'Hinokuchi, the forge city of Tatara', shirotori: 'Shirotori, the capital of Kitakaze', long_palisade: 'the Long Palisade (Kitakaze)',
  horo_steppe: 'the Horo lands beyond the palisade', kinza: 'Kinza, the free harbour', shogen: 'Mount Shōgen', mist_valley: 'the Mist Valley',
};

/** Known abilities of the world's great (WB ch. 5: an A or S character has 2–5; listed here, the ones the code runs). */
export const PEOPLE_ABILITIES: Record<string, string[]> = {
  garyu_tessai: ['zanshin'], utsugi_kyosuke: ['zanshin'], homura_tetsuzan: ['iron_wall'], otori_gensai: ['iron_wall'],
  kagami_soun: ['gale_march'], tobita_kojuro: ['gale_march'], kinugasa_ayane: ['silver_tongue'], ebisawa_rokusai: ['silver_tongue'],
  tagami_kanemitsu: ['silver_tongue'], shirasagi_nobuhisa: ['silver_tongue'], akabane_gendayu: ['iron_wall'],
};
