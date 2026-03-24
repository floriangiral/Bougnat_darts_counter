
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
import { GameConfig, Player, MatchState, ClockPlayerState, CricketPlayerState, CapitalPlayerState, RandomizerPlayerState } from './types';
import { createMatch } from './utils/gameLogic';
import { enterFullScreen, exitFullScreen } from './utils/uiUtils';
import { supabase, saveMatchToHistory } from './lib/supabase';
import { CapitalGameView } from './views/CapitalGameView';
import { CapitalStatsView } from './views/CapitalStatsView';
import { CheckoutRandomizerGameView } from './views/CheckoutRandomizerGameView';
import { CheckoutRandomizerStatsView } from './views/CheckoutRandomizerStatsView';
import { TriathlonGameView } from './views/TriathlonGameView';
import { TriathlonStatsView } from './views/TriathlonStatsView';

type AppScreen = 'HOME' | 'AUTH' | 'DASHBOARD' | 'PROFILE' | 'HISTORY' | 'MY_STATS' | 'SETTINGS' | 'GAME_SELECTION' | 'SETUP' | 'MATCH' | 'STATS' | 'CLOCK_GAME' | 'CLOCK_STATS' | 'CRICKET_GAME' | 'CRICKET_STATS' | 'CAPITAL_GAME' | 'CAPITAL_STATS' | 'RANDOMIZER_GAME' | 'RANDOMIZER_STATS' | 'TRIATHLON_GAME' | 'TRIATHLON_STATS';

export const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>('HOME');
  const [currentMatch, setCurrentMatch] = useState<MatchState | null>(null);
  const [matchWinner, setMatchWinner] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  
  // State for Clock/180 results
  const [clockResults, setClockResults] = useState<ClockPlayerState[]>([]);
  
  // State for Cricket results
  const [cricketResults, setCricketResults] = useState<CricketPlayerState[]>([]);

  // State for Triathlon results
  const [triathlonData, setTriathlonData] = useState<any>(null);

  // State for Capital results
  const [capitalResults, setCapitalResults] = useState<CapitalPlayerState[]>([]);

  // State for Randomizer results
  const [randomizerResults, setRandomizerResults] = useState<RandomizerPlayerState[]>([]);

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
    if (type === 'X01' || type === 'CLOCK' || type === '180' || type === 'CRICKET' || type === 'CAPITAL' || type === 'RANDOMIZER' || type === 'TRIATHLON') {
      setScreen('SETUP');
    } else {
      console.log(`Mode ${type} is coming soon!`);
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
    } else if (selectedGameType === 'CAPITAL') {
      setScreen('CAPITAL_GAME');
    } else if (selectedGameType === 'RANDOMIZER') {
      setScreen('RANDOMIZER_GAME');
    } else if (selectedGameType === 'TRIATHLON') {
      setScreen('TRIATHLON_GAME');
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

  const handleTriathlonFinish = (globalScores: Record<string, number>, results: any) => {
      exitFullScreen();
      setTriathlonData({ globalScores, results });
      setScreen('TRIATHLON_STATS');
  };

  // Handler for Capital games
  const handleCapitalFinish = (results: CapitalPlayerState[]) => {
      exitFullScreen();
      setCapitalResults(results);
      setScreen('CAPITAL_STATS');
  };

  // Handler for Randomizer games
  const handleRandomizerFinish = (results: RandomizerPlayerState[]) => {
      exitFullScreen();
      setRandomizerResults(results);
      setScreen('RANDOMIZER_STATS');
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
      } else if (selectedGameType === 'CAPITAL') {
        setScreen('CAPITAL_GAME');
      } else if (selectedGameType === 'RANDOMIZER') {
        setScreen('RANDOMIZER_GAME');
      } else if (selectedGameType === 'TRIATHLON') {
        setScreen('TRIATHLON_GAME');
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

      {screen === 'CAPITAL_GAME' && currentMatch && (
          <CapitalGameView 
              players={currentMatch.players}
              onExit={handleExitMatch}
              onFinish={handleCapitalFinish}
          />
      )}

      {screen === 'CAPITAL_STATS' && (
          <CapitalStatsView 
              results={capitalResults}
              onHome={handleExitMatch}
              onRematch={handleRematch}
          />
      )}

      {screen === 'RANDOMIZER_GAME' && currentMatch && (
          <CheckoutRandomizerGameView 
              players={currentMatch.players}
              config={currentMatch.config}
              onExit={handleExitMatch}
              onFinish={handleRandomizerFinish}
          />
      )}

      {screen === 'RANDOMIZER_STATS' && (
          <CheckoutRandomizerStatsView 
              results={randomizerResults}
              onHome={handleExitMatch}
              onRematch={handleRematch}
          />
      )}

      {screen === 'TRIATHLON_GAME' && currentMatch && (
          <TriathlonGameView 
              players={currentMatch.players}
              onExit={handleExitMatch}
              onFinish={handleTriathlonFinish}
          />
      )}

      {screen === 'TRIATHLON_STATS' && currentMatch && triathlonData && (
          <TriathlonStatsView 
              players={currentMatch.players}
              globalScores={triathlonData.globalScores}
              results={triathlonData.results}
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
