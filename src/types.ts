export interface PlayerCharacter {
  name: string;
  age: number;
  rank: string;
  merit: number; // 0-100 to rise to next rank
  stats: {
    LEA: number; // Leadership: commanding troops, strategy
    VAL: number; // Valor: personal combat, duels
    INT: number; // Intelligence: tactics, memory, research
    POL: number; // Politics: negotiation, finances, administration
  };
  skills: {
    sword: number;
    spear: number;
    archery: number;
    strategy: number;
    stealth: number;
    administration: number;
  };
  abilities: Ability[];
  injuries: string[];
  fatigue: number; // 0-100 (high fatigue lowers combat/admin success)
  reputation: number; // general standing in Sengoku Japan
  morale: number; // personal drive/morale (0-100)
  troops: number; // size of commanded squad
  troopMorale: number; // morale of troops (0-100)
  troopType: string; // "Ashigaru Spearmen", "Ashigaru Archers", "Samurai Retainers", etc.
  experience: number;
}

export interface Ability {
  id: string;
  name: string;
  description: string;
  cooldown: number;
  maxCooldown: number;
  effect: string;
}

export interface NPC {
  id: string;
  name: string;
  clan: string;
  role: string;
  loyalty: number; // 0-100 (only applies if in same clan)
  respect: number; // 0-100
  trust: number; // 0-100
  fear: number; // 0-100
  rivalry: number; // 0-100
  personality: string; // "Ambitious", "Loyal", "Cautious", "Fierce", "Devious"
  memories: NPCMemory[];
  avatarUrl?: string;
}

export interface NPCMemory {
  id: string;
  date: string;
  event: string;
  impact: string; // e.g. "+10 Trust", "-15 Loyalty"
}

export interface Faction {
  id: string;
  name: string;
  leader: string;
  power: number; // 0-100 strength
  territory: string[];
  relations: Record<string, number>; // FactionId -> affinity (-100 to 100)
  internalTension: number; // 0-100 (chance of rebellion/betrayal)
}

export interface Economy {
  koku: number; // primary currency (1 koku = 1 gold/rice measure)
  food: number; // food reserves (rations)
  equipment: number; // 0-100 troop gear quality
  troopUpkeep: number; // koku/food cost per day
}

export interface TimeSystem {
  year: number; // starts 1540
  month: number; // 1-12
  day: number; // 1-30
  season: 'Spring' | 'Summer' | 'Autumn' | 'Winter';
}

export interface EventLogEntry {
  id: string;
  date: string;
  text: string;
  type: 'combat' | 'political' | 'personal' | 'world' | 'recap';
}

export interface ActiveThreat {
  id: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High';
  etaDays: number;
}

export interface ActiveProject {
  id: string;
  name: string;
  cost: number;
  progress: number;
  maxProgress: number;
  type: 'infrastructure' | 'military' | 'farming';
  rewardDescription: string;
}

export interface GameState {
  player: PlayerCharacter;
  time: TimeSystem;
  npcs: NPC[];
  factions: Faction[];
  economy: Economy;
  currentLocation: string;
  currentContext: string;
  narrativeScene: string;
  npcDialogue: string | null;
  activeThreats: ActiveThreat[];
  activeProjects: ActiveProject[];
  eventLog: EventLogEntry[];
  lastActionSummary: string; // what mechanically changed in the last turn
  choices: Choice[];
  gameOver: boolean;
  gameVictory: boolean;
  endingMessage?: string;
  saveSlots?: string[];
}

export interface Choice {
  id: string;
  text: string;
  type: 'training' | 'politics' | 'combat' | 'economy' | 'relationship' | 'free_input';
  actionKey?: string; // used by deterministic engine
  npcId?: string; // if talking to a specific NPC
}
