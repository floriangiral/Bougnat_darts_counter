import React, { useEffect, useState } from 'react';
import { ArrowLeft, Search, Swords, Users } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { GameConfig, Player, InOutRule, MatchMode } from '../types';
import { GameType } from './GameSelectionView';
import { MenuUserBadge } from '../components/ui/MenuUserBadge';
import { fetchAvailablePlayers } from '../lib/supabase';

interface SetupViewProps {
  gameType?: GameType;
  onStart: (players: Player[], config: GameConfig) => void;
  onBack: () => void;
  prefilledPlayerNames?: string[];
  prefilledConfig?: Partial<{
    startingScore: number;
    matchMode: MatchMode;
    legsToWin: number;
    setsToWin: number;
    isDoubles: boolean;
    checkIn: InOutRule;
    checkOut: InOutRule;
    initialStartingPlayerIndex: number;
    initialStartingTeamId: 'team1' | 'team2';
    teamStarterIds: Record<string, string>;
  }>;
  user?: any;
  onUserMenu?: () => void;
  onLogout?: () => void;
}

const sectionClass = 'rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.2)] backdrop-blur-sm';
const labelClass = 'mb-3 block text-[11px] font-black uppercase tracking-[0.28em] text-orange-300';
const activeOptionClass = 'bg-gradient-to-r from-orange-600 to-red-600 text-white border-transparent shadow-[0_0_14px_rgba(234,88,12,0.35)]';
const inactiveOptionClass = 'bg-white/[0.04] border-white/10 text-gray-400 hover:border-orange-500/40 hover:text-white';

interface ExistingPlayerOption {
  user_id: string;
  username: string;
  country_code: string;
  avatar_seed: string;
}

