import React, { useState } from 'react';
import { 
  FileText, Sparkles, CheckCircle2, AlertCircle, RefreshCw, Plus, Trash2,
  Mail, Phone, MapPin, BookOpen, Award
} from 'lucide-react';

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
    setSkills((prev: string) => prev + ', Redis, Docker, Prisma ORM');
    setProjectText('Architected a real-time AI placement engine with React and Node.js. Integrated Redis caching and dockerized container endpoints to support 100k requests.');
    setAtsScore(74); // partial improvement before full re-audit
  };

  const [activeTemplate, setActiveTemplate] = useState<'ats' | 'executive' | 'modern'>('ats');

  return (
    <div className="grid lg:grid-cols-12 gap-8 pb-12 items-start h-auto">
      
      {/* Left Column: Form Editor & AI Suggestions Panel */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Card 1: Resume Form */}
        <div className="glass-panel p-6 space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/10 pb-2 flex items-center space-x-2">
            <FileText className="w-4 h-4 text-brand-purple" />
            <span>Resume Builder Form</span>
          </h3>

          {/* Personal Details */}
          <div className="space-y-3 text-left">
            <h4 className="text-xs font-extrabold text-brand-purple uppercase">Personal Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Name</label>
                <input
                  type="text"
                  value={personal.name}
                  onChange={(e) => setPersonal({ ...personal, name: e.target.value })}
                  placeholder="Full Name"
                  className="bg-slate-900/60 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-brand-purple/40 focus:bg-slate-950 transition-all"
                />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Email</label>
                <input
                  type="email"
                  value={personal.email}
                  onChange={(e) => setPersonal({ ...personal, email: e.target.value })}
                  placeholder="email@example.com"
                  className="bg-slate-900/60 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-brand-purple/40 focus:bg-slate-950 transition-all"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">Phone</label>
                <input
                  type="text"
                  value={personal.phone}
                  onChange={(e) => setPersonal({ ...personal, phone: e.target.value })}
                  placeholder="Phone"
                  className="bg-slate-900/60 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-brand-purple/40 focus:bg-slate-950 transition-all"
                />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">GitHub</label>
                <input
                  type="text"
                  value={personal.github}
                  onChange={(e) => setPersonal({ ...personal, github: e.target.value })}
                  placeholder="github.com/profile"
                  className="bg-slate-900/60 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-brand-purple/40 focus:bg-slate-950 transition-all"
                />
              </div>
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] text-slate-500 font-bold uppercase">LinkedIn</label>
                <input
                  type="text"
                  value={personal.linkedin}
                  onChange={(e) => setPersonal({ ...personal, linkedin: e.target.value })}
                  placeholder="linkedin.com/in/profile"
                  className="bg-slate-900/60 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-brand-purple/40 focus:bg-slate-950 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Project Section */}
          <div className="space-y-2 text-left">
            <h4 className="text-xs font-extrabold text-brand-purple uppercase">Technical Experience & Projects</h4>
            <textarea
              value={projectText}
              onChange={(e) => setProjectText(e.target.value)}
              className="w-full h-28 bg-slate-900/60 border border-slate-850 rounded-lg p-3 text-xs text-slate-200 outline-none resize-none focus:border-brand-purple/40 focus:bg-slate-950 transition-all"
              placeholder="Describe details, roles, action verbs..."
            />
          </div>

          {/* Skills Section */}
          <div className="space-y-2 text-left">
            <h4 className="text-xs font-extrabold text-brand-purple uppercase">Skills Matrix</h4>
            <input
              type="text"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="Comma separated skills list..."
              className="w-full bg-slate-900/60 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-200 outline-none focus:border-brand-purple/40 focus:bg-slate-950 transition-all"
            />
          </div>
        </div>

        {/* Card 2: AI ATS Audit */}
        <div className="glass-panel p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/10 pb-4">
            <div className="text-left">
              <p className="text-[10px] text-slate-500 font-bold uppercase">ATS Target Alignment</p>
              <p className={`text-2xl font-black mt-1 ${
                atsScore >= 75 ? 'text-emerald-400' : 'text-amber-500'
              }`}>{atsScore} / 100</p>
            </div>
            <button
              onClick={handleAuditResume}
              disabled={isAuditing}
              className="p-2.5 rounded-lg bg-slate-900 border border-slate-850 text-brand-cyan hover:bg-slate-850 cursor-pointer transition-all"
              title="Trigger ATS Audit"
            >
              {isAuditing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 fill-brand-cyan/20" />
              )}
            </button>
          </div>

          {/* Feedback items */}
          <div className="space-y-2.5 text-left">
            {auditFeedback.map((f: string, i: number) => (
              <div 
                key={i} 
                className={`p-3 rounded-xl text-[11px] leading-relaxed border ${
                  f.startsWith('✅') 
                    ? 'bg-emerald-500/5 border-emerald-500/10 text-slate-300' 
                    : 'bg-slate-950/20 border-slate-850/50 text-slate-400'
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
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-brand-purple to-brand-cyan text-white font-bold text-xs shadow-md shadow-brand-purple/20 transition-all hover:brightness-110 cursor-pointer"
            >
              Apply AI Suggestions Instantly
            </button>
          )}
        </div>
      </div>

      {/* Right Column: Live A4 PDF Preview Canvas */}
      <div className="lg:col-span-7 glass-panel p-6 flex flex-col justify-between overflow-hidden">
        
        {/* Template Selector Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-b border-slate-800/10 pb-4 mb-6">
          <div className="text-left">
            <span className="text-xs font-bold text-slate-400">Live Resume Canvas</span>
            <p className="text-[10px] text-slate-500">Perfectly rendered ATS outline</p>
          </div>
          {/* Template buttons */}
          <div className="flex bg-slate-950/40 p-1 rounded-lg border border-slate-850 self-start sm:self-auto">
            {(['ats', 'executive', 'modern'] as const).map((temp) => (
              <button
                key={temp}
                onClick={() => setActiveTemplate(temp)}
                className={`px-4 py-1.5 rounded-md text-[9px] font-bold uppercase transition-all cursor-pointer ${
                  activeTemplate === temp 
                    ? 'bg-brand-purple text-white shadow' 
                    : 'text-slate-500 hover:text-slate-350'
                }`}
              >
                {temp}
              </button>
            ))}
          </div>
        </div>

        {/* A4 Sheet Container */}
        <div className="flex-1 overflow-y-auto max-h-[850px] p-2 bg-slate-950/20 rounded-xl border border-slate-850/30">
          <div className="w-full bg-white text-slate-900 shadow-2xl border border-slate-200 p-10 mx-auto min-h-[842px] max-w-[595px] aspect-[1/1.414] select-text text-left rounded-sm relative">
            
            {/* Template 1: ATS Template */}
            {activeTemplate === 'ats' && (
              <div className="font-sans text-[14px] leading-[1.7] text-[#374151] space-y-6">
                
                {/* Header Name & Contacts */}
                <div className="text-center space-y-3">
                  <h4 className="text-[32px] font-extrabold tracking-tight text-[#111827] uppercase leading-none select-all">{personal.name || 'Your Name'}</h4>
                  <div className="text-[13px] font-medium text-[#4B5563] flex flex-wrap justify-center items-center gap-x-4 gap-y-1.5">
                    {personal.email && (
                      <span className="flex items-center space-x-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#4B5563] shrink-0" />
                        <span>{personal.email}</span>
                      </span>
                    )}
                    {personal.phone && (
                      <span className="flex items-center space-x-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#4B5563] shrink-0" />
                        <span>{personal.phone}</span>
                      </span>
                    )}
                    {personal.github && (
                      <span className="flex items-center space-x-1.5">
                        <svg className="w-3.5 h-3.5 text-[#4B5563] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
                        <span className="truncate max-w-[120px]">{personal.github}</span>
                      </span>
                    )}
                    {personal.linkedin && (
                      <span className="flex items-center space-x-1.5">
                        <svg className="w-3.5 h-3.5 text-[#4B5563] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                        <span className="truncate max-w-[120px]">{personal.linkedin}</span>
                      </span>
                    )}
                    <span className="flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#4B5563] shrink-0" />
                      <span>New Delhi, IN</span>
                    </span>
                  </div>
                </div>

                {/* Profile Summary */}
                <div className="space-y-2">
                  <h5 className="font-bold uppercase border-b border-[#D1D5DB] pb-1 text-[#111827] text-[15px] tracking-wide mb-[10px]">Profile Summary</h5>
                  <p className="text-[#374151] leading-[1.7] font-normal select-all">
                    Highly motivated Software Engineer specializing in full-stack architecture, machine learning integrations, and container deployment. Proven capability in optimizing developer experience workflows and implementing performant Redis caches.
                  </p>
                </div>

                {/* Technical Projects */}
                <div className="space-y-4">
                  <h5 className="font-bold uppercase border-b border-[#D1D5DB] pb-1 text-[#111827] text-[15px] tracking-wide mb-[10px]">Technical Projects & Experience</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[15px] font-bold text-[#111827]">
                      <span className="select-all">AptiCode Placement Platform</span>
                      <span className="text-[13px] font-medium text-[#4B5563] select-all">2026 - Present</span>
                    </div>
                    <p className="text-[#4B5563] font-semibold italic text-[13px] -mt-2.5 pl-0.5 select-all">Core Architect</p>
                    <p className="text-[#4B5563] leading-[1.7] font-normal pl-0.5 select-all">
                      {projectText || 'Describe details...'}
                    </p>
                  </div>
                </div>

                {/* Education */}
                <div className="space-y-4">
                  <h5 className="font-bold uppercase border-b border-[#D1D5DB] pb-1 text-[#111827] text-[15px] tracking-wide mb-[10px]">Education</h5>
                  <div className="space-y-1">
                    <div className="flex justify-between items-center text-[15px] font-bold text-[#111827]">
                      <span className="select-all">Bachelor of Technology in Computer Science</span>
                      <span className="text-[13px] font-medium text-[#4B5563] select-all">2023 - 2027</span>
                    </div>
                    <p className="text-[#4B5563] font-semibold italic text-[13px] -mt-1 pl-0.5 select-all">GPA: 9.2/10.0</p>
                  </div>
                </div>

                {/* Skills */}
                <div className="space-y-3">
                  <h5 className="font-bold uppercase border-b border-[#D1D5DB] pb-1 text-[#111827] text-[15px] tracking-wide mb-[10px]">Core Skills Matrix</h5>
                  <div className="flex flex-wrap gap-2.5 pt-1 pl-0.5">
                    {skills.split(',').map((skill: string) => (
                      <span key={skill} className="px-3.5 py-1.5 bg-[#EEF4FF] border border-[#D7E5FF] text-[#2563EB] rounded-full text-xs font-bold tracking-wide select-all">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Template 2: Executive Template */}
            {activeTemplate === 'executive' && (
              <div className="font-serif text-[14px] leading-[1.7] text-[#374151] space-y-6 border-t-8 border-[#111827] pt-4">
                
                {/* Header Name & Contacts */}
                <div className="text-left space-y-3">
                  <h4 className="text-[32px] font-extrabold tracking-tight text-[#111827] uppercase leading-none select-all">{personal.name || 'Your Name'}</h4>
                  <div className="text-[13px] font-medium text-[#4B5563] flex flex-wrap gap-x-4 gap-y-1 border-b border-slate-200 pb-3">
                    {personal.email && (
                      <span className="flex items-center space-x-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#4B5563]" />
                        <span>{personal.email}</span>
                      </span>
                    )}
                    {personal.phone && (
                      <span className="flex items-center space-x-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#4B5563]" />
                        <span>{personal.phone}</span>
                      </span>
                    )}
                    {personal.github && (
                      <span className="flex items-center space-x-1.5">
                        <svg className="w-3.5 h-3.5 text-[#4B5563] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
                        <span>{personal.github}</span>
                      </span>
                    )}
                    {personal.linkedin && (
                      <span className="flex items-center space-x-1.5">
                        <svg className="w-3.5 h-3.5 text-[#4B5563] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                        <span>{personal.linkedin}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Profile Summary */}
                <div className="space-y-2">
                  <h5 className="font-bold uppercase text-[#111827] border-b border-[#D1D5DB] pb-1 text-[15px] tracking-wide mb-[10px]">Professional Profile</h5>
                  <p className="text-[#374151] leading-[1.7] select-all">
                    Detail-oriented technical lead with comprehensive experience designing web app pipelines and high-throughput microservices. Skilled in DevOps orchestration, database indexing, and custom AI API integrations.
                  </p>
                </div>

                {/* Experience & Projects */}
                <div className="space-y-4">
                  <h5 className="font-bold uppercase text-[#111827] border-b border-[#D1D5DB] pb-1 text-[15px] tracking-wide mb-[10px]">Projects & Professional Experience</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[15px] font-bold text-[#111827]">
                      <span>AptiCode Platform Architect</span>
                      <span className="text-[13px] font-medium text-[#4B5563]">2026 - Present</span>
                    </div>
                    <p className="text-[#4B5563] font-semibold italic text-[13px] -mt-2">Lead Developer</p>
                    <p className="text-[#4B5563] leading-[1.7] select-all">
                      {projectText}
                    </p>
                  </div>
                </div>

                {/* Skills */}
                <div className="space-y-3">
                  <h5 className="font-bold uppercase text-[#111827] border-b border-[#D1D5DB] pb-1 text-[15px] tracking-wide mb-[10px]">Technical Competency</h5>
                  <div className="flex flex-wrap gap-2.5 pt-1 pl-0.5">
                    {skills.split(',').map((skill: string) => (
                      <span key={skill} className="px-3.5 py-1.5 bg-[#EEF4FF] border border-[#D7E5FF] text-[#2563EB] rounded-full text-xs font-bold tracking-wide select-all">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Template 3: Modern Grid Template */}
            {activeTemplate === 'modern' && (
              <div className="font-sans text-[14px] leading-[1.7] text-[#374151] grid grid-cols-12 gap-8 h-full">
                
                {/* Left Column Sidebar (4/12 width) */}
                <div className="col-span-4 bg-[#F8FAFC] border border-slate-200/50 p-4 rounded-xl flex flex-col space-y-6">
                  <div>
                    <h4 className="text-[20px] font-black text-[#111827] leading-tight select-all">{personal.name || 'Your Name'}</h4>
                    <p className="text-[12px] text-slate-500 mt-1 uppercase font-semibold">Software Developer</p>
                  </div>

                  <div className="space-y-3 text-left">
                    <h5 className="font-bold text-[12px] text-[#111827] uppercase border-b border-slate-350 pb-1 mb-1">Contacts</h5>
                    {personal.email && (
                      <p className="text-[11px] text-[#4B5563] flex items-center space-x-1.5">
                        <Mail className="w-3.5 h-3.5 text-[#4B5563] shrink-0" />
                        <span className="truncate">{personal.email}</span>
                      </p>
                    )}
                    {personal.phone && (
                      <p className="text-[11px] text-[#4B5563] flex items-center space-x-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#4B5563] shrink-0" />
                        <span>{personal.phone}</span>
                      </p>
                    )}
                    {personal.github && (
                      <p className="text-[11px] text-[#4B5563] flex items-center space-x-1.5">
                        <svg className="w-3.5 h-3.5 text-[#4B5563] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
                        <span className="truncate">{personal.github}</span>
                      </p>
                    )}
                    {personal.linkedin && (
                      <p className="text-[11px] text-[#4B5563] flex items-center space-x-1.5">
                        <svg className="w-3.5 h-3.5 text-[#4B5563] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>
                        <span className="truncate">{personal.linkedin}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-3 text-left">
                    <h5 className="font-bold text-[12px] text-[#111827] uppercase border-b border-slate-350 pb-1 mb-1">Technical Skills</h5>
                    <div className="flex flex-wrap gap-1.5">
                      {skills.split(',').map((skill: string) => (
                        <span key={skill} className="px-2 py-1 bg-[#EEF4FF] border border-[#D7E5FF] text-[#2563EB] rounded-lg text-[10px] font-bold select-all">
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column Main content (8/12 width) */}
                <div className="col-span-8 space-y-6">
                  {/* Summary */}
                  <div className="space-y-2">
                    <h5 className="font-bold uppercase text-[#111827] border-b border-[#D1D5DB] pb-1 text-[15px] tracking-wide mb-[10px]">Overview Summary</h5>
                    <p className="text-[#374151] leading-[1.7] select-all">
                      Dynamic programmer dedicated to engineering clean APIs, optimizing database pipelines, and deploying robust user-focused dashboards.
                    </p>
                  </div>

                  {/* Portfolio */}
                  <div className="space-y-4">
                    <h5 className="font-bold text-[15px] text-[#111827] uppercase border-b border-[#D1D5DB] pb-1 tracking-wide mb-[10px]">Technical Portfolio</h5>
                    <div className="space-y-2">
                      <p className="font-bold text-[15px] text-[#111827]">AptiCode System</p>
                      <p className="text-[#4B5563] leading-[1.7] select-all">
                        {projectText}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Action controls */}
        <div className="pt-6">
          <button 
            onClick={() => alert('PDF generation initiated... Download will start.')}
            className="w-full py-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            Download PDF
          </button>
        </div>
      </div>
      
    </div>
  );
}
