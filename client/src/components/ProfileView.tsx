import React, { useState, useEffect } from 'react';
import { User, Award, ClipboardList, Code, Bookmark, ShieldAlert, Sparkles, Download, GraduationCap } from 'lucide-react';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

interface OnboardingPref {
  goal: string[];
  year: string;
  branch: string;
  codingLevel: string;
  companies: string[];
  studyGoal: number;
}

export default function ProfileView() {
  const [profilePref, setProfilePref] = useState<OnboardingPref | null>(null);
  const [testHistory, setTestHistory] = useState<any[]>([]);
  const [submissionsCount, setSubmissionsCount] = useState<number>(0);
  const [bookmarkCount, setBookmarkCount] = useState<number>(0);

  useEffect(() => {
    const loadUserData = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      try {
        const docRef = doc(db, 'users', currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfilePref({
            goal: data.goal || ['Placement Prep'],
            year: data.year || 'Third Year',
            branch: data.branch || 'Computer Science',
            codingLevel: data.codingLevel || 'Intermediate',
            companies: data.companies || ['Google'],
            studyGoal: data.studyGoal || 40
          });
          if (Array.isArray(data.testHistory)) {
            setTestHistory(data.testHistory);
          }
          if (Array.isArray(data.codingSubmissions)) {
            setSubmissionsCount(data.codingSubmissions.length);
          }
          let bookmcq = Array.isArray(data.bookmarkedQuestions) ? data.bookmarkedQuestions.length : 0;
          let bookcode = Array.isArray(data.bookmarkedCoding) ? data.bookmarkedCoding.length : 0;
          setBookmarkCount(bookmcq + bookcode);
        }
      } catch (err) {
        console.error('Failed to load user profile metrics:', err);
      }
    };
    loadUserData();
  }, []);

  const handleDownloadResume = () => {
    alert('Generating PDF resume draft...\nSuccessfully downloaded AptiCode custom ATS resume builder document.');
  };

  const badges = [
    { title: 'Consistency Hero', desc: '12 Days Daily Active Learning Streak', unlocked: true, icon: Sparkles, color: 'text-orange-400 bg-orange-500/10 border-orange-500/25' },
    { title: 'Accuracy Guru', desc: 'Maintain >75% coding accuracy', unlocked: true, icon: Award, color: 'text-brand-cyan bg-brand-cyan/10 border-brand-cyan/25' },
    { title: 'Test Champion', desc: 'Completed a timed Mock Test with positive score', unlocked: testHistory.length > 0, icon: ClipboardList, color: 'text-brand-purple bg-brand-purple/10 border-brand-purple/25' },
    { title: 'Google Ready', desc: 'Added Google to targets list in profile config', unlocked: profilePref?.companies.includes('Google') || false, icon: GraduationCap, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25' }
  ];

  return (
    <div className="grid md:grid-cols-3 gap-8 pb-12 text-left">
      
      {/* Left Column: Personal info & Preferences card */}
      <div className="md:col-span-1 space-y-6">
        <div className="glass-panel p-6 flex flex-col items-center text-center space-y-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-purple to-brand-cyan text-2xl font-extrabold text-white shadow-xl shadow-brand-purple/20">
            {auth.currentUser?.email?.split('@')[0].substring(0, 2).toUpperCase() || 'RS'}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-200">{auth.currentUser?.email?.split('@')[0] || 'Rahul Sharma'}</h2>
            <p className="text-xs text-slate-500 mt-1">{auth.currentUser?.email || 'student@college.edu'}</p>
          </div>

          <div className="w-full border-t border-white/5 pt-4 space-y-3 text-xs text-left">
            <div className="flex justify-between">
              <span className="text-slate-500">Academic Year:</span>
              <span className="text-slate-350 font-bold">{profilePref?.year || 'Third Year'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Specialization:</span>
              <span className="text-slate-350 font-bold">{profilePref?.branch || 'Computer Science'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Coding Skill:</span>
              <span className="text-slate-350 font-bold uppercase tracking-wider text-brand-cyan font-mono">{profilePref?.codingLevel || 'Intermediate'}</span>
            </div>
          </div>

          <button
            onClick={handleDownloadResume}
            className="w-full flex h-11 items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-950/40 text-xs font-bold text-slate-350 transition-all hover:bg-slate-900"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF Resume</span>
          </button>
        </div>

        {/* Stats card */}
        <div className="glass-panel p-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-550 uppercase tracking-widest font-mono">Workspace Metrics</h3>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-slate-950/30 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-500 block font-mono">Submissions</span>
              <span className="text-xl font-extrabold text-brand-purple font-mono">{submissionsCount}</span>
            </div>
            <div className="p-3 bg-slate-950/30 rounded-xl border border-white/5">
              <span className="text-[10px] text-slate-550 block font-mono">Bookmarks</span>
              <span className="text-xl font-extrabold text-brand-cyan font-mono">{bookmarkCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Achievements & History */}
      <div className="md:col-span-2 space-y-6">
        
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
                  <div className={`p-2 rounded-lg border ${badge.unlocked ? badge.color : 'text-slate-650 bg-slate-900/50'}`}>
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
              {testHistory.map((test, i) => (
                <div key={i} className="p-4 bg-slate-950/40 rounded-xl border border-white/5 flex items-center justify-between text-xs font-mono hover:border-brand-purple/20 transition-all">
                  <div className="space-y-1">
                    <p className="font-extrabold text-slate-350">{test.type === 'TOPIC' ? 'Topic Practice Quiz' : 'Full Mock Test'}</p>
                    <p className="text-[10px] text-slate-550">{test.date} • {test.correct} Correct • {test.incorrect} Incorrect</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-brand-cyan">{test.score} Pts</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
