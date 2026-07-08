import { GameState, PlayerCharacter, NPC, Faction, Economy, TimeSystem, Choice, ActiveThreat, ActiveProject, EventLogEntry } from './types';

export function createInitialState(): GameState {
  const player: PlayerCharacter = {
    name: 'Li Hattori',
    age: 16,
    rank: 'Ashigaru Squad Captain',
    merit: 10,
    stats: {
      LEA: 12, // Leadership (from master document)
      VAL: 18, // Valor (from master document)
      INT: 11, // Intelligence (from master document)
      POL: 6,  // Politics (from master document)
    },
    skills: {
      sword: 18,
      spear: 8,
      archery: 5,
      strategy: 10,
      stealth: 12,
      administration: 6,
    },
    abilities: [
      {
        id: 'wild_strike',
        name: 'Wild Heavy Strike',
        description: 'A desperate heavy swing. Deals high damage but increases fatigue.',
        cooldown: 0,
        maxCooldown: 3,
        effect: 'Deals 1.5x personal combat value in clashes; increases personal fatigue by 15.',
      },
      {
        id: 'rally_cry',
        name: 'Rallying Cry',
        description: 'Shout to bolster troop spirit. Clears squad fear.',
        cooldown: 0,
        maxCooldown: 4,
        effect: 'Increases squad morale by 25 during battle.',
      }
    ],
    injuries: [],
    fatigue: 12,
    reputation: 150,
    morale: 60,
    troops: 12,
    troopMorale: 57,
    troopType: 'Ashigaru Spearmen',
    experience: 14,
  };

  const time: TimeSystem = {
    year: 1540,
    month: 12, // Starting in Winter
    day: 3,
    season: 'Winter',
  };

  const npcs: NPC[] = [
    {
      id: 'yasutane',
      name: 'Lord Yasutane',
      clan: 'Anegakoji',
      role: 'Regional Lord',
      loyalty: 100,
      respect: 48,
      trust: 42,
      fear: 8,
      rivalry: 0,
      personality: 'Watchful, Strategic, Disciplined',
      memories: [
        {
          id: 'm1',
          date: 'Dec 1540',
          event: 'Appointed you Squad Captain due to your late father\'s honorable service and potential.',
          impact: '+10 Trust, Expects excellence.'
        }
      ],
    },
    {
      id: 'goro',
      name: 'Sergeant Goro',
      clan: 'Anegakoji',
      role: 'Drill Instructor',
      loyalty: 90,
      respect: 35,
      trust: 28,
      fear: 6,
      rivalry: 0,
      personality: 'Harsh, Practical, Demanding',
      memories: [],
    },
    {
      id: 'lady_miyako',
      name: 'Lady Miyako',
      clan: 'Anegakoji',
      role: 'Daimyo\'s Daughter & Advisor',
      loyalty: 85,
      respect: 40,
      trust: 50,
      fear: 10,
      rivalry: 15,
      personality: 'Brilliant, Ambitious, Secretly Scheming',
      memories: [],
    },
    {
      id: 'general_nobuhide',
      name: 'General Nobuhide',
      clan: 'Anegakoji',
      role: 'Grand Commander',
      loyalty: 90,
      respect: 65,
      trust: 55,
      fear: 30,
      rivalry: 10,
      personality: 'Fierce militarist, respects battlefield courage, despises cowards',
      memories: [],
    },
    {
      id: 'general_araki',
      name: 'General Araki Murashige',
      clan: 'Anegakoji',
      role: 'Border Garrison Commander',
      loyalty: 35, // Dubious loyalty!
      respect: 20,
      trust: 15,
      fear: 10,
      rivalry: 40,
      personality: 'Ambitious, Devious, Secretly communicating with Takeda',
      memories: [],
    },
    {
      id: 'officer_mototada',
      name: 'Officer Torii Mototada',
      clan: 'Anegakoji',
      role: 'Your Direct Superior / Captain of Guards',
      loyalty: 95,
      respect: 55,
      trust: 70,
      fear: 20,
      rivalry: 5,
      personality: 'Honorable, Strict, Absolute loyalist',
      memories: [],
    },
    {
      id: 'merchant_dosan',
      name: 'Saito Dosan (Ronin Merchant)',
      clan: 'None',
      role: 'Wandering Provisions Trader',
      loyalty: 0,
      respect: 30,
      trust: 35,
      fear: 5,
      rivalry: 0,
      personality: 'Greedy, Shrewd, Sells info and supplies to the highest bidder',
      memories: [],
    },
    {
      id: 'kunoichi_chiyo',
      name: 'Kunoichi Chiyo',
      clan: 'Anegakoji',
      role: 'Spy / Ninja Scout',
      loyalty: 75,
      respect: 45,
      trust: 40,
      fear: 15,
      rivalry: 20,
      personality: 'Sly, Observant, Extremely loyal, silent hunter',
      memories: [],
    },
    {
      id: 'rival_katsuro',
      name: 'Katsuro (Rival Soldier)',
      clan: 'Anegakoji',
      role: 'Fellow Ashigaru Squad Captain',
      loyalty: 60,
      respect: 35,
      trust: 25,
      fear: 15,
      rivalry: 85, // Fierce rival!
      personality: 'Arrogant, Competitive, Jealous of your inheritance',
      memories: [],
    },
    {
      id: 'deputy_kenji',
      name: 'Kenji (Your Deputy)',
      clan: 'Anegakoji',
      role: 'Second-in-Command of Your Squad',
      loyalty: 95,
      respect: 80,
      trust: 85,
      fear: 5,
      rivalry: 0,
      personality: 'Devoted, Brave, Simple-minded, willing to die for you',
      memories: [
        {
          id: 'kenji1',
          date: 'Dec 1540',
          event: 'Swore an oath of brotherhood on the mountain shrines.',
          impact: 'Guarantees troop loyalty under harsh stress.'
        }
      ],
    },
    {
      id: 'lord_shingen',
      name: 'Lord Takeda Shingen',
      clan: 'Takeda',
      role: 'Daimyo of Kai / Red Cavalry',
      loyalty: 0,
      respect: 75,
      trust: 10,
      fear: 85,
      rivalry: 90,
      personality: 'Brilliant military genius, ambitious, ruthless but honorable',
      memories: [],
    }
  ];

  const factions: Faction[] = [
    {
      id: 'anegakoji',
      name: 'Anegakoji Clan',
      leader: 'Lord Yasutane',
      power: 45,
      territory: ['Shiina territory', 'Mitsui border', 'Anegakoji Keep'],
      relations: {
        takeda: -71, // High tension
        uesugi: -15, // Neutral but cautious
      },
      internalTension: 40, // High internal tension!
    },
    {
      id: 'takeda',
      name: 'Takeda Clan',
      leader: 'Lord Takeda Shingen',
      power: 85,
      territory: ['Kai Province', 'Suruga Border', 'Shinano Plain'],
      relations: {
        anegakoji: -71,
        uesugi: -80, // Legendary rivalry
      },
      internalTension: 10,
    }
  ];

  const economy: Economy = {
    koku: 250, // Starting currency
    food: 400, // Rice bags
    equipment: 65, // Soldier gear quality
    troopUpkeep: 1.5, // 1.5 koku & food per day total for troops
  };

  const activeThreats: ActiveThreat[] = [
    {
      id: 'takeda_patrols',
      description: 'Takeda mobilization rumors: scouts searching border passes.',
      severity: 'Medium',
      etaDays: 14,
    },
    {
      id: 'araki_plots',
      description: 'General Araki holding secret talks with Kai agents at local teahouse.',
      severity: 'High',
      etaDays: 25,
    }
  ];

  const activeProjects: ActiveProject[] = [
    {
      id: 'repair_barracks',
      name: 'Fortress Barracks Fortification',
      cost: 80,
      progress: 0,
      maxProgress: 100,
      type: 'military',
      rewardDescription: 'Increases Troop Max size by 5, adds +10 Troop Morale on completion.'
    },
    {
      id: 'mountain_terraces',
      name: 'Mountain Rice Terrace Farming',
      cost: 120,
      progress: 0,
      maxProgress: 100,
      type: 'farming',
      rewardDescription: 'Increases Food generation. Consumes Winter labor.'
    }
  ];

  const eventLog: EventLogEntry[] = [
    {
      id: 'log1',
      date: '1540-12-03',
      text: 'Snowfalls lock down the Shinano mountain passes. You are appointed Squad Captain of the mountain guards under Officer Torii Mototada.',
      type: 'personal',
    }
  ];

  const choices: Choice[] = [
    { id: 'drill_squad', text: 'Drill your Ashigaru squad in the snow (Increases leadership & troop morale)', type: 'training', actionKey: 'drill_troops' },
    { id: 'train_spear_val', text: 'Practice spear-work under General Nobuhide (Increases Valor & spear skill)', type: 'training', actionKey: 'train_spear' },
    { id: 'patrol_pass', text: 'Patrol the snowy mountain pass to ward off scouts (Time +3 days, threat reduction, risk combat)', type: 'combat', actionKey: 'patrol_border' },
    { id: 'talk_officer', text: 'Consult with your mentor Officer Mototada on local defenses (Build relationships)', type: 'relationship', actionKey: 'talk_mototada' },
    { id: 'assist_repair', text: 'Lead your squad to assist in Barracks Fortification (Progress military project, administration +)', type: 'economy', actionKey: 'work_barracks' }
  ];

  return {
    player,
    time,
    npcs,
    factions,
    economy,
    currentLocation: 'Shiina Territory - Training Yard',
    currentContext: 'Winter drill before rising external pressure. Lord Yasutane watches from the Keep war room.',
    narrativeScene: 'You stand at the Shiina Training Yard. Heavy, freezing flakes of snow drift down, landing on your light ashigaru armor. Your squad of twelve ashigaru stand shivered, holding their training blades. As their new captain, they look to you for direction. In the high castle above, you can see the warm lanterns of Lord Yasutane\'s war room. Down in the barracks, soldiers murmur of the Takeda mobilization. Winter has locked you in, but the spring campaign approaches with absolute certainty. What are your commands, Captain?',
    npcDialogue: '"Watch your footing, Captain. The mountain winds chew through bone faster than a samurai\'s edge. Show these green recruits what Anegakoji blood is made of," says Sergeant Goro, checking your grip.',
    activeThreats,
    activeProjects,
    eventLog,
    lastActionSummary: 'Game initialized. Winter, 1540.',
    choices,
    gameOver: false,
    gameVictory: false,
  };
}

