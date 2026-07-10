import React from 'react';
import { ArrowRight, Terminal, BookOpen, Mic, Brain, Award, Sparkles, Shield, Zap, Users, GraduationCap } from 'lucide-react';

interface LandingViewProps {
  onEnterApp: () => void;
}

export default function LandingView({ onEnterApp }: LandingViewProps) {
  return (
    <div className="min-h-screen text-slate-100 selection:bg-brand-cyan/30">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-white/5 py-4 px-6 md:px-12 flex justify-between items-center">
        <div className="flex items-center space-x-2.5 cursor-pointer" onClick={onEnterApp}>
          <img src="/favicon.svg" alt="AptiCode Logo" className="w-9 h-9" />
          <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Apti<span className="bg-gradient-to-r from-brand-purple to-brand-cyan bg-clip-text text-transparent">Code</span>
          </span>
        </div>
        <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#about" className="hover:text-white transition-colors">Curriculum</a>
          <a href="#recruits" className="hover:text-white transition-colors">Recruiters</a>
        </div>
        <button 
          onClick={onEnterApp}
          className="relative group overflow-hidden rounded-xl px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-brand-purple to-brand-cyan shadow-lg shadow-brand-purple/20 transition-all hover:scale-105 active:scale-95"
        >
          <span className="relative z-10 flex items-center space-x-1">
            <span>Enter Workspace</span>
            <ArrowRight className="w-4 h-4" />
          </span>
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 -z-10" />

        <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800/80 mb-6 text-xs font-semibold text-brand-cyan shadow-sm animate-pulse-slow">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Generative AI Placement Copilot v2.6</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1] max-w-5xl">
          Accelerate Your Placement Readiness with <span className="bg-gradient-to-r from-brand-purple via-violet-500 to-brand-cyan bg-clip-text text-transparent">Artificial Intelligence</span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-3xl mb-12 leading-relaxed">
          AptiCode combines structured Quantitative Aptitude, Monaco-powered Coding environments, Real-time Speech Analysis, AI HR Interviewers, and ATS Resume Optimization into a premium prep workspace.
        </p>

        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6">
          <button 
            onClick={onEnterApp}
            className="flex items-center justify-center space-x-2 bg-gradient-to-r from-brand-purple to-brand-cyan text-white font-bold rounded-xl px-8 py-4 shadow-lg shadow-brand-purple/20 transition-all hover:brightness-110 active:scale-95 text-base"
          >
            <span>Start Preparing Free</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <a 
            href="#features"
            className="flex items-center justify-center space-x-2 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-semibold rounded-xl px-8 py-4 transition-all hover:text-white"
          >
            <span>Explore Modules</span>
          </a>
        </div>

        {/* Floating Mockup Panel */}
        <div className="w-full mt-16 md:mt-24 max-w-5xl rounded-2xl border border-white/5 bg-slate-900/40 p-4 backdrop-blur-md shadow-2xl relative group">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-brand-purple to-brand-cyan opacity-20 blur group-hover:opacity-30 transition duration-1000" />
          <div className="relative rounded-xl overflow-hidden border border-white/5 bg-obsidian-950 p-6 flex flex-col md:flex-row text-left gap-6">
            {/* Sidebar Mock */}
            <div className="w-full md:w-1/3 flex flex-col space-y-3">
              <div className="flex items-center space-x-2 pb-4 border-b border-white/5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="text-xs text-slate-500 font-mono ml-2">apticode_ide</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/80 border border-brand-purple/20 flex items-center space-x-3">
                <Terminal className="w-4 h-4 text-brand-purple" />
                <span className="text-xs font-semibold text-slate-200">Coding Arena: Dynamic Programming</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/30 border border-white/5 flex items-center space-x-3">
                <BookOpen className="w-4 h-4 text-brand-cyan" />
                <span className="text-xs font-semibold text-slate-400">Aptitude: Data Interpretation</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/30 border border-white/5 flex items-center space-x-3">
                <Mic className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-slate-400">Speech Room: Fluency Checker</span>
              </div>
            </div>
            {/* Editor Screen Mock */}
            <div className="flex-1 rounded-lg bg-slate-900/80 p-4 font-mono text-xs text-brand-cyan border border-white/5">
              <div className="flex justify-between items-center mb-4 text-[10px] text-slate-500 border-b border-white/5 pb-2">
                <span>two_sum.py</span>
                <span>Language: Python 3</span>
              </div>
              <p className="text-slate-500"># Explain with AI active</p>
              <p className="text-brand-purple">def <span className="text-white">twoSum</span>(nums: List[int], target: int) -&gt; List[int]:</p>
              <p className="pl-4 text-slate-400">seen = &#123;&#125;</p>
              <p className="pl-4 text-brand-purple">for <span className="text-white">i, num</span> in enumerate(nums):</p>
              <p className="pl-8 text-slate-400">diff = target - num</p>
              <p className="pl-8 text-brand-purple">if <span className="text-slate-400">diff in seen:</span></p>
              <p className="pl-12 text-brand-cyan">return [seen[diff], i]</p>
              <p className="pl-8 text-slate-400">seen[num] = i</p>
              <div className="mt-4 p-2 rounded bg-slate-950/60 border border-brand-cyan/20 text-[10px] text-emerald-400">
                🚀 AI explanation loaded: Time Complexity O(N) using Hash Map lookups.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid Features */}
      <section id="features" className="py-20 md:py-32 px-6 md:px-12 bg-slate-950/50 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 md:mb-24">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">One Platform. Absolute Readiness.</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Master quantitative exams, logical reviews, soft-speaking parameters, and technical challenges in a single portal.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Item 1 */}
            <div className="glass-panel p-8 glass-panel-hover flex flex-col space-y-4">
              <div className="w-12 h-12 rounded-xl bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-brand-purple" />
              </div>
              <h3 className="text-xl font-bold">Aptitude Module</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Step-by-step videos, notes, dynamic quizzes, and an "Explain with AI" bot that walks you through arithmetic shortcut answers in real-time.
              </p>
            </div>

            {/* Item 2 */}
            <div className="glass-panel p-8 glass-panel-hover flex flex-col space-y-4">
              <div className="w-12 h-12 rounded-xl bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center">
                <Terminal className="w-6 h-6 text-brand-cyan" />
              </div>
              <h3 className="text-xl font-bold">Coding Playground</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Compile C++, Python, Java, and JS scripts. Access hidden validation test cases, run custom profiles, and query the AI code debugger.
              </p>
            </div>

            {/* Item 3 */}
            <div className="glass-panel p-8 glass-panel-hover flex flex-col space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center">
                <Mic className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold">Communication Review</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Analyze words-per-minute pacing, grammatical completeness, pause frequencies, filler terms, and continuous confidence sliders.
              </p>
            </div>

            {/* Item 4 */}
            <div className="glass-panel p-8 glass-panel-hover flex flex-col space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
                <Brain className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold">AI Mock Interview</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Sit across our technical, behavioral, and coding recruiters. Converse via voice, see live transcripts, and receive scoring audit sheets.
              </p>
            </div>

            {/* Item 5 */}
            <div className="glass-panel p-8 glass-panel-hover flex flex-col space-y-4">
              <div className="w-12 h-12 rounded-xl bg-red-400/10 border border-red-400/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-bold">ATS Resume Audit</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Formulate resumes with clean, modern templates, compute alignment ratings, correct passive phrases, and identify key missing skills.
              </p>
            </div>

            {/* Item 6 */}
            <div className="glass-panel p-8 glass-panel-hover flex flex-col space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-400/10 border border-blue-400/20 flex items-center justify-center">
                <Award className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold">Leaderboards & Streak</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Drive preparation engagement with streak systems, levels (Beginner to Placement Ready), weekly points audits, and custom digital badges.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recruits and Partners */}
      <section id="recruits" className="py-20 max-w-7xl mx-auto px-6 md:px-12 text-center">
        <h3 className="text-slate-400 text-sm font-semibold tracking-wider uppercase mb-10">Prepare for Top Tech Recruiters</h3>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 items-center opacity-40 grayscale contrast-200">
          <span className="font-bold text-2xl tracking-tighter text-white">AMAZON</span>
          <span className="font-bold text-2xl tracking-tighter text-white">GOOGLE</span>
          <span className="font-bold text-2xl tracking-tighter text-white">MICROSOFT</span>
          <span className="font-bold text-2xl tracking-tighter text-white">INFOSYS</span>
          <span className="font-bold text-2xl tracking-tighter text-white">TCS</span>
          <span className="font-bold text-2xl tracking-tighter text-white">ACCENTURE</span>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12 px-6 md:px-12 bg-slate-950/80 text-center text-slate-500 text-xs">
        <p className="mb-2">© 2026 AptiCode Corporation. Built for Placement Officer and University Cohorts.</p>
        <p>Premium EdTech Product Specs and Engineering Systems Documented.</p>
      </footer>
    </div>
  );
}
