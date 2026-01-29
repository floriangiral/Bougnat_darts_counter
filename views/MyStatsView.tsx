import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { fetchUserMatches } from '../lib/supabase';
import { MatchState } from '../types';
import { calculateDetailedStats } from '../utils/gameLogic';

interface MyStatsViewProps {
  user: any;
  onBack: () => void;
}

interface AggregatedStats {
    totalMatches: number;
    wins: number;
    losses: number;
    globalAvg: string;
    highestCheckout: number;
    bestLeg: number | null;
    total180s: number;
    total140s: number;
    total100s: number;
}

export const MyStatsView: React.FC<MyStatsViewProps> = ({ user, onBack }) => {
  const [stats, setStats] = useState<AggregatedStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const processStats = async () => {
        if (!user?.id) return;
        
        const matches = await fetchUserMatches(user.id);
        
        // Initialize aggregation
        let totalMatches = 0;
        let wins = 0;
        let losses = 0;
        let grandTotalScore = 0;
        let grandTotalDarts = 0;
        let maxCheckout = 0;
        let globalBestLeg: number | null = null;
        let count180 = 0;
        let count140 = 0;
        let count100 = 0;

        matches.forEach((record: any) => {
            const match = record.game_data as MatchState;
            totalMatches++;

            // Assume User is Player 1 (index 0)
            // In a real multi-user system, we'd search for the player.id matching user.id
            const p1 = match.players[0];
            
            // Win/Loss
            if (match.matchWinnerId === p1.teamId) wins++;
            else losses++;

            // Calculate specific stats for this match using the existing util
            // Warning: Player IDs might change between matches in local storage vs real DB
            // Here we assume match.players[0] is always the "user" for this MVP context.
            const detailed = calculateDetailedStats(match, p1.id);
            
            // Aggregate Scores
            const legHistories = [...match.completedLegs, match.currentLeg].flatMap(l => l.history);
            const userTurns = legHistories.filter(t => t.playerId === p1.id);
            
            userTurns.forEach(t => {
                if (!t.isBust) grandTotalScore += t.score;
                grandTotalDarts += t.dartsThrown;
            });

            // High Scores
            if (detailed.highestCheckout > maxCheckout) maxCheckout = detailed.highestCheckout;
            
            if (detailed.bestLegDarts !== null) {
                if (globalBestLeg === null || detailed.bestLegDarts < globalBestLeg) {
                    globalBestLeg = detailed.bestLegDarts;
                }
            }

            count180 += detailed.scoreCounts.c180;
            count140 += detailed.scoreCounts.c140;
            count100 += detailed.scoreCounts.c100 + detailed.scoreCounts.c120; // Grouping 100-139
        });

        const avg = grandTotalDarts > 0 ? ((grandTotalScore / grandTotalDarts) * 3).toFixed(1) : "0.0";

        setStats({
            totalMatches,
            wins,
            losses,
            globalAvg: avg,
            highestCheckout: maxCheckout,
            bestLeg: globalBestLeg,
            total180s: count180,
            total140s: count140,
            total100s: count100
        });

        setIsLoading(false);
    };

    processStats();
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6 flex flex-col">
      <div className="flex items-center mb-8">
        <Button variant="ghost" onClick={onBack} size="sm">← Back</Button>
        <h2 className="text-2xl font-black italic ml-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500 uppercase">
            MY STATISTICS
        </h2>
      </div>

      {isLoading ? (
          <div className="flex justify-center pt-20">
              <div className="w-8 h-8 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
      ) : !stats || stats.totalMatches === 0 ? (
          <div className="text-center pt-20 text-gray-500">
              <p className="text-6xl mb-4">📊</p>
              <h3 className="text-xl font-bold uppercase">No stats available</h3>
              <p className="text-sm mt-2">Finish a match to generate data.</p>
          </div>
      ) : (
          <div className="w-full max-w-4xl mx-auto space-y-6">
              
              {/* Top Row: The Big Numbers */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="Global Avg" value={stats.globalAvg} color="blue" big />
                  <StatCard label="Win Rate" value={`${stats.totalMatches > 0 ? Math.round((stats.wins / stats.totalMatches) * 100) : 0}%`} color="green" big />
                  <StatCard label="Matches" value={stats.totalMatches} color="gray" />
                  <StatCard label="Wins" value={stats.wins} color="green" />
              </div>

              {/* Bests */}
              <div className="grid grid-cols-2 gap-4">
                   <div className="bg-gray-800/40 border border-gray-700 p-6 rounded-2xl flex flex-col items-center justify-center">
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Highest Checkout</span>
                        <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">{stats.highestCheckout}</span>
                   </div>
                   <div className="bg-gray-800/40 border border-gray-700 p-6 rounded-2xl flex flex-col items-center justify-center">
                        <span className="text-xs text-gray-500 font-bold uppercase tracking-widest mb-2">Best Leg (Darts)</span>
                        <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">{stats.bestLeg || '-'}</span>
                   </div>
              </div>

              {/* Scoring Counts */}
              <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-6">
                  <h3 className="text-sm font-black uppercase text-gray-500 mb-4 tracking-widest">Scoring Heatmap</h3>
                  <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                          <div className="text-3xl font-black text-red-500 mb-1">{stats.total180s}</div>
                          <div className="text-[10px] text-gray-600 font-bold">180s</div>
                      </div>
                      <div className="text-center">
                          <div className="text-3xl font-black text-orange-500 mb-1">{stats.total140s}</div>
                          <div className="text-[10px] text-gray-600 font-bold">140+</div>
                      </div>
                      <div className="text-center">
                          <div className="text-3xl font-black text-white mb-1">{stats.total100s}</div>
                          <div className="text-[10px] text-gray-600 font-bold">100+</div>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, color, big = false }: any) => {
    const colors: any = {
        blue: "text-blue-500",
        green: "text-green-500",
        gray: "text-white",
        red: "text-red-500"
    };

    return (
        <div className="bg-gray-800/40 border border-gray-700 p-4 rounded-xl flex flex-col items-center justify-center shadow-lg">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{label}</span>
            <span className={`font-mono font-black ${big ? 'text-4xl' : 'text-2xl'} ${colors[color]}`}>{value}</span>
        </div>
    );
}