export function advanceTime(state: GameState, days: number): void {
  const time = state.time;
  
  // Advance days
  time.day += days;
  if (time.day > 30) {
    time.day -= 30;
    time.month += 1;
    if (time.month > 12) {
      time.month = 1;
      time.year += 1;
    }
  }

  // Set season
  if (time.month >= 3 && time.month <= 5) {
    time.season = 'Spring';
  } else if (time.month >= 6 && time.month <= 8) {
    time.season = 'Summer';
  } else if (time.month >= 9 && time.month <= 11) {
    time.season = 'Autumn';
  } else {
    time.season = 'Winter';
  }

  // Upkeep economy ticks
  const dailyFoodCost = state.player.troops * 0.15;
  const dailyKokuCost = state.player.troops * 0.05;
  const totalFoodCost = dailyFoodCost * days;
  const totalKokuCost = dailyKokuCost * days;

  state.economy.food = Math.max(0, parseFloat((state.economy.food - totalFoodCost).toFixed(1)));
  state.economy.koku = Math.max(0, parseFloat((state.economy.koku - totalKokuCost).toFixed(1)));

  // If starvation, troop morale tanks and soldiers start deserting
  if (state.economy.food <= 0) {
    state.player.troopMorale = Math.max(0, state.player.troopMorale - (5 * days));
    if (state.player.troopMorale < 20) {
      const deserters = Math.min(state.player.troops, Math.floor(Math.random() * 2) + 1);
      if (deserters > 0 && state.player.troops > 3) {
        state.player.troops -= deserters;
        state.eventLog.unshift({
          id: `deserter_${Date.now()}`,
          date: `${time.year}-${String(time.month).padStart(2, '0')}-${String(time.day).padStart(2, '0')}`,
          text: `${deserters} ashigaru deserted your squad due to starvation.`,
          type: 'world',
        });
      }
    }
  }

  // Reduce cooldowns
  state.player.abilities.forEach(ab => {
    if (ab.cooldown > 0) {
      ab.cooldown = Math.max(0, ab.cooldown - Math.floor(days / 2 || 1));
    }
  });

  // Tick threats ETA
  state.activeThreats.forEach(threat => {
    threat.etaDays = Math.max(0, threat.etaDays - days);
  });

  // Tick projects if active (simulated progress)
}

