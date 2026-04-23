
import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { HomeView } from './views/HomeView';
import { SetupView } from './views/SetupView';
import { MatchView } from './views/MatchView';
import { GameConfig, Player, MatchState, CricketMatchSummary, CapitalPlayerState, TriathlonFinishPayload, TriathlonResults } from './types';
import { createMatch } from './utils/gameLogic';
import { enterFullScreen, exitFullScreen } from './utils/uiUtils';
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
  removeLocalStorageItem,
  setLiveUpdateBlocked,
  setLiveUpdatePending,
} from './utils/appPersistence';
import {
  AppScreen,
  LIVE_UPDATE_PROTECTED_SCREENS,
  MatchRuntimeSnapshot,
  clearPersistedAppSession,
  getAppAccessMode,
  getRestoredAppSession,
  getRestoredAppSessionAsync,
  isScreenAllowedForAccessMode,
  persistAppSession,
} from './src/app/appShell';
import { launchLegacySharedMatchSession, saveFinishedMatchLocally, saveLocalGameHistoryEntry } from './src/infrastructure';
import { useAppScreenHistory } from './src/app/useAppScreenHistory';
import { useAppUserSession } from './src/app/useAppUserSession';

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

export const App: React.FC = () => {
  const appAccessMode = useMemo(() => getAppAccessMode(), []);
  const [restoredSession] = useState(() => getRestoredAppSession());
  const [screen, setScreen] = useState<AppScreen>(() => (
    window.location.pathname === '/auth/callback' ? 'AUTH_CALLBACK' : restoredSession?.screen ?? 'HOME'
  ));
  const [currentMatch, setCurrentMatch] = useState<MatchState | null>(() => restoredSession?.matchRuntime?.match ?? restoredSession?.currentMatch ?? null);
  const [matchWinner, setMatchWinner] = useState<string>(() => restoredSession?.matchWinner ?? '');
  const { user, setUser, logout } = useAppUserSession(appAccessMode, setScreen);
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

  useEffect(() => {
    if (restoredSession) {
      return;
    }

    let cancelled = false;

    void getRestoredAppSessionAsync().then((persistedSession) => {
      if (cancelled || !persistedSession) {
        return;
      }

      if (window.location.pathname === '/auth/callback') {
        return;
      }

      setScreen(persistedSession.screen as AppScreen);
      setSelectedGameType(persistedSession.selectedGameType);
      setCurrentMatch(persistedSession.matchRuntime?.match ?? persistedSession.currentMatch ?? null);
      setMatchWinner(persistedSession.matchWinner);
      setActiveLobbyCode(persistedSession.activeLobbyCode);
      setArenaPrefillPlayers(persistedSession.arenaPrefillPlayers);
      setArenaPrefillConfig(persistedSession.arenaPrefillConfig);
      setSharedMatchSessionId(persistedSession.sharedMatchSessionId);
      setMatchRuntime(persistedSession.matchRuntime);
      setCricketResults(persistedSession.cricketResults);
      setTriathlonData(persistedSession.triathlonData);
      setCapitalResults(persistedSession.capitalResults);
    });

    return () => {
      cancelled = true;
    };
  }, [restoredSession]);

  useEffect(() => {
    persistAppSession({
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
    });
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

  useAppScreenHistory(screen, setScreen);

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
    if (!isScreenAllowedForAccessMode(screen, appAccessMode)) {
      setScreen('GAME_SELECTION');
    }
  }, [appAccessMode, screen]);

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
      void saveFinishedMatchLocally(finalMatch);
      
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

    const { data } = await launchLegacySharedMatchSession({
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
      void saveLocalGameHistoryEntry({
        id: `cricket:${Date.now()}`,
        gameType: 'CRICKET',
        completedAt: new Date().toISOString(),
        winnerId: results.winnerId,
        payload: {
          results,
          players: currentMatch?.players ?? [],
          config: currentMatch?.config ?? null,
        },
      });
      setScreen('CRICKET_STATS');
  };

  const handleTriathlonFinish = (globalScores: Record<string, number>, results: TriathlonResults) => {
      exitFullScreen();
      setTriathlonData({ globalScores, results });
      setMatchRuntime(null);
      void saveLocalGameHistoryEntry({
        id: `triathlon:${Date.now()}`,
        gameType: 'TRIATHLON',
        completedAt: new Date().toISOString(),
        winnerId: results?.finalWinnerId || results?.tieBreakWinnerId || null,
        payload: {
          globalScores,
          results,
          players: currentMatch?.players ?? [],
          config: currentMatch?.config ?? null,
        },
      });
      setScreen('TRIATHLON_STATS');
  };

  // Handler for Capital games
  const handleCapitalFinish = (results: CapitalPlayerState[]) => {
      exitFullScreen();
      setCapitalResults(results);
      setMatchRuntime(null);
      void saveLocalGameHistoryEntry({
        id: `capital:${Date.now()}`,
        gameType: 'CAPITAL',
        completedAt: new Date().toISOString(),
        winnerId: [...results].sort((a, b) => b.score - a.score)[0]?.id ?? null,
        payload: {
          results,
          players: currentMatch?.players ?? [],
          config: currentMatch?.config ?? null,
        },
      });
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
      await logout();
      removeLocalStorageItem(APP_SESSION_STORAGE_KEY);
      clearPersistedAppSession();
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
