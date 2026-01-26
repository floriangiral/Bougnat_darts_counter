import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { GameConfig, Player, InOutRule, MatchMode } from '../types';

interface SetupViewProps {
  onStart: (players: Player[], config: GameConfig) => void;
  onBack: () => void;
}

export const SetupView: React.FC<SetupViewProps> = ({ onStart, onBack }) => {
  const [startingScore, setStartingScore] = useState(501);
  const [customScoreStr, setCustomScoreStr] = useState('170');

  const [matchMode, setMatchMode] = useState<MatchMode>('LEGS');
  const [legsToWin, setLegsToWin] = useState(3);
  const [setsToWin, setSetsToWin] = useState(3);
  
  // New: Doubles Mode
  const [isDoubles, setIsDoubles] = useState(false);

  // Player State
  const [playerNames, setPlayerNames] = useState<string[]>(['Player 1', 'Player 2']);
  
  // Doubles specific state
  const [team1Names, setTeam1Names] = useState(['Player 1', 'Player 2']);
  const [team2Names, setTeam2Names] = useState(['Player 3', 'Player 4']);

  // Defaults: Double Out, Open In
  const [checkOut, setCheckOut] = useState<InOutRule>('Double');
  const [checkIn, setCheckIn] = useState<InOutRule>('Open');

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
        // Construct players (Initial logical order T1P1, T1P2, T2P1, T2P2)
        // IDs: t1p1, t1p2, t2p1, t2p2
        const p1 = { id: 't1p1', name: team1Names[0].trim() || 'Player 1', teamId: 'team1' };
        const p2 = { id: 't1p2', name: team1Names[1].trim() || 'Player 2', teamId: 'team1' };
        const p3 = { id: 't2p1', name: team2Names[0].trim() || 'Player 3', teamId: 'team2' };
        const p4 = { id: 't2p2', name: team2Names[1].trim() || 'Player 4', teamId: 'team2' };
        
        // Pass them in standard grouping, we reorder in MatchView via "Bull Up" logic
        players = [p1, p2, p3, p4];

    } else {
        players = playerNames.map((name, i) => ({
            id: `p${i+1}`,
            name: name.trim() || `Player ${i+1}`,
            teamId: `p${i+1}` // In solo, teamId = playerId
        }));
    }

    const config: GameConfig = {
      startingScore: safeStartingScore,
      checkIn,
      checkOut,
      matchMode,
      legsToWin, 
      setsToWin,
      isDoubles
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6 flex flex-col">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={onBack} size="sm">← Back</Button>
        <h2 className="text-2xl font-black italic ml-4 text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
            MATCH SETUP
        </h2>
      </div>

      <div className="flex-1 space-y-6 max-w-md mx-auto w-full overflow-y-auto pb-4 custom-scrollbar">
        
        {/* Score Selection */}
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

        {/* Players Configuration */}
        <section>
            <div className="flex justify-between items-center mb-2">
                <label className="block text-orange-500 text-xs font-bold uppercase tracking-widest">Players</label>
                <div className="flex bg-gray-800 rounded p-1">
                    <button onClick={() => setIsDoubles(false)} className={`px-3 py-1 text-xs font-bold rounded ${!isDoubles ? 'bg-gray-600 text-white' : 'text-gray-500'}`}>Solo</button>
                    <button onClick={() => setIsDoubles(true)} className={`px-3 py-1 text-xs font-bold rounded ${isDoubles ? 'bg-gray-600 text-white' : 'text-gray-500'}`}>Doubles (2v2)</button>
                </div>
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
                    {/* Team 1 */}
                    <div className="bg-gray-800/30 p-3 rounded border border-gray-700">
                        <div className="text-xs text-orange-500 font-bold uppercase mb-2">Team 1</div>
                        <div className="space-y-2">
                            <input value={team1Names[0]} onChange={(e) => updateTeamName(1, 0, e.target.value)} className="w-full bg-gray-800 border border-gray-600 text-white px-2 py-2 rounded text-sm" placeholder="Player 1" />
                            <input value={team1Names[1]} onChange={(e) => updateTeamName(1, 1, e.target.value)} className="w-full bg-gray-800 border border-gray-600 text-white px-2 py-2 rounded text-sm" placeholder="Player 2" />
                        </div>
                    </div>
                    {/* Team 2 */}
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

        {/* Format */}
        <section>
          <label className="block text-orange-500 mb-2 text-xs font-bold uppercase tracking-widest">Match Format</label>
          
          {/* Mode Toggle */}
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

        {/* In / Out Rules */}
        <section className="grid grid-cols-1 gap-6">
           {/* In Rule */}
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

           {/* Out Rule */}
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

      </div>

      <div className="mt-4">
        <Button onClick={handleStart} className="w-full py-5 text-2xl shadow-orange-900/20">GAME ON</Button>
      </div>
    </div>
  );
};