export function applyMechanicalEffect(state: GameState, choiceId: string, customText?: string): string {
  let logText = '';
  const time = state.time;
  const p = state.player;
  const econ = state.economy;

  // Reduce some fatigue per turn, but actions add more
  p.fatigue = Math.max(0, p.fatigue - 2);

  // If high fatigue, reduce stat gains
  const fatigueMultiplier = p.fatigue > 60 ? 0.5 : p.fatigue > 30 ? 0.8 : 1.0;

  if (choiceId === 'drill_troops') {
    // Drills increase Leadership, Strategy skill, and squad morale. Consumes 3 days, food/fatigue
    const leGain = Math.round((1 + Math.random() * 2) * fatigueMultiplier);
    const stratGain = Math.round((1 + Math.random() * 2) * fatigueMultiplier);
    const moraleGain = Math.round(8 + Math.random() * 5);
    p.stats.LEA = Math.min(100, p.stats.LEA + leGain);
    p.skills.strategy = Math.min(100, p.skills.strategy + stratGain);
    p.troopMorale = Math.min(100, p.troopMorale + moraleGain);
    p.fatigue = Math.min(100, p.fatigue + 15);
    p.experience += 15;
    
    advanceTime(state, 3);
    logText = `Drilled squad in heavy snow: +${leGain} Leadership, +${stratGain} Strategy, +${moraleGain} Troop Morale. Fatigue +15. Time +3 days.`;
  } 
  else if (choiceId === 'train_spear') {
    // Spear training under Nobuhide. Raises Valor, Spear skill. Fatigue +20. Time +2 days
    const valGain = Math.round((1 + Math.random() * 3) * fatigueMultiplier);
    const spearGain = Math.round((2 + Math.random() * 3) * fatigueMultiplier);
    p.stats.VAL = Math.min(100, p.stats.VAL + valGain);
    p.skills.spear = Math.min(100, p.skills.spear + spearGain);
    p.fatigue = Math.min(100, p.fatigue + 20);
    p.experience += 15;

    // Improve Nobuhide relationship slightly
    const nobuhide = state.npcs.find(n => n.id === 'general_nobuhide');
    if (nobuhide) {
      nobuhide.respect = Math.min(100, nobuhide.respect + 2);
      nobuhide.trust = Math.min(100, nobuhide.trust + 1);
    }

    advanceTime(state, 2);
    logText = `Trained fiercely in spear martial skills: +${valGain} Valor, +${spearGain} Spear Skill. Fatigue +20. Respect with Gen. Nobuhide +2. Time +2 days.`;
  }
  else if (choiceId === 'patrol_border') {
    // Patrolling mountain pass. Cuts Takeda border threat, triggers combat or security check. Time +4 days. Fatigue +18
    const valGain = Math.round((1 + Math.random() * 2) * fatigueMultiplier);
    const stealthGain = Math.round((1 + Math.random() * 2) * fatigueMultiplier);
    p.stats.VAL = Math.min(100, p.stats.VAL + valGain);
    p.skills.stealth = Math.min(100, p.skills.stealth + stealthGain);
    p.fatigue = Math.min(100, p.fatigue + 18);
    p.experience += 25;

    // Relieve Takeda threat
    const threat = state.activeThreats.find(t => t.id === 'takeda_patrols');
    if (threat) {
      threat.etaDays += 10; // push back ETA
    }

    // High risk of mountain skirmish!
    const isSkirmish = Math.random() > 0.45;
    advanceTime(state, 4);

    if (isSkirmish) {
      const combatSummary = simulateSkirmish(state);
      logText = `Patrolling mountain passes led to a combat clash! ${combatSummary} +${valGain} Valor, +${stealthGain} Stealth. Fatigue +18. Time +4 days.`;
    } else {
      logText = `Secured alpine mountain passes. Found only Takeda tracks. Prevented surprise scouts: +${valGain} Valor, +${stealthGain} Stealth. Threat delayed. Fatigue +18. Time +4 days.`;
    }
  }
  else if (choiceId === 'talk_mototada') {
    // Talk to Mototada. Increases trust/respect. Time +1 day. fatigue -5 (relaxed)
    const intGain = Math.round(1 * fatigueMultiplier);
    p.stats.INT = Math.min(100, p.stats.INT + intGain);
    p.fatigue = Math.max(0, p.fatigue - 10);
    p.experience += 5;

    const mototada = state.npcs.find(n => n.id === 'officer_mototada');
    if (mototada) {
      mototada.trust = Math.min(100, mototada.trust + 8);
      mototada.respect = Math.min(100, mototada.respect + 4);
      mototada.memories.unshift({
        id: `mem_${Date.now()}`,
        date: `${time.year}-${time.month}-${time.day}`,
        event: 'Shared personal counsel on fortress guards.',
        impact: '+8 Trust'
      });
    }

    advanceTime(state, 1);
    logText = `Sat with Officer Torii Mototada over a cold fire, learning castle layout and guard rotations: +1 INT. Fatigue reduced by 10. Torii Trust +8, Respect +4. Time +1 day.`;
  }
  else if (choiceId === 'work_barracks') {
    // Work on Fortification project. Progresses active projects, increases Administration, Leadership. Time +3 days
    const polGain = Math.round((1 + Math.random() * 2) * fatigueMultiplier);
    const adminGain = Math.round((2 + Math.random() * 3) * fatigueMultiplier);
    p.stats.POL = Math.min(100, p.stats.POL + polGain);
    p.skills.administration = Math.min(100, p.skills.administration + adminGain);
    p.fatigue = Math.min(100, p.fatigue + 15);
    p.experience += 20;

    // Progress Project
    const project = state.activeProjects.find(pr => pr.id === 'repair_barracks');
    if (project) {
      project.progress = Math.min(project.maxProgress, project.progress + 25);
      if (project.progress >= project.maxProgress) {
        p.troops = Math.min(25, p.troops + 5);
        p.troopMorale = Math.min(100, p.troopMorale + 10);
        logText = `COMPLETED Project [${project.name}]! Max troops increased by 5. +10 Troop Morale. +${polGain} Politics, +${adminGain} Administration. Fatigue +15. Time +3 days.`;
        // Remove project or flag completed
        state.activeProjects = state.activeProjects.filter(pr => pr.id !== 'repair_barracks');
      } else {
        logText = `Led squad carrying logs to reinforce fortress walls: +${polGain} Politics, +${adminGain} Administration. Project [${project.name}] progressed to ${project.progress}%. Fatigue +15. Time +3 days.`;
      }
    } else {
      logText = `Assisted with local village labor: +${polGain} Politics, +${adminGain} Administration. Fatigue +15. Time +3 days.`;
    }

    advanceTime(state, 3);
  }
  else {
    // Check if it's a dynamic choice from state's choices list
    const selectedChoice = state.choices.find(c => c.id === choiceId || c.actionKey === choiceId);
    if (selectedChoice) {
      const type = selectedChoice.type;
      const text = selectedChoice.text;
      const textLower = text.toLowerCase();
      
      let duration = 2;
      p.fatigue = Math.min(100, p.fatigue + 10);
      p.experience += 15;
      
      if (type === 'training') {
        const statGain = Math.round((1 + Math.random() * 2) * fatigueMultiplier);
        p.stats.LEA = Math.min(100, p.stats.LEA + statGain);
        p.skills.strategy = Math.min(100, p.skills.strategy + statGain);
        p.troopMorale = Math.min(100, p.troopMorale + 6);
        duration = 2;
        logText = `Completed tactical training action "${text}": +${statGain} Leadership, +${statGain} Strategy, +6 Troop Morale. Fatigue +10. Time +2 days.`;
      } 
      else if (type === 'combat') {
        const valGain = Math.round((1 + Math.random() * 3) * fatigueMultiplier);
        p.stats.VAL = Math.min(100, p.stats.VAL + valGain);
        p.skills.spear = Math.min(100, p.skills.spear + 1);
        duration = 3;
        p.fatigue = Math.min(100, p.fatigue + 8); // extra fatigue
        
        // Sim a border clash or guard action
        const isSkirmish = Math.random() > 0.45;
        if (isSkirmish) {
          const combatSummary = simulateSkirmish(state);
          logText = `Engaged in security combat action: "${text}". Outcome: ${combatSummary} +${valGain} Valor. Time +3 days.`;
        } else {
          logText = `Secured border sector via tactical action "${text}": +${valGain} Valor. Time +3 days.`;
        }
      } 
      else if (type === 'politics') {
        const polGain = Math.round((1 + Math.random() * 2) * fatigueMultiplier);
        p.stats.POL = Math.min(100, p.stats.POL + polGain);
        p.stats.INT = Math.min(100, p.stats.INT + 1);
        duration = 1;
        p.fatigue = Math.max(0, p.fatigue - 5);
        logText = `Negotiated strategic decree "${text}": +${polGain} Politics, +1 Intelligence. Time +1 day.`;
      } 
      else if (type === 'economy') {
        const polGain = Math.round((1 + Math.random() * 2) * fatigueMultiplier);
        p.stats.POL = Math.min(100, p.stats.POL + polGain);
        p.skills.administration = Math.min(100, p.skills.administration + 2);
        duration = 3;
        
        // Progress active project if any
        if (state.activeProjects.length > 0) {
          const project = state.activeProjects[0];
          project.progress = Math.min(project.maxProgress, project.progress + 25);
          if (project.progress >= project.maxProgress) {
            p.troops = Math.min(25, p.troops + 5);
            p.troopMorale = Math.min(100, p.troopMorale + 10);
            logText = `COMPLETED labor project [${project.name}] through action: "${text}"! Max troops increased. +${polGain} Politics. Time +3 days.`;
            state.activeProjects.shift();
          } else {
            logText = `Progressed project [${project.name}] to ${project.progress}% via action "${text}": +${polGain} Politics, +2 Administration. Time +3 days.`;
          }
        } else {
          logText = `Organized local resources through action "${text}": +${polGain} Politics, +2 Administration. Time +3 days.`;
        }
      } 
      else if (type === 'relationship') {
        const intGain = Math.round(1 * fatigueMultiplier);
        p.stats.INT = Math.min(100, p.stats.INT + intGain);
        p.fatigue = Math.max(0, p.fatigue - 10); // relaxed
        duration = 1;
        
        let foundNPC = false;
        state.npcs.forEach(n => {
          if (textLower.includes(n.name.toLowerCase()) || textLower.includes(n.id.split('_')[1])) {
            n.trust = Math.min(100, n.trust + 5);
            n.respect = Math.min(100, n.respect + 3);
            foundNPC = true;
            n.memories.unshift({
              id: `mem_${Date.now()}`,
              date: `${time.year}-${time.month}-${time.day}`,
              event: `Shared dynamic interaction: "${text.slice(0, 50)}..."`,
              impact: '+5 Trust, +3 Respect'
            });
          }
        });
        
        if (!foundNPC && state.npcs.length > 0) {
          const randomNPC = state.npcs[Math.floor(Math.random() * state.npcs.length)];
          randomNPC.trust = Math.min(100, randomNPC.trust + 4);
          logText = `Conversed in quarters: Strengthened ties with ${randomNPC.name}: +4 Trust. Fatigue reduced. Time +1 day.`;
        } else {
          logText = `Maintained relationships and consulted advisors: "${text}". Fatigue reduced. Time +1 day.`;
        }
      } 
      else {
        logText = `Executed dynamic action "${text}". Under Anegakoji banners, your squad coordinates to execute instructions. Time +2 days.`;
        duration = 2;
      }
      
      advanceTime(state, duration);
    }
    else if (customText) {
      // Free text action processing: we advance time by 1-2 days and consume minor fatigue
      const textLower = customText.toLowerCase();
      let duration = 2;
      p.fatigue = Math.min(100, p.fatigue + 10);
      p.experience += 10;

      // Check keywords to apply secondary mechanical effects
      if (textLower.includes('train') || textLower.includes('practice') || textLower.includes('drill')) {
        p.skills.sword = Math.min(100, p.skills.sword + 1);
        p.stats.VAL = Math.min(100, p.stats.VAL + 1);
        duration = 2;
        logText = `Executed custom training: Personal combat skills stimulated (+1 Valor). Fatigue +10. Time +2 days.`;
      } else if (textLower.includes('bribe') || textLower.includes('pay') || textLower.includes('gold') || textLower.includes('koku')) {
        if (econ.koku >= 20) {
          econ.koku -= 20;
          duration = 1;
          logText = `Spent 20 Koku on gifts/bribes to influence local favor. Fatigue +5. Time +1 day.`;
        } else {
          logText = `Attempted to offer koku but lacked financial reserves. Time +1 day.`;
          duration = 1;
        }
      } else if (textLower.includes('scout') || textLower.includes('spy') || textLower.includes('stealth')) {
        p.skills.stealth = Math.min(100, p.skills.stealth + 2);
        p.stats.INT = Math.min(100, p.stats.INT + 1);
        duration = 2;
        logText = `Conducted stealth reconnaissance around castle outskirts: +2 Stealth, +1 Intelligence. Fatigue +12. Time +2 days.`;
      } else if (textLower.includes('talk') || textLower.includes('speak') || textLower.includes('ask') || textLower.includes('confront')) {
        // Find matches in NPC list
        let foundNPC = false;
        state.npcs.forEach(n => {
          if (textLower.includes(n.name.toLowerCase()) || textLower.includes(n.id.split('_')[1])) {
            n.trust = Math.min(100, n.trust + 3);
            foundNPC = true;
            n.memories.unshift({
              id: `mem_${Date.now()}`,
              date: `${time.year}-${time.month}-${time.day}`,
              event: `Discussed: "${customText.slice(0, 50)}..."`,
              impact: 'Dialogue memory updated.'
            });
          }
        });
        duration = 1;
        logText = `Conversed with local figures: ${foundNPC ? 'Relationship bonds shifted' : 'General social interaction occurred'}. Fatigue +5. Time +1 day.`;
      } else {
        logText = `Executed special tactical decree: "${customText.slice(0, 60)}...". Fatigue +10. Time +2 days.`;
        duration = 2;
      }

      advanceTime(state, duration);
    }
    else {
      logText = `Issued tactical orders. Under Anegakoji's banners, your squad coordinates to secure the sector. Time +1 day.`;
      advanceTime(state, 1);
    }
  }

  // Cap merit and check promotions
  if (p.merit >= 100) {
    p.merit -= 100;
    promoteCharacter(state);
  }

  // Faction world triggers check
  checkWorldEvents(state);

  state.lastActionSummary = logText;
  
  // Create an event log entry
  state.eventLog.unshift({
    id: `act_${Date.now()}`,
    date: `${time.year}-${String(time.month).padStart(2, '0')}-${String(time.day).padStart(2, '0')}`,
    text: logText,
    type: choiceId === 'patrol_border' ? 'combat' : choiceId === 'talk_mototada' ? 'personal' : 'political',
  });

  return logText;
}

