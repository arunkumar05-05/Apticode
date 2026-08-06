import React, { useState, useEffect } from 'react';
import { Clock, Play } from 'lucide-react';
import { apiFetch } from '../config/api';
import { LiquidBackdrop } from './ui/LiquidBackdrop';

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
  const [questions, setQuestions] = useState<TestQuestion[]>(mockQuestions);
  const [loadingQuestions, setLoadingQuestions] = useState<boolean>(false);
  const [questionSource, setQuestionSource] = useState<'AI' | 'STATIC'>('STATIC');

  const [score, setScore] = useState<number>(0);
  const [correctCount, setCorrectCount] = useState<number>(0);
  const [incorrectCount, setIncorrectCount] = useState<number>(0);
  const [_submitting, setSubmitting] = useState<boolean>(false);

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

  const handleStartTest = async () => {
    setCurrentIdx(0);
    setSelectedAnswers({});
    setTimeLeft(180);

    // Fetch AI-generated questions from the API
    setLoadingQuestions(true);
    try {
      const topicMap: Record<string, string> = {
        TOPIC: 'Time and Work',
        COMPANY: 'Google Interview',
        FULL: 'General Aptitude'
      };
      const json = await apiFetch<{ status?: string; data?: any[] }>('/mcqs/generate', {
        method: 'POST',
        body: JSON.stringify({ topic: topicMap[testType], count: testType === 'FULL' ? 10 : 5, difficulty: 'MEDIUM' })
      });
      if (json.status === 'success' && Array.isArray(json.data) && json.data.length > 0) {
        setQuestions(json.data.map((q: any) => ({
          questionText: q.questionText,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation
        })));
        setQuestionSource('AI');
      } else {
        setQuestions(mockQuestions);
        setQuestionSource('STATIC');
      }
    } catch {
      setQuestions(mockQuestions);
      setQuestionSource('STATIC');
    } finally {
      setLoadingQuestions(false);
      setTestState('ACTIVE');
    }
  };

  const handleAnswerSelect = (optionIdx: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [currentIdx]: optionIdx }));
  };

  const handleSubmitTest = async () => {
    let correct = 0;
    let incorrect = 0;
    questions.forEach((q, idx) => {
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
      await apiFetch('/mcqs/progress', {
        method: 'POST',
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
    <div className="relative overflow-hidden pb-12">
      <LiquidBackdrop />

      {/* Spheregrid scene band */}
      <div className="relative overflow-hidden pointer-events-none mb-6">
        <div className="lc-glass h-40 sm:h-48 lg:h-52 overflow-hidden">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 50%, var(--lc-brand-violet) 0%, transparent 70%)' }} />
        </div>
      </div>

      <div className="lc-glass p-6 max-w-3xl mx-auto text-left space-y-6">
        {/* SETUP VIEW */}
        {testState === 'SETUP' && (
          <div className="space-y-6">
            <div className="border-b border-lc-glass-border pb-4">
              <h2 className="text-2xl font-extrabold text-lc-text">Mock Test Simulator</h2>
              <p className="text-xs text-lc-text-muted font-mono mt-1">Simulate real technical and aptitude rounds with negative marking</p>
            </div>

            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-lc-text-muted uppercase tracking-wider">Test Scope</label>
                  <select
                    value={testType}
                    onChange={(e) => setTestType(e.target.value as any)}
                    className="w-full h-11 lc-neo rounded-xl px-3 text-xs font-semibold text-lc-text-muted outline-none"
                  >
                    <option value="TOPIC">Topic-wise mock (Quantitative focus)</option>
                    <option value="COMPANY">Company specific test (Google standard)</option>
                    <option value="FULL">Full mock length test</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-lc-text-muted uppercase tracking-wider">Marking Scheme</label>
                  <select
                    value={negativeMarking ? 'yes' : 'no'}
                    onChange={(e) => setNegativeMarking(e.target.value === 'yes')}
                    className="w-full h-11 lc-neo rounded-xl px-3 text-xs font-semibold text-lc-text-muted outline-none"
                  >
                    <option value="yes">Negative marking (+4, -1 schema)</option>
                    <option value="no">Normal marking (+4, 0 schema)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleStartTest}
                disabled={loadingQuestions}
                className="w-full h-12 rounded-xl lc-neo bg-gradient-to-r from-lc-violet to-lc-cyan text-lc-text font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {loadingQuestions ? (
                  <span className="animate-pulse">Generating AI questions…</span>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Launch Mock Test</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ACTIVE TEST VIEW */}
        {testState === 'ACTIVE' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-lc-glass-raised p-4 rounded-xl border-lc-glass-border text-xs font-mono">
              <span className="text-lc-text-muted">Question {currentIdx + 1} of {questions.length}</span>
              <div className="flex items-center space-x-2 font-bold text-lc-cyan">
                <Clock className="w-4 h-4 text-lc-text-muted" />
                <span>{formatTime(timeLeft)}</span>
              </div>
            </div>

            <div className="p-6 bg-lc-glass-raised rounded-xl border-lc-glass-border space-y-6">
              <p className="text-sm md:text-base font-semibold leading-relaxed text-lc-text">
                {questions[currentIdx].questionText}
              </p>

              <div className="grid gap-3">
                {questions[currentIdx].options.map((opt, oIdx) => {
                  const isSelected = selectedAnswers[currentIdx] === oIdx;
                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleAnswerSelect(oIdx)}
                      className={`w-full p-4 rounded-xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'border-lc-violet bg-lc-violet/10 text-lc-violet'
                          : 'border-lc-glass-border bg-lc-void/20 text-lc-text-muted hover:bg-lc-glass-raised'
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
                className="px-4 py-2.5 rounded-lg border-lc-glass-border text-[10px] text-lc-text-muted font-bold hover:text-lc-text cursor-pointer disabled:opacity-30"
              >
                Previous
              </button>

              {currentIdx < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIdx(prev => prev + 1)}
                  className="px-6 py-2.5 rounded-lg lc-neo text-[10px] text-lc-cyan font-bold cursor-pointer"
                >
                  Next Question
                </button>
              ) : (
                <button
                  onClick={handleSubmitTest}
                  className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-lc-violet to-lc-cyan text-lc-text text-[10px] font-bold cursor-pointer"
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
            <div className="p-6 bg-lc-glass-raised rounded-xl border-lc-glass-border text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-lc-cyan/10 border-lc-cyan/20 flex items-center justify-center text-xl font-black text-lc-cyan mx-auto">
                {score}
              </div>
              <div>
                <h3 className="text-base font-bold text-lc-text">Mock Test Report Card</h3>
                <p className="text-[10px] text-lc-text-muted font-mono mt-1">
                  {questionSource === 'AI' ? '✓ AI-generated questions' : 'Using curated question bank'} · Synced with database
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto text-xs font-mono pt-2">
                <div className="bg-lc-glass-raised p-2.5 rounded text-lc-emerald">Correct: {correctCount}</div>
                <div className="bg-lc-glass-raised p-2.5 rounded text-lc-rose">Wrong: {incorrectCount}</div>
                <div className="bg-lc-glass-raised p-2.5 rounded text-lc-violet">Accuracy: {
                  correctCount + incorrectCount > 0
                    ? Math.round((correctCount / (correctCount + incorrectCount)) * 100)
                    : 100
                }%</div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold text-lc-text-muted uppercase tracking-widest font-mono">Detailed Explanations</h4>
              <div className="space-y-3">
                {questions.map((q, idx) => {
                  const ans = selectedAnswers[idx];
                  const correct = ans === q.correctIndex;
                  return (
                    <div key={idx} className="p-4 bg-lc-glass-raised rounded-xl border-lc-glass-border space-y-2 text-xs">
                      <p className="font-extrabold text-lc-text">{idx + 1}. {q.questionText}</p>
                      <p className={`text-[10px] font-mono ${correct ? 'text-lc-emerald' : 'text-lc-rose'}`}>
                        Your choice: {ans !== undefined ? q.options[ans] : 'Skipped'} • {correct ? 'Correct' : 'Incorrect'}
                      </p>
                      <p className="text-[10px] text-lc-text-muted leading-relaxed font-sans">{q.explanation}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => setTestState('SETUP')}
              className="w-full py-3 lc-neo text-xs font-bold text-lc-cyan cursor-pointer transition-colors"
            >
              Start Another Simulation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