export const SetupView: React.FC<SetupViewProps> = ({
  onStart,
  onBack,
  gameType = 'X01',
  prefilledPlayerNames = [],
  prefilledConfig,
  user,
  onUserMenu,
  onLogout,
}) => {
  const isQuickPreset = gameType === 'X01_501_BO5';
  const [startingScore, setStartingScore] = useState(501);
  const [customScoreStr, setCustomScoreStr] = useState('170');
  const [matchMode, setMatchMode] = useState<MatchMode>('LEGS');
  const [legsToWin, setLegsToWin] = useState(3);
  const [setsToWin, setSetsToWin] = useState(3);
  const [isDoubles, setIsDoubles] = useState(false);
  const [playerNames, setPlayerNames] = useState<string[]>(['', '']);
  const [team1Names, setTeam1Names] = useState(['', '']);
  const [team2Names, setTeam2Names] = useState(['', '']);
  const [checkOut, setCheckOut] = useState<InOutRule>('Double');
  const [checkIn, setCheckIn] = useState<InOutRule>('Open');
  const [startingPlayerIndex, setStartingPlayerIndex] = useState(0);
  const [teamStarterIds, setTeamStarterIds] = useState<Record<string, string>>({
    team1: 't1p1',
    team2: 't2p1',
  });
  const [existingPlayers, setExistingPlayers] = useState<ExistingPlayerOption[]>([]);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isCustomScoreOpen, setIsCustomScoreOpen] = useState(false);
  const [isCustomLegsOpen, setIsCustomLegsOpen] = useState(false);
  const [customLegsStr, setCustomLegsStr] = useState('7');

  useEffect(() => {
    let cancelled = false;

    const loadPlayers = async () => {
      const data = await fetchAvailablePlayers();
      if (!cancelled) {
        setExistingPlayers(data as ExistingPlayerOption[]);
      }
    };

    loadPlayers();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (gameType === 'X01_501_BO5') {
      setStartingScore(501);
      setCustomScoreStr('501');
      setMatchMode('LEGS');
      setLegsToWin(3);
      setCustomLegsStr('3');
      setSetsToWin(1);
      setIsDoubles(false);
      setPlayerNames(['', '']);
      setCheckIn('Open');
      setCheckOut('Double');
      setStartingPlayerIndex(0);
      setTeamStarterIds({ team1: 't1p1', team2: 't2p1' });
      return;
    }

    if (gameType === 'X01') {
      setStartingScore(501);
      setMatchMode('LEGS');
      setLegsToWin(3);
      setCustomLegsStr('3');
      setSetsToWin(3);
      setIsDoubles(false);
      setCheckIn('Open');
      setCheckOut('Double');
      setStartingPlayerIndex(0);
      setTeamStarterIds({ team1: 't1p1', team2: 't2p1' });
      return;
    }

    if (gameType === 'CRICKET') {
      setMatchMode('LEGS');
      setLegsToWin(3);
      setCustomLegsStr('3');
      setSetsToWin(1);
      setIsDoubles(false);
      return;
    }

    if (gameType === 'TRIATHLON') {
      setMatchMode('LEGS');
      setLegsToWin(1);
      setCustomLegsStr('1');
      setSetsToWin(1);
      setIsDoubles(false);
    }
  }, [gameType]);

  useEffect(() => {
    const nextNames = prefilledPlayerNames
      .map((name) => name.trim())
      .filter(Boolean)
      .slice(0, 4);

    if (nextNames.length === 0) return;

    if (gameType === 'X01' && nextNames.length === 4) {
      setIsDoubles(true);
      setPlayerNames(nextNames);
      setTeam1Names([nextNames[0], nextNames[1]]);
      setTeam2Names([nextNames[2], nextNames[3]]);
      return;
    }

    setIsDoubles(false);
    setPlayerNames(nextNames);

    if (nextNames.length >= 2) {
      setTeam1Names([nextNames[0], nextNames[1]]);
    }

    if (nextNames.length >= 4) {
      setTeam2Names([nextNames[2], nextNames[3]]);
    }
  }, [prefilledPlayerNames, gameType]);

  useEffect(() => {
    if (!prefilledConfig) return;

    if (typeof prefilledConfig.startingScore === 'number') {
      setStartingScore(prefilledConfig.startingScore);
      setCustomScoreStr(String(prefilledConfig.startingScore));
    }

    if (prefilledConfig.matchMode) {
      setMatchMode(prefilledConfig.matchMode);
    }

    if (typeof prefilledConfig.legsToWin === 'number') {
      setLegsToWin(prefilledConfig.legsToWin);
      setCustomLegsStr(String(prefilledConfig.legsToWin));
    }

    if (typeof prefilledConfig.setsToWin === 'number') {
      setSetsToWin(prefilledConfig.setsToWin);
    }

    if (typeof prefilledConfig.isDoubles === 'boolean') {
      setIsDoubles(prefilledConfig.isDoubles);
    }

    if (typeof (prefilledConfig as GameConfig).initialStartingPlayerIndex === 'number') {
      setStartingPlayerIndex((prefilledConfig as GameConfig).initialStartingPlayerIndex || 0);
    }

    if ((prefilledConfig as GameConfig).teamStarterIds) {
      setTeamStarterIds((prefilledConfig as GameConfig).teamStarterIds as Record<string, string>);
    }

    if (prefilledConfig.checkIn) {
      setCheckIn(prefilledConfig.checkIn);
    }

    if (prefilledConfig.checkOut) {
      setCheckOut(prefilledConfig.checkOut);
    }
  }, [prefilledConfig]);

  useEffect(() => {
    if (isDoubles) return;
    setStartingPlayerIndex((prev) => Math.max(0, Math.min(playerNames.length - 1, prev)));
  }, [isDoubles, playerNames.length]);

  const setPlayerCount = (count: number) => {
    const minPlayers = gameType === 'CRICKET' && !isDoubles ? 2 : 1;
    const maxPlayers =
      (gameType === 'CRICKET' && !isDoubles) ? 3 :
      ((gameType === 'X01' || gameType === 'TRIATHLON') && !isDoubles) ? 2 :
      4;
    const newCount = Math.max(minPlayers, Math.min(maxPlayers, count));

    setPlayerNames((prev) => {
      if (newCount > prev.length) {
        return Array.from({ length: newCount }, (_, index) => prev[index] || `Joueur ${index + 1}`);
      }

      return prev.slice(0, newCount);
    });
  };

  const updatePlayerName = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const updateTeamName = (team: 1 | 2, index: number, name: string) => {
    if (team === 1) {
      const next = [...team1Names];
      next[index] = name;
      setTeam1Names(next);
      return;
    }

    const next = [...team2Names];
    next[index] = name;
    setTeam2Names(next);
  };

  const updateTeamStarter = (teamId: 'team1' | 'team2', playerId: string) => {
    setTeamStarterIds((prev) => ({
      ...prev,
      [teamId]: playerId,
    }));
  };

  const handleStart = () => {
    if (gameType === 'X01' && ((isCustomActive && !isCustomScoreValid) || (matchMode === 'LEGS' && isCustomLegsActive && !isCustomLegsValid))) {
      return;
    }

    const safeStartingScore = startingScore > 0 ? startingScore : 501;
    let players: Player[] = [];

    if (isQuickPreset) {
      players = [0, 1].map((index) => ({
        id: `p${index + 1}`,
        name: (playerNames[index] || `Joueur ${index + 1}`).trim() || `Joueur ${index + 1}`,
        teamId: `p${index + 1}`,
      }));
    } else if (isDoubles) {
      const p1 = { id: 't1p1', name: team1Names[0].trim() || 'Joueur 1', teamId: 'team1' };
      const p2 = { id: 't1p2', name: team1Names[1].trim() || 'Joueur 2', teamId: 'team1' };
      const p3 = { id: 't2p1', name: team2Names[0].trim() || 'Joueur 3', teamId: 'team2' };
      const p4 = { id: 't2p2', name: team2Names[1].trim() || 'Joueur 4', teamId: 'team2' };
      players = [p1, p2, p3, p4];
    } else {
      players = playerNames.map((name, i) => ({
        id: `p${i + 1}`,
        name: name.trim() || `Joueur ${i + 1}`,
        teamId: `p${i + 1}`,
      }));
    }

    const config: GameConfig = {
      startingScore: safeStartingScore,
      checkIn,
      checkOut,
      matchMode,
      legsToWin,
      setsToWin,
      isDoubles,
      initialStartingPlayerIndex: isDoubles ? 0 : startingPlayerIndex,
      initialStartingTeamId: undefined,
      teamStarterIds: isDoubles ? teamStarterIds : undefined,
    };

    onStart(players, config);
  };

  const getRuleDescription = (type: 'in' | 'out', rule: InOutRule) => {
    if (type === 'out') {
      switch (rule) {
        case 'Open':
          return 'Fin sur n importe quel segment.';
        case 'Double':
          return 'Fin classique sur un double ou le bull.';
        case 'Master':
          return 'Fin sur un double, un triple ou le bull.';
      }
    }

    switch (rule) {
      case 'Open':
        return 'Le score commence immediatement.';
      case 'Double':
        return 'Un double est requis pour ouvrir le score.';
      case 'Master':
        return 'Touchez un double ou un triple pour commencer.';
    }
  };

  const getRuleLabel = (rule: InOutRule) => {
    switch (rule) {
      case 'Open':
        return 'Open';
      case 'Double':
        return 'Double';
      case 'Master':
        return 'Master';
    }
  };

  const getMatchModeLabel = (mode: MatchMode) => {
    return mode === 'LEGS' ? 'Manches' : 'Sets';
  };

  const presets = [301, 501, 701, 1001];
  const customScoreValue = parseInt(customScoreStr, 10);
  const customLegsValue = parseInt(customLegsStr, 10);
  const hasCustomScoreValue = customScoreStr.trim().length > 0;
  const hasCustomLegsValue = customLegsStr.trim().length > 0;
  const isCustomScoreValid = hasCustomScoreValue && !Number.isNaN(customScoreValue) && customScoreValue >= 2;
  const isCustomLegsValid = hasCustomLegsValue && !Number.isNaN(customLegsValue) && customLegsValue >= 1;
  const isPresetSelected = presets.includes(startingScore);
  const presetLegsOptions = [1, 2, 3, 4, 5];
  const isCustomActive = !isPresetSelected || startingScore === parseInt(customScoreStr || '0', 10);
  const isCustomLegsActive = matchMode === 'LEGS' && !presetLegsOptions.includes(legsToWin);
  const isCustomScoreLaunchBlocked = gameType === 'X01' && isCustomActive && !isCustomScoreValid;
  const isCustomLegsLaunchBlocked = gameType === 'X01' && matchMode === 'LEGS' && isCustomLegsActive && !isCustomLegsValid;

  const handleCustomFocus = () => {
    const value = parseInt(customScoreStr, 10);
    if (!Number.isNaN(value)) setStartingScore(value);
  };

  const handleCustomChange = (value: string) => {
    const sanitizedValue = value.replace(/\D/g, '');
    setCustomScoreStr(sanitizedValue);
    const parsed = parseInt(sanitizedValue, 10);
    if (!Number.isNaN(parsed)) setStartingScore(parsed);
  };

  const handleCustomBlur = () => {
    if (!hasCustomScoreValue) return;
    if (!Number.isNaN(customScoreValue) && customScoreValue < 2) {
      setCustomScoreStr('2');
      setStartingScore(2);
    }
  };

  const handleCustomLegsFocus = () => {
    const value = parseInt(customLegsStr, 10);
    if (!Number.isNaN(value)) setLegsToWin(value);
  };

  const handleCustomLegsChange = (value: string) => {
    const sanitizedValue = value.replace(/\D/g, '');
    setCustomLegsStr(sanitizedValue);
    const parsed = parseInt(sanitizedValue, 10);
    if (!Number.isNaN(parsed)) setLegsToWin(parsed);
  };

  const handleCustomLegsBlur = () => {
    if (!hasCustomLegsValue) return;
    if (!Number.isNaN(customLegsValue) && customLegsValue < 1) {
      setCustomLegsStr('1');
      setLegsToWin(1);
    }
  };

  const getTitle = () => {
    if (gameType === 'CRICKET') return 'Configuration';
    if (gameType === 'CAPITAL') return 'Configuration';
    if (gameType === 'TRIATHLON') return 'Configuration';
    if (gameType === 'X01_501_BO5') return '501 Double Out';
    return 'Configuration';
  };

  const getGameName = () => {
    if (gameType === 'CRICKET') return 'Cricket';
    if (gameType === 'CAPITAL') return 'Capital';
    if (gameType === 'TRIATHLON') return 'Le Triathlon';
    if (gameType === 'X01_501_BO5') return '501, 3 manches gagnantes';
    return 'X01';
  };

  const getRulesContent = () => {
    if (gameType === 'X01' || gameType === 'X01_501_BO5') {
      return {
        title: 'Regles Du X01',
        items: [
          'Chaque joueur commence avec un score defini, puis retire les points marques a chaque tour.',
          'Le vainqueur est le premier a atteindre exactement zero.',
          `Check-in actuel : ${checkIn}. Le score ${checkIn === 'Open' ? 'commence immediatement' : 'ne commence qu apres une ouverture valide'}.`,
          `Check-out actuel : ${checkOut}. Il faut donc terminer selon cette regle pour valider la victoire.`,
          'Si un joueur depasse zero ou termine sans respecter le check-out, le tour est annule.',
        ],
      };
    }

    if (gameType === 'CRICKET') {
      return {
        title: 'Regles Du Cricket',
        items: [
          'Les cibles sont 15, 16, 17, 18, 19, 20 et Bull.',
          'Il faut fermer chaque nombre avec trois marques.',
          'Une fois une cible fermee, les marques supplementaires rapportent des points tant que l adversaire ne l a pas fermee.',
          'Le joueur gagne quand il a tout ferme et qu il a au moins autant de points que son adversaire.',
        ],
      };
    }

    if (gameType === 'CAPITAL') {
      return {
        title: 'Regles Du Capital',
        items: [
          'Ordre des challenges : Capital, 20, Suite, 19, 3 a cotes, 18, 57 points, 17, Couleur, 16, Triple, 15, Double, 14, Moins de 21, 21 inclus, 13, Bulle ou D-Bull.',
          'Capital : le joueur saisit directement le score total de sa visite.',
          'Sur les challenges numeriques, seuls les segments de la cible choisie comptent. Suite, 3 a cotes et Couleur se jouent sur 3 flechettes.',
          '57 points : il faut atteindre exactement 57, peu importe la combinaison. Si 57 est atteint avant la 3e flechette, le jeu passe directement a la suite.',
          'Moins de 21, 21 inclus : la visite est reussie si le total des 3 flechettes est inferieur ou egal a 21. Bulle ou D-Bull : un bull simple ou double valide le challenge.',
          'Un challenge reussi ajoute les points marques. En cas d echec, le score du joueur est divise par 2, arrondi a l entier superieur.',
        ],
      };
    }

    if (gameType === 'TRIATHLON') {
      return {
        title: 'Regles Du Triathlon',
        items: [
          'Le Triathlon enchaine 3 epreuves dans cet ordre : Capital, Cricket puis 501.',
          'Capital : 1 seule manche. En doublettes, chaque joueur joue individuellement et les scores des 2 equipiers sont additionnes pour le classement de l equipe.',
          'Cricket : 1 seule manche. En doublettes, le Cricket se joue en equipe, comme le 501.',
          '501 : finish au double, 1 seule manche, en individuel ou en doublettes selon le format choisi.',
          'Le depart se decide avec une fleche a la bulle : le joueur ou l equipe le plus pres du centre commence le Triathlon.',
          'Le score final se joue sur 100 points : chaque epreuve donne des points de resultat, puis des bonus de performance viennent completer le total.',
          'Les bonus prennent en compte la qualite de jeu : checkout, moyenne et flechettes sur le 501 ; MPR, score et fermetures sur le Cricket ; score, regularite et penalites sur le Capital.',
          'En cas d egalite au score final, un 501 supplementaire departage les joueurs ou les equipes. Le gagnant du tir a la bulle initial commence ce tie-break.',
          'Les statistiques finales affichent le detail des points de resultat, des bonus et le score final du Triathlon.',
        ],
      };
    }

    return {
      title: 'Regles Du Mode',
      items: [
        'Configure les joueurs et les options du mode avant de lancer la partie.',
        'Les regles detaillees dependront du type de jeu selectionne.',
      ],
    };
  };

  return (
    <div className="min-h-screen bg-[#06080d] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_22%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.04),transparent_35%)]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:30px_30px]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-gray-300 transition-all hover:border-orange-400/40 hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </button>

              {user && onUserMenu && (
                <MenuUserBadge user={user} onClick={onUserMenu} onLogout={onLogout} variant="integrated" />
              )}
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-black uppercase tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">
                {getTitle()}
              </h2>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-1">
              <button
                type="button"
                onClick={() => setIsRulesOpen(true)}
                className="rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-4 text-left backdrop-blur-sm transition-all hover:border-orange-400/30 hover:bg-white/[0.06]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Type De Jeu</p>
                    <p className="mt-2 text-2xl font-black text-orange-400">{getGameName()}</p>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">
                    Voir Les Regles
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-5">
            {gameType === 'X01' && (
              <section className={sectionClass}>
                <label className={labelClass}>Score De Depart</label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {presets.map((score) => (
                    <button
                      key={score}
                      onClick={() => setStartingScore(score)}
                      className={`rounded-2xl border py-3 text-sm font-black transition-all duration-200 ${startingScore === score ? activeOptionClass : inactiveOptionClass}`}
                    >
                      {score}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setIsCustomScoreOpen(true)}
                  className={`mt-4 w-full rounded-2xl border px-4 py-4 text-left transition-all duration-200 ${
                    isCustomActive && !presets.includes(startingScore)
                      ? 'border-orange-500/50 bg-white/[0.06] shadow-[0_0_20px_rgba(234,88,12,0.12)]'
                      : 'border-white/10 bg-black/20 hover:border-orange-400/30 hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Score Personnalise</div>
                      <div className="mt-2 text-2xl font-black text-white">
                        {hasCustomScoreValue ? customScoreStr : 'Saisir'}
                      </div>
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400">
                      Modifier
                    </div>
                  </div>
                  {isCustomActive && !isCustomScoreValid && (
                    <p className="mt-2 text-right text-xs font-bold text-amber-300">
                      Saisis une valeur de 2 ou plus pour lancer une partie personnalisee.
                    </p>
                  )}
                </button>
              </section>
            )}

            <section className={sectionClass}>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className={`${labelClass} mb-0`}>Joueurs</label>
                {(gameType === 'X01' || gameType === 'CRICKET' || gameType === 'TRIATHLON') && !isQuickPreset && (
                  <div className="inline-flex rounded-2xl border border-white/10 bg-black/20 p-1">
                    <button
                      onClick={() => setIsDoubles(false)}
                      className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all ${!isDoubles ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                    >
                      <Users className="mr-2 inline h-4 w-4" />
                      Simple
                    </button>
                    <button
                      onClick={() => setIsDoubles(true)}
                      className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all ${isDoubles ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                    >
                      <Swords className="mr-2 inline h-4 w-4" />
                      Doublettes
                    </button>
                  </div>
                )}
              </div>

              {!isDoubles ? (
                <>
                  {!isQuickPreset && (
                    <div className="mb-5 rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Nombre De Joueurs</div>
                      <div className="grid grid-cols-4 gap-2">
                        {[(gameType === 'CRICKET' ? 2 : 1), ...(gameType === 'CRICKET' ? [3] : (gameType === 'X01' || gameType === 'TRIATHLON') ? [2] : [2, 3, 4])].map((count) => (
                          <button
                            key={count}
                            type="button"
                            onClick={() => setPlayerCount(count)}
                            className={`rounded-xl border py-2 text-sm font-black transition-all ${playerNames.length === count ? activeOptionClass : inactiveOptionClass}`}
                          >
                            {count}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {(isQuickPreset ? playerNames.slice(0, 2) : playerNames).map((name, index) => (
                      <PlayerNameField
                        key={index}
                        label={`Joueur ${index + 1}`}
                        value={name}
                        placeholder={`Joueur ${index + 1}`}
                        existingPlayers={existingPlayers}
                        onChange={(value) => updatePlayerName(index, value)}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">Joueurs 1 / 2</div>
                    <div className="space-y-3">
                      <PlayerNameField
                        label="Joueur 1"
                        value={team1Names[0]}
                        placeholder="Joueur 1"
                        existingPlayers={existingPlayers}
                        onChange={(value) => updateTeamName(1, 0, value)}
                        compact
                      />
                      <PlayerNameField
                        label="Joueur 2"
                        value={team1Names[1]}
                        placeholder="Joueur 2"
                        existingPlayers={existingPlayers}
                        onChange={(value) => updateTeamName(1, 1, value)}
                        compact
                      />
                    </div>
                    <div className="mt-4">
                      <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Qui commence dans ce duo ?</div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 't1p1', label: team1Names[0].trim() || 'Joueur 1' },
                          { id: 't1p2', label: team1Names[1].trim() || 'Joueur 2' },
                        ].map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => updateTeamStarter('team1', option.id)}
                            className={`rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-[0.12em] ${teamStarterIds.team1 === option.id ? activeOptionClass : inactiveOptionClass}`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">Joueurs 3 / 4</div>
                    <div className="space-y-3">
                      <PlayerNameField
                        label="Joueur 3"
                        value={team2Names[0]}
                        placeholder="Joueur 3"
                        existingPlayers={existingPlayers}
                        onChange={(value) => updateTeamName(2, 0, value)}
                        compact
                      />
                      <PlayerNameField
                        label="Joueur 4"
                        value={team2Names[1]}
                        placeholder="Joueur 4"
                        existingPlayers={existingPlayers}
                        onChange={(value) => updateTeamName(2, 1, value)}
                        compact
                      />
                    </div>
                    <div className="mt-4">
                      <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Qui commence dans ce duo ?</div>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 't2p1', label: team2Names[0].trim() || 'Joueur 3' },
                          { id: 't2p2', label: team2Names[1].trim() || 'Joueur 4' },
                        ].map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => updateTeamStarter('team2', option.id)}
                            className={`rounded-xl border px-3 py-2 text-xs font-black uppercase tracking-[0.12em] ${teamStarterIds.team2 === option.id ? activeOptionClass : inactiveOptionClass}`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {gameType === 'X01' && (
              <section className={sectionClass}>
                <label className={labelClass}>Format Du Match</label>

                <div className="mb-5 inline-flex rounded-2xl border border-white/10 bg-black/20 p-1">
                  <button onClick={() => setMatchMode('LEGS')} className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all ${matchMode === 'LEGS' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>
                    Manches
                  </button>
                  <button onClick={() => setMatchMode('SETS')} className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all ${matchMode === 'SETS' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>
                    Sets
                  </button>
                </div>

                <div className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  {matchMode === 'LEGS' ? (
                    <div>
                      <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Manches Pour Gagner Le Match</div>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                        {presetLegsOptions.map((num) => (
                          <button key={num} onClick={() => setLegsToWin(num)} className={`rounded-xl border py-2 text-sm font-black ${legsToWin === num ? activeOptionClass : inactiveOptionClass}`}>
                            {num}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setIsCustomLegsOpen(true)}
                          className={`rounded-xl border py-2 text-sm font-black ${isCustomLegsActive ? activeOptionClass : inactiveOptionClass}`}
                        >
                          {isCustomLegsActive && hasCustomLegsValue ? customLegsStr : 'Perso'}
                        </button>
                      </div>
                      {isCustomLegsActive && !isCustomLegsValid && (
                        <p className="mt-3 text-right text-xs font-bold text-amber-300">
                          Saisis au moins 1 manche pour utiliser une valeur personnalisee.
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Sets Pour Gagner Le Match</div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {[1, 3, 5, 7].map((num) => (
                            <button key={num} onClick={() => setSetsToWin(num)} className={`rounded-xl border py-2 text-sm font-black ${setsToWin === num ? activeOptionClass : inactiveOptionClass}`}>
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Manches Pour Gagner Un Set</div>
                        <div className="grid grid-cols-2 gap-2">
                          {[3, 5].map((num) => (
                            <button key={num} onClick={() => setLegsToWin(num)} className={`rounded-xl border py-2 text-sm font-black ${legsToWin === num ? activeOptionClass : inactiveOptionClass}`}>
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </section>
            )}

            {gameType === 'X01' && (
              <section className={sectionClass}>
                <label className={labelClass}>Regles</label>
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Ouverture</div>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Open', 'Double', 'Master'] as const).map((rule) => (
                        <button key={rule} onClick={() => setCheckIn(rule)} className={`rounded-xl border px-2 py-2 text-[11px] font-black uppercase tracking-[0.14em] ${checkIn === rule ? activeOptionClass : inactiveOptionClass}`}>
                          {getRuleLabel(rule)}
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-sm text-gray-400">{getRuleDescription('in', checkIn)}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Fermeture</div>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Open', 'Double', 'Master'] as const).map((rule) => (
                        <button key={rule} onClick={() => setCheckOut(rule)} className={`rounded-xl border px-2 py-2 text-[11px] font-black uppercase tracking-[0.14em] ${checkOut === rule ? activeOptionClass : inactiveOptionClass}`}>
                          {getRuleLabel(rule)}
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-sm text-gray-400">{getRuleDescription('out', checkOut)}</p>
                  </div>
                </div>
              </section>
            )}

          </div>

          <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <section className={sectionClass}>
              <label className={labelClass}>Resume Du Match</label>
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Configuration</div>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-center justify-between">
                      <span>Jeu</span>
                      <span className="font-black text-white">{getGameName()}</span>
                    </div>
                    {gameType === 'TRIATHLON' && (
                      <>
                        <div className="flex items-center justify-between">
                          <span>Ordre Des Jeux</span>
                          <span className="font-black text-white">Capital / Cricket / 501</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Format</span>
                          <span className="font-black text-white">{isDoubles ? 'Doublettes' : 'Individuel'}</span>
                        </div>
                      </>
                    )}
                    {(gameType === 'X01' || gameType === 'CRICKET' || isQuickPreset) && (
                      <>
                        {(gameType === 'X01' || isQuickPreset) && (
                          <div className="flex items-center justify-between">
                            <span>Score De Depart</span>
                            <span className="font-black text-white">{startingScore}</span>
                          </div>
                        )}
                        {(gameType === 'X01' || isQuickPreset) && (
                          <div className="flex items-center justify-between">
                            <span>Format</span>
                            <span className="font-black text-white">{isQuickPreset ? 'BO5' : getMatchModeLabel(matchMode)}</span>
                          </div>
                        )}
                        {gameType === 'X01' && matchMode === 'LEGS' && (
                          <div className="flex items-center justify-between">
                            <span>Manches Pour Gagner</span>
                            <span className="font-black text-white">{legsToWin}</span>
                          </div>
                        )}
                        {gameType === 'X01' && matchMode === 'SETS' && (
                          <>
                            <div className="flex items-center justify-between">
                              <span>Sets Pour Gagner</span>
                              <span className="font-black text-white">{setsToWin}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Manches Par Set</span>
                              <span className="font-black text-white">{legsToWin}</span>
                            </div>
                          </>
                        )}
                        {gameType === 'X01' && (
                          <div className="flex items-center justify-between">
                            <span>Ouverture / Fermeture</span>
                            <span className="font-black text-white">{getRuleLabel(checkIn)} / {getRuleLabel(checkOut)}</span>
                          </div>
                        )}
                        {!isQuickPreset && (
                          <div className="flex items-center justify-between">
                            <span>Mode</span>
                            <span className="font-black text-white">{isDoubles ? 'Doublettes' : 'Simple'}</span>
                          </div>
                        )}
                        {isQuickPreset && (
                          <div className="flex items-center justify-between">
                            <span>Joueurs</span>
                            <span className="font-black text-white">1 vs 1</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <Button
                  onClick={handleStart}
                  disabled={isCustomScoreLaunchBlocked || isCustomLegsLaunchBlocked}
                  className="h-16 w-full rounded-2xl text-xl shadow-[0_18px_40px_rgba(234,88,12,0.28)] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                >
                  Lancer La Partie
                </Button>
              </div>
            </section>
          </aside>
        </div>
      </div>

      {isRulesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#0b1119]/96 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Regles</div>
                <h3 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">
                  {getRulesContent().title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRulesOpen(false)}
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-gray-300 transition-colors hover:border-white/20 hover:text-white"
              >
                Fermer
              </button>
            </div>

            <div className="overflow-y-auto px-6 py-5">
              <div className="space-y-3">
              {getRulesContent().items.map((item) => (
                <div key={item} className="rounded-2xl border border-white/8 bg-[#0a1018] px-4 py-4 text-sm leading-7 text-gray-300">
                  {item}
                </div>
              ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {isCustomScoreOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#0b1119]/96 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Score Personnalise</div>
                <h3 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">
                  Choisir Un Score
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomScoreOpen(false)}
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-gray-300 transition-colors hover:border-white/20 hover:text-white"
              >
                Fermer
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-[#0a1018] px-4 py-4">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                max="9999"
                value={customScoreStr}
                onChange={(e) => handleCustomChange(e.target.value)}
                onFocus={handleCustomFocus}
                onBlur={handleCustomBlur}
                className="w-full bg-transparent text-right font-mono text-4xl font-black text-white focus:outline-none"
                placeholder="170"
                autoFocus
              />
              {isCustomActive && !isCustomScoreValid && (
                <p className="mt-3 text-right text-xs font-bold text-amber-300">
                  Saisis une valeur de 2 ou plus pour lancer une partie personnalisee.
                </p>
              )}
            </div>

            <Button
              type="button"
              onClick={() => setIsCustomScoreOpen(false)}
              className="mt-5 h-14 w-full rounded-2xl"
            >
              Valider
            </Button>
          </div>
        </div>
      )}

      {isCustomLegsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-[#0b1119]/96 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Manches Personnalisees</div>
                <h3 className="mt-2 text-2xl font-black uppercase tracking-[-0.04em] text-white">
                  Choisir Un Nombre
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomLegsOpen(false)}
                className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-gray-300 transition-colors hover:border-white/20 hover:text-white"
              >
                Fermer
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-[#0a1018] px-4 py-4">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                max="9999"
                value={customLegsStr}
                onChange={(e) => handleCustomLegsChange(e.target.value)}
                onFocus={handleCustomLegsFocus}
                onBlur={handleCustomLegsBlur}
                className="w-full bg-transparent text-right font-mono text-4xl font-black text-white focus:outline-none"
                placeholder="7"
                autoFocus
              />
              {!isCustomLegsValid && (
                <p className="mt-3 text-right text-xs font-bold text-amber-300">
                  Saisis au moins 1 manche pour valider cette option.
                </p>
              )}
            </div>

            <Button
              type="button"
              onClick={() => setIsCustomLegsOpen(false)}
              disabled={!isCustomLegsValid}
              className="mt-5 h-14 w-full rounded-2xl"
            >
              Valider
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

interface PlayerNameFieldProps {
  label: string;
  value: string;
  placeholder: string;
  existingPlayers: ExistingPlayerOption[];
  onChange: (value: string) => void;
  compact?: boolean;
}

const PlayerNameField: React.FC<PlayerNameFieldProps> = ({
  label,
  value,
  placeholder,
  existingPlayers,
  onChange,
  compact = false,
}) => {
  const normalizedValue = value.trim().toLowerCase();
  const suggestions =
    normalizedValue.length === 0
      ? []
      : existingPlayers
          .filter((player) => player.username.toLowerCase().startsWith(normalizedValue))
          .slice(0, 6);
  const hasExactMatch = existingPlayers.some((player) => player.username.toLowerCase() === normalizedValue);

  return (
    <div className={`rounded-2xl border border-white/10 bg-black/20 px-4 py-3 transition-all focus-within:border-orange-400/50 ${compact ? '' : ''}`}>
      <div className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">{label}</div>
      <div className="space-y-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-500" />
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={(e) => e.target.select()}
              className={`w-full bg-transparent font-black text-white focus:outline-none ${compact ? 'text-sm' : 'text-lg'}`}
              placeholder={placeholder}
            />
          </div>
          <div className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">
            Rechercher un joueur existant ou saisir un nouveau nom
          </div>
        </div>

        {suggestions.length > 0 && (
          <div className="space-y-2">
            {suggestions.map((player) => {
              const isSelected = player.username === value;

              return (
                <button
                  key={player.user_id}
                  type="button"
                  onClick={() => onChange(player.username)}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition-all ${
                    isSelected
                      ? 'border-orange-400/40 bg-orange-500/10'
                      : 'border-white/8 bg-white/[0.03] hover:border-orange-400/20 hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-black uppercase tracking-[0.08em] text-white">{player.username}</div>
                    <div className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500">
                      Joueur existant
                    </div>
                  </div>
                  <div className="ml-3 rounded-full border border-white/10 bg-black/20 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">
                    {player.country_code}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {normalizedValue.length > 0 && suggestions.length === 0 && !hasExactMatch && (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-3 py-3 text-xs text-gray-400">
            Aucun joueur existant trouve. Ce nom sera utilise comme saisie manuelle.
          </div>
        )}
      </div>
    </div>
  );
};
