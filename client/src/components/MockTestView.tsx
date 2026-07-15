import React, { useState, useEffect } from 'react';
import { Clock, Play, AlertCircle, CheckCircle2, RefreshCw, Award, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';

interface TestQuestion {
  questionText: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const mockQuestions: TestQuestion[] = [
  {
    questionText: 'A pump can fill a tank with water in 2 hours. Because of a leak, it took 2.5 hours to fill the tank. In how many hours can the leak empty the full tank?',
    options: ['8 hours', '10 hours', '12 hours', '15 hours'],
    correctIndex: 1,
    explanation: '1/2 - 1/2.5 = 1/2 - 2/5 = 1/10. Thus, the leak empties the tank in 10 hours.'
  },
  {
    questionText: 'In how many different ways can the letters of the word "LEADING" be arranged in such a way that the vowels always come together?',
    options: ['360 ways', '480 ways', '720 ways', '5040 ways'],
    correctIndex: 2,
    explanation: 'Vowels are E, A, I (grouped as 1 unit). Consonants are L, D, N, G (4 units). Total units to arrange = 5! = 120. Arrange vowels among themselves = 3! = 6. Total arrangements = 120 * 6 = 720.'
  },
  {
    questionText: 'A trader mixes 26 kg of rice at $20/kg with 30 kg of rice at $36/kg and sells the mixture at $30/kg. What is his profit percentage?',
    options: ['No profit no loss', '5%', '8%', '10%'],
    correctIndex: 1,
    explanation: 'Total CP = 26*20 + 30*36 = 520 + 1080 = $1600. Total quantity = 56 kg. Total SP = 56*30 = $1680. Profit = 80. Profit% = (80/1600)*100 = 5%.'
  }
];

export default function MockTestView() {
  const [testState, setTestState] = useState<'SETUP' | 'ACTIVE' | 'SUMMARY'>('SETUP');
  const [testType, setTestType] = useState<'TOPIC' | 'COMPANY' | 'FULL'>('TOPIC');
  const [negativeMarking, setNegativeMarking] = useState<boolean>(true);

  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [timeLeft, setTimeLeft] = useState<number>(180); 

  const [score, setScore] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [incorrectCount, setIncorrectCount] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (testState !== 'ACTIVE' || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [testState, timeLeft]);

  const handleStartTest = () => {
    setCurrentIdx(0);
    setSelectedAnswers({});
    setTimeLeft(180); 
    setTestState('ACTIVE');
  };

  const handleAnswerSelect = (optionIdx: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [currentIdx]: optionIdx }));
  };

  const getHeaders = () => {
    const saved = localStorage.getItem('apticode-user-session');
    const token = saved ? JSON.parse(saved).token : '';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const handleSubmitTest = async () => {
    let correct = 0;
    let incorrect = 0;
    mockQuestions.forEach((q, idx) => {
      const ans = selectedAnswers[idx];
      if (ans === undefined) return;
      if (ans === q.correctIndex) {
        correct++;
      } else {
        incorrect++;
      }
    });

    const baseScore = correct * 4;
    const penalty = negativeMarking ? incorrect * 1 : 0;
    const finalScore = baseScore - penalty;

    setScore(finalScore);
    setCorrectCount(correct);
    setIncorrectCount(incorrect);
    setTestState('SUMMARY');

    // Save test scorecard to backend database
    try {
      setSubmitting(true);
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/mcqs/progress`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          topicId: `mock_test_${testType.toLowerCase()}`,
          score: finalScore,
          accuracy: correct + incorrect > 0 ? Math.round((correct / (correct + incorrect)) * 100) : 100,
          timeTaken: 180 - timeLeft,
          incorrectQuestions: [],
          topicPerformance: { correct, incorrect }
        })
      });
    } catch (err) {
      console.error('[Mock Test] Failed to save database scorecard:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="glass-panel p-6 max-w-3xl mx-auto text-left space-y-6 pb-12">
      
      {/* SETUP VIEW */}
      {testState === 'SETUP' && (
        <div className="space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h2 className="text-2xl font-extrabold text-slate-200">Mock Test Simulator</h2>
            <p className="text-xs text-slate-500 font-mono mt-1">Simulate real technical and aptitude rounds with negative marking</p>
          </div>

          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Test Scope</label>
                <select
                  value={testType}
                  onChange={(e) => setTestType(e.target.value as any)}
                  className="w-full h-11 bg-slate-900 border border-slate-800 rounded-xl px-3 text-xs font-semibold text-slate-350 outline-none"
                >
                  <option value="TOPIC">Topic-wise mock (Quantitative focus)</option>
                  <option value="COMPANY">Company specific test (Google standard)</option>
                  <option value="FULL">Full mock length test</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Marking Scheme</label>
                <select
                  value={negativeMarking ? 'yes' : 'no'}
                  onChange={(e) => setNegativeMarking(e.target.value === 'yes')}
                  className="w-full h-11 bg-slate-900 border border-slate-800 rounded-xl px-3 text-xs font-semibold text-slate-350 outline-none"
                >
                  <option value="yes">Negative marking (+4, -1 schema)</option>
                  <option value="no">Normal marking (+4, 0 schema)</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleStartTest}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-brand-purple to-brand-cyan text-white font-bold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-brand-purple/10 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Launch Mock Test</span>
            </button>
          </div>
        </div>
      )}

      {/* ACTIVE TEST VIEW */}
      {testState === 'ACTIVE' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-xl border border-white/5 text-xs font-mono">
            <span className="text-slate-400">Question {currentIdx + 1} of {mockQuestions.length}</span>
            <div className="flex items-center space-x-2 font-bold text-brand-cyan">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>

          <div className="p-6 bg-slate-950/20 rounded-xl border border-white/5 space-y-6">
            <p className="text-sm md:text-base font-semibold leading-relaxed text-slate-200">
              {mockQuestions[currentIdx].questionText}
            </p>

            <div className="grid gap-3">
              {mockQuestions[currentIdx].options.map((opt, oIdx) => {
                const isSelected = selectedAnswers[currentIdx] === oIdx;
                return (
                  <button
                    key={oIdx}
                    onClick={() => handleAnswerSelect(oIdx)}
                    className={`w-full p-4 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                      isSelected 
                        ? 'border-brand-purple bg-brand-purple/10 text-brand-purple'
                        : 'border-white/5 bg-slate-950/20 text-slate-400 hover:bg-slate-900/40'
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex justify-between items-center gap-4">
            <button
              onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className="px-4 py-2.5 rounded-lg border border-slate-800 text-[10px] text-slate-400 font-bold hover:text-slate-200 cursor-pointer disabled:opacity-30"
            >
              Previous
            </button>

            {currentIdx < mockQuestions.length - 1 ? (
              <button
                onClick={() => setCurrentIdx(prev => prev + 1)}
                className="px-6 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-brand-cyan font-bold hover:bg-slate-850 cursor-pointer"
              >
                Next Question
              </button>
            ) : (
              <button
                onClick={handleSubmitTest}
                className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-brand-purple to-brand-cyan text-white text-[10px] font-bold shadow-md cursor-pointer"
              >
                Submit Mock Test
              </button>
            )}
          </div>
        </div>
      )}

      {/* SUMMARY RESULT VIEW */}
      {testState === 'SUMMARY' && (
        <div className="space-y-6">
          <div className="p-6 bg-slate-950/40 rounded-xl border border-white/5 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-brand-cyan/10 border border-brand-cyan/20 flex items-center justify-center text-xl font-black text-brand-cyan mx-auto">
              {score}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-200">Mock Test Report Card</h3>
              <p className="text-[10px] text-slate-500 font-mono mt-1">Successfully synced with the database</p>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto text-xs font-mono pt-2">
              <div className="bg-slate-900/50 p-2.5 rounded">Correct: {correctCount}</div>
              <div className="bg-slate-900/50 p-2.5 rounded text-red-400">Wrong: {incorrectCount}</div>
              <div className="bg-slate-900/50 p-2.5 rounded text-brand-purple">Accuracy: {
                correctCount + incorrectCount > 0 
                  ? Math.round((correctCount / (correctCount + incorrectCount)) * 100) 
                  : 100
              }%</div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Detailed Explanations</h4>
            <div className="space-y-3">
              {mockQuestions.map((q, idx) => {
                const ans = selectedAnswers[idx];
                const correct = ans === q.correctIndex;
                return (
                  <div key={idx} className="p-4 bg-slate-950/20 rounded-xl border border-white/5 space-y-2 text-xs">
                    <p className="font-extrabold text-slate-350">{idx + 1}. {q.questionText}</p>
                    <p className={`text-[10px] font-mono ${correct ? 'text-emerald-400' : 'text-red-400'}`}>
                      Your choice: {ans !== undefined ? q.options[ans] : 'Skipped'} • {correct ? 'Correct' : 'Incorrect'}
                    </p>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-sans">{q.explanation}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => setTestState('SETUP')}
            className="w-full py-3 bg-slate-900 border border-slate-800 hover:bg-slate-850 rounded-xl text-xs font-bold text-brand-cyan cursor-pointer transition-colors"
          >
            Start Another Simulation
          </button>
        </div>
      )}

    </div>
  );
}
