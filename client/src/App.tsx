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
import { auth, db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';



type ViewState =
  | 'landing' | 'auth' | 'onboarding' | 'dashboard' | 'aptitude' | 'coding'
  | 'communication' | 'interview' | 'resume'
  | 'leaderboard' | 'analytics' | 'admin';

interface UserSession {
  name: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
  onboardingCompleted?: boolean;
}

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('landing');
  const [user, setUser] = useState<UserSession | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [xp, setXp] = useState(24500); // start at master level
  const [level, setLevel] = useState('Master');

  // Dynamic Theme Mode with localStorage persistence and system-theme check on first visit
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('apticode-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
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

  React.useEffect(() => {
    const checkOnboarding = async () => {
      if (!user) return;
      if (user.role === 'ADMIN') {
        setCurrentView('admin');
        return;
      }

      const currentUser = auth.currentUser;
      const storageKey = currentUser ? `onboarding_${currentUser.uid}` : `onboarding_${user.email}`;
      
      // Check localStorage first
      const cached = localStorage.getItem(storageKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.onboardingCompleted) {
            setCurrentView('dashboard');
            return;
          }
        } catch (e) {
          console.error('[Onboarding] Failed to parse cached onboarding profile:', e);
        }
      }

      // Check Firestore using UID (or email for sandbox mode) as document ID fallback
      try {
        const docId = currentUser ? currentUser.uid : user.email;
        const docRef = doc(db, 'users', docId);
        const docSnap = await Promise.race([
          getDoc(docRef),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Firestore read timeout')), 2500))
        ]);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.onboardingCompleted) {
            localStorage.setItem(storageKey, JSON.stringify(data));
            setCurrentView('dashboard');
            return;
          }
        }
      } catch (err) {
        console.error('[Onboarding] Firestore fetch error:', err);
      }

      // Route to onboarding if not completed
      setCurrentView('onboarding');
    };

    checkOnboarding();
  }, [user]);

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
        }}
        onBack={() => setCurrentView('landing')}
      />
    );
  }

  if (currentView === 'onboarding') {
    return (
      <OnboardingView
        userEmail={user?.email || ''}
        onComplete={(data) => {
          setUser(prev => prev ? { ...prev, onboardingCompleted: true } : null);
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
      {currentView === 'dashboard' && <DashboardView onNavigate={handleNavigation} xp={xp} level={level} spendXp={handleSpendXp} openAiCoach={() => setAiCoachOpen(true)} />}
      {currentView === 'aptitude' && <AptitudeView />}
      {currentView === 'coding' && <CodingView />}
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
                    className={`flex flex-col space-y-1 ${msg.sender === 'user' ? 'items-end' : 'items-start'
                      }`}
                  >
                    <span className="text-[8px] text-slate-500 font-bold uppercase tracking-wider font-mono">
                      {msg.sender === 'user' ? 'Rahul' : 'AI Placement Coach'}
                    </span>
                    <div className={`p-3 rounded-xl text-xs leading-relaxed max-w-[85%] whitespace-pre-line ${msg.sender === 'user'
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
    </AppLayout>
  );
}
