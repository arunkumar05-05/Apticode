import React, { useState, useEffect } from 'react';
import { PlayCircle, FileText, CheckCircle2, ChevronRight, HelpCircle, Sparkles, BookOpen, Clock } from 'lucide-react';

interface Topic {
  id: string;
  name: string;
  category: 'QUANTITATIVE' | 'LOGICAL' | 'VERBAL';
  videos: string[];
  notes: string;
  questions: {
    questionText: string;
    options: string[];
    correctIndex: number;
    aiExplanation: string;
  }[];
}

const topicsData: Topic[] = [
  {
    id: '1',
    name: 'Time and Work',
    category: 'QUANTITATIVE',
    videos: ['Time & Work Basics', 'Pipe & Cistern Problems', 'Alternate Days Formula'],
    notes: '### Concept: Work = Efficiency × Time\nIf a person A can do a piece of work in D days, A\'s 1-day work = 1/D.\nIf A is thrice as good a workman as B, then ratio of work done by A and B = 3:1.',
    questions: [
      {
        questionText: 'A can complete a task in 10 days, and B can complete the same task in 15 days. If they work together, how many days will they take?',
        options: ['5 Days', '6 Days', '8 Days', '4 Days'],
        correctIndex: 1,
        aiExplanation: '**Step-by-Step Mathematical Explanation:**\n\n1. **Identify the individual rates:**\n   - A\'s work rate per day = $1/10$\n   - B\'s work rate per day = $1/15$\n\n2. **Combine their rates when working together:**\n   - $\\text{Combined Rate} = 1/10 + 1/15$\n   - Find common denominator (30):\n     $$1/10 = 3/30$$\n     $$1/15 = 2/30$$\n     $$\\text{Combined Rate} = (3 + 2)/30 = 5/30 = 1/6$$\n\n3. **Compute total days required:**\n   - $\\text{Days} = \\text{Reciprocal of Rate} = 6\\text{ days}.$\n\nTherefore, A and B together take **6 Days**.'
      }
    ]
  },
  {
    id: '2',
    name: 'Probability & Combination',
    category: 'QUANTITATIVE',
    videos: ['Introduction to Probability', 'Permutations vs Combinations', 'Card & Coin Problems'],
    notes: '### Probability Formulas:\nP(A) = Number of Favorable Outcomes / Total Outcomes\nCombination Formula: C(n, r) = n! / (r! * (n - r)!)',
    questions: [
      {
        questionText: 'Two dice are thrown simultaneously. What is the probability that the sum of the numbers on the two dice is a prime number?',
        options: ['5/12', '7/12', '1/3', '15/36'],
        correctIndex: 0,
        aiExplanation: '**Step-by-Step Probability Explanation:**\n\n1. **Find total sample space outcomes:**\n   - Throwing two dice gives $6 \\times 6 = 36$ outcomes.\n\n2. **Identify favorable sums (Prime numbers: 2, 3, 5, 7, 11):**\n   - Sum of 2: (1,1) -> 1 way\n   - Sum of 3: (1,2), (2,1) -> 2 ways\n   - Sum of 5: (1,4), (2,3), (3,2), (4,1) -> 4 ways\n   - Sum of 7: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) -> 6 ways\n   - Sum of 11: (5,6), (6,5) -> 2 ways\n\n3. **Calculate total favorable ways:**\n   - Total ways = $1 + 2 + 4 + 6 + 2 = 15$\n\n4. **Divide by total sample space:**\n   - Probability = $15 / 36 = 5 / 12$.\n\nTherefore, the probability is **5/12**.'
      }
    ]
  }
];

