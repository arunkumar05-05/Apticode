import React, { useState, useEffect } from 'react';
import { Award, Trophy, User, Zap, RefreshCw } from 'lucide-react';

interface LeaderboardItem {
  rank: number;
  userId: string;
  name: string;
  weeklyScore: number;
  totalScore: number;
  streak: number;
  level: string;
  college: string;
}

export default function LeaderboardView() {
  const [standings, setStandings] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const saved = localStorage.getItem('apticode-user-session');
        const token = saved ? JSON.parse(saved).token : '';
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/leaderboard`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const resJson = await response.json();
        if (resJson.status === 'success') {
          setStandings(resJson.standings || []);
        }
      } catch (err) {
        console.error('[Leaderboard View] Failed to load standings:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center space-y-3 font-mono text-xs text-slate-500">
        <RefreshCw className="h-6 w-6 animate-spin text-brand-purple" />
        <span>Loading batch standings...</span>
      </div>
    );
  }

  // Podiums require at least 3 users. We fall back to first three elements.
  const top1 = standings[0] || { name: 'N/A', level: 'Beginner', weeklyScore: 0 };
  const top2 = standings[1] || { name: 'N/A', level: 'Beginner', weeklyScore: 0 };
  const top3 = standings[2] || { name: 'N/A', level: 'Beginner', weeklyScore: 0 };

  return (
    <div className="space-y-6 pb-20 md:pb-12 max-w-4xl mx-auto text-left">
      {/* Top 3 Podiums */}
      <div className="grid grid-cols-3 gap-2.5 md:gap-6 items-end pt-8 pb-4">
        {/* Rank 2 */}
        <div className="glass-panel p-3 md:p-6 flex flex-col items-center justify-center space-y-2 border-white/5 relative h-[160px] md:h-[180px] order-1">
          <div className="absolute -top-5 w-9 h-9 md:w-12 md:h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs md:text-lg font-bold text-slate-300">
            2
          </div>
          <p className="text-[10px] md:text-xs font-bold text-slate-200 text-center truncate w-full">{top2.name}</p>
          <p className="text-[8px] md:text-[10px] text-brand-purple font-semibold truncate w-full text-center">{top2.level}</p>
          <p className="text-[10px] md:text-sm font-black text-slate-300">{top2.weeklyScore} pts</p>
        </div>

        {/* Rank 1 */}
        <div className="glass-panel p-3 md:p-6 flex flex-col items-center justify-center space-y-2 border-amber-500/25 relative h-[190px] md:h-[210px] order-2 bg-gradient-to-t from-slate-900/60 via-amber-950/5 to-slate-900/60 shadow-xl shadow-amber-500/5">
          <div className="absolute -top-7 w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-base md:text-2xl font-black text-slate-950">
            <Trophy className="w-5 h-5 md:w-6 md:h-6 text-slate-950 fill-slate-950" />
          </div>
          <p className="text-xs md:text-sm font-extrabold text-slate-100 text-center truncate w-full pt-3">{top1.name}</p>
          <p className="text-[9px] md:text-xs text-amber-400 font-semibold truncate w-full text-center">{top1.level}</p>
          <p className="text-xs md:text-base font-black text-amber-300">{top1.weeklyScore} pts</p>
        </div>

        {/* Rank 3 */}
        <div className="glass-panel p-3 md:p-6 flex flex-col items-center justify-center space-y-2 border-white/5 relative h-[145px] md:h-[160px] order-3">
          <div className="absolute -top-5 w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] md:text-sm font-bold text-slate-400">
            3
          </div>
          <p className="text-[10px] md:text-xs font-bold text-slate-200 text-center truncate w-full">{top3.name}</p>
          <p className="text-[8px] md:text-[10px] text-brand-cyan font-semibold truncate w-full text-center">{top3.level}</p>
          <p className="text-[10px] md:text-xs font-black text-slate-400">{top3.weeklyScore} pts</p>
        </div>
      </div>

      {/* Leaderboard Table list */}
      <div className="glass-panel overflow-hidden">
        <div className="flex justify-between items-center px-4.5 py-3.5 bg-slate-950/40 border-b border-white/5 text-[10px] font-bold text-slate-400">
          <span>Batch Standings</span>
          <span className="flex items-center space-x-1 font-mono text-brand-cyan">
            <span>Live Sync</span>
          </span>
        </div>

        <div className="divide-y divide-white/5">
          {standings.map((student) => (
            <div 
              key={student.rank} 
              className={`flex items-center justify-between p-3.5 px-4.5 text-xs transition-colors hover:bg-slate-900/20 ${
                student.name.includes('(You)') ? 'bg-brand-purple/5' : ''
              }`}
            >
              {/* Rank and User */}
              <div className="flex items-center space-x-3 min-w-0">
                <span className={`w-5 text-center font-mono font-bold ${
                  student.rank === 1 ? 'text-amber-400' : student.rank === 2 ? 'text-slate-300' : 'text-slate-500'
                }`}>
                  #{student.rank}
                </span>
                <div className="w-7 h-7 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-slate-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-200 truncate">{student.name}</p>
                  <p className="text-[9px] text-slate-500 truncate">{student.college}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-4 md:space-x-8 shrink-0">
                {/* Level Tag */}
                <div className="hidden md:block">
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-950 px-2.5 py-0.5 rounded border border-white/5">
                    {student.level}
                  </span>
                </div>

                {/* Streak */}
                <div className="flex items-center space-x-1 font-mono font-semibold text-orange-500">
                  <Zap className="w-3.5 h-3.5 fill-orange-500" />
                  <span>{student.streak}d</span>
                </div>

                {/* Score */}
                <div className="text-right w-14">
                  <p className="font-black text-slate-200">{student.weeklyScore}</p>
                  <p className="text-[8px] text-slate-500 font-mono">total: {student.totalScore}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
