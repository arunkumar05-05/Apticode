import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, Check, Search, Calendar, Award,
  Target, Cpu, Compass, BookOpen, Layers, Zap, Flame,
  BarChart3, Star, Sparkles, X, Code, Users
} from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
interface OnboardingViewProps {
  onComplete: (data: {
    goal: string[];
    year: string;
    branch: string;
    codingLevel: string;
    companies: string[];
    studyGoal: number;
    onboardingCompleted: boolean;
  }) => void;
  userEmail: string;
}

const GOAL_OPTIONS = [
  { id: 'placement', title: 'Placement Preparation', desc: 'Prepare for on-campus placements with coding, aptitude, interviews and resume.', icon: Target },
  { id: 'internship', title: 'Internship Preparation', desc: 'Master DSA, resume building and interview practice for internships.', icon: Compass },
  { id: 'cp', title: 'Competitive Programming', desc: 'Improve algorithms, contests and coding speed.', icon: Zap },
  { id: 'skills', title: 'Skill Development', desc: 'Learn programming, AI, system design and software engineering.', icon: BookOpen }
];

const YEAR_OPTIONS = ['First Year', 'Second Year', 'Third Year', 'Final Year', 'Graduate'];

const BRANCH_OPTIONS = [
  'Computer Science', 'Information Technology', 'AI & ML',
  'Electronics', 'Electrical', 'Mechanical', 'Civil', 'Other'
];

const CODING_LEVELS = [
  { id: 'Beginner', title: 'Beginner', desc: 'New to coding, want to learn fundamentals step-by-step.' },
  { id: 'Intermediate', title: 'Intermediate', desc: 'Know syntax, basic loops, and arrays. Ready for DSA.' },
  { id: 'Advanced', title: 'Advanced', desc: 'Comfortable with standard DSA, sorting, maps and recursion.' },
  { id: 'Competitive', title: 'Competitive Programmer', desc: 'Active on Codeforces/LeetCode, fast algorithms.' }
];

const TARGET_COMPANIES_SUGGESTIONS = [
  'Google', 'Microsoft', 'Amazon', 'Atlassian', 'Adobe', 'Flipkart',
  'Goldman Sachs', 'JPMorgan', 'Oracle', 'Uber', 'NVIDIA', 'Apple',
  'Meta', 'Netflix'
];

const LOADING_MESSAGES = [
  'Analyzing profile...',
  'Preparing personalized roadmap...',
  'Selecting coding questions...',
  'Building interview plan...',
  'Generating AI recommendations...'
];