function promoteCharacter(state: GameState): void {
  const p = state.player;
  const t = state.time;
  if (p.rank === 'Ashigaru Recruit') {
    p.rank = 'Ashigaru Squad Captain';
    p.troops = 10;
    p.reputation += 50;
  } else if (p.rank === 'Ashigaru Squad Captain') {
    p.rank = 'Garrison Lieutenant';
    p.troops = 15;
    p.reputation += 100;
    p.stats.LEA += 5;
  } else if (p.rank === 'Garrison Lieutenant') {
    p.rank = 'Fortress Commander';
    p.troops = 25;
    p.reputation += 200;
    p.stats.LEA += 8;
    p.stats.POL += 4;
  } else if (p.rank === 'Fortress Commander') {
    p.rank = 'Grand Clan General';
    p.troops = 60;
    p.reputation += 400;
    p.stats.LEA += 10;
    p.stats.POL += 8;
  }
  
  state.eventLog.unshift({
    id: `promo_${Date.now()}`,
    date: `${t.year}-${String(t.month).padStart(2, '0')}-${String(t.day).padStart(2, '0')}`,
    text: `PROMOTED! You have risen to the rank of ${p.rank} due to accumulated merit! Under your command: ${p.troops} soldiers.`,
    type: 'personal',
  });
}

