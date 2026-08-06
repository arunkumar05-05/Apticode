import React, { useState, useEffect } from 'react';
import { PlayCircle, CheckCircle2, ChevronRight, HelpCircle, Sparkles, Clock, Bookmark, RefreshCw, HelpCircle as HintIcon } from 'lucide-react';
import { apiFetch } from '../config/api';
import { LiquidBackdrop } from './ui/LiquidBackdrop';

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

  const loadTopics = async () => {
    try {
      setLoading(true);
      const data = await apiFetch<{ status?: string; topics?: any[] }>('/topics');
      if (data.status === 'success' && Array.isArray(data.topics)) {
        const verified = data.topics.map((t: any) => ({
          ...t,
          questions: (t.questions && Array.isArray(t.questions) && t.questions.length > 0)
            ? t.questions
            : (fallbackTopics.find(ft => ft.id === t.id)?.questions || fallbackTopics[0].questions),
          videos: t.videos || [
            { title: `${t.name} Core Explainer`, duration: '14:20' },
            { title: `Timed Practice Shortcuts`, duration: '10:50' }
          ],
          notes: t.notes || `### Study Notes for ${t.name}\n\nReview formulas and timed shortcuts to score higher in academic recruitment drives.`
        }));
        setTopicsData(verified);
        const matched = verified.find((t: any) => t.category === selectedCategory) || verified[0];
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
      const matched = topicsData.find((t) => t.category === selectedCategory) || topicsData[0];
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
      <div className="flex h-[400px] flex-col items-center justify-center space-y-3 font-mono text-xs text-lc-text-muted">
        <RefreshCw className="h-6 w-6 animate-spin text-lc-violet" />
        <span>Loading aptitude practice suites...</span>
      </div>
    );
  }

  const questionsList = (activeTopic && Array.isArray(activeTopic.questions) && activeTopic.questions.length > 0) 
    ? activeTopic.questions 
    : fallbackTopics[0].questions;
  const currentQuestion = questionsList.find((q) => q.difficulty === activeDifficulty) || questionsList[0] || fallbackTopics[0].questions[0];

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
    const hasDiff = questionsList.some(q => q.difficulty === diff);
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
    const scoreVal = isCorrect ? 100 : 0;
    const accuracy = isCorrect ? 100 : 0;
    const timeTaken = 120 - timeLeft;

    setSubmitting(true);
    try {
      await apiFetch('/mcqs/progress', {
        method: 'POST',
        body: JSON.stringify({
          topicId: activeTopic.id,
          score: scoreVal,
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
    <div className="relative overflow-hidden space-y-8 pb-12">
      <LiquidBackdrop />

      <div className="relative overflow-hidden pointer-events-none mb-6 lg:mb-8">
        <div className="lc-glass h-44 sm:h-52 lg:h-60 overflow-hidden">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 50%, var(--lc-brand-violet) 0%, transparent 70%)' }} />
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-8 text-left">
        {/* Sidebar: Categories and Topics */}
        <div className="md:col-span-1 space-y-4">
          {/* Mobile Horizontal Carousel */}
          <div className="md:hidden flex flex-col space-y-3 lc-glass p-3">
            <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hidden">
              {(['QUANTITATIVE', 'LOGICAL', 'VERBAL'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 cursor-pointer ${
                    selectedCategory === cat 
                      ? 'bg-lc-violet text-lc-text shadow-md shadow-lc-violet/20 border border-lc-violet/40' 
                      : 'bg-lc-void/40 text-lc-text-muted border border-lc-glass-border hover:bg-lc-glass-raised'
                  }`}
                >
                  {cat.charAt(0) + cat.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hidden border-t border-lc-glass-border pt-2">
              {categoryTopics.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => handleTopicSelect(topic)}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-all ${
                    activeTopic.id === topic.id 
                      ? 'bg-lc-glass-raised border border-lc-cyan/40 text-lc-cyan shadow-sm' 
                      : 'bg-lc-void/20 border border-lc-glass-border text-lc-text-muted hover:text-lc-text'
                  }`}
                >
                  {topic.name}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Sidebar */}
          <div className="hidden md:flex flex-col space-y-6">
            <div className="lc-glass p-4 flex flex-col space-y-2">
              <h3 className="text-xs font-bold text-lc-text-muted uppercase tracking-wider px-2 mb-2">Category Selection</h3>
              {(['QUANTITATIVE', 'LOGICAL', 'VERBAL'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedCategory === cat 
                      ? 'bg-lc-violet text-lc-text shadow-md shadow-lc-violet/20' 
                      : 'text-lc-text-muted hover:bg-lc-glass-raised'
                  }`}
                >
                  {cat.charAt(0) + cat.slice(1).toLowerCase()} Focus
                </button>
              ))}
            </div>

            {/* Topics List */}
            <div className="lc-glass p-4 space-y-2">
              <h3 className="text-xs font-bold text-lc-text-muted uppercase tracking-wider px-2 mb-2">Topics</h3>
              {categoryTopics.length === 0 ? (
                <p className="text-[10px] text-lc-text-muted px-2 italic">No topics available in this category.</p>
              ) : (
                categoryTopics.map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => handleTopicSelect(topic)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                      activeTopic.id === topic.id 
                        ? 'bg-lc-void/60 border border-lc-cyan/20 text-lc-cyan' 
                        : 'text-lc-text-muted hover:text-lc-text'
                    }`}
                  >
                    <span>{topic.name}</span>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="md:col-span-3 space-y-6">
          {/* Topic Title and Tabs */}
          <div className="lc-glass p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-[10px] font-bold text-lc-violet uppercase tracking-widest">{activeTopic.category}</span>
              <h2 className="text-xl font-bold text-lc-text mt-1">{activeTopic.name}</h2>
            </div>
            
            <div className="flex bg-lc-void/40 p-1 rounded-lg border border-lc-glass-border">
              {(['quiz', 'video', 'notes'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    activeTab === tab 
                      ? 'bg-lc-violet text-lc-text shadow' 
                      : 'text-lc-text-muted hover:text-lc-text'
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
                <div className="lc-glass p-8 text-center text-lc-text-muted text-xs font-mono">No practice questions available for this topic yet.</div>
              ) : (
                <>
                  {/* Panel header: Difficulties & Timers */}
                  <div className="lc-glass p-4 flex flex-wrap justify-between items-center gap-4">
                    <div className="flex space-x-1.5">
                      {(['EASY', 'MEDIUM', 'HARD'] as const).map((diff) => (
                        <button
                          key={diff}
                          onClick={() => handleDifficultyChange(diff)}
                          className={`px-3 py-1.5 rounded-lg border text-[9px] font-bold transition-all cursor-pointer ${
                            activeDifficulty === diff
                              ? 'bg-lc-cyan/10 border-lc-cyan text-lc-cyan'
                              : 'bg-lc-void/40 border-lc-glass-border text-lc-text-muted hover:text-lc-text'
                          }`}
                        >
                          {diff}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1.5 text-xs font-mono font-semibold text-lc-text-muted">
                        <Clock className="w-4 h-4 text-lc-text-muted" />
                        <span className={timeLeft < 20 ? 'text-lc-rose animate-pulse font-bold' : ''}>
                          {formatTime(timeLeft)}
                        </span>
                      </div>

                      <button 
                        onClick={toggleBookmark}
                        className={`p-2 rounded-lg border cursor-pointer transition-all ${
                          bookmarkedIds.includes(currentQuestion.id)
                            ? 'border-lc-violet/40 text-lc-violet bg-lc-violet/10'
                            : 'border-lc-glass-border text-lc-text-muted hover:text-lc-text'
                        }`}
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Question and choices card */}
                  <div className="lc-glass p-6 md:p-8 space-y-6">
                    <p className="text-sm md:text-base font-semibold leading-relaxed text-lc-text">
                      {currentQuestion.questionText}
                    </p>

                    <div className="grid gap-3">
                      {currentQuestion.options.map((opt, idx) => {
                        const isSelected = selectedAnswer === idx;
                        const isCorrectChoice = idx === currentQuestion.correctIndex;
                        
                        let btnStyle = "border-lc-glass-border bg-lc-void/20 text-lc-text-muted hover:bg-lc-glass-raised";
                        if (isSelected) {
                          btnStyle = "border-lc-violet bg-lc-violet/10 text-lc-violet";
                        }
                        if (quizSubmitted) {
                          if (isCorrectChoice) {
                            btnStyle = "border-lc-emerald/40 bg-lc-emerald/10 text-lc-emerald font-bold";
                          } else if (isSelected) {
                            btnStyle = "border-lc-rose/40 bg-lc-rose/10 text-lc-rose font-bold";
                          } else {
                            btnStyle = "border-lc-glass-border bg-lc-void/20 text-lc-text-muted opacity-60";
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
                            {quizSubmitted && isCorrectChoice && <CheckCircle2 className="w-4 h-4 text-lc-emerald shrink-0" />}
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
                            className="px-4 py-2.5 rounded-lg border border-lc-glass-border text-[10px] text-lc-text-muted font-bold flex items-center gap-1.5 hover:text-lc-text cursor-pointer"
                          >
                            <HintIcon className="w-3.5 h-3.5" />
                            <span>Show Hint</span>
                          </button>
                          <button
                            onClick={handleSubmitAnswer}
                            disabled={selectedAnswer === null || submitting}
                            className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-lc-violet to-lc-cyan text-lc-text text-xs font-bold disabled:opacity-40 transition-all flex items-center justify-center cursor-pointer shadow-md shadow-lc-violet/20"
                          >
                            {submitting ? 'Submitting attempt...' : 'Submit Answer'}
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={handleExplainWithAI}
                            disabled={isExplaining}
                            className="flex-1 py-2.5 rounded-lg border border-lc-cyan/20 bg-lc-cyan/10 text-lc-cyan text-xs font-bold hover:bg-lc-cyan/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <Sparkles className="w-4 h-4 fill-lc-cyan/20" />
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
                            className="py-2.5 px-6 rounded-lg bg-lc-glass-raised text-xs font-bold text-lc-text-muted hover:text-lc-text cursor-pointer"
                          >
                            Retry Question
                          </button>
                        </>
                      )}
                    </div>

                    {/* Hint Box */}
                    {showHint && !quizSubmitted && (
                      <div className="p-3.5 bg-lc-void/80 rounded-xl border border-lc-glass-border text-xs text-lc-text-muted flex items-start space-x-2">
                        <HelpCircle className="w-4 h-4 text-lc-violet shrink-0 mt-0.5" />
                        <span>{currentQuestion.hint}</span>
                      </div>
                    )}

                    {/* Streaming explanation box */}
                    {(isExplaining || streamingExplanation) && (
                      <div className="p-4 bg-lc-void/60 rounded-xl border border-lc-cyan/10 text-xs text-lc-text-muted leading-relaxed font-sans space-y-2">
                        <p className="font-extrabold text-lc-cyan flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 animate-pulse text-lc-cyan" />
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
            <div className="lc-glass p-6 space-y-4">
              <h3 className="text-xs font-bold text-lc-text-muted uppercase tracking-widest font-mono">Curated Explainer Lectures</h3>
              <div className="grid gap-3.5 md:grid-cols-2">
                {(activeTopic.videos || []).map((vid, idx) => (
                  <div key={idx} className="p-4 bg-lc-void/40 rounded-xl border border-lc-glass-border flex items-center justify-between text-xs font-mono">
                    <div className="space-y-1">
                      <p className="font-extrabold text-lc-text-muted">{vid.title}</p>
                      <p className="text-[10px] text-lc-text-muted">Duration: {vid.duration} mins</p>
                    </div>
                    <button className="p-2 rounded-lg bg-lc-glass-raised border border-lc-glass-border text-lc-cyan hover:bg-lc-cyan/10 cursor-pointer">
                      <PlayCircle className="w-4.5 h-4.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab content 3: Study Notes */}
          {activeTab === 'notes' && (
            <div className="lc-glass p-6 space-y-3 prose prose-invert font-sans max-w-none text-lc-text leading-relaxed text-xs">
              <h3 className="text-xs font-bold text-lc-text-muted uppercase tracking-widest font-mono border-b border-lc-glass-border pb-2">Topic Handbook Reference</h3>
              <div className="whitespace-pre-line pt-2">
                {activeTopic.notes}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
