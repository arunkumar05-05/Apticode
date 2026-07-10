import React from 'react';
import { Award, Star, Zap, User, Trophy, ShieldAlert, Sparkles, ChevronDown } from 'lucide-react';

interface LeaderboardItem {
  rank: number;
  name: string;
  weeklyScore: number;
  totalScore: number;
  streak: number;
  level: string;
  college: string;
}

const leaderboardMock: LeaderboardItem[] = [
  { rank: 1, name: 'Siddharth Sen', weeklyScore: 480, totalScore: 28400, streak: 24, level: 'Placement Ready', college: 'IIT Delhi' },
  { rank: 2, name: 'Rahul Sharma (You)', weeklyScore: 420, totalScore: 24500, streak: 12, level: 'Master', college: 'IIT Delhi' },
  { rank: 3, name: 'Ananya Goel', weeklyScore: 390, totalScore: 22100, streak: 8, level: 'Master', college: 'IIT Delhi' },
  { rank: 4, name: 'Vikram Malhotra', weeklyScore: 310, totalScore: 19800, streak: 5, level: 'Expert', college: 'IIT Delhi' },
  { rank: 5, name: 'Sneha Patel', weeklyScore: 280, totalScore: 16500, streak: 15, level: 'Expert', college: 'IIT Delhi' }
];

export default function LeaderboardView() {
  return (
    <div className="space-y-6 pb-12 max-w-4xl mx-auto">
      {/* Top 3 Podiums */}
      <div className="grid grid-cols-3 gap-3 md:gap-6 items-end pt-8 pb-4">
        {/* Rank 2 */}
        <div className="glass-panel p-3 md:p-6 flex flex-col items-center justify-center space-y-3 border-white/5 relative h-[180px] order-1">
          <div className="absolute -top-6 w-10 h-10 md:w-12 md:h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sm md:text-lg font-bold text-slate-300">
            2
          </div>
          <p className="text-[10px] md:text-xs font-bold text-slate-200 text-center truncate w-full">{leaderboardMock[1].name}</p>
          <p className="text-[8px] md:text-[10px] text-brand-purple font-semibold">{leaderboardMock[1].level}</p>
          <p className="text-xs md:text-sm font-black text-slate-300">{leaderboardMock[1].weeklyScore} pts</p>
        </div>

        {/* Rank 1 */}
        <div className="glass-panel p-3 md:p-6 flex flex-col items-center justify-center space-y-3 border-amber-500/25 relative h-[210px] order-2 bg-gradient-to-t from-slate-900/60 via-amber-950/5 to-slate-900/60 shadow-xl shadow-amber-500/5">
          <div className="absolute -top-8 w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-xl md:text-2xl font-black text-slate-950">
            <Trophy className="w-5 h-5 md:w-6 md:h-6 text-slate-950 fill-slate-950" />
          </div>
          <p className="text-xs md:text-sm font-extrabold text-slate-100 text-center truncate w-full pt-4">{leaderboardMock[0].name}</p>
          <p className="text-[9px] md:text-xs text-amber-400 font-semibold">{leaderboardMock[0].level}</p>
          <p className="text-sm md:text-base font-black text-amber-300">{leaderboardMock[0].weeklyScore} pts</p>
        </div>

        {/* Rank 3 */}
        <div className="glass-panel p-3 md:p-6 flex flex-col items-center justify-center space-y-3 border-white/5 relative h-[160px] order-3">
          <div className="absolute -top-6 w-9 h-9 md:w-10 md:h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs md:text-sm font-bold text-slate-400">
            3
          </div>
          <p className="text-[10px] md:text-xs font-bold text-slate-200 text-center truncate w-full">{leaderboardMock[2].name}</p>
          <p className="text-[8px] md:text-[10px] text-brand-cyan font-semibold">{leaderboardMock[2].level}</p>
          <p className="text-[10px] md:text-xs font-black text-slate-400">{leaderboardMock[2].weeklyScore} pts</p>
        </div>
      </div>

      {/* Leaderboard Table list */}
      <div className="glass-panel overflow-hidden">
        <div className="flex justify-between items-center px-6 py-4 bg-slate-950/40 border-b border-white/5 text-xs font-semibold text-slate-400">
          <span>IIT Delhi Batch Standings</span>
          <span className="flex items-center space-x-1 font-mono text-brand-cyan">
            <span>Weekly Reset in 3 days</span>
          </span>
        </div>

        <div className="divide-y divide-white/5">
          {leaderboardMock.map((student) => (
            <div 
              key={student.rank} 
              className={`flex items-center justify-between p-4 px-6 text-xs transition-colors hover:bg-slate-900/20 ${
                student.name.includes('(You)') ? 'bg-brand-purple/5' : ''
              }`}
            >
              {/* Rank and User */}
              <div className="flex items-center space-x-4">
                <span className={`w-6 text-center font-mono font-bold ${
                  student.rank === 1 ? 'text-amber-400' : student.rank === 2 ? 'text-slate-300' : 'text-slate-500'
                }`}>
                  #{student.rank}
                </span>
                <div className="w-8 h-8 rounded-lg bg-slate-900 border border-white/5 flex items-center justify-center">
                  <User className="w-4.5 h-4.5 text-slate-400" />
                </div>
                <div>
                  <p className="font-bold text-slate-200">{student.name}</p>
                  <p className="text-[10px] text-slate-500">{student.college}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-8">
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
                <div className="text-right w-16">
                  <p className="font-black text-slate-200">{student.weeklyScore}</p>
                  <p className="text-[9px] text-slate-500 font-mono">total: {student.totalScore}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
