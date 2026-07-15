import React, { useState, useEffect } from 'react';
import { PlayCircle, FileText, CheckCircle2, ChevronRight, HelpCircle, Sparkles, BookOpen, Clock, Bookmark, AlertCircle, RefreshCw, HelpCircle as HintIcon } from 'lucide-react';

interface Question {
  id: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  questionText: string;
  options: string[];
  correctIndex: number;
  hint: string;
  aiExplanation: string;
}

interface Topic {
  id: string;
  name: string;
  category: 'QUANTITATIVE' | 'LOGICAL' | 'VERBAL';
  videos?: { title: string; duration: string }[];
  notes?: string;
  questions: Question[];
}

const fallbackTopics: Topic[] = [
  {
    id: 'q1',
    name: 'Time and Work',
    category: 'QUANTITATIVE',
    videos: [
      { title: 'Time & Work Basics & Fundamentals', duration: '12:40' },
      { title: 'Pipe & Cistern Shortcuts', duration: '15:20' }
    ],
    notes: '### Concept: Work = Efficiency × Time\nIf a person A can do work in D days, A\'s 1-day rate = 1/D.',
    questions: [
      {
        id: 'q1_1',
        difficulty: 'EASY',
        questionText: 'A can complete a task in 10 days, and B can complete the same task in 15 days. If they work together, how many days will they take?',
        options: ['5 Days', '6 Days', '8 Days', '4 Days'],
        correctIndex: 1,
        hint: 'Calculate their daily rates: 1/10 and 1/15, add them up, then invert the result.',
        aiExplanation: '1. Rate of A = 1/10 per day.\n2. Rate of B = 1/15 per day.\n3. Combined Rate = 1/10 + 1/15 = (3 + 2)/30 = 5/30 = 1/6.\n4. Reciprocal = 6 Days.'
      }
    ]
  }
];

