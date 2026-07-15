import React, { useState, useEffect } from 'react';
import { 
  FileText, Sparkles, CheckCircle2, AlertCircle, RefreshCw, Plus, Trash2,
  Mail, Phone, MapPin, BookOpen, Award
} from 'lucide-react';

interface PersonalDetails {
  name: string;
  email: string;
  phone: string;
  github: string;
  linkedin: string;
}

export default function ResumeView() {
  const [personal, setPersonal] = useState<PersonalDetails>({
    name: '',
    email: '',
    phone: '',
    github: '',
    linkedin: ''
  });

  const [skills, setSkills] = useState<string>('');
  const [projectText, setProjectText] = useState('');
  
  const [atsScore, setAtsScore] = useState(60);
  const [isAuditing, setIsAuditing] = useState(false);
  const [auditFeedback, setAuditFeedback] = useState<string[]>([
    "Please fill out details and trigger the AI ATS Audit."
  ]);

  const [versionName, setVersionName] = useState<string>('Default Version');
  const [versionsList, setVersionsList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [newVersionInput, setNewVersionInput] = useState<string>('');

  const getHeaders = () => {
    const saved = localStorage.getItem('apticode-user-session');
    const token = saved ? JSON.parse(saved).token : '';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const loadResumeData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/resume`, {
        headers: getHeaders()
      });
      const data = await response.json();
      if (data.status === 'success') {
        if (data.activeVersion && data.activeVersion.personal) {
          setPersonal(data.activeVersion.personal);
          setSkills(data.activeVersion.skills || '');
          setProjectText(data.activeVersion.projectText || '');
          setAtsScore(data.activeVersion.atsScore || 60);
          setAuditFeedback(data.activeVersion.auditFeedback || []);
          if (data.activeVersion.versionName) {
            setVersionName(data.activeVersion.versionName);
          }
        }
        setVersionsList(data.versions || []);
      }
    } catch (err) {
      console.error('[Resume View] Failed to load resume:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResumeData();
  }, []);

  // Debounced auto-save hook
  useEffect(() => {
    if (loading) return;
    const timer = setTimeout(async () => {
      try {
        setIsSaving(true);
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/resume`, {
          method: 'POST',
          headers: getHeaders(),
          body: JSON.stringify({
            versionName,
            personal,
            skills,
            projectText,
            atsScore,
            auditFeedback
          })
        });
      } catch (err) {
        console.error('Failed to auto-save resume changes:', err);
      } finally {
        setIsSaving(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [personal, skills, projectText, versionName]);

  const handleAuditResume = async () => {
    try {
      setIsAuditing(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/resume/audit`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ personal, skills, projectText })
      });
      const data = await response.json();
      if (data.status === 'success') {
        setAtsScore(data.atsScore);
        setAuditFeedback(data.auditFeedback || []);
      }
    } catch (err) {
      console.error(err);
      alert('ATS Audit failed.');
    } finally {
      setIsAuditing(false);
    }
  };

  const handleApplySuggestions = () => {
    setSkills((prev: string) => (prev ? prev + ', Redis, Docker, Prisma ORM' : 'Redis, Docker, Prisma ORM'));
    setProjectText('Architected a real-time AI placement engine with React and Node.js. Integrated Redis caching and dockerized container endpoints to support 100k requests.');
    setAtsScore(75);
  };

  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersionInput.trim()) return;
    const name = newVersionInput.trim();
    setVersionName(name);
    setNewVersionInput('');
    alert(`Switched to new version draft: "${name}". Changes will auto-save to this draft.`);
  };

  const handleSwitchVersion = async (vName: string) => {
    // Save current, then load selected
    setVersionName(vName);
    // Find version details
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/resume`, {
        headers: getHeaders()
      });
      const data = await response.json();
      if (data.status === 'success' && Array.isArray(data.versions)) {
        const selected = data.versions.find((v: any) => v.versionName === vName);
        if (selected) {
          // fetch details
          const content = JSON.parse(selected.contentJson || '{}');
          setPersonal(content.personal || { name: '', email: '', phone: '', github: '', linkedin: '' });
          setSkills(content.skills || '');
          setProjectText(content.projectText || '');
          setAtsScore(selected.atsScore || 60);
          setAuditFeedback(content.auditFeedback || []);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [activeTemplate, setActiveTemplate] = useState<'ats' | 'executive' | 'modern'>('ats');

  if (loading) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center space-y-3 font-mono text-xs text-slate-500">
        <RefreshCw className="h-6 w-6 animate-spin text-brand-purple" />
        <span>Loading resume versions canvas...</span>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-12 gap-8 pb-12 items-start h-auto">
      
      {/* Left Column: Form Editor & AI Suggestions Panel */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Card 1: Version Switcher */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/10 pb-2">
            <h4 className="text-xs font-extrabold text-brand-purple uppercase">Draft Versions</h4>
            {isSaving && <span className="text-[10px] text-brand-cyan animate-pulse">Auto-saving...</span>}
          </div>
          <form onSubmit={handleCreateVersion} className="flex gap-2">
            <input
              type="text"
              placeholder="Draft Name..."
              value={newVersionInput}
              onChange={(e) => setNewVersionInput(e.target.value)}
              className="bg-slate-900/60 border border-slate-850 rounded-lg p-2 text-xs text-slate-200 outline-none flex-1 focus:border-brand-purple/40"
            />
            <button type="submit" className="px-3 rounded-lg bg-brand-purple text-xs font-bold text-white flex items-center justify-center cursor-pointer">
              <Plus className="w-4 h-4" />
            </button>
          </form>

          {versionsList.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {versionsList.map((v) => (
                <button
                  key={v.id}
                  onClick={() => handleSwitchVersion(v.versionName)}
                  className={`px-3 py-1.5 rounded-lg border text-[10px] font-semibold cursor-pointer transition-all ${
                    versionName === v.versionName
                      ? 'border-brand-cyan bg-brand-cyan/10 text-brand-cyan'
                      : 'border-white/5 bg-slate-950/20 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {v.versionName} ({v.atsScore} Pts)
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Card 2: Resume Form */}
        <div className="glass-panel p-6 space-y-6">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/10 pb-2 flex items-center space-x-2">
            <FileText className="w-4 h-4 text-brand-purple" />
            <span>Resume Builder Form ({versionName})</span>
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

        {/* Card 3: AI ATS Audit */}
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
                <div className="space-y-2">
                  <h5 className="font-bold uppercase border-b border-[#D1D5DB] pb-1 text-[#111827] text-[15px] tracking-wide mb-[10px]">Skills Matrix</h5>
                  <p className="text-[#374151] leading-[1.7] font-normal select-all">
                    {skills || 'Python, React'}
                  </p>
                </div>

              </div>
            )}

            {/* Template 2: Executive Template */}
            {activeTemplate === 'executive' && (
              <div className="font-serif text-[14px] leading-[1.6] text-[#111827] space-y-6">
                <div className="border-b-2 border-slate-900 pb-3">
                  <h4 className="text-[28px] font-bold tracking-tight text-[#111827] uppercase">{personal.name || 'Your Name'}</h4>
                  <div className="text-[12px] font-serif text-[#4B5563] flex flex-wrap gap-x-3 mt-1">
                    <span>{personal.email}</span>
                    <span>•</span>
                    <span>{personal.phone}</span>
                    <span>•</span>
                    <span>{personal.linkedin}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <h5 className="font-bold border-b border-slate-350 text-[13px] uppercase tracking-wider">Experience</h5>
                  <div>
                    <div className="flex justify-between font-bold text-[14px]">
                      <span>Technical Project Lead</span>
                      <span>2026 - Present</span>
                    </div>
                    <p className="text-[#4B5563] italic text-[12px]">AptiCode Workspace</p>
                    <p className="text-[13px] leading-[1.6] text-slate-750 mt-1 pl-1">{projectText}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <h5 className="font-bold border-b border-slate-350 text-[13px] uppercase tracking-wider">Expertise</h5>
                  <p className="text-[13px] pl-1 font-serif">{skills}</p>
                </div>
              </div>
            )}

            {/* Template 3: Modern Template */}
            {activeTemplate === 'modern' && (
              <div className="font-sans text-[14px] leading-[1.6] text-slate-800 flex gap-6">
                <div className="w-1/3 bg-slate-100 p-4 -m-10 mr-0 pt-10 min-h-[842px] space-y-6 text-xs border-r border-slate-200">
                  <div className="space-y-2">
                    <h4 className="font-bold text-[16px] text-brand-purple">{personal.name || 'Name'}</h4>
                    <p className="text-slate-600">{personal.email}</p>
                    <p className="text-slate-600">{personal.phone}</p>
                  </div>
                  <div className="space-y-2">
                    <h5 className="font-bold uppercase border-b border-slate-300 text-slate-700">Capabilities</h5>
                    <p className="text-slate-600 leading-relaxed">{skills}</p>
                  </div>
                </div>
                <div className="w-2/3 space-y-6 pt-2">
                  <div className="space-y-3">
                    <h5 className="font-bold uppercase border-b border-slate-300 text-slate-800 text-[13px]">Projects</h5>
                    <div>
                      <p className="font-bold text-slate-900">AptiCode Placement Tech</p>
                      <p className="text-xs text-slate-600 mt-1">{projectText}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
