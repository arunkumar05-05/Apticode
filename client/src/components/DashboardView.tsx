import React, { useState } from 'react';
import { Award, Zap, Play, CheckCircle, Code, MessageSquare, BookOpen, Star, AlertCircle, Compass, Sparkles } from 'lucide-react';
interface RewardItem {
  id: string;
  title: string;
  cost: number;
  description: string;
}

const rewardItems: RewardItem[] = [
  { id: '1', title: '1-on-1 Mock Interview Voucher', cost: 2500, description: 'Redeem for a live, personalized mock session with a veteran tech recruiter.' },
  { id: '2', title: 'ATS Premium Audit Token', cost: 1000, description: 'Triggers deep checks on resume formatting and matches.' },
  { id: '3', title: 'Pro Rank Custom Badge Frame', cost: 500, description: 'Glowing avatar borders in leaderboards.' }
];

interface DashboardViewProps {
  onNavigate: (view: string) => void;
  xp: number;
  level: string;
  spendXp: (amount: number) => boolean;
}

export default function DashboardView({ onNavigate, xp, level, spendXp }: DashboardViewProps) {
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const nextLevelXp = 30000; // set standard ceiling
  const progressPercent = Math.min((xp / nextLevelXp) * 100, 100);

  const handleBuyItem = (item: RewardItem) => {
    if (spendXp(item.cost)) {
      alert(`Success! Redeemed: ${item.title}. Spent ${item.cost} XP.`);
    } else {
      alert(`Insufficient XP! You need ${item.cost} XP to redeem this item.`);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950/20 to-cyan-950/20 border border-white/5 p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_60%_at_70%_0%,rgba(139,92,246,0.15),transparent)]" />
        <div className="relative space-y-2">
          <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-brand-purple/20 border border-brand-purple/30 text-xs font-semibold text-brand-purple">
            <Star className="w-3.5 h-3.5 fill-brand-purple" />
            <span>Premium Academic Account</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight">Welcome back, Rahul!</h2>
          <p className="text-slate-400 text-sm max-w-xl">
            You are in the top 8% of your batch at IIT Delhi. Keep practicing to maintain your Placement Ready state.
          </p>
        </div>

        {/* Level Indicator / Rewards Store */}
        <div className="flex flex-col space-y-2.5 min-w-[240px]">
          <div className="relative flex items-center space-x-4 bg-slate-950/40 p-4 rounded-xl border border-white/5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-cyan flex items-center justify-center shadow-lg shadow-brand-purple/20">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-slate-300">Level: {level}</span>
                <span className="text-brand-cyan">{xp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-brand-purple to-brand-cyan transition-all duration-500" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsStoreOpen(true)}
            className="w-full py-2.5 rounded-xl bg-slate-900 border border-brand-purple/30 text-[10px] font-bold text-slate-300 hover:text-white hover:bg-slate-850 flex items-center justify-center space-x-1.5 cursor-pointer transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-brand-purple fill-brand-purple/25 animate-pulse" />
            <span>Spend XP in Rewards Store</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="glass-panel p-6 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center">
            <Zap className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold">Daily Streak</p>
            <p className="text-2xl font-black text-slate-200">12 Days</p>
          </div>
        </div>

        <div className="glass-panel p-6 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-lg bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center">
            <Code className="w-5 h-5 text-brand-cyan" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold">Coding Accuracy</p>
            <p className="text-2xl font-black text-slate-200">76.4%</p>
          </div>
        </div>

        <div className="glass-panel p-6 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-lg bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-brand-purple" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold">Aptitude Score</p>
            <p className="text-2xl font-black text-slate-200">84/100</p>
          </div>
        </div>

        <div className="glass-panel p-6 flex items-center space-x-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold">Speech Rating</p>
            <p className="text-2xl font-black text-slate-200">8.2 / 10</p>
          </div>
        </div>
      </div>

      {/* Main Grid split */}
      <div className="grid md:grid-cols-3 gap-8">
        {/* Left 2 Cols: Challenges */}
        <div className="md:col-span-2 space-y-6">
          <h3 className="text-xl font-bold tracking-tight flex items-center space-x-2">
            <Compass className="w-5 h-5 text-brand-cyan" />
            <span>Daily Placement Missions</span>
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Coding Challenge */}
            <div className="glass-panel p-6 relative group overflow-hidden border border-brand-cyan/20">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-cyan/5 rounded-bl-full -z-10" />
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-bold text-brand-cyan uppercase tracking-wider bg-brand-cyan/10 px-2 py-0.5 rounded">
                  Coding Challenge
                </span>
                <span className="text-xs text-slate-400 font-mono">+30 XP</span>
              </div>
              <h4 className="text-lg font-bold mb-2 text-slate-200">Container With Most Water</h4>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                Find two lines that together with the x-axis forms a container, such that the container contains the most water.
              </p>
              <button 
                onClick={() => onNavigate('coding')}
                className="w-full py-2.5 rounded-lg bg-slate-900 border border-brand-cyan/30 text-xs font-semibold hover:bg-brand-cyan hover:text-slate-950 transition-all flex items-center justify-center space-x-1"
              >
                <span>Code Solution</span>
                <Play className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Aptitude Quiz Challenge */}
            <div className="glass-panel p-6 relative group overflow-hidden border border-brand-purple/20">
              <div className="absolute top-0 right-0 w-24 h-24 bg-brand-purple/5 rounded-bl-full -z-10" />
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-bold text-brand-purple uppercase tracking-wider bg-brand-purple/10 px-2 py-0.5 rounded">
                  Aptitude Challenge
                </span>
                <span className="text-xs text-slate-400 font-mono">+20 XP</span>
              </div>
              <h4 className="text-lg font-bold mb-2 text-slate-200">Probability & Permutations</h4>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                A bag contains 6 red and 4 black balls. 3 balls are drawn at random. What is the probability that 2 are red?
              </p>
              <button 
                onClick={() => onNavigate('aptitude')}
                className="w-full py-2.5 rounded-lg bg-slate-900 border border-brand-purple/30 text-xs font-semibold hover:bg-brand-purple hover:text-white transition-all flex items-center justify-center space-x-1"
              >
                <span>Start Quiz</span>
                <Play className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Continuing Track timeline */}
          <div className="glass-panel p-6">
            <h4 className="text-sm font-bold mb-4 uppercase tracking-wider text-slate-400">Preparation Pathway Progression</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500 flex items-center justify-center mt-1">
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-200">Array String Algorithms (Monaco Arena)</p>
                  <p className="text-xs text-slate-500">Completed 14 questions • High accuracy rate</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 rounded-full bg-brand-cyan/20 border border-brand-cyan flex items-center justify-center mt-1 animate-pulse">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-brand-cyan">Dynamic Programming & Logic Graphs</p>
                  <p className="text-xs text-slate-400">In Progress • Topic quiz pending validation</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-500">Speaking & Sentence Fragments Evaluation</p>
                  <p className="text-xs text-slate-600">Locked • Unlocked at intermediate level completion</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Recommendations & Advising */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold tracking-tight flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <span>Weak Areas Analysis</span>
          </h3>

          <div className="glass-panel p-6 space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              Our AI Auditor examined your mock transcripts and aptitude logs. Improve the following areas before the cohort test:
            </p>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-red-500/10 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-red-400">
                <span>Quantitative Ratio Speed</span>
                <span>38% Accuracy</span>
              </div>
              <p className="text-[10px] text-slate-500">Suggested: Watch Ratio & Proportion playlists</p>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-amber-500/10 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-amber-400">
                <span>Fluency & Fillers ("Um")</span>
                <span>High Hesitations</span>
              </div>
              <p className="text-[10px] text-slate-500">Suggested: Run HR Pitch mock interviews</p>
            </div>

            <button 
              onClick={() => onNavigate('analytics')}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-lg text-xs font-semibold text-brand-cyan transition-colors"
            >
              View Full Analytics Report
            </button>
          </div>

          {/* Quick Resume Audit Card */}
          <div className="glass-panel p-6 border border-emerald-500/20 bg-gradient-to-br from-slate-900/40 via-emerald-950/5 to-slate-900/40">
            <h4 className="text-sm font-bold text-slate-200 mb-2">Resume Status: Action Required</h4>
            <p className="text-xs text-slate-400 mb-4">
              Your resume ATS score is 68. Recruiters typically require 75+ for automated screening passes.
            </p>
            <button 
              onClick={() => onNavigate('resume')}
              className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
            >
              Optimize Resume With AI
            </button>
          </div>
        </div>
      </div>

      {/* Store Modal */}
      {isStoreOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel p-8 max-w-md w-full border-brand-purple/25 space-y-6 relative shadow-2xl shadow-brand-purple/10">
            <button 
              type="button" 
              onClick={() => setIsStoreOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white font-bold text-sm cursor-pointer"
            >
              ✕
            </button>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-100 flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-brand-purple fill-brand-purple/20 animate-pulse" />
                <span>AptiCode XP Rewards Store</span>
              </h3>
              <p className="text-[10px] text-brand-cyan font-mono font-bold">Your points balance: {xp.toLocaleString()} XP</p>
            </div>

            <div className="space-y-3">
              {rewardItems.map((item) => (
                <div key={item.id} className="p-3.5 rounded-xl bg-slate-950/50 border border-white/5 flex justify-between items-center gap-4 hover:border-slate-800 transition-colors">
                  <div className="space-y-0.5 flex-1 text-left">
                    <p className="text-xs font-bold text-slate-200">{item.title}</p>
                    <p className="text-[9px] text-slate-500 leading-tight">{item.description}</p>
                  </div>
                  <button
                    onClick={() => handleBuyItem(item)}
                    className="py-2 px-3 rounded-lg bg-brand-purple text-white text-[10px] font-bold hover:brightness-110 shadow shadow-brand-purple/25 shrink-0 cursor-pointer"
                  >
                    {item.cost} XP
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsStoreOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-400 hover:text-white cursor-pointer transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
