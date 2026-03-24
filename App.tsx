
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { HomeView } from './views/HomeView';
import { SetupView } from './views/SetupView';
import { MatchView } from './views/MatchView';
import type { GameType } from './views/GameSelectionView';
import { GameConfig, Player, MatchState, ClockPlayerState, CricketPlayerState, CapitalPlayerState, RandomizerPlayerState } from './types';
import { createMatch } from './utils/gameLogic';
import { enterFullScreen, exitFullScreen } from './utils/uiUtils';
import { createSharedMatchSession, saveArcadeMatchToHistory, supabase, saveMatchToHistory } from './lib/supabase';

const StatsView = lazy(() => import('./views/StatsView').then((module) => ({ default: module.StatsView })));
const AuthView = lazy(() => import('./views/AuthView').then((module) => ({ default: module.AuthView })));
const LobbyView = lazy(() => import('./views/LobbyView').then((module) => ({ default: module.LobbyView })));
const ChallengeFriendView = lazy(() => import('./views/ChallengeFriendView').then((module) => ({ default: module.ChallengeFriendView })));
const FriendsManagementView = lazy(() => import('./views/FriendsManagementView').then((module) => ({ default: module.FriendsManagementView })));
const JoinWithCodeView = lazy(() => import('./views/JoinWithCodeView').then((module) => ({ default: module.JoinWithCodeView })));
const LobbyRoomView = lazy(() => import('./views/LobbyRoomView').then((module) => ({ default: module.LobbyRoomView })));
const CreateLobbyView = lazy(() => import('./views/CreateLobbyView').then((module) => ({ default: module.CreateLobbyView })));
const ResumeLobbyView = lazy(() => import('./views/ResumeLobbyView').then((module) => ({ default: module.ResumeLobbyView })));
const ProfileView = lazy(() => import('./views/ProfileView').then((module) => ({ default: module.ProfileView })));
const HistoryView = lazy(() => import('./views/HistoryView').then((module) => ({ default: module.HistoryView })));
const MyStatsView = lazy(() => import('./views/MyStatsView').then((module) => ({ default: module.MyStatsView })));
const GameSelectionView = lazy(() => import('./views/GameSelectionView').then((module) => ({ default: module.GameSelectionView })));
const ClockGameView = lazy(() => import('./views/ClockGameView').then((module) => ({ default: module.ClockGameView })));
const ClockStatsView = lazy(() => import('./views/ClockStatsView').then((module) => ({ default: module.ClockStatsView })));
const CricketGameView = lazy(() => import('./views/CricketGameView').then((module) => ({ default: module.CricketGameView })));
const CricketStatsView = lazy(() => import('./views/CricketStatsView').then((module) => ({ default: module.CricketStatsView })));
const CapitalGameView = lazy(() => import('./views/CapitalGameView').then((module) => ({ default: module.CapitalGameView })));
const CapitalStatsView = lazy(() => import('./views/CapitalStatsView').then((module) => ({ default: module.CapitalStatsView })));
const CheckoutRandomizerGameView = lazy(() => import('./views/CheckoutRandomizerGameView').then((module) => ({ default: module.CheckoutRandomizerGameView })));
const CheckoutRandomizerStatsView = lazy(() => import('./views/CheckoutRandomizerStatsView').then((module) => ({ default: module.CheckoutRandomizerStatsView })));
const TriathlonGameView = lazy(() => import('./views/TriathlonGameView').then((module) => ({ default: module.TriathlonGameView })));
const TriathlonStatsView = lazy(() => import('./views/TriathlonStatsView').then((module) => ({ default: module.TriathlonStatsView })));
const AuthCallbackView = lazy(() => import('./views/AuthCallbackView').then((module) => ({ default: module.AuthCallbackView })));

const ScreenLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#06080d] text-white">
    <div className="flex flex-col items-center gap-4">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-orange-500" />
      <div className="text-[11px] font-black uppercase tracking-[0.24em] text-gray-400">Loading Arena</div>
    </div>
  </div>
);

