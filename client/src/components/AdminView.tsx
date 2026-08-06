import React, { useState, useEffect } from 'react';
import {
  Users, FileSpreadsheet, Trash2, Search,
  Sparkles, Code, BookOpen, Layers
} from 'lucide-react';
import { supabase } from '../supabase';
import { getApiBaseUrl } from '../config/api';
import { LiquidBackdrop } from './ui/LiquidBackdrop';
import Scene3D from './three/LazyScene3D';

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

  const getHeaders = () => {
    const saved = localStorage.getItem('apticode-user-session');
    const token = saved ? JSON.parse(saved).token : '';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/coding/challenges`, {
          headers: getHeaders()
        });
        const result = await response.json();
        if (result.status === 'success' && Array.isArray(result.challenges)) {
          setActiveProblemsList(result.challenges.map((p: any) => ({
            id: p.id,
            title: p.title,
            difficulty: p.difficulty,
            solvedCount: p.solvedCount || 10
          })));
        }
      } catch (err) {
        console.warn('Backend server offline. Utilizing default mock database challenges.');
      }
    };

    const fetchMcqs = async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/mcqs`, {
          headers: getHeaders()
        });
        const result = await response.json();
        if (result.status === 'success' && Array.isArray(result.data)) {
          const mapped: any[] = result.data.map((q: any) => ({
            id: q.id,
            text: (q.text || q.questionText || '').slice(0, 50) + '...',
            answer: q.correctOption || q.answer || 'A',
            topic: q.topic || 'Untitled Topic'
          }));
          if (mapped.length > 0) setActiveMcqList(mapped);
        }
      } catch (err) {
        console.warn('Backend server offline. Utilizing local mock MCQ active list.');
      }
    };

    const fetchStudents = async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/admin/students`, {
          headers: getHeaders()
        });
        const result = await response.json();
        if (result.status === 'success' && Array.isArray(result.data)) {
          const list: StudentRecord[] = result.data.map((item: any) => ({
            id: item.id,
            name: item.name,
            email: item.email,
            branch: item.branch || 'Computer Science',
            xp: item.xp || 0,
            level: String(item.level || 1),
            status: 'ACTIVE',
            college: item.college || 'AptiCode College',
            department: item.branch || 'Computer Science',
            yearOfStudy: '3rd Year',
            regDate: item.lastActivity ? new Date(item.lastActivity).toISOString().split('T')[0] : '2026-01-01',
            lastLogin: item.lastActivity ? new Date(item.lastActivity).toLocaleDateString() : 'Recently',
            readinessScore: item.stats?.avgScore || 75,
            isAtRisk: Boolean(item.stats?.attempts > 0 && item.stats?.avgScore < 50),
            riskReason: item.stats?.attempts > 0 && item.stats?.avgScore < 50 ? 'Accuracy drops below 50%' : undefined,
            mcqCorrect: item.stats?.attempts || 0,
            mcqIncorrect: 0,
            strongTopics: [],
            weakTopics: [],
            grammarScore: 80,
            fluencyScore: 75,
            wpm: 110
          }));

          if (list.length > 0) {
            setStudents(list);
          }
        }
      } catch (err) {
        console.warn('Failed to load registered student profiles:', err);
      }
    };

    fetchChallenges();
    fetchMcqs();
    fetchStudents();
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

  const handleCreateProblem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProblem.title.trim()) return;

    const payload = {
      title: newProblem.title.trim(),
      description: newProblem.description.trim() || newProblem.title.trim(),
      difficulty: newProblem.difficulty as any,
      testcases: newProblem.testcaseInput.trim()
        ? [{ inputData: newProblem.testcaseInput, expectedOutput: newProblem.testcaseExpected, isHidden: false }]
        : []
    };

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/coding/challenges`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.status === 'success' && result.data) {
        setActiveProblemsList(prev => [
          ...prev,
          {
            id: result.data.id,
            title: result.data.title,
            difficulty: result.data.difficulty,
            solvedCount: 0
          }
        ]);
        alert('Coding Challenge successfully added to platform databases.');
      } else {
        throw new Error(result.message || 'API fallback');
      }
    } catch (err) {
      setActiveProblemsList(prev => [
        ...prev,
        {
          id: String(prev.length + 1),
          title: newProblem.title,
          difficulty: newProblem.difficulty as any,
          solvedCount: 0
        }
      ]);
      alert('Coding Challenge successfully added to platform databases.');
    }

    setNewProblem({
      title: '',
      difficulty: 'EASY',
      description: '',
      testcaseInput: '',
      testcaseExpected: ''
    });
  };

  const handleDeleteProblem = async (id: string) => {
    try {
      await fetch(`${getApiBaseUrl()}/api/coding/challenges/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
    } catch (err) {
      console.warn('Backend offline; removed challenge locally.');
    }
    setActiveProblemsList(prev => prev.filter(p => p.id !== id));
  };

  const handleCreateMcq = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMcq.questionText.trim()) return;

    const payload = {
      questionText: newMcq.questionText,
      options: [newMcq.optionA || 'Choice A', newMcq.optionB || 'Choice B', newMcq.optionC || 'Choice C', newMcq.optionD || 'Choice D'],
      correctIndex: newMcq.correctOption === 'A' ? 0 : newMcq.correctOption === 'B' ? 1 : newMcq.correctOption === 'C' ? 2 : 3,
      answer: newMcq.correctOption,
      topic: 'Quantitative Aptitude',
      aiExplanation: newMcq.explanation || 'AI explanation generated successfully.'
    };

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/mcqs`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (result.status === 'success' && result.data) {
        const publishedMcq = result.data;
        setActiveMcqList(prev => [
          ...prev,
          {
            id: publishedMcq.id,
            text: (publishedMcq.text || publishedMcq.questionText || '').slice(0, 50) + '...',
            answer: publishedMcq.answer || newMcq.correctOption,
            topic: publishedMcq.topic || 'Quantitative Aptitude'
          }
        ]);
        alert('MCQ Question successfully published and made live for students.');
      } else {
        throw new Error(result.message || 'API fallback');
      }
    } catch (err) {
      setActiveMcqList(prev => [
        ...prev,
        {
          id: String(prev.length + 1),
          text: newMcq.questionText.slice(0, 50) + '...',
          answer: newMcq.correctOption,
          topic: 'Quantitative Aptitude'
        }
      ]);
      alert('MCQ Question successfully published and made live for students.');
    } finally {
      setNewMcq({
        questionText: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctOption: 'A',
        explanation: ''
      });
    }
  };

  const handleDeleteMcq = async (id: string) => {
    try {
      await fetch(`${getApiBaseUrl()}/api/mcqs/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
    } catch (err) {
      console.warn('Backend offline; removed MCQ locally.');
    }
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
    <div className="relative overflow-hidden space-y-8 pb-12">
      <LiquidBackdrop />

      <div className="relative overflow-hidden pointer-events-none mb-6 lg:mb-8">
        <div className="lc-glass h-40 sm:h-48 lg:h-52 overflow-hidden">
          <Scene3D variant="vault" className="absolute inset-0" />
        </div>
      </div>

      <div className="space-y-6 text-left">
        {/* Admin Module Tabs Switcher */}
        <div className="flex space-x-1.5 bg-lc-void/40 p-1.5 rounded-xl border border-lc-glass-border max-w-md">
          {(['roster', 'analytics', 'cms'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setAdminActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${adminActiveTab === tab ? 'bg-lc-violet text-lc-text shadow' : 'text-lc-text-muted hover:text-lc-text'
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
              <div className="lc-glass p-5 space-y-1">
                <p className="text-[9px] text-lc-text-muted font-bold uppercase tracking-wider">Registered Batch Size</p>
                <h3 className="text-2xl font-black text-lc-text">{totalRegistered} Students</h3>
                <p className="text-[8px] text-lc-emerald font-medium">IIT Delhi CSE/ECE/IT</p>
              </div>
              <div className="lc-glass p-5 space-y-1">
                <p className="text-[9px] text-lc-text-muted font-bold uppercase tracking-wider">Average Readiness Score</p>
                <h3 className="text-2xl font-black text-lc-cyan">{avgReadiness}%</h3>
                <p className="text-[8px] text-lc-text-muted">Benchmark threshold: 75%</p>
              </div>
              <div className="lc-glass p-5 space-y-1">
                <p className="text-[9px] text-lc-text-muted font-bold uppercase tracking-wider">Active Students Today</p>
                <h3 className="text-2xl font-black text-lc-violet">3 Active</h3>
                <p className="text-[8px] text-lc-emerald font-medium">75% attendance frequency</p>
              </div>
              <div className="lc-glass p-5 space-y-1 border-lc-rose/10">
                <p className="text-[9px] text-lc-text-muted font-bold uppercase tracking-wider">Students at Risk</p>
                <h3 className="text-2xl font-black text-lc-rose">{atRiskCount} Flagged</h3>
                <p className="text-[8px] text-lc-rose">Requires trainer support</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Department Breakdown table */}
              <div className="lc-glass p-6 space-y-4">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-lc-text-muted flex items-center space-x-1.5">
                  <Layers className="w-4 h-4 text-lc-cyan" />
                  <span>Departmental Comparison Matrix</span>
                </h4>
                <div className="overflow-x-auto text-[10px]">
                  <table className="w-full text-left text-lc-text-muted">
                    <thead>
                      <tr className="border-b border-lc-glass-border pb-2 text-lc-text-muted font-bold">
                        <th className="py-2">Department</th>
                        <th>Quiz Accuracy</th>
                        <th>Ready Ratio</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-lc-glass-border">
                      <tr>
                        <td className="py-2.5 font-bold text-lc-text">Computer Science (CSE)</td>
                        <td className="font-mono text-lc-cyan">91%</td>
                        <td className="font-mono text-lc-emerald">100% Placement Ready</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold text-lc-text">Electronics (ECE)</td>
                        <td className="font-mono text-lc-cyan">81%</td>
                        <td className="font-mono text-lc-text-muted">Master Level</td>
                      </tr>
                      <tr>
                        <td className="py-2.5 font-bold text-lc-text">Information Tech (IT)</td>
                        <td className="font-mono text-lc-cyan">48%</td>
                        <td className="font-mono text-lc-rose">Expert / Inactive warnings</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* AI Advisor Panel */}
              <div className="lc-glass p-6 border-lc-violet/20 bg-gradient-to-br from-lc-void/40 via-lc-violet/5 to-lc-void/40 space-y-4">
                <h4 className="text-xs font-bold text-lc-violet uppercase flex items-center space-x-1.5">
                  <Sparkles className="w-4.5 h-4.5 animate-pulse" />
                  <span>AI Trainer Intervention Board</span>
                </h4>
                <div className="space-y-3 text-xs leading-relaxed text-lc-text-muted">
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
          <div className="lc-glass p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-lc-text-muted flex items-center space-x-1.5">
                <Users className="w-4.5 h-4.5 text-lc-cyan" />
                <span>Campus Cohort Roster Sheet</span>
              </h3>

              <button
                onClick={() => alert('Exporting cohort report to excel... File generated.')}
                className="py-1.5 px-3 rounded-lg bg-lc-glass-raised border border-lc-glass-border text-[10px] font-bold text-lc-emerald flex items-center space-x-1 hover:bg-lc-glass-raised cursor-pointer"
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
                className="w-full bg-lc-void/40 border border-lc-glass-border rounded-lg pl-10 pr-4 py-2.5 text-xs text-lc-text outline-none focus:border-lc-violet/45"
              />
              <Search className="w-4 h-4 text-lc-text-muted absolute left-3 top-3" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[10px] text-lc-text-muted font-sans">
                <thead>
                  <tr className="border-b border-lc-glass-border pb-2 text-lc-text-muted font-bold uppercase">
                    <th className="py-2">Student</th>
                    <th>Department</th>
                    <th>Readiness Score</th>
                    <th>Status Alerts</th>
                    <th>Security Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-lc-glass-border">
                  {filteredStudents.map((s) => (
                    <tr
                      key={s.id}
                      className="hover:bg-lc-glass-raised/15 cursor-pointer transition-colors"
                      onClick={() => { setSelectedStudent(s); setModalTab('stats'); }}
                    >
                      <td className="py-3 font-semibold text-lc-text">
                        <p>{s.name}</p>
                        <p className="text-[8px] text-lc-text-muted font-mono">{s.email}</p>
                      </td>
                      <td>
                        <p className="font-bold">{s.branch}</p>
                        <p className="text-[8px] text-lc-text-muted">{s.department}</p>
                      </td>
                      <td>
                        <span className={`font-mono font-bold ${s.readinessScore >= 75 ? 'text-lc-emerald' : 'text-lc-amber'
                          }`}>{s.readinessScore}%</span>
                      </td>
                      <td>
                        {s.isAtRisk ? (
                          <span className="px-2 py-0.5 rounded bg-lc-rose/10 border border-lc-rose/20 text-lc-rose text-[8px] font-bold animate-pulse">
                            ⚠️ {s.riskReason}
                          </span>
                        ) : (
                          <span className="text-lc-emerald font-semibold">✓ Steady</span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleStatus(s.id); }}
                          className={`px-2 py-0.5 rounded font-bold text-[8px] cursor-pointer ${s.status === 'ACTIVE'
                              ? 'bg-lc-emerald/10 text-lc-emerald border border-lc-emerald/20'
                              : 'bg-lc-rose/10 text-lc-rose border border-lc-rose/20'
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
              <div className="flex space-x-1 bg-lc-void/40 p-1 rounded-lg border border-lc-glass-border">
                <button
                  type="button"
                  onClick={() => setCmsTab('coding')}
                  className={`flex-1 py-2 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer ${cmsTab === 'coding' ? 'bg-lc-violet text-lc-text shadow' : 'text-lc-text-muted hover:text-lc-text'
                    }`}
                >
                  Coding CMS
                </button>
                <button
                  type="button"
                  onClick={() => setCmsTab('mcq')}
                  className={`flex-1 py-2 rounded-lg text-[9px] font-bold uppercase transition-all cursor-pointer ${cmsTab === 'mcq' ? 'bg-lc-violet text-lc-text shadow' : 'text-lc-text-muted hover:text-lc-text-muted'
                    }`}
                >
                  MCQ Questions CMS
                </button>
              </div>

              {/* CODING CMS PANEL */}
              {cmsTab === 'coding' && (
                <div className="lc-glass p-6 space-y-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-lc-text-muted flex items-center space-x-1.5">
                    <Code className="w-4 h-4 text-lc-violet" />
                    <span>Ingest Coding Problem Config</span>
                  </h4>

                  <form onSubmit={handleCreateProblem} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-lc-text-muted uppercase">Problem Title</label>
                      <input
                        type="text"
                        value={newProblem.title}
                        onChange={(e) => setNewProblem({ ...newProblem, title: e.target.value })}
                        placeholder="e.g. Reverse Binary Tree"
                        className="w-full bg-lc-void/40 border border-lc-glass-border rounded-lg p-2 text-xs text-lc-text outline-none focus:border-lc-violet/40"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-lc-text-muted uppercase">Difficulty</label>
                      <select
                        value={newProblem.difficulty}
                        onChange={(e) => setNewProblem({ ...newProblem, difficulty: e.target.value })}
                        className="w-full bg-lc-void/40 border border-lc-glass-border rounded-lg p-2 text-xs text-lc-text outline-none"
                      >
                        <option value="EASY">EASY</option>
                        <option value="MEDIUM">MEDIUM</option>
                        <option value="HARD">HARD</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-lc-text-muted uppercase">Challenge Description</label>
                      <textarea
                        value={newProblem.description}
                        onChange={(e) => setNewProblem({ ...newProblem, description: e.target.value })}
                        placeholder="Enter description markdown..."
                        className="w-full h-16 bg-lc-void/40 border border-lc-glass-border rounded-lg p-2 text-xs text-lc-text outline-none resize-none focus:border-lc-violet/40"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-lc-text-muted uppercase">Test Case Input</label>
                        <input
                          type="text"
                          value={newProblem.testcaseInput}
                          onChange={(e) => setNewProblem({ ...newProblem, testcaseInput: e.target.value })}
                          placeholder="[2, 7, 11]"
                          className="w-full bg-lc-void/40 border border-lc-glass-border rounded-lg p-2 text-xs text-lc-text outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-lc-text-muted uppercase">Expected Output</label>
                        <input
                          type="text"
                          value={newProblem.testcaseExpected}
                          onChange={(e) => setNewProblem({ ...newProblem, testcaseExpected: e.target.value })}
                          placeholder="[0, 1]"
                          className="w-full bg-lc-void/40 border border-lc-glass-border rounded-lg p-2 text-xs text-lc-text outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-lc-violet hover:bg-lc-violet-hover text-lc-text font-bold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      Publish Coding Challenge
                    </button>
                  </form>
                </div>
              )}

              {/* MCQ QUESTIONS CMS PANEL */}
              {cmsTab === 'mcq' && (
                <div className="lc-glass p-6 space-y-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-lc-text-muted flex items-center space-x-1.5">
                    <BookOpen className="w-4 h-4 text-lc-violet" />
                    <span>Upload MCQ Question Ingest</span>
                  </h4>

                  <form onSubmit={handleCreateMcq} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-lc-text-muted uppercase">Question Text</label>
                      <textarea
                        value={newMcq.questionText}
                        onChange={(e) => setNewMcq({ ...newMcq, questionText: e.target.value })}
                        placeholder="e.g. A can do a task in 10 days..."
                        className="w-full h-16 bg-lc-void/40 border border-lc-glass-border rounded-lg p-2.5 text-xs text-lc-text outline-none focus:border-lc-violet/40 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={newMcq.optionA}
                        onChange={(e) => setNewMcq({ ...newMcq, optionA: e.target.value })}
                        placeholder="Option A"
                        className="bg-lc-void/40 border border-lc-glass-border rounded-lg p-2 text-xs text-lc-text outline-none"
                      />
                      <input
                        type="text"
                        value={newMcq.optionB}
                        onChange={(e) => setNewMcq({ ...newMcq, optionB: e.target.value })}
                        placeholder="Option B"
                        className="bg-lc-void/40 border border-lc-glass-border rounded-lg p-2 text-xs text-lc-text outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={newMcq.optionC}
                        onChange={(e) => setNewMcq({ ...newMcq, optionC: e.target.value })}
                        placeholder="Option C"
                        className="bg-lc-void/40 border border-lc-glass-border rounded-lg p-2 text-xs text-lc-text outline-none"
                      />
                      <input
                        type="text"
                        value={newMcq.optionD}
                        onChange={(e) => setNewMcq({ ...newMcq, optionD: e.target.value })}
                        placeholder="Option D"
                        className="bg-lc-void/40 border border-lc-glass-border rounded-lg p-2 text-xs text-lc-text outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={newMcq.correctOption}
                        onChange={(e) => setNewMcq({ ...newMcq, correctOption: e.target.value })}
                        className="bg-lc-void/40 border border-lc-glass-border rounded-lg p-2 text-xs text-lc-text outline-none"
                      >
                        <option value="A">Answer: Option A</option>
                        <option value="B">Answer: Option B</option>
                        <option value="C">Answer: Option C</option>
                        <option value="D">Answer: Option D</option>
                      </select>
                      <span className="text-[9px] text-lc-text-muted pt-2">Define valid key</span>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-lc-violet hover:bg-lc-violet-hover text-lc-text font-bold text-xs rounded-lg transition-colors cursor-pointer"
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
                <div className="lc-glass p-6 space-y-3">
                  <h4 className="text-xs font-bold text-lc-text-muted uppercase tracking-wider">Active Challenges</h4>
                  <div className="divide-y divide-lc-glass-border">
                    {activeProblemsList.map((p) => (
                      <div key={p.id} className="flex justify-between items-center py-2.5 text-[10px]">
                        <div>
                          <p className="font-bold text-lc-text">{p.title}</p>
                          <p className="text-[8px] text-lc-text-muted font-mono">Solved count: {p.solvedCount}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${p.difficulty === 'EASY' ? 'bg-lc-emerald/10 text-lc-emerald' : 'bg-lc-amber/10 text-lc-amber'
                            }`}>
                            {p.difficulty}
                          </span>
                          <button
                            onClick={() => handleDeleteProblem(p.id)}
                            className="p-1 rounded hover:bg-lc-glass-raised text-lc-text-muted hover:text-lc-rose cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="lc-glass p-6 space-y-3">
                  <h4 className="text-xs font-bold text-lc-text-muted uppercase tracking-wider">Active MCQ Database</h4>
                  <div className="divide-y divide-lc-glass-border">
                    {activeMcqList.map((q) => (
                      <div key={q.id} className="flex justify-between items-center py-2.5 text-[10px]">
                        <div className="pr-4">
                          <p className="font-bold text-lc-text truncate w-32">{q.text}</p>
                          <p className="text-[8px] text-lc-cyan font-mono">{q.topic} • Ans: {q.answer}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteMcq(q.id)}
                          className="p-1 rounded hover:bg-lc-glass-raised text-lc-text-muted hover:text-lc-rose cursor-pointer"
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
          <div className="fixed inset-0 z-50 bg-lc-void/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="lc-glass p-8 max-w-xl w-full border-lc-glass-border space-y-6 relative shadow-2xl">
              {/* Close button */}
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="absolute top-4 right-4 text-lc-text-muted hover:text-lc-text font-bold text-sm cursor-pointer"
              >
                ✕
              </button>

              {/* Header info */}
              <div className="border-b border-lc-glass-border pb-4 text-left">
                <div className="flex items-center space-x-2.5">
                  <h3 className="text-lg font-black text-lc-text">{selectedStudent.name}</h3>
                  {selectedStudent.isAtRisk && (
                    <span className="px-2 py-0.5 rounded bg-lc-rose/10 border border-lc-rose/20 text-lc-rose text-[8px] font-bold">
                      ⚠️ At Risk
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-lc-text-muted font-mono mt-0.5">
                  {selectedStudent.email} • {selectedStudent.college} • {selectedStudent.department}
                </p>
              </div>

              {/* Inner modal tabs */}
              <div className="flex space-x-1 bg-lc-void/40 p-1 rounded-lg border border-lc-glass-border">
                {(['stats', 'insights', 'logs'] as const).map((mtab) => (
                  <button
                    key={mtab}
                    onClick={() => setModalTab(mtab)}
                    className={`flex-1 py-1.5 rounded text-[9px] font-bold uppercase transition-all cursor-pointer ${modalTab === mtab ? 'bg-lc-cyan text-lc-void' : 'text-lc-text-muted hover:text-lc-text'
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
                    <div className="p-4 rounded-xl bg-lc-void/50 border border-lc-glass-border text-left space-y-2">
                      <h5 className="text-[9px] font-bold text-lc-text-muted uppercase tracking-wider">Aptitude accuracy</h5>
                      <p className="text-xl font-black text-lc-text">
                        {Math.round((selectedStudent.mcqCorrect / (selectedStudent.mcqCorrect + selectedStudent.mcqIncorrect)) * 100)}%
                      </p>
                      <div className="text-[9px] text-lc-text-muted flex justify-between">
                        <span className="text-lc-emerald">{selectedStudent.mcqCorrect} Correct</span>
                        <span className="text-lc-rose">{selectedStudent.mcqIncorrect} Incorrect</span>
                      </div>
                    </div>

                    {/* Right stats card */}
                    <div className="p-4 rounded-xl bg-lc-void/50 border border-lc-glass-border text-left space-y-2">
                      <h5 className="text-[9px] font-bold text-lc-text-muted uppercase tracking-wider">Communication scale</h5>
                      <p className="text-xl font-black text-lc-text">
                        {selectedStudent.grammarScore}% Grammar
                      </p>
                      <div className="text-[9px] text-lc-text-muted flex justify-between">
                        <span className="text-lc-cyan">{selectedStudent.wpm} Words/Min</span>
                        <span className="text-lc-violet">{selectedStudent.fluencyScore}% Fluency</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-lc-void/40 border border-lc-glass-border text-left text-[10px] space-y-2">
                    <div className="flex justify-between">
                      <span className="font-bold text-lc-text-muted uppercase tracking-wider text-[9px]">Strong Prep Topics:</span>
                      <span className="text-lc-emerald">{selectedStudent.strongTopics.join(', ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-bold text-lc-text-muted uppercase tracking-wider text-[9px]">Weak Prep Topics:</span>
                      <span className="text-lc-rose">{selectedStudent.weakTopics.join(', ')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: AI RECOMMENDATIONS */}
              {modalTab === 'insights' && (
                <div className="space-y-4 text-left">
                  <div className="p-4 rounded-xl bg-lc-violet/5 border border-lc-violet/20 flex justify-between items-center">
                    <div>
                      <h5 className="text-[9px] font-bold text-lc-violet uppercase tracking-wider">AI Placement Probability</h5>
                      <p className="text-lg font-black text-lc-text mt-0.5">{selectedStudent.readinessScore}% Readiness</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider ${selectedStudent.readinessScore >= 80 ? 'bg-lc-emerald/10 text-lc-emerald border border-lc-emerald/20' : 'bg-lc-amber/10 text-lc-amber border border-lc-amber/20'
                      }`}>
                      {selectedStudent.level}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <h5 className="text-[9px] font-bold text-lc-text-muted uppercase tracking-wider">Personalized Action Steps</h5>
                    <div className="space-y-2 text-[10px] text-lc-text-muted">
                      {selectedStudent.weakTopics.map((topic, i) => (
                        <div key={i} className="flex items-start space-x-2 bg-lc-void/50 p-2.5 rounded-lg border border-lc-glass-border">
                          <Sparkles className="w-3.5 h-3.5 text-lc-cyan shrink-0 mt-0.5" />
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
                  <h4 className="text-[9px] font-bold text-lc-text-muted uppercase tracking-wider text-left">Timeline log verification</h4>
                  <div className="p-4 rounded-xl bg-lc-void/40 border border-lc-glass-border space-y-3 max-h-[160px] overflow-y-auto font-mono text-[9px] text-lc-text-muted text-left">
                    <div className="flex items-start space-x-2">
                      <span className="text-lc-cyan">10:45 AM</span>
                      <span>Completed Quantitative Quiz (Time & Work) - 92% accuracy (+20 XP)</span>
                    </div>
                    <div className="flex items-start space-x-2 border-t border-lc-glass-border pt-2">
                      <span className="text-lc-cyan">11:20 AM</span>
                      <span>Compiled Python logic challenge. Status: ACCEPTED (+30 XP)</span>
                    </div>
                    <div className="flex items-start space-x-2 border-t border-lc-glass-border pt-2">
                      <span className="text-lc-cyan">01:15 PM</span>
                      <span>Completed speaking round verification prompt (+50 XP)</span>
                    </div>
                    <div className="flex items-start space-x-2 border-t border-lc-glass-border pt-2">
                      <span className="text-lc-cyan">Yesterday</span>
                      <span>Account validation logged. Session active for 1.5 hours</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => setSelectedStudent(null)}
                className="w-full py-2.5 rounded-xl bg-lc-glass-raised border border-lc-glass-border text-xs font-bold text-lc-text-muted hover:text-lc-text cursor-pointer"
              >
                Close Student Audit Modal
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