export default function AptitudeView() {
  const [topicsData, setTopicsData] = useState<Topic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<'QUANTITATIVE' | 'LOGICAL' | 'VERBAL'>('QUANTITATIVE');
  const [activeTopic, setActiveTopic] = useState<Topic | null>(null);
  const [activeTab, setActiveTab] = useState<'quiz' | 'video' | 'notes'>('quiz');
  
  const [activeDifficulty, setActiveDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('EASY');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [streamingExplanation, setStreamingExplanation] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);
  
  const [timeLeft, setTimeLeft] = useState(120); 
  const [timerActive, setTimerActive] = useState(true);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const getHeaders = () => {
    const saved = localStorage.getItem('apticode-user-session');
    const token = saved ? JSON.parse(saved).token : '';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const loadTopics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/topics`, {
        headers: getHeaders()
      });
      const data = await response.json();
      if (data.status === 'success' && Array.isArray(data.topics)) {
        // Enforce fallback lists if topics don't have questions loaded
        const verified = data.topics.map((t: any) => ({
          ...t,
          videos: t.videos || [
            { title: `${t.name} Core Explainer`, duration: '14:20' },
            { title: `Timed Practice Shortcuts`, duration: '10:50' }
          ],
          notes: t.notes || `### Study Notes for ${t.name}\n\nReview formulas and timed shortcuts to score higher in academic recruitment drives.`
        }));
        setTopicsData(verified);
        const matched = verified.find((t: any) => t.category === selectedCategory);
        if (matched) {
          setActiveTopic(matched);
        }
      } else {
        setTopicsData(fallbackTopics);
        setActiveTopic(fallbackTopics[0]);
      }
    } catch (err) {
      console.warn('Failed to fetch API topics. Falling back to local data.');
      setTopicsData(fallbackTopics);
      setActiveTopic(fallbackTopics[0]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTopics();
  }, []);

  useEffect(() => {
    if (topicsData.length > 0) {
      const matched = topicsData.find((t) => t.category === selectedCategory);
      if (matched) {
        setActiveTopic(matched);
        setSelectedAnswer(null);
        setQuizSubmitted(false);
        setStreamingExplanation('');
        setIsExplaining(false);
      }
    }
  }, [selectedCategory]);

  useEffect(() => {
    if (!timerActive || timeLeft <= 0 || quizSubmitted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, timerActive, quizSubmitted]);

  useEffect(() => {
    if (activeTopic) {
      setTimeLeft(120);
      setTimerActive(true);
      setShowHint(false);
    }
  }, [activeTopic?.id, activeDifficulty]);

  if (loading || !activeTopic) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center space-y-3 font-mono text-xs text-slate-500">
        <RefreshCw className="h-6 w-6 animate-spin text-brand-purple" />
        <span>Loading aptitude practice suites...</span>
      </div>
    );
  }

  const currentQuestion = activeTopic.questions.find((q) => q.difficulty === activeDifficulty) || activeTopic.questions[0];

  const handleTopicSelect = (topic: Topic) => {
    setActiveTopic(topic);
    setSelectedAnswer(null);
    setQuizSubmitted(false);
    setStreamingExplanation('');
    setIsExplaining(false);
    if (topic.questions && topic.questions.length > 0) {
      if (topic.questions.some(q => q.difficulty === 'EASY')) {
        setActiveDifficulty('EASY');
      } else {
        setActiveDifficulty(topic.questions[0].difficulty);
      }
    }
  };

  const handleDifficultyChange = (diff: 'EASY' | 'MEDIUM' | 'HARD') => {
    const hasDiff = activeTopic.questions.some(q => q.difficulty === diff);
    if (!hasDiff) {
      alert(`No question available for ${diff} difficulty in this topic yet.`);
      return;
    }
    setActiveDifficulty(diff);
    setSelectedAnswer(null);
    setQuizSubmitted(false);
    setStreamingExplanation('');
    setIsExplaining(false);
  };

  const toggleBookmark = () => {
    if (!currentQuestion) return;
    const qId = currentQuestion.id;
    let updated: string[];
    if (bookmarkedIds.includes(qId)) {
      updated = bookmarkedIds.filter((id) => id !== qId);
    } else {
      updated = [...bookmarkedIds, qId];
    }
    setBookmarkedIds(updated);
    alert('Question bookmarked successfully!');
  };

  const handleSubmitAnswer = async () => {
    if (selectedAnswer === null || !currentQuestion) return;
    setQuizSubmitted(true);
    setTimerActive(false);

    const isCorrect = selectedAnswer === currentQuestion.correctIndex;
    const score = isCorrect ? 100 : 0;
    const accuracy = isCorrect ? 100 : 0;
    const timeTaken = 120 - timeLeft;

    try {
      setSubmitting(true);
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/mcqs/progress`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          topicId: activeTopic.id,
          score,
          accuracy,
          timeTaken,
          incorrectQuestions: isCorrect ? [] : [currentQuestion.id],
          topicPerformance: { [activeDifficulty]: isCorrect ? 1 : 0 }
        })
      });
    } catch (err) {
      console.error('[Aptitude attempt] submit failed:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExplainWithAI = () => {
    if (selectedAnswer === null || !currentQuestion) return;
    setIsExplaining(true);
    setStreamingExplanation('');
    
    const fullText = currentQuestion.aiExplanation || "Correct choice explanation generated successfully.";
    let index = 0;
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setStreamingExplanation((prev) => prev + fullText.charAt(index));
        index++;
      } else {
        clearInterval(interval);
        setIsExplaining(false);
      }
    }, 12);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const categoryTopics = topicsData.filter((t) => t.category === selectedCategory);

  return (
    <div className="grid md:grid-cols-4 gap-8 pb-12 text-left">
      {/* Sidebar: Categories and Topics */}
      <div className="md:col-span-1 space-y-6">
        <div className="glass-panel p-4 flex flex-col space-y-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 mb-2">Category Selection</h3>
          {(['QUANTITATIVE', 'LOGICAL', 'VERBAL'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                selectedCategory === cat 
                  ? 'bg-brand-purple text-white shadow-md shadow-brand-purple/20' 
                  : 'text-slate-400 hover:bg-slate-900/40'
              }`}
            >
              {cat.charAt(0) + cat.slice(1).toLowerCase()} Focus
            </button>
          ))}
        </div>

        {/* Topics List */}
        <div className="glass-panel p-4 space-y-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 mb-2">Topics</h3>
          {categoryTopics.length === 0 ? (
            <p className="text-[10px] text-slate-600 px-2 italic">No topics available in this category.</p>
          ) : (
            categoryTopics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => handleTopicSelect(topic)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                  activeTopic.id === topic.id 
                    ? 'bg-slate-950/60 border border-brand-cyan/20 text-brand-cyan' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{topic.name}</span>
                <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="md:col-span-3 space-y-6">
        {/* Topic Title and Tabs */}
        <div className="glass-panel p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-[10px] font-bold text-brand-purple uppercase tracking-widest">{activeTopic.category}</span>
            <h2 className="text-xl font-bold text-slate-200 mt-1">{activeTopic.name}</h2>
          </div>
          
          <div className="flex bg-slate-950/40 p-1 rounded-lg border border-slate-850">
            {(['quiz', 'video', 'notes'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${
                  activeTab === tab 
                    ? 'bg-brand-purple text-white shadow' 
                    : 'text-slate-500 hover:text-slate-350'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content 1: Timed Quiz */}
        {activeTab === 'quiz' && (
          <div className="space-y-6">
            {!currentQuestion ? (
              <div className="glass-panel p-8 text-center text-slate-500 text-xs font-mono">No practice questions available for this topic yet.</div>
            ) : (
              <>
                {/* Panel header: Difficulties & Timers */}
                <div className="glass-panel p-4 flex flex-wrap justify-between items-center gap-4">
                  <div className="flex space-x-1.5">
                    {(['EASY', 'MEDIUM', 'HARD'] as const).map((diff) => (
                      <button
                        key={diff}
                        onClick={() => handleDifficultyChange(diff)}
                        className={`px-3 py-1.5 rounded-lg border text-[9px] font-bold transition-all cursor-pointer ${
                          activeDifficulty === diff
                            ? 'bg-brand-cyan/10 border-brand-cyan text-brand-cyan'
                            : 'bg-slate-950/40 border-white/5 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1.5 text-xs font-mono font-semibold text-slate-400">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span className={timeLeft < 20 ? 'text-red-500 animate-pulse font-bold' : ''}>
                        {formatTime(timeLeft)}
                      </span>
                    </div>

                    <button 
                      onClick={toggleBookmark}
                      className={`p-2 rounded-lg border cursor-pointer transition-all ${
                        bookmarkedIds.includes(currentQuestion.id)
                          ? 'border-brand-purple/40 text-brand-purple bg-brand-purple/10'
                          : 'border-white/5 text-slate-500 hover:text-slate-350'
                      }`}
                    >
                      <Bookmark className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question and choices card */}
                <div className="glass-panel p-6 md:p-8 space-y-6">
                  <p className="text-sm md:text-base font-semibold leading-relaxed text-slate-200">
                    {currentQuestion.questionText}
                  </p>

                  <div className="grid gap-3">
                    {currentQuestion.options.map((opt, idx) => {
                      const isSelected = selectedAnswer === idx;
                      const isCorrectChoice = idx === currentQuestion.correctIndex;
                      
                      let btnStyle = "border-white/5 bg-slate-950/20 text-slate-350 hover:bg-slate-900/30";
                      if (isSelected) {
                        btnStyle = "border-brand-purple bg-brand-purple/10 text-brand-purple";
                      }
                      if (quizSubmitted) {
                        if (isCorrectChoice) {
                          btnStyle = "border-emerald-500/40 bg-emerald-500/10 text-emerald-400 font-bold";
                        } else if (isSelected) {
                          btnStyle = "border-red-500/40 bg-red-500/10 text-red-400 font-bold";
                        } else {
                          btnStyle = "border-white/5 bg-slate-950/20 text-slate-600 opacity-60";
                        }
                      }

                      return (
                        <button
                          key={idx}
                          disabled={quizSubmitted}
                          onClick={() => !quizSubmitted && setSelectedAnswer(idx)}
                          className={`w-full p-4 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${btnStyle}`}
                        >
                          <span>{opt}</span>
                          {quizSubmitted && isCorrectChoice && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Submission and Helper controls */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    {!quizSubmitted ? (
                      <>
                        <button
                          onClick={() => setShowHint(true)}
                          className="px-4 py-2.5 rounded-lg border border-slate-800 text-[10px] text-slate-400 font-bold flex items-center gap-1.5 hover:text-slate-200 cursor-pointer"
                        >
                          <HintIcon className="w-3.5 h-3.5" />
                          <span>Show Hint</span>
                        </button>
                        <button
                          onClick={handleSubmitAnswer}
                          disabled={selectedAnswer === null || submitting}
                          className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-brand-purple to-brand-cyan text-white text-xs font-bold disabled:opacity-40 transition-all flex items-center justify-center cursor-pointer shadow-md shadow-brand-purple/20"
                        >
                          {submitting ? 'Submitting attempt...' : 'Submit Answer'}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={handleExplainWithAI}
                          disabled={isExplaining}
                          className="flex-1 py-2.5 rounded-lg border border-brand-cyan/20 bg-brand-cyan/10 text-brand-cyan text-xs font-bold hover:bg-brand-cyan/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4 fill-brand-cyan/20" />
                          <span>AI Explanation Critique</span>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAnswer(null);
                            setQuizSubmitted(false);
                            setStreamingExplanation('');
                            setIsExplaining(false);
                            setTimeLeft(120);
                            setTimerActive(true);
                          }}
                          className="py-2.5 px-6 rounded-lg bg-slate-900 text-xs font-bold text-slate-350 hover:text-white cursor-pointer"
                        >
                          Retry Question
                        </button>
                      </>
                    )}
                  </div>

                  {/* Hint Box */}
                  {showHint && !quizSubmitted && (
                    <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80 text-xs text-slate-400 flex items-start space-x-2">
                      <HelpCircle className="w-4 h-4 text-brand-purple shrink-0 mt-0.5" />
                      <span>{currentQuestion.hint}</span>
                    </div>
                  )}

                  {/* Streaming explanation box */}
                  {(isExplaining || streamingExplanation) && (
                    <div className="p-4 bg-slate-950/60 rounded-xl border border-brand-cyan/10 text-xs text-slate-350 leading-relaxed font-sans space-y-2">
                      <p className="font-extrabold text-brand-cyan flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 animate-pulse text-brand-cyan" />
                        <span>AI Response Engine</span>
                      </p>
                      <p className="whitespace-pre-line">{streamingExplanation}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab content 2: Lecture Video */}
        {activeTab === 'video' && (
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Curated Explainer Lectures</h3>
            <div className="grid gap-3.5 md:grid-cols-2">
              {(activeTopic.videos || []).map((vid, idx) => (
                <div key={idx} className="p-4 bg-slate-950/40 rounded-xl border border-white/5 flex items-center justify-between text-xs font-mono">
                  <div className="space-y-1">
                    <p className="font-extrabold text-slate-350">{vid.title}</p>
                    <p className="text-[10px] text-slate-500">Duration: {vid.duration} mins</p>
                  </div>
                  <button className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-brand-cyan hover:bg-slate-850 cursor-pointer">
                    <PlayCircle className="w-4.5 h-4.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab content 3: Study Notes */}
        {activeTab === 'notes' && (
          <div className="glass-panel p-6 space-y-3 prose prose-invert font-sans max-w-none text-slate-300 leading-relaxed text-xs">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono border-b border-white/5 pb-2">Topic Handbook Reference</h3>
            <div className="whitespace-pre-line pt-2">
              {activeTopic.notes}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
