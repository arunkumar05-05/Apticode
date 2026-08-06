import React, { useState } from 'react';
import { ChevronRight, CheckCircle2, DollarSign } from 'lucide-react';
import { LiquidBackdrop } from './ui/LiquidBackdrop';

interface CompanyConfig {
  name: string;
  salaryRange: string;
  rounds: string[];
  pattern: string;
  aptitudeSample: string;
  codingSample: string;
  roadmap: string[];
}

const companiesData: CompanyConfig[] = [
  {
    name: 'TCS (Tata Consultancy Services)',
    salaryRange: '3.6 LPA (Ninja) - 7.2 LPA (Digital) - 9.0 LPA (Prime)',
    rounds: ['National Qualifier Test (NQT)', 'Technical Interview', 'HR & Managerial Round'],
    pattern: 'Part A: Foundation Section (Traits, Numerical Ability, Verbal Ability, Reasoning Ability). Part B: Advanced Section (Advanced Quantitative, Reasoning, Coding).',
    aptitudeSample: 'Q: Sum of two numbers is 36. If their HCF is 4, how many pairs of such numbers exist?\nA: 3 pairs.',
    codingSample: 'Q: Given an array of integers, find the equilibrium index.\nA: Index where sum of elements on left equals sum of elements on right.',
    roadmap: [
      'Master basic Quantitative Aptitude & Foundation Logical puzzles.',
      'Solve previous TCS NQT coding questions (Arrays, Strings, Matrices).',
      'Revise Core CS subjects (DBMS, OOPs, OS) for Technical Interview.'
    ]
  },
  {
    name: 'Zoho Corporation',
    salaryRange: '5.6 LPA - 8.5 LPA',
    rounds: ['Round 1: Written Test (Aptitude + C Bug finding)', 'Round 2: Programming (Basic)', 'Round 3: Advanced Programming', 'Round 4: Technical HR', 'Round 5: General HR'],
    pattern: 'Written round contains 25 high-intensity Aptitude and C output questions. Next rounds evaluate core logic building without standard library algorithms.',
    aptitudeSample: 'Q: A train passes a telegraph post in 9 seconds and a bridge 200m long in 21 seconds. Find the length and speed of the train.\nA: Speed = 60 km/h, Length = 150m.',
    codingSample: 'Q: Implement a regular expression matcher supporting * and . wildcards.\nA: Build a recursion/DP match helper.',
    roadmap: [
      'Practice core C/Java programming concepts (Pointers, recursion, loops).',
      'Solve data structures implementation from scratch without using Java collections / C++ STL.',
      'Prepare System Design concepts for advanced rounds.'
    ]
  },
  {
    name: 'Amazon',
    salaryRange: '18 LPA - 44 LPA',
    rounds: ['Online Assessment (Coding + Work Style Assessment)', 'Technical Round 1 (DSA)', 'Technical Round 2 (DSA & System Design)', 'Bar Raiser Round (Leadership Principles)'],
    pattern: '2 Medium-Hard LeetCode problems in OA. Technical rounds focus heavily on DSA, algorithmic complexity optimization, and Amazon Leadership Principles (STAR method).',
    aptitudeSample: 'Q: A container contains 40 liters of milk. From this, 4 liters is replaced with water. This process is repeated 3 times. What is final milk quantity?\nA: 29.16 Liters.',
    codingSample: 'Q: LRU Cache implementation.\nA: Double Linked List combined with a HashMap.',
    roadmap: [
      'Solve 150+ LeetCode Medium/Hard coding questions (focus on Graphs, Trees, Heap, and DP).',
      'Study Amazon Leadership Principles thoroughly and frame past projects using the STAR method.',
      'Practice system design fundamentals (Scaling, Load Balancers, Sharding).'
    ]
  },
  {
    name: 'Google',
    salaryRange: '25 LPA - 55 LPA',
    rounds: ['Google Online Challenge (GOC)', 'Technical Screen', '3-4 Onsite Coding Rounds', 'Googlyness Round'],
    pattern: 'Extremely rigorous coding evaluations. Coding rounds evaluate optimal time/space complexity, edge case handling, clean OOP structure, and mathematical thinking.',
    aptitudeSample: 'Q: What is the probability of choosing 3 points on a circle such that they form an acute triangle?\nA: 1/4.',
    codingSample: 'Q: Find the shortest path in a dynamic grid with obstacles that can be broken K times.\nA: 3D BFS (X, Y, Obstacles Broken).',
    roadmap: [
      'Master Graph algorithms (Dijkstra, Bellman-Ford, MST), Segment Trees, and advanced DP.',
      'Practice talking out loud while coding under time pressure.',
      'Prepare for Googlyness questions mapping teamwork, ambiguity resolution, and growth mindset.'
    ]
  }
];