function simulateSkirmish(state: GameState): string {
  const p = state.player;
  const econ = state.economy;
  const date = `${state.time.year}-${state.time.month}-${state.time.day}`;
  
  // Calculations
  const playerForce = p.troops * (p.skills.spear * 0.5 + p.stats.VAL * 0.3 + p.troopMorale * 0.2);
  const enemyCount = 8 + Math.floor(Math.random() * 5); // Takeda scouts
  const enemyForce = enemyCount * (15 + Math.random() * 20); // Scout strength
  
  // Tactical balance
  const resultRatio = playerForce / (enemyForce || 1);
  let casualties = 0;
  let text = '';
  let meritGained = 0;

  if (resultRatio >= 1.2) {
    // Win
    casualties = Math.floor(p.troops * 0.1);
    meritGained = 15 + Math.floor(Math.random() * 10);
    p.merit += meritGained;
    p.troopMorale = Math.min(100, p.troopMorale + 5);
    p.reputation += 20;
    text = `VICTORY! Your squad successfully ambushed Takeda scouts in the narrow ravines. Enemy forced to retreat leaving 3 dead. You lost ${casualties} soldiers. Gained +${meritGained} Merit, +20 Reputation.`;
  } else if (resultRatio >= 0.8) {
    // Pyrrhic / Draw
    casualties = Math.floor(p.troops * 0.3);
    meritGained = 8 + Math.floor(Math.random() * 5);
    p.merit += meritGained;
    p.troopMorale = Math.max(0, p.troopMorale - 5);
    text = `STANDOFF. Bloody clash on slippery ice. Heavy combat forced both squads to disengage. You suffered ${casualties} casualties. Gained +${meritGained} Merit.`;
  } else {
    // Loss
    casualties = Math.floor(p.troops * 0.5);
    p.troopMorale = Math.max(0, p.troopMorale - 25);
    p.merit = Math.max(0, p.merit - 10);
    text = `DEFEAT! Your squad was blindsided by Takeda archery fire in the freezing pass. You were forced to fall back in disarray. Lost ${casualties} soldiers. Squad morale collapsed.`;
    
    // Add injury chance
    if (Math.random() > 0.5) {
      p.injuries.push('Frostbitten ear' + (Math.random() > 0.5 ? ' and arrow graze' : ''));
      p.stats.VAL = Math.max(5, p.stats.VAL - 2);
    }
  }

  p.troops = Math.max(3, p.troops - casualties);
  
  return text;
}

function checkWorldEvents(state: GameState): void {
  // Let's check active threats and progress
  const time = state.time;
  
  state.activeThreats.forEach(threat => {
    if (threat.etaDays <= 0) {
      // Threat triggers!
      if (threat.id === 'takeda_patrols') {
        // Takeda initiates a border siege/skirmish
        state.eventLog.unshift({
          id: `threat_takeda_${Date.now()}`,
          date: `${time.year}-${time.month}-${time.day}`,
          text: `BORDER CRITICAL: Takeda raiding cavalry bypassed mountain sentries and raided the Lower Valley villages! Under-upkeep of border guards has angered Lord Yoshitsugu.`,
          type: 'world',
        });
        // Punish player merit or clan stability
        state.player.merit = Math.max(0, state.player.merit - 15);
        const kiba = state.factions.find(f => f.id === 'kiba');
        if (kiba) kiba.power = Math.max(10, kiba.power - 5);
        
        // Reset threat with higher severity
        threat.etaDays = 20 + Math.floor(Math.random() * 10);
        threat.severity = 'High';
      }
      else if (threat.id === 'araki_plots') {
        // Araki secret plot thickens
        state.eventLog.unshift({
          id: `threat_araki_${Date.now()}`,
          date: `${time.year}-${time.month}-${time.day}`,
          text: `INTERNAL TENSION: Reports surface of grain rations going missing from the Garrison Armory. General Araki claims it is simple rot, but rumors of treason spread.`,
          type: 'political',
        });
        const kiba = state.factions.find(f => f.id === 'kiba');
        if (kiba) kiba.internalTension = Math.min(100, kiba.internalTension + 15);
        
        threat.etaDays = 25; // Reset plots timer
      }
    }
  });

  // Season shifts: Winter to Spring campaign triggers
  if (time.season === 'Spring' && !state.eventLog.some(e => e.text.includes('SPRING CAMPAIGN INITIATED'))) {
    state.eventLog.unshift({
      id: `spring_campaign_${Date.now()}`,
      date: `${time.year}-${time.month}-${time.day}`,
      text: `SPRING CAMPAIGN INITIATED: The mountain passes melt! Kiba horn-blasts sound. Takeda forces are assembling at the plain foothills. War is here.`,
      type: 'world',
    });
    // Add campaign threat
    state.activeThreats.push({
      id: 'takeda_invasion',
      description: 'Main Takeda Army (800 soldiers) marching toward Yamashiro Castle.',
      severity: 'High',
      etaDays: 30,
    });
  }
}

