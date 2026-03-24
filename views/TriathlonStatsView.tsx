import React from 'react';
import { Player } from '../types';
import { Button } from '../components/ui/Button';

interface TriathlonStatsViewProps {
    players: Player[];
    globalScores: Record<string, number>;
    results: any;
    onHome: () => void;
    onRematch: () => void;
}

export const TriathlonStatsView: React.FC<TriathlonStatsViewProps> = ({ players, globalScores, results, onHome, onRematch }) => {
    const sortedPlayers = [...players].sort((a, b) => globalScores[b.id] - globalScores[a.id]);
    const winner = sortedPlayers[0];

    const getX01Points = (pId: string) => results.x01?.legsWon[pId] || 0;
    const getCricketPoints = (pId: string) => results.cricketWinnerId === pId ? 2 : 0;
    const getCapitalPoints = (pId: string) => results.capitalWinners?.includes(pId) ? 3 : 0;

    return (
        <div className="flex min-h-screen flex-col items-center bg-gradient-to-br from-gray-900 to-black p-4 text-white sm:p-6">
            <h1 className="mt-6 mb-2 text-center text-3xl font-black italic uppercase tracking-[0.12em] text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 sm:mt-8 sm:text-4xl sm:tracking-widest">
                Triathlon Terminé
            </h1>
            <p className="mb-8 text-center text-gray-400 sm:mb-12">Le champion ultime a été couronné</p>

            {/* Podium */}
            <div className="mb-12 flex h-auto w-full max-w-3xl items-end justify-center gap-2 overflow-x-auto pb-2 sm:mb-16 sm:gap-4 sm:overflow-visible">
                {sortedPlayers[1] && (
                    <div className="flex min-w-[92px] flex-col items-center animate-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both sm:min-w-0">
                        <span className="mb-2 text-center text-sm font-bold text-gray-300 sm:text-lg">{sortedPlayers[1].name}</span>
                        <div className="flex h-20 w-20 items-center justify-center rounded-t-lg bg-gradient-to-t from-gray-600 to-gray-400 shadow-[0_0_20px_rgba(156,163,175,0.3)] sm:h-24 sm:w-24">
                            <span className="text-3xl font-black text-gray-800 sm:text-4xl">2</span>
                        </div>
                        <span className="mt-3 text-lg font-black text-gray-400 sm:text-xl">{Math.floor(globalScores[sortedPlayers[1].id])} pts</span>
                    </div>
                )}
                
                <div className="z-10 flex min-w-[106px] flex-col items-center animate-in slide-in-from-bottom-12 duration-700 delay-500 fill-mode-both sm:min-w-0">
                    <span className="mb-2 text-3xl sm:text-4xl">👑</span>
                    <span className="mb-2 text-center text-lg font-black text-yellow-400 sm:text-xl">{winner.name}</span>
                    <div className="flex h-28 w-24 items-center justify-center rounded-t-lg bg-gradient-to-t from-yellow-600 to-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.4)] sm:h-32 sm:w-28">
                        <span className="text-4xl font-black text-yellow-900 sm:text-5xl">1</span>
                    </div>
                    <span className="mt-3 text-xl font-black text-yellow-500 sm:text-2xl">{Math.floor(globalScores[winner.id])} pts</span>
                </div>

                {sortedPlayers[2] && (
                    <div className="flex min-w-[92px] flex-col items-center animate-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both sm:min-w-0">
                        <span className="mb-2 text-center text-sm font-bold text-amber-700 sm:text-lg">{sortedPlayers[2].name}</span>
                        <div className="flex h-14 w-20 items-center justify-center rounded-t-lg bg-gradient-to-t from-amber-900 to-amber-700 shadow-[0_0_20px_rgba(180,83,9,0.3)] sm:h-16 sm:w-24">
                            <span className="text-3xl font-black text-amber-950 sm:text-4xl">3</span>
                        </div>
                        <span className="mt-3 text-lg font-black text-amber-700 sm:text-xl">{Math.floor(globalScores[sortedPlayers[2].id])} pts</span>
                    </div>
                )}
            </div>

            {/* Points Breakdown */}
            <div className="mb-10 w-full max-w-2xl overflow-x-auto rounded-2xl border border-gray-800 bg-gray-900/80 backdrop-blur-sm sm:mb-12">
                <table className="w-full min-w-[640px] text-left">
                    <thead className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
                        <tr>
                            <th className="p-4 font-bold">Joueur</th>
                            <th className="p-4 font-bold text-center">501 (BO3)</th>
                            <th className="p-4 font-bold text-center">Cricket</th>
                            <th className="p-4 font-bold text-center">Capital</th>
                            <th className="p-4 font-black text-right text-orange-500">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                        {sortedPlayers.map(p => (
                            <tr key={p.id} className="hover:bg-gray-800/30 transition-colors">
                                <td className="p-4 font-bold">{p.name} {p.id === winner.id && '👑'}</td>
                                <td className="p-4 text-center text-gray-300">+{getX01Points(p.id)}</td>
                                <td className="p-4 text-center text-gray-300">+{getCricketPoints(p.id)}</td>
                                <td className="p-4 text-center text-gray-300">+{getCapitalPoints(p.id)}</td>
                                <td className="p-4 text-right font-black text-xl text-orange-500">{Math.floor(globalScores[p.id])}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-auto grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                <Button variant="secondary" onClick={onHome} className="flex-1 py-4">Menu Principal</Button>
                <Button onClick={onRematch} className="flex-1 border-none bg-gradient-to-r from-orange-600 to-red-600 py-4">Revanche</Button>
            </div>
        </div>
    );
};
