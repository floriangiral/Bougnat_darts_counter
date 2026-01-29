import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { fetchUserMatches } from '../lib/supabase';
import { MatchState } from '../types';

interface HistoryViewProps {
  user: any;
  onBack: () => void;
}

interface MatchRecord {
    id: string;
    created_at: string;
    game_type: string;
    winner_id: string;
    game_data: MatchState;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ user, onBack }) => {
  const [matches, setMatches] = useState<MatchRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
        if(user?.id) {
            const data = await fetchUserMatches(user.id);
            setMatches(data as MatchRecord[]);
        }
        setIsLoading(false);
    };
    loadData();
  }, [user]);

  const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString(undefined, {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
  };

  // Helper to determine if the current user (Owner of account) won the match
  // Assumption: User is always Player 1 in the persisted history context for now, 
  // or we check team membership. Simpler: Check if winnerId matches p1 teamId.
  const getResultBadge = (match: MatchRecord) => {
      const data = match.game_data;
      // In solo games, user is likely P1. In doubles, team 1.
      const userTeamId = data.players[0].teamId; 
      const isWin = match.winner_id === userTeamId;

      if (isWin) {
          return <span className="bg-green-500/20 text-green-500 border border-green-500/50 px-2 py-1 rounded text-[10px] font-black uppercase">WIN</span>;
      } else {
          return <span className="bg-red-500/20 text-red-500 border border-red-500/50 px-2 py-1 rounded text-[10px] font-black uppercase">LOSS</span>;
      }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white p-6 flex flex-col">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={onBack} size="sm">← Back</Button>
        <h2 className="text-2xl font-black italic ml-4 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600 uppercase">
            MATCH HISTORY
        </h2>
      </div>

      <div className="flex-1 w-full max-w-2xl mx-auto">
          {isLoading ? (
              <div className="flex justify-center pt-20">
                  <div className="w-8 h-8 border-4 border-gray-700 border-t-green-500 rounded-full animate-spin"></div>
              </div>
          ) : matches.length === 0 ? (
              <div className="text-center pt-20 text-gray-500">
                  <p className="text-6xl mb-4">📜</p>
                  <h3 className="text-xl font-bold uppercase">No matches found</h3>
                  <p className="text-sm mt-2">Play a game to see it here!</p>
              </div>
          ) : (
              <div className="space-y-4 pb-8">
                  {matches.map((m) => {
                      const p1Name = m.game_data.players[0].name;
                      const p2Name = m.game_data.players.length > 1 ? m.game_data.players[1].name : 'CPU';
                      // Score display logic
                      const t1Score = m.game_data.config.matchMode === 'SETS' 
                        ? m.game_data.setsWon[m.game_data.players[0].teamId] 
                        : m.game_data.legsWon[m.game_data.players[0].teamId];
                      
                      const t2Score = m.game_data.config.matchMode === 'SETS' 
                        ? m.game_data.setsWon[m.game_data.players[1]?.teamId] 
                        : m.game_data.legsWon[m.game_data.players[1]?.teamId];

                      return (
                        <div key={m.id} className="bg-gray-800/40 border border-gray-700 p-4 rounded-xl flex flex-col gap-2 hover:bg-gray-800 transition-colors">
                            <div className="flex justify-between items-start">
                                <div className="text-[10px] text-gray-500 font-mono uppercase font-bold">
                                    {formatDate(m.created_at)} • {m.game_data.config.matchMode}
                                </div>
                                {getResultBadge(m)}
                            </div>
                            
                            <div className="flex justify-between items-center mt-1">
                                <div className="flex flex-col">
                                    <span className="text-lg font-black text-white">{p1Name}</span>
                                    <span className="text-xs text-gray-500 font-bold">vs {p2Name}</span>
                                </div>
                                <div className="text-3xl font-mono font-black text-white tracking-tighter">
                                    {t1Score} - {t2Score}
                                </div>
                            </div>

                            <div className="mt-2 pt-2 border-t border-gray-700/50 flex justify-between text-[10px] text-gray-400 font-mono">
                                <span>Format: {m.game_data.config.startingScore} {m.game_data.config.checkOut} Out</span>
                                <span>Winner: {m.game_data.matchWinnerId ? (m.game_data.matchWinnerId === m.game_data.players[0].teamId ? p1Name : p2Name) : 'Draw'}</span>
                            </div>
                        </div>
                      );
                  })}
              </div>
          )}
      </div>
    </div>
  );
};