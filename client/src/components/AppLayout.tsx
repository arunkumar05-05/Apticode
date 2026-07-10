import React from 'react';
import { 
  LayoutDashboard, BookOpen, Code, Mic, Brain, 
  FileText, Award, BarChart2, Shield, LogOut, Zap, Menu, X, Sparkles,
  Sun, Moon, Search, Bell, ChevronDown
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

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['STUDENT'] },
  { id: 'aptitude', label: 'Aptitude Prep', icon: BookOpen, roles: ['STUDENT'] },
  { id: 'coding', label: 'Coding Arena', icon: Code, roles: ['STUDENT'] },
  { id: 'communication', label: 'Verbal & Speech', icon: Mic, roles: ['STUDENT'] },
  { id: 'interview', label: 'Mock Interviews', icon: Brain, roles: ['STUDENT'] },
  { id: 'resume', label: 'AI Resume Audit', icon: FileText, roles: ['STUDENT'] },
  { id: 'leaderboard', label: 'Leaderboard', icon: Award, roles: ['STUDENT'] },
  { id: 'analytics', label: 'Cohort Insights', icon: BarChart2, roles: ['STUDENT'] },
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
  return (
    <div className="min-h-screen bg-obsidian-950 text-slate-100 flex font-sans antialiased">
      {/* Mobile Sidebar Backdrop Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-35 bg-slate-950/60 backdrop-blur-sm md:hidden cursor-pointer" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside className={`fixed md:relative top-0 bottom-0 left-0 z-40 bg-slate-900/85 backdrop-blur-md border-r border-white/5 p-4 flex flex-col justify-between transition-all duration-300 ${
        sidebarOpen 
          ? 'translate-x-0 w-[290px]' 
          : '-translate-x-full md:translate-x-0 md:w-[84px]'
      }`}>
        <div className="space-y-8">
          {/* Logo Brand */}
          <div className={`flex items-center justify-between h-[72px] pb-3 border-b border-slate-800/10 brand-header-border ${sidebarOpen ? '' : 'justify-center'}`}>
            <div className="brand-logo-wrapper flex items-center space-x-3.5 cursor-pointer animate-fade-in" onClick={() => setCurrentView(user?.role === 'ADMIN' ? 'admin' : 'dashboard')}>
              <div className="brand-logo-container">
                <img src="/favicon.svg" alt="AptiCode Logo" className="w-5.5 h-5.5" />
              </div>
              {sidebarOpen && (
                <span className="font-extrabold text-[19px] brand-logo-text leading-none select-none">
                  Apti<span className="brand-logo-code">Code</span>
                </span>
              )}
            </div>
            {sidebarOpen && (
              <button 
                onClick={() => setSidebarOpen(false)}
                className="hidden md:flex p-1.5 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-850 text-slate-455 hover:text-white cursor-pointer"
                title="Collapse Sidebar"
              >
                <ChevronDown className="w-4 h-4 -rotate-90" />
              </button>
            )}
            <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5 text-slate-400 hover:text-white" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems
              .filter((item) => user && (item.roles as readonly string[]).includes(user.role))
              .map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentView(item.id);
                      if (window.innerWidth < 768) setSidebarOpen(false);
                    }}
                    className={`w-full flex items-center rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                      sidebarOpen ? 'space-x-3 px-3.5 py-3' : 'justify-center p-2.5'
                    } ${
                      isActive 
                        ? 'premium-active-nav shadow'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/30'
                    }`}
                    title={sidebarOpen ? undefined : item.label}
                  >
                    <div className={`p-1.5 rounded-full flex items-center justify-center transition-all ${
                      isActive ? 'bg-brand-purple/20 text-brand-purple' : 'bg-slate-900 border border-slate-850 text-slate-450'
                    }`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    {sidebarOpen && <span className="animate-fade-in">{item.label}</span>}
                  </button>
                );
              })}
          </nav>
        </div>

        {/* User profile footer */}
        <div className="pt-4 border-t border-white/5 space-y-4">
          <div className={`flex items-center p-2 rounded-xl bg-slate-950/20 border border-slate-850/50 ${sidebarOpen ? 'space-x-3' : 'justify-center'}`}>
            <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-black text-brand-cyan shrink-0">
              {user ? user.name.split(' ').map((n: string) => n[0]).join('') : 'RS'}
            </div>
            {sidebarOpen && (
              <div className="text-left animate-fade-in">
                <p className="text-xs font-bold text-slate-200">{user ? user.name : 'Rahul Sharma'}</p>
                <p className="text-[10px] text-slate-500 font-mono">
                  {user?.role === 'ADMIN' ? 'Administrator' : `Level: ${level}`}
                </p>
              </div>
            )}
          </div>
          
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors ${
              sidebarOpen ? 'space-x-2 px-3 py-2 text-xs font-semibold' : 'justify-center p-2'
            }`}
            title={sidebarOpen ? undefined : "Sign Out"}
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-0">
        {/* Header Bar */}
        <header className="glass-panel border-b border-slate-800/10 py-5 px-6 md:px-12 flex justify-between items-center z-30 sticky top-0">
          <div className="flex items-center space-x-6 flex-1 max-w-lg">
            {(!sidebarOpen || window.innerWidth < 768) && (
              <button 
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded-lg hover:bg-slate-900 border border-transparent hover:border-slate-850 text-slate-450 hover:text-white cursor-pointer"
                title="Expand Sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            <h1 className="hidden lg:block text-base font-extrabold text-slate-100 tracking-tight uppercase shrink-0">
              {navItems.find((n) => n.id === currentView)?.label || 'Workspace'}
            </h1>
            
            {/* Search Box */}
            <div className="relative w-full max-w-xs hidden sm:block">
              <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search resources, topics..."
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-850 text-slate-300 text-xs rounded-full outline-none focus:border-brand-purple/50 focus:bg-slate-950 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Streak indicator */}
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-850 text-xs font-bold text-orange-500">
              <Zap className="w-4 h-4 fill-orange-500" />
              <span>12d Streak</span>
            </div>

            {/* XP indicator */}
            <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-850 text-xs font-bold text-brand-cyan">
              <Sparkles className="w-3.5 h-3.5 fill-brand-cyan/25" />
              <span>{xp.toLocaleString()} XP</span>
            </div>

            {/* Notification Icon */}
            <button className="p-2 rounded-full bg-slate-900 border border-slate-850 hover:bg-slate-850 text-slate-400 hover:text-white relative cursor-pointer">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            </button>

            {/* Theme Toggle button */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full bg-slate-900 border border-slate-850 hover:bg-slate-850 text-slate-455 hover:text-white cursor-pointer transition-all flex items-center justify-center"
              title="Toggle Light/Dark Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400 fill-amber-400/10" /> : <Moon className="w-4 h-4 text-indigo-400 fill-indigo-400/10" />}
            </button>

            {/* Premium AI Coach button */}
            <button 
              onClick={() => setAiCoachOpen(true)}
              className="flex items-center space-x-1.5 px-4.5 py-2 rounded-full bg-gradient-to-r from-brand-purple to-brand-cyan text-white text-xs font-black hover:scale-[1.03] active:scale-[0.98] cursor-pointer shadow-lg shadow-brand-purple/20 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 fill-white/20 animate-pulse" />
              <span>AI Coach</span>
            </button>

            {/* Profile Dropdown */}
            <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-850 cursor-pointer group">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-purple to-brand-cyan flex items-center justify-center text-[10px] font-black text-white shadow shadow-brand-purple/15">
                {user ? user.name.split(' ').map((n: string) => n[0]).join('') : 'RS'}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
            </div>
          </div>
        </header>

        {/* View container */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
