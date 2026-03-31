
import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { HomeView } from './views/HomeView';
import { SetupView } from './views/SetupView';
import { MatchView } from './views/MatchView';
import { GameConfig, Player, MatchState, CricketMatchSummary, CapitalPlayerState, TriathlonFinishPayload, TriathlonResults } from './types';
import { createMatch } from './utils/gameLogic';
import { enterFullScreen, exitFullScreen } from './utils/uiUtils';
import { createSharedMatchSession, getAuthCallbackType, saveArcadeMatchToHistory, supabase, saveMatchToHistory } from './lib/supabase';
import {
  ArenaEntryPayload,
  GameType,
  buildArenaEntryFromSharedMatch,
  buildArenaSelectionFromEntry,
  buildSharedArenaPlayers,
  getScreenForGameType,
  normalizeSharedArenaConfig,
} from './utils/arenaFlow';
import {
  APP_SESSION_STORAGE_KEY,
  isLiveUpdatePending,
  readLocalStorageJson,
  removeLocalStorageItem,
  setLiveUpdateBlocked,
  setLiveUpdatePending,
  writeLocalStorageJson,
} from './utils/appPersistence';

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
const CricketGameView = lazy(() => import('./views/CricketGameView').then((module) => ({ default: module.CricketGameView })));
const CricketStatsView = lazy(() => import('./views/CricketStatsView').then((module) => ({ default: module.CricketStatsView })));
const CapitalGameView = lazy(() => import('./views/CapitalGameView').then((module) => ({ default: module.CapitalGameView })));
const CapitalStatsView = lazy(() => import('./views/CapitalStatsView').then((module) => ({ default: module.CapitalStatsView })));
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

type AppScreen = 'HOME' | 'AUTH' | 'AUTH_CALLBACK' | 'DASHBOARD' | 'LOBBY' | 'RESUME_LOBBY' | 'CREATE_LOBBY' | 'CHALLENGE_FRIEND' | 'JOIN_WITH_CODE' | 'LOBBY_ROOM' | 'FRIENDS' | 'PROFILE' | 'HISTORY' | 'MY_STATS' | 'GAME_SELECTION' | 'SETUP' | 'MATCH' | 'STATS' | 'CRICKET_GAME' | 'CRICKET_STATS' | 'CAPITAL_GAME' | 'CAPITAL_STATS' | 'TRIATHLON_GAME' | 'TRIATHLON_STATS';

const FULLSCREEN_SCREENS: AppScreen[] = ['MATCH', 'CRICKET_GAME', 'CAPITAL_GAME', 'TRIATHLON_GAME'];
const LIVE_UPDATE_PROTECTED_SCREENS: AppScreen[] = [
  'SETUP',
  'MATCH',
  'STATS',
  'CRICKET_GAME',
  'CRICKET_STATS',
  'CAPITAL_GAME',
  'CAPITAL_STATS',
  'TRIATHLON_GAME',
  'TRIATHLON_STATS',
  'CREATE_LOBBY',
  'JOIN_WITH_CODE',
  'LOBBY_ROOM',
  'RESUME_LOBBY',
];

type MatchRuntimeSnapshot = {
  match: MatchState;
  hasGameStarted: boolean;
  elapsedSeconds: number;
};

type PersistedAppSession = {
  screen: AppScreen;
  selectedGameType: GameType;
  currentMatch: MatchState | null;
  matchWinner: string;
  activeLobbyCode: string;
  arenaPrefillPlayers: string[];
  arenaPrefillConfig?: Partial<GameConfig>;
  sharedMatchSessionId: string | null;
  cricketResults: CricketMatchSummary | null;
  triathlonData: TriathlonFinishPayload | null;
  capitalResults: CapitalPlayerState[];
  matchRuntime: MatchRuntimeSnapshot | null;
};

const isAppScreen = (value: unknown): value is AppScreen =>
  typeof value === 'string' && [
    'HOME',
    'AUTH',
    'AUTH_CALLBACK',
    'DASHBOARD',
    'LOBBY',
    'RESUME_LOBBY',
    'CREATE_LOBBY',
    'CHALLENGE_FRIEND',
    'JOIN_WITH_CODE',
    'LOBBY_ROOM',
    'FRIENDS',
    'PROFILE',
    'HISTORY',
    'MY_STATS',
    'GAME_SELECTION',
    'SETUP',
    'MATCH',
    'STATS',
    'CRICKET_GAME',
    'CRICKET_STATS',
    'CAPITAL_GAME',
    'CAPITAL_STATS',
    'TRIATHLON_GAME',
    'TRIATHLON_STATS',
  ].includes(value);