type AppScreen = 'HOME' | 'AUTH' | 'AUTH_CALLBACK' | 'DASHBOARD' | 'LOBBY' | 'RESUME_LOBBY' | 'CREATE_LOBBY' | 'CHALLENGE_FRIEND' | 'JOIN_WITH_CODE' | 'LOBBY_ROOM' | 'FRIENDS' | 'PROFILE' | 'HISTORY' | 'MY_STATS' | 'GAME_SELECTION' | 'SETUP' | 'MATCH' | 'STATS' | 'CLOCK_GAME' | 'CLOCK_STATS' | 'CRICKET_GAME' | 'CRICKET_STATS' | 'CAPITAL_GAME' | 'CAPITAL_STATS' | 'RANDOMIZER_GAME' | 'RANDOMIZER_STATS' | 'TRIATHLON_GAME' | 'TRIATHLON_STATS';

export const App: React.FC = () => {
  const [screen, setScreen] = useState<AppScreen>(() => (
    window.location.pathname === '/auth/callback' ? 'AUTH_CALLBACK' : 'HOME'
  ));
  const [currentMatch, setCurrentMatch] = useState<MatchState | null>(null);
  const [matchWinner, setMatchWinner] = useState<string>('');
  const [user, setUser] = useState<any>(null);
  const [activeLobbyCode, setActiveLobbyCode] = useState('');
  const [arenaPrefillPlayers, setArenaPrefillPlayers] = useState<string[]>([]);
  const [arenaPrefillConfig, setArenaPrefillConfig] = useState<Partial<GameConfig> | undefined>(undefined);
  const [sharedMatchSessionId, setSharedMatchSessionId] = useState<string | null>(null);
  
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
      if (session?.user && window.location.pathname === '/auth/callback') {
          window.history.replaceState({}, document.title, '/');
          setScreen('DASHBOARD');
      }
      if (_event === 'SIGNED_OUT') {
          setScreen('HOME');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const [selectedGameType, setSelectedGameType] = useState<GameType>('X01');

  const openArenaFromLobbyMode = (payload?: { mode: string; title?: string; stakes?: string; players?: string[]; config?: Partial<GameConfig> }) => {
    if (!payload) {
      setArenaPrefillPlayers([]);
      setArenaPrefillConfig(undefined);
      setScreen('GAME_SELECTION');
      return;
    }

    const title = `${payload.title || ''} ${payload.stakes || ''}`.toLowerCase();
    const configStartingScore = typeof payload.config?.startingScore === 'number' ? payload.config.startingScore : undefined;
    let nextGameType: GameType = 'X01';

    if (payload.mode === 'Cricket') nextGameType = 'CRICKET';
    else if (payload.mode === 'Capital') nextGameType = 'CAPITAL';
    else if (payload.mode === 'Triathlon') nextGameType = 'TRIATHLON';
    else if (payload.mode === 'Randomizer') nextGameType = 'RANDOMIZER';
    else if (payload.mode === 'X01') {
      if (configStartingScore === 170 || title.includes('170')) nextGameType = 'X01_170_BO5';
      else if (
        (configStartingScore === 501 &&
          payload.config?.matchMode === 'LEGS' &&
          payload.config?.legsToWin === 3 &&
          payload.config?.checkOut === 'Double') ||
        (title.includes('501') && (title.includes('best of 5') || title.includes('bo5') || title.includes('premier a 3')))
      ) {
        nextGameType = 'X01_501_BO5';
      } else {
        nextGameType = 'X01';
      }
    }

    setSelectedGameType(nextGameType);
    setArenaPrefillPlayers(payload.players || []);
    setArenaPrefillConfig(payload.config);
    setScreen('SETUP');
  };

  const handleQuickGame = () => {
    setArenaPrefillPlayers([]);
    setArenaPrefillConfig(undefined);
    setScreen('GAME_SELECTION');
  };

  const handleGameSelect = (type: GameType) => {
    setArenaPrefillPlayers([]);
    setArenaPrefillConfig(undefined);
    setSelectedGameType(type);
    if (type === 'X01' || type === 'X01_501_BO5' || type === 'X01_170_BO5' || type === 'CLOCK' || type === '180' || type === 'CRICKET' || type === 'CAPITAL' || type === 'RANDOMIZER' || type === 'TRIATHLON') {
      setScreen('SETUP');
    }
  };

  const handleStartSetup = (players: Player[], config: GameConfig) => {
    enterFullScreen();
    const match = createMatch(players, config);
    setCurrentMatch(match);
    setSharedMatchSessionId(null);
    
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

  const buildSharedPlayers = (
    participants: Array<{ id: string; username: string; role: 'host' | 'guest' }>,
    config: GameConfig
  ): Player[] => {
    if (config.isDoubles && participants.length >= 4) {
      return participants.slice(0, 4).map((participant, index) => ({
        id: participant.id,
        name: participant.username,
        teamId: index < 2 ? 'team1' : 'team2',
      }));
    }

    return participants.slice(0, Math.max(2, participants.length)).map((participant) => ({
      id: participant.id,
      name: participant.username,
      teamId: participant.id,
    }));
  };

  const normalizeSharedConfig = (
    partial?: Partial<GameConfig>,
    participantsCount?: number
  ): GameConfig => {
    const inferredDoubles = partial?.isDoubles ?? participantsCount === 4;

    return {
      startingScore: partial?.startingScore ?? 501,
      checkIn: partial?.checkIn ?? 'Open',
      checkOut: partial?.checkOut ?? 'Double',
      matchMode: partial?.matchMode ?? 'LEGS',
      setsToWin: partial?.setsToWin ?? 1,
      legsToWin: partial?.legsToWin ?? 3,
      isDoubles: inferredDoubles,
      ...(partial?.randomizerTargetPoints !== undefined ? { randomizerTargetPoints: partial.randomizerTargetPoints } : {}),
      ...(partial?.randomizerTargetMinutes !== undefined ? { randomizerTargetMinutes: partial.randomizerTargetMinutes } : {}),
      ...(partial?.randomizerEasyMode !== undefined ? { randomizerEasyMode: partial.randomizerEasyMode } : {}),
    };
  };

  const handleLaunchSharedMatch = async (payload: {
    lobbyId: string;
    lobbyCode: string;
    mode: string;
    participants: Array<{ id: string; username: string; role: 'host' | 'guest' }>;
    config: Partial<GameConfig>;
  }) => {
    if (!user) return;

    if (payload.mode !== 'X01') {
      openArenaFromLobbyMode({
        mode: payload.mode,
        lobbyCode: payload.lobbyCode,
        players: payload.participants.map((participant) => participant.username),
        config: payload.config,
      } as any);
      return;
    }

    const config = normalizeSharedConfig(payload.config, payload.participants.length);
    const players = buildSharedPlayers(payload.participants, config);
    const match = createMatch(players, config);
    const participantUserIds = payload.participants.map((participant) => participant.id);

    const { data } = await createSharedMatchSession({
      lobbyId: payload.lobbyId,
      lobbyCode: payload.lobbyCode,
      hostUserId: user.id,
      gameType: payload.mode,
      participantUserIds,
      matchState: match as unknown as Record<string, unknown>,
    });

    if (!data?.id) {
      return;
    }

    setCurrentMatch(match);
    setSharedMatchSessionId(data.id);
    setSelectedGameType('X01');
    enterFullScreen();
    setScreen('MATCH');
  };

  const handleEnterSharedMatch = (payload: { sessionId: string; matchState: MatchState; gameType: string }) => {
    setCurrentMatch(payload.matchState);
    setSharedMatchSessionId(payload.sessionId);
    if (payload.gameType === 'X01') {
      setSelectedGameType('X01');
      enterFullScreen();
      setScreen('MATCH');
      return;
    }

    openArenaFromLobbyMode({
      mode: payload.gameType,
      players: payload.matchState.players?.map((player) => player.name) || [],
      config: payload.matchState.config,
    });
  };

  // Handler for Clock/180 games
  const handleClockFinish = (results: ClockPlayerState[]) => {
      exitFullScreen();
      setClockResults(results);
      if (user && currentMatch) {
        const ordered = [...results];
        const winner = ordered[0];
        const me = ordered.find((player) => player.id === user.id) || ordered[0];
        const opponent = ordered.find((player) => player.id !== me.id);
        void saveArcadeMatchToHistory(user.id, {
          gameType: selectedGameType === '180' ? '180' : 'Clock',
          modeVariant: selectedGameType === '180' ? '180' : 'STANDARD',
          winnerId: winner?.id || null,
          players: currentMatch.players.map((player) => ({ id: player.id, name: player.name })),
          scoreFor: selectedGameType === '180' ? me?.score ?? null : me?.targetIndex ?? null,
          scoreAgainst: selectedGameType === '180' ? opponent?.score ?? null : opponent?.targetIndex ?? null,
          totalDarts: me?.totalDarts ?? null,
          totalPoints: me?.score ?? null,
          average: me && me.totalDarts > 0 ? (me.score / me.totalDarts) * 3 : null,
          summary: {
            mode: selectedGameType === '180' ? '180' : 'STANDARD',
            leaderboard: ordered.map((player) => ({
              id: player.id,
              name: player.name,
              score: player.score,
              totalDarts: player.totalDarts,
              targetIndex: player.targetIndex,
            })),
          },
        });
      }
      setScreen('CLOCK_STATS');
  };

  // Handler for Cricket games
  const handleCricketFinish = (results: CricketPlayerState[]) => {
      exitFullScreen();
      setCricketResults(results);
      if (user && currentMatch) {
        const winner = [...results].sort((a, b) => b.score - a.score)[0];
        const me = results.find((player) => player.id === user.id) || results[0];
        const opponent = results.find((player) => player.id !== me?.id);
        void saveArcadeMatchToHistory(user.id, {
          gameType: 'Cricket',
          winnerId: winner?.id || null,
          players: currentMatch.players.map((player) => ({ id: player.id, name: player.name })),
          scoreFor: me?.score ?? null,
          scoreAgainst: opponent?.score ?? null,
          totalDarts: me?.dartsThrown ?? null,
          totalPoints: me?.score ?? null,
          summary: {
            leaderboard: results.map((player) => ({
              id: player.id,
              name: player.name,
              score: player.score,
              dartsThrown: player.dartsThrown,
              marks: player.marks,
            })),
          },
        });
      }
      setScreen('CRICKET_STATS');
  };

  const handleTriathlonFinish = (globalScores: Record<string, number>, results: any) => {
      exitFullScreen();
      setTriathlonData({ globalScores, results });
      if (user && currentMatch) {
        const orderedPlayers = currentMatch.players
          .map((player) => ({ id: player.id, name: player.name, score: globalScores[player.id] || 0 }))
          .sort((a, b) => b.score - a.score);
        const winner = orderedPlayers[0];
        const me = orderedPlayers.find((player) => player.id === user.id) || orderedPlayers[0];
        const opponent = orderedPlayers.find((player) => player.id !== me?.id);
        void saveArcadeMatchToHistory(user.id, {
          gameType: 'Triathlon',
          winnerId: winner?.id || null,
          players: currentMatch.players.map((player) => ({ id: player.id, name: player.name })),
          scoreFor: me?.score ?? null,
          scoreAgainst: opponent?.score ?? null,
          totalPoints: me?.score ?? null,
          summary: {
            globalScores,
            results,
          },
          gameData: {
            gameName: 'Triathlon',
            players: currentMatch.players,
            globalScores,
            results,
          },
        });
      }
      setScreen('TRIATHLON_STATS');
  };

  // Handler for Capital games
  const handleCapitalFinish = (results: CapitalPlayerState[]) => {
      exitFullScreen();
      setCapitalResults(results);
      if (user && currentMatch) {
        const ordered = [...results].sort((a, b) => b.score - a.score);
        const winner = ordered[0];
        const me = ordered.find((player) => player.id === user.id) || ordered[0];
        const opponent = ordered.find((player) => player.id !== me?.id);
        void saveArcadeMatchToHistory(user.id, {
          gameType: 'Capital',
          winnerId: winner?.id || null,
          players: currentMatch.players.map((player) => ({ id: player.id, name: player.name })),
          scoreFor: me?.score ?? null,
          scoreAgainst: opponent?.score ?? null,
          totalPoints: me?.score ?? null,
          summary: {
            leaderboard: ordered.map((player) => ({
              id: player.id,
              name: player.name,
              score: player.score,
              rounds: player.history.length,
            })),
          },
        });
      }
      setScreen('CAPITAL_STATS');
  };

  // Handler for Randomizer games
  const handleRandomizerFinish = (results: RandomizerPlayerState[]) => {
      exitFullScreen();
      setRandomizerResults(results);
      if (user && currentMatch) {
        const ordered = [...results].sort((a, b) => b.score - a.score);
        const winner = ordered[0];
        const me = ordered.find((player) => player.id === user.id) || ordered[0];
        const opponent = ordered.find((player) => player.id !== me?.id);
        const totalDarts = me?.history?.reduce((acc, item) => acc + (item.dartsThrown || 0), 0) || null;
        void saveArcadeMatchToHistory(user.id, {
          gameType: 'Randomizer',
          winnerId: winner?.id || null,
          players: currentMatch.players.map((player) => ({ id: player.id, name: player.name })),
          scoreFor: me?.score ?? null,
          scoreAgainst: opponent?.score ?? null,
          totalDarts,
          totalPoints: me?.score ?? null,
          summary: {
            leaderboard: ordered.map((player) => ({
              id: player.id,
              name: player.name,
              score: player.score,
              tier: player.currentTier,
            })),
            config: currentMatch.config,
          },
        });
      }
      setScreen('RANDOMIZER_STATS');
  };

  const handleReturnToGameSelection = () => {
    exitFullScreen();
    setCurrentMatch(null);
    setSharedMatchSessionId(null);
    setMatchWinner('');
    setClockResults([]);
    setCricketResults([]);
    setCapitalResults([]);
    setRandomizerResults([]);
    setTriathlonData(null);
    setScreen('GAME_SELECTION');
  };

  const handleRematch = () => {
      if (!currentMatch) return;
      
      const newMatch = createMatch(currentMatch.players, currentMatch.config);
      setCurrentMatch(newMatch);
      setSharedMatchSessionId(null);
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
      <Suspense fallback={<ScreenLoader />}>
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

      {screen === 'AUTH_CALLBACK' && (
        <AuthCallbackView
          onSuccess={(loggedInUser) => {
            setUser(loggedInUser);
            setScreen('DASHBOARD');
          }}
          onBackHome={() => setScreen('HOME')}
        />
      )}

      {screen === 'DASHBOARD' && user && (
          <HomeView
              user={user}
              onQuickGame={() => setScreen('GAME_SELECTION')}
              onLogin={() => setScreen('LOBBY')}
              secondaryLabel="Lobby"
              onUserMenu={() => setScreen('PROFILE')}
              onLogout={handleLogout}
          />
      )}

      {screen === 'LOBBY' && user && (
          <LobbyView 
              user={user}
              onBackHome={() => setScreen('DASHBOARD')}
              onCreateLobby={() => setScreen('CREATE_LOBBY')}
              onOpenFriends={() => setScreen('FRIENDS')}
              onOpenProfile={() => setScreen('PROFILE')}
              onNewGame={() => {
                setArenaPrefillPlayers([]);
                setArenaPrefillConfig(undefined);
                setScreen('GAME_SELECTION');
              }}
              onResumeGame={() => {
                setScreen('RESUME_LOBBY');
              }}
              onJoinWithCode={() => setScreen('JOIN_WITH_CODE')}
              onChallengeFriend={() => setScreen('CHALLENGE_FRIEND')}
              onOpenHistory={() => setScreen('HISTORY')}
              onOpenStats={() => setScreen('MY_STATS')}
              onLogout={handleLogout}
          />
      )}

      {screen === 'CREATE_LOBBY' && user && (
          <CreateLobbyView
             user={user}
             onBack={() => setScreen('LOBBY')}
             onOpenProfile={() => setScreen('PROFILE')}
             onLogout={handleLogout}
             onCreated={(lobbyCode) => {
               setActiveLobbyCode(lobbyCode);
               setScreen('LOBBY_ROOM');
             }}
          />
      )}

      {screen === 'RESUME_LOBBY' && user && (
          <ResumeLobbyView
             user={user}
             onBack={() => setScreen('LOBBY')}
             onOpenHome={() => setScreen('DASHBOARD')}
             onOpenRoom={(lobbyCode) => {
               setActiveLobbyCode(lobbyCode);
               setScreen('LOBBY_ROOM');
             }}
             onEnterSharedMatch={handleEnterSharedMatch}
             onOpenProfile={() => setScreen('PROFILE')}
             onLogout={handleLogout}
          />
      )}

      {screen === 'JOIN_WITH_CODE' && user && (
          <JoinWithCodeView
             user={user}
             onBack={() => setScreen('LOBBY')}
             onOpenRoom={(lobbyCode) => {
               setActiveLobbyCode(lobbyCode);
               setScreen('LOBBY_ROOM');
             }}
             onOpenArena={openArenaFromLobbyMode}
             onOpenProfile={() => setScreen('PROFILE')}
             onLogout={handleLogout}
          />
      )}

      {screen === 'LOBBY_ROOM' && user && activeLobbyCode && (
          <LobbyRoomView
             user={user}
             lobbyCode={activeLobbyCode}
             onBack={() => setScreen('JOIN_WITH_CODE')}
             onLaunchSharedMatch={handleLaunchSharedMatch}
             onEnterSharedMatch={handleEnterSharedMatch}
             onOpenArena={openArenaFromLobbyMode}
             onOpenProfile={() => setScreen('PROFILE')}
             onLogout={handleLogout}
          />
      )}

      {screen === 'FRIENDS' && user && (
          <FriendsManagementView
             user={user}
             onBack={() => setScreen('LOBBY')}
             onOpenProfile={() => setScreen('PROFILE')}
             onLogout={handleLogout}
          />
      )}

      {screen === 'CHALLENGE_FRIEND' && user && (
          <ChallengeFriendView
             user={user}
             onBack={() => setScreen('LOBBY')}
             onOpenProfile={() => setScreen('PROFILE')}
             onLogout={handleLogout}
          />
      )}

      {screen === 'PROFILE' && user && (
          <ProfileView 
              user={user}
              onBack={() => setScreen('LOBBY')}
              onOpenProfile={() => setScreen('PROFILE')}
              onLogout={handleLogout}
              onUpdateUser={(updatedUser) => setUser(updatedUser)}
          />
      )}

      {screen === 'HISTORY' && user && (
          <HistoryView 
             user={user}
             onBack={() => setScreen('LOBBY')}
             onOpenProfile={() => setScreen('PROFILE')}
             onLogout={handleLogout}
          />
      )}

      {screen === 'MY_STATS' && user && (
          <MyStatsView 
             user={user}
             onBack={() => setScreen('LOBBY')}
             onOpenProfile={() => setScreen('PROFILE')}
             onLogout={handleLogout}
          />
      )}

      {screen === 'GAME_SELECTION' && (
        <GameSelectionView 
          onSelect={handleGameSelect}
          onBack={() => setScreen(user ? 'DASHBOARD' : 'HOME')}
          onLobbyShortcut={() => setScreen(user ? 'LOBBY' : 'AUTH')}
          onAuthShortcut={() => setScreen('AUTH')}
          showAuthShortcut={!user}
          user={user}
          onUserMenu={() => setScreen('PROFILE')}
          onLogout={handleLogout}
        />
      )}
      
      {screen === 'SETUP' && (
        <SetupView 
          gameType={selectedGameType}
          onStart={handleStartSetup} 
          onBack={() => setScreen('GAME_SELECTION')}
          prefilledPlayerNames={arenaPrefillPlayers}
          prefilledConfig={arenaPrefillConfig}
          user={user}
          onUserMenu={() => setScreen('PROFILE')}
          onLogout={handleLogout}
        />
      )}
      
      {screen === 'MATCH' && currentMatch && (
        <MatchView 
          initialMatch={currentMatch} 
          onFinish={handleMatchFinish}
          onFinishWithState={handleMatchFinishWithData}
          onExit={handleReturnToGameSelection}
          sharedSessionId={sharedMatchSessionId ?? undefined}
          currentUserId={user?.id}
        />
      )}

      {screen === 'CLOCK_GAME' && currentMatch && (
        <ClockGameView 
          players={currentMatch.players}
          mode={selectedGameType === '180' ? '180' : 'STANDARD'}
          onExit={handleReturnToGameSelection}
          onFinish={handleClockFinish}
        />
      )}

      {screen === 'CLOCK_STATS' && (
          <ClockStatsView 
              results={clockResults}
              mode={selectedGameType === '180' ? '180' : 'STANDARD'}
              onHome={handleReturnToGameSelection}
              onRematch={handleRematch}
          />
      )}

      {screen === 'CRICKET_GAME' && currentMatch && (
          <CricketGameView
              players={currentMatch.players}
              onExit={handleReturnToGameSelection}
              onFinish={handleCricketFinish}
          />
      )}

      {screen === 'CRICKET_STATS' && (
          <CricketStatsView
              results={cricketResults}
              onHome={handleReturnToGameSelection}
              onRematch={handleRematch}
          />
      )}

      {screen === 'CAPITAL_GAME' && currentMatch && (
          <CapitalGameView 
              players={currentMatch.players}
              onExit={handleReturnToGameSelection}
              onFinish={handleCapitalFinish}
          />
      )}

      {screen === 'CAPITAL_STATS' && (
          <CapitalStatsView 
              results={capitalResults}
              onHome={handleReturnToGameSelection}
              onRematch={handleRematch}
          />
      )}

      {screen === 'RANDOMIZER_GAME' && currentMatch && (
          <CheckoutRandomizerGameView 
              players={currentMatch.players}
              config={currentMatch.config}
              onExit={handleReturnToGameSelection}
              onFinish={handleRandomizerFinish}
          />
      )}

      {screen === 'RANDOMIZER_STATS' && (
          <CheckoutRandomizerStatsView 
              results={randomizerResults}
              onHome={handleReturnToGameSelection}
              onRematch={handleRematch}
          />
      )}

      {screen === 'TRIATHLON_GAME' && currentMatch && (
          <TriathlonGameView 
              players={currentMatch.players}
              onExit={handleReturnToGameSelection}
              onFinish={handleTriathlonFinish}
          />
      )}

      {screen === 'TRIATHLON_STATS' && currentMatch && triathlonData && (
          <TriathlonStatsView 
              players={currentMatch.players}
              globalScores={triathlonData.globalScores}
              results={triathlonData.results}
              onHome={handleReturnToGameSelection}
              onRematch={handleRematch}
          />
      )}

      {screen === 'STATS' && currentMatch && (
        <StatsView 
          winnerId={matchWinner} 
          onHome={handleReturnToGameSelection}
          onRematch={handleRematch}
          match={currentMatch}
        />
      )}
      </Suspense>
    </div>
  );
};
