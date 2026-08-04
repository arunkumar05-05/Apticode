import React, { useState, useEffect } from 'react';
import { Trophy, User, Zap, RefreshCw } from 'lucide-react';
import { getApiBaseUrl } from '../config/api';
import { LiquidBackdrop } from './ui/LiquidBackdrop';
import Scene3D from './three/LazyScene3D';

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
        const response = await fetch(`${getApiBaseUrl()}/api/leaderboard`, {
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
      <div className="flex h-[400px] flex-col items-center justify-center space-y-3 font-mono text-xs text-lc-text-muted">
        <RefreshCw className="h-6 w-6 animate-spin text-lc-violet" />
        <span>Loading batch standings...</span>
      </div>
    );
  }

  // Podiums require at least 3 users. We fall back to first three elements.
  const top1 = standings[0] || { name: 'N/A', level: 'Beginner', weeklyScore: 0 };
  const top2 = standings[1] || { name: 'N/A', level: 'Beginner', weeklyScore: 0 };
  const top3 = standings[2] || { name: 'N/A', level: 'Beginner', weeklyScore: 0 };

  return (
    <div className="relative overflow-hidden space-y-8 pb-12 max-w-4xl mx-auto text-left">
      <LiquidBackdrop />

      {/* Podium scene band */}
      <div className="relative overflow-hidden pointer-events-none">
        <div className="lc-glass h-44 sm:h-52 lg:h-60 overflow-hidden">
          <Scene3D variant="podium" className="absolute inset-0" />
        </div>
      </div>

      {/* Top 3 Podiums */}
      <div className="grid grid-cols-3 gap-2.5 md:gap-6 items-end pt-8 pb-4">
        {/* Rank 2 */}
        <div className="lc-glass p-3 md:p-6 flex flex-col items-center justify-center space-y-2 relative h-[160px] md:h-[180px] order-1">
          <div className="absolute -top-5 w-9 h-9 md:w-12 md:h-12 rounded-full bg-lc-glass-raised border border-lc-glass-border flex items-center justify-center text-xs md:text-lg font-bold text-lc-text">
            2
          </div>
          <p className="text-[10px] md:text-xs font-bold text-lc-text text-center truncate w-full">{top2.name}</p>
          <p className="text-[8px] md:text-[10px] text-lc-violet font-semibold truncate w-full text-center">{top2.level}</p>
          <p className="text-[10px] md:text-sm font-black text-lc-text">{top2.weeklyScore} pts</p>
        </div>

        {/* Rank 1 */}
        <div className="lc-glass p-3 md:p-6 flex flex-col items-center justify-center space-y-2 border-lc-amber/25 relative h-[190px] md:h-[210px] order-2 bg-gradient-to-t from-lc-void/60 via-lc-amber/5 to-lc-void/60 shadow-xl shadow-lc-amber/10">
          <div className="absolute -top-7 w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-lc-amber/30 text-base md:text-2xl font-black text-lc-void">
            <Trophy className="w-5 h-5 md:w-6 md:h-6 text-lc-void fill-lc-void" />
          </div>
          <p className="text-xs md:text-sm font-extrabold text-lc-text text-center truncate w-full pt-3">{top1.name}</p>
          <p className="text-[9px] md:text-xs text-lc-amber font-semibold truncate w-full text-center">{top1.level}</p>
          <p className="text-xs md:text-base font-black text-lc-amber">{top1.weeklyScore} pts</p>
        </div>

        {/* Rank 3 */}
        <div className="lc-glass p-3 md:p-6 flex flex-col items-center justify-center space-y-2 relative h-[145px] md:h-[160px] order-3">
          <div className="absolute -top-5 w-8 h-8 md:w-10 md:h-10 rounded-full bg-lc-glass-raised border border-lc-glass-border flex items-center justify-center text-[10px] md:text-sm font-bold text-lc-text-muted">
            3
          </div>
          <p className="text-[10px] md:text-xs font-bold text-lc-text text-center truncate w-full">{top3.name}</p>
          <p className="text-[8px] md:text-[10px] text-lc-cyan font-semibold truncate w-full text-center">{top3.level}</p>
          <p className="text-[10px] md:text-xs font-black text-lc-text-muted">{top3.weeklyScore} pts</p>
        </div>
      </div>

      {/* Leaderboard Table list */}
      <div className="lc-glass overflow-hidden">
        <div className="flex justify-between items-center px-4.5 py-3.5 bg-lc-glass-raised border-b border-lc-glass-border text-[10px] font-bold text-lc-text-muted">
          <span>Batch Standings</span>
          <span className="flex items-center space-x-1 font-mono text-lc-cyan">
            <span>Live Sync</span>
          </span>
        </div>

        <div className="divide-y divide-lc-glass-border">
          {standings.map((student) => (
            <div 
              key={student.rank} 
              className={`flex items-center justify-between p-3.5 px-4.5 text-xs transition-colors hover:bg-lc-glass-raised ${
                student.name.includes('(You)') ? 'bg-lc-violet/10' : ''
              }`}
            >
              {/* Rank and User */}
              <div className="flex items-center space-x-3 min-w-0">
                <span className={`w-5 text-center font-mono font-bold ${
                  student.rank === 1 ? 'text-lc-amber' : student.rank === 2 ? 'text-lc-text' : 'text-lc-text-muted'
                }`}>
                  #{student.rank}
                </span>
                <div className="w-7 h-7 rounded-lg bg-lc-void/40 border border-lc-glass-border flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-lc-text-muted" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-lc-text truncate">{student.name}</p>
                  <p className="text-[9px] text-lc-text-muted truncate">{student.college}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-4 md:space-x-8 shrink-0">
                {/* Level Tag */}
                <div className="hidden md:block">
                  <span className="text-[10px] font-bold text-lc-text-muted bg-lc-void/40 px-2.5 py-0.5 rounded border border-lc-glass-border">
                    {student.level}
                  </span>
                </div>

                {/* Streak */}
                <div className="flex items-center space-x-1 font-mono font-semibold text-lc-amber">
                  <Zap className="w-3.5 h-3.5 fill-lc-amber" />
                  <span>{student.streak}d</span>
                </div>

                {/* Score */}
                <div className="text-right w-14">
                  <p className="font-black text-lc-text">{student.weeklyScore}</p>
                  <p className="text-[8px] text-lc-text-muted font-mono">total: {student.totalScore}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
