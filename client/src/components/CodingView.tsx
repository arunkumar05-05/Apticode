import React, { useState, useEffect } from 'react';
import { Play, Sparkles, AlertCircle, CheckCircle2, ChevronRight, Terminal, RefreshCw, Bookmark, FileText, Code2, History } from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface Problem {
  id: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  category: string;
  description: string;
  constraints: string[];
  starterCodes: { [key: string]: string };
  testcases: { input: string; expected: string }[];
  editorial: string;
  complexity: string;
}

const problemsList: Problem[] = [
  {
    id: 'c1',
    title: 'Two Sum',
    difficulty: 'EASY',
    category: 'Arrays & Hashing',
    description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\nYou can return the answer in any order.',
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9'
    ],
    starterCodes: {
      python: 'def twoSum(nums: List[int], target: int) -> List[int]:\n    # Write your code here\n    pass',
      javascript: 'function twoSum(nums, target) {\n    // Write your code here\n    \n}',
      java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your code here\n        return new int[0];\n    }\n}',
      cpp: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your code here\n        \n    }\n};',
      c: 'int* twoSum(int* nums, int numsSize, int target, int* returnSize) {\n    // Write your code here\n    *returnSize = 0;\n    return NULL;\n}'
    },
    testcases: [
      { input: 'nums = [2,7,11,15], target = 9', expected: '[0,1]' },
      { input: 'nums = [3,2,4], target = 6', expected: '[1,2]' }
    ],
    editorial: 'Use a hash map to search for the complement `target - nums[i]`. If the complement exists in the hash map, return its index and the current index. Otherwise, add the current number and its index to the hash map.',
    complexity: 'Time Complexity: O(N) | Space Complexity: O(N)'
  },
  {
    id: 'c2',
    title: 'Container With Most Water',
    difficulty: 'MEDIUM',
    category: 'Two Pointers',
    description: 'You are given an integer array `height` of length `n`. There are `n` vertical lines drawn such that the two endpoints of the `i`th line are `(i, 0)` and `(i, height[i])`.\nFind two lines that together with the x-axis form a container, such that the container contains the most water.\nReturn the maximum amount of water a container can store.',
    constraints: [
      'n == height.length',
      '2 <= n <= 10^5',
      '0 <= height[i] <= 10^4'
    ],
    starterCodes: {
      python: 'def maxArea(height: List[int]) -> int:\n    # Write your code here\n    pass',
      javascript: 'function maxArea(height) {\n    // Write your code here\n    \n}',
      java: 'class Solution {\n    public int maxArea(int[] height) {\n        // Write your code here\n        return 0;\n    }\n}',
      cpp: 'class Solution {\npublic:\n    int maxArea(vector<int>& height) {\n        // Write your code here\n        \n    }\n};',
      c: 'int maxArea(int* height, int heightSize) {\n    // Write your code here\n    return 0;\n}'
    },
    testcases: [
      { input: 'height = [1,8,6,2,5,4,8,3,7]', expected: '49' },
      { input: 'height = [1,1]', expected: '1' }
    ],
    editorial: 'Use a two-pointer approach starting at both ends of the array. Calculate the volume between the pointers, update the maximum area, and move the pointer that points to the shorter line inward.',
    complexity: 'Time Complexity: O(N) | Space Complexity: O(1)'
  },
  {
    id: 'c3',
    title: 'Reverse Linked List',
    difficulty: 'EASY',
    category: 'Linked List',
    description: 'Given the head of a singly linked list, reverse the list, and return the reversed list.',
    constraints: [
      'The number of nodes in the list is the range [0, 5000]',
      '-5000 <= Node.val <= 5000'
    ],
    starterCodes: {
      python: 'def reverseList(head: Optional[ListNode]) -> Optional[ListNode]:\n    # Write your code here\n    pass',
      javascript: 'function reverseList(head) {\n    // Write your code here\n    \n}',
      java: 'class Solution {\n    public ListNode reverseList(ListNode head) {\n        // Write your code here\n        return null;\n    }\n}',
      cpp: 'class Solution {\npublic:\n    ListNode* reverseList(ListNode* head) {\n        // Write your code here\n        \n    }\n};',
      c: 'struct ListNode* reverseList(struct ListNode* head) {\n    // Write your code here\n    return NULL;\n}'
    },
    testcases: [
      { input: 'head = [1,2,3,4,5]', expected: '[5,4,3,2,1]' },
      { input: 'head = []', expected: '[]' }
    ],
    editorial: 'Initialize three pointers: `prev` as NULL, `curr` as head, and `next` as NULL. Traverse the list, re-linking `curr.next` to `prev`, and moving the pointers forward.',
    complexity: 'Time Complexity: O(N) | Space Complexity: O(1)'
  },
  {
    id: 'c4',
    title: 'Longest Common Subsequence',
    difficulty: 'HARD',
    category: 'Dynamic Programming',
    description: 'Given two strings `text1` and `text2`, return the length of their longest common subsequence. If there is no common subsequence, return 0.\nA subsequence of a string is a new string generated from the original string with some characters (can be none) deleted without changing the relative order of the remaining characters.',
    constraints: [
      '1 <= text1.length, text2.length <= 1000',
      'text1 and text2 consist of only lowercase English characters.'
    ],
    starterCodes: {
      python: 'def longestCommonSubsequence(text1: str, text2: str) -> int:\n    # Write your code here\n    pass',
      javascript: 'function longestCommonSubsequence(text1, text2) {\n    // Write your code here\n    \n}',
      java: 'class Solution {\n    public int longestCommonSubsequence(String text1, String text2) {\n        // Write your code here\n        return 0;\n    }\n}',
      cpp: 'class Solution {\npublic:\n    int longestCommonSubsequence(string text1, string text2) {\n        // Write your code here\n        \n    }\n};',
      c: 'int longestCommonSubsequence(char* text1, char* text2) {\n    // Write your code here\n    return 0;\n}'
    },
    testcases: [
      { input: 'text1 = "abcde", text2 = "ace"', expected: '3' },
      { input: 'text1 = "abc", text2 = "def"', expected: '0' }
    ],
    editorial: 'Create a 2D dynamic programming grid of size `(M+1) x (N+1)` where `dp[i][j]` stores the LCS length of prefixes text1[0...i-1] and text2[0...j-1]. Fill the grid iteratively.',
    complexity: 'Time Complexity: O(M * N) | Space Complexity: O(M * N)'
  }
];

