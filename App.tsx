
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
import { SettingsView } from './views/SettingsView';
import { GameSelectionView, GameType } from './views/GameSelectionView';
import { ClockGameView } from './views/ClockGameView';
import { ClockStatsView } from './views/ClockStatsView';
import { CricketGameView } from './views/CricketGameView';
import { CricketStatsView } from './views/CricketStatsView';
import { GameConfig, Player, MatchState, ClockPlayerState, CricketPlayerState } from './types';
import { createMatch } from './utils/gameLogic';
import { enterFullScreen, exitFullScreen } from './utils/uiUtils';
import { supabase, saveMatchToHistory } from './lib/supabase';

type AppScreen = 'HOME' | 'AUTH' | 'DASHBOARD' | 'PROFILE' | 'HISTORY' | 'MY_STATS' | 'SETTINGS' | 'GAME_SELECTION' | 'SETUP' | 'MATCH' | 'STATS' | 'CLOCK_GAME' | 'CLOCK_STATS' | 'CRICKET_GAME' | 'CRICKET_STATS';

export const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>('HOME');
  const [currentMatch, setCurrentMatch] = useState<MatchState | null>(null);
  const [matchWinner, setMatchWinner] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  
  // State for Clock/180 results
  const [clockResults, setClockResults] = useState<ClockPlayerState[]>([]);
  
  // State for Cricket results
  const [cricketResults, setCricketResults] = useState<CricketPlayerState[]>([]);

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
    setSelectedGameType(type);
    if (type === 'X01' || type === 'CLOCK' || type === '180' || type === 'CRICKET') {
      setScreen('SETUP');
    } else {
      alert(`Mode ${type} is coming soon!`);
    }
  };

  const handleStartSetup = (players: Player[], config: GameConfig) => {
    enterFullScreen();
    const match = createMatch(players, config);
    setCurrentMatch(match);
    
    if (selectedGameType === 'CLOCK' || selectedGameType === '180') {
      setScreen('CLOCK_GAME');
    } else if (selectedGameType === 'CRICKET') {
      setScreen('CRICKET_GAME');
    } else {
      setScreen('MATCH');
    }
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

  // Handler for Clock/180 games
  const handleClockFinish = (results: ClockPlayerState[]) => {
      exitFullScreen();
      setClockResults(results);
      setScreen('CLOCK_STATS');
  };

  // Handler for Cricket games
  const handleCricketFinish = (results: CricketPlayerState[]) => {
      exitFullScreen();
      setCricketResults(results);
      // NOTE: Saving to DB not yet implemented for Cricket
      setScreen('CRICKET_STATS');
  };

  const handleExitMatch = () => {
    exitFullScreen();
    setScreen(user ? 'DASHBOARD' : 'HOME');
    setCurrentMatch(null);
  };

  const handleRematch = () => {
      if (!currentMatch) return;
      
      const newMatch = createMatch(currentMatch.players, currentMatch.config);
      setCurrentMatch(newMatch);
      enterFullScreen();
      
      if (selectedGameType === 'CLOCK' || selectedGameType === '180') {
        setScreen('CLOCK_GAME');
      } else if (selectedGameType === 'CRICKET') {
        setScreen('CRICKET_GAME');
      } else {
        setScreen('MATCH');
      }
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
          onSettings={() => setScreen('SETTINGS')}
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
              onSettings={() => setScreen('SETTINGS')}
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

      {screen === 'SETTINGS' && (
          <SettingsView 
             onBack={() => setScreen(user ? 'DASHBOARD' : 'HOME')}
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
          gameType={selectedGameType}
          onStart={handleStartSetup} 
          onBack={() => setScreen('GAME_SELECTION')} 
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

      {screen === 'CLOCK_GAME' && currentMatch && (
        <ClockGameView 
          players={currentMatch.players}
          mode={selectedGameType === '180' ? '180' : 'STANDARD'}
          onExit={handleExitMatch}
          onFinish={handleClockFinish}
        />
      )}

      {screen === 'CLOCK_STATS' && (
          <ClockStatsView 
              results={clockResults}
              mode={selectedGameType === '180' ? '180' : 'STANDARD'}
              onHome={handleExitMatch}
              onRematch={handleRematch}
          />
      )}

      {screen === 'CRICKET_GAME' && currentMatch && (
          <CricketGameView
              players={currentMatch.players}
              onExit={handleExitMatch}
              onFinish={handleCricketFinish}
          />
      )}

      {screen === 'CRICKET_STATS' && (
          <CricketStatsView
              results={cricketResults}
              onHome={handleExitMatch}
              onRematch={handleRematch}
          />
      )}

      {screen === 'STATS' && currentMatch && (
        <StatsView 
          winnerId={matchWinner} 
          onHome={handleExitMatch}
          onRematch={handleRematch}
          match={currentMatch}
        />
      )}
    </div>
  );
};
