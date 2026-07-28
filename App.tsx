
import { AuthenticateWithRedirectCallback, useAuth } from '@clerk/clerk-react';
import React, { Suspense, lazy, useEffect, useState } from 'react';
import { HomeView, PlayerAccountView, UserInfoView } from './views/HomeView';
import { CoachHomeView } from './views/CoachHomeView';
import { AssessmentView } from './views/AssessmentView';
import { ProgramReadyView } from './views/ProgramReadyView';
import type { AuthPanelMode } from './views/HomeView';
import { GameConfig, MatchState, CricketMatchSummary, CapitalPlayerState, KillerMatchSummary, GotchaMatchSummary, TriathlonFinishPayload } from './types';
import type { GameType } from './utils/arenaFlow';
import {
  isLiveUpdatePending,
  setLiveUpdateBlocked,
  setLiveUpdatePending,
} from './utils/appPersistence';
import {
  AppScreen,
  LIVE_UPDATE_PROTECTED_SCREENS,
  MatchRuntimeSnapshot,
  getRestoredAppSession,
  getRestoredAppSessionAsync,
  persistAppSession,
} from './src/app/appShell';
import { useAppScreenHistory } from './src/app/useAppScreenHistory';
import { useGameLifecycle } from './src/app/useGameLifecycle';
import { env } from './src/lib/env';
import type {
  TournamentMatchDetail,
  TournamentScoringContext,
  TournamentSubmissionRecord,
} from './src/application/scoring/tournamentScoring';
import { mapX01TournamentResultSubmission } from './src/application/scoring/tournamentScoring';
import { HttpTournamentScoringClient, createMockTournamentScoringClient } from './src/features/tournament-scoring/tournamentScoringApi';
import {
  LocalTournamentSubmissionRepository,
  createTournamentSubmissionRecord,
  submitTournamentResultWithLocalDraft,
} from './src/features/tournament-scoring/localTournamentSubmissions';
import { buildPersonalX01MatchPayload } from './src/application/scoring/personalX01Scoring';
import { buildPersonalCricketMatchPayload } from './src/application/scoring/personalCricketScoring';
import { CoachAIService, GenerateCoachSession, RunFullAssessment, GenerateInitialProgram, type CoachSessionPlan, type CoachHomeAction, type FullAssessmentOutcome, type TrainingProgram } from './src/application/coach';
import type { AssessmentDefinition, AssessmentRawInputs, SkillTrend } from './src/domain/coach';
import { CoachApiError, HttpCoachAiDecisionClient, HttpCoachAssessmentClient, HttpCoachProgramClient, HttpCoachRepository } from './src/infrastructure/bougnatApi/coachApi';
import {
  HttpPersonalX01MatchGateway,
  LocalPersonalX01MatchRepository,
  retryPendingPersonalX01Matches,
} from './src/features/player-account/localPersonalX01Matches';
import type { PersonalScoringMatchPayload } from './src/features/player-account/playerAccountTypes';
import { enterFullScreen } from './utils/uiUtils';

const StatsView = lazy(() => import('./views/StatsView').then((module) => ({ default: module.StatsView })));
const GameSelectionView = lazy(() => import('./views/GameSelectionView').then((module) => ({ default: module.GameSelectionView })));
const SetupView = lazy(() => import('./views/SetupView').then((module) => ({ default: module.SetupView })));
const MatchView = lazy(() => import('./views/MatchView').then((module) => ({ default: module.MatchView })));
const CricketGameView = lazy(() => import('./views/CricketGameView').then((module) => ({ default: module.CricketGameView })));
const CricketStatsView = lazy(() => import('./views/CricketStatsView').then((module) => ({ default: module.CricketStatsView })));
const CapitalGameView = lazy(() => import('./views/CapitalGameView').then((module) => ({ default: module.CapitalGameView })));
const CapitalStatsView = lazy(() => import('./views/CapitalStatsView').then((module) => ({ default: module.CapitalStatsView })));
const KillerGameView = lazy(() => import('./views/KillerGameView').then((module) => ({ default: module.KillerGameView })));
const GotchaGameView = lazy(() => import('./views/GotchaGameView').then((module) => ({ default: module.GotchaGameView })));
const TriathlonGameView = lazy(() => import('./views/TriathlonGameView').then((module) => ({ default: module.TriathlonGameView })));
const TriathlonStatsView = lazy(() => import('./views/TriathlonStatsView').then((module) => ({ default: module.TriathlonStatsView })));

