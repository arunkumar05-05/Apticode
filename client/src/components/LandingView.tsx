import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Terminal, BookOpen, Mic, Brain, Award, Zap } from 'lucide-react';
import { LiquidBackdrop } from './ui/LiquidBackdrop';
import Scene3D from './three/LazyScene3D';
import { TiltCard } from './ui/Gamified';

interface LandingViewProps {
  onEnterApp: () => void;
}

const FEATURES = [
  { title: 'Coding arena', description: 'Algorithms, a responsive editor, and instant feedback in one flow.', icon: Terminal },
  { title: 'Aptitude prep', description: 'Quizzes and formula notes you can clear in seconds.', icon: BookOpen },
  { title: 'Speech coach', description: 'Clarity, pacing, and filler detection in real time.', icon: Mic },
  { title: 'Mock interview', description: 'Recruiter-style rounds whenever you need a dry run.', icon: Brain },
  { title: 'Resume audit', description: 'ATS-oriented fixes built for modern hiring pipelines.', icon: Award },
  { title: 'Daily streaks', description: 'Short, focused sessions compound into real progress.', icon: Zap },
];

export default function LandingView({ onEnterApp }: LandingViewProps) {
  return (
    <div className="min-h-screen overflow-x-hidden relative">
      <LiquidBackdrop />

      <nav className="sticky top-3 z-50 px-4 sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between lc-glass px-4 py-2.5 sm:px-5">
          <div className="flex items-center gap-3 cursor-pointer" onClick={onEnterApp}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-lc-violet to-lc-cyan shadow-neo">
              <img src="/favicon.svg" alt="AptiCode Logo" className="h-6 w-6" />
            </div>
            <div>
              <p className="font-display text-base font-bold tracking-tight text-lc-text">
                Apti<span className="lc-text-gradient">Code</span>
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-lc-text-muted">Placement copilot</p>
            </div>
          </div>
          <button
            onClick={onEnterApp}
            className="lc-neo lc-neo-pill flex h-11 items-center gap-2 bg-gradient-to-r from-lc-violet to-lc-cyan px-4 text-sm font-semibold text-lc-text"
          >
            <span>Enter app</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 pt-6 pb-4 sm:px-6 lg:pt-10">
        <section className="grid items-center gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full lc-neo lc-neo-pill px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22em] text-lc-cyan">
              <span className="h-1.5 w-1.5 rounded-full bg-lc-cyan animate-pulse" />
              Generative AI placement copilot
            </div>
            <h1 className="text-lc-text">
              Your placement engine,
              <br />
              <span className="lc-text-gradient">in daily motion.</span>
            </h1>
            <p className="max-w-xl text-base leading-7 text-lc-text-muted">
              AptiCode merges aptitude, coding, mock interviews, speech coaching, and resume
              audits into one workspace tuned for momentum — every streak counts.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={onEnterApp}
                className="lc-neo lc-neo-pill flex h-12 items-center justify-center gap-2 bg-gradient-to-r from-lc-violet to-lc-cyan px-6 text-sm font-bold text-lc-text"
              >
                <span>Start preparing</span>
                <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href="#features"
                className="lc-neo lc-neo-pill flex h-12 items-center justify-center px-6 text-sm font-semibold text-lc-text"
              >
                Explore modules
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="lc-glass h-72 overflow-hidden sm:h-96 lg:h-[26rem]">
              <Scene3D variant="orbital" className="absolute inset-0" interactive />
            </div>
            <div className="pointer-events-none absolute -bottom-3 -left-3 rounded-2xl lc-neo px-3 py-2 font-mono text-xs text-lc-text">
              <span className="text-lc-emerald">●</span> orbit sync: active
            </div>
          </motion.div>
        </section>

        <section id="features" className="mt-10">
          <div className="mb-4 flex items-center gap-2">
            <Terminal className="h-4 w-4 text-lc-cyan" />
            <h2 className="text-lc-text">Everything in one cockpit</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {FEATURES.map((item) => {
              const Icon = item.icon;
              return (
                <TiltCard key={item.title} className="p-5">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-lc-violet/20 to-lc-cyan/10 text-lc-violet">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-sm font-semibold text-lc-text">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-lc-text-muted">{item.description}</p>
                </TiltCard>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="mt-12 border-t border-lc-glass-border px-4 py-6 text-center">
        <p className="font-mono text-xs text-lc-text-muted">© 2026 AptiCode — built for momentum on every screen.</p>
      </footer>
    </div>
  );
}
