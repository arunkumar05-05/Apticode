import React, { useState } from 'react';
import {
  Terminal, Sparkles, X
} from 'lucide-react';
import LandingView from './components/LandingView';
import AuthView from './components/AuthView';
import OnboardingView from './components/OnboardingView';
import DashboardView from './components/DashboardView';
import AptitudeView from './components/AptitudeView';
import CodingView from './components/CodingView';
import CommunicationView from './components/CommunicationView';
import InterviewView from './components/InterviewView';
import ResumeView from './components/ResumeView';
import LeaderboardView from './components/LeaderboardView';
import AnalyticsView from './components/AnalyticsView';
import AdminView from './components/AdminView';
import AppLayout from './components/AppLayout';
import CompanyPrepView from './components/CompanyPrepView';
import MockTestView from './components/MockTestView';
import ProfileView from './components/ProfileView';
import { getApiBaseUrl, logout } from './config/api';
import { supabase } from './supabase';



type ViewState =
  | 'landing' | 'auth' | 'onboarding' | 'dashboard' | 'aptitude' | 'coding'
  | 'company' | 'mocktest' | 'profile'
  | 'communication' | 'interview' | 'resume'
  | 'leaderboard' | 'analytics' | 'admin';

interface UserSession {
  name: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
  token: string;
  refreshToken?: string;
  isOnboarded?: boolean;
  onboardingCompleted?: boolean;
}

