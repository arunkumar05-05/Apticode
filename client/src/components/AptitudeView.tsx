import React, { useState, useEffect } from 'react';
import { PlayCircle, FileText, CheckCircle2, ChevronRight, HelpCircle, Sparkles, BookOpen, Clock, Bookmark, AlertCircle, Compass, HelpCircle as HintIcon } from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

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
  videos: { title: string; duration: string }[];
  notes: string;
  questions: Question[];
}

const topicsData: Topic[] = [
  // QUANTITATIVE
  {
    id: 'q1',
    name: 'Time and Work',
    category: 'QUANTITATIVE',
    videos: [
      { title: 'Time & Work Basics & Fundamentals', duration: '12:40' },
      { title: 'Pipe & Cistern Shortcuts', duration: '15:20' },
      { title: 'Alternate Days Work Efficiency', duration: '18:10' }
    ],
    notes: '### Concept: Work = Efficiency × Time\nIf a person A can do a piece of work in D days, A\'s 1-day work = 1/D.\nIf A is thrice as good a workman as B, then ratio of work done by A and B = 3:1.\n\n### Pipe & Cistern:\nIf an inlet pipe fills in X hours and outlet pipe empties in Y hours, net fill rate = 1/X - 1/Y.',
    questions: [
      {
        id: 'q1_1',
        difficulty: 'EASY',
        questionText: 'A can complete a task in 10 days, and B can complete the same task in 15 days. If they work together, how many days will they take?',
        options: ['5 Days', '6 Days', '8 Days', '4 Days'],
        correctIndex: 1,
        hint: 'Calculate their daily rates: 1/10 and 1/15, add them up, then invert the result.',
        aiExplanation: '1. Rate of A = 1/10 per day.\n2. Rate of B = 1/15 per day.\n3. Combined Rate = 1/10 + 1/15 = (3 + 2)/30 = 5/30 = 1/6.\n4. Reciprocal = 6 Days.'
      },
      {
        id: 'q1_2',
        difficulty: 'MEDIUM',
        questionText: 'A and B together can do a piece of work in 8 days. If A alone can do it in 12 days, in how many days can B alone do it?',
        options: ['16 Days', '20 Days', '24 Days', '28 Days'],
        correctIndex: 2,
        hint: 'Subtract A\'s rate (1/12) from the combined rate (1/8) to find B\'s rate.',
        aiExplanation: '1. Rate of A + B = 1/8.\n2. Rate of A = 1/12.\n3. Rate of B = 1/8 - 1/12 = (3 - 2)/24 = 1/24.\n4. B alone will take 24 Days.'
      },
      {
        id: 'q1_3',
        difficulty: 'HARD',
        questionText: 'A, B and C can do a piece of work in 20, 30 and 60 days respectively. In how many days can A do the work if he is assisted by B and C on every third day?',
        options: ['12 Days', '15 Days', '16 Days', '18 Days'],
        correctIndex: 1,
        hint: 'Calculate work done in a 3-day cycle: A works alone on Day 1 & 2, then A+B+C work on Day 3.',
        aiExplanation: '1. A\'s 1-day work = 1/20, B\'s = 1/30, C\'s = 1/60.\n2. Work done in first 2 days by A alone = 2 * (1/20) = 1/10.\n3. Work done on Day 3 (A+B+C) = 1/20 + 1/30 + 1/60 = 6/60 = 1/10.\n4. Total work done in 3-day cycle = 1/10 + 1/10 = 1/5.\n5. To complete the work, we need 5 cycles: 5 * 3 days = 15 Days.'
      }
    ]
  },
  {
    id: 'q2',
    name: 'Profit & Loss',
    category: 'QUANTITATIVE',
    videos: [
      { title: 'Profit, Loss & Markup Concepts', duration: '14:15' },
      { title: 'Successive Discount Tricks', duration: '11:50' }
    ],
    notes: '### Formula Sheet:\n* Profit % = (Profit / Cost Price) * 100\n* Loss % = (Loss / Cost Price) * 100\n* Selling Price (SP) = CP * (100 + Profit%) / 100\n* Markup % = (Marked Price - CP) / CP * 100',
    questions: [
      {
        id: 'q2_1',
        difficulty: 'EASY',
        questionText: 'A book was sold for $240 with a profit of 20%. What was the Cost Price (CP) of the book?',
        options: ['$180', '$200', '$210', '$220'],
        correctIndex: 1,
        hint: 'SP = CP * 1.20. Divide SP by 1.20 to solve for CP.',
        aiExplanation: '1. Profit = 20%, SP = $240.\n2. SP = CP * (1 + 20/100) => 240 = CP * 1.2 => CP = 240 / 1.2 = $200.'
      },
      {
        id: 'q2_2',
        difficulty: 'MEDIUM',
        questionText: 'If the Cost Price of 15 articles is equal to the Selling Price of 12 articles, find the profit percent.',
        options: ['15%', '20%', '25%', '30%'],
        correctIndex: 2,
        hint: 'Let CP of 1 article be $1. Then CP of 12 articles = $12, SP of 12 articles = $15.',
        aiExplanation: '1. Let CP of 1 article = $1. CP of 15 articles = $15.\n2. SP of 12 articles = CP of 15 articles = $15.\n3. CP of 12 articles = $12.\n4. Profit on selling 12 articles = $15 - $12 = $3.\n5. Profit % = (3 / 12) * 100 = 25%.'
      }
    ]
  },
  {
    id: 'q3',
    name: 'Average',
    category: 'QUANTITATIVE',
    videos: [
      { title: 'Average Calculations Made Easy', duration: '10:30' },
      { title: 'Weighted Average Tricks', duration: '14:40' }
    ],
    notes: '### Basic Formulas:\n* Average = Sum of Observations / Number of Observations\n* Average of first N natural numbers = (N + 1) / 2\n* Weighted Average = (w1*x1 + w2*x2) / (w1 + w2)',
    questions: [
      {
        id: 'q3_1',
        difficulty: 'EASY',
        questionText: 'The average of 5 consecutive odd numbers is 25. What is the largest of these numbers?',
        options: ['27', '29', '31', '33'],
        correctIndex: 1,
        hint: 'In consecutive odd numbers, the middle number is the average. Write out numbers centered at 25.',
        aiExplanation: '1. Since numbers are consecutive and odd, they are: x-4, x-2, x, x+2, x+4.\n2. The middle number is the average = 25.\n3. The sequence is: 21, 23, 25, 27, 29.\n4. Largest number is 29.'
      }
    ]
  },

  // LOGICAL
  {
    id: 'l1',
    name: 'Blood Relations',
    category: 'LOGICAL',
    videos: [
      { title: 'Blood Relation Family Tree Diagrams', duration: '13:50' },
      { title: 'Coded Blood Relations Tricks', duration: '16:05' }
    ],
    notes: '### Family Tree Symbols:\n* Circles = Females, Squares = Males\n* Double Lines (=) = Married Couple\n* Horizontal line (-) = Siblings\n* Vertical line (|) = Generations (parent-child relationship)',
    questions: [
      {
        id: 'l1_1',
        difficulty: 'EASY',
        questionText: 'Pointing to a photograph, a man said: "I have no brother or sister, but that man\'s father is my father\'s son." Whose photograph was it?',
        options: ['His nephew\'s', 'His son\'s', 'His father\'s', 'His own'],
        correctIndex: 1,
        hint: 'Identify who "my father\'s son" is, given the speaker has no siblings.',
        aiExplanation: '1. "My father\'s son" must be the speaker himself, since he has no siblings.\n2. Thus, the statement becomes: "That man\'s father is myself."\n3. This means the photograph is of his son.'
      },
      {
        id: 'l1_2',
        difficulty: 'MEDIUM',
        questionText: 'A is B\'s brother. C is A\'s mother. D is C\'s father. E is B\'s son. How is D related to A?',
        options: ['Grandfather', 'Grandson', 'Uncle', 'Father'],
        correctIndex: 0,
        hint: 'Draw the family tree: D is C\'s father, and C is parent to siblings A and B.',
        aiExplanation: '1. A is B\'s brother (generation 0).\n2. C is A\'s mother (generation +1).\n3. D is C\'s father (generation +2).\n4. D is C\'s father, which makes him the maternal grandfather of C\'s children A and B.'
      }
    ]
  },
  {
    id: 'l2',
    name: 'Coding Decoding',
    category: 'LOGICAL',
    videos: [
      { title: 'Letter Coding & Number Matching', duration: '11:10' }
    ],
    notes: '### Letter Value Map:\n* A=1, B=2, C=3, ..., Z=26\n* Reverse: Z=1, Y=2, ..., A=26 (Rule of 27: Letter + Reverse Letter = 27)\n* E-J-O-T-Y formula (5, 10, 15, 20, 25)',
    questions: [
      {
        id: 'l2_1',
        difficulty: 'EASY',
        questionText: 'If in a certain language, CHARCOAL is coded as 45162913, how is COAL coded?',
        options: ['4913', '4931', '4613', '4631'],
        correctIndex: 0,
        hint: 'Map each character index of CHARCOAL directly to its digits: C=4, H=5, A=1, R=6, C=2, O=9, A=1, L=3.',
        aiExplanation: '1. Find character associations: C=4, O=9, A=1, L=3.\n2. Therefore, COAL is 4913.'
      }
    ]
  },

  // VERBAL
  {
    id: 'v1',
    name: 'Error Spotting',
    category: 'VERBAL',
    videos: [
      { title: 'Subject Verb Agreement Rules', duration: '14:20' }
    ],
    notes: '### Top Spotting Rules:\n1. **Subject-Verb Agreement**: Singular subjects take singular verbs, plural subjects take plural verbs.\n2. **Tenses**: Check tense consistency throughout sentence structures.\n3. **Articles**: Check usage of a/an/the (e.g. an honest man, the sun).',
    questions: [
      {
        id: 'v1_1',
        difficulty: 'EASY',
        questionText: 'Identify the segment containing an error: "Neither of the plans (A) / were approved (B) / by the board (C) / No error (D)"',
        options: ['A', 'B', 'C', 'D'],
        correctIndex: 1,
        hint: 'The word "Neither" is a singular pronoun and requires a singular verb.',
        aiExplanation: '1. "Neither of the plans" is a singular subject.\n2. Plural verb "were approved" is incorrect; it must be "was approved".'
      }
    ]
  }
];

