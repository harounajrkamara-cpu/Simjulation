import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Swords, 
  User, 
  Users, 
  Coins, 
  Flame, 
  Scroll, 
  BookOpen, 
  Sparkles, 
  History, 
  Map, 
  Settings, 
  Database, 
  Upload, 
  Download, 
  RefreshCw, 
  Compass, 
  Heart, 
  Skull, 
  Clock, 
  Calendar,
  ChevronRight,
  TrendingUp,
  Sliders,
  AlertTriangle,
  Award
} from 'lucide-react';
import { GameState, Choice, NPC, Faction } from './types';
import { CombatClashOverlay } from './components/CombatClashOverlay';

export default function App() {
  const [state, setState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [customAction, setCustomAction] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('story');
  
  // Save slot states
  const [saveSlots, setSaveSlots] = useState<string[]>(['Slot 1: Empty', 'Slot 2: Empty', 'Slot 3: Empty']);
  const [importJson, setImportJson] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isClashing, setIsClashing] = useState<boolean>(false);

  // Auto-scroll target for story
  const storyEndRef = useRef<HTMLDivElement | null>(null);

  // 1. Initial Load: Check localStorage, otherwise initialize from server
  useEffect(() => {
    const savedState = localStorage.getItem('sengoku_rpg_state');
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setState(parsed);
        setLoading(false);
        updateSaveSlots();
        return;
      } catch (e) {
        console.warn('Failed to parse cached save. Reloading from server.', e);
      }
    }
    initializeNewGame();
  }, []);

  const updateSaveSlots = () => {
    const slots = ['slot1', 'slot2', 'slot3'].map((slot, idx) => {
      const data = localStorage.getItem(`sengoku_save_${slot}`);
      if (data) {
        try {
          const parsed = JSON.parse(data) as GameState;
          return `Slot ${idx + 1}: ${parsed.player.rank} ${parsed.player.name} (${parsed.time.season} ${parsed.time.year})`;
        } catch {
          return `Slot ${idx + 1}: Corrupted Data`;
        }
      }
      return `Slot ${idx + 1}: [Empty Slot]`;
    });
    setSaveSlots(slots);
  };

  const initializeNewGame = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/game/init', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to fetch initial state');
      const data = await res.json();
      setState(data);
      localStorage.setItem('sengoku_rpg_state', JSON.stringify(data));
      setLoading(false);
      updateSaveSlots();
    } catch (err: any) {
      setError(err.message || 'Failed to start game server.');
      setLoading(false);
    }
  };

  // 2. Submit Action (Choice or custom input)
  const handleAction = async (choiceId: string, actionKey?: string, textInput?: string) => {
    if (!state || loading) return;
    setLoading(true);
    setError(null);

    // Scroll to top of story pane
    setActiveTab('story');

    try {
      const oldCombatLogIds = new Set(
        (state.eventLog || [])
          .filter(e => e.type === 'combat')
          .map(e => e.id)
      );

      const response = await fetch('/api/game/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state,
          choiceId: actionKey || choiceId,
          customText: textInput
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Server simulation failed to process action.');
      }

      const updatedState = await response.json();
      setState(updatedState);
      
      // Check for new combat logs
      const hasNewCombatLog = (updatedState.eventLog || []).some(
        (e: any) => e.type === 'combat' && !oldCombatLogIds.has(e.id)
      );

      if (hasNewCombatLog) {
        setIsClashing(true);
      }
      
      // Auto-save
      localStorage.setItem('sengoku_rpg_state', JSON.stringify(updatedState));
      setCustomAction('');
      updateSaveSlots();
    } catch (err: any) {
      setError(err.message || 'Action execution error.');
    } finally {
      setLoading(false);
      // Scroll to view new story
      setTimeout(() => {
        storyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  // Save/Load Actions
  const saveGameSlot = (slotKey: string) => {
    if (!state) return;
    localStorage.setItem(`sengoku_save_${slotKey}`, JSON.stringify(state));
    showNotification(`Game successfully saved to ${slotKey.toUpperCase()}!`);
    updateSaveSlots();
  };

  const loadGameSlot = (slotKey: string) => {
    const data = localStorage.getItem(`sengoku_save_${slotKey}`);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        setState(parsed);
        localStorage.setItem('sengoku_rpg_state', JSON.stringify(parsed));
        showNotification(`Loaded ${slotKey.toUpperCase()} save state successfully!`);
        setActiveTab('story');
      } catch {
        setError('Failed to load. Save data might be corrupted.');
      }
    } else {
      setError('Selected save slot is empty.');
    }
  };

  const deleteGameSlot = (slotKey: string) => {
    localStorage.removeItem(`sengoku_save_${slotKey}`);
    showNotification(`Deleted save data from ${slotKey.toUpperCase()}.`);
    updateSaveSlots();
  };

  const exportSaveState = () => {
    if (!state) return;
    const jsonStr = JSON.stringify(state);
    navigator.clipboard.writeText(jsonStr);
    showNotification('Save state JSON copied to clipboard!');
  };

  const importSaveState = () => {
    if (!importJson.trim()) return;
    try {
      const parsed = JSON.parse(importJson);
      if (!parsed.player || !parsed.time || !parsed.npcs) {
        throw new Error('Invalid schema format.');
      }
      setState(parsed);
      localStorage.setItem('sengoku_rpg_state', JSON.stringify(parsed));
      showNotification('Imported external save state successfully!');
      setImportJson('');
      setActiveTab('story');
    } catch (e: any) {
      setError('Failed to import: ' + e.message);
    }
  };

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  if (!state) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-stone-950 text-stone-200 p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center max-w-md text-center border border-stone-800 bg-stone-900/60 p-8 rounded-xl shadow-2xl"
        >
          <Compass className="w-16 h-16 text-rose-700 animate-spin mb-4" />
          <h2 className="text-2xl font-semibold tracking-wide text-rose-500 font-sans mb-2">Assembling Kiba Clan Legions</h2>
          <p className="text-stone-400 text-sm mb-6">Connecting to historical server simulations, weather cycles, and faction alliances. Stand ready...</p>
          {error && <p className="text-xs text-red-400 border border-red-900 bg-red-950/40 p-3 rounded mb-4">{error}</p>}
          <button 
            onClick={initializeNewGame}
            className="px-6 py-2 bg-rose-800 text-rose-100 rounded hover:bg-rose-700 transition"
          >
            Force Restart Engine
          </button>
        </motion.div>
      </div>
    );
  }

  const p = state.player;
  const time = state.time;
  const econ = state.economy;

  // Render season indicators
  const getSeasonColor = (s: string) => {
    switch (s) {
      case 'Winter': return 'text-sky-300 border-sky-900/40 bg-sky-950/20';
      case 'Spring': return 'text-emerald-400 border-emerald-900/40 bg-emerald-950/20';
      case 'Summer': return 'text-amber-400 border-amber-900/40 bg-amber-950/20';
      case 'Autumn': return 'text-orange-400 border-orange-900/40 bg-orange-950/20';
      default: return 'text-stone-400';
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-rose-800 selection:text-white">
      {/* 1. Header Navigation Bar */}
      <header className="border-b border-stone-800 bg-stone-900/80 backdrop-blur px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-stone-800 border border-rose-900/50 flex items-center justify-center text-rose-600 shadow-inner">
            <Swords className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-mono tracking-widest text-rose-500 uppercase font-semibold">Japan • 1540</span>
            <h1 className="text-lg font-bold tracking-tight text-stone-100 font-sans">Sengoku Soldier</h1>
          </div>
        </div>

        {/* Date & Global Economy Quick Display */}
        <div className="flex items-center space-x-6">
          {/* Season Date */}
          <div className={`px-4 py-1.5 rounded-full border flex items-center space-x-2 text-xs font-mono font-medium ${getSeasonColor(time.season)}`}>
            <Calendar className="w-3.5 h-3.5" />
            <span>Year {time.year}, Month {time.month}, Day {time.day}</span>
            <span className="opacity-60">|</span>
            <span className="font-semibold tracking-wide uppercase">{time.season}</span>
          </div>

          {/* Quick Stats */}
          <div className="hidden md:flex items-center space-x-4 text-xs font-mono">
            <div className="flex items-center space-x-1 text-amber-500 bg-amber-950/20 px-2.5 py-1 rounded border border-amber-900/30">
              <Coins className="w-3.5 h-3.5" />
              <span>{econ.koku} Koku</span>
            </div>
            <div className="flex items-center space-x-1 text-emerald-500 bg-emerald-950/20 px-2.5 py-1 rounded border border-emerald-900/30">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{econ.food} Rice</span>
            </div>
            <div className="flex items-center space-x-1 text-rose-500 bg-rose-950/20 px-2.5 py-1 rounded border border-rose-900/30">
              <Users className="w-3.5 h-3.5" />
              <span>{p.troops} Troops</span>
            </div>
          </div>

          {/* Quick Controls */}
          <button 
            onClick={initializeNewGame}
            title="Reset Game State"
            className="p-1.5 text-stone-400 hover:text-stone-100 bg-stone-800 hover:bg-stone-700 rounded border border-stone-700 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Success Messages alert banner */}
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-emerald-950 border-b border-emerald-800 text-emerald-300 px-6 py-2 text-xs font-mono text-center flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>{successMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Main 3-Column Bento Grid Layout */}
      <div className="flex-1 p-4 grid grid-cols-1 md:grid-cols-12 gap-4 overflow-y-auto max-w-7xl mx-auto w-full">
        
        {/* ================= LEFT COLUMN: INTEL & WORLD THREATS ================= */}
        <aside className="md:col-span-3 flex flex-col space-y-4">
          
          {/* Active Situation Objectives */}
          <div className="bg-stone-900/30 border border-stone-800/80 rounded-xl p-4 flex flex-col space-y-3 shadow-sm">
            <h3 className="text-xs font-mono font-bold tracking-wider text-stone-400 uppercase flex items-center space-x-1.5">
              <Compass className="w-4 h-4 text-rose-500" />
              <span>Current Orders & Goals</span>
            </h3>
            <div className="border-t border-stone-800/80 pt-2.5 space-y-2.5 text-xs">
              <div className="flex items-start space-x-2">
                <span className="mt-0.5 text-rose-500 font-bold font-mono">1.</span>
                <p className="text-stone-200">Prove yourself as Squad Captain. Reach <span className="text-rose-400 font-semibold font-mono">35 Valor</span> or <span className="text-rose-400 font-semibold font-mono">spear skill</span>.</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="mt-0.5 text-rose-500 font-bold font-mono">2.</span>
                <p className="text-stone-200">Secure winter rations. Keep food stockpiles above <span className="text-rose-400 font-semibold font-mono">100 bags</span>.</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="mt-0.5 text-rose-500 font-bold font-mono">3.</span>
                <p className="text-stone-200">Strengthen clan defense. Assist barracks fortification project.</p>
              </div>
              <div className="flex items-start space-x-2">
                <span className="mt-0.5 text-rose-500 font-bold font-mono">4.</span>
                <p className="text-stone-200 text-rose-400/90 font-medium">Survive the Winter freeze. Prepare for Takeda's Spring invasion plain clash.</p>
              </div>
            </div>
          </div>

          {/* Active Threats & Intrigue */}
          <div className="bg-stone-900/30 border border-stone-800/80 rounded-xl p-4 flex flex-col space-y-3 shadow-sm">
            <h3 className="text-xs font-mono font-bold tracking-wider text-stone-400 uppercase flex items-center space-x-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Active Threats</span>
            </h3>
            <div className="border-t border-stone-800/80 pt-2.5 space-y-3">
              {state.activeThreats.map(threat => (
                <div key={threat.id} className="text-xs border border-stone-800/50 bg-stone-950/40 rounded p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className={`font-semibold tracking-wide uppercase px-1.5 py-0.5 rounded text-[10px] ${
                      threat.severity === 'High' ? 'bg-red-950/40 text-red-400 border border-red-900/30' : 'bg-amber-950/40 text-amber-400 border border-amber-900/30'
                    }`}>
                      {threat.severity} Risk
                    </span>
                    <span className="text-stone-400 font-mono text-[11px] flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-rose-500" />
                      <span>ETA {threat.etaDays} days</span>
                    </span>
                  </div>
                  <p className="text-stone-300 leading-relaxed font-sans">{threat.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Key Relationships Quick List */}
          <div className="bg-stone-900/30 border border-stone-800/80 rounded-xl p-4 flex flex-col space-y-3 shadow-sm flex-1 overflow-y-auto max-h-[340px]">
            <h3 className="text-xs font-mono font-bold tracking-wider text-stone-400 uppercase flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-emerald-500" />
              <span>Key Clan Relations</span>
            </h3>
            <div className="border-t border-stone-800/80 pt-2.5 space-y-2.5">
              {state.npcs.slice(0, 5).map(npc => (
                <div key={npc.id} className="text-xs flex flex-col space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-stone-200">{npc.name}</span>
                    <span className="text-[10px] font-mono text-stone-500">{npc.role}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px] font-mono text-stone-400">
                    <div className="flex justify-between">
                      <span>Loyalty:</span>
                      <span className={npc.loyalty > 75 ? "text-emerald-400" : npc.loyalty > 40 ? "text-stone-300" : "text-rose-400"}>{npc.loyalty}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trust:</span>
                      <span className="text-stone-300">{npc.trust}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Respect:</span>
                      <span className="text-stone-300">{npc.respect}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Rivalry:</span>
                      <span className={npc.rivalry > 70 ? "text-amber-500" : "text-stone-400"}>{npc.rivalry}</span>
                    </div>
                  </div>
                  <div className="w-full bg-stone-800 h-1 rounded overflow-hidden">
                    <div className="bg-rose-700 h-full" style={{ width: `${(npc.trust + npc.respect) / 2}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </aside>

        {/* ================= CENTER COLUMN: MAIN GAME ENGINE PANEL ================= */}
        <main className="md:col-span-6 bg-stone-950 border border-stone-800/80 rounded-xl overflow-hidden flex flex-col shadow-lg">
          
          {/* Main Horizontal Tab selectors */}
          <nav className="flex border-b border-stone-800 bg-stone-900/40 text-xs font-mono uppercase tracking-wide overflow-x-auto scrollbar-none">
            {[
              { id: 'story', label: 'Story & Campaign', icon: Swords },
              { id: 'event_log', label: 'Chronicle Log', icon: Scroll },
              { id: 'world_map', label: 'Clans & Power', icon: Map },
              { id: 'inventory', label: 'Fort & Wealth', icon: Coins },
              { id: 'character', label: 'Attributes', icon: User },
              { id: 'saves', label: 'Save / Load', icon: Database },
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setError(null); }}
                  className={`flex-1 py-3 px-4 min-w-[110px] flex items-center justify-center space-x-1.5 border-b-2 transition duration-200 relative whitespace-nowrap ${
                    isActive 
                      ? 'border-rose-600 text-rose-500 bg-stone-950 font-semibold' 
                      : 'border-transparent text-stone-400 hover:text-stone-200 hover:bg-stone-900/30'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-rose-500' : 'text-stone-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Active Tab View Area */}
          <div className="flex-1 p-5 overflow-y-auto min-h-[460px] scrollbar-thin">
            
            {/* Show any action loading animation */}
            {loading && (
              <div className="flex flex-col items-center justify-center space-y-2 py-12">
                <div className="w-8 h-8 rounded-full border-2 border-stone-800 border-t-rose-600 animate-spin"></div>
                <span className="text-xs font-mono text-rose-500 uppercase tracking-widest animate-pulse">Consulting Factions & Spirits...</span>
              </div>
            )}

            {error && (
              <div className="mb-4 border border-red-900/50 bg-red-950/30 text-red-300 p-3 rounded-lg text-xs leading-relaxed space-y-1">
                <p className="font-bold flex items-center space-x-1">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span>Tactical Fault Encountered:</span>
                </p>
                <p className="font-mono">{error}</p>
              </div>
            )}

            {!loading && (
              <AnimatePresence mode="wait">
                {/* 1. STORY TAB */}
                {activeTab === 'story' && (
                  <motion.div
                    key="story"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="space-y-5"
                  >
                    {/* Scene Narrator Card */}
                    <div className="space-y-4">
                      {/* Location & Context Header */}
                      <div className="flex justify-between items-center text-[11px] font-mono text-rose-500 border-b border-stone-800/60 pb-2">
                        <span className="flex items-center space-x-1">
                          <Compass className="w-3.5 h-3.5" />
                          <span>{state.currentLocation}</span>
                        </span>
                        <span className="opacity-80 font-semibold">{time.season} Setting</span>
                      </div>

                      {/* Main Dynamic Story Prose */}
                      <p className="text-[14px] leading-relaxed text-stone-200 font-sans tracking-wide whitespace-pre-line first-letter:text-3xl first-letter:font-bold first-letter:text-rose-600 first-letter:mr-1">
                        {state.narrativeScene}
                      </p>
                    </div>

                    {/* NPC Direct Dialogue card */}
                    {state.npcDialogue && (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-stone-900/40 border-l-4 border-rose-700/80 p-4 rounded-r-lg space-y-1 bg-gradient-to-r from-stone-900/60 to-transparent"
                      >
                        <div className="flex items-center space-x-1 text-[11px] font-mono text-stone-400 font-semibold">
                          <User className="w-3.5 h-3.5 text-rose-500" />
                          <span>Active Character Dialogue</span>
                        </div>
                        <p className="italic text-stone-100 font-serif leading-relaxed text-[13px]">
                          {state.npcDialogue}
                        </p>
                      </motion.div>
                    )}

                    {/* Last Action mechanical change summary panel */}
                    {state.lastActionSummary && (
                      <div className="bg-stone-900/25 border border-stone-800/40 rounded p-3 text-xs font-mono text-stone-400 flex items-start space-x-2">
                        <TrendingUp className="w-4 h-4 text-rose-600 mt-0.5" />
                        <div>
                          <span className="text-stone-300 font-semibold uppercase text-[10px] tracking-wider block mb-0.5">Rules Engine Calculations Applied:</span>
                          <span className="leading-relaxed">{state.lastActionSummary}</span>
                        </div>
                      </div>
                    )}

                    <div ref={storyEndRef} />
                  </motion.div>
                )}

                {/* 2. EVENT CHRONICLE LOG TAB */}
                {activeTab === 'event_log' && (
                  <motion.div
                    key="event_log"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-mono uppercase tracking-widest text-stone-400">Kiba Clan Chronicle Ledger</h4>
                      <span className="text-[10px] font-mono text-stone-500">{state.eventLog.length} historical logs stored</span>
                    </div>

                    <div className="border-t border-stone-800/80 pt-2 space-y-3 max-h-[460px] overflow-y-auto">
                      {state.eventLog.map(log => (
                        <div key={log.id} className="text-xs border border-stone-800/40 bg-stone-900/10 p-3 rounded space-y-1 flex items-start space-x-3 hover:bg-stone-900/30 transition">
                          <div className={`p-1.5 rounded-full border mt-0.5 flex-shrink-0 ${
                            log.type === 'combat' ? 'bg-red-950/40 text-red-500 border-red-900/40' :
                            log.type === 'political' ? 'bg-amber-950/40 text-amber-500 border-amber-900/40' :
                            log.type === 'personal' ? 'bg-blue-950/40 text-blue-400 border-blue-900/40' :
                            'bg-stone-800 text-stone-400 border-stone-700/80'
                          }`}>
                            {log.type === 'combat' ? <Flame className="w-3 h-3" /> :
                             log.type === 'political' ? <Award className="w-3 h-3" /> :
                             log.type === 'personal' ? <User className="w-3 h-3" /> :
                             <Scroll className="w-3 h-3" />}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-stone-500 font-semibold">{log.date}</span>
                              <span className="text-[10px] uppercase font-mono tracking-wide text-stone-500">{log.type}</span>
                            </div>
                            <p className="text-stone-200 leading-relaxed font-sans">{log.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 3. WORLD MAP & FACTIONS TAB */}
                {activeTab === 'world_map' && (
                  <motion.div
                    key="world_map"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="bg-stone-900/40 border border-stone-800 rounded p-4 text-xs leading-relaxed space-y-2">
                      <h4 className="font-semibold text-rose-500 flex items-center space-x-1 uppercase tracking-wider">
                        <Map className="w-4 h-4" />
                        <span>Sengoku Japan Balance of Power (1540)</span>
                      </h4>
                      <p className="text-stone-300">
                        Mountain terrain confines movement during snows, but makes the valleys highly defensible. 
                        As spring unlocks pass paths, major factions will deploy armies to crush local autonomies. Keep alliances aligned.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {state.factions.map(fac => {
                        const isPlayerClan = fac.id === 'kiba';
                        return (
                          <div key={fac.id} className={`border rounded-lg p-3.5 space-y-3 ${
                            isPlayerClan ? 'border-rose-900/60 bg-rose-950/10' : 'border-stone-800 bg-stone-900/20'
                          }`}>
                            <div className="flex justify-between items-start">
                              <div>
                                <h5 className="font-semibold text-stone-200 flex items-center space-x-1">
                                  <span>{fac.name}</span>
                                  {isPlayerClan && <span className="text-[9px] uppercase font-mono bg-rose-900 text-rose-100 border border-rose-700 rounded px-1.5 py-0.5 ml-2">My Clan</span>}
                                </h5>
                                <span className="text-[10px] font-mono text-stone-500">Leader: {fac.leader}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-stone-400 font-mono text-xs font-semibold">Power: {fac.power}/100</span>
                              </div>
                            </div>

                            <div className="space-y-1 text-xs">
                              <span className="text-[10px] text-stone-500 font-mono block">Held Territories:</span>
                              <div className="flex flex-wrap gap-1">
                                {fac.territory.map((t, idx) => (
                                  <span key={idx} className="bg-stone-800 text-stone-300 px-2 py-0.5 rounded text-[10px] border border-stone-700/50">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="border-t border-stone-800 pt-2 text-[11px] space-y-1">
                              <span className="text-[10px] text-stone-500 font-mono block">Relations with others:</span>
                              {Object.entries(fac.relations).map(([target, rel]: [string, any]) => (
                                <div key={target} className="flex justify-between font-mono text-stone-400">
                                  <span className="capitalize">{target} Clan:</span>
                                  <span className={rel > 10 ? 'text-emerald-400' : rel < -30 ? 'text-rose-400' : 'text-stone-300'}>
                                    {rel > 0 ? `+${rel}` : rel} (Affinity)
                                  </span>
                                </div>
                              ))}
                              {isPlayerClan && (
                                <div className="flex justify-between font-mono text-stone-400 border-t border-stone-800 pt-1 mt-1">
                                  <span>Internal Rebels Tension:</span>
                                  <span className={fac.internalTension > 60 ? 'text-red-400 animate-pulse' : 'text-stone-300'}>
                                    {fac.internalTension}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* 4. INVENTORY & PROJECTS TAB */}
                {activeTab === 'inventory' && (
                  <motion.div
                    key="inventory"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    {/* Fort Rations & Assets */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-stone-900/30 border border-stone-800 rounded p-4 space-y-2">
                        <span className="text-[10px] text-stone-400 uppercase font-mono block">Gold (Koku)</span>
                        <div className="flex items-center space-x-2">
                          <Coins className="w-6 h-6 text-amber-500" />
                          <span className="text-xl font-bold font-mono text-stone-100">{econ.koku}</span>
                        </div>
                        <p className="text-[10px] text-stone-500 leading-relaxed leading-normal">
                          Primary currency. Gained through agricultural taxes or Daimyo rewards. Used for fortifications & troop wages.
                        </p>
                      </div>

                      <div className="bg-stone-900/30 border border-stone-800 rounded p-4 space-y-2">
                        <span className="text-[10px] text-stone-400 uppercase font-mono block">Food Reservoirs</span>
                        <div className="flex items-center space-x-2">
                          <BookOpen className="w-6 h-6 text-emerald-500" />
                          <span className="text-xl font-bold font-mono text-stone-100">{econ.food}</span>
                        </div>
                        <p className="text-[10px] text-stone-500 leading-relaxed">
                          Rice bags consumed daily by soldiers. Lacking food causes severe troop desertions and morale failure.
                        </p>
                      </div>

                      <div className="bg-stone-900/30 border border-stone-800 rounded p-4 space-y-2">
                        <span className="text-[10px] text-stone-400 uppercase font-mono block">Squad Equipment</span>
                        <div className="flex items-center space-x-2">
                          <Shield className="w-6 h-6 text-rose-500" />
                          <span className="text-xl font-bold font-mono text-stone-100">{econ.equipment}%</span>
                        </div>
                        <p className="text-[10px] text-stone-500 leading-relaxed">
                          Armor and weapon quality. High equipment grants combat bonuses during clashes.
                        </p>
                      </div>
                    </div>

                    {/* Active Construction Projects */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-mono uppercase tracking-widest text-stone-400">Active Fort Infrastructure Projects</h4>
                      
                      <div className="border border-stone-800 rounded-lg p-4 space-y-4">
                        {state.activeProjects.length === 0 ? (
                          <p className="text-xs text-stone-500 text-center py-6">All projects currently completed or inactive. Initiate labor schemes in story scene.</p>
                        ) : (
                          state.activeProjects.map(proj => (
                            <div key={proj.id} className="space-y-2.5">
                              <div className="flex justify-between text-xs font-medium">
                                <span className="text-stone-200">{proj.name}</span>
                                <span className="text-rose-500 font-mono">{proj.progress}% / 100%</span>
                              </div>
                              <div className="w-full bg-stone-800 h-2.5 rounded-full overflow-hidden">
                                <div className="bg-rose-600 h-full transition-all duration-300" style={{ width: `${proj.progress}%` }}></div>
                              </div>
                              <div className="grid grid-cols-2 text-[10px] font-mono text-stone-400 gap-2">
                                <div>Setup Cost: <span className="text-amber-500">{proj.cost} Koku</span></div>
                                <div>Type: <span className="capitalize">{proj.type}</span></div>
                                <div className="col-span-2 text-stone-300 border-t border-stone-800/80 pt-1 mt-1 leading-relaxed">
                                  Reward: {proj.rewardDescription}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 5. CHARACTER FULL VIEW TAB */}
                {activeTab === 'character' && (
                  <motion.div
                    key="character"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="border border-stone-800 rounded-lg p-4 bg-stone-900/10 space-y-4">
                      <div className="flex items-center space-x-3.5 border-b border-stone-800/80 pb-3">
                        <div className="w-12 h-12 bg-stone-800 border border-rose-900/50 rounded-full flex items-center justify-center text-rose-500">
                          <User className="w-7 h-7" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-base text-stone-100">{p.name}</h4>
                          <span className="text-xs font-mono text-stone-400 uppercase tracking-wider">{p.rank}</span>
                        </div>
                      </div>

                      {/* Attribute sliders */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h5 className="text-[11px] text-stone-500 font-mono uppercase tracking-wider">Primary Core Attributes</h5>
                          <div className="space-y-3.5">
                            {[
                              { label: 'Leadership (LEA)', val: p.stats.LEA, color: 'bg-blue-600', desc: 'Troop command, battlefield strategy' },
                              { label: 'Valor (VAL)', val: p.stats.VAL, color: 'bg-rose-600', desc: 'Personal duels, damage capacity, health' },
                              { label: 'Intelligence (INT)', val: p.stats.INT, color: 'bg-amber-600', desc: 'Military tactics, memory recall, logic' },
                              { label: 'Politics (POL)', val: p.stats.POL, color: 'bg-emerald-600', desc: 'Administration, finances, bribery' },
                            ].map((stat, idx) => (
                              <div key={idx} className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-stone-300 hover:text-stone-100 cursor-help" title={stat.desc}>{stat.label}</span>
                                  <span className="font-mono font-semibold text-stone-100">{stat.val} / 100</span>
                                </div>
                                <div className="w-full bg-stone-800 h-2 rounded overflow-hidden">
                                  <div className={`h-full ${stat.color}`} style={{ width: `${stat.val}%` }}></div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h5 className="text-[11px] text-stone-500 font-mono uppercase tracking-wider">Secondary Weapon Masteries</h5>
                          <div className="space-y-2 text-xs">
                            {[
                              { label: 'Sword Art (Katana)', val: p.skills.sword },
                              { label: 'Spear Art (Yari)', val: p.skills.spear },
                              { label: 'Archery Mastery (Yumi)', val: p.skills.archery },
                              { label: 'Military Strategy', val: p.skills.strategy },
                              { label: 'Stealth & Shinobi tactics', val: p.skills.stealth },
                              { label: 'Farming Administration', val: p.skills.administration },
                            ].map((sk, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-stone-900/30 p-2 rounded border border-stone-800/40">
                                <span className="text-stone-300">{sk.label}</span>
                                <span className="font-mono font-bold text-stone-100">{sk.val}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Active combat abilities */}
                      <div className="space-y-2 border-t border-stone-800/80 pt-3">
                        <h5 className="text-[11px] text-stone-500 font-mono uppercase tracking-wider">Unlocked Combat Abilities</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {p.abilities.map(ab => (
                            <div key={ab.id} className="bg-stone-950/60 border border-stone-800 rounded p-2.5 space-y-1 text-xs">
                              <div className="flex justify-between items-center font-medium text-rose-400">
                                <span>{ab.name}</span>
                                <span className="font-mono text-[10px] bg-stone-900 px-1.5 py-0.5 rounded text-stone-400 border border-stone-800">
                                  Cooldown: {ab.cooldown}/{ab.maxCooldown} turns
                                </span>
                              </div>
                              <p className="text-stone-300 leading-normal text-[11px]">{ab.description}</p>
                              <p className="text-[10px] font-mono text-stone-500 italic">Effect: {ab.effect}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* 6. SAVE / LOAD PERSISTENCE TAB */}
                {activeTab === 'saves' && (
                  <motion.div
                    key="saves"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-4"
                  >
                    <div className="border border-stone-800 rounded-lg p-4 space-y-4 bg-stone-900/10">
                      <h4 className="text-xs font-mono uppercase tracking-widest text-stone-400 flex items-center space-x-1">
                        <Database className="w-4 h-4 text-rose-500" />
                        <span>Sengoku Persistence Saves Manager</span>
                      </h4>

                      <div className="space-y-3">
                        {['slot1', 'slot2', 'slot3'].map((slotKey, idx) => (
                          <div key={slotKey} className="border border-stone-800/80 bg-stone-950/40 p-3.5 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs">
                            <div>
                              <span className="font-mono font-bold text-rose-500 block">SAVE SLOT {idx + 1}</span>
                              <span className="text-stone-300 font-sans mt-0.5 block">{saveSlots[idx]}</span>
                            </div>
                            <div className="flex space-x-2 w-full sm:w-auto">
                              <button
                                onClick={() => saveGameSlot(slotKey)}
                                className="flex-1 sm:flex-none px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded border border-stone-700 transition font-mono text-[11px]"
                              >
                                Save Game
                              </button>
                              <button
                                onClick={() => loadGameSlot(slotKey)}
                                className="flex-1 sm:flex-none px-3 py-1.5 bg-rose-900/50 hover:bg-rose-800/60 text-rose-200 rounded border border-rose-800/50 transition font-mono text-[11px]"
                              >
                                Load Slot
                              </button>
                              <button
                                onClick={() => deleteGameSlot(slotKey)}
                                title="Delete Save"
                                className="px-2 py-1.5 bg-stone-900 hover:bg-red-950/30 text-stone-500 hover:text-red-400 rounded border border-stone-800 transition"
                              >
                                <Skull className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Export/Import JSON persistence */}
                      <div className="border-t border-stone-800 pt-4 space-y-3">
                        <h5 className="text-[11px] font-mono text-stone-400 uppercase tracking-wider flex items-center space-x-1">
                          <Upload className="w-3.5 h-3.5" />
                          <span>External JSON Save Export / Import</span>
                        </h5>
                        <p className="text-[11px] text-stone-500 leading-relaxed">
                          Export your Sengoku World state as a JSON string to copy it safely to text notes or other browsers. 
                        </p>

                        <div className="flex gap-2.5">
                          <button
                            onClick={exportSaveState}
                            className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-xs font-mono flex items-center space-x-1.5 border border-stone-700 transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Copy Save JSON</span>
                          </button>
                        </div>

                        <div className="space-y-1.5">
                          <textarea
                            value={importJson}
                            onChange={(e) => setImportJson(e.target.value)}
                            placeholder="Paste your exported Sengoku Game JSON string here..."
                            className="w-full h-16 bg-stone-950 border border-stone-800/80 rounded p-2 text-stone-300 text-xs font-mono focus:outline-none focus:border-rose-900/80 scrollbar-none"
                          />
                          <button
                            onClick={importSaveState}
                            disabled={!importJson.trim()}
                            className="px-4 py-2 bg-rose-900/70 hover:bg-rose-800 disabled:opacity-40 text-rose-100 rounded text-xs font-mono transition"
                          >
                            Import JSON State
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}

          </div>

          {/* 3. Bottom controls locked inside the center column */}
          <div className="border-t border-stone-800 bg-stone-900/40 p-4 space-y-3.5">
            {/* Dynamic Button Choice List */}
            {!loading && activeTab === 'story' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {state.choices.map((choice, idx) => (
                  <button
                    key={choice.id || idx}
                    onClick={() => handleAction(choice.id, choice.actionKey)}
                    className="p-3 bg-stone-900/80 hover:bg-stone-800/80 border border-stone-800 hover:border-rose-900/60 rounded-lg text-left text-xs text-stone-200 transition duration-200 flex items-start space-x-2 group active:scale-95 cursor-pointer shadow-sm"
                  >
                    <ChevronRight className="w-4 h-4 text-rose-600 mt-0.5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
                    <span className="leading-relaxed group-hover:text-stone-100">{choice.text}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Custom Free Text Input submission */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (customAction.trim() && !loading) {
                  handleAction('free_input', 'free_input', customAction);
                }
              }}
              className="flex space-x-2"
            >
              <input
                type="text"
                value={customAction}
                onChange={(e) => setCustomAction(e.target.value)}
                disabled={loading}
                placeholder="Submit custom strategic decree (e.g. 'Disguise soldiers as monks to scout Takeda pass', 'Consult Kunoichi Chiyo in private')..."
                className="flex-1 bg-stone-950 border border-stone-850 focus:border-rose-900/60 rounded-lg px-4 py-2.5 text-xs text-stone-200 focus:outline-none placeholder-stone-600 font-sans tracking-wide disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!customAction.trim() || loading}
                className="px-5 py-2.5 bg-rose-800 hover:bg-rose-700 disabled:opacity-40 text-stone-100 rounded-lg text-xs font-mono uppercase tracking-wider font-semibold border border-rose-900/50 transition active:scale-95"
              >
                Send Orders
              </button>
            </form>
          </div>

        </main>

        {/* ================= RIGHT COLUMN: CHARACTER PROFILE & STATS ================= */}
        <aside className="md:col-span-3 flex flex-col space-y-4">
          
          {/* Main Player Profile Card */}
          <div className="bg-stone-900/30 border border-stone-800/80 rounded-xl p-4 flex flex-col items-center text-center space-y-3.5 shadow-sm">
            <div className="relative">
              <div className="w-20 h-20 rounded-full border-2 border-rose-800/80 bg-stone-950 p-1 flex items-center justify-center shadow-lg">
                <div className="w-full h-full rounded-full bg-stone-800 flex items-center justify-center text-rose-500 border border-stone-800">
                  <User className="w-10 h-10" />
                </div>
              </div>
              <span className="absolute bottom-0 right-1 text-[10px] font-mono bg-rose-900 text-rose-100 px-1.5 py-0.5 rounded-full border border-rose-700">
                16 y/o
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-sm font-semibold tracking-wide text-stone-100">{p.name}</h2>
              <span className="text-[10px] font-mono tracking-widest text-stone-400 uppercase bg-stone-900/60 px-2 py-0.5 border border-stone-800/60 rounded">
                {p.rank}
              </span>
            </div>

            {/* Rank Merit progress bar */}
            <div className="w-full space-y-1 text-[11px]">
              <div className="flex justify-between font-mono text-[10px] text-stone-500">
                <span>Merit to Promotion</span>
                <span>{p.merit} / 100</span>
              </div>
              <div className="w-full bg-stone-800 h-1.5 rounded overflow-hidden">
                <div className="bg-rose-700 h-full transition-all duration-300" style={{ width: `${p.merit}%` }}></div>
              </div>
            </div>
          </div>

          {/* Primary Attributes with descriptive popups */}
          <div className="bg-stone-900/30 border border-stone-800/80 rounded-xl p-4 flex flex-col space-y-3 shadow-sm">
            <h3 className="text-xs font-mono font-bold tracking-wider text-stone-400 uppercase flex items-center space-x-1.5">
              <Sliders className="w-4 h-4 text-rose-500" />
              <span>Core Attributes</span>
            </h3>
            <div className="border-t border-stone-800/80 pt-2.5 space-y-2 text-xs">
              {[
                { name: 'Leadership (LEA)', val: p.stats.LEA, desc: 'Increases squad max size and defense', color: 'text-blue-400' },
                { name: 'Valor (VAL)', val: p.stats.VAL, desc: 'Increases melee skill gains and health', color: 'text-rose-400' },
                { name: 'Intelligence (INT)', val: p.stats.INT, desc: 'Aids tactical scouting & plot detection', color: 'text-amber-400' },
                { name: 'Politics (POL)', val: p.stats.POL, desc: 'Improves agricultural yield & koku earnings', color: 'text-emerald-400' },
              ].map(stat => (
                <div key={stat.name} className="flex justify-between items-center" title={stat.desc}>
                  <span className="text-stone-300 cursor-help">{stat.name}:</span>
                  <span className={`font-mono font-bold ${stat.color}`}>{stat.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Primary Masteries & Skills progress indicators */}
          <div className="bg-stone-900/30 border border-stone-800/80 rounded-xl p-4 flex flex-col space-y-3 shadow-sm flex-1">
            <h3 className="text-xs font-mono font-bold tracking-wider text-stone-400 uppercase flex items-center space-x-1.5">
              <Swords className="w-4 h-4 text-amber-500" />
              <span>Weapon Masteries</span>
            </h3>
            <div className="border-t border-stone-800/80 pt-2.5 space-y-3">
              {[
                { label: 'Spear Art', val: p.skills.spear },
                { label: 'Sword Art', val: p.skills.sword },
                { label: 'Archery Art', val: p.skills.archery },
                { label: 'Stealth tactics', val: p.skills.stealth },
                { label: 'Castle Administration', val: p.skills.administration },
              ].map(sk => (
                <div key={sk.label} className="space-y-1 text-xs">
                  <div className="flex justify-between font-mono text-[10px] text-stone-400">
                    <span>{sk.label}</span>
                    <span>{sk.val} %</span>
                  </div>
                  <div className="w-full bg-stone-800 h-1 rounded overflow-hidden">
                    <div className="bg-amber-600 h-full" style={{ width: `${sk.val}%` }}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Fatigue and Injury levels */}
            <div className="border-t border-stone-800/80 pt-3.5 space-y-3 mt-auto">
              {/* Fatigue */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-mono text-[10px] text-stone-400">
                  <span>Squad Captain Fatigue</span>
                  <span className={p.fatigue > 50 ? 'text-rose-400 font-bold' : 'text-stone-300'}>{p.fatigue} %</span>
                </div>
                <div className="w-full bg-stone-800 h-1.5 rounded overflow-hidden">
                  <div className={`h-full ${p.fatigue > 60 ? 'bg-red-600' : p.fatigue > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${p.fatigue}%` }}></div>
                </div>
              </div>

              {/* Injuries */}
              <div className="space-y-1 text-xs">
                <span className="text-[10px] font-mono text-stone-500 uppercase block">Active Injuries ({p.injuries.length})</span>
                {p.injuries.length === 0 ? (
                  <span className="text-[11px] text-emerald-400 block font-medium">✓ Perfectly healthy & unscarred</span>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {p.injuries.map((injury, idx) => (
                      <span key={idx} className="bg-red-950/40 text-red-400 border border-red-900/40 rounded px-2 py-0.5 text-[10px] flex items-center space-x-1">
                        <Skull className="w-3 h-3 flex-shrink-0" />
                        <span>{injury}</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

        </aside>

      </div>

      {isClashing && (
        <CombatClashOverlay onComplete={() => setIsClashing(false)} />
      )}

      {/* 3. Footer info bar */}
      <footer className="border-t border-stone-800 bg-stone-950 px-6 py-2.5 text-center text-[10px] font-mono text-stone-500">
        <span>Sengoku Soldier Strategy-RPG Simulation v1.4.0 • Built with Google Gemini 3.5 AI and Express</span>
      </footer>
    </div>
  );
}
