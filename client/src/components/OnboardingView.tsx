import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, Check, Search, Calendar, Award,
  Target, Cpu, Compass, BookOpen, Layers, Zap, Flame,
  BarChart3, Star, Sparkles, X, Code, Users
} from 'lucide-react';
import { apiFetch, ApiError } from '../config/api';
import { LiquidBackdrop } from './ui/LiquidBackdrop';
import { NeoSlider } from './ui/NeoKey';

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

const stepButtonBase = 'flex h-12 flex-1 items-center justify-center gap-2 rounded-full text-xs font-bold transition-all';

export default function OnboardingView({ onComplete, userEmail }: OnboardingViewProps) {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState<string[]>([]);
  const [year, setYear] = useState('');
  const [branch, setBranch] = useState('');
  const [codingLevel, setCodingLevel] = useState('');
  const [companies, setCompanies] = useState<string[]>([]);
  const [studyGoal, setStudyGoal] = useState(60);
  const [branchSearch, setBranchSearch] = useState('');
  const [companySearch, setCompanySearch] = useState('');
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [college, setCollege] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [saveErrors, setSaveErrors] = useState<{ field: string; message: string }[]>([]);

  const handleNext = useCallback(() => {
    if (step === 2 && goal.length === 0) return;
    if (step === 3 && !year) return;
    if (step === 4 && !branch) return;
    if (step === 5 && !codingLevel) return;
    setStep(prev => prev + 1);
  }, [step, goal.length, year, branch, codingLevel]);

  useEffect(() => {
    if (step === 9) {
      setSkillsInput(prev => (prev.trim() ? prev : companies.join(', ')));
    }
  }, [step, companies]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && step < 8 && step !== 4 && step !== 6) {
        handleNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, handleNext]);

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

  const handleBack = () => {
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleSkip = () => {
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

  const calculatedXp = useMemo(() => {
    return studyGoal * 5;
  }, [studyGoal]);

  const saveOnboarding = async () => {
    setSaving(true);
    setSaveErrors([]);
    const gradYearNum = year?.includes('Third') ? 2026 : (year?.includes('Final') ? 2025 : 2027);
    const generatedBio = `Targeting ${goal.join(', ') || 'Software Engineering'} placement roles. Preferred Companies: ${companies.join(', ') || 'Dream Companies'}. Coding level: ${codingLevel || 'Intermediate'}.`;
    const finalSkills = skillsInput.trim() || companies.join(', ');

    const onboardingPayload = {
      email: userEmail,
      college: college.trim(),
      branch: branch || 'Computer Science',
      department: branch || 'Computer Science',
      graduationYear: gradYearNum,
      skills: finalSkills,
      bio: generatedBio,
      phone: phone.trim(),
      registerNumber: registerNumber.trim(),
      goal,
      year,
      codingLevel,
      companies,
      studyGoal,
      isOnboarded: true,
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      const sessionStr = localStorage.getItem('apticode-user-session');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        if (session.token) {
          // fullName has no input on this step — fall back to a derived name
          // from email (mirrors the server's formatHumanName) so the required
          // field can never block onboarding.
          const nameHandle = (session.email || userEmail || '').split('@')[0].replace(/[^A-Za-z0-9]/g, '');
          const derivedName =
            session.name && session.name.trim().length >= 2
              ? session.name.trim()
              : nameHandle
                ? nameHandle.charAt(0).toUpperCase() + nameHandle.slice(1)
                : 'Student';
          const resData = await apiFetch<{ status?: string; profile?: any }>('/profile', {
            method: 'PUT',
            body: JSON.stringify({
              fullName: derivedName,
              email: session.email || userEmail,
              college: college.trim(),
              branch: branch || 'Computer Science',
              department: branch || 'Computer Science',
              graduationYear: gradYearNum,
              skills: finalSkills,
              bio: generatedBio,
              phone: phone.trim(),
              registerNumber: registerNumber.trim(),
              isOnboarded: true
            })
          });
          setSaveErrors([]);
        }
      }
    } catch (err) {
      // 400 { status:'fail', errors:[{field,message}] } arrives as ApiError — show the
      // field errors and abort onboarding instead of silently completing it.
      if (err instanceof ApiError) {
        setSaveErrors(
          Array.isArray(err.payload?.errors)
            ? err.payload.errors
            : [{ field: '', message: err.message || 'Could not save profile details.' }]
        );
        setSaving(false);
        return;
      }
      console.warn('[Onboarding] API sync error:', err);
    }

    const storageKey = userEmail ? `onboarding_${userEmail}` : 'onboarding_sandbox';
    localStorage.setItem(storageKey, JSON.stringify(onboardingPayload));
    if (userEmail) {
      localStorage.setItem(`apticode-onboarding-done-${userEmail}`, 'true');
    }
    localStorage.setItem('onboarding_completed', 'true');

    await new Promise(resolve => setTimeout(resolve, 600));

    setSaving(false);
    onComplete(onboardingPayload);
  };

  const cardTitle = (icon: React.ReactNode, title: string, subtitle: string) => (
    <div className="space-y-1.5 text-center">
      <div className="mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-2xl lc-neo text-lc-cyan">
        {icon}
      </div>
      <h2 className="text-lc-text">{title}</h2>
      <p className="text-xs text-lc-text-muted">{subtitle}</p>
    </div>
  );

  const navRow = (...children: React.ReactNode[]) => (
    <div className="flex gap-3 pt-2">{children}</div>
  );

  const backButton = (
    <button onClick={handleBack} className={`${stepButtonBase} lc-neo text-lc-text-muted`}>
      <ArrowLeft className="h-4 w-4" />
      <span>Back</span>
    </button>
  );

  const skipButton = (
    <button onClick={handleSkip} className={`${stepButtonBase} lc-neo text-lc-text-muted/70`}>
      <span>Skip</span>
    </button>
  );

  const nextButton = (disabled: boolean, onClick: () => void, label = 'Next') => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${stepButtonBase} ${disabled
        ? 'lc-neo text-lc-text-muted/60 cursor-not-allowed'
        : 'lc-neo bg-gradient-to-r from-lc-violet to-lc-cyan text-lc-text'}`}
    >
      <span>{label}</span>
      <ArrowRight className="h-4 w-4" />
    </button>
  );

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl lc-neo bg-gradient-to-br from-lc-violet/20 to-lc-cyan/20">
              <Sparkles className="h-10 w-10 text-lc-cyan animate-pulse" />
            </div>
            <div className="space-y-3">
              <h2 className="text-lc-text">Welcome to AptiCode</h2>
              <p className="mx-auto max-w-sm text-sm text-lc-text-muted">
                Let's personalize your placement preparation experience.
              </p>
            </div>
            <button onClick={handleNext} className={`${stepButtonBase} mx-auto flex h-13 w-full max-w-xs lc-neo bg-gradient-to-r from-lc-violet to-lc-cyan text-lc-text`}>
              <span>Continue</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </motion.div>
        );

      case 2:
        return (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
            {cardTitle(<Target className="h-5 w-5" />, 'Select your goal', 'Choose all paths you want to focus on.')}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {GOAL_OPTIONS.map((opt) => {
                const isSelected = goal.includes(opt.id);
                const IconComponent = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => toggleGoal(opt.id)}
                    className={`relative flex flex-col items-start rounded-2xl lc-neo p-4 text-left transition-all ${isSelected
                      ? 'bg-gradient-to-b from-lc-cyan/15 to-transparent'
                      : 'hover:text-lc-text'}`}
                  >
                    <div className="mb-3 flex w-full items-center justify-between">
                      <div className={`rounded-xl p-2 ${isSelected ? 'bg-lc-cyan/15 text-lc-cyan' : 'text-lc-text-muted'}`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      {isSelected && (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-lc-cyan text-lc-text">
                          <Check className="h-3 w-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-lc-text">{opt.title}</h3>
                    <p className="mt-1 text-xs leading-normal text-lc-text-muted">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
            {navRow(backButton, nextButton(goal.length === 0, handleNext))}
          </motion.div>
        );

      case 3:
        return (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
            {cardTitle(<Calendar className="h-5 w-5" />, 'Select year', 'Where are you currently at in your academic path?')}
            <div className="mx-auto max-w-sm space-y-2">
              {YEAR_OPTIONS.map((opt) => {
                const isSelected = year === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => { setYear(opt); handleNext(); }}
                    className={`flex w-full items-center justify-between rounded-full lc-neo px-5 py-3.5 text-left transition-all ${isSelected ? 'bg-gradient-to-r from-lc-violet/20 to-lc-cyan/15 text-lc-text' : 'text-lc-text-muted'}`}
                  >
                    <span className="text-sm font-semibold">{opt}</span>
                    <Calendar className={`h-4 w-4 ${isSelected ? 'text-lc-cyan' : 'text-lc-text-muted/60'}`} />
                  </button>
                );
              })}
            </div>
            {navRow(backButton, skipButton)}
          </motion.div>
        );

      case 4:
        return (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-5">
            {cardTitle(<BookOpen className="h-5 w-5" />, 'Select branch', 'Search and select your engineering department.')}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-lc-text-muted" />
              <input
                value={branchSearch}
                onChange={(e) => setBranchSearch(e.target.value)}
                placeholder="Search branch (e.g. Computer Science)..."
                className="h-11 w-full lc-neo rounded-full pl-10 pr-4 text-xs text-lc-text outline-none placeholder:text-lc-text-muted/60"
              />
            </div>
            <div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto pr-1">
              {filteredBranches.map((opt) => {
                const isSelected = branch === opt;
                return (
                  <button
                    key={opt}
                    onClick={() => setBranch(opt)}
                    className={`rounded-full lc-neo p-3 text-center text-xs font-semibold transition-all ${isSelected ? 'bg-gradient-to-r from-lc-cyan/20 to-lc-violet/15 text-lc-cyan' : 'text-lc-text-muted'}`}
                  >
                    {opt}
                  </button>
                );
              })}
              {filteredBranches.length === 0 && (
                <div className="col-span-2 py-6 text-center text-xs text-lc-text-muted">No branches match your search query.</div>
              )}
            </div>
            {navRow(backButton, nextButton(!branch, handleNext))}
          </motion.div>
        );

      case 5:
        return (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
            {cardTitle(<Code className="h-5 w-5" />, 'Coding experience', 'Help us tailor quiz difficulties and coding tasks.')}
            <div className="space-y-3">
              {CODING_LEVELS.map((opt) => {
                const isSelected = codingLevel === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => { setCodingLevel(opt.id); handleNext(); }}
                    className={`flex w-full flex-col rounded-2xl lc-neo px-5 py-3.5 text-left transition-all ${isSelected ? 'bg-gradient-to-r from-lc-violet/15 to-transparent' : ''}`}
                  >
                    <span className={`text-xs font-bold ${isSelected ? 'text-lc-violet' : 'text-lc-text'}`}>{opt.title}</span>
                    <span className="mt-1 text-[11px] leading-relaxed text-lc-text-muted">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
            {navRow(backButton, skipButton)}
          </motion.div>
        );

      case 6:
        return (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-5">
            {cardTitle(<Star className="h-5 w-5" />, 'Target companies', "We'll suggest roadmaps with challenges they frequently ask.")}
            {companies.length > 0 && (
              <div className="flex min-h-[44px] flex-wrap gap-1.5 rounded-2xl lc-neo p-2">
                {companies.map((c) => (
                  <span key={c} onClick={() => toggleCompany(c)} className="flex cursor-pointer items-center gap-1 rounded-full bg-lc-cyan/20 px-2.5 py-1 text-[10px] font-semibold text-lc-cyan transition-colors hover:bg-lc-rose/20 hover:text-lc-rose">
                    {c}
                    <X className="h-3 w-3" />
                  </span>
                ))}
              </div>
            )}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-lc-text-muted" />
              <input
                value={companySearch}
                onChange={(e) => setCompanySearch(e.target.value)}
                placeholder="Search target organizations..."
                className="h-11 w-full lc-neo rounded-full pl-10 pr-4 text-xs text-lc-text outline-none placeholder:text-lc-text-muted/60"
              />
            </div>
            <div className="space-y-1.5 text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-lc-text-muted">Popular suggestions</p>
              <div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto pr-1">
                {filteredCompanySuggestions.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => { toggleCompany(opt); setCompanySearch(''); }}
                    className="lc-neo lc-neo-pill px-3 py-1.5 text-[10px] font-semibold text-lc-text-muted transition-all hover:text-lc-violet"
                  >
                    + {opt}
                  </button>
                ))}
                {filteredCompanySuggestions.length === 0 && (
                  <div className="py-1 text-[10px] italic text-lc-text-muted">No other suggestions found matching "{companySearch}"</div>
                )}
              </div>
            </div>
            {navRow(backButton, nextButton(false, handleNext, 'Continue'))}
          </motion.div>
        );

      case 7:
        return (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
            {cardTitle(<Zap className="h-5 w-5" />, 'Daily study goal', 'Set your daily target to compute custom study sprints.')}
            <div className="space-y-4 rounded-2xl lc-neo p-5 text-center">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-widest text-lc-violet">Target time</p>
                <h3 className="font-display text-3xl font-extrabold tracking-tight text-lc-text">
                  {studyGoal < 60 ? `${studyGoal} mins` : studyGoal === 60 ? '1 hour' : studyGoal === 120 ? '2 hours' : '3+ hours'}
                </h3>
              </div>
              <NeoSlider
                value={studyGoal}
                onChange={setStudyGoal}
                min={15}
                max={180}
                step={15}
                label="Daily minutes"
              />
              <div className="flex justify-between px-1 text-[10px] font-semibold text-lc-text-muted">
                <span>15m</span>
                <span>45m</span>
                <span>1h (Dev)</span>
                <span>2h</span>
                <span>3h+</span>
              </div>
              <div className="flex items-center justify-center gap-2 border-t border-lc-glass-border pt-3 text-xs text-lc-text-muted">
                <Award className="h-4 w-4 text-lc-cyan" />
                <span>Estimated target: <strong className="text-lc-cyan">{calculatedXp} XP / day</strong></span>
              </div>
            </div>
            {navRow(backButton, nextButton(false, handleNext, 'Configure AI'))}
          </motion.div>
        );

      case 8:
        return (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-8 py-4 text-center">
            <div className="space-y-4">
              <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl lc-neo">
                <Cpu className="h-8 w-8 animate-spin text-lc-cyan" />
              </div>
              <div className="h-6">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={loadingMessageIndex}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.15 }}
                    className="font-mono text-xs font-semibold tracking-tight text-lc-text"
                  >
                    {LOADING_MESSAGES[loadingMessageIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
            <div className="mx-auto max-w-xs space-y-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-lc-void/40">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-lc-violet to-lc-cyan transition-all duration-75"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              <span className="font-mono text-[10px] text-lc-text-muted">{loadingProgress}%</span>
            </div>
          </motion.div>
        );

      case 9:
        return (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="space-y-6">
            {cardTitle(<Sparkles className="h-5 w-5 text-lc-violet" />, 'Personalized roadmap built!', 'Here is a quick look at your custom preparation metrics.')}
            <div className="grid max-h-60 grid-cols-2 gap-2 overflow-y-auto pr-1">
              <div className="space-y-1 rounded-2xl lc-neo p-3 text-left">
                <Layers className="h-4 w-4 text-lc-cyan" />
                <h4 className="text-[11px] font-bold text-lc-text">Your Roadmap</h4>
                <p className="text-[9px] leading-normal text-lc-text-muted">Custom path tailored for {branch || 'Engineering'} with {goal.length} key goals.</p>
              </div>
              <div className="space-y-1 rounded-2xl lc-neo p-3 text-left">
                <Code className="h-4 w-4 text-lc-violet" />
                <h4 className="text-[11px] font-bold text-lc-text">Recommended DSA</h4>
                <p className="text-[9px] leading-normal text-lc-text-muted">Challenges centered around {codingLevel || 'Intermediate'} difficulty structures.</p>
              </div>
              <div className="space-y-1 rounded-2xl lc-neo p-3 text-left">
                <Zap className="h-4 w-4 text-lc-cyan" />
                <h4 className="text-[11px] font-bold text-lc-text">Daily Missions</h4>
                <p className="text-[9px] leading-normal text-lc-text-muted">Complete targets to hit your daily target of {calculatedXp} XP.</p>
              </div>
              <div className="space-y-1 rounded-2xl lc-neo p-3 text-left">
                <Flame className="h-4 w-4 text-lc-violet" />
                <h4 className="text-[11px] font-bold text-lc-text">Coding Streak</h4>
                <p className="text-[9px] leading-normal text-lc-text-muted">Solve consecutively to unlock placement readiness scoring.</p>
              </div>
              <div className="space-y-1 rounded-2xl lc-neo p-3 text-left">
                <Users className="h-4 w-4 text-lc-cyan" />
                <h4 className="text-[11px] font-bold text-lc-text">Interview Prep</h4>
                <p className="text-[9px] leading-normal text-lc-text-muted">Practice prompts curated for {companies.slice(0, 2).join(', ') || 'Dream Tier'} companies.</p>
              </div>
              <div className="space-y-1 rounded-2xl lc-neo p-3 text-left">
                <BarChart3 className="h-4 w-4 text-lc-violet" />
                <h4 className="text-[11px] font-bold text-lc-text">Aptitude Plan</h4>
                <p className="text-[9px] leading-normal text-lc-text-muted">Quant, Logical & Verbal shortcuts calibrated for placements.</p>
              </div>
            </div>
            <div className="space-y-3 rounded-2xl lc-neo p-4 text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-lc-text-muted">Profile details</p>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-lc-text-muted">College</label>
                  <input
                    type="text"
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="Your college name"
                    className="h-10 w-full lc-neo rounded-full px-4 text-xs text-lc-text outline-none placeholder:text-lc-text-muted/60"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-lc-text-muted">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+919876543210"
                    className="h-10 w-full lc-neo rounded-full px-4 text-xs text-lc-text outline-none placeholder:text-lc-text-muted/60"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-lc-text-muted">Register Number</label>
                  <input
                    type="text"
                    value={registerNumber}
                    onChange={(e) => setRegisterNumber(e.target.value)}
                    placeholder="e.g. 22CS001"
                    className="h-10 w-full lc-neo rounded-full px-4 text-xs text-lc-text outline-none placeholder:text-lc-text-muted/60"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold text-lc-text-muted">Skills</label>
                  <input
                    type="text"
                    value={skillsInput}
                    onChange={(e) => setSkillsInput(e.target.value)}
                    placeholder="e.g. Python, React, DSA"
                    className="h-10 w-full lc-neo rounded-full px-4 text-xs text-lc-text outline-none placeholder:text-lc-text-muted/60"
                  />
                </div>
              </div>
              {saveErrors.length > 0 && (
                <div className="rounded-2xl border border-lc-rose/30 bg-lc-rose/10 p-3">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-lc-rose">Fix the following</p>
                  <ul className="space-y-1">
                    {saveErrors.map((err, i) => (
                      <li key={i} className="text-[11px] text-lc-rose">{err.field ? `${err.field}: ` : ''}{err.message}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <button
              onClick={saveOnboarding}
              disabled={saving}
              className={`${stepButtonBase} w-full lc-neo bg-gradient-to-r from-lc-violet to-lc-cyan text-lc-text disabled:opacity-50`}
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-6 sm:px-6">
      <LiquidBackdrop />

      <div className="grid w-full max-w-5xl items-start gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block relative"
          >
            <div className="lc-glass h-80 overflow-hidden" style={{ background: 'radial-gradient(circle at 50% 50%, var(--lc-brand-violet) 0%, transparent 70%)' }}>
            </div>
            <div className="mt-5 space-y-2">
              <p className="font-mono text-xs uppercase tracking-[0.22em] text-lc-cyan">Personalization engine</p>
              <p className="text-sm leading-6 text-lc-text-muted">
                Every step refines your roadmap — visual patterns represent your learning path taking shape.
              </p>
            </div>
          </motion.div>

        <div className="w-full max-w-lg mx-auto lg:mx-0">
          {step < 8 && (
            <div className="mb-5 space-y-2">
              <div className="flex justify-between font-mono text-[10px] font-bold uppercase tracking-wider text-lc-text-muted">
                <span>Personalization steps</span>
                <span className="lc-neo lc-neo-pill px-2 py-0.5 text-lc-cyan">Step {step} of 7</span>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-lc-void/40">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-lc-violet to-lc-cyan transition-all duration-200"
                  style={{ width: `${(step / 7) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="lc-glass p-5 text-lc-text sm:p-6">
            <AnimatePresence mode="wait">
              {renderStepContent()}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