const isFullscreenScreen = (screen: AppScreen) => FULLSCREEN_SCREENS.includes(screen);

export const App: React.FC = () => {
  const [restoredSession] = useState<PersistedAppSession | null>(() => (
    window.location.pathname === '/auth/callback'
      ? null
      : readLocalStorageJson<PersistedAppSession>(APP_SESSION_STORAGE_KEY)
  ));
  const [screen, setScreen] = useState<AppScreen>(() => (
    window.location.pathname === '/auth/callback' ? 'AUTH_CALLBACK' : restoredSession?.screen ?? 'HOME'
  ));
  const screenRef = useRef<AppScreen>(screen);
  const lastPushedScreenRef = useRef<AppScreen>(screen);
  const skipNextHistoryPushRef = useRef(false);
  const [currentMatch, setCurrentMatch] = useState<MatchState | null>(() => restoredSession?.matchRuntime?.match ?? restoredSession?.currentMatch ?? null);
  const [matchWinner, setMatchWinner] = useState<string>(() => restoredSession?.matchWinner ?? '');
  const [user, setUser] = useState<User | null>(null);
  const [activeLobbyCode, setActiveLobbyCode] = useState(() => restoredSession?.activeLobbyCode ?? '');
  const [arenaPrefillPlayers, setArenaPrefillPlayers] = useState<string[]>(() => restoredSession?.arenaPrefillPlayers ?? []);
  const [arenaPrefillConfig, setArenaPrefillConfig] = useState<Partial<GameConfig> | undefined>(() => restoredSession?.arenaPrefillConfig);
  const [sharedMatchSessionId, setSharedMatchSessionId] = useState<string | null>(() => restoredSession?.sharedMatchSessionId ?? null);
  const [matchRuntime, setMatchRuntime] = useState<MatchRuntimeSnapshot | null>(() => restoredSession?.matchRuntime ?? null);
  
  // State for Cricket results
  const [cricketResults, setCricketResults] = useState<CricketMatchSummary | null>(() => restoredSession?.cricketResults ?? null);

  // State for Triathlon results
  const [triathlonData, setTriathlonData] = useState<TriathlonFinishPayload | null>(() => restoredSession?.triathlonData ?? null);

  // State for Capital results
  const [capitalResults, setCapitalResults] = useState<CapitalPlayerState[]>(() => restoredSession?.capitalResults ?? []);
  const [selectedGameType, setSelectedGameType] = useState<GameType>(() => restoredSession?.selectedGameType ?? 'X01');

  // Check active session on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user && window.location.pathname === '/auth/callback' && getAuthCallbackType() !== 'recovery') {
          window.history.replaceState({}, document.title, '/');
          setScreen('DASHBOARD');
      }
      if (_event === 'SIGNED_OUT') {
          setScreen('HOME');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  useEffect(() => {
    writeLocalStorageJson(APP_SESSION_STORAGE_KEY, {
      screen,
      selectedGameType,
      currentMatch,
      matchWinner,
      activeLobbyCode,
      arenaPrefillPlayers,
      arenaPrefillConfig,
      sharedMatchSessionId,
      cricketResults,
      triathlonData,
      capitalResults,
      matchRuntime,
    } satisfies PersistedAppSession);
  }, [
    activeLobbyCode,
    arenaPrefillConfig,
    arenaPrefillPlayers,
    capitalResults,
    cricketResults,
    currentMatch,
    matchRuntime,
    matchWinner,
    screen,
    selectedGameType,
    sharedMatchSessionId,
    triathlonData,
  ]);

  const shouldBlockLiveUpdate = LIVE_UPDATE_PROTECTED_SCREENS.includes(screen);

  useEffect(() => {
    setLiveUpdateBlocked(shouldBlockLiveUpdate);

    if (!shouldBlockLiveUpdate && isLiveUpdatePending()) {
      setLiveUpdatePending(false);
      window.location.reload();
    }
  }, [shouldBlockLiveUpdate]);

  useEffect(() => {
    if (
      (screen === 'MATCH' || screen === 'STATS' || screen === 'CRICKET_GAME' || screen === 'CAPITAL_GAME' || screen === 'TRIATHLON_GAME' || screen === 'TRIATHLON_STATS')
      && !currentMatch
      && !matchRuntime
    ) {
      setScreen('GAME_SELECTION');
    }
  }, [currentMatch, matchRuntime, screen]);

  useEffect(() => {
    window.history.replaceState(
      {
        ...(window.history.state ?? {}),
        appScreen: screen,
      },
      document.title
    );

    const handlePopState = (event: PopStateEvent) => {
      const nextScreen = event.state?.appScreen;

      if (!isAppScreen(nextScreen) || nextScreen === screenRef.current) {
        return;
      }

      if (isFullscreenScreen(screenRef.current) && !isFullscreenScreen(nextScreen)) {
        exitFullScreen();
      }

      if (!isFullscreenScreen(screenRef.current) && isFullscreenScreen(nextScreen)) {
        enterFullScreen();
      }

      skipNextHistoryPushRef.current = true;
      lastPushedScreenRef.current = nextScreen;
      setScreen(nextScreen);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    if (skipNextHistoryPushRef.current) {
      skipNextHistoryPushRef.current = false;
      return;
    }

    if (lastPushedScreenRef.current === screen) {
      window.history.replaceState(
        {
          ...(window.history.state ?? {}),
          appScreen: screen,
        },
        document.title
      );
      return;
    }

    window.history.pushState(
      {
        ...(window.history.state ?? {}),
        appScreen: screen,
      },
      document.title
    );
    lastPushedScreenRef.current = screen;
  }, [screen]);

  const openArenaFromLobbyMode = (payload?: ArenaEntryPayload) => {
    if (!payload) {
      setArenaPrefillPlayers([]);
      setArenaPrefillConfig(undefined);
      setScreen('GAME_SELECTION');
      return;
    }

    const arenaSelection = buildArenaSelectionFromEntry(payload);
    setSelectedGameType(arenaSelection.gameType);
    setArenaPrefillPlayers(arenaSelection.players);
    setArenaPrefillConfig(arenaSelection.config);
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
    if (type === 'X01' || type === 'X01_501_BO5' || type === 'CRICKET' || type === 'CAPITAL' || type === 'TRIATHLON') {
      setScreen('SETUP');
    }
  };

  const handleStartSetup = (players: Player[], config: GameConfig) => {
    enterFullScreen();
    const match = createMatch(players, config);
    setCurrentMatch(match);
    setSharedMatchSessionId(null);
    setMatchRuntime(null);

    setScreen(getScreenForGameType(selectedGameType));
  };

  const handleMatchFinish = (winnerId: string) => {
    exitFullScreen();
    setMatchWinner(winnerId);
    setMatchRuntime(null);
    setScreen('STATS');
  };
  
  const handleMatchFinishWithData = (winnerId: string, finalMatch: MatchState) => {
      exitFullScreen();
      setMatchWinner(winnerId);
      setCurrentMatch(finalMatch);
      setMatchRuntime(null);
      
      if (user) {
          saveMatchToHistory(user.id, finalMatch);
      }
      
      setScreen('STATS');
  }

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

    const config = normalizeSharedArenaConfig(payload.config, payload.participants.length);
    const players = buildSharedArenaPlayers(payload.participants, config);
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
    setMatchRuntime(null);
    enterFullScreen();
    setScreen('MATCH');
  };

  const handleEnterSharedMatch = (payload: { sessionId: string; matchState: MatchState; gameType: string }) => {
    setCurrentMatch(payload.matchState);
    setSharedMatchSessionId(payload.sessionId);
    setMatchRuntime(null);
    if (payload.gameType === 'X01') {
      setSelectedGameType('X01');
      enterFullScreen();
      setScreen('MATCH');
      return;
    }

    openArenaFromLobbyMode(buildArenaEntryFromSharedMatch(payload.matchState, payload.gameType as ArenaEntryPayload['mode']));
  };

  // Handler for Cricket games
  const handleCricketFinish = (results: CricketMatchSummary) => {
      exitFullScreen();
      setCricketResults(results);
      setMatchRuntime(null);
      if (user && currentMatch) {
        const winner = results.competitors.find((player) => player.id === results.winnerId) || results.competitors[0];
        const me = results.competitors.find((player) => player.id === user.id || currentMatch.players.find((p) => p.id === user.id)?.teamId === player.id) || results.competitors[0];
        const opponent = results.competitors.find((player) => player.id !== me?.id);
        void saveArcadeMatchToHistory(user.id, {
          gameType: 'Cricket',
          winnerId: winner?.id || null,
          players: currentMatch.players.map((player) => ({ id: player.id, name: player.name })),
          scoreFor: me?.score ?? null,
          scoreAgainst: opponent?.score ?? null,
          totalDarts: me?.dartsThrown ?? null,
          totalPoints: me?.score ?? null,
          summary: {
            leaderboard: results.competitors.map((player) => ({
              id: player.id,
              name: player.name,
              score: player.score,
              dartsThrown: player.dartsThrown,
              marks: player.marks,
            })),
            legsWon: results.legsWon,
            setsWon: results.setsWon,
            currentSetLegsWon: results.currentSetLegsWon,
            winnerId: results.winnerId,
            isDoubles: results.isDoubles,
          },
        });
      }
      setScreen('CRICKET_STATS');
  };

  const handleTriathlonFinish = (globalScores: Record<string, number>, results: TriathlonResults) => {
      exitFullScreen();
      setTriathlonData({ globalScores, results });
      setMatchRuntime(null);
      if (user && currentMatch) {
        const triathlonCompetitors = results?.triathlonCompetitors || currentMatch.players;
        const finalWinnerId = results?.finalWinnerId || results?.tieBreakWinnerId || null;
        const orderedPlayers = triathlonCompetitors
          .map((player: { id: string; name: string }) => ({ id: player.id, name: player.name, score: globalScores[player.id] || 0 }))
          .sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score;
            if (finalWinnerId) {
              if (a.id === finalWinnerId) return -1;
              if (b.id === finalWinnerId) return 1;
            }
            return a.name.localeCompare(b.name);
          });
        const winner = orderedPlayers.find((player) => player.id === finalWinnerId) || orderedPlayers[0];
        const currentUserTeamId = currentMatch.config.isDoubles
          ? currentMatch.players.find((player) => player.id === user.id)?.teamId
          : user.id;
        const me = orderedPlayers.find((player) => player.id === currentUserTeamId) || orderedPlayers[0];
        const opponent = orderedPlayers.find((player) => player.id !== me?.id);
        void saveArcadeMatchToHistory(user.id, {
          gameType: 'Triathlon',
          winnerId: winner?.id || null,
          players: triathlonCompetitors.map((player: { id: string; name: string }) => ({ id: player.id, name: player.name })),
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
      setMatchRuntime(null);
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

  const handleReturnToGameSelection = () => {
    exitFullScreen();
    setCurrentMatch(null);
    setSharedMatchSessionId(null);
    setMatchWinner('');
    setCricketResults(null);
    setCapitalResults([]);
    setTriathlonData(null);
    setMatchRuntime(null);
    setScreen('GAME_SELECTION');
  };

  const handleRematch = () => {
      if (!currentMatch) return;
      
      const newMatch = createMatch(currentMatch.players, currentMatch.config);
      setCurrentMatch(newMatch);
      setSharedMatchSessionId(null);
      setMatchRuntime(null);
      enterFullScreen();
      
      setScreen(getScreenForGameType(selectedGameType));
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
      removeLocalStorageItem(APP_SESSION_STORAGE_KEY);
      setLiveUpdateBlocked(false);
      setLiveUpdatePending(false);
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
              secondaryLabel="Entrer sur le pas de tir"
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
          initialMatch={matchRuntime?.match ?? currentMatch} 
          onFinish={handleMatchFinish}
          onFinishWithState={handleMatchFinishWithData}
          onExit={handleReturnToGameSelection}
          sharedSessionId={sharedMatchSessionId ?? undefined}
          currentUserId={user?.id}
          restoredState={matchRuntime}
          onStateChange={setMatchRuntime}
        />
      )}

      {screen === 'CRICKET_GAME' && currentMatch && (
          <CricketGameView
              players={currentMatch.players}
              config={currentMatch.config}
              onExit={handleReturnToGameSelection}
              onFinish={handleCricketFinish}
          />
      )}

      {screen === 'CRICKET_STATS' && cricketResults && (
          <CricketStatsView
              results={cricketResults}
              onHome={handleReturnToGameSelection}
              onRematch={handleRematch}
          />
      )}

      {screen === 'CAPITAL_GAME' && currentMatch && (
          <CapitalGameView 
              players={currentMatch.players}
              config={currentMatch.config}
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

      {screen === 'TRIATHLON_GAME' && currentMatch && (
          <TriathlonGameView 
              players={currentMatch.players}
              config={currentMatch.config}
              onExit={handleReturnToGameSelection}
              onFinish={handleTriathlonFinish}
          />
      )}

      {screen === 'TRIATHLON_STATS' && currentMatch && triathlonData && (
          <TriathlonStatsView 
              players={triathlonData.results?.triathlonCompetitors || currentMatch.players}
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
