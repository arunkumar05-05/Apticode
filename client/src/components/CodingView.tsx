import React, { useState } from 'react';
import { Play, Sparkles, AlertCircle, CheckCircle2, ChevronRight, Terminal, RefreshCw, Layers } from 'lucide-react';

interface Problem {
  id: string;
  title: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  description: string;
  constraints: string[];
  starterCodes: { [key: string]: string };
  testcases: { input: string; expected: string }[];
}

const problemData: Problem = {
  id: '1',
  title: 'Two Sum',
  difficulty: 'EASY',
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
    cpp: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your code here\n        \n    }\n};'
  },
  testcases: [
    { input: 'nums = [2,7,11,15], target = 9', expected: '[0,1]' },
    { input: 'nums = [3,2,4], target = 6', expected: '[1,2]' }
  ]
};

export default function CodingView() {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('python');
  const [editorCode, setEditorCode] = useState<string>(problemData.starterCodes.python);
  const [consoleTab, setConsoleTab] = useState<'console' | 'debug'>('console');
  
  const [isRunning, setIsRunning] = useState(false);
  const [runStatus, setRunStatus] = useState<'IDLE' | 'SUCCESS' | 'WRONG_ANSWER' | 'COMPILE_ERROR'>('IDLE');
  const [debugReport, setDebugReport] = useState('');
  const [isDebugging, setIsDebugging] = useState(false);

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    setEditorCode(problemData.starterCodes[lang]);
    setRunStatus('IDLE');
    setDebugReport('');
  };

  const handleRunCode = () => {
    setIsRunning(true);
    setConsoleTab('console');
    
    // Simulate compilation from Judge0
    setTimeout(() => {
      setIsRunning(false);
      // If code contains the pass/default return values, evaluate wrong answer.
      // If student edits it, trigger accepted.
      if (editorCode.includes('pass') || editorCode.includes('return new int[0]')) {
        setRunStatus('WRONG_ANSWER');
      } else {
        setRunStatus('SUCCESS');
      }
    }, 1500);
  };

  const handleAIDebug = () => {
    setIsDebugging(true);
    setConsoleTab('debug');
    setDebugReport('');

    setTimeout(() => {
      setIsDebugging(false);
      if (editorCode.includes('pass') || editorCode.includes('return new int[0]') || editorCode.trim().endsWith('}')) {
        setDebugReport(
          `### 🛠️ AI Debugger Analysis\n\n**Issue Found:**\nThe active function contains placeholder instructions (\`pass\` or returns an empty array).\n\n**Suggestions to resolve:**\n1. **Use a Hash Map:** Compute target differences \`diff = target - num\` and store index mappings to achieve an $O(N)$ lookup complexity.\n2. **Avoid Nested Loops:** A nested two-loop approach takes $O(N^2)$ time complexity, which will fail with a **Time Limit Exceeded** error on large array constraints.`
        );
      } else {
        setDebugReport(
          `### 🛠️ AI Debugger Analysis\n\n**Optimizations verified:**\nYour solution looks complete with $O(N)$ scaling. No logic bottlenecks found.`
        );
      }
    }, 2000);
  };

  return (
    <div className="grid md:grid-cols-2 gap-8 pb-12 md:h-[calc(100vh-140px)] md:min-h-[500px] h-auto">
      {/* Left Pane: Problem Description */}
      <div className="glass-panel p-6 overflow-y-auto space-y-6 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-extrabold text-slate-200">{problemData.title}</h2>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              problemData.difficulty === 'EASY' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}>
              {problemData.difficulty}
            </span>
          </div>

          <div className="text-xs text-slate-400 leading-relaxed space-y-3 font-sans whitespace-pre-line">
            {problemData.description}
          </div>

          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Example Test Cases</h4>
            {problemData.testcases.map((tc, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-slate-950/50 border border-white/5 font-mono text-[10px]">
                <p className="text-slate-500">Input: {tc.input}</p>
                <p className="text-brand-cyan">Expected Output: {tc.expected}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Constraints</h4>
            <ul className="list-disc pl-4 text-xs text-slate-500 space-y-1">
              {problemData.constraints.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5 text-[10px] text-slate-600 flex justify-between">
          <span>Topic: Hashing, Arrays</span>
          <span>Target Comp: Amazon, Adobe</span>
        </div>
      </div>

      {/* Right Pane: IDE Editor and Console */}
      <div className="flex flex-col space-y-6 h-full">
        {/* Editor Area */}
        <div className="flex-1 glass-panel overflow-hidden flex flex-col min-h-[350px]">
          {/* Editor Header */}
          <div className="flex justify-between items-center px-4 py-2 bg-slate-950/40 border-b border-white/5">
            <div className="flex items-center space-x-1.5">
              <Terminal className="w-3.5 h-3.5 text-brand-cyan" />
              <span className="text-xs font-bold text-slate-400">Monaco Playground Wrapper</span>
            </div>
            <select
              value={selectedLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-[10px] font-bold rounded-md px-2 py-1 text-slate-300"
            >
              <option value="python">Python 3</option>
              <option value="javascript">JavaScript</option>
              <option value="java">Java 17</option>
              <option value="cpp">C++ 17</option>
            </select>
          </div>

          {/* Monaco Mock Text Area */}
          <div className="flex-1 p-4 font-mono text-xs bg-[#0b0e14] relative">
            <textarea
              value={editorCode}
              onChange={(e) => setEditorCode(e.target.value)}
              className="w-full h-full bg-transparent text-slate-200 outline-none resize-none leading-relaxed border-none focus:ring-0 p-0"
              spellCheck="false"
            />
            <div className="absolute right-4 bottom-4 text-[9px] text-slate-600 font-mono pointer-events-none">
              UTF-8 • Ln {editorCode.split('\n').length}, Col 1
            </div>
          </div>

          {/* Action Row */}
          <div className="flex justify-between items-center p-3 bg-slate-950/30 border-t border-white/5">
            <button
              onClick={handleAIDebug}
              className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-brand-cyan flex items-center space-x-1 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 fill-brand-cyan/20" />
              <span>AI Debugger</span>
            </button>
            <div className="flex space-x-3">
              <button
                onClick={handleRunCode}
                disabled={isRunning}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-brand-purple to-brand-cyan text-white text-[10px] font-bold shadow-md shadow-brand-purple/20 flex items-center space-x-1.5 transition-all hover:brightness-115 disabled:opacity-50"
              >
                {isRunning ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                <span>Run Submissions</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Console Drawer */}
        <div className="h-1/3 glass-panel overflow-hidden flex flex-col min-h-[160px]">
          {/* Console tabs */}
          <div className="flex border-b border-white/5 bg-slate-950/20 px-2 py-1">
            <button
              onClick={() => setConsoleTab('console')}
              className={`px-3 py-1.5 text-[10px] font-bold rounded ${
                consoleTab === 'console' ? 'text-brand-cyan bg-slate-900' : 'text-slate-500'
              }`}
            >
              Compile & Sandbox Output
            </button>
            <button
              onClick={() => setConsoleTab('debug')}
              className={`px-3 py-1.5 text-[10px] font-bold rounded ${
                consoleTab === 'debug' ? 'text-brand-cyan bg-slate-900' : 'text-slate-500'
              }`}
            >
              AI Debug Report
            </button>
          </div>

          {/* Console Panel Details */}
          <div className="flex-1 p-4 overflow-y-auto font-mono text-[10px] bg-[#090b10]">
            {consoleTab === 'console' && (
              <div className="space-y-2">
                {isRunning && (
                  <p className="text-slate-500 animate-pulse">⚙️ Dispatching code to Judge0 Compilers... Running testcases...</p>
                )}
                {!isRunning && runStatus === 'IDLE' && (
                  <p className="text-slate-600">Console empty. Click "Run Submissions" to test your algorithms.</p>
                )}
                {!isRunning && runStatus === 'SUCCESS' && (
                  <div className="space-y-2">
                    <p className="text-emerald-400 font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                      <span>ACCEPTED — Evaluation Succeeded</span>
                    </p>
                    <p className="text-slate-500">Run Time: 42ms • Memory: 1240 KB • Status: 2/2 Testcases Passed.</p>
                  </div>
                )}
                {!isRunning && runStatus === 'WRONG_ANSWER' && (
                  <div className="space-y-2">
                    <p className="text-red-400 font-bold flex items-center space-x-1">
                      <AlertCircle className="w-3.5 h-3.5 mr-1" />
                      <span>WRONG ANSWER — Testcase 1 Failed</span>
                    </p>
                    <p className="text-slate-500">Input: nums = [2,7,11,15], target = 9</p>
                    <p className="text-red-300">Your Output: None/Empty</p>
                    <p className="text-emerald-400">Expected Output: [0, 1]</p>
                  </div>
                )}
              </div>
            )}

            {consoleTab === 'debug' && (
              <div className="space-y-2 leading-relaxed whitespace-pre-wrap text-slate-300">
                {isDebugging && (
                  <p className="text-slate-500 animate-pulse">🤖 Querying AI feedback analysis engine...</p>
                )}
                {!isDebugging && debugReport && (
                  <p>{debugReport}</p>
                )}
                {!isDebugging && !debugReport && (
                  <p className="text-slate-600">No active AI debug audits launched. Click "AI Debugger" to audit logic.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
