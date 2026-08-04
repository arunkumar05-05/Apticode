import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Award, Zap, Play, CheckCircle2, Code, MessageSquare, BookOpen, Star, AlertCircle, Compass, Sparkles, Brain, ArrowRight } from 'lucide-react';
import { getApiBaseUrl } from '../config/api';
import Scene3D from './three/LazyScene3D';
import { StatOrb, XPBar, TiltCard, ConfettiBurst } from './ui/Gamified';
import { GlassCard, GlassModal } from './ui/GlassCard';

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
  user?: any;
}

export default function DashboardView({ onNavigate, xp, level, spendXp, openAiCoach, user }: DashboardViewProps) {
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confettiKey, setConfettiKey] = useState(0);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const saved = localStorage.getItem('apticode-user-session');
        const token = saved ? JSON.parse(saved).token : '';
        const response = await fetch(`${getApiBaseUrl()}/api/dashboard`, {
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
  const streakNum = parseInt(String(statsData?.streak ?? '0'), 10) || 0;

  const handleBuyItem = (item: RewardItem) => {
    if (spendXp(item.cost)) {
      setConfettiKey((k) => k + 1);
      alert(`Success! Redeemed: ${item.title}. Spent ${item.cost} XP.`);
    } else {
      alert(`Insufficient XP! You need ${item.cost} XP to redeem this item.`);
    }
  };

  const stats = [
    { icon: Zap, label: 'Daily Streak', value: statsData?.streak || '0 days', accent: 'amber' as const },
    { icon: Code, label: 'Coding Accuracy', value: statsData?.codingAccuracy || '0.0%', accent: 'cyan' as const },
    { icon: BookOpen, label: 'Aptitude Score', value: statsData?.aptitudeScore || '0/100', accent: 'violet' as const },
    { icon: MessageSquare, label: 'Speech Rating', value: statsData?.speechRating || '0.0/10', accent: 'emerald' as const }
  ];

  const quickActions = [
    { id: 'coding', title: 'Coding Arena', description: 'Solve high-signal problems with a polished editor and instant feedback.', icon: Code, accent: 'cyan' as const },
    { id: 'aptitude', title: 'Aptitude Prep', description: 'Sharpen quant and logic with concise practice streams.', icon: BookOpen, accent: 'violet' as const },
    { id: 'communication', title: 'Speech Coach', description: 'Practice pronunciation and confidence in one tap.', icon: MessageSquare, accent: 'emerald' as const },
    { id: 'leaderboard', title: 'Leaderboard', description: 'Compare your momentum with your cohort.', icon: Award, accent: 'amber' as const }
  ];

  if (loading) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center space-y-3 font-mono text-xs text-lc-text-muted">
        <Sparkles className="h-6 w-6 animate-spin text-lc-violet" />
        <span>Loading workspace stats...</span>
      </div>
    );
  }

  const weakTopicName = statsData?.weakTopics?.[0] || 'Probability';
  const strongTopicName = statsData?.strongTopics?.[0] || 'Time & Work';

  const userEmail = user?.email || statsData?.email || '';
  const savedName = userEmail ? localStorage.getItem(`apticode_user_name_${userEmail.trim()}`) || localStorage.getItem(`signup_fullname_${userEmail.trim()}`) : null;
  const rawName = user?.name || statsData?.fullName || savedName;
  const displayName = rawName && rawName !== 'New Candidate' && !rawName.includes('@') ? rawName : (userEmail ? userEmail.split('@')[0] : 'Candidate');

  return (
    <div className="space-y-4 pb-4 text-left">
      <ConfettiBurst trigger={confettiKey} />

      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="lc-glass relative overflow-hidden p-4 sm:p-6"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 opacity-60">
          <Scene3D variant="core" data={{ xpRatio: progressPercent / 100, streak: streakNum }} interactive={false} />
        </div>
        <div className="relative grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full lc-neo lc-neo-pill px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-lc-violet">
              <Star className="h-3.5 w-3.5 fill-lc-violet text-lc-violet" />
              Premium academic account
            </div>
            <div className="space-y-2">
              <h2 className="text-lc-text">Welcome back, {displayName}</h2>
              <p className="max-w-xl text-sm leading-6 text-lc-text-muted">
                You are ranked <span className="font-semibold text-lc-cyan">#{statsData?.leaderboardRank || 1}</span> in your cohort. Keep the momentum going with one focused session today.
              </p>
            </div>
            <XPBar xp={xp} nextLevelXp={nextLevelXp} level={level} className="max-w-xl" />
            <button
              onClick={() => setIsStoreOpen(true)}
              className="lc-neo lc-neo-pill flex h-11 items-center justify-center gap-2 px-5 text-sm font-bold text-lc-text"
            >
              <Sparkles className="h-4 w-4 text-lc-violet" />
              Spend XP in rewards
            </button>
          </div>
          <div className="hidden lg:block">
            <div className="lc-glass-raised rounded-2xl h-full min-h-56">
              <Scene3D variant="core" data={{ xpRatio: progressPercent / 100, streak: streakNum }} className="h-full" />
            </div>
          </div>
        </div>
      </motion.section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * index, duration: 0.2 }}>
              <StatOrb
                label={stat.label}
                value={stat.value}
                accent={stat.accent}
                icon={<Icon className="h-5 w-5" />}
              />
            </motion.div>
          );
        })}
      </section>

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <GlassCard padding="lg">
          <div className="mb-3 flex items-center gap-2">
            <Compass className="h-4 w-4 text-lc-cyan" />
            <h3 className="text-lc-text">Continue learning</h3>
          </div>
          <div className="grid gap-2.5 md:grid-cols-2">
            <div className="flex items-start gap-3 rounded-2xl lc-neo p-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lc-emerald/15 text-lc-emerald">
                <CheckCircle2 className="h-3.5 w-3.5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-lc-text">Strong Skill Target</p>
                <p className="text-xs text-lc-text-muted">Aptitude Strong Area: {strongTopicName}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-2xl lc-neo p-3">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lc-cyan/15 text-lc-cyan">
                <div className="h-2.5 w-2.5 rounded-full bg-current" />
              </div>
              <div>
                <p className="text-sm font-semibold text-lc-text">Recommended Improvement Area</p>
                <p className="text-xs text-lc-text-muted">Practice quant exercises in: {weakTopicName}</p>
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Zap className="h-4 w-4 text-lc-amber" />
          <h3 className="text-lc-text">Daily challenges</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <TiltCard className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-full bg-lc-cyan/12 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-lc-cyan">Coding</span>
              <span className="font-mono text-[11px] text-lc-text-muted">+30 XP</span>
            </div>
            <h4 className="mb-2 font-display text-base font-semibold text-lc-text">Container with most water</h4>
            <p className="mb-4 text-sm leading-6 text-lc-text-muted">A compact two-pointer problem that rewards sharp edge-case reasoning.</p>
            <button onClick={() => onNavigate('coding')} className="lc-neo lc-neo-pill flex h-11 w-full items-center justify-center gap-2 bg-gradient-to-r from-lc-cyan/15 to-lc-violet/15 text-sm font-semibold text-lc-cyan">
              <Play className="h-4 w-4" />
              Open challenge
            </button>
          </TiltCard>
          <TiltCard className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="rounded-full bg-lc-violet/12 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-lc-violet">Aptitude</span>
              <span className="font-mono text-[11px] text-lc-text-muted">+20 XP</span>
            </div>
            <h4 className="mb-2 font-display text-base font-semibold text-lc-text">Probability & permutations</h4>
            <p className="mb-4 text-sm leading-6 text-lc-text-muted">Short, high-impact questions that mirror recruiter-style difficulty.</p>
            <button onClick={() => onNavigate('aptitude')} className="lc-neo lc-neo-pill flex h-11 w-full items-center justify-center gap-2 bg-gradient-to-r from-lc-violet/15 to-lc-cyan/15 text-sm font-semibold text-lc-violet">
              <Play className="h-4 w-4" />
              Start quiz
            </button>
          </TiltCard>
        </div>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.07 }}>
        <GlassCard className="bg-gradient-to-br from-lc-violet/10 via-transparent to-lc-cyan/5" padding="lg">
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-lc-violet" />
            <h3 className="text-lc-text">AI coach</h3>
          </div>
          <p className="mb-4 text-sm leading-6 text-lc-text-muted">Get clear, practical guidance on interview prep, coding strategy, and resume feedback without leaving the app.</p>
          <button onClick={openAiCoach} className="lc-neo lc-neo-pill flex h-12 items-center justify-center gap-2 bg-gradient-to-r from-lc-violet to-lc-cyan px-6 text-sm font-bold text-lc-text">
            <MessageSquare className="h-4 w-4" />
            Launch AI chat
          </button>
        </GlassCard>
      </motion.section>

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Brain className="h-4 w-4 text-lc-emerald" />
          <h3 className="text-lc-text">Mock interview & resume</h3>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <GlassCard padding="lg">
            <div className="mb-3 flex items-center gap-2 text-lc-amber">
              <AlertCircle className="h-4 w-4" />
              <h4 className="font-display text-sm font-semibold">Weak spots</h4>
            </div>
            <div className="space-y-2">
              <div className="rounded-2xl border border-lc-rose/15 bg-lc-rose/10 p-3 text-sm text-lc-text-muted">Quant speed in "{weakTopicName}" is still below target.</div>
              <div className="rounded-2xl border border-lc-amber/15 bg-lc-amber/10 p-3 text-sm text-lc-text-muted">Filler words increase slightly during behavioral rounds.</div>
            </div>
            <button onClick={() => onNavigate('analytics')} className="lc-neo mt-3 flex h-11 w-full items-center justify-center text-sm font-semibold text-lc-cyan">View analytics</button>
          </GlassCard>
          <GlassCard padding="lg">
            <h4 className="mb-2 font-display text-sm font-semibold text-lc-text">Resume status</h4>
            <p className="mb-4 text-sm leading-6 text-lc-text-muted">Your current ATS score is tracked in the database. Optimize draft tags to hit 80+.</p>
            <button onClick={() => onNavigate('resume')} className="lc-neo lc-neo-pill flex h-11 w-full items-center justify-center bg-gradient-to-r from-lc-emerald/20 to-lc-cyan/20 text-sm font-semibold text-lc-emerald">Optimize resume</button>
          </GlassCard>
        </div>
      </motion.section>

      {statsData?.recentActivities && statsData.recentActivities.length > 0 && (
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <GlassCard padding="lg">
            <div className="mb-3 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-lc-cyan" />
              <h3 className="text-lc-text">Recent workspace activities</h3>
            </div>
            <div className="space-y-2">
              {statsData.recentActivities.map((act: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between gap-3 rounded-xl lc-neo p-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-lc-text">{act.title}</p>
                    <p className="truncate text-xs text-lc-text-muted">{act.detail}</p>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] text-lc-text-muted">{new Date(act.date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.section>
      )}

      <section className="grid gap-3">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          const tint = action.accent === 'cyan' ? 'text-lc-cyan' : action.accent === 'violet' ? 'text-lc-violet' : action.accent === 'emerald' ? 'text-lc-emerald' : 'text-lc-amber';
          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.09 + index * 0.03 }}
              onClick={() => onNavigate(action.id)}
              className="lc-glass flex items-center justify-between gap-3 p-4 text-left"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-lc-violet/15 to-lc-cyan/10 ${tint}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-display text-sm font-semibold text-lc-text">{action.title}</h4>
                  <p className="mt-1 text-sm leading-5 text-lc-text-muted">{action.description}</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-lc-text-muted" />
            </motion.button>
          );
        })}
      </section>

      <GlassModal isOpen={isStoreOpen} onClose={() => setIsStoreOpen(false)} title="XP rewards store" size="md">
        <p className="mb-4 font-mono text-sm text-lc-text-muted">Balance: <span className="text-lc-cyan">{xp.toLocaleString()} XP</span></p>
        <div className="space-y-2">
          {rewardItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl lc-neo p-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-lc-text">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-lc-text-muted">{item.description}</p>
              </div>
              <button
                onClick={() => handleBuyItem(item)}
                className="lc-neo lc-neo-pill shrink-0 bg-gradient-to-r from-lc-violet to-lc-cyan px-3 py-2 text-xs font-bold text-lc-text"
              >
                {item.cost} XP
              </button>
            </div>
          ))}
        </div>
      </GlassModal>
    </div>
  );
}
