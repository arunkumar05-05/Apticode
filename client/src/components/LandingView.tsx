import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Terminal, BookOpen, Mic, Brain, Award, Sparkles, Zap } from 'lucide-react';

interface LandingViewProps {
  onEnterApp: () => void;
}

export default function LandingView({ onEnterApp }: LandingViewProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--bg-base)] text-slate-100 selection:bg-brand-cyan/30">
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-white/70 px-4 py-3 backdrop-blur-xl dark:bg-slate-950/70 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3" onClick={onEnterApp}>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple to-brand-cyan shadow-lg shadow-brand-purple/20">
              <img src="/favicon.svg" alt="AptiCode Logo" className="h-6 w-6" />
            </div>
            <div>
              <p className="text-base font-semibold tracking-tight text-slate-100">Apti<span className="text-brand-cyan">Code</span></p>
              <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500">Placement copilot</p>
            </div>
          </div>
          <button onClick={onEnterApp} className="flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-brand-purple to-brand-cyan px-4 text-sm font-semibold text-white shadow-lg shadow-brand-purple/20 transition-all hover:brightness-110 active:scale-[0.98]">
            <span>Enter app</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </nav>

      <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-900/70 p-4 shadow-[0_20px_70px_rgba(15,23,42,0.22)] sm:p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.24),transparent_45%)]" />
          <div className="relative space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-cyan/25 bg-brand-cyan/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-cyan">
              <Sparkles className="h-3.5 w-3.5" />
              Generative AI placement copilot
            </div>
            <div className="space-y-3">
              <h1 className="max-w-3xl text-[clamp(1.8rem,4vw,3.2rem)] font-semibold tracking-tight text-white">Prepare for placements with a premium mobile-first study flow.</h1>
              <p className="max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">AptiCode combines aptitude, coding, mock interviews, speech coaching, and resume optimization into one polished workspace designed for daily momentum.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button onClick={onEnterApp} className="flex h-12 items-center justify-center gap-2 rounded-[18px] bg-gradient-to-r from-brand-purple to-brand-cyan px-5 text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]">
                <span>Start preparing</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <a href="#features" className="flex h-12 items-center justify-center rounded-[18px] border border-white/10 bg-slate-950/60 px-5 text-sm font-semibold text-slate-300 transition-all hover:border-brand-cyan/20 hover:text-white">Explore modules</a>
            </div>
          </div>
        </motion.section>

        <section className="rounded-[24px] border border-white/10 bg-white/5 p-4 shadow-[0_10px_35px_rgba(15,23,42,0.08)] backdrop-blur-sm sm:p-5">
          <div className="mb-4 flex items-center gap-2">
            <Terminal className="h-4.5 w-4.5 text-brand-cyan" />
            <h2 className="text-[1rem] font-semibold text-slate-100">What you can do in one place</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {[
              { title: 'Coding arena', description: 'Practice algorithms with a responsive editor and instant feedback.', icon: Terminal },
              { title: 'Aptitude prep', description: 'Move through quizzes and formula notes in seconds.', icon: BookOpen },
              { title: 'Speech coach', description: 'Improve clarity, pacing, and filler usage in real time.', icon: Mic },
              { title: 'Mock interview', description: 'Run recruiter-style practice rounds whenever you need.', icon: Brain },
              { title: 'Resume audit', description: 'Get ATS-oriented suggestions that fit modern hiring workflows.', icon: Award },
              { title: 'Daily streaks', description: 'Stay consistent with short focused sessions and clear progress.', icon: Zap }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div key={item.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * index }} className="rounded-[20px] border border-white/10 bg-slate-950/40 p-4">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-purple/10 text-brand-purple">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-slate-100">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
                </motion.div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-slate-950/70 px-4 py-6 text-center text-xs text-slate-500 sm:px-6 lg:px-8">
        <p>© 2026 AptiCode. Built for modern learning on every screen size.</p>
      </footer>
    </div>
  );
}
