import React, { useEffect, useState } from 'react';
import { ArrowLeft, Search, Shield, Swords, Users, WandSparkles } from 'lucide-react';
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
  const isQuickPreset = gameType === 'X01_501_BO5' || gameType === 'X01_170_BO5';
  const [startingScore, setStartingScore] = useState(501);
  const [customScoreStr, setCustomScoreStr] = useState('170');
  const [matchMode, setMatchMode] = useState<MatchMode>('LEGS');
  const [legsToWin, setLegsToWin] = useState(3);
  const [setsToWin, setSetsToWin] = useState(3);
  const [isDoubles, setIsDoubles] = useState(false);
  const [playerNames, setPlayerNames] = useState<string[]>(['Player 1', 'Player 2']);
  const [team1Names, setTeam1Names] = useState(['Player 1', 'Player 2']);
  const [team2Names, setTeam2Names] = useState(['Player 3', 'Player 4']);
  const [checkOut, setCheckOut] = useState<InOutRule>('Double');
  const [checkIn, setCheckIn] = useState<InOutRule>('Open');
  const [randomizerTargetPoints, setRandomizerTargetPoints] = useState(30);
  const [randomizerTargetMinutes, setRandomizerTargetMinutes] = useState(20);
  const [randomizerEasyMode, setRandomizerEasyMode] = useState(false);
  const [randomizerEndCondition, setRandomizerEndCondition] = useState<'POINTS' | 'MINUTES'>('POINTS');
  const [existingPlayers, setExistingPlayers] = useState<ExistingPlayerOption[]>([]);

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
      setSetsToWin(1);
      setIsDoubles(false);
      setPlayerNames(['Player 1', 'Player 2']);
      setCheckIn('Open');
      setCheckOut('Double');
      return;
    }

    if (gameType === 'X01_170_BO5') {
      setStartingScore(170);
      setCustomScoreStr('170');
      setMatchMode('LEGS');
      setLegsToWin(3);
      setSetsToWin(1);
      setIsDoubles(false);
      setPlayerNames(['Player 1', 'Player 2']);
      setCheckIn('Open');
      setCheckOut('Double');
      return;
    }

    if (gameType === 'X01') {
      setStartingScore(501);
      setMatchMode('LEGS');
      setLegsToWin(3);
      setSetsToWin(3);
      setIsDoubles(false);
      setCheckIn('Open');
      setCheckOut('Double');
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
    }

    if (typeof prefilledConfig.setsToWin === 'number') {
      setSetsToWin(prefilledConfig.setsToWin);
    }

    if (typeof prefilledConfig.isDoubles === 'boolean') {
      setIsDoubles(prefilledConfig.isDoubles);
    }

    if (prefilledConfig.checkIn) {
      setCheckIn(prefilledConfig.checkIn);
    }

    if (prefilledConfig.checkOut) {
      setCheckOut(prefilledConfig.checkOut);
    }
  }, [prefilledConfig]);

  const updatePlayerCount = (delta: number) => {
    const currentCount = playerNames.length;
    const newCount = Math.max(1, Math.min(4, currentCount + delta));

    if (newCount === currentCount) return;

    setPlayerNames((prev) => {
      if (newCount > prev.length) {
        return [...prev, `Player ${newCount}`];
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

  const handleStart = () => {
    const safeStartingScore = startingScore > 0 ? startingScore : 501;
    let players: Player[] = [];

    if (isQuickPreset) {
      players = [0, 1].map((index) => ({
        id: `p${index + 1}`,
        name: (playerNames[index] || `Player ${index + 1}`).trim() || `Player ${index + 1}`,
        teamId: `p${index + 1}`,
      }));
    } else if (isDoubles) {
      const p1 = { id: 't1p1', name: team1Names[0].trim() || 'Player 1', teamId: 'team1' };
      const p2 = { id: 't1p2', name: team1Names[1].trim() || 'Player 2', teamId: 'team1' };
      const p3 = { id: 't2p1', name: team2Names[0].trim() || 'Player 3', teamId: 'team2' };
      const p4 = { id: 't2p2', name: team2Names[1].trim() || 'Player 4', teamId: 'team2' };
      players = [p1, p2, p3, p4];
    } else {
      players = playerNames.map((name, i) => ({
        id: `p${i + 1}`,
        name: name.trim() || `Player ${i + 1}`,
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
      randomizerTargetPoints: randomizerEndCondition === 'POINTS' ? randomizerTargetPoints : undefined,
      randomizerTargetMinutes: randomizerEndCondition === 'MINUTES' ? randomizerTargetMinutes : undefined,
      randomizerEasyMode,
    };

    onStart(players, config);
  };

  const getRuleDescription = (type: 'in' | 'out', rule: InOutRule) => {
    if (type === 'out') {
      switch (rule) {
        case 'Open':
          return 'Finish on any segment.';
        case 'Double':
          return 'Standard finish on a double or bull.';
        case 'Master':
          return 'Finish on a double, triple or bull.';
      }
    }

    switch (rule) {
      case 'Open':
        return 'Scoring starts immediately.';
      case 'Double':
        return 'A double is required to open scoring.';
      case 'Master':
        return 'Hit a double or triple to start.';
    }
  };

  const presets = [301, 501, 701, 1001];
  const isPresetSelected = presets.includes(startingScore);
  const isCustomActive = !isPresetSelected || startingScore === parseInt(customScoreStr || '0', 10);

  const handleCustomFocus = () => {
    const value = parseInt(customScoreStr, 10);
    if (!Number.isNaN(value)) setStartingScore(value);
  };

  const handleCustomChange = (value: string) => {
    setCustomScoreStr(value);
    const parsed = parseInt(value, 10);
    if (!Number.isNaN(parsed)) setStartingScore(parsed);
  };

  const getTitle = () => {
    if (gameType === 'CLOCK') return 'Around the World';
    if (gameType === '180') return '180 Attack';
    if (gameType === 'CRICKET') return 'Cricket Setup';
    if (gameType === 'CAPITAL') return 'Capital Setup';
    if (gameType === 'RANDOMIZER') return 'Randomizer Setup';
    if (gameType === 'TRIATHLON') return 'Triathlon Setup';
    if (gameType === 'X01_501_BO5') return '501 Double Out';
    if (gameType === 'X01_170_BO5') return '170 Double Out';
    return 'Match Setup';
  };

  const getSubtitle = () => {
    if (gameType === 'X01_501_BO5') return 'Preset 1v1 configuration: 501, double out, best of 5. Enter the two player names and launch.';
    if (gameType === 'X01_170_BO5') return 'Preset 1v1 configuration: 170, double out, best of 5. Enter the two player names and launch.';
    if (gameType === 'X01') return 'Configure score, format, players and rules before the first dart.';
    if (gameType === 'RANDOMIZER') return 'Adjust the challenge conditions and choose how the session should end.';
    if (gameType === 'TRIATHLON') return 'Prepare the full multi-discipline challenge before entering the arena.';
    return 'Set players and essentials, then launch the mode with one tap.';
  };

  return (
    <div className="min-h-screen bg-[#06080d] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(249,115,22,0.18),transparent_28%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_22%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.04),transparent_35%)]" />
      <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:30px_30px]" />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-gray-300 transition-all hover:border-orange-400/40 hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div className="space-y-3">
              <p className="text-[11px] font-black uppercase tracking-[0.32em] text-orange-300">Arena Config</p>
              <h2 className="text-3xl font-black uppercase tracking-[-0.04em] text-white sm:text-4xl lg:text-5xl">
                {getTitle()}
              </h2>
              <p className="max-w-3xl text-sm leading-7 text-gray-400 sm:text-base">
                {getSubtitle()}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {user && onUserMenu && <MenuUserBadge user={user} onClick={onUserMenu} onLogout={onLogout} />}

            <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Game Type</p>
              <p className="mt-2 text-2xl font-black text-orange-400">{gameType}</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Launch State</p>
              <p className="mt-2 text-2xl font-black text-white">Ready</p>
            </div>
          </div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-5">
            {gameType === 'X01' && (
              <section className={sectionClass}>
                <label className={labelClass}>Starting Score</label>
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

                <div
                  className={`mt-4 rounded-2xl border px-4 py-4 transition-all duration-200 ${
                    isCustomActive && !presets.includes(startingScore)
                      ? 'border-orange-500/50 bg-white/[0.06] shadow-[0_0_20px_rgba(234,88,12,0.12)]'
                      : 'border-white/10 bg-black/20'
                  }`}
                  onClick={handleCustomFocus}
                >
                  <div className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Custom Score</div>
                  <input
                    type="number"
                    min="1"
                    max="9999"
                    value={customScoreStr}
                    onChange={(e) => handleCustomChange(e.target.value)}
                    onFocus={handleCustomFocus}
                    className="w-full bg-transparent text-right font-mono text-3xl font-black text-white focus:outline-none"
                    placeholder="170"
                  />
                </div>
              </section>
            )}

            <section className={sectionClass}>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <label className={`${labelClass} mb-0`}>Players</label>
                {gameType === 'X01' && !isQuickPreset && (
                  <div className="inline-flex rounded-2xl border border-white/10 bg-black/20 p-1">
                    <button
                      onClick={() => setIsDoubles(false)}
                      className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all ${!isDoubles ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                    >
                      <Users className="mr-2 inline h-4 w-4" />
                      Solo
                    </button>
                    <button
                      onClick={() => setIsDoubles(true)}
                      className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all ${isDoubles ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}
                    >
                      <Swords className="mr-2 inline h-4 w-4" />
                      Doubles
                    </button>
                  </div>
                )}
              </div>

              {!isDoubles ? (
                <>
                  {!isQuickPreset && (
                    <div className="mb-5 flex items-center gap-4 rounded-2xl border border-white/10 bg-black/20 p-3">
                      <button onClick={() => updatePlayerCount(-1)} className="h-11 w-11 rounded-xl border border-white/10 bg-white/5 text-xl font-black text-white transition-all hover:bg-white/10">-</button>
                      <div className="flex-1 text-center">
                        <div className="text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Player Count</div>
                        <div className="mt-1 text-3xl font-black text-white">{playerNames.length}</div>
                      </div>
                      <button onClick={() => updatePlayerCount(1)} className="h-11 w-11 rounded-xl border border-white/10 bg-white/5 text-xl font-black text-white transition-all hover:bg-white/10">+</button>
                    </div>
                  )}

                  <div className="space-y-3">
                    {(isQuickPreset ? playerNames.slice(0, 2) : playerNames).map((name, index) => (
                      <PlayerNameField
                        key={index}
                        label={`Player ${index + 1}`}
                        value={name}
                        placeholder={`Player ${index + 1}`}
                        existingPlayers={existingPlayers}
                        onChange={(value) => updatePlayerName(index, value)}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">Team 1</div>
                    <div className="space-y-3">
                      <PlayerNameField
                        label="Player 1"
                        value={team1Names[0]}
                        placeholder="Player 1"
                        existingPlayers={existingPlayers}
                        onChange={(value) => updateTeamName(1, 0, value)}
                        compact
                      />
                      <PlayerNameField
                        label="Player 2"
                        value={team1Names[1]}
                        placeholder="Player 2"
                        existingPlayers={existingPlayers}
                        onChange={(value) => updateTeamName(1, 1, value)}
                        compact
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-orange-300">Team 2</div>
                    <div className="space-y-3">
                      <PlayerNameField
                        label="Player 3"
                        value={team2Names[0]}
                        placeholder="Player 3"
                        existingPlayers={existingPlayers}
                        onChange={(value) => updateTeamName(2, 0, value)}
                        compact
                      />
                      <PlayerNameField
                        label="Player 4"
                        value={team2Names[1]}
                        placeholder="Player 4"
                        existingPlayers={existingPlayers}
                        onChange={(value) => updateTeamName(2, 1, value)}
                        compact
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>

            {gameType === 'X01' && (
              <section className={sectionClass}>
                <label className={labelClass}>Match Format</label>

                <div className="mb-5 inline-flex rounded-2xl border border-white/10 bg-black/20 p-1">
                  <button onClick={() => setMatchMode('LEGS')} className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all ${matchMode === 'LEGS' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>
                    Legs
                  </button>
                  <button onClick={() => setMatchMode('SETS')} className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all ${matchMode === 'SETS' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>
                    Sets
                  </button>
                </div>

                <div className="space-y-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  {matchMode === 'LEGS' ? (
                    <div>
                      <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Legs to Win Match</div>
                      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                        {[1, 3, 5, 7, 9].map((num) => (
                          <button key={num} onClick={() => setLegsToWin(num)} className={`rounded-xl border py-2 text-sm font-black ${legsToWin === num ? activeOptionClass : inactiveOptionClass}`}>
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Sets to Win Match</div>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {[1, 3, 5, 7].map((num) => (
                            <button key={num} onClick={() => setSetsToWin(num)} className={`rounded-xl border py-2 text-sm font-black ${setsToWin === num ? activeOptionClass : inactiveOptionClass}`}>
                              {num}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Legs to Win a Set</div>
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
                <label className={labelClass}>Rules</label>
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Check In</div>
                    <div className="flex flex-wrap gap-2">
                      {(['Open', 'Double', 'Master'] as const).map((rule) => (
                        <button key={rule} onClick={() => setCheckIn(rule)} className={`rounded-xl border px-4 py-2 text-xs font-black uppercase tracking-[0.18em] ${checkIn === rule ? activeOptionClass : inactiveOptionClass}`}>
                          {rule}
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-sm text-gray-400">{getRuleDescription('in', checkIn)}</p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Check Out</div>
                    <div className="flex flex-wrap gap-2">
                      {(['Open', 'Double', 'Master'] as const).map((rule) => (
                        <button key={rule} onClick={() => setCheckOut(rule)} className={`rounded-xl border px-4 py-2 text-xs font-black uppercase tracking-[0.18em] ${checkOut === rule ? activeOptionClass : inactiveOptionClass}`}>
                          {rule}
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-sm text-gray-400">{getRuleDescription('out', checkOut)}</p>
                  </div>
                </div>
              </section>
            )}

            {gameType === 'RANDOMIZER' && (
              <section className={sectionClass}>
                <label className={labelClass}>Challenge Settings</label>

                <div className="mb-5 inline-flex rounded-2xl border border-white/10 bg-black/20 p-1">
                  <button onClick={() => setRandomizerEndCondition('POINTS')} className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all ${randomizerEndCondition === 'POINTS' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>
                    Points
                  </button>
                  <button onClick={() => setRandomizerEndCondition('MINUTES')} className={`rounded-xl px-4 py-2 text-xs font-black uppercase tracking-[0.18em] transition-all ${randomizerEndCondition === 'MINUTES' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>
                    Time
                  </button>
                </div>

                {randomizerEndCondition === 'POINTS' ? (
                  <div>
                    <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Target Points</div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {[10, 20, 30, 50].map((num) => (
                        <button key={num} onClick={() => setRandomizerTargetPoints(num)} className={`rounded-xl border py-2 text-sm font-black ${randomizerTargetPoints === num ? activeOptionClass : inactiveOptionClass}`}>
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Target Minutes</div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {[10, 15, 20, 30].map((num) => (
                        <button key={num} onClick={() => setRandomizerTargetMinutes(num)} className={`rounded-xl border py-2 text-sm font-black ${randomizerTargetMinutes === num ? activeOptionClass : inactiveOptionClass}`}>
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div
                  onClick={() => setRandomizerEasyMode(!randomizerEasyMode)}
                  className={`mt-5 rounded-2xl border p-4 transition-all duration-300 ${
                    randomizerEasyMode
                      ? 'border-green-500/40 bg-green-500/10 shadow-[0_0_20px_rgba(34,197,94,0.12)]'
                      : 'border-white/10 bg-black/20 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${randomizerEasyMode ? 'bg-green-500 text-black' : 'bg-white/10 text-gray-300'}`}>
                        <Shield className="h-5 w-5" />
                      </div>
                      <div>
                        <div className={`font-black ${randomizerEasyMode ? 'text-green-300' : 'text-white'}`}>Easy Mode</div>
                        <div className="text-sm text-gray-400">Points are never reduced if you miss a checkout.</div>
                      </div>
                    </div>

                    <div className={`h-6 w-12 rounded-full p-1 transition-colors ${randomizerEasyMode ? 'bg-green-500' : 'bg-gray-700'}`}>
                      <div className={`h-4 w-4 rounded-full bg-white transition-transform ${randomizerEasyMode ? 'translate-x-6' : 'translate-x-0'}`} />
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <section className={sectionClass}>
              <label className={labelClass}>Match Summary</label>
              <div className="space-y-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Configuration</div>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-center justify-between">
                      <span>Mode</span>
                      <span className="font-black text-white">{getTitle()}</span>
                    </div>
                    {(gameType === 'X01' || isQuickPreset) && (
                      <>
                        <div className="flex items-center justify-between">
                          <span>Start Score</span>
                          <span className="font-black text-white">{startingScore}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Format</span>
                          <span className="font-black text-white">{isQuickPreset ? 'Best of 5' : matchMode}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Check In / Out</span>
                          <span className="font-black text-white">{checkIn} / {checkOut}</span>
                        </div>
                        {isQuickPreset && (
                          <div className="flex items-center justify-between">
                            <span>Players</span>
                            <span className="font-black text-white">1 vs 1</span>
                          </div>
                        )}
                      </>
                    )}
                    {gameType === 'RANDOMIZER' && (
                      <div className="flex items-center justify-between">
                        <span>End Condition</span>
                        <span className="font-black text-white">{randomizerEndCondition}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-gray-500">Ready Check</div>
                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <WandSparkles className="h-4 w-4 text-orange-300" />
                      Review player names before launch
                    </div>
                    {!isQuickPreset && (
                      <div className="flex items-center gap-2">
                        <WandSparkles className="h-4 w-4 text-orange-300" />
                        Confirm the format and rules
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <WandSparkles className="h-4 w-4 text-orange-300" />
                      Start when the board and players are ready
                    </div>
                  </div>
                </div>

                <Button onClick={handleStart} className="h-16 w-full rounded-2xl text-xl shadow-[0_18px_40px_rgba(234,88,12,0.28)]">
                  Game On
                </Button>
              </div>
            </section>
          </aside>
        </div>
      </div>
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
      ? existingPlayers.slice(0, 6)
      : existingPlayers
          .filter((player) => player.username.toLowerCase().includes(normalizedValue))
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
            Search existing player or type a new name
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
                      Existing player
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
            No existing player found. This name will be used as a manual entry.
          </div>
        )}
      </div>
    </div>
  );
};
