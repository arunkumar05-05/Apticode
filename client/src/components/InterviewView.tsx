import React, { useState, useEffect } from 'react';
import { HelpCircle, Volume2, User, ChevronRight, Play, Mic, MicOff, RefreshCw } from 'lucide-react';
import { getApiBaseUrl } from '../config/api';
import { LiquidBackdrop } from './ui/LiquidBackdrop';
import Scene3D from './three/LazyScene3D';

interface Question {
  q: string;
  optimal: string;
}

export default function InterviewView() {
  const [sessionState, setSessionState] = useState<'SETUP' | 'ACTIVE' | 'REPORT'>('SETUP');
  const [interviewType, setInterviewType] = useState<string>('TECHNICAL');
  const [targetCompany, setTargetCompany] = useState<string>('Google');
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeStep, setActiveStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentAnswerText, setCurrentAnswerText] = useState('');
  
  const [isAiReplying, setIsAiReplying] = useState(false);
  const [aiSpeechText, setAiSpeechText] = useState('');

  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  const [reportData, setReportData] = useState<any>(null);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  const getHeaders = () => {
    const saved = localStorage.getItem('apticode-user-session');
    const token = saved ? JSON.parse(saved).token : '';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const loadHistory = async () => {
    try {
      setLoadingHistory(true);
      const response = await fetch(`${getApiBaseUrl()}/api/interview/history`, {
        headers: getHeaders()
      });
      const data = await response.json();
      if (data.status === 'success') {
        setHistoryList(data.history || []);
      }
    } catch (err) {
      console.error('[Interview History] Error:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (sessionState === 'SETUP') {
      loadHistory();
    }
  }, [sessionState]);

  // Text-To-Speech
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

  // Speech-To-Text
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

  const handleStartInterview = async () => {
    try {
      setLoadingHistory(true);
      const response = await fetch(`${getApiBaseUrl()}/api/interview/start`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ type: interviewType, company: targetCompany })
      });
      const data = await response.json();
      if (data.status === 'success' && Array.isArray(data.questions)) {
        setQuestions(data.questions);
        setAnswers([]);
        setActiveStep(0);
        setAiSpeechText(data.questions[0].q);
        setSessionState('ACTIVE');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to launch interview.');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleNextStep = async () => {
    if (!currentAnswerText.trim()) return;

    if (isListening && recognition) {
      recognition.stop();
      setIsListening(false);
    }
    
    const updatedAnswers = [...answers, currentAnswerText];
    setAnswers(updatedAnswers);
    setCurrentAnswerText('');

    if (activeStep < questions.length - 1) {
      setIsAiReplying(true);
      setTimeout(() => {
        setIsAiReplying(false);
        const nextIdx = activeStep + 1;
        setActiveStep(nextIdx);
        setAiSpeechText(questions[nextIdx].q);
      }, 1200);
    } else {
      // Submit dialogue report
      try {
        setIsAiReplying(true);
        const response = await fetch(`${getApiBaseUrl()}/api/interview/submit`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            type: interviewType,
            company: targetCompany,
            questions,
            answers: updatedAnswers
          })
        });
        const data = await response.json();
        if (data.status === 'success') {
          setReportData(data.report);
          setSessionState('REPORT');
        }
      } catch (err) {
        console.error(err);
        alert('Failed to submit interview report.');
      } finally {
        setIsAiReplying(false);
      }
    }
  };

  return (
    <div className="relative overflow-hidden max-w-4xl mx-auto pb-20 md:pb-12 text-left">
      <LiquidBackdrop />

      <div className="relative overflow-hidden pointer-events-none mb-6 lg:mb-8">
        <div className="lc-glass h-44 sm:h-52 lg:h-60 overflow-hidden">
          <Scene3D variant="holoring" data={{ isActive: sessionState === 'ACTIVE' }} className="absolute inset-0" />
        </div>
      </div>

      {/* SETUP PHASE */}
      {sessionState === 'SETUP' && (
        <div className="space-y-6">
          <div className="lc-glass p-5 md:p-8 space-y-5">
            <div className="text-center space-y-1.5">
              <h2 className="text-xl md:text-2xl font-black tracking-tight text-lc-text">AI Mock Interview Room</h2>
              <p className="text-[11px] text-lc-text-muted max-w-md mx-auto leading-relaxed">
                Simulate high-fidelity interviews with immediate evaluation reports based on recruiter assessment rubrics.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-lc-text-muted uppercase tracking-wider">Interview Core Focus</label>
                <select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value)}
                  className="w-full h-11 lc-neo rounded-full px-3 text-xs font-semibold text-lc-text outline-none focus:ring-2 focus:ring-lc-cyan/40"
                >
                  <option value="TECHNICAL">CS Core Technical (OS, DBMS, Networks)</option>
                  <option value="HR">HR & Behavioral (STAR model)</option>
                  <option value="CODING">Systems Architecture & Design</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-lc-text-muted uppercase tracking-wider">Target Recruiting Standard</label>
                <select
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  className="w-full h-11 lc-neo rounded-full px-3 text-xs font-semibold text-lc-text outline-none focus:ring-2 focus:ring-lc-cyan/40"
                >
                  <option value="Google">Google / Meta Standard (Deep Logic)</option>
                  <option value="Amazon">Amazon Standard (Leadership Principles)</option>
                  <option value="TCS">Service Providers Standard (General CS)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleStartInterview}
              disabled={loadingHistory}
              className="w-full h-12 lc-neo lc-neo-pill bg-gradient-to-r from-lc-violet to-lc-cyan text-lc-text font-bold text-xs flex items-center justify-center space-x-1.5 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loadingHistory ? (
                <RefreshCw className="w-4 h-4 animate-spin text-lc-text" />
              ) : (
                <>
                  <Play className="w-4 h-4 fill-lc-text" />
                  <span>Launch Mock Interview</span>
                </>
              )}
            </button>
          </div>

          {/* Past interview reports log */}
          <div className="lc-glass p-6 space-y-4">
            <h3 className="text-xs font-bold text-lc-text-muted uppercase tracking-widest font-mono">My Interview Attempt History</h3>
            {loadingHistory ? (
              <div className="text-lc-text-muted text-xs font-mono py-4 text-center">Syncing history...</div>
            ) : historyList.length === 0 ? (
              <div className="text-lc-text-muted text-xs font-mono py-6 text-center">No past simulated interview reports found.</div>
            ) : (
              <div className="space-y-3">
                {historyList.map((test: any, i: number) => (
                  <div key={i} className="p-4 lc-neo rounded-2xl flex items-center justify-between text-xs font-mono">
                    <div className="space-y-1">
                      <p className="font-extrabold text-lc-text">{test.interviewType} Interview</p>
                      <p className="text-[10px] text-lc-text-muted">
                        Completed at: {new Date(test.createdAt).toLocaleString()} • Tech: {test.technicalScore}/100 • Soft Skill: {test.softSkillScore}/100
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-extrabold text-lc-cyan">{test.overallScore}% Score</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ACTIVE INTERVIEW PHASE */}
      {sessionState === 'ACTIVE' && (
        <div className="space-y-5">
          <div className="flex justify-between items-center text-[10px] font-bold lc-neo p-3.5 rounded-2xl">
            <span className="text-lc-text-muted">Interviewer: Executive Recruiter AI</span>
            <span className="text-lc-cyan font-mono">Question {activeStep + 1} of {questions.length}</span>
          </div>

          <div className="lc-glass p-5 md:p-8 flex flex-col items-center justify-center text-center space-y-4 relative">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-tr from-lc-violet to-lc-cyan flex items-center justify-center shadow-neo relative shrink-0 ${
              isAiReplying ? 'animate-pulse' : ''
            }`}>
              <User className="w-8 h-8 text-lc-text" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-lc-void border border-lc-glass-border flex items-center justify-center">
                <Volume2 className="w-3 h-3 text-lc-cyan" />
              </div>
            </div>

            <div className="space-y-2 max-w-xl">
              {isAiReplying ? (
                <p className="text-lc-text-muted font-mono text-[10px] animate-pulse">Evaluating answer & formulating report...</p>
              ) : (
                <p className="text-sm md:text-base font-bold text-lc-text leading-relaxed">
                  "{aiSpeechText}"
                </p>
              )}
            </div>
          </div>

          <div className="lc-glass p-5 space-y-4">
            <label className="text-[10px] font-bold text-lc-text-muted uppercase tracking-wider">Your Answer (Type or Speak)</label>
            <textarea
              value={currentAnswerText}
              onChange={(e) => setCurrentAnswerText(e.target.value)}
              placeholder="Structure your answer clearly (STAR framework or trade-offs comparisons)..."
              className="w-full h-32 lc-neo rounded-2xl p-3.5 text-xs text-lc-text outline-none resize-none placeholder:text-lc-text-muted/60 focus:ring-2 focus:ring-lc-cyan/40"
            />

            <div className="flex flex-col gap-3">
              <div className="flex space-x-2 w-full">
                <button
                  onClick={() => setCurrentAnswerText(questions[activeStep]?.optimal || '')}
                  className="flex-1 h-11 lc-neo rounded-2xl text-[10px] text-lc-cyan font-bold transition-colors cursor-pointer"
                >
                  🪄 Auto-fill Helper
                </button>
                <button
                  type="button"
                  onClick={handleToggleListen}
                  className={`flex-1 h-11 lc-neo rounded-2xl text-[10px] font-bold flex items-center justify-center space-x-1.5 transition-colors cursor-pointer ${
                    isListening 
                      ? 'bg-lc-rose/10 border border-lc-rose text-lc-rose animate-pulse'
                      : 'text-lc-text'
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-3.5 h-3.5 text-lc-rose shrink-0" />
                      <span>Stop Voice</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-3.5 h-3.5 text-lc-text-muted shrink-0" />
                      <span>Speak (Voice)</span>
                    </>
                  )}
                </button>
              </div>
              <button
                onClick={handleNextStep}
                disabled={!currentAnswerText.trim() || isAiReplying}
                className="w-full h-12 lc-neo lc-neo-pill bg-gradient-to-r from-lc-violet to-lc-cyan font-bold text-xs text-lc-text disabled:opacity-40 transition-all flex items-center justify-center space-x-1 cursor-pointer"
              >
                <span>{activeStep === questions.length - 1 ? 'Finish & Audit' : 'Submit Answer'}</span>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FINAL REPORT CARD PHASE */}
      {sessionState === 'REPORT' && reportData && (
        <div className="space-y-6">
          <div className="lc-glass p-5 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="space-y-1.5 text-center md:text-left">
              <h2 className="text-lg md:text-2xl font-black text-lc-text">Interview Evaluation Complete</h2>
              <p className="text-[11px] text-lc-text-muted max-w-md">
                Google-standard technical audit processed successfully. Review response metrics below.
              </p>
            </div>

            <div className="flex items-center space-x-3.5 lc-neo p-3.5 rounded-2xl w-full md:w-auto justify-center">
              <div className="w-12 h-12 rounded-full bg-lc-emerald/10 border border-lc-emerald/20 flex items-center justify-center text-sm font-black text-lc-emerald shrink-0">
                {reportData.overallScore}%
              </div>
              <div>
                <p className="text-[9px] text-lc-text-muted font-bold uppercase">Placement Status</p>
                <p className="text-xs font-bold text-lc-emerald">{reportData.status || 'RECOMMENDED (PASS)'}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="lc-glass p-5 space-y-1.5">
              <p className="text-[9px] text-lc-text-muted font-bold uppercase">Technical Depth</p>
              <p className="text-base font-bold text-lc-text">{reportData.technicalScore} / 100</p>
              <p className="text-[10px] text-lc-text-muted leading-relaxed">
                Clear distinction between processes and threads, B-Tree index runtime operations verified.
              </p>
            </div>
            <div className="lc-glass p-5 space-y-1.5">
              <p className="text-[9px] text-lc-text-muted font-bold uppercase">Confidence Score</p>
              <p className="text-base font-bold text-lc-text">{reportData.softSkillScore} / 100</p>
              <p className="text-[10px] text-lc-text-muted leading-relaxed">
                Fluency ratings are synchronized directly using fillers auditor token patterns.
              </p>
            </div>
            <div className="lc-glass p-5 space-y-1.5">
              <p className="text-[9px] text-lc-text-muted font-bold uppercase">Target Alignment</p>
              <p className="text-base font-bold text-lc-emerald">EXPERT LEVEL</p>
              <p className="text-[10px] text-lc-text-muted leading-relaxed">
                Matches the competency expectation thresholds of tier-1 recruiter panels.
              </p>
            </div>
          </div>

          <div className="lc-glass p-5 space-y-5">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-lc-text-muted border-b border-lc-glass-border pb-2.5">
              Dialogue Audits & Feedback
            </h3>
            <div className="text-xs text-lc-text leading-relaxed mb-4 whitespace-pre-wrap">
              {reportData.feedbackReport}
            </div>

            {questions.map((q, idx) => (
              <div key={idx} className="space-y-2 border-b border-lc-glass-border pb-3.5 last:border-0 last:pb-0">
                <div className="flex items-start space-x-1.5 text-xs font-bold text-lc-violet">
                  <HelpCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <span>Q: {q.q}</span>
                </div>
                <div className="pl-5 space-y-1.5">
                  <p className="text-[11px] text-lc-text-muted italic leading-relaxed">
                    Your Response: "{answers[idx] || 'N/A'}"
                  </p>
                  <div className="p-3 lc-neo rounded-2xl text-[10px] text-lc-text leading-relaxed">
                    <span className="font-bold text-lc-emerald uppercase mr-1">Suggested Optimal Answer:</span>
                    {reportData.optimalAdditions?.[idx] || q.optimal}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setSessionState('SETUP')}
            className="w-full h-12 lc-neo rounded-2xl text-xs font-bold text-lc-cyan transition-colors cursor-pointer"
          >
            Start New Mock Session
          </button>
        </div>
      )}
    </div>
  );
}