const getLinkedAccountPlayers = (players: MatchState['players']) =>
  players.filter((player) => player.accountLink?.enabled && player.accountLink.player_id);

const buildLinkedX01Payloads = (match: MatchState): PersonalScoringMatchPayload[] =>
  getLinkedAccountPlayers(match.players).map((player) => buildPersonalX01MatchPayload(match, {
    playerTeamId: player.teamId,
    participantKey: player.id,
    targetPlayerId: player.accountLink?.player_id,
  }));

const buildLinkedCricketPayloads = (summary: CricketMatchSummary, players: MatchState['players']): PersonalScoringMatchPayload[] =>
  getLinkedAccountPlayers(players).map((player) => buildPersonalCricketMatchPayload(summary, {
    playerId: summary.isDoubles ? player.teamId : player.id,
    participantKey: player.id,
    targetPlayerId: player.accountLink?.player_id,
  }));

const savePersonalScoringPayloads = async (payloads: PersonalScoringMatchPayload[]): Promise<number> => {
  if (!payloads.length) return 0;
  const repository = new LocalPersonalX01MatchRepository();
  await Promise.all(payloads.map((payload) => repository.savePending(payload)));
  return payloads.length;
};

const ScreenLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#06080d] text-white">
    <div className="flex flex-col items-center gap-3">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-emerald-400" />
      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-gray-400">Chargement</div>
    </div>
  </div>
);

const COACH_DEV_SESSION_STORAGE_KEY = 'bdt.coach.dev.connected';
const COACH_DEV_BEARER_TOKEN = 'coach-dev-token';
const COACH_DEV_PLAYER_ID = '00000000-0000-0000-0000-000000000001';

const isCoachDevEnvironment = () => {
  const value = env.VITE_APP_ENV.trim().toLowerCase();
  return value === 'local' || value === 'dev' || value === 'development' || value === 'test';
};

const shouldEnableCoachDevSessionByDefault = () => {
  if (typeof window === 'undefined') return false;
  if (!isCoachDevEnvironment()) return false;

  const authMode = new URLSearchParams(window.location.search).get('auth');
  if (authMode === 'coach-dev') {
    return true;
  }

  const persisted = window.localStorage.getItem(COACH_DEV_SESSION_STORAGE_KEY);
  if (persisted === null) return false;
  return persisted === '1';
};

