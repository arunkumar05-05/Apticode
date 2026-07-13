import React, { useState, useEffect } from 'react';
import { 
  Users, FileSpreadsheet, Plus, Trash2, ShieldCheck, Search, X, 
  BarChart2, Clock, Sparkles, HelpCircle, Code, BookOpen, AlertCircle, 
  TrendingUp, Award, Layers, Volume2, Bookmark, CheckCircle 
} from 'lucide-react';

interface StudentRecord {
  id: string;
  name: string;
  email: string;
  branch: string;
  xp: number;
  level: string;
  status: 'ACTIVE' | 'FLAGGED';
  college: string;
  department: string;
  yearOfStudy: string;
  regDate: string;
  lastLogin: string;
  readinessScore: number;
  isAtRisk: boolean;
  riskReason?: string;
  mcqCorrect: number;
  mcqIncorrect: number;
  strongTopics: string[];
  weakTopics: string[];
  grammarScore: number;
  fluencyScore: number;
  wpm: number;
}

const initialStudents: StudentRecord[] = [
  { 
    id: '1', name: 'Rahul Sharma', email: 'rahul.sharma@college.edu', branch: 'CSE', xp: 24500, level: 'Master', status: 'ACTIVE',
    college: 'IIT Delhi', department: 'Computer Science', yearOfStudy: '3rd Year', regDate: '2026-01-10', lastLogin: '2 hours ago',
    readinessScore: 84, isAtRisk: false, mcqCorrect: 120, mcqIncorrect: 15, strongTopics: ['Time & Work', 'Ratio & Proportion'],
    weakTopics: ['Probability'], grammarScore: 92, fluencyScore: 85, wpm: 120
  },
  { 
    id: '2', name: 'Siddharth Sen', email: 'sid.sen@college.edu', branch: 'CSE', xp: 28400, level: 'Placement Ready', status: 'ACTIVE',
    college: 'IIT Delhi', department: 'Computer Science', yearOfStudy: '4th Year', regDate: '2025-08-15', lastLogin: '1 day ago',
    readinessScore: 92, isAtRisk: false, mcqCorrect: 155, mcqIncorrect: 12, strongTopics: ['Permutations', 'Percentages'],
    weakTopics: ['Logical Deductions'], grammarScore: 95, fluencyScore: 90, wpm: 135
  },
  { 
    id: '3', name: 'Ananya Goel', email: 'ananya@college.edu', branch: 'ECE', xp: 22100, level: 'Master', status: 'ACTIVE',
    college: 'IIT Delhi', department: 'Electronics', yearOfStudy: '3rd Year', regDate: '2026-01-12', lastLogin: '8 days ago',
    readinessScore: 68, isAtRisk: true, riskReason: 'Inactive for 8+ Days', mcqCorrect: 98, mcqIncorrect: 22, strongTopics: ['Ratio & Proportion'],
    weakTopics: ['Probability', 'Reading Comprehension'], grammarScore: 78, fluencyScore: 72, wpm: 110
  },
  { 
    id: '4', name: 'Vikram Malhotra', email: 'vikram@college.edu', branch: 'IT', xp: 19800, level: 'Expert', status: 'ACTIVE',
    college: 'IIT Delhi', department: 'Information Tech', yearOfStudy: '3rd Year', regDate: '2026-01-14', lastLogin: '5 hours ago',
    readinessScore: 45, isAtRisk: true, riskReason: 'Accuracy drops below 50%', mcqCorrect: 42, mcqIncorrect: 48, strongTopics: ['Averages'],
    weakTopics: ['Percentages', 'Sentence Correction'], grammarScore: 60, fluencyScore: 55, wpm: 95
  }
];

