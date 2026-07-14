import React, { useState, useEffect } from 'react';
import { Clock, Play, AlertCircle, CheckCircle2, RefreshCw, Award, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

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
  
  // Setup config
  const [testType, setTestType] = useState<'TOPIC' | 'COMPANY' | 'FULL'>('TOPIC');
  const [negativeMarking, setNegativeMarking] = useState<boolean>(true);

  // Active Test State
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: number]: number }>({});
  const [timeLeft, setTimeLeft] = useState<number>(180); // 3 minutes total

  // Results State
  const [score, setScore] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [incorrectCount, setIncorrectCount] = useState<number>(0);

  // Active timer
  useEffect(() => {
    if (testState !== 'ACTIVE' || timeLeft <= 0) return;
    if (timeLeft === 0) {
      handleSubmitTest();
      return;
    }
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
    setTimeLeft(180); // 3 minutes
    setTestState('ACTIVE');
  };

  const handleAnswerSelect = (optionIdx: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [currentIdx]: optionIdx }));
  };

  const handleSubmitTest = async () => {
    // Calculate Score
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

    // Save test scorecard to Firestore
    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        let history = [];
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data.testHistory)) {
            history = data.testHistory;
          }
        }
        const newRecord = {
          date: new Date().toLocaleDateString(),
          type: testType,
          score: finalScore,
          correct,
          incorrect,
          totalQuestions: mockQuestions.length
        };
        await setDoc(docRef, { testHistory: [newRecord, ...history] }, { merge: true });
      } catch (err) {
        console.error('Failed to sync scorecard:', err);
      }
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
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Test Category</label>
              <div className="grid md:grid-cols-3 gap-3 mt-2">
                {[
                  { id: 'TOPIC', title: 'Quantitative / Logical Topic Test', desc: 'Focus on individual math subtopics.' },
                  { id: 'COMPANY', title: 'Company Mock Challenge', desc: 'Breakdowns matching recruiter patterns.' },
                  { id: 'FULL', title: 'Full Roster Placement Test', desc: 'Mixed aptitude and reasoning modules.' }
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setTestType(type.id as any)}
                    className={`p-4 rounded-xl border text-left text-xs transition-all flex flex-col space-y-1.5 ${
                      testType === type.id
                        ? 'border-brand-purple bg-brand-purple/10 text-slate-200'
                        : 'border-white/5 bg-slate-950/20 text-slate-400 hover:border-slate-800'
                    }`}
                  >
                    <span className="font-extrabold">{type.title}</span>
                    <span className="text-[10px] text-slate-550 leading-relaxed">{type.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Options & Penalty Rules</h4>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-450 font-semibold">Enable Negative Marking (Right: +4 | Wrong: -1)</span>
                <input
                  type="checkbox"
                  checked={negativeMarking}
                  onChange={(e) => setNegativeMarking(e.target.checked)}
                  className="w-4 h-4 rounded accent-brand-purple cursor-pointer outline-none"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleStartTest}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-purple to-brand-cyan text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98] cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Initialize Exam Session</span>
          </button>
        </div>
      )}

      {/* ACTIVE TEST VIEW */}
      {testState === 'ACTIVE' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <span className="text-xs font-extrabold text-slate-400 font-mono">Question {currentIdx + 1} of {mockQuestions.length}</span>
            <span className="flex items-center space-x-1.5 font-mono text-brand-cyan bg-slate-950/40 border border-white/5 px-3 py-1.5 rounded-lg">
              <Clock className="w-4 h-4 animate-pulse" />
              <span>{formatTime(timeLeft)}</span>
            </span>
          </div>

          <p className="text-base font-semibold leading-relaxed text-slate-200">
            {mockQuestions[currentIdx].questionText}
          </p>

          <div className="grid gap-3 pt-2">
            {mockQuestions[currentIdx].options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswerSelect(idx)}
                className={`p-4 rounded-xl border text-left text-xs font-semibold transition-all ${
                  selectedAnswers[currentIdx] === idx
                    ? 'bg-brand-purple/10 border-brand-purple text-brand-purple font-bold'
                    : 'bg-slate-950/20 border-white/5 text-slate-450 hover:border-slate-800'
                }`}
              >
                <span className="font-bold mr-2 text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-500 font-mono">
                  {String.fromCharCode(65 + idx)}
                </span>
                {option}
              </button>
            ))}
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-4 border-t border-white/5">
            <button
              onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
              disabled={currentIdx === 0}
              className="px-4 py-2.5 rounded-lg bg-slate-950 border border-white/10 text-xs font-bold text-slate-400 flex items-center space-x-1 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            {currentIdx === mockQuestions.length - 1 ? (
              <button
                onClick={handleSubmitTest}
                className="px-6 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-xs font-bold text-slate-950 flex items-center space-x-1 transition-colors"
              >
                <span>Submit Exam</span>
              </button>
            ) : (
              <button
                onClick={() => setCurrentIdx((p) => Math.min(mockQuestions.length - 1, p + 1))}
                className="px-4 py-2.5 rounded-lg bg-slate-950 border border-white/10 text-xs font-bold text-slate-400 flex items-center space-x-1 transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* SUMMARY RESULT VIEW */}
      {testState === 'SUMMARY' && (
        <div className="space-y-6">
          <div className="border-b border-white/5 pb-4 text-center">
            <Award className="w-12 h-12 text-brand-cyan mx-auto mb-2" />
            <h2 className="text-2xl font-extrabold text-slate-200">Exam Results Summary</h2>
            <p className="text-xs text-slate-500 font-mono mt-1">Roster scorecard has been compiled</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Final Score</span>
              <p className="text-3xl font-extrabold text-brand-cyan font-mono">{score}</p>
            </div>
            <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Correct Answers</span>
              <p className="text-3xl font-extrabold text-emerald-400 font-mono">+{correctCount}</p>
            </div>
            <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/10 text-center space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Incorrect Answers</span>
              <p className="text-3xl font-extrabold text-red-400 font-mono">-{incorrectCount}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Solutions Review</h3>
            <div className="space-y-3">
              {mockQuestions.map((q, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-white/5 bg-slate-950/20 space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="font-semibold text-slate-200">Question {idx + 1}</span>
                    <span className={`font-bold ${
                      selectedAnswers[idx] === q.correctIndex ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {selectedAnswers[idx] === q.correctIndex ? '✓ Correct' : '✗ Incorrect / Unanswered'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-350">{q.questionText}</p>
                  <div className="text-[11px] bg-slate-950/60 p-3 rounded-lg border border-white/5 font-mono text-slate-400">
                    <strong className="text-brand-cyan">Solution Explanation:</strong> {q.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setTestState('SETUP')}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-brand-cyan hover:bg-slate-850 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retake Another Mock Test</span>
          </button>
        </div>
      )}

    </div>
  );
}