export default function OnboardingView({ onComplete, userEmail }: OnboardingViewProps) {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState<string[]>([]);
  const [year, setYear] = useState('');
  const [branch, setBranch] = useState('');
  const [codingLevel, setCodingLevel] = useState('');
  const [companies, setCompanies] = useState<string[]>([]);
  const [studyGoal, setStudyGoal] = useState(60); // default 1 hour in minutes
  const [branchSearch, setBranchSearch] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && step < 8 && step !== 4 && step !== 6) {
        // Only trigger next step on enter if it's not a searchable state
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, goal, year, branch, codingLevel, companies]);

  // Step 8: Rotating AI messaging & Progress bar simulation
  useEffect(() => {
    if (step === 8) {
      const messageInterval = setInterval(() => {
        setLoadingMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 500);

      const progressInterval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            clearInterval(messageInterval);
            setStep(9);
            return 100;
          }
          return prev + 4;
        });
      }, 80);

      return () => {
        clearInterval(messageInterval);
        clearInterval(progressInterval);
      };
    }
  }, [step]);

  const handleNext = () => {
    if (step === 2 && goal.length === 0) return;
    if (step === 3 && !year) return;
    if (step === 4 && !branch) return;
    if (step === 5 && !codingLevel) return;
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleSkip = () => {
    // Standard quick auto-fill defaults on skip
    if (step === 2 && goal.length === 0) setGoal(['placement']);
    if (step === 3 && !year) setYear('Third Year');
    if (step === 4 && !branch) setBranch('Computer Science');
    if (step === 5 && !codingLevel) setCodingLevel('Intermediate');
    setStep(prev => prev + 1);
  };

  const toggleGoal = (id: string) => {
    setGoal(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  };

  const toggleCompany = (comp: string) => {
    setCompanies(prev => prev.includes(comp) ? prev.filter(c => c !== comp) : [...prev, comp]);
  };

  const filteredBranches = useMemo(() => {
    return BRANCH_OPTIONS.filter(b => b.toLowerCase().includes(branchSearch.toLowerCase()));
  }, [branchSearch]);

  const filteredCompanySuggestions = useMemo(() => {
    return TARGET_COMPANIES_SUGGESTIONS.filter(
      c => c.toLowerCase().includes(companySearch.toLowerCase()) && !companies.includes(c)
    );
  }, [companySearch, companies]);

  // XP calculation: 5 XP per minute of daily target study
  const calculatedXp = useMemo(() => {
    return studyGoal * 5;
  }, [studyGoal]);

  const saveOnboarding = async () => {
    setSaving(true);
    const onboardingPayload = {
      goal,
      year,
      branch,
      codingLevel,
      companies,
      studyGoal,
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const currentUser = auth.currentUser;
    const docId = currentUser ? currentUser.uid : userEmail;
    const storageKey = currentUser ? `onboarding_${currentUser.uid}` : (userEmail ? `onboarding_${userEmail}` : 'onboarding_sandbox');

    // Save to Firestore using UID (or email-based document ID for sandbox) with timeout fallback
    try {
      if (docId) {
        const docRef = doc(db, 'users', docId);
        await Promise.race([
          setDoc(docRef, onboardingPayload, { merge: true }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore write timeout')), 2500))
        ]);
        console.log('[Onboarding] Profile written to Firestore successfully.');
      }
    } catch (err) {
      console.error('[Onboarding] Firestore write failed. Falling back to local storage:', err);
    }

    // Save locally
    localStorage.setItem(storageKey, JSON.stringify(onboardingPayload));
    
    // Simulate API write delay for premium UX transition
    await new Promise(resolve => setTimeout(resolve, 600));
    
    setSaving(false);
    onComplete(onboardingPayload);
  };

  // Step render helper
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-brand-purple/20 to-brand-cyan/20 border border-white/10 shadow-inner">
              <Sparkles className="h-10 w-10 text-brand-cyan animate-pulse" />
            </div>
            <div className="space-y-3">
              <h2 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">Welcome to AptiCode</h2>
              <p className="mx-auto max-w-sm text-sm text-slate-400">
                Let's personalize your placement preparation experience.
              </p>
            </div>
            <button onClick={handleNext} className="group mx-auto flex h-13 w-full max-w-xs items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-purple to-brand-cyan text-sm font-semibold text-white shadow-lg shadow-brand-purple/20 transition-all hover:brightness-110 active:scale-[0.98]">
              <span>Continue</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        );

      case 2:
        return (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
            <div className="space-y-1.5 text-center">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">Select Your Goal</h2>
              <p className="text-xs text-slate-400">Choose all paths you want to focus on.</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {GOAL_OPTIONS.map((opt) => {
                const isSelected = goal.includes(opt.id);
                const IconComponent = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleGoal(opt.id)}
                    className={`relative flex flex-col items-start rounded-2xl border p-4 text-left transition-all ${isSelected
                        ? 'border-brand-cyan bg-gradient-to-b from-brand-cyan/15 to-transparent scale-[1.01] shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                        : 'border-white/5 bg-slate-950/30 hover:border-white/15'
                      }`}
                  >
                    <div className="flex w-full justify-between items-center mb-3">
                      <div className={`p-2 rounded-xl border ${isSelected ? 'border-brand-cyan/35 bg-brand-cyan/10 text-brand-cyan' : 'border-white/5 bg-slate-900/50 text-slate-400'}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      {isSelected && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-cyan text-slate-950">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-slate-100">{opt.title}</h3>
                    <p className="mt-1 text-xs text-slate-400 leading-normal">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleBack} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-white/5 bg-slate-950/30 text-xs font-semibold text-slate-400 hover:border-white/15 hover:text-white">
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button onClick={handleNext} disabled={goal.length === 0} className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-xs font-semibold transition-all ${goal.length > 0
                  ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20 hover:brightness-105'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}>
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
            <div className="space-y-1.5 text-center">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">Select Year</h2>
              <p className="text-xs text-slate-400">Where are you currently at in your academic path?</p>
            </div>
            <div className="space-y-2 max-w-sm mx-auto">
              {YEAR_OPTIONS.map((opt) => {
                const isSelected = year === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => { setYear(opt); handleNext(); }}
                    className={`flex w-full items-center justify-between rounded-xl border px-5 py-4 text-left transition-all ${isSelected
                        ? 'border-brand-purple bg-brand-purple/10 text-white'
                        : 'border-white/5 bg-slate-950/30 text-slate-400 hover:border-white/10 hover:text-slate-200'
                      }`}
                  >
                    <span className="text-sm font-semibold">{opt}</span>
                    <Calendar className={`h-4 w-4 ${isSelected ? 'text-brand-purple' : 'text-slate-500'}`} />
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleBack} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-white/5 bg-slate-950/30 text-xs font-semibold text-slate-400 hover:border-white/15">
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button onClick={handleSkip} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-white/5 bg-slate-950/10 text-xs font-semibold text-slate-500 hover:text-slate-400">
                <span>Skip</span>
              </button>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-5">
            <div className="space-y-1.5 text-center">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">Select Branch</h2>
              <p className="text-xs text-slate-400">Search and select your engineering department.</p>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={branchSearch}
                onChange={(e) => setBranchSearch(e.target.value)}
                placeholder="Search branch (e.g. Computer Science)..."
                className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/40 pl-9 pr-4 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-brand-purple/45"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {filteredBranches.map((opt) => {
                const isSelected = branch === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => setBranch(opt)}
                    className={`rounded-xl border p-3 text-center text-xs font-semibold transition-all ${isSelected
                        ? 'border-brand-cyan bg-brand-cyan/10 text-brand-cyan'
                        : 'border-white/5 bg-slate-950/30 text-slate-400 hover:border-white/10 hover:text-slate-200'
                      }`}
                  >
                    {opt}
                  </button>
                );
              })}
              {filteredBranches.length === 0 && (
                <div className="col-span-2 py-6 text-center text-xs text-slate-500">No branches match your search query.</div>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleBack} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-white/5 bg-slate-950/30 text-xs font-semibold text-slate-400 hover:border-white/15">
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button onClick={handleNext} disabled={!branch} className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-xl text-xs font-semibold transition-all ${branch
                  ? 'bg-brand-purple text-white shadow-lg shadow-brand-purple/20 hover:brightness-105'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}>
                <span>Next</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        );

      case 5:
        return (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
            <div className="space-y-1.5 text-center">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">Coding Experience</h2>
              <p className="text-xs text-slate-400">Help us tailor quiz difficulties and coding tasks.</p>
            </div>
            <div className="space-y-3">
              {CODING_LEVELS.map((opt) => {
                const isSelected = codingLevel === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => { setCodingLevel(opt.id); handleNext(); }}
                    className={`flex flex-col w-full rounded-xl border px-5 py-3.5 text-left transition-all ${isSelected
                        ? 'border-brand-purple bg-gradient-to-r from-brand-purple/10 to-transparent'
                        : 'border-white/5 bg-slate-950/30 hover:border-white/10'
                      }`}
                  >
                    <span className={`text-xs font-bold ${isSelected ? 'text-brand-purple' : 'text-slate-200'}`}>{opt.title}</span>
                    <span className="mt-1 text-[11px] text-slate-400 leading-relaxed">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleBack} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-white/5 bg-slate-950/30 text-xs font-semibold text-slate-400 hover:border-white/15">
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button onClick={handleSkip} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-white/5 bg-slate-950/10 text-xs font-semibold text-slate-500 hover:text-slate-400">
                <span>Skip</span>
              </button>
            </div>
          </motion.div>
        );

      case 6:
        return (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-5">
            <div className="space-y-1.5 text-center">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">Target Companies</h2>
              <p className="text-xs text-slate-400">We'll suggest roadmaps containing challenges frequently asked by them.</p>
            </div>

            {/* Selected chips */}
            {companies.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-slate-950/30 border border-white/5 min-h-[44px]">
                {companies.map((c) => (
                  <span key={c} onClick={() => toggleCompany(c)} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-cyan/20 border border-brand-cyan/35 text-[10px] font-semibold text-brand-cyan cursor-pointer hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400 transition-colors">
                    {c}
                    <X className="h-3 w-3" />
                  </span>
                ))}
              </div>
            )}

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                placeholder="Search target organizations..."
                className="h-11 w-full rounded-xl border border-white/10 bg-slate-950/40 pl-9 pr-4 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-brand-purple/45"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Popular Suggestions</p>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {filteredCompanySuggestions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { toggleCompany(opt); setCompanySearch(''); }}
                    className="px-3 py-1.5 rounded-lg border border-white/5 bg-slate-950/30 text-[10px] font-semibold text-slate-450 hover:border-brand-purple/35 hover:text-brand-purple transition-all"
                  >
                    + {opt}
                  </button>
                ))}
                {filteredCompanySuggestions.length === 0 && (
                  <div className="text-[10px] text-slate-550 italic py-1">No other suggestions found matching "{companySearch}"</div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={handleBack} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-white/5 bg-slate-950/30 text-xs font-semibold text-slate-400 hover:border-white/15">
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button onClick={handleNext} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-purple text-white shadow-lg shadow-brand-purple/20 hover:brightness-105 transition-all">
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        );

      case 7:
        return (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
            <div className="space-y-1.5 text-center">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">Daily Study Goal</h2>
              <p className="text-xs text-slate-400">Set your daily target to compute custom study sprints.</p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-slate-950/30 p-5 text-center space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-purple">Target Time</p>
                <h3 className="text-3xl font-extrabold text-white tracking-tight">
                  {studyGoal < 60 ? `${studyGoal} mins` : studyGoal === 60 ? '1 hour' : studyGoal === 120 ? '2 hours' : '3+ hours'}
                </h3>
              </div>

              <input
                type="range"
                min="15"
                max="180"
                step="15"
                value={studyGoal}
                onChange={(e) => setStudyGoal(Number(e.target.value))}
                className="w-full h-2 rounded-lg bg-slate-800 appearance-none cursor-pointer accent-brand-cyan"
              />

              <div className="flex justify-between text-[10px] text-slate-500 font-semibold px-1">
                <span>15m</span>
                <span>45m</span>
                <span>1h (Dev)</span>
                <span>2h</span>
                <span>3h+</span>
              </div>

              <div className="flex items-center justify-center gap-2 pt-3 border-t border-white/5 text-xs text-slate-400">
                <Award className="h-4 w-4 text-brand-cyan" />
                <span>Estimated Target: <strong className="text-brand-cyan">{calculatedXp} XP / day</strong></span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button onClick={handleBack} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-white/5 bg-slate-950/30 text-xs font-semibold text-slate-400 hover:border-white/15">
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <button onClick={handleNext} className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-brand-purple text-white shadow-lg shadow-brand-purple/20 hover:brightness-105 transition-all">
                <span>Configure AI</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        );

      case 8:
        return (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8 py-4 text-center">
            <div className="space-y-4">
              <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-cyan/10 border border-brand-cyan/20">
                <Cpu className="h-8 w-8 text-brand-cyan animate-spin" />
              </div>
              <div className="h-6">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={loadingMessageIndex}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="text-xs font-semibold text-slate-350 tracking-tight"
                  >
                    {LOADING_MESSAGES[loadingMessageIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            <div className="space-y-2 max-w-xs mx-auto">
              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-purple to-brand-cyan transition-all duration-75"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-slate-505">{loadingProgress}%</span>
            </div>
          </motion.div>
        );

      case 9:
        return (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
            <div className="space-y-1.5 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-brand-purple/10 border border-brand-purple/20 text-brand-purple mb-1">
                <Sparkles className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-white sm:text-2xl">Personalized roadmap built!</h2>
              <p className="text-xs text-slate-400">Here is a quick look at your custom preparation metrics.</p>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              <div className="rounded-xl border border-white/5 bg-slate-950/30 p-3 space-y-1 text-left">
                <Layers className="h-4 w-4 text-brand-cyan" />
                <h4 className="text-[11px] font-bold text-slate-200">Your Roadmap</h4>
                <p className="text-[9px] text-slate-405 leading-normal">Custom path tailored for {branch || 'Engineering'} with {goal.length} key goals.</p>
              </div>

              <div className="rounded-xl border border-white/5 bg-slate-950/30 p-3 space-y-1 text-left">
                <Code className="h-4 w-4 text-brand-purple" />
                <h4 className="text-[11px] font-bold text-slate-200">Recommended DSA</h4>
                <p className="text-[9px] text-slate-405 leading-normal">Challenges centered around {codingLevel || 'Intermediate'} difficulty structures.</p>
              </div>

              <div className="rounded-xl border border-white/5 bg-slate-950/30 p-3 space-y-1 text-left">
                <Zap className="h-4 w-4 text-brand-cyan" />
                <h4 className="text-[11px] font-bold text-slate-200">Daily Missions</h4>
                <p className="text-[9px] text-slate-405 leading-normal">Complete targets to hit your daily target of {calculatedXp} XP.</p>
              </div>

              <div className="rounded-xl border border-white/5 bg-slate-950/30 p-3 space-y-1 text-left">
                <Flame className="h-4 w-4 text-brand-purple" />
                <h4 className="text-[11px] font-bold text-slate-200">Coding Streak</h4>
                <p className="text-[9px] text-slate-405 leading-normal">Solve consecutively to unlock placement readiness scoring.</p>
              </div>

              <div className="rounded-xl border border-white/5 bg-slate-950/30 p-3 space-y-1 text-left">
                <Users className="h-4 w-4 text-brand-cyan" />
                <h4 className="text-[11px] font-bold text-slate-200">Interview Prep</h4>
                <p className="text-[9px] text-slate-405 leading-normal">Practice prompts curated for {companies.slice(0, 2).join(', ') || 'Dream Tier'} companies.</p>
              </div>

              <div className="rounded-xl border border-white/5 bg-slate-950/30 p-3 space-y-1 text-left">
                <BarChart3 className="h-4 w-4 text-brand-purple" />
                <h4 className="text-[11px] font-bold text-slate-200">Aptitude Plan</h4>
                <p className="text-[9px] text-slate-405 leading-normal">Quant, Logical & Verbal shortcuts calibrated for placements.</p>
              </div>
            </div>

            <button
              onClick={saveOnboarding}
              disabled={saving}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-purple to-brand-cyan text-xs font-semibold text-white shadow-lg shadow-brand-purple/20 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
            >
              <span>{saving ? 'Saving Profile...' : 'Start Learning'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg-base)] px-4 py-6 text-slate-100 sm:px-6">
      {/* Background radial effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-20" />
      <div className="absolute -top-40 -left-40 h-[400px] w-[400px] rounded-full bg-brand-purple/10 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 h-[400px] w-[400px] rounded-full bg-brand-cyan/10 blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-lg">
        {/* Progress Header */}
        {step < 8 && (
          <div className="mb-6 space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <span>Personalization Steps</span>
              <span>Step {step} of 7</span>
            </div>
            <div className="h-1 w-full rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-brand-cyan transition-all duration-200"
                style={{ width: `${(step / 7) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="glass-panel p-5 sm:p-6 text-slate-200">
          <AnimatePresence mode="wait">
            {renderStepContent()}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
