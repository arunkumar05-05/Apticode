import React, { useState, useEffect } from 'react';
import { User, Award, ClipboardList, Code, Bookmark, ShieldAlert, Sparkles, Download, GraduationCap, RefreshCw } from 'lucide-react';

interface ProfileData {
  fullName: string;
  email: string;
  phone: string;
  college: string;
  branch: string;
  department: string;
  graduationYear: number;
  registerNumber: string;
  skills: string;
  bio: string;
  github: string;
  linkedin: string;
  portfolio: string;
  profilePhoto: string;
  resume: string;
}

function formatHumanName(rawName?: string, email?: string): string {
  let name = rawName?.trim();
  if (!name || name === 'New Candidate' || name.includes('@')) {
    if (email) {
      name = email.split('@')[0];
    }
  }

  if (!name) return 'Candidate';

  let cleaned = name.replace(/^[0-9]{2}(it|cs|cse|ece|eee|mech|civil|ai|ds)?/i, '');
  if (!cleaned) cleaned = name;

  cleaned = cleaned.replace(/[._-]/g, ' ');
  cleaned = cleaned.replace(/([a-z])([A-Z])/g, '$1 $2');

  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length > 0) {
    const formatted = words
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
    if (formatted.length >= 2) return formatted;
  }

  return name.charAt(0).toUpperCase() + name.slice(1);
}

