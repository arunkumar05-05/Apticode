import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, Code, Mic, Brain,
  FileText, Award, BarChart2, Shield, LogOut, Menu, X, Sparkles,
  Sun, Moon, Search, Bell, ChevronDown, Building2, ClipboardCheck, User
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  currentView: string;
  setCurrentView: (view: any) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  xp: number;
  level: string;
  user: any;
  handleLogout: () => void;
  toggleTheme: () => void;
  theme: 'dark' | 'light';
  setAiCoachOpen: (open: boolean) => void;
}

function getAvatarInitial(name?: string, email?: string): string {
  let raw = name || '';
  if (!raw || raw.includes('@')) {
    raw = email ? email.split('@')[0] : 'User';
  }
  let cleaned = raw.replace(/^[0-9]+[a-zA-Z]*/, '').trim();
  if (!cleaned) {
    cleaned = raw.replace(/^[0-9]+/, '').trim();
  }
  if (!cleaned) {
    cleaned = raw;
  }
  const match = cleaned.match(/[a-zA-Z]/);
  if (match) {
    return match[0].toUpperCase();
  }
  return raw.charAt(0).toUpperCase() || 'A';
}

function formatHumanName(rawName?: string, email?: string): string {
  let name = rawName?.trim();
  if (!name || name === 'New Candidate' || name.includes('@')) {
    if (email) {
      name = email.split('@')[0];
    }
  }

  if (!name) return 'Candidate';

  let cleaned = name.replace(/^[0-9]{2}(it|cs|cse|ece|eee|mech|civil|ai|ds)?/i, '');
  if (!cleaned) cleaned = name;

  cleaned = cleaned.replace(/[._-]/g, ' ');
  cleaned = cleaned.replace(/([a-z])([A-Z])/g, '$1 $2');

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length > 0) {
    const formatted = words
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
    if (formatted.length >= 2) return formatted;
  }

  return name.charAt(0).toUpperCase() + name.slice(1);
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['STUDENT'] },
  { id: 'aptitude', label: 'Aptitude Prep', icon: BookOpen, roles: ['STUDENT'] },
  { id: 'coding', label: 'Coding Arena', icon: Code, roles: ['STUDENT'] },
  { id: 'company', label: 'Company Roadmaps', icon: Building2, roles: ['STUDENT'] },
  { id: 'mocktest', label: 'Mock Tests', icon: ClipboardCheck, roles: ['STUDENT'] },
  { id: 'communication', label: 'Verbal & Speech', icon: Mic, roles: ['STUDENT'] },
  { id: 'interview', label: 'Mock Interviews', icon: Brain, roles: ['STUDENT'] },
  { id: 'resume', label: 'AI Resume Audit', icon: FileText, roles: ['STUDENT'] },
  { id: 'leaderboard', label: 'Leaderboard', icon: Award, roles: ['STUDENT'] },
  { id: 'analytics', label: 'Cohort Insights', icon: BarChart2, roles: ['STUDENT'] },
  { id: 'profile', label: 'My Profile', icon: User, roles: ['STUDENT'] },
  { id: 'admin', label: 'Control Room', icon: Shield, roles: ['ADMIN'] }
] as const;