export default function AptitudeView() {
  const [selectedCategory, setSelectedCategory] = useState<'QUANTITATIVE' | 'LOGICAL' | 'VERBAL'>('QUANTITATIVE');
  const [dynamicTopics, setDynamicTopics] = useState<Topic[]>(topicsData);
  const [activeTopic, setActiveTopic] = useState<Topic>(topicsData[0]);
  const [activeTab, setActiveTab] = useState<'video' | 'notes' | 'quiz'>('quiz');
  
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [streamingExplanation, setStreamingExplanation] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);

  useEffect(() => {
    const fetchLiveMcqs = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/mcqs');
        const result = await response.json();
        if (result.status === 'success' && Array.isArray(result.data)) {
          // Merge dynamic MCQs from the backend into matching topic buckets
          const updated = topicsData.map(topic => {
            const matchedQuestions = result.data.filter((q: any) => 
              q.topic.toLowerCase() === topic.name.toLowerCase()
            );
            if (matchedQuestions.length > 0) {
              const formatted = matchedQuestions.map((q: any) => ({
                questionText: q.text,
                options: q.options,
                correctIndex: q.correctIndex,
                aiExplanation: q.aiExplanation
              }));
              return {
                ...topic,
                questions: [...formatted, ...topic.questions]
              };
            }
            return topic;
          });

          setDynamicTopics(updated);

          // Keep current active topic synchronized
          const syncActive = updated.find(t => t.id === activeTopic.id);
          if (syncActive) {
            setActiveTopic(syncActive);
          }
        }
      } catch (err) {
        console.warn('Backend server offline. Utilizing baseline quiz questions.');
      }
    };
    fetchLiveMcqs();
  }, [activeTopic.id]);

  const handleTopicSelect = (topic: Topic) => {
    setActiveTopic(topic);
    setSelectedAnswer(null);
    setQuizSubmitted(false);
    setStreamingExplanation('');
    setIsExplaining(false);
  };

  const handleExplainWithAI = () => {
    if (selectedAnswer === null) return;
    setIsExplaining(true);
    setStreamingExplanation('');
    
    // Simulate streaming text typewriter effect
    const fullText = activeTopic.questions[0].aiExplanation;
    let index = 0;
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setStreamingExplanation((prev) => prev + fullText.charAt(index));
        index++;
      } else {
        clearInterval(interval);
        setIsExplaining(false);
      }
    }, 15);
  };

  return (
    <div className="grid md:grid-cols-4 gap-8 pb-12">
      {/* Sidebar: Categories and Topics */}
      <div className="md:col-span-1 space-y-6">
        <div className="glass-panel p-4 flex flex-col space-y-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 mb-2">Category Selection</h3>
          {(['QUANTITATIVE', 'LOGICAL', 'VERBAL'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedCategory === cat 
                  ? 'bg-brand-purple text-white shadow-md shadow-brand-purple/20' 
                  : 'text-slate-400 hover:bg-slate-900/60'
              }`}
            >
              {cat.charAt(0) + cat.slice(1).toLowerCase()} Aptitude
            </button>
          ))}
        </div>

        {/* Topics List */}
        <div className="glass-panel p-4 space-y-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 mb-2">Modules List</h3>
          {dynamicTopics
            .filter((t) => t.category === selectedCategory)
            .map((topic) => (
              <button
                key={topic.id}
                onClick={() => handleTopicSelect(topic)}
                className={`w-full text-left p-3 rounded-lg text-xs font-semibold flex items-center justify-between border transition-all ${
                  activeTopic.id === topic.id
                    ? 'bg-slate-900 border-brand-cyan/30 text-brand-cyan shadow-sm'
                    : 'border-transparent text-slate-400 hover:bg-slate-900/40'
                }`}
              >
                <span>{topic.name}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ))}
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="md:col-span-3 space-y-6">
        <div className="glass-panel overflow-hidden">
          {/* Header tabs */}
          <div className="flex border-b border-white/5 bg-slate-950/40 p-1">
            <button
              onClick={() => setActiveTab('quiz')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 text-xs font-bold transition-all ${
                activeTab === 'quiz' ? 'bg-slate-900 border border-white/5 rounded-lg text-brand-cyan' : 'text-slate-500'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Practice Quiz</span>
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 text-xs font-bold transition-all ${
                activeTab === 'video' ? 'bg-slate-900 border border-white/5 rounded-lg text-brand-cyan' : 'text-slate-500'
              }`}
            >
              <PlayCircle className="w-4 h-4" />
              <span>Video Lectures</span>
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 text-xs font-bold transition-all ${
                activeTab === 'notes' ? 'bg-slate-900 border border-white/5 rounded-lg text-brand-cyan' : 'text-slate-500'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Review Notes</span>
            </button>
          </div>

          <div className="p-6">
            {/* QUIZ TAB */}
            {activeTab === 'quiz' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center text-xs text-slate-400 border-b border-white/5 pb-4">
                  <span className="font-bold text-slate-200">Question 1 of 1</span>
                  <span className="flex items-center space-x-1 font-mono text-brand-cyan">
                    <Clock className="w-3.5 h-3.5" />
                    <span>01:45</span>
                  </span>
                </div>

                <p className="text-base font-semibold leading-relaxed text-slate-200">
                  {activeTopic.questions[0].questionText}
                </p>

                <div className="grid md:grid-cols-2 gap-4 pt-2">
                  {activeTopic.questions[0].options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => !quizSubmitted && setSelectedAnswer(idx)}
                      className={`p-4 rounded-xl border text-left text-xs font-semibold transition-all ${
                        selectedAnswer === idx
                          ? 'bg-brand-purple/10 border-brand-purple text-brand-purple'
                          : 'bg-slate-950/20 border-white/5 text-slate-400 hover:border-slate-800'
                      } ${
                        quizSubmitted && idx === activeTopic.questions[0].correctIndex
                          ? '!bg-emerald-500/10 !border-emerald-500 !text-emerald-400'
                          : ''
                      }`}
                    >
                      <span className="font-bold mr-2 text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-500">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      {option}
                    </button>
                  ))}
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={() => setQuizSubmitted(true)}
                    disabled={selectedAnswer === null || quizSubmitted}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-brand-purple to-brand-cyan font-bold text-xs text-white shadow-lg shadow-brand-purple/20 transition-all hover:brightness-110 disabled:opacity-50"
                  >
                    Submit Answer
                  </button>
                  <button
                    onClick={handleExplainWithAI}
                    disabled={selectedAnswer === null}
                    className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 font-bold text-xs text-brand-cyan flex items-center justify-center space-x-1.5 disabled:opacity-50 transition-all"
                  >
                    <Sparkles className="w-4 h-4 fill-brand-cyan/20" />
                    <span>Explain with AI</span>
                  </button>
                </div>

                {/* AI Explanation Stream Output */}
                {(streamingExplanation || isExplaining) && (
                  <div className="p-5 rounded-xl border border-brand-cyan/25 bg-slate-950/60 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-line relative">
                    <div className="absolute top-3 right-3 flex items-center space-x-1.5 text-[10px] text-brand-cyan">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      <span>Streaming Explanation</span>
                    </div>
                    {streamingExplanation}
                    {isExplaining && <span className="inline-block w-1.5 h-4 bg-brand-cyan ml-1 animate-pulse" />}
                  </div>
                )}
              </div>
            )}

            {/* VIDEO TAB */}
            {activeTab === 'video' && (
              <div className="space-y-6">
                <div className="relative aspect-video rounded-xl bg-slate-950 border border-white/5 flex items-center justify-center overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-brand-purple/10 to-brand-cyan/10" />
                  <PlayCircle className="w-16 h-16 text-brand-cyan opacity-80 group-hover:scale-110 transition-transform cursor-pointer" />
                  <span className="absolute bottom-4 left-4 text-xs font-mono bg-slate-950/80 px-2 py-1 rounded">
                    Mock YouTube Data Integration Layer
                  </span>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Playlists & Subtopics</h4>
                  {activeTopic.videos.map((vid, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-slate-950/40 border border-white/5 flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-300">{vid}</span>
                      <span className="text-[10px] font-mono text-slate-500">12:40 Min</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* NOTES TAB */}
            {activeTab === 'notes' && (
              <div className="space-y-4 font-sans text-sm text-slate-300 leading-relaxed">
                <div className="flex items-center space-x-2 text-brand-cyan mb-2">
                  <BookOpen className="w-4 h-4" />
                  <span className="text-xs font-extrabold uppercase tracking-wider">Core Formula Sheet</span>
                </div>
                <div className="p-5 rounded-xl bg-slate-950/40 border border-white/5 font-mono text-xs whitespace-pre-wrap">
                  {activeTopic.notes}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
