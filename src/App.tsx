import React, { useState, useEffect } from 'react';
import { GameMode, Player, MatchRecord } from './types';
import { Calculator } from './components/Calculator';
import { SettingsModal } from './components/SettingsModal';
import { GAME_MODE_LABELS } from './constants';

const App = () => {
  // Global State
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.ORIGINAL);
  const [round, setRound] = useState(1);
  const [dealerIdx, setDealerIdx] = useState(0);
  const [history, setHistory] = useState<MatchRecord[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [sound, setSound] = useState(true);

  // UI State
  const [screen, setScreen] = useState<'title' | 'game' | 'stats'>('title');
  const [calcTarget, setCalcTarget] = useState<number | null>(null); // Index of player being calculated
  const [showSettings, setShowSettings] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);

  // New Game Flow State
  const [newGameStage, setNewGameStage] = useState<'none' | 'confirm' | 'select'>('none');
  const [clearPlayers, setClearPlayers] = useState(false);

  // Persist State
  useEffect(() => {
    const saved = localStorage.getItem('flip7_v_data');
    if (saved) {
      const data = JSON.parse(saved);
      setPlayers(data.players || []);
      setGameMode(data.gameMode || GameMode.ORIGINAL);
      setHistory(data.history || []);
      setTheme(data.theme || 'dark');
      setSound(data.sound !== undefined ? data.sound : true);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('flip7_v_data', JSON.stringify({
      players, gameMode, history, theme, sound
    }));
    // Apply theme
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
  }, [players, gameMode, history, theme, sound]);

  const playSound = (type: 'click' | 'win' | 'bust') => {
    if (!sound) return;
    // Placeholder for sound logic
  };

  const handleNewGameRequest = () => {
    if (players.length > 0) {
      setNewGameStage('confirm');
      setClearPlayers(false);
    } else {
      setNewGameStage('select');
    }
  };

  const handleConfirmNewGame = () => {
    setNewGameStage('select');
  };

  const startGame = (mode: GameMode) => {
    setGameMode(mode);
    
    if (clearPlayers) {
      setPlayers([]);
    } else {
      setPlayers(players.map(p => ({
         ...p, score: 0, history: [], busted: false, 
         currentInput: '', isFlip7: false, isX2: false, isDiv2: false, bonusTotal: 0
      })));
    }
    
    setRound(1);
    setDealerIdx(0);
    setScreen('game');
    setWinner(null);
    setNewGameStage('none');
  };

  const addPlayer = (name: string) => {
    if (!name.trim()) return;
    setPlayers([...players, {
      id: Date.now().toString(),
      name,
      score: 0,
      history: [],
      busted: false,
      dealer: false,
      currentInput: '',
      isFlip7: false,
      isX2: false,
      isDiv2: false,
      bonusTotal: 0
    }]);
  };

  const removePlayer = (idx: number) => {
    const newP = [...players];
    newP.splice(idx, 1);
    setPlayers(newP);
  };

  const handleCalcSubmit = (total: number, bonus: number, isF7: boolean, isX2: boolean, isDiv2: boolean) => {
    if (calcTarget === null) return;
    const newP = [...players];
    const p = newP[calcTarget];
    p.currentInput = total.toString();
    p.bonusTotal = bonus;
    p.isFlip7 = isF7;
    p.isX2 = isX2;
    p.isDiv2 = isDiv2;
    setPlayers(newP);
    setCalcTarget(null);
  };

  const toggleBust = (idx: number) => {
    const newP = [...players];
    newP[idx].busted = !newP[idx].busted;
    if (newP[idx].busted) {
      newP[idx].currentInput = '';
      newP[idx].bonusTotal = 0;
      newP[idx].isFlip7 = false;
      newP[idx].isX2 = false;
      newP[idx].isDiv2 = false;
      playSound('bust');
    }
    setPlayers(newP);
  };

  const submitRound = () => {
    let potentialGameWinner: Player | null = null;

    const newPlayers = players.map(p => {
      if (p.busted) {
        return { ...p, busted: false, currentInput: '', bonusTotal: 0, isFlip7: false, isX2: false, isDiv2: false };
      }
      
      const roundScore = parseInt(p.currentInput || '0', 10);
      const newTotal = p.score + roundScore;
      
      // Check win condition (usually 200)
      if (newTotal >= 200) {
        if (!potentialGameWinner || newTotal > potentialGameWinner.score) {
          potentialGameWinner = { ...p, score: newTotal };
        }
      }

      return {
        ...p,
        score: newTotal,
        history: [...p.history, roundScore],
        currentInput: '',
        bonusTotal: 0,
        isFlip7: false,
        isX2: false,
        isDiv2: false,
        busted: false
      };
    });

    setPlayers(newPlayers);
    setRound(r => r + 1);
    setDealerIdx(d => (d + 1) % players.length);

    if (potentialGameWinner) {
      setWinner(potentialGameWinner);
      playSound('win');
      setHistory(prev => [{
         date: new Date().toLocaleDateString(),
         winner: (potentialGameWinner as Player).name,
         score: (potentialGameWinner as Player).score,
         mode: gameMode
      }, ...prev].slice(0, 10));
    }
  };

  // Views
  if (screen === 'title') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-6 relative bg-bg">
        <div className="w-32 h-32 rounded-3xl bg-[#111] border-2 border-primary flex items-center justify-center text-6xl shadow-[0_0_30px_rgba(64,196,255,0.3)] animate-pulse">
          🎴
        </div>
        <div>
           <h1 className="text-4xl font-black text-white tracking-tight">FLIPMASTER 7</h1>
           <p className="text-primary font-bold uppercase tracking-widest text-sm mt-1">Scoring Companion</p>
        </div>

        <div className="w-full max-w-xs space-y-3 pt-6 z-10">
          {players.length > 0 ? (
             <>
               <button onClick={() => setScreen('game')} className="w-full p-4 bg-primary text-black font-black rounded-xl uppercase shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
                 Continue Game
               </button>
               <div className="text-xs text-subtext font-bold">
                 Playing: {GAME_MODE_LABELS[gameMode]}
               </div>
               <button onClick={handleNewGameRequest} className="w-full p-4 bg-white/10 hover:bg-white/20 border border-white/10 text-white font-black rounded-xl uppercase transition-all mt-4">
                 New Game / Change Mode
               </button>
             </>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-subtext font-bold uppercase mb-2">Select Game Mode</div>
              <button onClick={() => startGame(GameMode.ORIGINAL)} className="w-full text-left p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 hover:border-primary/50 transition-all group flex items-center justify-between">
                 <span className="font-black text-white group-hover:text-primary transition-colors">ORIGINAL</span>
                 <span className="text-xs text-gray-500 bg-black/30 px-2 py-1 rounded">Standard</span>
              </button>
              
              <button onClick={() => startGame(GameMode.VENGEANCE)} className="w-full text-left p-4 rounded-xl bg-gradient-to-r from-red-900/20 to-transparent border border-red-500/20 hover:border-red-500/50 hover:from-red-900/30 transition-all group flex items-center justify-between">
                 <span className="font-black text-white group-hover:text-bust transition-colors">VENGEANCE</span>
                 <span className="text-xs text-bust bg-black/30 px-2 py-1 rounded">Hardcore</span>
              </button>

              <button onClick={() => startGame(GameMode.COMBO)} className="w-full text-left p-4 rounded-xl bg-gradient-to-r from-purple-900/20 to-transparent border border-purple-500/20 hover:border-purple-500/50 hover:from-purple-900/30 transition-all group flex items-center justify-between">
                 <span className="font-black text-white group-hover:text-f7 transition-colors">COMBO</span>
                 <span className="text-xs text-f7 bg-black/30 px-2 py-1 rounded">Chaotic</span>
              </button>
            </div>
          )}

          <div className="flex gap-3 pt-6">
             <button onClick={() => setScreen('stats')} className="flex-1 bg-white/5 p-3 rounded-xl text-sm font-bold text-subtext hover:bg-white/10 transition-colors">HISTORY</button>
             <button onClick={() => setShowSettings(true)} className="flex-1 bg-white/5 p-3 rounded-xl text-sm font-bold text-subtext hover:bg-white/10 transition-colors">SETTINGS</button>
          </div>
        </div>
        
        {/* Modals */}
        <SettingsModal 
           isOpen={showSettings} 
           onClose={() => setShowSettings(false)} 
           theme={theme} toggleTheme={() => setTheme(t => t === 'light' ? 'dark' : 'light')}
           sound={sound} toggleSound={() => setSound(!sound)}
        />

        {/* New Game Confirmation Modal */}
        {newGameStage === 'confirm' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setNewGameStage('none')}>
             <div className="bg-bg border border-bust/30 w-full max-w-sm rounded-2xl p-6 shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="absolute top-0 left-0 w-full h-1 bg-bust"></div>
                <h2 className="text-2xl font-black text-white mb-2">New Game?</h2>
                <p className="text-gray-400 mb-6">Current game progress and scores will be lost.</p>
                
                <label className="flex items-center gap-3 p-3 rounded-xl bg-white/5 mb-6 cursor-pointer hover:bg-white/10 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={clearPlayers} 
                    onChange={e => setClearPlayers(e.target.checked)}
                    className="w-5 h-5 rounded border-gray-500 text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-bold text-white">Clear player names too</span>
                </label>

                <div className="grid grid-cols-2 gap-3">
                   <button onClick={() => setNewGameStage('none')} className="py-3 rounded-xl bg-white/10 font-bold text-gray-300 hover:bg-white/20">Cancel</button>
                   <button onClick={handleConfirmNewGame} className="py-3 rounded-xl bg-bust text-white font-bold hover:brightness-110 shadow-[0_0_15px_rgba(255,82,82,0.3)]">Confirm</button>
                </div>
             </div>
          </div>
        )}

        {/* Mode Selection Modal (Only triggered from New Game flow if players exist) */}
        {newGameStage === 'select' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setNewGameStage('none')}>
             <div className="bg-bg border border-primary/30 w-full max-w-sm rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-black text-white mb-6 text-center">Select Mode</h2>
                
                <div className="space-y-3">
                  <button onClick={() => startGame(GameMode.ORIGINAL)} className="w-full text-left p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/15 hover:border-primary/50 transition-all group">
                     <div className="font-black text-white group-hover:text-primary transition-colors">ORIGINAL</div>
                     <div className="text-xs text-gray-500 mt-1">Standard rules. Multipliers add bonuses.</div>
                  </button>
                  
                  <button onClick={() => startGame(GameMode.VENGEANCE)} className="w-full text-left p-4 rounded-xl bg-gradient-to-r from-red-900/20 to-transparent border border-red-500/20 hover:border-red-500/50 hover:from-red-900/30 transition-all group">
                     <div className="font-black text-white group-hover:text-bust transition-colors">VENGEANCE</div>
                     <div className="text-xs text-gray-500 mt-1">Brutal rules. Zeros wipe scores. Negative modifiers.</div>
                  </button>

                  <button onClick={() => startGame(GameMode.COMBO)} className="w-full text-left p-4 rounded-xl bg-gradient-to-r from-purple-900/20 to-transparent border border-purple-500/20 hover:border-purple-500/50 hover:from-purple-900/30 transition-all group">
                     <div className="font-black text-white group-hover:text-f7 transition-colors">COMBO</div>
                     <div className="text-xs text-gray-500 mt-1">Mix of both decks. Max chaos.</div>
                  </button>
                </div>

                <button onClick={() => setNewGameStage('none')} className="mt-6 w-full py-3 rounded-xl bg-white/5 font-bold text-gray-400 hover:text-white hover:bg-white/10">
                  Back
                </button>
             </div>
          </div>
        )}

      </div>
    );
  }

  if (screen === 'stats') {
      return (
          <div className="min-h-screen p-6">
              <button onClick={() => setScreen('title')} className="mb-6 text-subtext font-bold">← BACK</button>
              <h2 className="text-2xl font-black text-primary mb-4">MATCH HISTORY</h2>
              <div className="space-y-2">
                  {history.length === 0 ? <div className="text-gray-500">No matches recorded.</div> : history.map((h, i) => (
                      <div key={i} className="bg-white/5 p-4 rounded-xl border border-white/10 flex justify-between items-center">
                          <div>
                              <div className="font-bold text-white">{h.winner}</div>
                              <div className="text-xs text-subtext">{h.date} • {GAME_MODE_LABELS[h.mode]}</div>
                          </div>
                          <div className="text-xl font-black text-primary">{h.score}</div>
                      </div>
                  ))}
              </div>
          </div>
      )
  }

  // GAME SCREEN
  return (
    <div className="min-h-screen flex flex-col p-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="glass-panel rounded-2xl p-4 mb-4 flex justify-between items-center bg-white/5">
        <div>
           <h2 className="text-xs font-bold text-primary tracking-widest">ROUND {round}</h2>
           <div className="text-xs text-subtext uppercase">{GAME_MODE_LABELS[gameMode]}</div>
        </div>
        <button onClick={() => setScreen('title')} className="px-4 py-2 bg-white/10 rounded-lg text-xs font-bold hover:bg-white/20">MENU</button>
      </div>
      
      {/* Winner Overlay */}
      {winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-500">
            <div className="text-center p-8">
                <div className="text-6xl mb-4 animate-bounce">👑</div>
                <h1 className="text-4xl font-black text-primary mb-2">{winner.name}</h1>
                <p className="text-xl text-white mb-8">WINS WITH {winner.score} POINTS!</p>
                <div className="flex flex-col gap-3">
                    <button onClick={() => setScreen('title')} className="px-8 py-4 bg-primary text-black font-black rounded-xl hover:scale-105 transition-transform">RETURN TO TITLE</button>
                    <button onClick={() => { setWinner(null); setScreen('stats'); }} className="px-8 py-4 bg-white/10 text-white font-bold rounded-xl">VIEW STATS</button>
                </div>
            </div>
        </div>
      )}

      {/* Players List */}
      <div className="flex-1 space-y-3 overflow-y-auto pb-32">
        {players.map((p, idx) => (
          <div key={p.id} className={`relative transition-all ${p.busted ? 'opacity-50 grayscale' : ''}`}>
             <div className={`p-4 rounded-2xl border ${p.score >= Math.max(...players.map(pl=>pl.score)) && p.score > 0 ? 'border-primary bg-primary/5' : 'border-white/10 bg-white/5'}`}>
                <div className="flex justify-between items-center mb-3">
                   <div className="flex items-center gap-3">
                      <div 
                         onClick={() => setDealerIdx(idx)}
                         className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border ${dealerIdx === idx ? 'bg-white text-black border-white' : 'border-gray-600 text-gray-500 cursor-pointer'}`}
                      >
                         D
                      </div>
                      <div>
                         <div className="font-bold text-lg leading-none">{p.name}</div>
                         <div className="text-3xl font-black text-primary leading-none mt-1">{p.score}</div>
                      </div>
                   </div>
                   
                   <div className="flex flex-col gap-2 items-end">
                      <button 
                         onClick={() => toggleBust(idx)}
                         className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${p.busted ? 'bg-gray-700 text-gray-400' : 'bg-bust text-white'}`}
                      >
                        {p.busted ? 'Un-Bust' : 'BUST'}
                      </button>
                      
                      {/* Round Input Trigger */}
                      <button 
                         onClick={() => setCalcTarget(idx)}
                         disabled={p.busted}
                         className="flex items-center gap-2 bg-black/40 px-3 py-2 rounded-xl border border-white/20 min-w-[80px] justify-center hover:border-primary/50 transition-colors"
                      >
                         {p.currentInput ? (
                             <span className="font-bold text-white text-lg">{p.currentInput}</span>
                         ) : (
                             <span className="text-gray-500 text-sm">Tap to Score</span>
                         )}
                      </button>
                   </div>
                </div>

                {/* Badges */}
                <div className="flex gap-2">
                    {p.isFlip7 && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-f7/20 text-f7 border border-f7/50">FLIP 7</span>}
                    {p.isX2 && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-500 border border-yellow-500/50">X2</span>}
                    {p.isDiv2 && <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-500 border border-blue-500/50">÷2</span>}
                    {p.bonusTotal !== 0 && <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${p.bonusTotal > 0 ? 'bg-bonus/20 text-bonus border-bonus/50' : 'bg-bust/20 text-bust border-bust/50'}`}>{p.bonusTotal > 0 ? '+' : ''}{p.bonusTotal}</span>}
                </div>
             </div>
             <button onClick={() => removePlayer(idx)} className="absolute -top-2 -right-2 w-6 h-6 bg-red-900/80 rounded-full text-white flex items-center justify-center text-xs opacity-0 hover:opacity-100 transition-opacity">×</button>
          </div>
        ))}
        
        {/* Add Player Input */}
        <div className="flex gap-2 mt-4">
           <input 
             type="text" 
             placeholder="Player Name..." 
             className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-primary"
             onKeyDown={(e) => {
                 if (e.key === 'Enter') {
                     addPlayer(e.currentTarget.value);
                     e.currentTarget.value = '';
                 }
             }}
           />
           <button onClick={(e) => {
               const input = e.currentTarget.previousElementSibling as HTMLInputElement;
               addPlayer(input.value);
               input.value = '';
           }} className="bg-white/10 px-4 rounded-xl font-bold text-2xl text-primary hover:bg-white/20">+</button>
        </div>
      </div>

      {/* Footer Submit */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-bg via-bg to-transparent">
         <div className="max-w-lg mx-auto">
            <button onClick={submitRound} className="w-full bg-primary text-black font-black text-xl py-4 rounded-2xl shadow-lg shadow-primary/20 active:scale-95 transition-transform hover:brightness-110">
               SUBMIT ROUND
            </button>
         </div>
      </div>

      {/* Calculator Modal */}
      {calcTarget !== null && (
          <div className="fixed inset-0 z-40 bg-bg flex flex-col pt-safe animate-in slide-in-from-bottom duration-300">
              <Calculator 
                 mode={gameMode} 
                 playerName={players[calcTarget].name}
                 onClose={() => setCalcTarget(null)}
                 onSubmit={handleCalcSubmit}
              />
          </div>
      )}
    </div>
  );
};

export default App;