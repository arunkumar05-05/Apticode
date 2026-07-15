import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Award, Zap, Play, CheckCircle2, Code, MessageSquare, BookOpen, Star, AlertCircle, Compass, Sparkles, Brain, ArrowRight } from 'lucide-react';

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
  openAiCoach?: () => void;
}

export default function DashboardView({ onNavigate, xp, level, spendXp, openAiCoach }: DashboardViewProps) {
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const saved = localStorage.getItem('apticode-user-session');
        const token = saved ? JSON.parse(saved).token : '';
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/dashboard`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.status === 'success') {
          setStatsData(data.stats);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const nextLevelXp = 30000;
  const progressPercent = Math.min((xp / nextLevelXp) * 100, 100);

  const handleBuyItem = (item: RewardItem) => {
    if (spendXp(item.cost)) {
      alert(`Success! Redeemed: ${item.title}. Spent ${item.cost} XP.`);
    } else {
      alert(`Insufficient XP! You need ${item.cost} XP to redeem this item.`);
    }
  };

  const stats = [
    { icon: Zap, label: 'Daily Streak', value: statsData?.streak || '0 days', accent: 'orange' },
    { icon: Code, label: 'Coding Accuracy', value: statsData?.codingAccuracy || '0.0%', accent: 'cyan' },
    { icon: BookOpen, label: 'Aptitude Score', value: statsData?.aptitudeScore || '0/100', accent: 'purple' },
    { icon: MessageSquare, label: 'Speech Rating', value: statsData?.speechRating || '0.0/10', accent: 'emerald' }
  ];

  const quickActions = [
    { id: 'coding', title: 'Coding Arena', description: 'Solve high-signal problems with a polished editor and instant feedback.', icon: Code, accent: 'cyan' },
    { id: 'aptitude', title: 'Aptitude Prep', description: 'Sharpen quant and logic with concise practice streams.', icon: BookOpen, accent: 'purple' },
    { id: 'communication', title: 'Speech Coach', description: 'Practice pronunciation and confidence in one tap.', icon: MessageSquare, accent: 'emerald' },
    { id: 'leaderboard', title: 'Leaderboard', description: 'Compare your momentum with your cohort.', icon: Award, accent: 'amber' }
  ];

  if (loading) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center space-y-3 font-mono text-xs text-slate-500">
        <Sparkles className="h-6 w-6 animate-spin text-brand-purple" />
        <span>Loading workspace stats...</span>
      </div>
    );
  }

  const weakTopicName = statsData?.weakTopics?.[0] || 'Probability';
  const strongTopicName = statsData?.strongTopics?.[0] || 'Time & Work';

  return (
    <div className="space-y-4 pb-24 text-left">
      <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="relative overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900/90 to-brand-purple/15 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.24),transparent_55%)]" />
        <div className="relative flex flex-col gap-4">
          <div className="flex items-center gap-2 self-start rounded-full border border-brand-purple/30 bg-brand-purple/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-purple">
            <Star className="h-3.5 w-3.5 fill-brand-purple" />
            Premium academic account
          </div>
          <div className="space-y-2">
            <h2 className="text-[clamp(1.25rem,2.2vw,1.75rem)] font-semibold tracking-tight text-white">Welcome back, {statsData?.fullName || 'Rahul'}</h2>
            <p className="max-w-xl text-sm leading-6 text-slate-400">You are ranked #{statsData?.leaderboardRank || 1} in your cohort. Keep the momentum going with one focused session today.</p>
          </div>
          <div className="rounded-[20px] border border-white/10 bg-slate-950/60 p-3">
            <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
              <span>Level {level}</span>
              <span className="text-brand-cyan">{xp.toLocaleString()} XP</span>
            </div>
            <div className="mb-3 h-2 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-gradient-to-r from-brand-purple to-brand-cyan transition-all duration-500" style={{ width: `${progressPercent}%` }} />
            </div>
            <button onClick={() => setIsStoreOpen(true)} className="flex h-11 w-full items-center justify-center gap-2 rounded-[16px] border border-brand-purple/20 bg-brand-purple/10 text-sm font-semibold text-brand-purple transition-all hover:bg-brand-purple/20">
              <Sparkles className="h-4 w-4" />
              Spend XP in rewards
            </button>
          </div>
        </div>
      </motion.section>

      <section className="grid grid-cols-2 gap-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const tint = stat.accent === 'orange' ? 'text-orange-400' : stat.accent === 'cyan' ? 'text-brand-cyan' : stat.accent === 'purple' ? 'text-brand-purple' : 'text-emerald-400';
          const bg = stat.accent === 'orange' ? 'bg-orange-500/12' : stat.accent === 'cyan' ? 'bg-brand-cyan/12' : stat.accent === 'purple' ? 'bg-brand-purple/12' : 'bg-emerald-500/12';
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * index, duration: 0.2 }} className="glass-panel p-3.5">
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 ${bg}`}>
                <Icon className={`h-5 w-5 ${tint}`} />
              </div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">{stat.label}</p>
              <p className="mt-1 text-lg font-semibold text-slate-100">{stat.value}</p>
            </motion.div>
          );
        })}
      </section>

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-panel p-4">
        <div className="mb-3 flex items-center gap-2">
          <Compass className="h-4.5 w-4.5 text-brand-cyan" />
          <h3 className="text-[1rem] font-semibold text-slate-100">Continue learning</h3>
        </div>
        <div className="space-y-2.5">
          <div className="flex items-start gap-3 rounded-[16px] border border-white/8 bg-slate-950/30 p-3">
            <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">Strong Skill Target</p>
              <p className="text-xs text-slate-500">Aptitude Strong Area: {strongTopicName}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-[16px] border border-white/8 bg-slate-950/30 p-3">
            <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand-cyan/15 text-brand-cyan">
              <div className="h-2.5 w-2.5 rounded-full bg-current" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-100">Recommended Improvement Area</p>
              <p className="text-xs text-slate-500">Practice quant exercises in: {weakTopicName}</p>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Zap className="h-4.5 w-4.5 text-orange-400" />
          <h3 className="text-[1rem] font-semibold text-slate-100">Daily challenges</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="glass-panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-full bg-brand-cyan/12 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-cyan">Coding</span>
              <span className="text-[11px] text-slate-500">+30 XP</span>
            </div>
            <h4 className="mb-2 text-base font-semibold text-slate-100">Container with most water</h4>
            <p className="mb-4 text-sm leading-6 text-slate-500">A compact two-pointer problem that rewards sharp edge-case reasoning.</p>
            <button onClick={() => onNavigate('coding')} className="flex h-11 w-full items-center justify-center gap-2 rounded-[16px] border border-brand-cyan/20 bg-brand-cyan/10 text-sm font-semibold text-brand-cyan transition-all hover:bg-brand-cyan/20">
              <Play className="h-4 w-4" />
              Open challenge
            </button>
          </div>
          <div className="glass-panel p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-full bg-brand-purple/12 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-purple">Aptitude</span>
              <span className="text-[11px] text-slate-500">+20 XP</span>
            </div>
            <h4 className="mb-2 text-base font-semibold text-slate-100">Probability & permutations</h4>
            <p className="mb-4 text-sm leading-6 text-slate-500">Short, high-impact questions that mirror recruiter-style difficulty.</p>
            <button onClick={() => onNavigate('aptitude')} className="flex h-11 w-full items-center justify-center gap-2 rounded-[16px] border border-brand-purple/20 bg-brand-purple/10 text-sm font-semibold text-brand-purple transition-all hover:bg-brand-purple/20">
              <Play className="h-4 w-4" />
              Start quiz
            </button>
          </div>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }} className="glass-panel bg-gradient-to-br from-slate-900/70 via-brand-purple/10 to-slate-900/70 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4.5 w-4.5 text-brand-purple" />
          <h3 className="text-[1rem] font-semibold text-slate-100">AI coach</h3>
        </div>
        <p className="mb-4 text-sm leading-6 text-slate-500">Get clear, practical guidance on interview prep, coding strategy, and resume feedback without leaving the app.</p>
        <button onClick={openAiCoach} className="flex h-12 w-full items-center justify-center gap-2 rounded-[18px] bg-gradient-to-r from-brand-purple to-brand-cyan text-sm font-semibold text-white shadow-[0_18px_40px_rgba(99,102,241,0.25)] transition-all hover:brightness-110 active:scale-[0.98]">
          <MessageSquare className="h-4 w-4" />
          Launch AI chat
        </button>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Brain className="h-4.5 w-4.5 text-emerald-400" />
          <h3 className="text-[1rem] font-semibold text-slate-100">Mock interview</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="glass-panel p-4">
            <div className="mb-3 flex items-center gap-2 text-amber-400">
              <AlertCircle className="h-4 w-4" />
              <h4 className="text-sm font-semibold">Weak spots</h4>
            </div>
            <div className="space-y-2">
              <div className="rounded-[16px] border border-red-500/15 bg-red-500/8 p-3 text-sm text-slate-350">Quant speed in "{weakTopicName}" is still below target.</div>
              <div className="rounded-[16px] border border-amber-500/15 bg-amber-500/8 p-3 text-sm text-slate-350">Filler words increase slightly during behavioral rounds.</div>
            </div>
            <button onClick={() => onNavigate('analytics')} className="mt-3 flex h-11 w-full items-center justify-center rounded-[16px] border border-white/10 bg-slate-900/70 text-sm font-semibold text-brand-cyan transition-all hover:bg-slate-900">View analytics</button>
          </div>
          <div className="glass-panel p-4">
            <h4 className="mb-2 text-sm font-semibold text-slate-100">Resume status</h4>
            <p className="mb-4 text-sm leading-6 text-slate-500">Your current ATS score is tracked in the database. Optimize draft tags to hit 80+.</p>
            <button onClick={() => onNavigate('resume')} className="flex h-11 w-full items-center justify-center rounded-[16px] bg-emerald-500 text-sm font-semibold text-slate-950 transition-all hover:bg-emerald-400">Optimize resume</button>
          </div>
        </div>
      </motion.section>

      {statsData?.recentActivities && statsData.recentActivities.length > 0 && (
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4.5 w-4.5 text-brand-cyan" />
            <h3 className="text-[1rem] font-semibold text-slate-100">Recent Workspace Activities</h3>
          </div>
          <div className="space-y-2">
            {statsData.recentActivities.map((act: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center text-xs p-2.5 bg-slate-950/20 border border-white/5 rounded-xl">
                <div>
                  <p className="font-semibold text-slate-300">{act.title}</p>
                  <p className="text-[10px] text-slate-500">{act.detail}</p>
                </div>
                <span className="text-[9px] text-slate-600 font-mono">{new Date(act.date).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </motion.section>
      )}

      <section className="grid gap-3">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          const tint = action.accent === 'cyan' ? 'text-brand-cyan' : action.accent === 'purple' ? 'text-brand-purple' : action.accent === 'emerald' ? 'text-emerald-400' : 'text-amber-400';
          const panel = action.accent === 'cyan' ? 'border-brand-cyan/20' : action.accent === 'purple' ? 'border-brand-purple/20' : action.accent === 'emerald' ? 'border-emerald-500/20' : 'border-amber-500/20';
          return (
            <motion.button key={action.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 + index * 0.03 }} onClick={() => onNavigate(action.id)} className={`glass-panel flex items-center justify-between gap-3 rounded-[20px] border p-4 text-left ${panel}`}>
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/40 ${tint}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-100">{action.title}</h4>
                  <p className="mt-1 text-sm leading-5 text-slate-500">{action.description}</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-500" />
            </motion.button>
          );
        })}
      </section>

      {isStoreOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="glass-panel w-full max-w-md space-y-4 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-100">XP rewards store</p>
                <p className="text-xs text-slate-500">Balance: {xp.toLocaleString()} XP</p>
              </div>
              <button onClick={() => setIsStoreOpen(false)} className="text-sm text-slate-500">✕</button>
            </div>
            <div className="space-y-2">
              {rewardItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 rounded-[16px] border border-white/8 bg-slate-950/40 p-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{item.description}</p>
                  </div>
                  <button onClick={() => handleBuyItem(item)} className="rounded-[14px] bg-brand-purple px-3 py-2 text-xs font-semibold text-white">{item.cost} XP</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
