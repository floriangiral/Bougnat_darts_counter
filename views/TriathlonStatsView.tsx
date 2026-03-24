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
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6 flex flex-col items-center">
            <h1 className="text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600 mb-2 uppercase tracking-widest text-center mt-8">
                Triathlon Terminé
            </h1>
            <p className="text-gray-400 mb-12 text-center">Le champion ultime a été couronné</p>

            {/* Podium */}
            <div className="flex items-end justify-center gap-4 mb-16 h-48">
                {sortedPlayers[1] && (
                    <div className="flex flex-col items-center animate-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
                        <span className="font-bold text-lg mb-2 text-gray-300">{sortedPlayers[1].name}</span>
                        <div className="w-24 h-24 bg-gradient-to-t from-gray-600 to-gray-400 rounded-t-lg flex items-center justify-center shadow-[0_0_20px_rgba(156,163,175,0.3)]">
                            <span className="text-4xl font-black text-gray-800">2</span>
                        </div>
                        <span className="mt-3 font-black text-xl text-gray-400">{Math.floor(globalScores[sortedPlayers[1].id])} pts</span>
                    </div>
                )}
                
                <div className="flex flex-col items-center z-10 animate-in slide-in-from-bottom-12 duration-700 delay-500 fill-mode-both">
                    <span className="text-4xl mb-2">👑</span>
                    <span className="font-black text-xl mb-2 text-yellow-400">{winner.name}</span>
                    <div className="w-28 h-32 bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-t-lg flex items-center justify-center shadow-[0_0_30px_rgba(250,204,21,0.4)]">
                        <span className="text-5xl font-black text-yellow-900">1</span>
                    </div>
                    <span className="mt-3 font-black text-2xl text-yellow-500">{Math.floor(globalScores[winner.id])} pts</span>
                </div>

                {sortedPlayers[2] && (
                    <div className="flex flex-col items-center animate-in slide-in-from-bottom-4 duration-700 delay-100 fill-mode-both">
                        <span className="font-bold text-lg mb-2 text-amber-700">{sortedPlayers[2].name}</span>
                        <div className="w-24 h-16 bg-gradient-to-t from-amber-900 to-amber-700 rounded-t-lg flex items-center justify-center shadow-[0_0_20px_rgba(180,83,9,0.3)]">
                            <span className="text-4xl font-black text-amber-950">3</span>
                        </div>
                        <span className="mt-3 font-black text-xl text-amber-700">{Math.floor(globalScores[sortedPlayers[2].id])} pts</span>
                    </div>
                )}
            </div>

            {/* Points Breakdown */}
            <div className="w-full max-w-2xl bg-gray-900/80 backdrop-blur-sm border border-gray-800 rounded-2xl overflow-hidden mb-12">
                <table className="w-full text-left">
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

            <div className="flex gap-4 w-full max-w-md mt-auto">
                <Button variant="secondary" onClick={onHome} className="flex-1 py-4">Menu Principal</Button>
                <Button onClick={onRematch} className="flex-1 py-4 bg-gradient-to-r from-orange-600 to-red-600 border-none">Revanche</Button>
            </div>
        </div>
    );
};
