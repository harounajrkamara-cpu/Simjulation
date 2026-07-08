import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createInitialState, applyMechanicalEffect, generateLocalFallback } from './src/gameEngine.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy Gemini Initialization
function getGeminiClient(useUserKey: boolean = false): GoogleGenAI {
  // Support both the correct name and the user's misspelled name 'GEMINI_API_KE'
  const envKey = process.env.GEMINI_API_KEY || process.env.GEMINI_API_KE;
  const userKey = 'AQ.Ab8RN6KmaarmqwKg4XkWB3bBQGmDrglkgfW3ZEqAcTJFsaKQFA';
  
  // Use user-provided key if requested or if environment key is not set or is the placeholder
  const apiKey = (useUserKey || !envKey || envKey === 'MY_GEMINI_API_KEY') ? userKey : envKey;
  
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// REST APIs
app.post('/api/game/init', (req, res) => {
  try {
    const initialState = createInitialState();
    res.json(initialState);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/game/action', async (req, res) => {
  try {
    const { state, choiceId, customText } = req.body;
    if (!state) {
      return res.status(400).json({ error: 'Missing game state' });
    }

    // 1. Run deterministic mechanical rules simulation
    const oldState = { ...state };
    const mechanicalLog = applyMechanicalEffect(oldState, choiceId, customText);

    // 2. Weave state changes into rich Gemini narrative
    let ai;
    let fallbackToUserKey = false;
    try {
      ai = getGeminiClient(false);
    } catch (keyError: any) {
      try {
        ai = getGeminiClient(true);
        fallbackToUserKey = true;
      } catch (innerError: any) {
        const fallbackState = {
          ...oldState,
          narrativeScene: `[API KEY NOT CONFIGURED] Mechanical updates have been applied successfully! To unlock immersive Sengoku AI storytelling and NPC memories, please click "Settings" in the upper-right corner and add your GEMINI_API_KEY.\n\nSimulated result: ${mechanicalLog}`,
          npcDialogue: '"Welcome to the mountains, Captain. Keep training your men and minding the budget," says Sergeant Goro, loyal to the end.',
          choices: [
            { id: 'drill_squad', text: 'Drill your Ashigaru squad in the snow (Leadership & troop morale +)', type: 'training', actionKey: 'drill_troops' },
            { id: 'train_spear_val', text: 'Practice spear-work under General Nobuhide (Valor & spear skill +)', type: 'training', actionKey: 'train_spear' },
            { id: 'patrol_pass', text: 'Patrol the snowy mountain pass to ward off scouts (Combat risk)', type: 'combat', actionKey: 'patrol_border' },
            { id: 'talk_officer', text: 'Consult with your mentor Officer Mototada on local defenses', type: 'relationship', actionKey: 'talk_mototada' },
            { id: 'assist_repair', text: 'Lead your squad to assist in Barracks Fortification (Project progress)', type: 'economy', actionKey: 'work_barracks' }
          ]
        };
        return res.json(fallbackState);
      }
    }

    // Build the descriptive context for Gemini
    const playerDesc = `
      Name: ${oldState.player.name}
      Rank: ${oldState.player.rank} (Merit: ${oldState.player.merit}/100)
      Age: ${oldState.player.age}
      Stats: LEA=${oldState.player.stats.LEA}, VAL=${oldState.player.stats.VAL}, INT=${oldState.player.stats.INT}, POL=${oldState.player.stats.POL}
      Skills: sword=${oldState.player.skills.sword}, spear=${oldState.player.skills.spear}, archery=${oldState.player.skills.archery}, strategy=${oldState.player.skills.strategy}, stealth=${oldState.player.skills.stealth}, admin=${oldState.player.skills.administration}
      Squad size: ${oldState.player.troops} (${oldState.player.troopType}), Troop Morale: ${oldState.player.troopMorale}/100
      Fatigue: ${oldState.player.fatigue}/100, Personal Morale: ${oldState.player.morale}/100
      Injuries: ${oldState.player.injuries.join(', ') || 'None'}
    `;

    const npcBriefs = oldState.npcs.map((n: any) => 
      `- ${n.name} (${n.role}, Clan: ${n.clan}): Loyalty=${n.loyalty}, Respect=${n.respect}, Trust=${n.trust}, Fear=${n.fear}, Rivalry=${n.rivalry}. Personality: ${n.personality}. Memory: ${n.memories[0]?.event || 'None'}`
    ).join('\n');

    const worldBrief = `
      Current Date: ${oldState.time.year} Month ${oldState.time.month} Day ${oldState.time.day} (Season: ${oldState.time.season})
      Location: ${oldState.currentLocation}
      Context: ${oldState.currentContext}
      Economy: Gold/Koku=${oldState.economy.koku}, Food Bags=${oldState.economy.food}, Gear Quality=${oldState.economy.equipment}%
      Active Threats: ${oldState.activeThreats.map((t: any) => `${t.description} (ETA: ${t.etaDays} days, severity: ${t.severity})`).join('; ') || 'None'}
      Active Projects: ${oldState.activeProjects.map((p: any) => `${p.name} (${p.progress}% completed)`).join('; ') || 'None'}
    `;

    const playerActionDesc = choiceId === 'free_input' 
      ? `Typed Custom action: "${customText}"`
      : `Selected Action: "${choiceId}" (Rules categorized this as actionKey: ${req.body.choiceId || 'custom'})`;

    const systemPrompt = `
      You are the ultimate Game Master and Sengoku-era narrator for a persistent Strategy-RPG simulation game set in Japan, 1540.
      
      CORE SYSTEM STATS & WORLD DATA:
      === Player character ===
      ${playerDesc}

      === Factions & NPCs ===
      ${npcBriefs}

      === Current Time & Resources ===
      ${worldBrief}

      === Action Executed ===
      ${playerActionDesc}
      Mechanical calculation outcome: ${mechanicalLog}

      YOUR GOAL:
      Write a compelling, atmospheric narrative scene in the first person of 1540 Sengoku Japan (clashing armor, heavy snow, smell of charcoal and sake, clattering spears).
      Describe the direct narrative outcome of the action and rules calculation. Show how the environment reacts (Winter makes travel brutal, Spring melting shifts armies).
      If the player spoke to or interacted with an NPC (e.g. Lord Yoshitsugu, Lady Miyako, General Nobuhide, Torii Mototada, or Kenji), write a highly responsive, authentic dialogue that remembers their trust, fear, and loyalty level.
      Always maintain the historical gravity of the era. No modern jargon. Keep the tone ancient, suspenseful, and filled with samurai grit.

      CRITICAL: You must provide the next 4 or 5 options to guide the player's path. Options must reflect the current winter setting, threat timers, and active projects. Each option must have a text description, a category type, and map to an actionKey ('drill_troops', 'train_spear', 'patrol_border', 'talk_mototada', 'work_barracks').
    `;

    let narrativeScene = '';
    let npcDialogue = '';
    let choices = oldState.choices;

    try {
      // Prompt Gemini with strict JSON Schema
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }]
          }
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              narrativeScene: {
                type: Type.STRING,
                description: "Narrative story of the action outcome, keeping track of the environmental conditions (winter, etc) and squad status. Max 3 rich paragraphs. Keep it atmospheric."
              },
              npcDialogue: {
                type: Type.STRING,
                description: "Direct speech spoken by an involved NPC reflecting their loyalty/trust/rivalry values. If no NPC speaks, narrate a thoughtful inner monologue or sergeant Kenji's response."
              },
              choices: {
                type: Type.ARRAY,
                description: "Exactly 4 or 5 next choices. Must map to actionKeys.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    text: { type: Type.STRING, description: "Display action text (e.g. 'Warm the shivering squad by the furnace and speak of strategy')" },
                    type: { type: Type.STRING, description: "Must be one of: 'training', 'politics', 'combat', 'economy', 'relationship'" },
                    actionKey: { type: Type.STRING, description: "The deterministic key that executes rules. Must be: 'drill_troops', 'train_spear', 'patrol_border', 'talk_mototada', 'work_barracks'" }
                  },
                  required: ["id", "text", "type", "actionKey"]
                }
              }
            },
            required: ["narrativeScene", "npcDialogue", "choices"]
          }
        }
      });

      let resultText = response.text || '';
      if (resultText.startsWith('```')) {
        resultText = resultText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
      }
      const responseJson = JSON.parse(resultText);
      narrativeScene = responseJson.narrativeScene;
      npcDialogue = responseJson.npcDialogue;
      choices = responseJson.choices || oldState.choices;
    } catch (apiError: any) {
      if (!fallbackToUserKey) {
        console.warn('First attempt failed, retrying with user-provided key...', apiError);
        try {
          ai = getGeminiClient(true);
          fallbackToUserKey = true;
          
          const retryResponse = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: [
              {
                role: 'user',
                parts: [{ text: systemPrompt }]
              }
            ],
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  narrativeScene: {
                    type: Type.STRING,
                    description: "Narrative story of the action outcome, keeping track of the environmental conditions (winter, etc) and squad status. Max 3 rich paragraphs. Keep it atmospheric."
                  },
                  npcDialogue: {
                    type: Type.STRING,
                    description: "Direct speech spoken by an involved NPC reflecting their loyalty/trust/rivalry values. If no NPC speaks, narrate a thoughtful inner monologue or sergeant Kenji's response."
                  },
                  choices: {
                    type: Type.ARRAY,
                    description: "Exactly 4 or 5 next choices. Must map to actionKeys.",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        text: { type: Type.STRING, description: "Display action text" },
                        type: { type: Type.STRING, description: "Must be one of: 'training', 'politics', 'combat', 'economy', 'relationship'" },
                        actionKey: { type: Type.STRING, description: "The deterministic key that executes rules. Must be: 'drill_troops', 'train_spear', 'patrol_border', 'talk_mototada', 'work_barracks'" }
                      },
                      required: ["id", "text", "type", "actionKey"]
                    }
                  }
                },
                required: ["narrativeScene", "npcDialogue", "choices"]
              }
            }
          });

          let resultText = retryResponse.text || '';
          if (resultText.startsWith('```')) {
            resultText = resultText.replace(/^```json\s*/, '').replace(/```$/, '').trim();
          }
          const responseJson = JSON.parse(resultText);
          narrativeScene = responseJson.narrativeScene;
          npcDialogue = responseJson.npcDialogue;
          choices = responseJson.choices || oldState.choices;
          
          const newState = {
            ...oldState,
            narrativeScene,
            npcDialogue,
            choices,
          };
          if (newState.time.season === 'Spring') {
            newState.currentLocation = 'Anegakoji Keep Gates';
            newState.currentContext = 'The snows are melting into muddy torrents. The Anegakoji banner flags are raised high. Scouts report Takeda cavalry on the move.';
          }
          return res.json(newState);
        } catch (retryError: any) {
          console.error('Retry with user key also failed:', retryError);
        }
      }

      console.warn('Gemini API/Parsing failed, using dynamic local fallback narrator:', apiError);
      
      const is403 = apiError.message && (apiError.message.includes('403') || apiError.message.includes('denied') || apiError.message.includes('permission'));
      const fallbackState = generateLocalFallback(oldState, choiceId, customText, is403);
      
      return res.json(fallbackState);
    }

  } catch (error: any) {
    console.error('Action error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Vite Middleware & Static Assets serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sengoku RPG Server listening on port ${PORT}`);
  });
}

startServer();