export function generateLocalFallback(state: GameState, choiceId: string, customText?: string, is403: boolean = false): GameState {
  const oldState = JSON.parse(JSON.stringify(state)); // Deep copy to prevent mutating in-place during fallback prep
  const p = oldState.player;
  const time = oldState.time;
  
  const restrictionNotice = is403 
    ? `\n\n*(Note: Your cloud project or API key is currently restricted (403 Permission Denied) by Google. The game has seamlessly switched to its immersive Local Historical Narrator so you can play without interruption!)*`
    : '';

  // Get the turn index to determine story progression
  const turn = oldState.eventLog.length; // Increments with each action

  let narrativeScene = '';
  let npcDialogue = '';
  let nextChoices: Choice[] = [];

  // 1. Find the selected choice to understand what type of action the user did
  const selectedChoice = oldState.choices.find((c: Choice) => c.id === choiceId || c.actionKey === choiceId);
  const actionText = selectedChoice ? selectedChoice.text : (customText ? `"${customText}"` : 'your strategic orders');

  // Chapter 1: The Frozen Vigil (Turns 1 - 5)
  if (turn <= 5) {
    oldState.currentLocation = 'Shiina Territory - Training Yard';
    oldState.currentContext = 'Winter, 1540. Heavy snowfalls lock down the mountain passes. Focus on drills and fortifications.';
    time.season = 'Winter';

    if (turn <= 2) { // Turn 1 outcome (initial action)
      narrativeScene = `You execute your order: ${actionText}. Under cold grey winter skies, your squad struggles in the deep mountain snow drifts of Shinano, but your firm command keeps them steady. You inspect the training grounds. A light crust of frozen frost coats the wooden yari shafts. You spot a set of faint, mysterious footprints along the outer fence—undoubtably scout activity.${restrictionNotice}`;
      npcDialogue = `"A cold start, Captain Hattori, but steel is tempered in the deepest freeze. Keep these recruits focused before they freeze to death," Sergeant Goro grunts, blowing on his red fingers.`;
    } 
    else if (turn === 3) { // Turn 2 outcome
      narrativeScene = `Following your action: ${actionText}, you gather in the cold guardroom where Officer Torii Mototada sits over a small charcoal brazier. He unrolls a map of Shinano Pass. The smell of burning pine fills the dry air. He points to the western ridge paths, suggesting that the Takeda clan always tests the borders during winter before a major spring campaign.${restrictionNotice}`;
      npcDialogue = `"Your father Hattori was a castle gate rock, Li. The mountains here do not favor the Takeda or the Anegakoji; they only favor the commander who respects the cold," Torii Mototada counsels warmly.`;
    } 
    else if (turn === 4) { // Turn 3 outcome
      narrativeScene = `You carry out: ${actionText}. A brutal winter blizzard strikes the Anegakoji hills, wrapping the palisades in blinding white sheets. Your ashigaru huddle in their thin hemp cloaks. You must personally lead by example, clearing ice from the western gate towers and maintaining high soldier morale despite the bone-chilling mountain winds.${restrictionNotice}`;
      npcDialogue = `"We are mountain men, Captain! A little frost won't crack our spear-tips. We stand ready at your word!" Sergeant Goro yells over the howling winter gales.`;
    } 
    else { // Turn 4 & 5 outcome
      narrativeScene = `You order: ${actionText}. Katsuro, your arrogant rival and fellow Squad Captain, steps into the snowy yard with a sneer. He watches your drills with folded arms, loudly mocking the alignment of your recruits and claiming his squad would hold the western gate twice as long in a real skirmish.${restrictionNotice}`;
      npcDialogue = `"You have the lineage, Hattori, but pedigree doesn't stop a Takeda cavalry charge. Let's see if your green squad can actually bleed when the spring thaw arrives," Katsuro snickers arrogantly.`;
    }

    nextChoices = [
      { id: 'drill_squad_w1', text: 'Drill your Ashigaru recruits in the swirling snow (Leadership & troop morale +)', type: 'training', actionKey: 'drill_troops' },
      { id: 'train_spear_w1', text: 'Practice personal yari thrusts under General Nobuhide (Valor & spear skill +)', type: 'training', actionKey: 'train_spear' },
      { id: 'patrol_pass_w1', text: 'Patrol the dangerous snowy mountain pass to ward off scouts (Combat risk)', type: 'combat', actionKey: 'patrol_border' },
      { id: 'talk_officer_w1', text: 'Consult with your mentor Officer Mototada on local defenses (Relationship +)', type: 'relationship', actionKey: 'talk_mototada' },
      { id: 'assist_repair_w1', text: 'Lead your squad to carry logs and reinforce Barracks Fortification (Project progress)', type: 'economy', actionKey: 'work_barracks' }
    ];
  }
  // Chapter 2: Thaw of the Red Fox (Turns 6 - 10)
  else if (turn <= 10) {
    oldState.currentLocation = 'Southern Shinano Pass - River Junction';
    oldState.currentContext = 'Spring, 1541. Muddy torrents rush down the ravines as snows melt. Takeda cavalry scouts are sighted.';
    time.season = 'Spring';

    if (turn === 6) { // Turn 5 outcome (spring transition)
      narrativeScene = `You order: ${actionText}. The heavy winter snows are finally melting into muddy, rushing torrents that wash down the mountain ravines. Cherry blossoms begin to bud on the cold branches. However, scouts return with alarming news: Takeda Shingen's legendary red-banner cavalry has mobilized, and advance raiders have been spotted testing our pass gates.${restrictionNotice}`;
      npcDialogue = `"The mountain paths are clear now, Captain Hattori. The war season has officially begun. We must be ready for high-speed cavalry charges," General Nobuhide warns, clinking his dark armor plates.`;
    }
    else if (turn === 7) {
      narrativeScene = `You order: ${actionText}. You lead your squad down to the swollen riverbanks to set a tactical ambush. Suddenly, a splash of red flags appears through the wet bamboo! You engage in a sudden, sharp skirmish against a Takeda advance patrol. Swords clash on wet clay, and you force the scouts to disengage and flee.${restrictionNotice}`;
      npcDialogue = `"A swift and lethal counter, Captain! We drove them back, but they now know our exact numbers. More scouts will surely return," says Deputy Kenji, wiping mud from his bloodied sword.`;
    }
    else if (turn === 8) {
      narrativeScene = `Following your action: ${actionText}, you discover a leather cording and a dropped tactical map near the western ridge. It is drawn with precise detail—Anegakoji Keep's exact guard rotations and weak points are highlighted in red wax. A traitor within our own walls is leaking vital castle intelligence!${restrictionNotice}`;
      npcDialogue = `"This map was drawn by someone with high fortress clearance, Captain. This is not the work of a common scout. A venomous snake walks among us," whispers Kunoichi Chiyo, appearing silently from the pine shadows.`;
    }
    else { // Turn 9 & 10 outcome
      narrativeScene = `You order: ${actionText}. Saito Dosan, a wealthy and shrewd ronin merchant, arrives at the training yard gates with a wagon full of high-quality steel-forged spear-tips and leather bindings. He strokes his thin chin whiskers, calculating the supply costs under the spring drizzle.${restrictionNotice}`;
      npcDialogue = `"Wars are won with sharp iron and rich koku, young Captain, not empty honor. For a small price, I can ensure your squad gets the sharpest forged tips in Shinano. Do we have a bargain?" Saito Dosan smiles greedily.`;
    }

    nextChoices = [
      { id: 'practice_yari_wall_s1', text: 'Practice tight spear-walls to counter the Takeda Red Cavalry (Leadership +)', type: 'training', actionKey: 'drill_troops' },
      { id: 'river_ambush_s1', text: 'Set a tactical ambush at the muddy river junction to delay the Takeda vanguard (Combat risk)', type: 'combat', actionKey: 'patrol_border' },
      { id: 'confront_araki_s1', text: 'Confront General Araki Murashige privately regarding his suspicious communications (Relationship +)', type: 'relationship', actionKey: 'talk_mototada' },
      { id: 'buy_iron_tips_s1', text: 'Bribe Saito Dosan to purchase high-quality iron spear-tips for your troops (Economy +)', type: 'economy', actionKey: 'work_barracks' }
    ];
  }
  // Chapter 3: Shadows in the Courtyard (Turns 11 - 15)
  else if (turn <= 15) {
    oldState.currentLocation = 'Anegakoji Keep - High Court Ramparts';
    oldState.currentContext = 'Late Spring / Early Summer. You suspect an internal spy is leaking vital guard rotations.';
    time.season = 'Spring';

    if (turn === 11) {
      narrativeScene = `You order: ${actionText}. You walk the high wooden ramparts under a moonlit spring night. You notice General Araki Murashige speaking in private, hushed whispers with a cloaked merchant contact. When you approach, Araki quickly dismisses the trader and turns to you with a cold, hollow smile, questioning your presence.${restrictionNotice}`;
      npcDialogue = `"Ah, Captain Hattori. Out for a late night stroll? Leave high diplomacy and castle supply distribution to those of us who carry the weight of the clan," General Araki sneers, his hand resting on his sword hilt.`;
    }
    else if (turn === 12) {
      narrativeScene = `Following your action: ${actionText}, Kunoichi Chiyo guides you to sneak into the local valley teahouse. Peering through the sliding paper screen, you spy a Takeda courier receiving a wax-sealed letter from a servant bearing General Araki's crest. Before you can break in, the courier slips through the rear window into the wet pine woods.${restrictionNotice}`;
      npcDialogue = `"He carries the written proof of treason, Captain. If we intercept him before he reaches the Takeda vanguard, we can expose Araki in front of Lord Yasutane," Kunoichi Chiyo whispers, checking her throwing kunai.`;
    }
    else if (turn === 13) {
      narrativeScene = `You order: ${actionText}. You pursue the Takeda spy through the dense pine forest. In a flurry of steel on wet leaves, you corner him. He fights desperately, but your squad disarms him. You retrieve the letter—it is signed with Araki's red wax seal, describing the exact date of the Takeda's main cavalry siege assault!${restrictionNotice}`;
      npcDialogue = `"You have the proof, Captain. But Araki has many loyal guards in the castle. If we strike too early, we might trigger a bloody mutiny inside the Keep," Officer Mototada counsels with heavy worry.`;
    }
    else { // Turn 14 & 15 outcome
      narrativeScene = `You order: ${actionText}. Lady Miyako summons you to the wooden pavilion overlooking the beautiful valley foothills. She is watching the distant columns of black smoke rising from raided outlying farms. She turns her keen, solemn eyes toward you, offering her full backing to depose the traitor Araki.${restrictionNotice}`;
      npcDialogue = `"General Araki's treason will cut our throat from within, Captain Hattori. If we do not arrest him soon, our castle gates will open from the inside when the Takeda army arrives. I will stand by your side," Lady Miyako vows quietly.`;
    }

    nextChoices = [
      { id: 'noon_drill_su1', text: 'Lead intense high-noon drills to build soldier stamina (Leadership +)', type: 'training', actionKey: 'drill_troops' },
      { id: 'seek_miyako_su1', text: 'Consult Lady Miyako to help coordinate the formal arrest of Araki (Relationship +)', type: 'relationship', actionKey: 'talk_mototada' },
      { id: 'intercept_spy_su1', text: 'Patrol the outer borders to intercept Takeda message couriers (Combat risk)', type: 'combat', actionKey: 'patrol_border' },
      { id: 'arrest_araki_su1', text: 'March into the high war court to arrest General Araki for treason (Politics +)', type: 'politics', actionKey: 'work_barracks' }
    ];
  }
  // Chapter 4: The Circle of Fire (Turns 16 - 20)
  else if (turn <= 20) {
    oldState.currentLocation = 'Anegakoji Keep - Western Fortifications';
    oldState.currentContext = 'Summer, 1541. The main Takeda army has encircled Anegakoji Keep! The siege begins.';
    time.season = 'Summer';

    if (turn === 16) { // Turn 15 outcome (siege begins)
      narrativeScene = `You order: ${actionText}. The high horns of Anegakoji Keep blow in a sudden frenzy! The summer sky is choked with columns of thick black smoke as the foothills are torched. Thousands of Takeda red-cavalry soldiers have set camp around the base of Anegakoji, erecting heavy siege barricades and launching flaming arrows!${restrictionNotice}`;
      npcDialogue = `"The circle of fire has closed around us, Captain Hattori! We are surrounded, and our food reservoirs must be strictly managed if we are to survive this summer siege," Sergeant Goro yells, shielding his eyes from the ash.`;
    }
    else if (turn === 17) {
      narrativeScene = `Following your action: ${actionText}, Grand Commander Nobuhide coordinates a daring nighttime raid. You lead your squad down the hidden ravine paths, carrying oil torches. You strike the Takeda siege engine lines in a flurry of chaos, setting fire to their heavy wooden catapults before retreating back behind our sturdy gate walls.${restrictionNotice}`;
      npcDialogue = `"A glorious sortie, Captain Hattori! You fight with the true fire of your ancestors! We have broken their immediate siege machines!" General Nobuhide roars with laughter, patting your steel-clad shoulder.`;
    }
    else if (turn === 18) {
      narrativeScene = `You order: ${actionText}. In the heavy, humid summer heat, your rival Katsuro challenges you to a high-stakes spear duel in the central courtyard to settle your disputes. Weary ashigaru soldiers gather in a circle to watch. Your spear-tips clash, sparks flying in the air, and you gracefully disarm Katsuro, earning the deep respect of the entire garrison.${restrictionNotice}`;
      npcDialogue = `"You... you are the better warrior, Hattori. I let my jealousy blind me. From this day, my squad stands ready to follow your strategic lead," Katsuro mutters, bowing low and offering his yari in respect.`;
    }
    else { // Turn 19 & 20 outcome
      narrativeScene = `You order: ${actionText}. A Takeda delegation under a white flag of truce approaches the castle gates. They offer a peaceful surrender: if we deliver Lord Yasutane's head and open the gates, the garrison and the farmers will be spared. You stand on the ramparts beside Torii Mototada, deciding on the reply.${restrictionNotice}`;
      npcDialogue = `"An Anegakoji samurai does not trade his lord's head for safety! We will fight until our swords splinter and our blood drinks the soil!" Torii Mototada roars, firing an arrow that lands inches from the Takeda envoy's feet.`;
    }

    nextChoices = [
      { id: 'wall_archery_su2', text: 'Drill your ashigaru archers in firing blazing arrows from the towers (Leadership +)', type: 'training', actionKey: 'drill_troops' },
      { id: 'sortie_raid_su2', text: 'Lead a risky night sortie to burn Takeda food provision wagons (Combat risk)', type: 'combat', actionKey: 'patrol_border' },
      { id: 'stand_with_kenji_su2', text: 'Rally with Deputy Kenji to bolster the spirits of shivering garrison troops (Relationship +)', type: 'relationship', actionKey: 'talk_mototada' },
      { id: 'ration_stores_su2', text: 'Audit and strictly ration the castle food stores to prolong survival (Economy +)', type: 'economy', actionKey: 'work_barracks' }
    ];
  }
  // Chapter 5: The Clashing Steel & Final Victory (Turns 21+)
  else {
    oldState.currentLocation = 'Anegakoji Keep - Gates of Destiny';
    oldState.currentContext = 'Autumn, 1541. The final, desperate Takeda assault is underway! Repel Shingen\'s forces!';
    time.season = 'Autumn';

    if (turn === 21) {
      narrativeScene = `You order: ${actionText}. The final battle has arrived! Under a cold autumn downpour, the red-banner Takeda army launches a massive, desperate assault. Ladders are raised against the eastern towers, and a heavy wooden ram batters the main gate. Your ashigaru hold the line, fighting side-by-side against wave after wave of elite samurai.${restrictionNotice}`;
      npcDialogue = `"Hold the walls! Pour boiling oil and let the yari spears drink their fill! We do not yield Anegakoji!" General Nobuhide roars, cut and bleeding but fighting like a war god.`;
    }
    else if (turn === 22) {
      narrativeScene = `Following your action: ${actionText}, Kunoichi Chiyo alerts you that General Araki's remaining mutineers have killed the gate guards and are attempting to open the western sally port to let the Takeda cavalry inside! You sprint across the rain-swept courtyard, engaging in a bloody, dramatic clash against the traitors and successfully sealing the gate!${restrictionNotice}`;
      npcDialogue = `"Your quick reflexes saved the fortress, Captain Hattori! The sally port is sealed, and General Araki has been slain in single combat! The mutiny is crushed!" Deputy Kenji gasps, binding his arm.`;
    }
    else if (turn === 23) {
      narrativeScene = `You order: ${actionText}. Lord Takeda Shingen himself watches from the misty mountain ridges as his vanguard breaks against your legendary yari spear-wall defenses. Realizing that Anegakoji Keep has become an unbreakable rock, and with winter snows threatening to cut off his supply lines back to Kai, Shingen orders his war horns to sound the general retreat!${restrictionNotice}`;
      npcDialogue = `"They are retreating! The red flags are falling back into the valley! We have held the castle! We have survived!" Sergeant Goro screams, waving his helmet in wild triumph.`;
    }
    else { // Turn 24+ (Victory state!)
      oldState.gameVictory = true;
      oldState.gameOver = true;
      narrativeScene = `You order: ${actionText}. Lord Yasutane and the entire high court assemble in the grand war chamber. The banners of Anegakoji are raised high in the cool autumn wind. For your unmatched bravery, brilliant tactical strategy, and loyalty in exposing treason, Lord Yasutane formally promotes you to Grand Commander of the Anegakoji Forces, awarding you your late father's legendary lacquered armor.${restrictionNotice}`;
      npcDialogue = `"Li Hattori, you have written an epic chapter of survival in the history of Shinano. Your father watches from the heavens with absolute pride. The Anegakoji clan is secure, thanks to your sword!" Lord Yasutane declares solemnly, presenting the ancestral blade.`;
    }

    nextChoices = [
      { id: 'victory_celebrate', text: 'Assemble the garrison to raise a toast of victory sake (Win Game)', type: 'politics', actionKey: 'drill_troops' }
    ];
  }

  // Set the narrative outputs and choices
  oldState.narrativeScene = narrativeScene;
  oldState.npcDialogue = npcDialogue;
  oldState.choices = nextChoices;

  return oldState;
}
