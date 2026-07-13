import React, { useState, useEffect } from 'react';
import { ShieldAlert, Sparkles, MessageCircle, HelpCircle, Award, Volume2, User, ChevronRight, Play, AwardIcon, CheckSquare, Mic, MicOff } from 'lucide-react';

interface Question {
  q: string;
  optimal: string;
}

const interviewQuestions: Question[] = [
  { q: "Can you explain the difference between processes and threads?", optimal: "Processes have independent memory address spaces and are isolated. Threads share the memory of their parent process, making communication lightweight but requiring synchronization locks." },
  { q: "Explain how index optimization works in databases.", optimal: "Database indices construct B-Trees or Hash Tables mapping values to storage blocks, turning O(N) sequential scans into O(log N) tree runs." },
  { q: "Tell me about a time you worked on a team with differing technical ideas.", optimal: "Focus on active listening, creating design spreadsheets comparing pros/cons, selecting a standard based on benchmarks, and executing collaboratively." }
];

export default function InterviewView() {
  const [sessionState, setSessionState] = useState<'SETUP' | 'ACTIVE' | 'REPORT'>('SETUP');
  const [interviewType, setInterviewType] = useState<string>('TECHNICAL');
  const [targetCompany, setTargetCompany] = useState<string>('Google');
  
  const [activeStep, setActiveStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentAnswerText, setCurrentAnswerText] = useState('');
  
  const [isAiReplying, setIsAiReplying] = useState(false);
  const [aiSpeechText, setAiSpeechText] = useState(interviewQuestions[0].q);

  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  // Text-To-Speech: Speak Question
  const speakQuestion = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(voice => voice.lang.startsWith('en'));
      if (englishVoice) {
        utterance.voice = englishVoice;
      }
      utterance.rate = 1.05;
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    if (sessionState === 'ACTIVE' && aiSpeechText) {
      speakQuestion(aiSpeechText);
    }
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [aiSpeechText, sessionState]);

  // Speech-To-Text: Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false;
      rec.lang = 'en-US';
      
      rec.onresult = (event: any) => {
        const transcript = event.results[event.results.length - 1][0].transcript;
        setCurrentAnswerText(prev => (prev ? prev + ' ' : '') + transcript);
      };

      rec.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(rec);
    }
  }, []);

  const handleToggleListen = () => {
    if (!recognition) {
      alert("Speech recognition (STT) is not supported in this browser. Please type your answer.");
      return;
    }
    
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      try {
        recognition.start();
        setIsListening(true);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleStartInterview = () => {
    setAnswers([]);
    setActiveStep(0);
    setAiSpeechText(interviewQuestions[0].q);
    setSessionState('ACTIVE');
  };

  const handleNextStep = () => {
    if (!currentAnswerText.trim()) return;

    if (isListening && recognition) {
      recognition.stop();
      setIsListening(false);
    }
    
    const updatedAnswers = [...answers, currentAnswerText];
    setAnswers(updatedAnswers);
    setCurrentAnswerText('');

    if (activeStep < interviewQuestions.length - 1) {
      setIsAiReplying(true);
      setTimeout(() => {
        setIsAiReplying(false);
        const nextIdx = activeStep + 1;
        setActiveStep(nextIdx);
        setAiSpeechText(interviewQuestions[nextIdx].q);
      }, 1200);
    } else {
      setSessionState('REPORT');
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-20 md:pb-12 text-left">
      {/* SETUP PHASE */}
      {sessionState === 'SETUP' && (
        <div className="glass-panel p-5 md:p-8 space-y-5">
          <div className="text-center space-y-1.5">
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-100">AI Mock Interview Room</h2>
            <p className="text-[11px] text-slate-400 max-w-md mx-auto leading-relaxed">
              Simulate high-fidelity interviews with immediate evaluation reports based on recruiter assessment rubrics.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Interview Core Focus</label>
              <select
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
                className="w-full h-11 bg-slate-900 border border-slate-800 rounded-xl px-3 text-xs font-semibold text-slate-350 outline-none"
              >
                <option value="TECHNICAL">CS Core Technical (OS, DBMS, Networks)</option>
                <option value="HR">HR & Behavioral (STAR model)</option>
                <option value="CODING">Systems Architecture & Design</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Target Recruiting Standard</label>
              <select
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                className="w-full h-11 bg-slate-900 border border-slate-800 rounded-xl px-3 text-xs font-semibold text-slate-350 outline-none"
              >
                <option value="Google">Google / Meta Standard (Deep Logic)</option>
                <option value="Amazon">Amazon Standard (Leadership Principles)</option>
                <option value="TCS">Service Providers Standard (General CS)</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleStartInterview}
            className="w-full h-12 py-0 rounded-xl bg-gradient-to-r from-brand-purple to-brand-cyan text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-brand-purple/10"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Launch Mock Interview</span>
          </button>
        </div>
      )}

      {/* ACTIVE INTERVIEW PHASE */}
      {sessionState === 'ACTIVE' && (
        <div className="space-y-5">
          {/* Interview Status Row */}
          <div className="flex justify-between items-center text-[10px] font-bold bg-slate-900/30 p-3.5 rounded-xl border border-white/5">
            <span className="text-slate-400">Interviewer: Executive Recruiter AI</span>
            <span className="text-brand-cyan font-mono">Question {activeStep + 1} of {interviewQuestions.length}</span>
          </div>

          {/* AI Interviewer Avatar Panel */}
          <div className="glass-panel p-5 md:p-8 flex flex-col items-center justify-center text-center space-y-4 bg-slate-900/40 relative">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-tr from-brand-purple to-brand-cyan flex items-center justify-center shadow-xl shadow-brand-purple/20 relative shrink-0 ${
              isAiReplying ? 'animate-pulse' : ''
            }`}>
              <User className="w-8 h-8 text-white" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-950 border border-white/10 flex items-center justify-center">
                <Volume2 className="w-3 h-3 text-brand-cyan" />
              </div>
            </div>

            <div className="space-y-2 max-w-xl">
              {isAiReplying ? (
                <p className="text-slate-500 font-mono text-[10px] animate-pulse">Evaluating answer & formulating next question...</p>
              ) : (
                <p className="text-sm md:text-base font-bold text-slate-200 leading-relaxed">
                  "{aiSpeechText}"
                </p>
              )}
            </div>
          </div>

          {/* Student Answer Panel */}
          <div className="glass-panel p-5 space-y-4">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Your Answer (Type or Speak)</label>
            <textarea
              value={currentAnswerText}
              onChange={(e) => setCurrentAnswerText(e.target.value)}
              placeholder="Structure your answer clearly (STAR framework or trade-offs comparisons)..."
              className="w-full h-32 bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5 text-xs text-slate-300 outline-none resize-none focus:border-brand-cyan/40"
            />

            <div className="flex flex-col gap-3">
              <div className="flex space-x-2 w-full">
                <button
                  onClick={() => setCurrentAnswerText(interviewQuestions[activeStep].optimal.slice(0, 120) + "...")}
                  className="flex-1 h-11 rounded-lg bg-slate-900 hover:bg-slate-850 text-[10px] text-brand-cyan font-bold border border-slate-800 transition-colors cursor-pointer"
                >
                  🪄 Auto-fill Helper
                </button>
                <button
                  type="button"
                  onClick={handleToggleListen}
                  className={`flex-1 h-11 rounded text-[10px] font-bold border flex items-center justify-center space-x-1.5 transition-colors cursor-pointer ${
                    isListening 
                      ? 'bg-red-500/10 border-red-500 text-red-400 animate-pulse'
                      : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-350'
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-3.5 h-3.5 text-red-400 shrink-0" />
                      <span>Stop Voice</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Speak (Voice)</span>
                    </>
                  )}
                </button>
              </div>
              <button
                onClick={handleNextStep}
                disabled={!currentAnswerText.trim() || isAiReplying}
                className="w-full h-12 rounded-lg bg-gradient-to-r from-brand-purple to-brand-cyan font-bold text-xs text-white disabled:opacity-40 transition-all flex items-center justify-center space-x-1 shadow cursor-pointer"
              >
                <span>{activeStep === interviewQuestions.length - 1 ? 'Finish & Audit' : 'Submit Answer'}</span>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FINAL REPORT CARD PHASE */}
      {sessionState === 'REPORT' && (
        <div className="space-y-6">
          {/* Rating Summary Card */}
          <div className="glass-panel p-5 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4 border-brand-cyan/20">
            <div className="space-y-1.5 text-center md:text-left">
              <h2 className="text-lg md:text-2xl font-black text-slate-100">Interview Evaluation Complete</h2>
              <p className="text-[11px] text-slate-400 max-w-md">
                Google-standard technical audit processed successfully. Review response metrics below.
              </p>
            </div>

            <div className="flex items-center space-x-3.5 bg-slate-950/60 p-3.5 rounded-xl border border-white/5 w-full md:w-auto justify-center">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-sm font-black text-emerald-400 shrink-0">
                84%
              </div>
              <div>
                <p className="text-[9px] text-slate-500 font-bold uppercase">Placement Status</p>
                <p className="text-xs font-bold text-emerald-400">RECOMMENDED (PASS)</p>
              </div>
            </div>
          </div>

          {/* Breakdown cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel p-5 space-y-1.5">
              <p className="text-[9px] text-slate-550 font-bold uppercase">Technical Depth</p>
              <p className="text-base font-bold text-slate-200">8.5 / 10</p>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Clear distinction between shared memory pools and thread concurrency parameters.
              </p>
            </div>
            <div className="glass-panel p-5 space-y-1.5">
              <p className="text-[9px] text-slate-550 font-bold uppercase">Confidence Score</p>
              <p className="text-base font-bold text-slate-200">7.8 / 10</p>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Steady delivery pace, moderate hesitation fillers registered during STAR logic scenarios.
              </p>
            </div>
            <div className="glass-panel p-5 space-y-1.5">
              <p className="text-[9px] text-slate-550 font-bold uppercase">Target Alignment</p>
              <p className="text-base font-bold text-emerald-400">EXPERT LEVEL</p>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Matches the competency expectation thresholds of tier-1 recruiters.
              </p>
            </div>
          </div>

          {/* Detailed dialogue review */}
          <div className="glass-panel p-5 space-y-5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2.5">
              Dialogue Audits
            </h3>
            {interviewQuestions.map((q, idx) => (
              <div key={idx} className="space-y-2 border-b border-white/5 pb-3.5 last:border-0 last:pb-0">
                <div className="flex items-start space-x-1.5 text-xs font-bold text-brand-purple">
                  <HelpCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>Q: {q.q}</span>
                </div>
                <div className="pl-5 space-y-1.5">
                  <p className="text-[11px] text-slate-400 italic leading-relaxed">
                    Your Response: "{answers[idx] || 'N/A'}"
                  </p>
                  <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-[10px] text-slate-350 leading-relaxed">
                    <span className="font-bold text-emerald-400 uppercase mr-1">Suggested Additions:</span>
                    {q.optimal}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Back Action */}
          <button
            onClick={() => setSessionState('SETUP')}
            className="w-full h-12 py-0 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-brand-cyan transition-colors shadow"
          >
            Start New Mock Session
          </button>
        </div>
      )}
    </div>
  );
}
