import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/Button';
import { Player, RandomizerPlayerState, GameConfig } from '../types';
import { getRandomTargetForTier, getPointsForTier } from '../utils/randomizerLogic';
import { Shield, X } from 'lucide-react';

interface CheckoutRandomizerGameViewProps {
  players: Player[];
  config: GameConfig;
  onExit: () => void;
  onFinish: (results: RandomizerPlayerState[]) => void;
}

export const CheckoutRandomizerGameView: React.FC<CheckoutRandomizerGameViewProps> = ({ players, config, onExit, onFinish }) => {
  const [playerStates, setPlayerStates] = useState<RandomizerPlayerState[]>(() => 
     players.map(p => ({
         id: p.id,
         name: p.name,
         score: 0,
         currentTier: 1,
         currentTarget: getRandomTargetForTier(1),
         history: []
     }))
  );

  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [turnDartsThrown, setTurnDartsThrown] = useState(0);
  
  const [isGameOver, setIsGameOver] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [startTime] = useState<number>(Date.now());
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  const currentPlayerState = playerStates[currentPlayerIdx];
  const { randomizerTargetPoints, randomizerTargetMinutes, randomizerEasyMode } = config;
  const isTimeLimit = config.randomizerTargetMinutes !== undefined;

  useEffect(() => {
    if (isTimeLimit && !isGameOver) {
      const interval = setInterval(() => {
        const mins = Math.floor((Date.now() - startTime) / 60000);
        setElapsedMinutes(mins);
        if (randomizerTargetMinutes && mins >= randomizerTargetMinutes) {
          setIsGameOver(true);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isTimeLimit, startTime, isGameOver, randomizerTargetMinutes]);

  useEffect(() => {
    if (isGameOver) {
      onFinish(playerStates);
    }
  }, [isGameOver, onFinish, playerStates]);

  const handleAction = (action: 'CHECKOUT' | 'MISS' | 'SAVE_BULL') => {
    if (isGameOver || showExitConfirm) return;

    setPlayerStates(prevStates => {
      const newStates = [...prevStates];
      const p = { ...newStates[currentPlayerIdx] };
      
      let pointsEarned = 0;
      let nextTier = p.currentTier;
      let isSuccess = false;
      let isSaved = false;

      if (action === 'CHECKOUT') {
        isSuccess = true;
        pointsEarned = getPointsForTier(p.currentTier);
        p.score += pointsEarned;
        nextTier = Math.min(6, p.currentTier + 1);
      } else if (action === 'MISS') {
        if (p.currentTier === 1) {
          if (!randomizerEasyMode) {
            p.score -= 1;
          }
        } else {
          nextTier = Math.max(1, p.currentTier - 1);
        }
      } else if (action === 'SAVE_BULL') {
        isSaved = true;
        // Tier stays the same
      }

      p.history = [...p.history, {
        target: p.currentTarget,
        tier: p.currentTier,
        dartsThrown: turnDartsThrown + 1, // Approximation since we don't track exact darts per turn in UI
        isSuccess,
        pointsScored: pointsEarned,
        isSaved
      }];

      p.currentTier = nextTier;
      p.currentTarget = getRandomTargetForTier(nextTier);
      
      newStates[currentPlayerIdx] = p;

      // Check win condition
      if (!isTimeLimit && randomizerTargetPoints && p.score >= randomizerTargetPoints) {
        setIsGameOver(true);
      }

      return newStates;
    });

    // Move to next player
    setCurrentPlayerIdx((prev) => (prev + 1) % players.length);
    setTurnDartsThrown(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex flex-col relative">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-gray-900/80 border-b border-gray-800">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => setShowExitConfirm(true)} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </Button>
          <div>
            <h2 className="text-xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 uppercase tracking-wider">
              Checkout Randomizer
            </h2>
            <div className="text-xs text-gray-400 font-mono">
              {isTimeLimit ? `Time: ${elapsedMinutes} / ${randomizerTargetMinutes} min` : `Target: ${randomizerTargetPoints} pts`}
              {randomizerEasyMode && <span className="ml-2 text-green-500 flex items-center gap-1"><Shield className="w-3 h-3" /> Easy Mode</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        
        {/* Current Player Info */}
        <div className="text-center mb-8">
          <h3 className="text-3xl font-bold text-gray-300 mb-2">{currentPlayerState.name}</h3>
          <div className="text-xl text-gray-500 font-mono">Score: <span className="text-white font-bold">{currentPlayerState.score}</span></div>
        </div>

        {/* Target Display */}
        <div className="relative mb-12">
          <div className="absolute inset-0 bg-orange-600/20 blur-3xl rounded-full"></div>
          <div className="relative bg-gray-900/80 border-2 border-orange-500/50 rounded-3xl p-10 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(234,88,12,0.2)] min-w-[300px]">
            <div className="text-orange-400 font-bold tracking-widest uppercase mb-2">Tier {currentPlayerState.currentTier}</div>
            <div className="text-8xl font-black text-white drop-shadow-lg">{currentPlayerState.currentTarget}</div>
            <div className="text-gray-400 mt-4 font-mono">Worth {getPointsForTier(currentPlayerState.currentTier)} points</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
          <Button 
            onClick={() => handleAction('MISS')}
            className="h-24 text-2xl font-black uppercase bg-red-900/50 hover:bg-red-800 text-red-200 border border-red-700/50"
          >
            Miss
          </Button>
          
          <Button 
            onClick={() => handleAction('SAVE_BULL')}
            className="h-24 text-2xl font-black uppercase bg-emerald-900/50 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/50 flex flex-col items-center justify-center"
          >
            <span>Save</span>
            <span className="text-sm font-normal opacity-80">(Bullseye)</span>
          </Button>

          <Button 
            onClick={() => handleAction('CHECKOUT')}
            className="h-24 text-2xl font-black uppercase bg-orange-600 hover:bg-orange-500 text-white border-none shadow-[0_0_20px_rgba(234,88,12,0.4)]"
          >
            Checkout
          </Button>
        </div>

      </div>

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl max-w-sm w-full shadow-2xl">
            <h3 className="text-2xl font-black text-white mb-4">Abandonner la partie ?</h3>
            <p className="text-gray-400 mb-8">La partie en cours sera perdue. Êtes-vous sûr de vouloir quitter ?</p>
            <div className="flex gap-4">
              <Button variant="secondary" onClick={() => setShowExitConfirm(false)} className="flex-1">Annuler</Button>
              <Button variant="primary" onClick={onExit} className="flex-1 bg-red-600 hover:bg-red-700 text-white border-none">Quitter</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