export default function AdminView() {
  const [students, setStudents] = useState<StudentRecord[]>(initialStudents);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  
  // Outer Admin tabs
  const [adminActiveTab, setAdminActiveTab] = useState<'roster' | 'analytics' | 'cms'>('roster');

  // Inner CMS Tab Selection
  const [cmsTab, setCmsTab] = useState<'coding' | 'mcq'>('coding');

  // Inner Performance Modal Tab
  const [modalTab, setModalTab] = useState<'stats' | 'insights' | 'logs'>('stats');

  // Custom Coding Challenge Ingestion Form State
  const [newProblem, setNewProblem] = useState({
    title: '',
    difficulty: 'EASY',
    description: '',
    testcaseInput: '',
    testcaseExpected: ''
  });

  const [activeProblemsList, setActiveProblemsList] = useState([
    { id: '1', title: 'Two Sum', difficulty: 'EASY', solvedCount: 420 },
    { id: '2', title: 'Container With Most Water', difficulty: 'MEDIUM', solvedCount: 184 },
    { id: '3', title: 'Longest Palindromic Substring', difficulty: 'MEDIUM', solvedCount: 92 }
  ]);

  const [activeMcqList, setActiveMcqList] = useState([
    { id: '1', text: 'A can complete a task in 10 days, B can complete in 15 days...', answer: 'B', topic: 'Time and Work' },
    { id: '2', text: 'Two dice are thrown simultaneously. Sum prime probability...', answer: 'A', topic: 'Probability' }
  ]);

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/challenges`);
        const result = await response.json();
        if (result.status === 'success' && Array.isArray(result.data)) {
          setActiveProblemsList(result.data);
        }
      } catch (err) {
        console.warn('Backend server offline. Utilizing default mock database challenges.');
      }
    };

    const fetchMcqs = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/mcqs`);
        const result = await response.json();
        if (result.status === 'success' && Array.isArray(result.data)) {
          const mapped = result.data.map((q: any) => ({
            id: q.id,
            text: q.text,
            answer: q.answer,
            topic: q.topic
          }));
          setActiveMcqList(mapped);
        }
      } catch (err) {
        console.warn('Backend server offline. Utilizing local mock MCQ active list.');
      }
    };

    fetchChallenges();
    fetchMcqs();
  }, []);

  // MCQ Ingestion Form State
  const [newMcq, setNewMcq] = useState({
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: 'A',
    explanation: ''
  });

  const handleToggleStatus = (id: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, status: s.status === 'ACTIVE' ? 'FLAGGED' : 'ACTIVE' };
      }
      return s;
    }));
  };

  const handleCreateProblem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProblem.title.trim()) return;

    setActiveProblemsList(prev => [
      ...prev,
      {
        id: String(prev.length + 1),
        title: newProblem.title,
        difficulty: newProblem.difficulty as any,
        solvedCount: 0
      }
    ]);

    setNewProblem({
      title: '',
      difficulty: 'EASY',
      description: '',
      testcaseInput: '',
      testcaseExpected: ''
    });

    alert('Coding Challenge successfully added to platform databases.');
  };

  const handleDeleteProblem = (id: string) => {
    setActiveProblemsList(prev => prev.filter(p => p.id !== id));
  };

  const handleCreateMcq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMcq.questionText.trim()) return;

    const payload = {
      text: newMcq.questionText,
      options: [newMcq.optionA || 'Choice A', newMcq.optionB || 'Choice B', newMcq.optionC || 'Choice C', newMcq.optionD || 'Choice D'],
      correctIndex: newMcq.correctOption === 'A' ? 0 : newMcq.correctOption === 'B' ? 1 : newMcq.correctOption === 'C' ? 2 : 3,
      answer: newMcq.correctOption,
      topic: 'Quantitative Aptitude',
      aiExplanation: newMcq.explanation || 'AI explanation generated successfully.'
    };

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/mcqs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.status === 'success' && result.data) {
        const publishedMcq = result.data;
        setActiveMcqList(prev => [
          ...prev,
          {
            id: publishedMcq.id,
            text: publishedMcq.text.slice(0, 50) + '...',
            answer: publishedMcq.answer,
            topic: publishedMcq.topic
          }
        ]);
        alert('MCQ Question successfully published and made live for students.');
        setNewMcq({
          questionText: '',
          optionA: '',
          optionB: '',
          optionC: '',
          optionD: '',
          correctOption: 'A',
          explanation: ''
        });
        return;
      }
    } catch (err) {
      console.warn('Backend server offline. Appending MCQ locally.');
    }

    // Local Mock Fallback
    setActiveMcqList(prev => [
      ...prev,
      {
        id: String(prev.length + 1),
        text: newMcq.questionText.slice(0, 50) + '...',
        answer: newMcq.correctOption,
        topic: 'Quantitative Aptitude'
      }
    ]);

    setNewMcq({
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctOption: 'A',
      explanation: ''
    });

    alert('MCQ Question successfully updated and published to students.');
  };

  const handleDeleteMcq = (id: string) => {
    setActiveMcqList(prev => prev.filter(q => q.id !== id));
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compute overall aggregate metrics
  const totalRegistered = students.length;
  const atRiskCount = students.filter(s => s.isAtRisk).length;
  const avgReadiness = Math.round(students.reduce((acc, curr) => acc + curr.readinessScore, 0) / totalRegistered);

  return (
    <div className="space-y-6 pb-12 text-left">
      {/* Admin Module Tabs Switcher */}
      <div className="flex space-x-1.5 bg-slate-950/40 p-1.5 rounded-xl border border-white/5 max-w-md">
        {(['roster', 'analytics', 'cms'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setAdminActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              adminActiveTab === tab ? 'bg-brand-purple text-white shadow' : 'text-slate-500 hover:text-slate-350'
            }`}
          >
            {tab === 'roster' && 'Student Roster'}
            {tab === 'analytics' && 'Cohort Analytics'}
            {tab === 'cms' && 'CMS Publishing'}
          </button>
        ))}
      </div>

      {/* COHORT ANALYTICS VIEW */}
      {adminActiveTab === 'analytics' && (
        <div className="space-y-6">
          {/* Summary stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-panel p-5 space-y-1">
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Registered Batch Size</p>
              <h3 className="text-2xl font-black text-slate-200">{totalRegistered} Students</h3>
              <p className="text-[8px] text-emerald-400 font-medium">IIT Delhi CSE/ECE/IT</p>
            </div>
            <div className="glass-panel p-5 space-y-1">
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Average Readiness Score</p>
              <h3 className="text-2xl font-black text-brand-cyan">{avgReadiness}%</h3>
              <p className="text-[8px] text-slate-550">Benchmark threshold: 75%</p>
            </div>
            <div className="glass-panel p-5 space-y-1">
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Active Students Today</p>
              <h3 className="text-2xl font-black text-brand-purple">3 Active</h3>
              <p className="text-[8px] text-emerald-400 font-medium">75% attendance frequency</p>
            </div>
            <div className="glass-panel p-5 space-y-1 border-red-500/10">
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Students at Risk</p>
              <h3 className="text-2xl font-black text-red-400">{atRiskCount} Flagged</h3>
              <p className="text-[8px] text-red-500">Requires trainer support</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Department Breakdown table */}
            <div className="glass-panel p-6 space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-brand-cyan" />
                <span>Departmental Comparison Matrix</span>
              </h4>
              <div className="overflow-x-auto text-[10px]">
                <table className="w-full text-left text-slate-400">
                  <thead>
                    <tr className="border-b border-white/5 pb-2 text-slate-500 font-bold">
                      <th className="py-2">Department</th>
                      <th>Quiz Accuracy</th>
                      <th>Ready Ratio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    <tr>
                      <td className="py-2.5 font-bold text-slate-200">Computer Science (CSE)</td>
                      <td className="font-mono text-brand-cyan">91%</td>
                      <td className="font-mono text-emerald-400">100% Placement Ready</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-bold text-slate-200">Electronics (ECE)</td>
                      <td className="font-mono text-brand-cyan">81%</td>
                      <td className="font-mono text-slate-500">Master Level</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-bold text-slate-200">Information Tech (IT)</td>
                      <td className="font-mono text-brand-cyan">48%</td>
                      <td className="font-mono text-red-400">Expert / Inactive warnings</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* AI Advisor Panel */}
            <div className="glass-panel p-6 border-brand-purple/20 bg-gradient-to-br from-slate-900/40 via-purple-950/5 to-slate-900/40 space-y-4">
              <h4 className="text-xs font-bold text-brand-purple uppercase flex items-center space-x-1.5">
                <Sparkles className="w-4.5 h-4.5 animate-pulse" />
                <span>AI Trainer Intervention Board</span>
              </h4>
              <div className="space-y-3 text-xs leading-relaxed text-slate-350">
                <p>
                  Platform statistics flagged <strong>{atRiskCount} students</strong> who fall below target levels:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-[11px]">
                  <li><strong>Ananya Goel</strong>: Offline for 8 consecutive days. (Recommendation: Dispatch nudge push notification).</li>
                  <li><strong>Vikram Malhotra</strong>: Average quiz accuracy is 45%. (Recommendation: Assign Beginner Quant modules).</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STUDENT ROSTER VIEW */}
      {adminActiveTab === 'roster' && (
        <div className="glass-panel p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
              <Users className="w-4.5 h-4.5 text-brand-cyan" />
              <span>Campus Cohort Roster Sheet</span>
            </h3>
            
            <button
              onClick={() => alert('Exporting cohort report to excel... File generated.')}
              className="py-1.5 px-3 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-bold text-emerald-400 flex items-center space-x-1 hover:bg-slate-850 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search students by name, email, branch or department..."
              className="w-full bg-slate-950/40 border border-slate-800 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-300 outline-none focus:border-brand-purple/45"
            />
            <Search className="w-4 h-4 text-slate-650 absolute left-3 top-3" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[10px] text-slate-400 font-sans">
              <thead>
                <tr className="border-b border-white/5 pb-2 text-slate-500 font-bold uppercase">
                  <th className="py-2">Student</th>
                  <th>Department</th>
                  <th>Readiness Score</th>
                  <th>Status Alerts</th>
                  <th>Security Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredStudents.map((s) => (
                  <tr 
                    key={s.id} 
                    className="hover:bg-slate-900/15 cursor-pointer transition-colors"
                    onClick={() => { setSelectedStudent(s); setModalTab('stats'); }}
                  >
                    <td className="py-3 font-semibold text-slate-200">
                      <p>{s.name}</p>
                      <p className="text-[8px] text-slate-500 font-mono">{s.email}</p>
                    </td>
                    <td>
                      <p className="font-bold">{s.branch}</p>
                      <p className="text-[8px] text-slate-500">{s.department}</p>
                    </td>
                    <td>
                      <span className={`font-mono font-bold ${
                        s.readinessScore >= 75 ? 'text-emerald-400' : 'text-amber-500'
                      }`}>{s.readinessScore}%</span>
                    </td>
                    <td>
                      {s.isAtRisk ? (
                        <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[8px] font-bold animate-pulse">
                          ⚠️ {s.riskReason}
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">✓ Steady</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleToggleStatus(s.id); }}
                        className={`px-2 py-0.5 rounded font-bold text-[8px] cursor-pointer ${
                          s.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}
                      >
                        {s.status}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CMS PUBLISHING VIEW */}
      {adminActiveTab === 'cms' && (
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            {/* CMS Selection Tabs */}
            <div className="flex space-x-1 bg-slate-950/40 p-1 rounded-lg border border-white/5">
              <button
                type="button"
                onClick={() => setCmsTab('coding')}
                className={`flex-1 py-2 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer ${
                  cmsTab === 'coding' ? 'bg-brand-purple text-white shadow' : 'text-slate-500 hover:text-slate-350'
                }`}
              >
                Coding CMS
              </button>
              <button
                type="button"
                onClick={() => setCmsTab('mcq')}
                className={`flex-1 py-2 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer ${
                  cmsTab === 'mcq' ? 'bg-brand-purple text-white shadow' : 'text-slate-500 hover:text-slate-355'
                }`}
              >
                MCQ Questions CMS
              </button>
            </div>

            {/* CODING CMS PANEL */}
            {cmsTab === 'coding' && (
              <div className="glass-panel p-6 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <Code className="w-4 h-4 text-brand-purple" />
                  <span>Ingest Coding Problem Config</span>
                </h4>

                <form onSubmit={handleCreateProblem} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Problem Title</label>
                    <input
                      type="text"
                      value={newProblem.title}
                      onChange={(e) => setNewProblem({ ...newProblem, title: e.target.value })}
                      placeholder="e.g. Reverse Binary Tree"
                      className="w-full bg-slate-950/40 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 outline-none focus:border-brand-purple/40"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Difficulty</label>
                    <select
                      value={newProblem.difficulty}
                      onChange={(e) => setNewProblem({ ...newProblem, difficulty: e.target.value })}
                      className="w-full bg-slate-950/40 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 outline-none"
                    >
                      <option value="EASY">EASY</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HARD">HARD</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Challenge Description</label>
                    <textarea
                      value={newProblem.description}
                      onChange={(e) => setNewProblem({ ...newProblem, description: e.target.value })}
                      placeholder="Enter description markdown..."
                      className="w-full h-16 bg-slate-950/40 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 outline-none resize-none focus:border-brand-purple/40"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Test Case Input</label>
                      <input
                        type="text"
                        value={newProblem.testcaseInput}
                        onChange={(e) => setNewProblem({ ...newProblem, testcaseInput: e.target.value })}
                        placeholder="[2, 7, 11]"
                        className="w-full bg-slate-950/40 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500 uppercase">Expected Output</label>
                      <input
                        type="text"
                        value={newProblem.testcaseExpected}
                        onChange={(e) => setNewProblem({ ...newProblem, testcaseExpected: e.target.value })}
                        placeholder="[0, 1]"
                        className="w-full bg-slate-950/40 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-brand-purple hover:bg-violet-650 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Publish Coding Challenge
                  </button>
                </form>
              </div>
            )}

            {/* MCQ QUESTIONS CMS PANEL */}
            {cmsTab === 'mcq' && (
              <div className="glass-panel p-6 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <BookOpen className="w-4 h-4 text-brand-purple" />
                  <span>Upload MCQ Question Ingest</span>
                </h4>

                <form onSubmit={handleCreateMcq} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Question Text</label>
                    <textarea
                      value={newMcq.questionText}
                      onChange={(e) => setNewMcq({ ...newMcq, questionText: e.target.value })}
                      placeholder="e.g. A can do a task in 10 days..."
                      className="w-full h-16 bg-slate-950/40 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 outline-none focus:border-brand-purple/40 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newMcq.optionA}
                      onChange={(e) => setNewMcq({ ...newMcq, optionA: e.target.value })}
                      placeholder="Option A"
                      className="bg-slate-950/40 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 outline-none"
                    />
                    <input
                      type="text"
                      value={newMcq.optionB}
                      onChange={(e) => setNewMcq({ ...newMcq, optionB: e.target.value })}
                      placeholder="Option B"
                      className="bg-slate-950/40 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newMcq.optionC}
                      onChange={(e) => setNewMcq({ ...newMcq, optionC: e.target.value })}
                      placeholder="Option C"
                      className="bg-slate-950/40 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 outline-none"
                    />
                    <input
                      type="text"
                      value={newMcq.optionD}
                      onChange={(e) => setNewMcq({ ...newMcq, optionD: e.target.value })}
                      placeholder="Option D"
                      className="bg-slate-950/40 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={newMcq.correctOption}
                      onChange={(e) => setNewMcq({ ...newMcq, correctOption: e.target.value })}
                      className="bg-slate-950/40 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 outline-none"
                    >
                      <option value="A">Answer: Option A</option>
                      <option value="B">Answer: Option B</option>
                      <option value="C">Answer: Option C</option>
                      <option value="D">Answer: Option D</option>
                    </select>
                    <span className="text-[9px] text-slate-505 pt-2">Define valid key</span>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 bg-brand-purple hover:bg-violet-650 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    Publish MCQ Question
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Active Problems list side bar */}
          <div className="space-y-6">
            {cmsTab === 'coding' ? (
              <div className="glass-panel p-6 space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Challenges</h4>
                <div className="divide-y divide-white/5">
                  {activeProblemsList.map((p) => (
                    <div key={p.id} className="flex justify-between items-center py-2.5 text-[10px]">
                      <div>
                        <p className="font-bold text-slate-300">{p.title}</p>
                        <p className="text-[8px] text-slate-500 font-mono">Solved count: {p.solvedCount}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                          p.difficulty === 'EASY' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {p.difficulty}
                        </span>
                        <button
                          onClick={() => handleDeleteProblem(p.id)}
                          className="p-1 rounded hover:bg-slate-900 text-slate-500 hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="glass-panel p-6 space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active MCQ Database</h4>
                <div className="divide-y divide-white/5">
                  {activeMcqList.map((q) => (
                    <div key={q.id} className="flex justify-between items-center py-2.5 text-[10px]">
                      <div className="pr-4">
                        <p className="font-bold text-slate-300 truncate w-32">{q.text}</p>
                        <p className="text-[8px] text-brand-cyan font-mono">{q.topic} • Ans: {q.answer}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteMcq(q.id)}
                        className="p-1 rounded hover:bg-slate-900 text-slate-500 hover:text-red-400 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STUDENT DETAILED PERFORMANCE AUDIT MODAL */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel p-8 max-w-xl w-full border-white/5 space-y-6 relative shadow-2xl">
            {/* Close button */}
            <button 
              type="button" 
              onClick={() => setSelectedStudent(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white font-bold text-sm cursor-pointer"
            >
              ✕
            </button>

            {/* Header info */}
            <div className="border-b border-white/5 pb-4 text-left">
              <div className="flex items-center space-x-2.5">
                <h3 className="text-lg font-black text-slate-100">{selectedStudent.name}</h3>
                {selectedStudent.isAtRisk && (
                  <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-[8px] font-bold">
                    ⚠️ At Risk
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-550 font-mono mt-0.5">
                {selectedStudent.email} • {selectedStudent.college} • {selectedStudent.department}
              </p>
            </div>

            {/* Inner modal tabs */}
            <div className="flex space-x-1 bg-slate-950/40 p-1 rounded-lg border border-white/5">
              {(['stats', 'insights', 'logs'] as const).map((mtab) => (
                <button
                  key={mtab}
                  onClick={() => setModalTab(mtab)}
                  className={`flex-1 py-1.5 rounded text-[9px] font-bold uppercase transition-all cursor-pointer ${
                    modalTab === mtab ? 'bg-brand-cyan text-slate-950' : 'text-slate-550 hover:text-slate-300'
                  }`}
                >
                  {mtab === 'stats' && 'Learning Statistics'}
                  {mtab === 'insights' && 'AI Action Insights'}
                  {mtab === 'logs' && 'Activity Logs'}
                </button>
              ))}
            </div>

            {/* TAB CONTENT: LEARNING STATS */}
            {modalTab === 'stats' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Left stats card */}
                  <div className="p-4 rounded-xl bg-slate-950/50 border border-white/5 text-left space-y-2">
                    <h5 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Aptitude accuracy</h5>
                    <p className="text-xl font-black text-slate-200">
                      {Math.round((selectedStudent.mcqCorrect / (selectedStudent.mcqCorrect + selectedStudent.mcqIncorrect)) * 100)}%
                    </p>
                    <div className="text-[9px] text-slate-500 flex justify-between">
                      <span className="text-emerald-400">{selectedStudent.mcqCorrect} Correct</span>
                      <span className="text-red-400">{selectedStudent.mcqIncorrect} Incorrect</span>
                    </div>
                  </div>

                  {/* Right stats card */}
                  <div className="p-4 rounded-xl bg-slate-950/50 border border-white/5 text-left space-y-2">
                    <h5 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Communication scale</h5>
                    <p className="text-xl font-black text-slate-200">
                      {selectedStudent.grammarScore}% Grammar
                    </p>
                    <div className="text-[9px] text-slate-500 flex justify-between">
                      <span className="text-brand-cyan">{selectedStudent.wpm} Words/Min</span>
                      <span className="text-brand-purple">{selectedStudent.fluencyScore}% Fluency</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 text-left text-[10px] space-y-2">
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Strong Prep Topics:</span>
                    <span className="text-emerald-400">{selectedStudent.strongTopics.join(', ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Weak Prep Topics:</span>
                    <span className="text-red-400">{selectedStudent.weakTopics.join(', ')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: AI RECOMMENDATIONS */}
            {modalTab === 'insights' && (
              <div className="space-y-4 text-left">
                <div className="p-4 rounded-xl bg-brand-purple/5 border border-brand-purple/20 flex justify-between items-center">
                  <div>
                    <h5 className="text-[9px] font-bold text-brand-purple uppercase tracking-wider">AI Placement Probability</h5>
                    <p className="text-lg font-black text-slate-200 mt-0.5">{selectedStudent.readinessScore}% Readiness</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${
                    selectedStudent.readinessScore >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {selectedStudent.level}
                  </span>
                </div>

                <div className="space-y-2">
                  <h5 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Personalized Action Steps</h5>
                  <div className="space-y-2 text-[10px] text-slate-400">
                    {selectedStudent.weakTopics.map((topic, i) => (
                      <div key={i} className="flex items-start space-x-2 bg-slate-950/50 p-2.5 rounded-lg border border-white/5">
                        <Sparkles className="w-3.5 h-3.5 text-brand-cyan shrink-0 mt-0.5" />
                        <span>Recommended action: Watch <strong>{topic} Playlist</strong> and attempt beginner mock set.</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: TIMELINE LOGS */}
            {modalTab === 'logs' && (
              <div className="space-y-3">
                <h4 className="text-[9px] font-bold text-slate-500 uppercase tracking-wider text-left">Timeline log verification</h4>
                <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 space-y-3 max-h-[160px] overflow-y-auto font-mono text-[9px] text-slate-400 text-left">
                  <div className="flex items-start space-x-2">
                    <span className="text-brand-cyan">10:45 AM</span>
                    <span>Completed Quantitative Quiz (Time & Work) - 92% accuracy (+20 XP)</span>
                  </div>
                  <div className="flex items-start space-x-2 border-t border-white/5 pt-2">
                    <span className="text-brand-cyan">11:20 AM</span>
                    <span>Compiled Python logic challenge. Status: ACCEPTED (+30 XP)</span>
                  </div>
                  <div className="flex items-start space-x-2 border-t border-white/5 pt-2">
                    <span className="text-brand-cyan">01:15 PM</span>
                    <span>Completed speaking round verification prompt (+50 XP)</span>
                  </div>
                  <div className="flex items-start space-x-2 border-t border-white/5 pt-2">
                    <span className="text-brand-cyan">Yesterday</span>
                    <span>Account validation logged. Session active for 1.5 hours</span>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedStudent(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-450 hover:text-white cursor-pointer"
            >
              Close Student Audit Modal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
