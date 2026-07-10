import React, { useState } from 'react';
import { 
  Terminal, LayoutDashboard, BookOpen, Code, Mic, Brain, 
  FileText, Award, BarChart2, Shield, LogOut, Zap, Menu, X, Sparkles,
  Sun, Moon
} from 'lucide-react';
import LandingView from './components/LandingView';
import AuthView from './components/AuthView';
import DashboardView from './components/DashboardView';
import AptitudeView from './components/AptitudeView';
import CodingView from './components/CodingView';
import CommunicationView from './components/CommunicationView';
import InterviewView from './components/InterviewView';
import ResumeView from './components/ResumeView';
import LeaderboardView from './components/LeaderboardView';
import AnalyticsView from './components/AnalyticsView';
import AdminView from './components/AdminView';

type ViewState = 
  | 'landing' | 'auth' | 'dashboard' | 'aptitude' | 'coding' 
  | 'communication' | 'interview' | 'resume' 
  | 'leaderboard' | 'analytics' | 'admin';

interface UserSession {
  name: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
}

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [user, setUser] = useState<UserSession | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [xp, setXp] = useState(24500); // start at master level
  const [level, setLevel] = useState('Master');

  // Dynamic Theme Mode: default to dark
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  React.useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // AI Career Co-Pilot Chat Companion Drawer State
  const [aiCoachOpen, setAiCoachOpen] = useState(false);
  const [coachMessages, setCoachMessages] = useState<Array<{ sender: 'user' | 'coach', text: string }>>([
    { sender: 'coach', text: "Hello! I am your AI Placement Coach. Ask me anything about engineering interviews, arithmetic shortcuts, coding bugs, or resume auditor suggestions." }
  ]);
  const [coachInput, setCoachInput] = useState('');
  const [isCoachThinking, setIsCoachThinking] = useState(false);

  const handleSendCoachMessage = (textToSubmit: string) => {
    if (!textToSubmit.trim() || isCoachThinking) return;

    setCoachMessages(prev => [...prev, { sender: 'user', text: textToSubmit }]);
    setCoachInput('');
    setIsCoachThinking(true);

    setTimeout(() => {
      let replyText = "Based on your current master level metrics:\n\n1. **Aptitude Focus**: You are at 84% accuracy in Quant. Focus on Probability (weak area).\n2. **Google standard prep**: Master 'Permutations' and 'B-Tree' indexing structures.\n3. **Action item**: Complete mock interview chapter 2.";
      
      if (textToSubmit.toLowerCase().includes('time') || textToSubmit.toLowerCase().includes('work')) {
        replyText = "**Quant Cheat Sheet (Time & Work):**\n\n- If A completes work in X days: A's 1-day work = 1/X.\n- Combined efficiency: $(1/A + 1/B) = 1/\\text{Total Days}$.\n- Try solving MCQ Question 2 in the Aptitude dashboard.";
      } else if (textToSubmit.toLowerCase().includes('python') || textToSubmit.toLowerCase().includes('code')) {
        replyText = "**AI Code Optimization Tip:**\n\n- Replace Nested `for` loops $O(N^2)$ with a hash map lookups mapping $O(N)$.\n- Review custom test cases inside Coding Arena.";
      }

      setCoachMessages(prev => [...prev, { sender: 'coach', text: replyText }]);
      setIsCoachThinking(false);
    }, 1000);
  };

  const handleSpendXp = (amount: number): boolean => {
    if (xp >= amount) {
      setXp(prev => {
        const newXp = prev - amount;
        if (newXp < 1000) setLevel('Beginner');
        else if (newXp < 2500) setLevel('Intermediate');
        else if (newXp < 5000) setLevel('Advanced');
        else if (newXp < 10000) setLevel('Expert');
        else if (newXp < 20000) setLevel('Master');
        else setLevel('Placement Ready');
        return newXp;
      });
      return true;
    }
    return false;
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['STUDENT'] },
    { id: 'aptitude', label: 'Aptitude Prep', icon: BookOpen, roles: ['STUDENT'] },
    { id: 'coding', label: 'Coding Arena', icon: Code, roles: ['STUDENT'] },
    { id: 'communication', label: 'Communication Hub', icon: Mic, roles: ['STUDENT'] },
    { id: 'interview', label: 'AI Mock Interview', icon: Brain, roles: ['STUDENT'] },
    { id: 'resume', label: 'ATS Resume Auditor', icon: FileText, roles: ['STUDENT'] },
    { id: 'leaderboard', label: 'Leaderboard', icon: Award, roles: ['STUDENT', 'ADMIN'] },
    { id: 'analytics', label: 'Performance Analytics', icon: BarChart2, roles: ['STUDENT', 'ADMIN'] },
    { id: 'admin', label: 'Admin CMS & Cohorts', icon: Shield, roles: ['ADMIN'] }
  ] as const;

  const handleLogout = () => {
    setUser(null);
    setCurrentView('landing');
  };

  const handleNavigation = (view: string) => {
    setCurrentView(view as ViewState);
  };

  if (currentView === 'landing') {
    return <LandingView onEnterApp={() => setCurrentView(user ? 'dashboard' : 'auth')} />;
  }

  if (currentView === 'auth') {
    return (
      <AuthView
        onAuthenticate={(session) => {
          setUser(session);
          if (session.role === 'ADMIN') {
            setCurrentView('admin');
          } else {
            setCurrentView('dashboard');
          }
        }}
        onBack={() => setCurrentView('landing')}
      />
    );
  }

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
      <aside className={`fixed md:relative top-0 bottom-0 left-0 z-40 w-64 bg-slate-900/85 backdrop-blur-md border-r border-white/5 p-4 flex flex-col justify-between transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="space-y-8">
          {/* Logo Brand */}
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => setCurrentView(user?.role === 'ADMIN' ? 'admin' : 'dashboard')}>
              <img src="/favicon.svg" alt="AptiCode" className="w-7 h-7" />
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Apti<span className="bg-gradient-to-r from-brand-purple to-brand-cyan bg-clip-text text-transparent">Code</span>
              </span>
            </div>
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
                    className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                      isActive 
                        ? 'premium-active-nav bg-gradient-to-r from-brand-purple/20 to-brand-cyan/10 border border-brand-purple/35 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900/40 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-brand-cyan' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
          </nav>
        </div>

        {/* User profile footer */}
        <div className="pt-4 border-t border-white/5 space-y-4">
          <div className="flex items-center space-x-3 p-2">
            <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-black text-brand-cyan">
              {user ? user.name.split(' ').map((n) => n[0]).join('') : 'RS'}
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-slate-200">{user ? user.name : 'Rahul Sharma'}</p>
              <p className="text-[10px] text-slate-500 font-mono">
                {user?.role === 'ADMIN' ? 'Administrator' : `Level: ${level}`}
              </p>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-0">
        {/* Header Bar */}
        <header className="glass-panel border-b border-white/5 py-4 px-6 md:px-8 flex justify-between items-center z-30">
          <div className="flex items-center space-x-3">
            <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5 text-slate-400 hover:text-white" />
            </button>
            <h1 className="text-base font-extrabold text-slate-100 tracking-tight uppercase">
              {navItems.find((n) => n.id === currentView)?.label || 'Workspace'}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* AI Coach button */}
            <button 
              onClick={() => setAiCoachOpen(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-brand-purple/15 border border-brand-purple/35 text-xs font-black text-brand-purple hover:scale-[1.02] cursor-pointer animate-pulse hover:animate-none transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 fill-brand-purple/20" />
              <span>AI Coach</span>
            </button>

            {/* Theme Toggle button */}
            <button 
              onClick={toggleTheme}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-850 hover:bg-slate-850 text-slate-450 hover:text-white cursor-pointer transition-all flex items-center justify-center"
              title="Toggle Light/Dark Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400 fill-amber-400/10" /> : <Moon className="w-4 h-4 text-indigo-400 fill-indigo-400/10" />}
            </button>

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
          </div>
        </header>

        {/* View container */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          {currentView === 'dashboard' && <DashboardView onNavigate={handleNavigation} xp={xp} level={level} spendXp={handleSpendXp} />}
          {currentView === 'aptitude' && <AptitudeView />}
          {currentView === 'coding' && <CodingView />}
          {currentView === 'communication' && <CommunicationView />}
          {currentView === 'interview' && <InterviewView />}
          {currentView === 'resume' && <ResumeView />}
          {currentView === 'leaderboard' && <LeaderboardView />}
          {currentView === 'analytics' && <AnalyticsView />}
          {currentView === 'admin' && <AdminView />}
        </main>
      </div>

      {/* AI CAREER CO-PILOT CHAT DRAWER */}
      {aiCoachOpen && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 z-45 bg-slate-950/60 backdrop-blur-sm cursor-pointer animate-fade-in"
            onClick={() => setAiCoachOpen(false)}
          />

          <aside className="fixed top-0 bottom-0 right-0 z-50 w-85 sm:w-96 bg-slate-900/95 border-l border-white/5 shadow-2xl p-6 flex flex-col justify-between text-left">
            <div className="space-y-6 flex-1 flex flex-col min-h-0">
              {/* Header */}
              <div className="flex justify-between items-center pb-3 border-b border-white/5">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-brand-purple" />
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-100">AI Career Co-Pilot</h4>
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider">Placement Advisor Room</p>
                  </div>
                </div>
                <button 
                  onClick={() => setAiCoachOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Message Arena */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hidden">
                {coachMessages.map((msg, i) => (
                  <div 
                    key={i} 
                    className={`flex flex-col space-y-1 ${
                      msg.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                      {msg.sender === 'user' ? 'Rahul' : 'AI Placement Coach'}
                    </span>
                    <div className={`p-3 rounded-xl text-xs leading-relaxed max-w-[85%] whitespace-pre-line ${
                      msg.sender === 'user' 
                        ? 'bg-brand-purple/20 border border-brand-purple/30 text-slate-200 rounded-tr-none' 
                        : 'bg-slate-950/40 border border-white/5 text-slate-300 rounded-tl-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isCoachThinking && (
                  <div className="flex items-center space-x-2 text-slate-500 font-mono text-[9px]">
                    <Sparkles className="w-3.5 h-3.5 animate-spin text-brand-purple" />
                    <span>AI coach is typing placement hacks...</span>
                  </div>
                )}
              </div>

              {/* Sample Prompt Chips */}
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <p className="text-[9px] font-bold text-slate-550 uppercase">Frequently Queried Prep Prompts</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Time & Work formulas",
                    "Optimizing Python code",
                    "Google Behavioral tips"
                  ].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleSendCoachMessage(chip)}
                      className="px-2 py-1 rounded bg-slate-950 border border-white/5 text-[9px] text-slate-400 hover:border-brand-cyan/20 hover:text-brand-cyan cursor-pointer transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Input Box */}
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSendCoachMessage(coachInput); }}
              className="mt-4 flex space-x-2 pt-4 border-t border-white/5"
            >
              <input
                type="text"
                value={coachInput}
                onChange={(e) => setCoachInput(e.target.value)}
                placeholder="Ask dynamic doubts, check placement paths..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none focus:border-brand-purple/45"
              />
              <button
                type="submit"
                className="px-3 bg-brand-purple hover:bg-violet-650 rounded-lg text-white text-xs font-bold transition-all cursor-pointer"
              >
                Send
              </button>
            </form>
          </aside>
        </>
      )}
    </div>
  );
}
