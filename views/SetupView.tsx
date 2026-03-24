
import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { GameConfig, Player, InOutRule, MatchMode } from '../types';
import { GameType } from './GameSelectionView';
import { Mic, MicOff, Shield } from 'lucide-react';

interface SetupViewProps {
  gameType?: GameType; // Add gameType prop
  onStart: (players: Player[], config: GameConfig) => void;
  onBack: () => void;
}

export const SetupView: React.FC<SetupViewProps> = ({ onStart, onBack, gameType = 'X01' }) => {
  const [startingScore, setStartingScore] = useState(501);
  const [customScoreStr, setCustomScoreStr] = useState('170');

  const [matchMode, setMatchMode] = useState<MatchMode>('LEGS');
  const [legsToWin, setLegsToWin] = useState(3);
  const [setsToWin, setSetsToWin] = useState(3);
  
  // New: Doubles Mode
  const [isDoubles, setIsDoubles] = useState(false);
  const [enableVoice, setEnableVoice] = useState(false);

  // Player State
  const [playerNames, setPlayerNames] = useState<string[]>(['Player 1', 'Player 2']);
  
  // Doubles specific state
  const [team1Names, setTeam1Names] = useState(['Player 1', 'Player 2']);
  const [team2Names, setTeam2Names] = useState(['Player 3', 'Player 4']);

  // Defaults: Double Out, Open In
  const [checkOut, setCheckOut] = useState<InOutRule>('Double');
  const [checkIn, setCheckIn] = useState<InOutRule>('Open');

  // Randomizer specific state
  const [randomizerTargetPoints, setRandomizerTargetPoints] = useState(30);
  const [randomizerTargetMinutes, setRandomizerTargetMinutes] = useState(20);
  const [randomizerEasyMode, setRandomizerEasyMode] = useState(false);
  const [randomizerEndCondition, setRandomizerEndCondition] = useState<'POINTS' | 'MINUTES'>('POINTS');

  // Solo Player Count
  const updatePlayerCount = (delta: number) => {
    const currentCount = playerNames.length;
    const newCount = Math.max(1, Math.min(4, currentCount + delta));
    
    if (newCount === currentCount) return;

    setPlayerNames(prev => {
      if (newCount > prev.length) {
        return [...prev, `Player ${newCount}`];
      } else {
        return prev.slice(0, newCount);
      }
    });
  };

  const updatePlayerName = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const updateTeamName = (team: 1 | 2, index: number, name: string) => {
      if (team === 1) {
          const n = [...team1Names];
          n[index] = name;
          setTeam1Names(n);
      } else {
          const n = [...team2Names];
          n[index] = name;
          setTeam2Names(n);
      }
  }

  const handleStart = () => {
    const safeStartingScore = startingScore > 0 ? startingScore : 501;
    let players: Player[] = [];

    if (isDoubles) {
        const p1 = { id: 't1p1', name: team1Names[0].trim() || 'Player 1', teamId: 'team1' };
        const p2 = { id: 't1p2', name: team1Names[1].trim() || 'Player 2', teamId: 'team1' };
        const p3 = { id: 't2p1', name: team2Names[0].trim() || 'Player 3', teamId: 'team2' };
        const p4 = { id: 't2p2', name: team2Names[1].trim() || 'Player 4', teamId: 'team2' };
        players = [p1, p2, p3, p4];
    } else {
        players = playerNames.map((name, i) => ({
            id: `p${i+1}`,
            name: name.trim() || `Player ${i+1}`,
            teamId: `p${i+1}` 
        }));
    }

    const config: GameConfig = {
      startingScore: safeStartingScore,
      checkIn,
      checkOut,
      matchMode,
      legsToWin, 
      setsToWin,
      isDoubles,
      enableVoice,
      randomizerTargetPoints: randomizerEndCondition === 'POINTS' ? randomizerTargetPoints : undefined,
      randomizerTargetMinutes: randomizerEndCondition === 'MINUTES' ? randomizerTargetMinutes : undefined,
      randomizerEasyMode
    };

    onStart(players, config);
  };

  const activeOptionClass = "bg-gradient-to-r from-orange-600 to-red-600 text-white border-transparent shadow-[0_0_10px_rgba(234,88,12,0.3)]";
  const inactiveOptionClass = "bg-gray-800 border-gray-700 text-gray-400 hover:border-orange-500/50 hover:text-gray-200";

  const getRuleDescription = (type: 'in' | 'out', rule: InOutRule) => {
     if (type === 'out') {
         switch(rule) {
             case 'Open': return "Finish on any segment.";
             case 'Double': return "Standard: Finish on a Double or Bullseye.";
             case 'Master': return "Finish on a Double, Triple or Bullseye.";
         }
     } else {
         switch(rule) {
             case 'Open': return "Start scoring immediately.";
             case 'Double': return "Must hit a Double to start.";
             case 'Master': return "Must hit a Double or Triple to start.";
         }
     }
  };
  
  const presets = [301, 501, 701, 1001];
  const isPresetSelected = presets.includes(startingScore);
  const isCustomActive = !isPresetSelected || startingScore === parseInt(customScoreStr || '0');

  const handleCustomFocus = () => {
      const val = parseInt(customScoreStr);
      if (!isNaN(val)) setStartingScore(val);
  };

  const handleCustomChange = (valStr: string) => {
      setCustomScoreStr(valStr);
      const val = parseInt(valStr);
      if (!isNaN(val)) setStartingScore(val);
  };
  
  const getTitle = () => {
      if (gameType === 'CLOCK') return 'ROUND THE WORLD';
      if (gameType === '180') return '180 ATTACK';
      if (gameType === 'CRICKET') return 'CRICKET SETUP';
      if (gameType === 'CAPITAL') return 'CAPITAL SETUP';
      if (gameType === 'RANDOMIZER') return 'RANDOMIZER SETUP';
      if (gameType === 'TRIATHLON') return 'TRIATHLON SETUP';
      return 'MATCH SETUP';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6 flex flex-col">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={onBack} size="sm">← Back</Button>
        <h2 className="text-2xl font-black italic ml-4 text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
            {getTitle()}
        </h2>
      </div>

      <div className="flex-1 space-y-6 max-w-md mx-auto w-full overflow-y-auto pb-4 custom-scrollbar">
        
        {/* Score Selection - ONLY FOR X01 */}
        {gameType === 'X01' && (
            <section>
            <label className="block text-orange-500 mb-2 text-xs font-bold uppercase tracking-widest">Starting Score</label>
            <div className="grid grid-cols-4 gap-2 mb-3">
                {presets.map(score => (
                <button
                    key={score}
                    onClick={() => setStartingScore(score)}
                    className={`py-3 rounded font-black border transition-all duration-200 ${startingScore === score ? activeOptionClass : inactiveOptionClass}`}
                >
                    {score}
                </button>
                ))}
            </div>
            
            <div 
                className={`flex items-center space-x-3 p-3 rounded-lg border transition-all duration-200 ${isCustomActive && !presets.includes(startingScore) ? 'bg-gray-800 border-orange-500 shadow-[0_0_10px_rgba(234,88,12,0.15)]' : 'bg-gray-800/30 border-gray-700'}`}
                onClick={handleCustomFocus}
            >
                <span className={`text-xs font-bold uppercase tracking-wider whitespace-nowrap ${isCustomActive && !presets.includes(startingScore) ? 'text-orange-500' : 'text-gray-500'}`}>Custom Score</span>
                <input 
                    type="number" 
                    min="1"
                    max="9999"
                    value={customScoreStr}
                    onChange={(e) => handleCustomChange(e.target.value)}
                    onFocus={handleCustomFocus}
                    className={`w-full bg-transparent text-right font-mono font-black text-xl focus:outline-none focus:text-orange-500 ${isCustomActive && !presets.includes(startingScore) ? 'text-white' : 'text-gray-500'}`}
                    placeholder="Enter score..."
                />
            </div>
            </section>
        )}

        {/* Players Configuration */}
        <section>
            <div className="flex justify-between items-center mb-2">
                <label className="block text-orange-500 text-xs font-bold uppercase tracking-widest">Players</label>
                {/* Doubles only for X01 currently */}
                {gameType === 'X01' && (
                    <div className="flex bg-gray-800 rounded p-1">
                        <button onClick={() => setIsDoubles(false)} className={`px-3 py-1 text-xs font-bold rounded ${!isDoubles ? 'bg-gray-600 text-white' : 'text-gray-500'}`}>Solo</button>
                        <button onClick={() => setIsDoubles(true)} className={`px-3 py-1 text-xs font-bold rounded ${isDoubles ? 'bg-gray-600 text-white' : 'text-gray-500'}`}>Doubles (2v2)</button>
                    </div>
                )}
            </div>

            {!isDoubles ? (
                <>
                    <div className="flex items-center space-x-4 bg-gray-800/50 p-2 rounded-lg mb-4 border border-gray-700">
                        <button onClick={() => updatePlayerCount(-1)} className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded text-xl font-bold transition-colors">-</button>
                        <span className="flex-1 text-center font-black text-2xl text-white">{playerNames.length}</span>
                        <button onClick={() => updatePlayerCount(1)} className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded text-xl font-bold transition-colors">+</button>
                    </div>
                    <div className="space-y-2">
                        {playerNames.map((name, index) => (
                        <div key={index} className="flex items-center group">
                            <span className="w-8 text-gray-500 text-xs font-bold group-hover:text-orange-500 transition-colors">#{index + 1}</span>
                            <input
                            type="text"
                            value={name}
                            onChange={(e) => updatePlayerName(index, e.target.value)}
                            onFocus={(e) => e.target.select()}
                            className="flex-1 bg-gray-800 border border-gray-700 text-white px-3 py-3 rounded font-bold focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                            placeholder={`Player ${index + 1}`}
                            />
                        </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="space-y-4">
                    <div className="bg-gray-800/30 p-3 rounded border border-gray-700">
                        <div className="text-xs text-orange-500 font-bold uppercase mb-2">Team 1</div>
                        <div className="space-y-2">
                            <input value={team1Names[0]} onChange={(e) => updateTeamName(1, 0, e.target.value)} className="w-full bg-gray-800 border border-gray-600 text-white px-2 py-2 rounded text-sm" placeholder="Player 1" />
                            <input value={team1Names[1]} onChange={(e) => updateTeamName(1, 1, e.target.value)} className="w-full bg-gray-800 border border-gray-600 text-white px-2 py-2 rounded text-sm" placeholder="Player 2" />
                        </div>
                    </div>
                    <div className="bg-gray-800/30 p-3 rounded border border-gray-700">
                        <div className="text-xs text-orange-500 font-bold uppercase mb-2">Team 2</div>
                        <div className="space-y-2">
                            <input value={team2Names[0]} onChange={(e) => updateTeamName(2, 0, e.target.value)} className="w-full bg-gray-800 border border-gray-600 text-white px-2 py-2 rounded text-sm" placeholder="Player 3" />
                            <input value={team2Names[1]} onChange={(e) => updateTeamName(2, 1, e.target.value)} className="w-full bg-gray-800 border border-gray-600 text-white px-2 py-2 rounded text-sm" placeholder="Player 4" />
                        </div>
                    </div>
                </div>
            )}
        </section>

        {/* Format - ONLY FOR X01 */}
        {gameType === 'X01' && (
            <section>
            <label className="block text-orange-500 mb-2 text-xs font-bold uppercase tracking-widest">Match Format</label>
            
            <div className="flex p-1 bg-gray-800 rounded-lg border border-gray-700 mb-4">
                <button onClick={() => setMatchMode('LEGS')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all ${matchMode === 'LEGS' ? 'bg-gray-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}>
                    Legs
                </button>
                <button onClick={() => setMatchMode('SETS')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all ${matchMode === 'SETS' ? 'bg-gray-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}>
                    Sets
                </button>
            </div>

            <div className="bg-gray-800/30 p-4 rounded-lg border border-gray-700 space-y-4">
                {matchMode === 'LEGS' ? (
                    <div>
                    <label className="text-gray-400 text-[10px] font-bold uppercase mb-2 block">Legs to Win Match</label>
                    <div className="grid grid-cols-5 gap-2">
                        {[1, 3, 5, 7, 9].map(num => (
                            <button key={num} onClick={() => setLegsToWin(num)} className={`py-2 rounded font-bold text-sm border ${legsToWin === num ? 'bg-orange-600 border-transparent text-white' : 'bg-gray-800 border-gray-600 text-gray-400'}`}>
                                {num}
                            </button>
                        ))}
                    </div>
                    </div>
                ) : (
                    <>
                    <div>
                        <label className="text-gray-400 text-[10px] font-bold uppercase mb-2 block">Sets to Win Match</label>
                        <div className="grid grid-cols-4 gap-2">
                            {[1, 3, 5, 7].map(num => (
                                <button key={num} onClick={() => setSetsToWin(num)} className={`py-2 rounded font-bold text-sm border ${setsToWin === num ? 'bg-orange-600 border-transparent text-white' : 'bg-gray-800 border-gray-600 text-gray-400'}`}>
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-gray-400 text-[10px] font-bold uppercase mb-2 block">Legs to Win a Set</label>
                        <div className="grid grid-cols-4 gap-2">
                            {[3, 5].map(num => (
                                <button key={num} onClick={() => setLegsToWin(num)} className={`py-2 rounded font-bold text-sm border ${legsToWin === num ? 'bg-orange-600 border-transparent text-white' : 'bg-gray-800 border-gray-600 text-gray-400'}`}>
                                    {num}
                                </button>
                            ))}
                        </div>
                    </div>
                    </>
                )}
            </div>
            </section>
        )}

        {/* In / Out Rules - ONLY FOR X01 */}
        {gameType === 'X01' && (
            <section className="grid grid-cols-1 gap-6">
            <div>
                <label className="block text-orange-500 mb-2 text-xs font-bold uppercase tracking-widest">Check In Rule</label>
                <div className="flex p-1 bg-gray-800 rounded-lg border border-gray-700 mb-2">
                    {(['Open', 'Double', 'Master'] as const).map(rule => (
                        <button
                        key={rule}
                        onClick={() => setCheckIn(rule)}
                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all duration-200 ${checkIn === rule ? 'bg-gray-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                        {rule} In
                        </button>
                    ))}
                </div>
                <p className="text-[10px] text-gray-500 italic px-1 h-3">{getRuleDescription('in', checkIn)}</p>
            </div>

            <div>
                <label className="block text-orange-500 mb-2 text-xs font-bold uppercase tracking-widest">Checkout Rule</label>
                <div className="flex p-1 bg-gray-800 rounded-lg border border-gray-700 mb-2">
                    {(['Open', 'Double', 'Master'] as const).map(rule => (
                        <button
                        key={rule}
                        onClick={() => setCheckOut(rule)}
                        className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all duration-200 ${checkOut === rule ? 'bg-gray-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                        {rule} Out
                        </button>
                    ))}
                </div>
                <p className="text-[10px] text-gray-500 italic px-1 h-3">{getRuleDescription('out', checkOut)}</p>
            </div>
            </section>
        )}

        {/* Advanced Options - AI Voice (X01 Only) */}
        {gameType === 'X01' && (
            <section className="pt-2">
                <label className="block text-orange-500 mb-2 text-xs font-bold uppercase tracking-widest">Options</label>
                <div 
                    onClick={() => setEnableVoice(!enableVoice)}
                    className={`
                        relative overflow-hidden rounded-xl border p-4 cursor-pointer transition-all duration-300
                        ${enableVoice 
                            ? 'bg-cyan-900/20 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]' 
                            : 'bg-gray-800/40 border-gray-700 hover:bg-gray-800/60'}
                    `}
                >
                    <div className="flex justify-between items-center z-10 relative">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${enableVoice ? 'bg-cyan-500 text-black' : 'bg-gray-700 text-gray-400'}`}>
                                <Mic className="w-5 h-5" />
                            </div>
                            <div>
                                <div className={`font-bold text-sm ${enableVoice ? 'text-cyan-400' : 'text-gray-300'}`}>Assistant IA Vocal</div>
                                <div className="text-[10px] text-gray-500 leading-tight mt-0.5">
                                    Annoncez le score total de la volée. <br/> Ex: "Cent quatre-vingt", "Soixante", "Vingt-six"
                                </div>
                            </div>
                        </div>

                        {/* Switch UI */}
                        <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${enableVoice ? 'bg-cyan-500' : 'bg-gray-700'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${enableVoice ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </div>
                    </div>
                    
                    {/* Active Background Effect */}
                    {enableVoice && (
                        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent pointer-events-none"></div>
                    )}
                </div>
            </section>
        )}

        {/* Randomizer Specific Options */}
        {gameType === 'RANDOMIZER' && (
            <section className="space-y-6">
                <div>
                    <label className="block text-orange-500 mb-2 text-xs font-bold uppercase tracking-widest">End Condition</label>
                    <div className="flex p-1 bg-gray-800 rounded-lg border border-gray-700 mb-4">
                        <button onClick={() => setRandomizerEndCondition('POINTS')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all ${randomizerEndCondition === 'POINTS' ? 'bg-gray-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}>
                            Points Limit
                        </button>
                        <button onClick={() => setRandomizerEndCondition('MINUTES')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all ${randomizerEndCondition === 'MINUTES' ? 'bg-gray-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}>
                            Time Limit
                        </button>
                    </div>

                    {randomizerEndCondition === 'POINTS' ? (
                        <div>
                            <label className="text-gray-400 text-[10px] font-bold uppercase mb-2 block">Target Points</label>
                            <div className="grid grid-cols-4 gap-2">
                                {[10, 20, 30, 50].map(num => (
                                    <button key={num} onClick={() => setRandomizerTargetPoints(num)} className={`py-2 rounded font-bold text-sm border ${randomizerTargetPoints === num ? 'bg-orange-600 border-transparent text-white' : 'bg-gray-800 border-gray-600 text-gray-400'}`}>
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <label className="text-gray-400 text-[10px] font-bold uppercase mb-2 block">Target Minutes</label>
                            <div className="grid grid-cols-4 gap-2">
                                {[10, 15, 20, 30].map(num => (
                                    <button key={num} onClick={() => setRandomizerTargetMinutes(num)} className={`py-2 rounded font-bold text-sm border ${randomizerTargetMinutes === num ? 'bg-orange-600 border-transparent text-white' : 'bg-gray-800 border-gray-600 text-gray-400'}`}>
                                        {num}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <label className="block text-orange-500 mb-2 text-xs font-bold uppercase tracking-widest">Difficulty</label>
                    <div 
                        onClick={() => setRandomizerEasyMode(!randomizerEasyMode)}
                        className={`
                            relative overflow-hidden rounded-xl border p-4 cursor-pointer transition-all duration-300
                            ${randomizerEasyMode 
                                ? 'bg-green-900/20 border-green-500/50 shadow-[0_0_20px_rgba(34,197,94,0.15)]' 
                                : 'bg-gray-800/40 border-gray-700 hover:bg-gray-800/60'}
                        `}
                    >
                        <div className="flex justify-between items-center z-10 relative">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${randomizerEasyMode ? 'bg-green-500 text-black' : 'bg-gray-700 text-gray-400'}`}>
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className={`font-bold text-sm ${randomizerEasyMode ? 'text-green-400' : 'text-gray-300'}`}>Easy Mode</div>
                                    <div className="text-[10px] text-gray-500 leading-tight mt-0.5">
                                        Points are never reduced if you miss a checkout.
                                    </div>
                                </div>
                            </div>

                            {/* Switch UI */}
                            <div className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${randomizerEasyMode ? 'bg-green-500' : 'bg-gray-700'}`}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${randomizerEasyMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        )}

      </div>

      {/* FOOTER ACTIONS - Moved outside flex-1 for sticky bottom */}
      <div className="mt-4">
        <Button onClick={handleStart} className="w-full py-5 text-2xl shadow-orange-900/20">GAME ON</Button>
      </div>
    </div>
  );
};