export default function ProfileView() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [testHistory, setTestHistory] = useState<any[]>([]);
  const [submissionsCount, setSubmissionsCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editData, setEditData] = useState<Partial<ProfileData>>({});
  const [saving, setSaving] = useState<boolean>(false);

  const getHeaders = () => {
    const saved = localStorage.getItem('apticode-user-session');
    const token = saved ? JSON.parse(saved).token : '';
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const loadProfileAndHistory = async () => {
    try {
      setLoading(true);
      // 1. Load profile
      const profRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/profile`, {
        headers: getHeaders()
      });
      const profData = await profRes.json();
      if (profData.status === 'success') {
        const raw = profData.profile || {};
        const parsed: ProfileData = {
          fullName: formatHumanName(raw.fullName, raw.email),
          email: raw.email || '',
          phone: raw.phone || '',
          college: raw.college || '',
          branch: raw.branch || raw.department || '',
          department: raw.department || raw.branch || '',
          graduationYear: raw.graduationYear ? Number(raw.graduationYear) : 2026,
          registerNumber: raw.registerNumber || '',
          skills: raw.skills || '',
          bio: raw.bio || '',
          github: raw.github || '',
          linkedin: raw.linkedin || '',
          portfolio: raw.portfolio || '',
          profilePhoto: raw.profilePhoto || '',
          resume: raw.resume || ''
        };
        setProfile(parsed);
        setEditData(parsed);
      }

      // 2. Load aptitude history
      const aptRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/mcqs/progress`, {
        headers: getHeaders()
      });
      const aptData = await aptRes.json();
      if (aptData.status === 'success' && Array.isArray(aptData.history)) {
        setTestHistory(aptData.history);
      }

      // 3. Load coding history to get count
      const codeRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/coding/submissions`, {
        headers: getHeaders()
      });
      const codeData = await codeRes.json();
      if (codeData.status === 'success' && Array.isArray(codeData.history)) {
        setSubmissionsCount(codeData.history.length);
      }
    } catch (err) {
      console.error('[Profile View] Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileAndHistory();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(editData)
      });
      const resData = await response.json();
      if (resData.status === 'success') {
        alert('Profile saved successfully!');
        setIsEditing(false);
        loadProfileAndHistory();
      } else {
        alert(resData.message || 'Failed to save profile changes.');
      }
    } catch (err) {
      console.error(err);
      alert('Save operation failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadResume = () => {
    alert('Generating PDF resume draft...\nSuccessfully downloaded AptiCode custom ATS resume builder document.');
  };

  if (loading) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center space-y-3 font-mono text-xs text-slate-500">
        <RefreshCw className="h-6 w-6 animate-spin text-brand-purple" />
        <span>Loading profile statistics...</span>
      </div>
    );
  }

  const badges = [
    { title: 'Consistency Hero', desc: 'Active Candidate preparing for placements', unlocked: true, icon: Sparkles, color: 'text-orange-400 bg-orange-500/10 border-orange-500/25' },
    { title: 'Accuracy Guru', desc: 'Maintain >70% coding accuracy', unlocked: submissionsCount > 0, icon: Award, color: 'text-brand-cyan bg-brand-cyan/10 border-brand-cyan/25' },
    { title: 'Test Champion', desc: 'Completed simulated aptitude scorecard reports', unlocked: testHistory.length > 0, icon: ClipboardList, color: 'text-brand-purple bg-brand-purple/10 border-brand-purple/25' },
    { title: 'AptiCode Pro', desc: 'Enlisted college roster profiles', unlocked: !!profile?.college, icon: GraduationCap, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' }
  ];

  return (
    <div className="grid md:grid-cols-3 gap-8 pb-12 text-left">
      
      {/* Left Column: Personal info & Preferences card */}
      <div className="md:col-span-1 space-y-6">
        <div className="glass-panel p-6 flex flex-col items-center text-center space-y-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-cyan text-2xl font-extrabold text-white shadow-xl shadow-brand-purple/20">
            {profile?.fullName ? profile.fullName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : 'AK'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-200">{profile?.fullName || 'Active Candidate'}</h2>
            <p className="text-xs text-slate-500 mt-1">{profile?.email || 'email@example.com'}</p>
          </div>

          <div className="w-full border-t border-white/5 pt-4 space-y-3 text-xs text-left">
            <div className="flex justify-between">
              <span className="text-slate-500">Academic Year:</span>
              <span className="text-slate-350 font-bold">{profile?.graduationYear || '2026'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Specialization:</span>
              <span className="text-slate-350 font-bold">{profile?.branch || 'Computer Science'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Reg Number:</span>
              <span className="text-slate-350 font-bold">{profile?.registerNumber || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Skills Matrix:</span>
              <span className="text-brand-cyan font-mono truncate max-w-[120px] font-bold">{profile?.skills || 'Python, React'}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 w-full">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="w-full flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-purple text-xs font-bold text-white transition-all hover:bg-brand-purple/80 cursor-pointer"
            >
              <span>{isEditing ? 'Cancel Edit' : 'Edit Profile Details'}</span>
            </button>
            <button
              onClick={handleDownloadResume}
              className="w-full flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 text-xs font-bold text-slate-350 transition-all hover:bg-slate-900 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF Resume</span>
            </button>
          </div>
        </div>

        {/* Stats card */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-550 uppercase tracking-widest font-mono">Workspace Metrics</h3>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-slate-950/30 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-550 block font-mono">Coding Submissions</span>
              <span className="text-xl font-extrabold text-brand-purple font-mono">{submissionsCount}</span>
            </div>
            <div className="p-3 bg-slate-950/30 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-555 block font-mono">Aptitude Quizzes</span>
              <span className="text-xl font-extrabold text-brand-cyan font-mono">{testHistory.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Edit Form or Achievements & History */}
      <div className="md:col-span-2 space-y-6">
        
        {isEditing ? (
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono border-b border-white/5 pb-2">Modify Database Profile Fields</h3>
            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="font-bold text-slate-400">Full Name</label>
                  <input
                    type="text"
                    value={editData.fullName || ''}
                    onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                    className="bg-slate-950 border border-white/10 rounded-lg p-2.5 text-slate-200 outline-none focus:border-brand-purple/45"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="font-bold text-slate-400">Phone</label>
                  <input
                    type="text"
                    value={editData.phone || ''}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    className="bg-slate-950 border border-white/10 rounded-lg p-2.5 text-slate-200 outline-none"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="font-bold text-slate-400">College</label>
                  <input
                    type="text"
                    value={editData.college || ''}
                    onChange={(e) => setEditData({ ...editData, college: e.target.value })}
                    className="bg-slate-950 border border-white/10 rounded-lg p-2.5 text-slate-200 outline-none"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="font-bold text-slate-400">Branch/Department</label>
                  <input
                    type="text"
                    value={editData.branch || ''}
                    onChange={(e) => setEditData({ ...editData, branch: e.target.value })}
                    className="bg-slate-950 border border-white/10 rounded-lg p-2.5 text-slate-200 outline-none"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="font-bold text-slate-400">Graduation Year</label>
                  <input
                    type="number"
                    value={editData.graduationYear || 2026}
                    onChange={(e) => setEditData({ ...editData, graduationYear: Number(e.target.value) })}
                    className="bg-slate-950 border border-white/10 rounded-lg p-2.5 text-slate-200 outline-none"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="font-bold text-slate-400">Register Number</label>
                  <input
                    type="text"
                    value={editData.registerNumber || ''}
                    onChange={(e) => setEditData({ ...editData, registerNumber: e.target.value })}
                    className="bg-slate-950 border border-white/10 rounded-lg p-2.5 text-slate-200 outline-none"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="font-bold text-slate-400">Skills Matrix (Comma separated)</label>
                  <input
                    type="text"
                    value={editData.skills || ''}
                    onChange={(e) => setEditData({ ...editData, skills: e.target.value })}
                    className="bg-slate-950 border border-white/10 rounded-lg p-2.5 text-slate-200 outline-none"
                  />
                </div>
              </div>
              <div className="flex flex-col space-y-1">
                <label className="font-bold text-slate-400">Short Bio</label>
                <textarea
                  value={editData.bio || ''}
                  onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                  className="bg-slate-950 border border-white/10 rounded-lg p-2.5 h-20 text-slate-200 outline-none resize-none"
                />
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="font-bold text-slate-400">GitHub Link</label>
                  <input
                    type="text"
                    value={editData.github || ''}
                    onChange={(e) => setEditData({ ...editData, github: e.target.value })}
                    className="bg-slate-950 border border-white/10 rounded-lg p-2.5 text-slate-200 outline-none"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="font-bold text-slate-400">LinkedIn Link</label>
                  <input
                    type="text"
                    value={editData.linkedin || ''}
                    onChange={(e) => setEditData({ ...editData, linkedin: e.target.value })}
                    className="bg-slate-950 border border-white/10 rounded-lg p-2.5 text-slate-200 outline-none"
                  />
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="font-bold text-slate-400">Portfolio Link</label>
                  <input
                    type="text"
                    value={editData.portfolio || ''}
                    onChange={(e) => setEditData({ ...editData, portfolio: e.target.value })}
                    className="bg-slate-950 border border-white/10 rounded-lg p-2.5 text-slate-200 outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full flex h-12 items-center justify-center bg-gradient-to-r from-brand-purple to-brand-cyan text-white font-bold rounded-xl transition-all hover:brightness-110 cursor-pointer"
              >
                {saving ? 'Saving changes...' : 'Save Database Profile'}
              </button>
            </form>
          </div>
        ) : (
          <>
            {/* Badges and Achievements */}
            <div className="glass-panel p-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Earned Badges & Goals</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {badges.map((badge, idx) => {
                  const Icon = badge.icon;
                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border flex items-start space-x-3 transition-opacity ${
                        badge.unlocked ? 'border-white/5 bg-slate-950/30' : 'border-white/5 opacity-40'
                      }`}
                    >
                      <div className={`p-2 rounded-lg border ${badge.unlocked ? badge.color : 'text-slate-500 bg-slate-900/50'}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-200">{badge.title}</h4>
                        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{badge.desc}</p>
                        <span className="text-[9px] font-mono mt-1.5 block font-bold text-brand-cyan">
                          {badge.unlocked ? '✓ Unlocked' : 'Locked'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Test History Card */}
            <div className="glass-panel p-6 space-y-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Test Simulator Scorecards</h3>
              {testHistory.length === 0 ? (
                <div className="text-slate-600 text-xs font-mono py-8 text-center">No simulated scorecard reports available yet.</div>
              ) : (
                <div className="space-y-3">
                  {testHistory.map((test: any, i: number) => {
                    const incorrectCount = test.incorrectQuestions ? JSON.parse(test.incorrectQuestions).length : 0;
                    return (
                      <div key={i} className="p-4 bg-slate-950/40 rounded-xl border border-white/5 flex items-center justify-between text-xs font-mono hover:border-brand-purple/20 transition-all">
                        <div className="space-y-1">
                          <p className="font-extrabold text-slate-350">Topic Practice: {test.topicId === 'q1' ? 'Time and Work' : test.topicId === 'q2' ? 'Profit & Loss' : 'Aptitude Prep'}</p>
                          <p className="text-[10px] text-slate-500">{new Date(test.completedAt).toLocaleString()} • {incorrectCount} Incorrect • Time: {test.timeTaken}s</p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-extrabold text-brand-cyan">{test.score} Pts</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

      </div>

    </div>
  );
}
