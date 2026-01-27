import React, { useState } from 'react';
import { HomeView } from './views/HomeView';
import { SetupView } from './views/SetupView';
import { MatchView } from './views/MatchView';
import { StatsView } from './views/StatsView';
import { GameSelectionView, GameType } from './views/GameSelectionView';
import { GameConfig, Player, MatchState } from './types';
import { createMatch } from './utils/gameLogic';

type AppScreen = 'HOME' | 'GAME_SELECTION' | 'SETUP' | 'MATCH' | 'STATS';

export const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>('HOME');
  const [currentMatch, setCurrentMatch] = useState<MatchState | null>(null);
  const [matchWinner, setMatchWinner] = useState<string>('');
  
  // Could store selected game type here for future logic
  const [selectedGameType, setSelectedGameType] = useState<GameType>('X01');

  const handleQuickGame = () => {
    setScreen('GAME_SELECTION');
  };

  const handleGameSelect = (type: GameType) => {
    if (type === 'X01') {
      setSelectedGameType(type);
      setScreen('SETUP');
    } else {
      // For MVP, just alert that other modes are coming soon
      // or simply do nothing as per UI indication
      alert(`Mode ${type} is coming soon!`);
    }
  };

  const handleStartMatch = (players: Player[], config: GameConfig) => {
    const match = createMatch(players, config);
    setCurrentMatch(match);
    setScreen('MATCH');
  };

  const handleMatchFinish = (winnerId: string) => {
    setMatchWinner(winnerId);
    setScreen('STATS');
  };

  const handleExitMatch = () => {
    // Confirmation is now handled inside MatchView for better UX
    setScreen('HOME');
    setCurrentMatch(null);
  };

  return (
    <div className="antialiased font-sans bg-black h-full">
      {screen === 'HOME' && (
        <HomeView 
          onQuickGame={handleQuickGame} 
          onLogin={() => alert("Login backend not connected in MVP")} 
        />
      )}

      {screen === 'GAME_SELECTION' && (
        <GameSelectionView 
          onSelect={handleGameSelect}
          onBack={() => setScreen('HOME')}
        />
      )}
      
      {screen === 'SETUP' && (
        <SetupView 
          onStart={handleStartMatch} 
          onBack={() => setScreen('GAME_SELECTION')} 
        />
      )}
      
      {screen === 'MATCH' && currentMatch && (
        <MatchView 
          initialMatch={currentMatch} 
          onFinish={handleMatchFinish} 
          onExit={handleExitMatch}
        />
      )}

      {screen === 'STATS' && currentMatch && (
        <StatsView 
          winnerId={matchWinner} 
          onHome={() => { setScreen('HOME'); setCurrentMatch(null); }}
          match={currentMatch}
        />
      )}
    </div>
  );
};
