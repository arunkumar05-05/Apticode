import React, { useState } from 'react';
import { FileText, Sparkles, CheckCircle2, AlertCircle, RefreshCw, Plus, Trash2 } from 'lucide-react';

export default function ResumeView() {
  const [personal, setPersonal] = useState({
    name: 'Rahul Sharma',
    email: 'rahul.sharma@college.edu',
    phone: '+91 98765 43210',
    github: 'github.com/rahulsharma',
    linkedin: 'linkedin.com/in/rahulsharma'
  });

  const [skills, setSkills] = useState<string>('Python, Java, JavaScript, React, Node.js, PostgreSQL');
  const [projectText, setProjectText] = useState('AptiCode Platform: Built an AI preparation engine using React and Express. Integrated Gemini APIs for communication feedback and speech reviews.');
  
  const [atsScore, setAtsScore] = useState(68);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditFeedback, setAuditFeedback] = useState<string[]>([
    "ATS Score is low (68/100). Minimum tier-1 target is 75.",
    "Project description uses passive phrasing. Change 'Built an AI engine' to 'Architected a real-time AI placement pipeline.'",
    "Missing target backend stack skills: 'Redis', 'Docker', 'Prisma ORM'."
  ]);

  const handleAuditResume = () => {
    setIsAuditing(true);
    setTimeout(() => {
      setIsAuditing(false);
      setAtsScore(88);
      setAuditFeedback([
        "✅ ATS Score improved to 88/100!",
        "✅ Project action verbs verified (Active Voice).",
        "✅ Added target keywords: 'Redis', 'Docker'."
      ]);
    }, 1500);
  };

  const handleApplySuggestions = () => {
    setSkills(prev => prev + ', Redis, Docker, Prisma ORM');
    setProjectText('Architected a real-time AI placement engine with React and Node.js. Integrated Redis caching and dockerized container endpoints to support 100k requests.');
    setAtsScore(74); // partial improvement before full re-audit
  };

  const [activeTemplate, setActiveTemplate] = useState<'ats' | 'executive' | 'modern'>('ats');

  return (
    <div className="grid md:grid-cols-12 gap-8 pb-12 md:h-[calc(100vh-140px)] md:min-h-[600px] h-auto">
      {/* Left Col: Editor Inputs */}
      <div className="md:col-span-5 glass-panel p-6 overflow-y-auto space-y-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-white/5 pb-2">
          Resume Builder Form
        </h3>

        {/* Personal Details */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-brand-purple uppercase">Personal Details</h4>
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              value={personal.name}
              onChange={(e) => setPersonal({ ...personal, name: e.target.value })}
              placeholder="Name"
              className="bg-slate-950/40 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 outline-none"
            />
            <input
              type="email"
              value={personal.email}
              onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
              placeholder="Email"
              className="bg-slate-950/40 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 outline-none"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input
              type="text"
              value={personal.phone}
              onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
              placeholder="Phone"
              className="bg-slate-950/40 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 outline-none"
            />
            <input
              type="text"
              value={personal.github}
              onChange={(e) => setPersonal({ ...personal, github: e.target.value })}
              placeholder="GitHub Link"
              className="bg-slate-950/40 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 outline-none"
            />
            <input
              type="text"
              value={personal.linkedin}
              onChange={(e) => setPersonal({ ...personal, linkedin: e.target.value })}
              placeholder="LinkedIn Link"
              className="bg-slate-950/40 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 outline-none"
            />
          </div>
        </div>

        {/* Project Section */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-brand-purple uppercase">Projects</h4>
          <textarea
            value={projectText}
            onChange={(e) => setProjectText(e.target.value)}
            className="w-full h-24 bg-slate-950/40 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 outline-none resize-none focus:border-brand-purple/40"
            placeholder="Describe your project, use action-verbs..."
          />
        </div>

        {/* Skills Section */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-brand-purple uppercase">Skills Matrix</h4>
          <input
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            placeholder="Comma separated skills list..."
            className="w-full bg-slate-950/40 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 outline-none"
          />
        </div>
      </div>

      {/* Middle Col: Live Preview Canvas */}
      <div className="md:col-span-4 glass-panel p-6 flex flex-col justify-between overflow-hidden">
        <div className="flex flex-col space-y-2 border-b border-white/5 pb-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400">Live Resume Canvas</span>
            <span className="text-[10px] text-slate-600 font-mono font-bold text-brand-cyan uppercase">US Letter</span>
          </div>
          {/* Template buttons */}
          <div className="flex space-x-1 bg-slate-950/40 p-1 rounded-lg">
            {(['ats', 'executive', 'modern'] as const).map((temp) => (
              <button
                key={temp}
                onClick={() => setActiveTemplate(temp)}
                className={`flex-1 py-1 rounded text-[8px] font-bold uppercase transition-all cursor-pointer ${
                  activeTemplate === temp 
                    ? 'bg-brand-purple text-white shadow' 
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {temp}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive styled preview */}
        <div className="flex-1 bg-white text-slate-900 rounded-lg shadow-xl shadow-slate-950/50 overflow-y-auto select-none p-5 min-h-[300px]">
          {activeTemplate === 'ats' && (
            <div className="font-sans text-[8px] leading-relaxed space-y-4">
              <div className="text-center space-y-1">
                <h4 className="text-sm font-bold tracking-tight text-slate-950 uppercase border-b border-slate-200 pb-1">{personal.name || 'Your Name'}</h4>
                <p className="text-[7px] text-slate-600 flex justify-center space-x-2">
                  <span>{personal.email}</span>
                  <span>•</span>
                  <span>{personal.phone}</span>
                  <span>•</span>
                  <span>{personal.github}</span>
                </p>
              </div>

              <div className="space-y-2">
                <h5 className="font-extrabold uppercase border-b border-slate-250 pb-0.5 text-slate-800 text-[9px]">Technical Projects</h5>
                <div className="space-y-1">
                  <div className="flex justify-between font-bold">
                    <span>AptiCode Platform</span>
                    <span>2026 - Present</span>
                  </div>
                  <p className="text-slate-700 italic">Core Architect</p>
                  <p className="text-slate-600 leading-normal pl-2">
                    - {projectText || 'Describe details...'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="font-extrabold uppercase border-b border-slate-250 pb-0.5 text-slate-800 text-[9px]">Core Skills</h5>
                <p className="text-slate-600 pl-2">
                  <span className="font-bold">Languages & Databases:</span> {skills}
                </p>
              </div>
            </div>
          )}

          {activeTemplate === 'executive' && (
            <div className="font-serif text-[8px] leading-relaxed space-y-4 border-t-4 border-brand-purple pt-2">
              <div className="text-left space-y-1">
                <h4 className="text-base font-extrabold text-brand-purple tracking-tight">{personal.name || 'Your Name'}</h4>
                <p className="text-[7px] text-slate-500 space-x-2">
                  <span>{personal.email}</span>
                  <span>|</span>
                  <span>{personal.phone}</span>
                  <span>|</span>
                  <span>{personal.github}</span>
                </p>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold uppercase text-slate-800 border-b border-slate-200 text-[8px]">Projects & Experience</h5>
                <div className="space-y-1">
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>AptiCode Platform Development</span>
                    <span>2026 - Present</span>
                  </div>
                  <p className="text-slate-700 font-semibold italic pl-1">Lead Developer</p>
                  <p className="text-slate-600 pl-2">
                    {projectText}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="font-bold uppercase text-slate-800 border-b border-slate-200 text-[8px]">Technical Skills</h5>
                <p className="text-slate-650 pl-2">
                  {skills}
                </p>
              </div>
            </div>
          )}

          {activeTemplate === 'modern' && (
            <div className="font-sans text-[7px] leading-relaxed grid grid-cols-3 gap-4 h-full">
              {/* Sidebar Column */}
              <div className="col-span-1 bg-slate-100 p-2 rounded flex flex-col space-y-3">
                <div>
                  <h4 className="text-[10px] font-black text-slate-900">{personal.name || 'Your Name'}</h4>
                  <p className="text-[6px] text-slate-500 mt-1">{personal.email}</p>
                  <p className="text-[6px] text-slate-500">{personal.phone}</p>
                </div>
                <div>
                  <h5 className="font-bold text-[7px] text-slate-800 uppercase border-b border-slate-300 pb-0.5 mb-1">Links</h5>
                  <p className="text-[6px] text-slate-650 truncate">{personal.github}</p>
                  <p className="text-[6px] text-slate-650 truncate">{personal.linkedin}</p>
                </div>
                <div>
                  <h5 className="font-bold text-[7px] text-slate-800 uppercase border-b border-slate-300 pb-0.5 mb-1">Skills</h5>
                  <p className="text-[6px] text-slate-650 leading-normal">{skills}</p>
                </div>
              </div>

              {/* Main Column */}
              <div className="col-span-2 space-y-3">
                <div>
                  <h5 className="font-extrabold text-[8px] text-brand-purple uppercase border-b border-brand-purple/20 pb-0.5 mb-1.5">Projects Portfolio</h5>
                  <div className="space-y-1">
                    <p className="font-bold text-[7px] text-slate-900">AptiCode System</p>
                    <p className="text-[6.5px] text-slate-550 leading-relaxed">
                      {projectText}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 flex space-x-3">
          <button 
            onClick={() => alert('PDF generation initiated... Download will start.')}
            className="flex-1 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-300 rounded-lg transition-colors"
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* Right Col: AI ATS Auditor */}
      <div className="md:col-span-3 space-y-6">
        <h3 className="text-xl font-bold tracking-tight flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-brand-cyan" />
          <span>AI Resume Audit</span>
        </h3>

        <div className="glass-panel p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase">ATS Alignment</p>
              <p className={`text-2xl font-black mt-1 ${
                atsScore >= 75 ? 'text-emerald-400' : 'text-amber-500'
              }`}>{atsScore} / 100</p>
            </div>
            <button
              onClick={handleAuditResume}
              disabled={isAuditing}
              className="p-2 rounded bg-slate-900 border border-slate-800 text-brand-cyan hover:bg-slate-850"
            >
              {isAuditing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 fill-brand-cyan/20" />
              )}
            </button>
          </div>

          {/* Feedback items */}
          <div className="space-y-3">
            {auditFeedback.map((f, i) => (
              <div 
                key={i} 
                className={`p-3 rounded-lg text-[10px] leading-relaxed ${
                  f.startsWith('✅') 
                    ? 'bg-emerald-500/5 border border-emerald-500/10 text-slate-300' 
                    : 'bg-slate-950/40 border border-white/5 text-slate-400'
                }`}
              >
                {f}
              </div>
            ))}
          </div>

          {/* Quick Apply suggestion trigger */}
          {atsScore < 75 && (
            <button
              onClick={handleApplySuggestions}
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-brand-purple to-brand-cyan text-white font-bold text-xs shadow-md shadow-brand-purple/20 transition-all hover:brightness-110"
            >
              Apply AI Suggestions Instantly
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