export const App: React.FC = () => {
  const { getToken, userId } = useAuth();
  const [restoredSession] = useState(() => getRestoredAppSession());
  const [screen, setScreen] = useState<AppScreen>(() => (restoredSession?.screen as AppScreen | undefined) ?? 'HOME');
  const [currentMatch, setCurrentMatch] = useState<MatchState | null>(() => restoredSession?.matchRuntime?.match ?? restoredSession?.currentMatch ?? null);
  const [matchWinner, setMatchWinner] = useState<string>(() => restoredSession?.matchWinner ?? '');
  const [arenaPrefillPlayers, setArenaPrefillPlayers] = useState<string[]>(() => restoredSession?.arenaPrefillPlayers ?? []);
  const [arenaPrefillConfig, setArenaPrefillConfig] = useState<Partial<GameConfig> | undefined>(() => restoredSession?.arenaPrefillConfig);
  const [matchRuntime, setMatchRuntime] = useState<MatchRuntimeSnapshot | null>(() => restoredSession?.matchRuntime ?? null);
  const [tournamentContext, setTournamentContext] = useState<TournamentScoringContext | null>(() => restoredSession?.tournamentContext ?? null);
  const [tournamentSubmission, setTournamentSubmission] = useState<TournamentSubmissionRecord | null>(() => restoredSession?.tournamentSubmission ?? null);
  const [tournamentBearerToken, setTournamentBearerToken] = useState<string | null>(null);
  const [personalSyncNonce, setPersonalSyncNonce] = useState(0);
  
  // State for Cricket results
  const [cricketResults, setCricketResults] = useState<CricketMatchSummary | null>(() => restoredSession?.cricketResults ?? null);

  // State for Triathlon results
  const [triathlonData, setTriathlonData] = useState<TriathlonFinishPayload | null>(() => restoredSession?.triathlonData ?? null);

  // State for Capital results
  const [capitalResults, setCapitalResults] = useState<CapitalPlayerState[]>(() => restoredSession?.capitalResults ?? []);
  const [killerResults, setKillerResults] = useState<KillerMatchSummary | null>(() => restoredSession?.killerResults ?? null);
  const [gotchaResults, setGotchaResults] = useState<GotchaMatchSummary | null>(() => restoredSession?.gotchaResults ?? null);
  const [selectedGameType, setSelectedGameType] = useState<GameType>(() => restoredSession?.selectedGameType ?? 'X01');
  const [accountInitialMode, setAccountInitialMode] = useState<AuthPanelMode>('login');
  const [isSessionHydrated, setIsSessionHydrated] = useState(Boolean(restoredSession));
  const [coachPlan, setCoachPlan] = useState<CoachSessionPlan | null>(null);
  const [coachPending, setCoachPending] = useState(false);
  const [coachError, setCoachError] = useState<string | null>(null);
  const [coachAssessmentOutcome, setCoachAssessmentOutcome] = useState<FullAssessmentOutcome | null>(null);
  const [coachAssessmentDefinition, setCoachAssessmentDefinition] = useState<AssessmentDefinition | null>(null);
  const [coachDefinitionLoading, setCoachDefinitionLoading] = useState(false);
  const [coachProgram, setCoachProgram] = useState<TrainingProgram | null>(null);
  const [coachProgramPending, setCoachProgramPending] = useState(false);
  const [coachSkillTrends, setCoachSkillTrends] = useState<Record<string, SkillTrend>>({});
  const [coachDevConnected, setCoachDevConnected] = useState<boolean>(() => shouldEnableCoachDevSessionByDefault());
  const isConnectedModeEnabled = env.VITE_TOURNAMENT_BACKEND_ENABLED;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!isCoachDevEnvironment()) return;
    window.localStorage.setItem(COACH_DEV_SESSION_STORAGE_KEY, coachDevConnected ? '1' : '0');
  }, [coachDevConnected]);

  useEffect(() => {
    if (restoredSession) {
      setIsSessionHydrated(true);
      return;
    }

    let cancelled = false;

    void getRestoredAppSessionAsync().then((persistedSession) => {
      if (cancelled || !persistedSession) {
        if (!cancelled) {
          setIsSessionHydrated(true);
        }
        return;
      }

      setScreen(persistedSession.screen as AppScreen);
      setSelectedGameType(persistedSession.selectedGameType);
      setCurrentMatch(persistedSession.matchRuntime?.match ?? persistedSession.currentMatch ?? null);
      setMatchWinner(persistedSession.matchWinner);
      setArenaPrefillPlayers(persistedSession.arenaPrefillPlayers);
      setArenaPrefillConfig(persistedSession.arenaPrefillConfig);
      setMatchRuntime(persistedSession.matchRuntime);
      setTournamentContext(persistedSession.tournamentContext ?? null);
      setTournamentSubmission(persistedSession.tournamentSubmission ?? null);
      setCricketResults(persistedSession.cricketResults);
      setTriathlonData(persistedSession.triathlonData);
      setCapitalResults(persistedSession.capitalResults);
      setKillerResults(persistedSession.killerResults ?? null);
      setGotchaResults(persistedSession.gotchaResults ?? null);
      setIsSessionHydrated(true);
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
      arenaPrefillPlayers,
      arenaPrefillConfig,
      cricketResults,
      triathlonData,
      capitalResults,
      killerResults,
      gotchaResults,
      matchRuntime,
      tournamentContext,
      tournamentSubmission,
    });
  }, [
    arenaPrefillConfig,
    arenaPrefillPlayers,
    capitalResults,
    cricketResults,
    currentMatch,
    gotchaResults,
    killerResults,
    matchRuntime,
    matchWinner,
    screen,
    selectedGameType,
    tournamentContext,
    tournamentSubmission,
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
      (screen === 'MATCH' || screen === 'STATS' || screen === 'CRICKET_GAME' || screen === 'CAPITAL_GAME' || screen === 'KILLER_GAME' || screen === 'GOTCHA_GAME' || screen === 'TRIATHLON_GAME' || screen === 'TRIATHLON_STATS')
      && !currentMatch
      && !matchRuntime
    ) {
      setScreen('GAME_SELECTION');
    }
  }, [currentMatch, matchRuntime, screen]);

  useEffect(() => {
    if (!isConnectedModeEnabled && (screen === 'PLAYER_ACCOUNT' || screen === 'USER_INFO')) {
      setScreen('HOME');
    }
  }, [isConnectedModeEnabled, screen]);

  const {
    handleQuickGame,
    handleGameSelect,
    handleStartSetup,
    handleMatchFinish,
    handleMatchFinishWithData: handleLocalMatchFinishWithData,
    handleCricketFinish: handleLocalCricketFinish,
    handleTriathlonFinish,
    handleCapitalFinish,
    handleKillerFinish,
    handleGotchaFinish,
    handleReturnToGameSelection,
    handleRematch,
  } = useGameLifecycle({
    currentMatch,
    selectedGameType,
    setScreen,
    setCurrentMatch,
    setMatchWinner,
    setMatchRuntime,
    setSelectedGameType,
    setArenaPrefillPlayers,
    setArenaPrefillConfig,
    setCricketResults,
    setCapitalResults,
    setKillerResults,
    setGotchaResults,
    setTriathlonData,
  });

  const submitTournamentResult = async (context: TournamentScoringContext, finalMatch: MatchState, bearerToken: string | null) => {
    const submission = mapX01TournamentResultSubmission(context, finalMatch);
    const repository = new LocalTournamentSubmissionRepository();
    setTournamentSubmission(createTournamentSubmissionRecord(submission, 'pending'));

    const gateway = bearerToken === '__mock__'
      ? createMockTournamentScoringClient()
      : bearerToken
        ? new HttpTournamentScoringClient(env.VITE_TOURNAMENT_API_BASE_URL || env.VITE_BOUGNAT_API_URL, async () => bearerToken)
        : null;

    if (!gateway) {
      const draft = createTournamentSubmissionRecord(submission, 'network_error', 'Session API absente. Retry depuis l espace joueur.');
      await repository.saveDraft(draft);
      setTournamentSubmission(draft);
      return;
    }

    const result = await submitTournamentResultWithLocalDraft(gateway, repository, submission);
    setTournamentSubmission(result);
  };

  const handleTournamentMatchLaunch = (detail: TournamentMatchDetail, bearerToken: string) => {
    enterFullScreen();
    setSelectedGameType('X01');
    setCurrentMatch(detail.match);
    setMatchWinner('');
    setMatchRuntime(null);
    setTournamentContext(detail.context);
    setTournamentSubmission(null);
    setTournamentBearerToken(bearerToken);
    setScreen('MATCH');
  };

  const handleMatchFinishWithData = (winnerId: string, finalMatch: MatchState) => {
    handleLocalMatchFinishWithData(winnerId, finalMatch);
    if (tournamentContext) {
      void submitTournamentResult(tournamentContext, finalMatch, tournamentBearerToken);
    } else if (env.VITE_TOURNAMENT_BACKEND_ENABLED) {
      const payloads = buildLinkedX01Payloads(finalMatch);
      void savePersonalScoringPayloads(payloads).then((savedCount) => {
        if (savedCount > 0) setPersonalSyncNonce((value) => value + 1);
      });
    }
  };

  const handleCricketFinish = (results: CricketMatchSummary) => {
    handleLocalCricketFinish(results);
    if (env.VITE_TOURNAMENT_BACKEND_ENABLED) {
      const payloads = buildLinkedCricketPayloads(results, currentMatch?.players ?? []);
      void savePersonalScoringPayloads(payloads).then((savedCount) => {
        if (savedCount > 0) setPersonalSyncNonce((value) => value + 1);
      });
    }
  };

  const handleReturnToGameSelectionAndClearTournament = () => {
    setTournamentContext(null);
    setTournamentSubmission(null);
    setTournamentBearerToken(null);
    handleReturnToGameSelection();
  };

  const isClerkOauthCallback = env.VITE_CLERK_PUBLISHABLE_KEY.trim() && window.location.pathname === '/sso-callback';
  const handleOpenAccount = (mode: AuthPanelMode) => {
    setAccountInitialMode(mode);
    setScreen('PLAYER_ACCOUNT');
  };
  const handleOpenUserInfo = () => {
    setScreen('USER_INFO');
  };

  const handleCoachAction = (action: CoachHomeAction) => {
    if (action === 'full_assessment') {
      setCoachError(null);
      setCoachAssessmentOutcome(null);
      setCoachProgram(null);
      setCoachSkillTrends({});
      setScreen('COACH_ASSESSMENT');
      void handleLoadAssessmentDefinition();
      return;
    }
    setCoachPending(true);
    setCoachError(null);

    void (async () => {
      try {
        const apiBaseUrl = env.VITE_TOURNAMENT_API_BASE_URL || env.VITE_BOUGNAT_API_URL;
        const tokenProvider = async () => {
          const clerkToken = await getToken({ template: env.VITE_CLERK_JWT_TEMPLATE_NAME });
          if (clerkToken) {
            return clerkToken;
          }
          if (coachDevConnected && isCoachDevEnvironment()) {
            return COACH_DEV_BEARER_TOKEN;
          }
          return null;
        };
        const probeToken = await tokenProvider();
        if (!probeToken) {
          throw new CoachApiError('Connectez-vous pour utiliser le Coach IA.', 401);
        }
        const repository = new HttpCoachRepository(apiBaseUrl, tokenProvider);
        const aiClient = new HttpCoachAiDecisionClient(apiBaseUrl, tokenProvider);
        const useCase = new GenerateCoachSession(new CoachAIService(repository, aiClient));

        const plan = await useCase.execute({
          playerId: coachDevConnected && isCoachDevEnvironment() ? COACH_DEV_PLAYER_ID : (userId ?? 'coach-user'),
          action,
          constraints: {},
        });
        setCoachPlan(plan);
      } catch (error) {
        if (error instanceof CoachApiError) {
          if (error.status === 401 && coachDevConnected) {
            setCoachDevConnected(false);
            setCoachError('Token dev refuse par l API. Connecte-toi via Clerk ou active AUTH_SKIP_VERIFY=true cote backend dev.');
            return;
          }
          setCoachError(error.message);
        } else if (error instanceof Error && error.message.trim()) {
          setCoachError(error.message);
        } else {
          setCoachError('Generation Coach indisponible. Reessayez.');
        }
      } finally {
        setCoachPending(false);
      }
    })();
  };

  const handleLoadAssessmentDefinition = async () => {
    setCoachDefinitionLoading(true);
    setCoachError(null);
    try {
      const apiBaseUrl = env.VITE_TOURNAMENT_API_BASE_URL || env.VITE_BOUGNAT_API_URL;
      const tokenProvider = async () => {
        const clerkToken = await getToken({ template: env.VITE_CLERK_JWT_TEMPLATE_NAME });
        if (clerkToken) {
          return clerkToken;
        }
        if (coachDevConnected && isCoachDevEnvironment()) {
          return COACH_DEV_BEARER_TOKEN;
        }
        return null;
      };
      const assessmentClient = new HttpCoachAssessmentClient(apiBaseUrl, tokenProvider);
      const definition = await assessmentClient.getDefinition();
      setCoachAssessmentDefinition(definition);
    } catch (error) {
      if (error instanceof CoachApiError) {
        setCoachError(error.message);
      } else if (error instanceof Error && error.message.trim()) {
        setCoachError(error.message);
      } else {
        setCoachError('Evaluation indisponible. Reessayez.');
      }
    } finally {
      setCoachDefinitionLoading(false);
    }
  };

  const handleRunAssessment = (rawInputs: AssessmentRawInputs) => {
    setCoachPending(true);
    setCoachError(null);

    void (async () => {
      try {
        const apiBaseUrl = env.VITE_TOURNAMENT_API_BASE_URL || env.VITE_BOUGNAT_API_URL;
        const tokenProvider = async () => {
          const clerkToken = await getToken({ template: env.VITE_CLERK_JWT_TEMPLATE_NAME });
          if (clerkToken) {
            return clerkToken;
          }
          if (coachDevConnected && isCoachDevEnvironment()) {
            return COACH_DEV_BEARER_TOKEN;
          }
          return null;
        };
        const probeToken = await tokenProvider();
        if (!probeToken) {
          throw new CoachApiError('Connectez-vous pour utiliser le Coach IA.', 401);
        }
        const assessmentClient = new HttpCoachAssessmentClient(apiBaseUrl, tokenProvider);
        const useCase = new RunFullAssessment(assessmentClient);
        const outcome = await useCase.execute(rawInputs);
        setCoachAssessmentOutcome(outcome);
        // Bilan premium: on recupere les tendances par competence (evolution)
        // calculees par le backend lors de la calibration de l evaluation.
        try {
          const repository = new HttpCoachRepository(apiBaseUrl, tokenProvider);
          const skills = await repository.listPlayerSkills();
          const trends: Record<string, SkillTrend> = {};
          for (const skill of skills) {
            trends[skill.skillId] = skill.trend;
          }
          setCoachSkillTrends(trends);
        } catch {
          setCoachSkillTrends({});
        }
        // Generation automatique du programme: le backend possede le niveau et
        // l objectif prioritaire calibres par l evaluation, on ne lui passe donc
        // aucun objectif et il construit niveau + cycle 1 + seance 1.
        setCoachProgram(null);
        setCoachProgramPending(true);
        try {
          const programClient = new HttpCoachProgramClient(apiBaseUrl, tokenProvider);
          const program = await new GenerateInitialProgram(programClient).execute();
          setCoachProgram(program);
        } catch {
          // Le programme reste optionnel: l echec ne bloque pas l affichage du bilan.
          setCoachProgram(null);
        } finally {
          setCoachProgramPending(false);
        }
      } catch (error) {
        if (error instanceof CoachApiError) {
          if (error.status === 401 && coachDevConnected) {
            setCoachDevConnected(false);
            setCoachError('Token dev refuse par l API. Connecte-toi via Clerk ou active AUTH_SKIP_VERIFY=true cote backend dev.');
            return;
          }
          setCoachError(error.message);
        } else if (error instanceof Error && error.message.trim()) {
          setCoachError(error.message);
        } else {
          setCoachError('Evaluation Coach indisponible. Reessayez.');
        }
      } finally {
        setCoachPending(false);
      }
    })();
  };

  return (
    <div className="antialiased font-sans bg-black h-full">
      {env.VITE_TOURNAMENT_BACKEND_ENABLED && env.VITE_CLERK_PUBLISHABLE_KEY.trim() ? (
        <PersonalX01SyncBridge
          apiBaseUrl={env.VITE_TOURNAMENT_API_BASE_URL || env.VITE_BOUGNAT_API_URL}
          jwtTemplateName={env.VITE_CLERK_JWT_TEMPLATE_NAME}
          retryNonce={personalSyncNonce}
        />
      ) : null}
      {isClerkOauthCallback ? (
        <div className="flex min-h-screen items-center justify-center bg-[#06080d] px-4 text-white">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-white/10 border-t-orange-300" />
            <div className="mt-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-300">Connexion</div>
            <AuthenticateWithRedirectCallback />
          </div>
        </div>
      ) : (
      <Suspense fallback={<ScreenLoader />}>
      {screen === 'HOME' && (
        <HomeView 
          onOpenCoach={() => setScreen('COACH_HOME')}
          onQuickGame={() => {
            setTournamentContext(null);
            setTournamentSubmission(null);
            setTournamentBearerToken(null);
            handleQuickGame();
          }}
          onOpenAccount={handleOpenAccount}
          onOpenUserInfo={handleOpenUserInfo}
        />
      )}

      {screen === 'COACH_HOME' && (
        <CoachHomeView
          onBack={() => setScreen('HOME')}
          onSelectAction={handleCoachAction}
          pending={coachPending}
          error={coachError}
          plan={coachPlan}
          coachDevConnected={coachDevConnected && isCoachDevEnvironment()}
          coachDevAvailable={isCoachDevEnvironment()}
          onConnectCoachDev={() => setCoachDevConnected(true)}
          onDisconnectCoachDev={() => setCoachDevConnected(false)}
        />
      )}

      {screen === 'COACH_ASSESSMENT' && (
        <AssessmentView
          definition={coachAssessmentDefinition}
          loadingDefinition={coachDefinitionLoading}
          onRetryDefinition={() => {
            void handleLoadAssessmentDefinition();
          }}
          onBack={() => {
            setCoachError(null);
            setScreen('COACH_HOME');
          }}
          onSubmit={handleRunAssessment}
          pending={coachPending}
          error={coachError}
          outcome={coachAssessmentOutcome}
          onRestart={() => {
            setCoachAssessmentOutcome(null);
            setCoachProgram(null);
            setCoachSkillTrends({});
            setCoachError(null);
          }}
          onContinue={() => setScreen('COACH_PROGRAM_READY')}
          programPending={coachProgramPending}
          skillTrends={coachSkillTrends}
        />
      )}

      {screen === 'COACH_PROGRAM_READY' && (
        <ProgramReadyView
          program={coachProgram}
          pending={coachProgramPending}
          onBack={() => setScreen('COACH_ASSESSMENT')}
          onStart={() => {
            setScreen('COACH_HOME');
            handleCoachAction('continue_program');
          }}
        />
      )}

      {screen === 'PLAYER_ACCOUNT' && (
        <PlayerAccountView
          initialMode={accountInitialMode}
          onBack={() => setScreen('HOME')}
        />
      )}

      {screen === 'USER_INFO' && (
        <UserInfoView
          onBack={() => setScreen('HOME')}
          onLaunchTournamentMatch={handleTournamentMatchLaunch}
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
          gameType={selectedGameType}
          onStart={handleStartSetup} 
          onBack={() => setScreen('GAME_SELECTION')}
          prefilledPlayerNames={arenaPrefillPlayers}
          prefilledConfig={arenaPrefillConfig}
        />
      )}
      
      {screen === 'MATCH' && currentMatch && (
        <MatchView 
          initialMatch={matchRuntime?.match ?? currentMatch} 
          onFinish={handleMatchFinish}
          onFinishWithState={handleMatchFinishWithData}
          onExit={handleReturnToGameSelectionAndClearTournament}
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

      {screen === 'KILLER_GAME' && currentMatch && (
          <KillerGameView
              players={currentMatch.players}
              config={currentMatch.config}
              onExit={handleReturnToGameSelection}
              onFinish={handleKillerFinish}
          />
      )}

      {screen === 'GOTCHA_GAME' && currentMatch && (
          <GotchaGameView
              players={currentMatch.players}
              config={currentMatch.config}
              onExit={handleReturnToGameSelection}
              onFinish={handleGotchaFinish}
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
          onHome={handleReturnToGameSelectionAndClearTournament}
          onRematch={handleRematch}
          match={currentMatch}
          tournamentSubmission={tournamentSubmission}
        />
      )}
      </Suspense>
      )}
    </div>
  );
};

const PersonalX01SyncBridge: React.FC<{
  apiBaseUrl: string;
  jwtTemplateName: string;
  retryNonce: number;
}> = ({ apiBaseUrl, jwtTemplateName, retryNonce }) => {
  const { getToken, isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    const syncPending = () => {
      const gateway = new HttpPersonalX01MatchGateway(apiBaseUrl, () => getToken({ template: jwtTemplateName }));
      void retryPendingPersonalX01Matches(gateway).then((records) => {
        if (records.some((record) => record.status === 'synced')) {
          window.dispatchEvent(new CustomEvent('bougnat:personal-x01-sync', { detail: records }));
        }
      });
    };

    syncPending();
    window.addEventListener('online', syncPending);
    return () => {
      window.removeEventListener('online', syncPending);
    };
  }, [apiBaseUrl, getToken, isLoaded, isSignedIn, jwtTemplateName, retryNonce]);

  return null;
};