export default function AppLayout({
  children,
  currentView,
  setCurrentView,
  sidebarOpen,
  setSidebarOpen,
  xp,
  level,
  user,
  handleLogout,
  toggleTheme,
  theme,
  setAiCoachOpen
}: AppLayoutProps) {
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const [notifications] = React.useState([
    { id: '1', title: 'AI ATS Audit Finished', time: '10m ago', read: false, text: 'Your resume was successfully audited with suggestions.' },
    { id: '2', title: 'Daily Coding streak preserved!', time: '2h ago', read: true, text: 'Keep coding to secure your 12-day streak!' },
    { id: '3', title: 'Cohort test unlocked', time: '1d ago', read: true, text: 'Solve Quantitative questions to unlock level 3.' }
  ]);

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="flex min-h-screen md:flex-row flex-col bg-[var(--bg-base)] text-slate-100 antialiased">
      {sidebarOpen && (
        <div className="fixed inset-0 z-35 cursor-pointer bg-slate-950/60 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed left-0 top-0 bottom-0 z-40 flex flex-col justify-between border-r border-white/10 bg-slate-900/90 p-4 backdrop-blur-xl transition-all duration-300 md:relative md:w-[280px] md:translate-x-0 ${sidebarOpen ? 'w-[280px] translate-x-0' : '-translate-x-full md:w-[84px]'}`}>
        <div className="space-y-6">
          <div className={`flex items-center justify-between border-b border-white/10 pb-4 ${sidebarOpen ? '' : 'justify-center'}`}>
            <div className="flex cursor-pointer items-center gap-3" onClick={() => setCurrentView(user?.role === 'ADMIN' ? 'admin' : 'dashboard')}>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple to-brand-cyan shadow-lg shadow-brand-purple/20">
                <img src="/favicon.svg" alt="AptiCode Logo" className="h-6 w-6" />
              </div>
              {sidebarOpen && <span className="text-lg font-semibold tracking-tight">Apti<span className="text-brand-cyan">Code</span></span>}
            </div>
            {sidebarOpen && (
              <button onClick={() => setSidebarOpen(false)} className="hidden rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white md:inline-flex" title="Collapse sidebar">
                <ChevronDown className="h-4 w-4 -rotate-90" />
              </button>
            )}
            <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5 text-slate-400" />
            </button>
          </div>

          <nav className="space-y-1.5">
            {navItems.filter((item) => user && (item.roles as readonly string[]).includes(user.role)).map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentView(item.id);
                    if (window.innerWidth < 768) setSidebarOpen(false);
                  }}
                  className={`flex w-full items-center rounded-[14px] px-3 py-3 text-sm font-semibold transition-all ${sidebarOpen ? 'justify-start gap-3' : 'justify-center'} ${isActive ? 'premium-active-nav' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                >
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3 border-t border-white/10 pt-4">
          <div className={`flex items-center rounded-[16px] border border-white/10 bg-slate-950/30 p-2 ${sidebarOpen ? 'gap-3' : 'justify-center'}`}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-cyan text-sm font-semibold text-white">
              {getAvatarInitial(user?.name, user?.email)}
            </div>
            {sidebarOpen && (
              <div>
                <p className="text-sm font-semibold text-slate-100">{formatHumanName(user?.name, user?.email)}</p>
                <p className="text-[11px] text-slate-500">{user?.role === 'ADMIN' ? 'Administrator' : `Level: ${level}`}</p>
              </div>
            )}
          </div>
          <button onClick={handleLogout} className={`flex w-full items-center rounded-[14px] px-3 py-2.5 text-sm font-semibold text-slate-400 transition-all hover:bg-red-500/10 hover:text-red-400 ${sidebarOpen ? 'justify-start gap-2' : 'justify-center'}`}>
            <LogOut className="h-4 w-4" />
            {sidebarOpen && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <motion.header initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="sticky top-0 z-30 border-b border-white/10 bg-white/70 px-3 py-3 backdrop-blur-xl dark:bg-slate-950/70 sm:px-5 lg:px-8">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              {!sidebarOpen && (
                <button onClick={() => setSidebarOpen(true)} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-100 text-slate-600 dark:bg-slate-900 dark:text-slate-300" aria-label="Open navigation">
                  <Menu className="h-5 w-5" />
                </button>
              )}
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple to-brand-cyan shadow-lg shadow-brand-purple/20">
                  <img src="/favicon.svg" alt="AptiCode Logo" className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-100">Apti<span className="text-brand-cyan">Code</span></p>
                  <p className="truncate text-[10px] uppercase tracking-[0.24em] text-slate-500">Mobile learning hub</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setNotificationsOpen((v) => !v)} className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-100 text-slate-600 transition-all hover:-translate-y-0.5 dark:bg-slate-900 dark:text-slate-300" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                {hasUnread && <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-red-500" />}
              </button>
              <button onClick={toggleTheme} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-100 text-slate-600 transition-all hover:-translate-y-0.5 dark:bg-slate-900 dark:text-slate-300" aria-label="Toggle theme">
                {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-indigo-400" />}
              </button>
              <button onClick={() => setCurrentView('profile')} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-slate-100 text-slate-600 transition-all hover:-translate-y-0.5 dark:bg-slate-900 dark:text-slate-300" aria-label="Profile">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-cyan text-xs font-semibold text-white">
                  {getAvatarInitial(user?.name, user?.email)}
                </div>
              </button>
            </div>
          </div>

          {notificationsOpen && (
            <div className="mx-auto mt-3 max-w-7xl rounded-[20px] border border-white/10 bg-slate-950/90 p-3 shadow-2xl">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-100">Notifications</h3>
                <span className="text-[11px] text-brand-cyan">{notifications.filter((n) => !n.read).length} new</span>
              </div>
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div key={n.id} className={`rounded-[16px] border p-3 ${n.read ? 'border-white/10 bg-slate-900/70' : 'border-brand-purple/20 bg-brand-purple/10'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-100">{n.title}</p>
                      <span className="text-[10px] text-slate-500">{n.time}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">{n.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.header>

        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-3 py-4 pb-24 sm:px-5 lg:px-8 lg:py-6 lg:pb-8">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="w-full">
            {children}
          </motion.div>
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-white/80 px-2 pb-[max(0.7rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl dark:bg-slate-950/80 md:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-around gap-1">
          {navItems.filter((item) => (item.roles as readonly string[]).includes(user?.role || 'STUDENT') && ['dashboard', 'coding', 'interview', 'resume', 'leaderboard'].some((id) => id === item.id)).map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id);
                  setSidebarOpen(false);
                }}
                className={`flex min-h-[56px] flex-1 flex-col items-center justify-center rounded-[16px] px-2 py-1.5 text-[10px] font-semibold transition-all active:scale-95 ${isActive ? 'bg-brand-purple/10 text-slate-100' : 'text-slate-500'}`}
              >
                <div className={`mb-1 flex h-9 w-9 items-center justify-center rounded-full ${isActive ? 'bg-gradient-to-br from-brand-purple to-brand-cyan text-white shadow-lg shadow-brand-purple/20' : 'bg-slate-100 text-slate-500 dark:bg-slate-900'}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
                <span>{item.label === 'AI Resume Audit' ? 'Resume' : item.label === 'Mock Interviews' ? 'Interview' : item.label === 'Coding Arena' ? 'Practice' : item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