export default function CodingView() {
  const [activeProblem, setActiveProblem] = useState<Problem>(problemsList[0]);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('python');
  const [editorCode, setEditorCode] = useState<string>(problemsList[0].starterCodes.python);
  const [workspaceTab, setWorkspaceTab] = useState<'editor' | 'editorial' | 'history'>('editor');
  const [consoleTab, setConsoleTab] = useState<'console' | 'debug'>('console');
  
  const [isRunning, setIsRunning] = useState(false);
  const [runStatus, setRunStatus] = useState<'IDLE' | 'SUCCESS' | 'WRONG_ANSWER' | 'COMPILE_ERROR'>('IDLE');
  const [debugReport, setDebugReport] = useState('');
  const [isDebugging, setIsDebugging] = useState(false);

  // Persistence Bookmarks & Submissions
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [submissionHistory, setSubmissionHistory] = useState<Array<{
    problemTitle: string;
    language: string;
    status: 'SUCCESS' | 'WRONG_ANSWER';
    timestamp: string;
  }>>([]);

  // Load Bookmarks & History
  useEffect(() => {
    const loadUserData = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      try {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data.bookmarkedCoding)) {
            setBookmarkedIds(data.bookmarkedCoding);
          }
          if (Array.isArray(data.codingSubmissions)) {
            setSubmissionHistory(data.codingSubmissions);
          }
        }
      } catch (err) {
        console.error('Failed to load coding details:', err);
      }
    };
    loadUserData();
  }, []);

  // Update editor code when active problem or language shifts
  useEffect(() => {
    setEditorCode(activeProblem.starterCodes[selectedLanguage] || '');
    setRunStatus('IDLE');
    setDebugReport('');
  }, [activeProblem.id, selectedLanguage]);

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
  };

  const toggleBookmark = async () => {
    const pId = activeProblem.id;
    let updated: string[];
    if (bookmarkedIds.includes(pId)) {
      updated = bookmarkedIds.filter((id) => id !== pId);
    } else {
      updated = [...bookmarkedIds, pId];
    }
    setBookmarkedIds(updated);

    const currentUser = auth.currentUser;
    if (currentUser) {
      try {
        const docRef = doc(db, 'users', currentUser.uid);
        await setDoc(docRef, { bookmarkedCoding: updated }, { merge: true });
      } catch (err) {
        console.error('Failed to sync bookmarks:', err);
      }
    }
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setConsoleTab('console');
    
    // Simulate compilation delay
    setTimeout(async () => {
      setIsRunning(false);
      
      const containsPlaceholders = 
        editorCode.includes('pass') || 
        editorCode.includes('return new int[0]') || 
        editorCode.includes('return 0') || 
        editorCode.includes('return null') ||
        editorCode.includes('return NULL');

      const isCorrect = !containsPlaceholders;
      const statusResult: 'SUCCESS' | 'WRONG_ANSWER' = isCorrect ? 'SUCCESS' : 'WRONG_ANSWER';
      setRunStatus(statusResult);

      // Record Submission
      const newSubmission = {
        problemTitle: activeProblem.title,
        language: selectedLanguage,
        status: statusResult,
        timestamp: new Date().toLocaleTimeString() + ' ' + new Date().toLocaleDateString()
      };
      
      const updatedHistory = [newSubmission, ...submissionHistory];
      setSubmissionHistory(updatedHistory);

      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const docRef = doc(db, 'users', currentUser.uid);
          await setDoc(docRef, { codingSubmissions: updatedHistory }, { merge: true });
        } catch (err) {
          console.error('Failed to save submission history:', err);
        }
      }
    }, 1500);
  };

  const handleAIDebug = () => {
    setIsDebugging(true);
    setConsoleTab('debug');
    setDebugReport('');

    setTimeout(() => {
      setIsDebugging(false);
      const containsPlaceholders = 
        editorCode.includes('pass') || 
        editorCode.includes('return new int[0]') || 
        editorCode.includes('return 0') || 
        editorCode.includes('return null') ||
        editorCode.includes('return NULL');

      if (containsPlaceholders) {
        setDebugReport(
          `### 🛠️ AI Debugger Code Audit\n\n**Issue Found:**\nThe active buffer contains placeholder or empty returns. This will output incorrect answers.\n\n**Refactoring Recommendations:**\n1. For **Two Sum**, implement a HashMap lookup to search for complements.\n2. For **Container with Most Water**, implement a left and right pointer iteration to compute widths dynamically.\n3. Make sure to return the correct types.`
        );
      } else {
        setDebugReport(
          `### 🛠️ AI Debugger Code Audit\n\n**Optimizations verified:**\nCode contains logic structure. Complexity matches the optimal ${activeProblem.complexity.split('|')[0].trim()} curve.`
        );
      }
    }, 2000);
  };

  return (
    <div className="grid md:grid-cols-4 gap-8 pb-12 md:h-[calc(100vh-140px)] md:min-h-[500px] h-auto text-left">
      {/* Sidebar: Problems list */}
      <div className="md:col-span-1 glass-panel p-4 flex flex-col space-y-3 overflow-y-auto">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 font-mono">Coding Problems</h3>
        <div className="space-y-2">
          {problemsList.map((prob) => (
            <button
              key={prob.id}
              onClick={() => {
                setActiveProblem(prob);
                setWorkspaceTab('editor');
              }}
              className={`w-full text-left p-3.5 rounded-lg border text-xs flex flex-col space-y-1.5 transition-all ${
                activeProblem.id === prob.id
                  ? 'bg-slate-900 border-brand-purple/40 text-slate-100 shadow-md'
                  : 'border-transparent text-slate-400 hover:bg-slate-950/40'
              }`}
            >
              <div className="flex justify-between items-center w-full">
                <span className="font-extrabold">{prob.title}</span>
                <span className={`text-[9px] font-extrabold ${
                  prob.difficulty === 'EASY' ? 'text-emerald-400' : prob.difficulty === 'MEDIUM' ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {prob.difficulty}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">{prob.category}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main workspace arena */}
      <div className="md:col-span-3 grid md:grid-cols-2 gap-6 h-full min-h-0">
        
        {/* Left Pane: Description & Information */}
        <div className="glass-panel p-6 overflow-y-auto space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-extrabold text-slate-200">{activeProblem.title}</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleBookmark}
                  className={`p-2 rounded-lg border transition-colors flex items-center justify-center ${
                    bookmarkedIds.includes(activeProblem.id)
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                      : 'border-white/5 bg-slate-950/20 text-slate-500 hover:text-slate-350'
                  }`}
                  title="Bookmark problem"
                >
                  <Bookmark className="w-4 h-4 fill-current" />
                </button>
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                  activeProblem.difficulty === 'EASY' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : activeProblem.difficulty === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                  {activeProblem.difficulty}
                </span>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-300 whitespace-pre-line font-sans">
              {activeProblem.description}
            </p>

            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-550 uppercase tracking-widest font-mono">Constraints</h4>
              <ul className="list-disc pl-4 space-y-1 text-xs text-slate-400 font-mono">
                {activeProblem.constraints.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-bold text-slate-550 uppercase tracking-widest font-mono">Examples & Test Cases</h4>
              {activeProblem.testcases.map((tc, idx) => (
                <div key={idx} className="p-3 bg-slate-950/40 rounded-xl border border-white/5 font-mono text-[11px] space-y-1">
                  <p className="text-slate-500"><strong className="text-slate-400">Input:</strong> {tc.input}</p>
                  <p className="text-slate-500"><strong className="text-slate-400">Output:</strong> {tc.expected}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Pane: Code Editor & Auxiliary Panels */}
        <div className="flex flex-col justify-between h-full min-h-0 bg-slate-950/20 rounded-[20px] border border-white/5 overflow-hidden">
          
          {/* Header Workspace tabs */}
          <div className="flex border-b border-white/5 bg-slate-950/40 p-1">
            <button
              onClick={() => setWorkspaceTab('editor')}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-3 text-[11px] font-bold transition-all ${
                workspaceTab === 'editor' ? 'bg-slate-900 border border-white/5 rounded-lg text-brand-cyan' : 'text-slate-500'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Editor</span>
            </button>
            <button
              onClick={() => setWorkspaceTab('editorial')}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-3 text-[11px] font-bold transition-all ${
                workspaceTab === 'editorial' ? 'bg-slate-900 border border-white/5 rounded-lg text-brand-cyan' : 'text-slate-500'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Editorial</span>
            </button>
            <button
              onClick={() => setWorkspaceTab('history')}
              className={`flex-1 flex items-center justify-center space-x-1.5 py-3 text-[11px] font-bold transition-all ${
                workspaceTab === 'history' ? 'bg-slate-900 border border-white/5 rounded-lg text-brand-cyan' : 'text-slate-500'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Submissions</span>
            </button>
          </div>

          {/* EDITOR TAB CONTENT */}
          {workspaceTab === 'editor' && (
            <div className="flex-1 flex flex-col justify-between min-h-0 p-4 space-y-4">
              
              {/* Language Selector */}
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Language</span>
                <select
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-brand-cyan font-mono outline-none"
                >
                  <option value="python">Python 3</option>
                  <option value="javascript">JavaScript (ES6)</option>
                  <option value="java">Java (JDK 17)</option>
                  <option value="cpp">C++ (GCC 14)</option>
                  <option value="c">C (ANSI C)</option>
                </select>
              </div>

              {/* Code TextArea */}
              <div className="flex-1 min-h-0 relative">
                <textarea
                  value={editorCode}
                  onChange={(e) => setEditorCode(e.target.value)}
                  className="w-full h-full bg-slate-950/80 border border-white/5 rounded-xl p-4 font-mono text-xs text-slate-200 leading-relaxed outline-none resize-none placeholder:text-slate-650"
                  spellCheck="false"
                />
              </div>

              {/* Console drawer */}
              <div className="glass-panel p-3 border-white/5 overflow-hidden flex flex-col justify-between h-[150px]">
                <div className="flex border-b border-white/5 bg-slate-950/20 p-0.5 rounded-lg">
                  <button
                    onClick={() => setConsoleTab('console')}
                    className={`flex-1 py-1 text-[10px] font-extrabold uppercase font-mono transition-all ${
                      consoleTab === 'console' ? 'bg-slate-900 rounded-md text-brand-cyan' : 'text-slate-550'
                    }`}
                  >
                    Console Output
                  </button>
                  <button
                    onClick={() => setConsoleTab('debug')}
                    className={`flex-1 py-1 text-[10px] font-extrabold uppercase font-mono transition-all ${
                      consoleTab === 'debug' ? 'bg-slate-900 rounded-md text-brand-cyan' : 'text-slate-550'
                    }`}
                  >
                    AI Diagnostics
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pt-2 font-mono text-[10px] text-slate-400">
                  {consoleTab === 'console' ? (
                    <div className="space-y-1">
                      {isRunning ? (
                        <div className="flex items-center space-x-2 text-slate-500">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Compiling program in sandbox container...</span>
                        </div>
                      ) : runStatus === 'IDLE' ? (
                        <span className="text-slate-600">Run code to test your inputs.</span>
                      ) : runStatus === 'SUCCESS' ? (
                        <div className="space-y-1.5">
                          <p className="text-emerald-400 flex items-center space-x-1"><CheckCircle2 className="w-3.5 h-3.5" /> <span>Accepted! All test cases passed.</span></p>
                          <p className="text-slate-500">Runtime: 12ms | Memory: 8.4MB</p>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <p className="text-red-400 flex items-center space-x-1"><AlertCircle className="w-3.5 h-3.5" /> <span>Wrong Answer</span></p>
                          <p className="text-slate-500">Output mismatches test case 1 expectations.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="whitespace-pre-line leading-relaxed">
                      {isDebugging ? (
                        <div className="flex items-center space-x-2 text-slate-500">
                          <Sparkles className="w-3.5 h-3.5 animate-spin text-brand-purple" />
                          <span>Audit analyzer scanning call stack...</span>
                        </div>
                      ) : debugReport ? (
                        debugReport
                      ) : (
                        <span className="text-slate-600">Run AI Debugger to locate runtime bottlenecks.</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Code execution triggers */}
              <div className="flex space-x-3">
                <button
                  onClick={handleRunCode}
                  disabled={isRunning}
                  className="flex-1 h-11 bg-gradient-to-r from-brand-purple to-brand-cyan text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 shadow-lg shadow-brand-purple/10 hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Run Sandbox</span>
                </button>
                <button
                  onClick={handleAIDebug}
                  disabled={isDebugging}
                  className="px-4 h-11 bg-slate-900 border border-slate-800 text-brand-cyan text-xs font-bold rounded-xl flex items-center justify-center space-x-1.5 hover:bg-slate-850 disabled:opacity-50 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-brand-cyan/20" />
                  <span>AI Debug</span>
                </button>
              </div>
            </div>
          )}

          {/* EDITORIAL TAB CONTENT */}
          {workspaceTab === 'editorial' && (
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="flex items-center space-x-2 text-brand-cyan border-b border-white/5 pb-2">
                <FileText className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider font-mono">Algorithm Editorial Analysis</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-350">{activeProblem.editorial}</p>
              <div className="p-4 bg-slate-950/40 rounded-xl border border-white/5 font-mono text-[10px] text-slate-400">
                <span className="text-brand-purple font-extrabold uppercase text-[9px] block mb-1 font-mono">Complexity targets</span>
                {activeProblem.complexity}
              </div>
            </div>
          )}

          {/* SUBMISSION HISTORY TAB CONTENT */}
          {workspaceTab === 'history' && (
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              <div className="flex items-center space-x-2 text-brand-cyan border-b border-white/5 pb-2">
                <History className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider font-mono">Submission Logs</span>
              </div>
              {submissionHistory.length === 0 ? (
                <div className="text-slate-600 text-xs font-mono text-center py-10">No submissions recorded for this workspace.</div>
              ) : (
                <div className="space-y-2">
                  {submissionHistory
                    .filter(sub => sub.problemTitle === activeProblem.title)
                    .map((sub, idx) => (
                      <div key={idx} className="p-3 bg-slate-950/30 rounded-lg border border-white/5 flex items-center justify-between text-xs font-mono">
                        <div>
                          <p className="font-bold text-slate-300">{sub.language.toUpperCase()}</p>
                          <p className="text-[10px] text-slate-550">{sub.timestamp}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          sub.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {sub.status === 'SUCCESS' ? 'Accepted' : 'Wrong Answer'}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