export default function App() {
  const [user, setUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('apticode-user-session');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('[Session] Failed to restore session:', e);
      }
    }
    return null;
  });

  const [currentViewState, setCurrentViewState] = useState<ViewState>(() => {
    const savedView = localStorage.getItem('apticode-current-view') as ViewState | null;
    const savedUserStr = localStorage.getItem('apticode-user-session');
    if (savedUserStr) {
      try {
        const u = JSON.parse(savedUserStr);
        if (u.role === 'ADMIN') return 'admin';
        if (!u.isOnboarded && !u.onboardingCompleted) {
          const doneKey = `apticode-onboarding-done-${u.email}`;
          if (localStorage.getItem(doneKey) !== 'true') {
            return 'onboarding';
          }
        }
      } catch (e) {}
      if (savedView && savedView !== 'landing' && savedView !== 'auth') {
        return savedView;
      }
      return 'dashboard';
    }
    return 'landing';
  });

  const setCurrentView = (view: ViewState) => {
    setCurrentViewState(view);
    localStorage.setItem('apticode-current-view', view);
  };

  const currentView = currentViewState;

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState('Beginner');

  // Load user level/XP from database dashboard stats on mount or user changes
  React.useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/dashboard`, {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });
        const data = await response.json();
        if (data.status === 'success' && data.stats) {
          setXp(data.stats.xp);
          setLevel(data.stats.level);
          if (data.stats.fullName && data.stats.fullName !== 'New Candidate' && data.stats.fullName !== 'Candidate' && data.stats.fullName !== user.name) {
            const updatedUser = { ...user, name: data.stats.fullName };
            setUser(updatedUser);
            localStorage.setItem('apticode-user-session', JSON.stringify(updatedUser));
          }
        }
      } catch (err) {
        console.warn('Dashboard fetch offline fallback active.');
      }
    };
    fetchStats();
  }, [user?.email, currentView]); // Refresh on view changes to update level after submissions

  // Dark Mode default across all mobile & desktop devices with optional localStorage toggle
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('apticode-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return 'dark';
  });

  React.useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('apticode-theme', theme);
  }, [theme]);

  // When the API refresh-token rotation fails, every 401 clears the session
  // and returns to the landing view instead of leaving a dead session behind.
  React.useEffect(() => {
    const handleSessionExpired = () => {
      localStorage.removeItem('apticode-user-session');
      localStorage.removeItem('apticode-current-view');
      setUser(null);
      setCurrentView('landing');
    };
    window.addEventListener('apticode:session-expired', handleSessionExpired);
    return () => window.removeEventListener('apticode:session-expired', handleSessionExpired);
  }, []);

  React.useEffect(() => {
    const checkOnboarding = async () => {
      if (!user) return;
      if (user.role === 'ADMIN') {
        if (currentView !== 'admin') {
          setCurrentView('admin');
        }
        return;
      }

      const doneKey = `apticode-onboarding-done-${user.email}`;
      const isDone = user.isOnboarded || user.onboardingCompleted || localStorage.getItem(doneKey) === 'true';

      if (!isDone) {
        // If onboarding is incomplete, force the onboarding view even if tab was closed
        if (currentView !== 'onboarding') {
          setCurrentView('onboarding');
        }
      } else {
        const savedView = localStorage.getItem('apticode-current-view') as ViewState | null;
        if (savedView && savedView !== 'landing' && savedView !== 'auth' && savedView !== 'onboarding') {
          if (currentView !== savedView) {
            setCurrentView(savedView);
          }
        } else if (currentView === 'landing' || currentView === 'auth' || currentView === 'onboarding') {
          setCurrentView('dashboard');
        }
      }
    };

    checkOnboarding();
  }, [user?.email, user?.isOnboarded]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // AI Career Co-Pilot Chat Companion Drawer State
  const [aiCoachOpen, setAiCoachOpen] = useState(false);
  const [coachMessages, setCoachMessages] = useState<Array<{ sender: 'user' | 'coach', text: string }>>([
    { sender: 'coach', text: "Hello! I am your AI Placement Coach. Ask me anything about engineering interviews, arithmetic shortcuts, coding bugs, or resume auditor suggestions." }
  ]);
  const [coachInput, setCoachInput] = useState('');
  const [isCoachThinking, setIsCoachThinking] = useState(false);

  const handleSendCoachMessage = async (textToSubmit: string) => {
    if (!textToSubmit.trim() || isCoachThinking) return;

    const userMsg = { sender: 'user' as const, text: textToSubmit };
    const updatedMessages = [...coachMessages, userMsg];
    setCoachMessages(updatedMessages);
    setCoachInput('');
    setIsCoachThinking(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/ai/coach`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token}`
        },
        body: JSON.stringify({
          email: user?.email || 'student@college.edu',
          message: textToSubmit,
          history: updatedMessages.slice(-5)
        })
      });
      const data = await response.json();
      if (data.status === 'success' && data.reply) {
        setCoachMessages(prev => [...prev, { sender: 'coach', text: data.reply }]);
      } else {
        throw new Error(data.message || 'Failed to get response');
      }
    } catch (err: any) {
      console.warn('[AI Coach] API error. Falling back to local responder.', err.message);
      setTimeout(() => {
        let replyText = "Based on your current master level metrics:\n\n1. **Aptitude Focus**: You are at 84% accuracy in Quant. Focus on Probability (weak area).\n2. **Google standard prep**: Master 'Permutations' and 'B-Tree' indexing structures.\n3. **Action item**: Complete mock interview chapter 2.";

        if (textToSubmit.toLowerCase().includes('time') || textToSubmit.toLowerCase().includes('work')) {
          replyText = "**Quant Cheat Sheet (Time & Work):**\n\n- If A completes work in X days: A's 1-day work = 1/X.\n- Combined efficiency: $(1/A + 1/B) = 1/\\text{Total Days}$.\n- Try solving MCQ Question 2 in the Aptitude dashboard.";
        } else if (textToSubmit.toLowerCase().includes('python') || textToSubmit.toLowerCase().includes('code')) {
          replyText = "**AI Code Optimization Tip:**\n\n- Replace Nested `for` loops $O(N^2)$ with a hash map lookups mapping $O(N)$.\n- Review custom test cases inside Coding Arena.";
        }

        setCoachMessages(prev => [...prev, { sender: 'coach', text: replyText }]);
      }, 1000);
    } finally {
      setIsCoachThinking(false);
    }
  };

  const handleSpendXp = (amount: number): boolean => {
    if (xp >= amount) {
      setXp(prev => prev - amount);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    supabase.auth.signOut().catch(err => console.error('[Auth] signOut error:', err));
    logout().catch(() => {});
    localStorage.removeItem('apticode-user-session');
    localStorage.removeItem('apticode-current-view');
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
          localStorage.setItem('apticode-user-session', JSON.stringify(session));
          if (session.role === 'ADMIN') {
            setCurrentView('admin');
          } else if (!session.isOnboarded && !session.onboardingCompleted) {
            const doneKey = `apticode-onboarding-done-${session.email}`;
            if (localStorage.getItem(doneKey) !== 'true') {
              setCurrentView('onboarding');
            } else {
              setCurrentView('dashboard');
            }
          } else {
            setCurrentView('dashboard');
          }
        }}
        onBack={() => setCurrentView('landing')}
      />
    );
  }

  if (currentView === 'onboarding') {
    return (
      <OnboardingView
        userEmail={user?.email || ''}
        onComplete={() => {
          if (user) {
            const updatedUser = { ...user, isOnboarded: true, onboardingCompleted: true };
            setUser(updatedUser);
            localStorage.setItem('apticode-user-session', JSON.stringify(updatedUser));
            localStorage.setItem(`apticode-onboarding-done-${user.email}`, 'true');
          }
          setCurrentView('dashboard');
        }}
      />
    );
  }

  return (
    <AppLayout
      currentView={currentView}
      setCurrentView={setCurrentView}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      xp={xp}
      level={level}
      user={user}
      handleLogout={handleLogout}
      toggleTheme={toggleTheme}
      theme={theme}
      setAiCoachOpen={setAiCoachOpen}
    >
       {currentView === 'dashboard' && <DashboardView onNavigate={handleNavigation} xp={xp} level={level} spendXp={handleSpendXp} openAiCoach={() => setAiCoachOpen(true)} user={user} />}
      {currentView === 'aptitude' && <AptitudeView />}
      {currentView === 'coding' && <CodingView />}
      {currentView === 'company' && <CompanyPrepView />}
      {currentView === 'mocktest' && <MockTestView />}
      {currentView === 'profile' && <ProfileView />}
      {currentView === 'communication' && <CommunicationView />}
      {currentView === 'interview' && <InterviewView />}
      {currentView === 'resume' && <ResumeView />}
      {currentView === 'leaderboard' && <LeaderboardView />}
      {currentView === 'analytics' && <AnalyticsView />}
      {currentView === 'admin' && <AdminView />}

      {/* AI CAREER CO-PILOT CHAT DRAWER */}
      {aiCoachOpen && (
        <>
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 z-45 bg-lc-void/60 backdrop-blur-sm cursor-pointer animate-fade-in"
            onClick={() => setAiCoachOpen(false)}
          />

          <aside className="fixed top-0 bottom-0 right-0 z-50 w-85 sm:w-96 bg-lc-glass-raised border-l border-lc-glass-border shadow-2xl p-6 flex flex-col justify-between text-left">
            <div className="space-y-6 flex-1 flex flex-col min-h-0">
              {/* Header */}
              <div className="flex justify-between items-center pb-3 border-b border-lc-glass-border">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-lc-violet" />
                  <div>
                    <h4 className="text-sm font-extrabold text-lc-text">AI Career Co-Pilot</h4>
                    <p className="text-[9px] text-lc-text-muted uppercase tracking-wider">Placement Advisor Room</p>
                  </div>
                </div>
                <button
                  onClick={() => setAiCoachOpen(false)}
                  className="p-1 rounded-lg hover:bg-lc-glass-raised text-lc-text-muted hover:text-lc-text"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Message Arena */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hidden">
                {coachMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col space-y-1 ${msg.sender === 'user' ? 'items-end' : 'items-start'
                      }`}
                  >
                    <span className="text-[8px] text-lc-text-muted font-bold uppercase tracking-wider font-mono">
                      {msg.sender === 'user' ? (user?.name || user?.email?.split('@')[0] || 'User') : 'AI Placement Coach'}
                    </span>
                    <div className={`p-3 rounded-xl text-xs leading-relaxed max-w-[85%] whitespace-pre-line ${msg.sender === 'user'
                        ? 'bg-lc-violet/20 border border-lc-violet/30 text-lc-text rounded-tr-none'
                        : 'bg-lc-void/40 border border-lc-glass-border text-lc-text rounded-tl-none'
                      }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isCoachThinking && (
                  <div className="flex items-center space-x-2 text-lc-text-muted font-mono text-[9px]">
                    <Sparkles className="w-3.5 h-3.5 animate-spin text-lc-violet" />
                    <span>AI coach is typing placement hacks...</span>
                  </div>
                )}
              </div>

              {/* Sample Prompt Chips */}
              <div className="space-y-1.5 pt-2 border-t border-lc-glass-border">
                <p className="text-[9px] font-bold text-lc-text-muted uppercase">Frequently Queried Prep Prompts</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Time & Work formulas",
                    "Optimizing Python code",
                    "Google Behavioral tips"
                  ].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleSendCoachMessage(chip)}
                      className="px-2 py-1 rounded bg-lc-void border border-lc-glass-border text-[9px] text-lc-text-muted hover:border-lc-cyan/20 hover:text-lc-cyan cursor-pointer transition-colors"
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
              className="mt-4 flex space-x-2 pt-4 border-t border-lc-glass-border"
            >
              <input
                type="text"
                value={coachInput}
                onChange={(e) => setCoachInput(e.target.value)}
                placeholder="Ask dynamic doubts, check placement paths..."
                className="flex-1 bg-lc-void border border-lc-glass-border rounded-lg px-3 py-2 text-xs text-lc-text outline-none focus:border-lc-violet/45"
              />
              <button
                type="submit"
                className="px-3 bg-lc-violet hover:bg-lc-violet-hover rounded-lg text-lc-text text-xs font-bold transition-all cursor-pointer"
              >
                Send
              </button>
            </form>
          </aside>
        </>
      )}
    </AppLayout>
  );
}
