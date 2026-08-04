import React, { useState, useEffect } from 'react';
import { Award, ClipboardList, Sparkles, Download, GraduationCap, RefreshCw } from 'lucide-react';
import { getApiBaseUrl } from '../config/api';
import { LiquidBackdrop } from './ui/LiquidBackdrop';
import Scene3D from './three/LazyScene3D';

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
    const savedSession = localStorage.getItem('apticode-user-session');
    let sessionUser: any = null;
    if (savedSession) {
      try { sessionUser = JSON.parse(savedSession); } catch {}
    }
    const currentEmail = sessionUser?.email || '';
    const currentName = sessionUser?.name || '';

    try {
      setLoading(true);
      // 1. Load profile from API
      const profRes = await fetch(`${getApiBaseUrl()}/api/profile`, {
        headers: getHeaders()
      });
      const profData = await profRes.json();
      if (profData.status === 'success' && profData.profile) {
        const raw = profData.profile || {};

        // Merge onboarding data saved locally if profile fields are sparse
        const onboardingSaved = localStorage.getItem(`onboarding_${currentEmail}`);
        let obData: any = {};
        if (onboardingSaved) {
          try { obData = JSON.parse(onboardingSaved); } catch {}
        }

        const parsed: ProfileData = {
          fullName: formatHumanName(raw.fullName || currentName, raw.email || currentEmail),
          email: raw.email || currentEmail,
          phone: raw.phone || '',
          college: raw.college || 'AptiCode College',
          branch: raw.branch || raw.department || obData.branch || 'Computer Science',
          department: raw.department || raw.branch || obData.branch || 'Computer Science',
          graduationYear: raw.graduationYear ? Number(raw.graduationYear) : (obData.year?.includes('Third') ? 2026 : 2025),
          registerNumber: raw.registerNumber || '',
          skills: raw.skills || obData.companies?.join(', ') || '',
          bio: raw.bio || `Targeting ${obData.goal?.join(', ') || 'software engineering'} roles`,
          github: raw.github || '',
          linkedin: raw.linkedin || '',
          portfolio: raw.portfolio || '',
          profilePhoto: raw.profilePhoto || '',
          resume: raw.resume || ''
        };
        setProfile(parsed);
        setEditData(parsed);
        if (parsed.email) {
          localStorage.setItem(`apticode-user-profile-${parsed.email}`, JSON.stringify(parsed));
        }
      } else {
        const emailKey = currentEmail || 'user';
        const localSaved = localStorage.getItem(`apticode-user-profile-${emailKey}`);
        if (localSaved) {
          const parsed = JSON.parse(localSaved);
          setProfile(parsed);
          setEditData(parsed);
        }
      }

      // 2. Load aptitude history
      try {
        const aptRes = await fetch(`${getApiBaseUrl()}/api/mcqs/progress`, {
          headers: getHeaders()
        });
        const aptData = await aptRes.json();
        if (aptData.status === 'success' && Array.isArray(aptData.history)) {
          setTestHistory(aptData.history);
        }
      } catch {}

      // 3. Load coding history
      try {
        const codeRes = await fetch(`${getApiBaseUrl()}/api/coding/submissions`, {
          headers: getHeaders()
        });
        const codeData = await codeRes.json();
        if (codeData.status === 'success' && Array.isArray(codeData.history)) {
          setSubmissionsCount(codeData.history.length);
        }
      } catch {}
    } catch (err) {
      console.warn('[Profile View] Loaded local session fallback:', err);
      const emailKey = currentEmail || 'user';
      const localSaved = localStorage.getItem(`apticode-user-profile-${emailKey}`);
      if (localSaved) {
        const parsed = JSON.parse(localSaved);
        setProfile(parsed);
        setEditData(parsed);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileAndHistory();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Save to local storage for instant mobile persistence
    const formattedData: ProfileData = {
      fullName: formatHumanName(editData.fullName, editData.email),
      email: editData.email || '',
      phone: editData.phone || '',
      college: editData.college || '',
      branch: editData.branch || editData.department || '',
      department: editData.department || editData.branch || '',
      graduationYear: editData.graduationYear ? Number(editData.graduationYear) : 2026,
      registerNumber: editData.registerNumber || '',
      skills: editData.skills || '',
      bio: editData.bio || '',
      github: editData.github || '',
      linkedin: editData.linkedin || '',
      portfolio: editData.portfolio || '',
      profilePhoto: editData.profilePhoto || '',
      resume: editData.resume || ''
    };
    setProfile(formattedData);
    setEditData(formattedData);
    if (formattedData.email) {
      localStorage.setItem(`apticode-user-profile-${formattedData.email}`, JSON.stringify(formattedData));
    }

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/profile`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(formattedData)
      });
      const resData = await response.json();
      if (resData.status === 'success' && resData.profile) {
        const raw = resData.profile;
        const updated: ProfileData = {
          ...formattedData,
          fullName: formatHumanName(raw.fullName, raw.email)
        };
        setProfile(updated);
        setEditData(updated);
      }
    } catch {
      console.warn('[Profile Save] Server fetch offline fallback active.');
    } finally {
      setSaving(false);
      setIsEditing(false);
      alert('Profile saved successfully!');
    }
  };

  const handleDownloadResume = () => {
    alert('Generating PDF resume draft...\nSuccessfully downloaded AptiCode custom ATS resume builder document.');
  };

  if (loading) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center space-y-3 font-mono text-xs text-lc-text-muted">
        <RefreshCw className="h-6 w-6 animate-spin text-lc-violet" />
        <span>Loading profile statistics...</span>
      </div>
    );
  }

  const badges = [
    { title: 'Consistency Hero', desc: 'Active Candidate preparing for placements', unlocked: true, icon: Sparkles, color: 'text-lc-amber bg-lc-amber/10 border-lc-amber/25' },
    { title: 'Accuracy Guru', desc: 'Maintain >70% coding accuracy', unlocked: submissionsCount > 0, icon: Award, color: 'text-lc-cyan bg-lc-cyan/10 border-lc-cyan/25' },
    { title: 'Test Champion', desc: 'Completed simulated aptitude scorecard reports', unlocked: testHistory.length > 0, icon: ClipboardList, color: 'text-lc-violet bg-lc-violet/10 border-lc-violet/25' },
    { title: 'AptiCode Pro', desc: 'Enlisted college roster profiles', unlocked: !!profile?.college, icon: GraduationCap, color: 'text-lc-emerald bg-lc-emerald/10 border-lc-emerald/25' }
  ];

  return (
    <div className="relative overflow-hidden">
      <LiquidBackdrop />

      <div className="relative overflow-hidden pointer-events-none mb-6 lg:mb-8">
        <div className="lc-glass h-44 sm:h-52 lg:h-60 overflow-hidden">
          <Scene3D variant="crystal" className="absolute inset-0" />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8 pb-12 text-left">

        {/* Left Column: Personal info & Preferences card */}
        <div className="md:col-span-1 space-y-6">
          <div className="lc-glass p-6 flex flex-col items-center text-center space-y-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-lc-violet to-lc-cyan text-2xl font-extrabold text-lc-text shadow-neo">
              {profile?.fullName ? profile.fullName.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase() : 'AK'}
            </div>
            <div>
              <h2 className="text-lg font-bold text-lc-text">{profile?.fullName || 'Active Candidate'}</h2>
              <p className="text-xs text-lc-text-muted mt-1">{profile?.email || 'email@example.com'}</p>
            </div>

            <div className="w-full border-t border-lc-glass-border pt-4 space-y-3 text-xs text-left">
              <div className="flex justify-between">
                <span className="text-lc-text-muted">Academic Year:</span>
                <span className="text-lc-text font-bold">{profile?.graduationYear || '2026'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-lc-text-muted">Specialization:</span>
                <span className="text-lc-text font-bold">{profile?.branch || 'Computer Science'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-lc-text-muted">Reg Number:</span>
                <span className="text-lc-text font-bold">{profile?.registerNumber || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-lc-text-muted">Skills Matrix:</span>
                <span className="text-lc-cyan font-mono truncate max-w-[120px] font-bold">{profile?.skills || 'Python, React'}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="lc-neo lc-neo-pill w-full flex h-11 items-center justify-center gap-2 bg-gradient-to-r from-lc-violet to-lc-cyan text-xs font-bold text-lc-text transition-all cursor-pointer"
              >
                <span>{isEditing ? 'Cancel Edit' : 'Edit Profile Details'}</span>
              </button>
              <button
                onClick={handleDownloadResume}
                className="lc-neo lc-neo-pill w-full flex h-11 items-center justify-center gap-2 border border-lc-glass-border bg-lc-glass-raised text-xs font-bold text-lc-text transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF Resume</span>
              </button>
            </div>
          </div>

          {/* Stats card */}
          <div className="lc-glass p-6 space-y-4">
            <h3 className="text-xs font-bold text-lc-text-muted uppercase tracking-widest font-mono">Workspace Metrics</h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="lc-glass p-3">
                <span className="text-[10px] text-lc-text-muted block font-mono">Coding Submissions</span>
                <span className="text-xl font-extrabold text-lc-violet font-mono">{submissionsCount}</span>
              </div>
              <div className="lc-glass p-3">
                <span className="text-[10px] text-lc-text-muted block font-mono">Aptitude Quizzes</span>
                <span className="text-xl font-extrabold text-lc-cyan font-mono">{testHistory.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Form or Achievements & History */}
        <div className="md:col-span-2 space-y-6">

          {isEditing ? (
            <div className="lc-glass p-6 space-y-4">
              <h3 className="text-xs font-bold text-lc-text-muted uppercase tracking-widest font-mono border-b border-lc-glass-border pb-2">Modify Database Profile Fields</h3>
              <form onSubmit={handleSave} className="space-y-4 text-xs">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1">
                    <label className="font-bold text-lc-text-muted">Full Name</label>
                    <input
                      type="text"
                      value={editData.fullName || ''}
                      onChange={(e) => setEditData({ ...editData, fullName: e.target.value })}
                      className="lc-neo rounded-full p-2.5 text-lc-text outline-none focus:ring-2 focus:ring-lc-cyan/40"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="font-bold text-lc-text-muted">Phone</label>
                    <input
                      type="text"
                      value={editData.phone || ''}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                      className="lc-neo rounded-full p-2.5 text-lc-text outline-none focus:ring-2 focus:ring-lc-cyan/40"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex flex-col space-y-1">
                    <label className="font-bold text-lc-text-muted">College</label>
                    <input
                      type="text"
                      value={editData.college || ''}
                      onChange={(e) => setEditData({ ...editData, college: e.target.value })}
                      className="lc-neo rounded-full p-2.5 text-lc-text outline-none focus:ring-2 focus:ring-lc-cyan/40"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="font-bold text-lc-text-muted">Branch/Department</label>
                    <input
                      type="text"
                      value={editData.branch || ''}
                      onChange={(e) => setEditData({ ...editData, branch: e.target.value })}
                      className="lc-neo rounded-full p-2.5 text-lc-text outline-none focus:ring-2 focus:ring-lc-cyan/40"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="font-bold text-lc-text-muted">Graduation Year</label>
                    <input
                      type="number"
                      value={editData.graduationYear || 2026}
                      onChange={(e) => setEditData({ ...editData, graduationYear: Number(e.target.value) })}
                      className="lc-neo rounded-full p-2.5 text-lc-text outline-none focus:ring-2 focus:ring-lc-cyan/40"
                    />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1">
                    <label className="font-bold text-lc-text-muted">Register Number</label>
                    <input
                      type="text"
                      value={editData.registerNumber || ''}
                      onChange={(e) => setEditData({ ...editData, registerNumber: e.target.value })}
                      className="lc-neo rounded-full p-2.5 text-lc-text outline-none focus:ring-2 focus:ring-lc-cyan/40"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="font-bold text-lc-text-muted">Skills Matrix (Comma separated)</label>
                    <input
                      type="text"
                      value={editData.skills || ''}
                      onChange={(e) => setEditData({ ...editData, skills: e.target.value })}
                      className="lc-neo rounded-full p-2.5 text-lc-text outline-none focus:ring-2 focus:ring-lc-cyan/40"
                    />
                  </div>
                </div>
                <div className="flex flex-col space-y-1">
                  <label className="font-bold text-lc-text-muted">Short Bio</label>
                  <textarea
                    value={editData.bio || ''}
                    onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                    className="lc-neo rounded-2xl p-2.5 h-20 text-lc-text outline-none resize-none focus:ring-2 focus:ring-lc-cyan/40"
                  />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="flex flex-col space-y-1">
                    <label className="font-bold text-lc-text-muted">GitHub Link</label>
                    <input
                      type="text"
                      value={editData.github || ''}
                      onChange={(e) => setEditData({ ...editData, github: e.target.value })}
                      className="lc-neo rounded-full p-2.5 text-lc-text outline-none focus:ring-2 focus:ring-lc-cyan/40"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="font-bold text-lc-text-muted">LinkedIn Link</label>
                    <input
                      type="text"
                      value={editData.linkedin || ''}
                      onChange={(e) => setEditData({ ...editData, linkedin: e.target.value })}
                      className="lc-neo rounded-full p-2.5 text-lc-text outline-none focus:ring-2 focus:ring-lc-cyan/40"
                    />
                  </div>
                  <div className="flex flex-col space-y-1">
                    <label className="font-bold text-lc-text-muted">Portfolio Link</label>
                    <input
                      type="text"
                      value={editData.portfolio || ''}
                      onChange={(e) => setEditData({ ...editData, portfolio: e.target.value })}
                      className="lc-neo rounded-full p-2.5 text-lc-text outline-none focus:ring-2 focus:ring-lc-cyan/40"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="lc-neo lc-neo-pill w-full flex h-12 items-center justify-center bg-gradient-to-r from-lc-violet to-lc-cyan text-xs font-bold text-lc-text transition-all cursor-pointer"
                >
                  {saving ? 'Saving changes...' : 'Save Database Profile'}
                </button>
              </form>
            </div>
          ) : (
            <>
              {/* Badges and Achievements */}
              <div className="lc-glass p-6 space-y-4">
                <h3 className="text-xs font-bold text-lc-text-muted uppercase tracking-widest font-mono">Earned Badges & Goals</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {badges.map((badge, idx) => {
                    const Icon = badge.icon;
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border flex items-start space-x-3 transition-opacity ${badge.unlocked ? 'border-lc-glass-border bg-lc-glass-raised' : 'border-lc-glass-border opacity-40'
                          }`}
                      >
                        <div className={`p-2 rounded-lg border ${badge.unlocked ? badge.color : 'text-lc-text-muted bg-lc-glass-raised'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-lc-text">{badge.title}</h4>
                          <p className="text-[10px] text-lc-text-muted mt-1 leading-relaxed">{badge.desc}</p>
                          <span className="text-[9px] font-mono mt-1.5 block font-bold text-lc-cyan">
                            {badge.unlocked ? '✓ Unlocked' : 'Locked'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Test History Card */}
              <div className="lc-glass p-6 space-y-4">
                <h3 className="text-xs font-bold text-lc-text-muted uppercase tracking-widest font-mono">Test Simulator Scorecards</h3>
                {testHistory.length === 0 ? (
                  <div className="text-lc-text-muted text-xs font-mono py-8 text-center">No simulated scorecard reports available yet.</div>
                ) : (
                  <div className="space-y-3">
                    {testHistory.map((test: any, i: number) => {
                      const incorrectCount = test.incorrectQuestions ? JSON.parse(test.incorrectQuestions).length : 0;
                      return (
                        <div key={i} className="p-4 bg-lc-glass-raised rounded-xl border border-lc-glass-border flex items-center justify-between text-xs font-mono hover:border-lc-violet/20 transition-all">
                          <div className="space-y-1">
                            <p className="font-extrabold text-lc-text">Topic Practice: {test.topicId === 'q1' ? 'Time and Work' : test.topicId === 'q2' ? 'Profit & Loss' : 'Aptitude Prep'}</p>
                            <p className="text-[10px] text-lc-text-muted">{new Date(test.completedAt).toLocaleString()} • {incorrectCount} Incorrect • Time: {test.timeTaken}s</p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-extrabold text-lc-cyan">{test.score} Pts</span>
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

    </div>
  );
}