export default function CompanyPrepView() {
  const [activeCompany, setActiveCompany] = useState<CompanyConfig>(companiesData[0]);

  return (
    <div className="relative overflow-hidden">
      <LiquidBackdrop />

      <div className="grid md:grid-cols-4 gap-8 pb-12 text-left">
        {/* Vault constellation band */}
        <div className="hidden md:col-span-4 lg:block lc-glass relative overflow-hidden pointer-events-none">
          <div className="h-40 lg:h-56" style={{ background: 'radial-gradient(circle at 50% 50%, var(--lc-brand-violet) 0%, transparent 70%)' }} />
        </div>

        {/* Sidebar: Companies List */}
        <div className="md:col-span-1 lc-glass p-4 flex flex-col space-y-3">
          <h3 className="text-xs font-bold text-lc-text-muted uppercase tracking-wider px-2 font-mono">Company Guides</h3>
          <div className="space-y-1">
            {companiesData.map((comp) => (
              <button
                key={comp.name}
                onClick={() => setActiveCompany(comp)}
                className={`w-full text-left p-3 rounded-lg text-xs font-bold flex items-center justify-between border transition-all ${
                  activeCompany.name === comp.name
                    ? 'bg-gradient-to-r from-lc-violet/20 to-lc-cyan/15 border-lc-violet/30 text-lc-violet'
                    : 'border-transparent text-lc-text-muted hover:bg-lc-glass-raised'
                }`}
              >
                <span>{comp.name.split(' (')[0]}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>
        </div>

        {/* Workspace Area */}
        <div className="md:col-span-3 space-y-6">
          <div className="lc-glass p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between border-b border-lc-glass-border pb-4 gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-lc-text">{activeCompany.name}</h2>
                <p className="text-xs text-lc-text-muted font-mono mt-1">Recruitment roadmap & test breakdown</p>
              </div>
              <div className="flex items-center space-x-1.5 lc-neo lc-neo-pill bg-lc-emerald/10 border border-lc-emerald/20 px-3 py-1.5 text-lc-emerald text-xs font-bold font-mono">
                <DollarSign className="w-4 h-4" />
                <span>{activeCompany.salaryRange}</span>
              </div>
            </div>

            {/* Rounds */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-lc-text-muted uppercase tracking-widest font-mono">Selection Rounds</h4>
              <div className="grid md:grid-cols-3 gap-3">
                {activeCompany.rounds.map((r, i) => (
                  <div key={i} className="p-4 rounded-xl lc-glass-raised border-lc-glass-border flex items-start space-x-2 text-xs">
                    <span className="font-bold text-lc-cyan font-mono">0{i+1}.</span>
                    <span className="text-lc-text font-semibold">{r}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Pattern */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-lc-text-muted uppercase tracking-widest font-mono">Exam Pattern Breakdown</h4>
              <p className="text-xs leading-relaxed text-lc-text-muted lc-glass-raised p-4 rounded-xl border-lc-glass-border">
                {activeCompany.pattern}
              </p>
            </div>

            {/* Sample Questions */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-lc-violet uppercase tracking-widest font-mono">Frequently Asked Aptitude</h4>
                <div className="p-4 lc-glass-raised rounded-xl border-lc-violet/20 text-xs font-mono whitespace-pre-wrap leading-relaxed text-lc-text">
                  {activeCompany.aptitudeSample}
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-lc-cyan uppercase tracking-widest font-mono">Standard Coding Question</h4>
                <div className="p-4 lc-glass-raised rounded-xl border-lc-cyan/20 text-xs font-mono whitespace-pre-wrap leading-relaxed text-lc-text">
                  {activeCompany.codingSample}
                </div>
              </div>
            </div>

            {/* Roadmap */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-lc-text-muted uppercase tracking-widest font-mono">Suggested Preparation Steps</h4>
              <div className="space-y-2.5">
                {activeCompany.roadmap.map((step, idx) => (
                  <div key={idx} className="lc-glass flex items-start gap-3 p-3.5 text-xs">
                    <div className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-lc-violet/15 text-lc-violet">
                      <CheckCircle2 className="h-3 w-3" />
                    </div>
                    <div>
                      <p className="font-semibold text-lc-text">Step {idx + 1}</p>
                      <p className="text-lc-text-muted mt-0.5">{step}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