export default function AptitudeView() {
  const [selectedCategory, setSelectedCategory] = useState<'QUANTITATIVE' | 'LOGICAL' | 'VERBAL'>('QUANTITATIVE');
  const [activeTopic, setActiveTopic] = useState<Topic>(topicsData[0]);
  const [activeTab, setActiveTab] = useState<'quiz' | 'video' | 'notes'>('quiz');
  
  const [activeDifficulty, setActiveDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('EASY');
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [streamingExplanation, setStreamingExplanation] = useState('');
  const [isExplaining, setIsExplaining] = useState(false);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes per question
  const [timerActive, setTimerActive] = useState(true);

  // Bookmarks state (synced with Firestore)
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [showHint, setShowHint] = useState(false);

  // Synchronize category switch to first topic
  useEffect(() => {
    const firstCatTopic = topicsData.find((t) => t.category === selectedCategory);
    if (firstCatTopic) {
      handleTopicSelect(firstCatTopic);
    }
  }, [selectedCategory]);

  // Load Bookmarks from Firestore on Mount
  useEffect(() => {
    const loadBookmarks = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      try {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data.bookmarkedQuestions)) {
            setBookmarkedIds(data.bookmarkedQuestions);
          }
        }
      } catch (err) {
        console.error('Failed to load bookmarks:', err);
      }
    };
    loadBookmarks();
  }, []);

  // Timer Effect
  useEffect(() => {
    if (!timerActive || timeLeft <= 0 || quizSubmitted) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, timerActive, quizSubmitted]);

  // Reset timer on question change
  useEffect(() => {
    setTimeLeft(120);
    setTimerActive(true);
    setShowHint(false);
  }, [activeTopic.id, activeDifficulty]);

  // Find the question matching current difficulty
  const currentQuestion = activeTopic.questions.find((q) => q.difficulty === activeDifficulty) || activeTopic.questions[0];

  const handleTopicSelect = (topic: Topic) => {
    setActiveTopic(topic);
    setSelectedAnswer(null);
    setQuizSubmitted(false);
    setStreamingExplanation('');
    setIsExplaining(false);
    
    // Choose available difficulty
    if (topic.questions.some(q => q.difficulty === 'EASY')) {
      setActiveDifficulty('EASY');
    } else {
      setActiveDifficulty(topic.questions[0].difficulty);
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

  const toggleBookmark = async () => {
    const qId = currentQuestion.id;
    let updated: string[];
    if (bookmarkedIds.includes(qId)) {
      updated = bookmarkedIds.filter((id) => id !== qId);
    } else {
      updated = [...bookmarkedIds, qId];
    }
    setBookmarkedIds(updated);

    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const docRef = doc(db, 'users', currentUser.uid);
        await setDoc(docRef, { bookmarkedQuestions: updated }, { merge: true });
        console.log('[Bookmarks] Updated in Firestore successfully.');
      } catch (err) {
        console.error('Failed to sync bookmarks to Firestore:', err);
      }
    } else {
      localStorage.setItem('apticode_bookmarks', JSON.stringify(updated));
    }
  };

  const handleExplainWithAI = () => {
    if (selectedAnswer === null) return;
    setIsExplaining(true);
    setStreamingExplanation('');
    
    const fullText = currentQuestion.aiExplanation;
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

  // Format time (MM:SS)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

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
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition-all ${
                selectedCategory === cat 
                  ? 'bg-brand-purple text-white shadow-md shadow-brand-purple/20' 
                  : 'text-slate-400 hover:bg-slate-900/60'
              }`}
            >
              {cat.charAt(0) + cat.slice(1).toLowerCase()} Ability
            </button>
          ))}
        </div>

        {/* Topics List */}
        <div className="glass-panel p-4 space-y-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 mb-2 font-mono">Modules List</h3>
          {topicsData
            .filter((t) => t.category === selectedCategory)
            .map((topic) => (
              <button
                key={topic.id}
                onClick={() => handleTopicSelect(topic)}
                className={`w-full text-left p-3 rounded-lg text-xs font-semibold flex items-center justify-between border transition-all ${
                  activeTopic.id === topic.id
                    ? 'bg-slate-900 border-brand-cyan/30 text-brand-cyan shadow-sm'
                    : 'border-transparent text-slate-400 hover:bg-slate-900/45'
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
              className={`flex-1 flex items-center justify-center space-x-2 py-3.5 text-xs font-bold transition-all ${
                activeTab === 'quiz' ? 'bg-slate-900 border border-white/5 rounded-lg text-brand-cyan' : 'text-slate-500'
              }`}
            >
              <HelpCircle className="w-4 h-4" />
              <span>Practice Quiz</span>
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3.5 text-xs font-bold transition-all ${
                activeTab === 'video' ? 'bg-slate-900 border border-white/5 rounded-lg text-brand-cyan' : 'text-slate-500'
              }`}
            >
              <PlayCircle className="w-4 h-4" />
              <span>Video Lectures</span>
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 flex items-center justify-center space-x-2 py-3.5 text-xs font-bold transition-all ${
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
                {/* Upper bar: Difficulty selection, timer, bookmark */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
                  <div className="flex space-x-2">
                    {(['EASY', 'MEDIUM', 'HARD'] as const).map((diff) => (
                      <button
                        key={diff}
                        onClick={() => handleDifficultyChange(diff)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase transition-all ${
                          activeDifficulty === diff
                            ? 'bg-slate-950 border border-white/10 text-brand-cyan shadow'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center space-x-3 text-xs">
                    <button
                      onClick={toggleBookmark}
                      className={`p-2 rounded-lg border transition-colors flex items-center justify-center ${
                        bookmarkedIds.includes(currentQuestion.id)
                          ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                          : 'border-white/5 bg-slate-950/20 text-slate-500 hover:text-slate-300'
                      }`}
                      title="Bookmark Question"
                    >
                      <Bookmark className="w-4 h-4 fill-current" />
                    </button>

                    <span className="flex items-center space-x-1.5 font-mono text-brand-cyan bg-slate-950/40 border border-white/5 px-3 py-1.5 rounded-lg">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{timeLeft > 0 ? formatTime(timeLeft) : 'Time Up!'}</span>
                    </span>
                  </div>
                </div>

                <p className="text-base font-semibold leading-relaxed text-slate-200">
                  {currentQuestion.questionText}
                </p>

                <div className="grid md:grid-cols-2 gap-4 pt-2">
                  {currentQuestion.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => !quizSubmitted && setSelectedAnswer(idx)}
                      className={`p-4 rounded-xl border text-left text-xs font-semibold transition-all ${
                        selectedAnswer === idx
                          ? 'bg-brand-purple/10 border-brand-purple text-brand-purple font-bold'
                          : 'bg-slate-950/20 border-white/5 text-slate-400 hover:border-slate-800'
                      } ${
                        quizSubmitted && idx === currentQuestion.correctIndex
                          ? '!bg-emerald-500/10 !border-emerald-500 !text-emerald-400'
                          : ''
                      } ${
                        quizSubmitted && selectedAnswer === idx && idx !== currentQuestion.correctIndex
                          ? '!bg-red-500/10 !border-red-500 !text-red-400'
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

                {/* Question Actions */}
                <div className="flex flex-wrap gap-4 pt-4">
                  <button
                    onClick={() => setQuizSubmitted(true)}
                    disabled={selectedAnswer === null || quizSubmitted}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-purple to-brand-cyan font-bold text-xs text-white shadow-lg shadow-brand-purple/20 transition-all hover:brightness-110 disabled:opacity-50 min-w-[120px]"
                  >
                    Submit Answer
                  </button>
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className="py-3 px-4 rounded-xl bg-slate-950/40 hover:bg-slate-900 border border-white/5 font-bold text-xs text-slate-400 flex items-center justify-center space-x-1.5 transition-all"
                  >
                    <HintIcon className="w-4 h-4" />
                    <span>{showHint ? 'Hide Hint' : 'Get Hint'}</span>
                  </button>
                  <button
                    onClick={handleExplainWithAI}
                    disabled={selectedAnswer === null}
                    className="py-3 px-5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 font-bold text-xs text-brand-cyan flex items-center justify-center space-x-1.5 disabled:opacity-50 transition-all"
                  >
                    <Sparkles className="w-4 h-4 fill-brand-cyan/20" />
                    <span>Explain with AI</span>
                  </button>
                </div>

                {/* Hint Display */}
                {showHint && (
                  <div className="p-4 rounded-xl border border-amber-500/15 bg-amber-500/5 text-xs text-amber-200/90 leading-relaxed flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span><strong>Hint:</strong> {currentQuestion.hint}</span>
                  </div>
                )}

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
                    AptiCode Video Player Classroom
                  </span>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Lectures Playlist</h4>
                  {activeTopic.videos.map((vid, idx) => (
                    <div key={idx} className="p-3.5 rounded-lg bg-slate-950/40 border border-white/5 flex items-center justify-between text-xs hover:border-brand-purple/20 transition-all">
                      <div className="flex items-center space-x-3">
                        <PlayCircle className="w-4 h-4 text-brand-purple" />
                        <span className="font-semibold text-slate-300">{vid.title}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-550">{vid.duration} Min</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* NOTES TAB */}
            {activeTab === 'notes' && (
              <div className="space-y-4 font-sans text-sm text-slate-300 leading-relaxed">
                <div className="flex items-center space-x-2 text-brand-cyan mb-2">
                  <BookOpen className="w-4 h-4 text-brand-cyan" />
                  <span className="text-xs font-extrabold uppercase tracking-wider font-mono">Formula Cheat Sheet & Quick Notes</span>
                </div>
                <div className="p-6 rounded-xl bg-slate-950/40 border border-white/5 font-mono text-xs whitespace-pre-wrap leading-6">
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
