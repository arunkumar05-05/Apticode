import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, Code, Mic, Brain,
  FileText, Award, BarChart2, Shield, LogOut, Menu, X, Sparkles,
  Sun, Moon, Search, Bell, Building2, ClipboardCheck, User, Zap, ChevronLeft
} from 'lucide-react';
import { LiquidBackdrop } from './ui/LiquidBackdrop';

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
  let raw = name?.trim() || '';
  if (!raw || raw === 'New Candidate' || raw.includes('@')) {
    const saved = email ? localStorage.getItem(`apticode_user_name_${email.trim()}`) || localStorage.getItem(`signup_fullname_${email.trim()}`) : null;
    raw = saved || (email ? email.split('@')[0] : 'User');
  }
  const match = raw.match(/[a-zA-Z]/);
  return match ? match[0].toUpperCase() : 'A';
}

function formatHumanName(rawName?: string, email?: string): string {
  let name = rawName?.trim();
  if (name && name !== 'New Candidate' && name !== 'Candidate' && !name.includes('@')) {
    return name;
  }
  if (email) {
    const savedSignupName = localStorage.getItem(`signup_fullname_${email.trim()}`) || localStorage.getItem(`apticode_user_name_${email.trim()}`);
    if (savedSignupName && savedSignupName.trim()) {
      return savedSignupName.trim();
    }
    const handle = email.split('@')[0];
    return handle.charAt(0).toUpperCase() + handle.slice(1);
  }
  return 'Candidate';
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
  const xpPct = Math.min((xp % 1000) / 10, 100);

  const goTo = (id: string) => {
    setCurrentView(id);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen md:flex-row flex-col relative">
      <LiquidBackdrop />

      {sidebarOpen && (
        <div className="fixed inset-0 z-35 cursor-pointer bg-lc-void/60 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed left-3 top-3 bottom-3 z-40 flex flex-col justify-between lc-glass p-3 transition-all duration-300 md:relative md:top-0 md:bottom-0 md:left-0 md:rounded-none md:border-y-0 md:border-l-0 ${sidebarOpen ? 'w-[280px]' : '-translate-x-full md:translate-x-0 md:w-[86px]'} ${sidebarOpen ? '' : ''}`}>
        <div className="space-y-4">
          <div className={`flex items-center justify-between pb-3 ${sidebarOpen ? '' : 'justify-center'}`}>
            <div className="flex cursor-pointer items-center gap-2.5" onClick={() => goTo(user?.role === 'ADMIN' ? 'admin' : 'dashboard')}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-lc-violet to-lc-cyan shadow-neo">
                <img src="/favicon.svg" alt="AptiCode Logo" className="h-6 w-6" />
              </div>
              {sidebarOpen && (
                <span className="font-display text-lg font-bold tracking-tight text-lc-text">
                  Apti<span className="lc-text-gradient">Code</span>
                </span>
              )}
            </div>
            {sidebarOpen && (
              <button onClick={() => setSidebarOpen(false)} className="lc-neo p-2 text-lc-text-muted hover:text-lc-text" title="Collapse sidebar">
                <ChevronLeft className="h-4 w-4" />
              </button>
            )}
            {!sidebarOpen && (
              <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
                <X className="h-5 w-5 text-lc-text-muted" />
              </button>
            )}
          </div>

          <nav className="space-y-1.5">
            {navItems.filter((item) => user && (item.roles as readonly string[]).includes(user.role)).map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => goTo(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex w-full items-center rounded-full px-2.5 py-2 text-sm font-semibold transition-all ${sidebarOpen ? 'justify-start gap-2.5' : 'justify-center'} ${isActive
                    ? 'bg-gradient-to-r from-lc-violet/25 to-lc-cyan/25 text-lc-text shadow-[inset_0_0_0_1px_var(--lc-glass-border)]'
                    : 'text-lc-text-muted hover:bg-lc-glass-raised hover:text-lc-text'}`}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-full ${isActive ? 'bg-gradient-to-br from-lc-violet to-lc-cyan text-lc-text shadow-neo' : 'text-lc-text-muted'}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3">
          <div className={`lc-neo rounded-2xl p-3 ${sidebarOpen ? '' : 'hidden md:flex md:justify-center'}`}>
            {sidebarOpen ? (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-lc-text-muted">XP charge</span>
                  <span className="font-mono text-xs text-lc-cyan">{level}</span>
                </div>
                <div className="relative h-2 rounded-full overflow-hidden bg-lc-void/40">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-lc-violet to-lc-cyan"
                    style={{ width: `${xpPct}%`, boxShadow: '0 0 8px var(--lc-brand-violet)' }}
                  />
                </div>
                <p className="mt-2 font-mono text-[11px] tabular-nums text-lc-text-muted">
                  {xp.toLocaleString()} XP
                </p>
              </div>
            ) : (
              <Zap className="h-4 w-4 text-lc-cyan" />
            )}
          </div>

          <button
            onClick={() => setAiCoachOpen(true)}
            className={`lc-neo lc-neo-pill flex w-full items-center gap-2 px-3 py-2.5 text-sm font-semibold text-lc-text ${sidebarOpen ? 'justify-start' : 'justify-center'}`}
          >
            <Sparkles className="h-4 w-4 text-lc-violet" />
            {sidebarOpen && <span>AI Coach</span>}
          </button>

          <div className={`flex items-center lc-glass rounded-2xl p-2 ${sidebarOpen ? 'gap-2.5' : 'justify-center'}`}>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-lc-violet to-lc-cyan text-sm font-semibold text-lc-text">
              {getAvatarInitial(user?.name, user?.email)}
            </div>
            {sidebarOpen && (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-lc-text">{formatHumanName(user?.name, user?.email)}</p>
                <p className="truncate font-mono text-[10px] text-lc-text-muted">{user?.role === 'ADMIN' ? 'Administrator' : `Level ${level}`}</p>
              </div>
            )}
          </div>

          <button onClick={handleLogout} className={`flex w-full items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-lc-rose transition-all hover:bg-lc-rose/10 ${sidebarOpen ? 'justify-start' : 'justify-center'}`}>
            <LogOut className="h-4 w-4" />
            {sidebarOpen && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="sticky top-0 z-30 px-3 pt-3 sm:px-5"
        >
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 lc-glass rounded-2xl px-3 py-2.5 sm:px-4">
            <div className="flex min-w-0 items-center gap-2">
              {!sidebarOpen && (
                <button onClick={() => setSidebarOpen(true)} className="lc-neo flex h-10 w-10 items-center justify-center text-lc-text" aria-label="Open navigation">
                  <Menu className="h-5 w-5" />
                </button>
              )}
              <div className="hidden md:flex items-center lc-neo rounded-full px-3 py-2.5 text-lc-text-muted focus-within:text-lc-text">
                <Search className="h-4 w-4 mr-2" />
                <input
                  placeholder="Search modules…"
                  className="bg-transparent outline-none text-sm placeholder:text-lc-text-muted/60"
                  aria-label="Search"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setAiCoachOpen(true)} className="lc-neo lc-neo-pill hidden sm:flex h-10 items-center gap-2 px-3.5 text-sm font-semibold text-lc-text">
                <Sparkles className="h-4 w-4 text-lc-violet" />
                <span>AI Coach</span>
              </button>
              <button onClick={() => setNotificationsOpen((v) => !v)} className="lc-neo relative flex h-10 w-10 items-center justify-center text-lc-text" aria-label="Notifications">
                <Bell className="h-4 w-4" />
                {hasUnread && <span className="absolute right-3 top-3 h-2 w-2 rounded-full bg-lc-rose" />}
              </button>
              <button onClick={toggleTheme} className="lc-neo flex h-10 w-10 items-center justify-center text-lc-text" aria-label="Toggle theme">
                {theme === 'dark' ? <Sun className="h-4 w-4 text-lc-amber" /> : <Moon className="h-4 w-4 text-lc-violet" />}
              </button>
              <button onClick={() => setCurrentView('profile')} className="lc-neo flex h-10 w-10 items-center justify-center text-lc-text" aria-label="Profile">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-lc-violet to-lc-cyan text-xs font-semibold text-lc-text">
                  {getAvatarInitial(user?.name, user?.email)}
                </div>
              </button>
            </div>
          </div>

          {notificationsOpen && (
            <div className="mx-auto mt-2 max-w-7xl lc-glass p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-display text-sm font-semibold text-lc-text">Notifications</h3>
                <span className="font-mono text-[11px] text-lc-cyan">{notifications.filter((n) => !n.read).length} new</span>
              </div>
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div key={n.id} className={`rounded-2xl border p-3 ${n.read ? 'border-lc-glass-border bg-lc-glass-raised' : 'border-lc-violet/20 bg-lc-violet/10'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-lc-text">{n.title}</p>
                      <span className="font-mono text-[10px] text-lc-text-muted">{n.time}</span>
                    </div>
                    <p className="mt-1 text-sm text-lc-text-muted">{n.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.header>

        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-3 py-4 pb-8 sm:px-5 lg:px-8 lg:py-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="w-full">
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
