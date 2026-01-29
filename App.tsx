import React, { useState, useEffect } from 'react';
import { HomeView } from './views/HomeView';
import { SetupView } from './views/SetupView';
import { MatchView } from './views/MatchView';
import { StatsView } from './views/StatsView';
import { AuthView } from './views/AuthView';
import { DashboardView } from './views/DashboardView';
import { ProfileView } from './views/ProfileView';
import { HistoryView } from './views/HistoryView'; 
import { MyStatsView } from './views/MyStatsView'; 
import { GameSelectionView, GameType } from './views/GameSelectionView';
import { VoiceLoaderView } from './views/VoiceLoaderView'; // New Import
import { GameConfig, Player, MatchState } from './types';
import { createMatch } from './utils/gameLogic';
import { enterFullScreen, exitFullScreen } from './utils/uiUtils';
import { supabase, saveMatchToHistory } from './lib/supabase';

type AppScreen = 'HOME' | 'AUTH' | 'DASHBOARD' | 'PROFILE' | 'HISTORY' | 'MY_STATS' | 'GAME_SELECTION' | 'SETUP' | 'LOADING_AI' | 'MATCH' | 'STATS';

export const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>('HOME');
  const [currentMatch, setCurrentMatch] = useState<MatchState | null>(null);
  const [matchWinner, setMatchWinner] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  
  // Check active session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (_event === 'SIGNED_OUT') {
          setScreen('HOME');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const [selectedGameType, setSelectedGameType] = useState<GameType>('X01');

  const handleQuickGame = () => {
    setScreen('GAME_SELECTION');
  };

  const handleGameSelect = (type: GameType) => {
    if (type === 'X01') {
      setSelectedGameType(type);
      setScreen('SETUP');
    } else {
      alert(`Mode ${type} is coming soon!`);
    }
  };

  // 1. User clicks "Game On" -> Creates Match -> Goes to Loading Screen
  const handleStartSetup = (players: Player[], config: GameConfig) => {
    enterFullScreen();
    const match = createMatch(players, config);
    setCurrentMatch(match);
    setScreen('LOADING_AI'); // Redirect to Loader instead of Match
  };

  // 2. Loader finishes -> Goes to Match
  const handleAiLoaded = () => {
      setScreen('MATCH');
  };

  const handleMatchFinish = (winnerId: string) => {
    exitFullScreen();
    setMatchWinner(winnerId);
    setScreen('STATS');
  };
  
  const handleMatchFinishWithData = (winnerId: string, finalMatch: MatchState) => {
      exitFullScreen();
      setMatchWinner(winnerId);
      setCurrentMatch(finalMatch);
      
      if (user) {
          saveMatchToHistory(user.id, finalMatch);
      }
      
      setScreen('STATS');
  }

  const handleExitMatch = () => {
    exitFullScreen();
    setScreen(user ? 'DASHBOARD' : 'HOME');
    setCurrentMatch(null);
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
      setUser(null);
      setScreen('HOME');
  };

  return (
    <div className="antialiased font-sans bg-black h-full">
      {screen === 'HOME' && (
        <HomeView 
          onQuickGame={handleQuickGame} 
          onLogin={() => setScreen(user ? 'DASHBOARD' : 'AUTH')} 
        />
      )}

      {screen === 'AUTH' && (
        <AuthView 
          onBack={() => setScreen('HOME')}
          onLoginSuccess={(loggedInUser) => {
            setUser(loggedInUser);
            setScreen('DASHBOARD');
          }}
        />
      )}

      {screen === 'DASHBOARD' && user && (
          <DashboardView 
              user={user}
              onPlay={() => setScreen('GAME_SELECTION')}
              onHistory={() => setScreen('HISTORY')}
              onStats={() => setScreen('MY_STATS')}
              onProfile={() => setScreen('PROFILE')}
              onSettings={() => alert("Settings coming soon.")}
              onLogout={handleLogout}
          />
      )}

      {screen === 'PROFILE' && user && (
          <ProfileView 
              user={user}
              onBack={() => setScreen('DASHBOARD')}
              onUpdateUser={(updatedUser) => setUser(updatedUser)}
          />
      )}

      {screen === 'HISTORY' && user && (
          <HistoryView 
             user={user}
             onBack={() => setScreen('DASHBOARD')}
          />
      )}

      {screen === 'MY_STATS' && user && (
          <MyStatsView 
             user={user}
             onBack={() => setScreen('DASHBOARD')}
          />
      )}

      {screen === 'GAME_SELECTION' && (
        <GameSelectionView 
          onSelect={handleGameSelect}
          onBack={() => setScreen(user ? 'DASHBOARD' : 'HOME')}
        />
      )}
      
      {screen === 'SETUP' && (
        <SetupView 
          onStart={handleStartSetup} 
          onBack={() => setScreen('GAME_SELECTION')} 
        />
      )}

      {/* NEW LOADING SCREEN */}
      {screen === 'LOADING_AI' && (
         <VoiceLoaderView 
            onLoaded={handleAiLoaded}
            onSkip={handleAiLoaded}
         />
      )}
      
      {screen === 'MATCH' && currentMatch && (
        <MatchView 
          initialMatch={currentMatch} 
          onFinish={handleMatchFinish}
          onFinishWithState={handleMatchFinishWithData}
          onExit={handleExitMatch}
        />
      )}

      {screen === 'STATS' && currentMatch && (
        <StatsView 
          winnerId={matchWinner} 
          onHome={() => { setScreen(user ? 'DASHBOARD' : 'HOME'); setCurrentMatch(null); }}
          match={currentMatch}
        />
      )}
    </div>
  );
};