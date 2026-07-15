import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, BarChart2, Star, Target, Compass, RefreshCw } from 'lucide-react';

export default function AnalyticsView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const getHeaders = () => {
    const saved = localStorage.getItem('apticode-user-session');
    const token = saved ? JSON.parse(saved).token : '';
    return {
      'Authorization': `Bearer ${token}`
    };
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/analytics`, {
          headers: getHeaders()
        });
        const resJson = await response.json();
        if (resJson.status === 'success') {
          setData(resJson.analytics);
        }
      } catch (err) {
        console.error('[Analytics View] Error loading stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center space-y-3 font-mono text-xs text-slate-500">
        <RefreshCw className="h-6 w-6 animate-spin text-brand-purple" />
        <span>Loading database analytics trends...</span>
      </div>
    );
  }

  const rows = 4;
  const cols = 6; // last 24 days divided into 4x6 grid
  const activityLevels = data?.activityLevels || Array(24).fill(0);

  const coding = data?.radarMetrics?.coding || 70;
  const dbms = data?.radarMetrics?.dbms || 70;
  const softSkills = data?.radarMetrics?.softSkills || 70;
  const aptitude = data?.radarMetrics?.aptitude || 70;
  const sysDesign = data?.radarMetrics?.sysDesign || 70;

  // Calculate coordinates dynamically using trigonometry scaling
  const radarPoints = `${50},${50 - 40 * (coding / 100)} ${50 + 38 * (dbms / 100)},${50 - 12 * (dbms / 100)} ${50 + 23 * (softSkills / 100)},${50 + 32 * (softSkills / 100)} ${50 - 23 * (aptitude / 100)},${50 + 32 * (aptitude / 100)} ${50 - 38 * (sysDesign / 100)},${50 - 12 * (sysDesign / 100)}`;

  return (
    <div className="space-y-8 pb-12">
      {/* Dynamic Summary Cards */}
      <div className="grid md:grid-cols-3 gap-6 text-left">
        <div className="glass-panel p-6 space-y-2">
          <p className="text-[10px] text-slate-500 font-bold uppercase">Study Time Target</p>
          <div className="flex justify-between items-end">
            <h4 className="text-2xl font-black text-slate-200">{data?.studyHours || '0.0 Hours'}</h4>
            <span className="text-xs text-emerald-400 font-bold font-mono">100% Sync</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
            <div className="h-full bg-emerald-400" style={{ width: '85%' }} />
          </div>
          <p className="text-[9px] text-slate-500">Determined from compiler sandboxes and speaking times.</p>
        </div>

        <div className="glass-panel p-6 space-y-2">
          <p className="text-[10px] text-slate-500 font-bold uppercase">Aptitude Score Average</p>
          <div className="flex justify-between items-end">
            <h4 className="text-2xl font-black text-slate-200">{data?.averageAptitudeScore || 0}% Accuracy</h4>
            <span className="text-xs text-brand-cyan font-bold font-mono">Quant & Verbal</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
            <div className="h-full bg-brand-cyan" style={{ width: `${data?.averageAptitudeScore || 70}%` }} />
          </div>
          <p className="text-[9px] text-slate-500">Tracks performance delta from database scorecards.</p>
        </div>

        <div className="glass-panel p-6 space-y-2">
          <p className="text-[10px] text-slate-500 font-bold uppercase">Placement Readiness Match</p>
          <div className="flex justify-between items-end">
            <h4 className="text-2xl font-black text-brand-cyan">{data?.placementReadiness || '70% Match'}</h4>
            <span className="text-xs text-brand-purple font-bold">Tier-1 Threshold</span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-slate-900 overflow-hidden">
            <div className="h-full bg-brand-purple" style={{ width: '92%' }} />
          </div>
          <p className="text-[9px] text-slate-500">Based on mock interview logs and communication filler audits.</p>
        </div>
      </div>

      {/* Grid split */}
      <div className="grid md:grid-cols-3 gap-8 text-left">
        {/* Left 2 Cols: Activity Heatmap & Skill Profile */}
        <div className="md:col-span-2 space-y-6">
          {/* Heatmap Card */}
          <div className="glass-panel p-6 space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5 font-mono">
              <Calendar className="w-4 h-4 text-brand-cyan" />
              <span>Daily Practice Contribution Map (Last 24 Days)</span>
            </h4>
            
            {/* Custom Grid */}
            <div className="flex flex-col space-y-1.5 overflow-x-auto pb-2">
              {Array.from({ length: rows }).map((_, rIdx) => (
                <div key={rIdx} className="flex space-x-1.5 min-w-[120px]">
                  {Array.from({ length: cols }).map((_, cIdx) => {
                    const idx = rIdx * cols + cIdx;
                    const level = activityLevels[idx] || 0;
                    return (
                      <div
                        key={cIdx}
                        className={`w-5 h-5 rounded-sm transition-all duration-300 ${
                          level === 0 ? 'bg-slate-900/80 border border-slate-800/60' :
                          level === 1 ? 'bg-brand-purple/20' :
                          level === 2 ? 'bg-brand-purple/40' :
                          level === 3 ? 'bg-brand-cyan/60 shadow-sm shadow-brand-cyan/15' :
                          'bg-brand-cyan shadow-md shadow-brand-cyan/35'
                        }`}
                        title={`Daily activities count: ${level}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center text-[9px] text-slate-600 font-mono">
              <span>Less</span>
              <div className="flex space-x-1">
                <div className="w-2.5 h-2.5 bg-slate-900 rounded-sm" />
                <div className="w-2.5 h-2.5 bg-brand-purple/20 rounded-sm" />
                <div className="w-2.5 h-2.5 bg-brand-purple/40 rounded-sm" />
                <div className="w-2.5 h-2.5 bg-brand-cyan/60 rounded-sm" />
                <div className="w-2.5 h-2.5 bg-brand-cyan rounded-sm" />
              </div>
              <span>More</span>
            </div>
          </div>

          {/* SVG Radar Capability Profile */}
          <div className="glass-panel p-6 space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5 font-mono">
              <BarChart2 className="w-4 h-4 text-brand-purple" />
              <span>Placement Core Skill Balance</span>
            </h4>

            {/* Simulated Radar Chart using SVG */}
            <div className="flex justify-center py-4">
              <svg className="w-56 h-56" viewBox="0 0 100 100">
                {/* Background Concentric pentagons */}
                <polygon points="50,10 88,38 73,82 27,82 12,38" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
                <polygon points="50,25 78,46 67,73 33,73 22,46" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                <polygon points="50,40 68,54 61,65 39,65 32,54" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />

                {/* Axes */}
                <line x1="50" y1="50" x2="50" y2="10" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                <line x1="50" y1="50" x2="88" y2="38" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                <line x1="50" y1="50" x2="73" y2="82" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                <line x1="50" y1="50" x2="27" y2="82" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
                <line x1="50" y1="50" x2="12" y2="38" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />

                {/* User skill polygon dynamically computed */}
                <polygon 
                  points={radarPoints} 
                  fill="rgba(6, 182, 212, 0.2)" 
                  stroke="#06b6d4" 
                  strokeWidth="1" 
                />

                {/* Text Labels */}
                <text x="50" y="7" textAnchor="middle" fill="#94a3b8" fontSize="4" fontWeight="bold">CODING ({coding})</text>
                <text x="91" y="39" textAnchor="start" fill="#94a3b8" fontSize="4" fontWeight="bold">DBMS ({dbms})</text>
                <text x="76" y="85" textAnchor="start" fill="#94a3b8" fontSize="4" fontWeight="bold">SOFT SKILLS ({softSkills})</text>
                <text x="24" y="85" textAnchor="end" fill="#94a3b8" fontSize="4" fontWeight="bold">APTITUDE ({aptitude})</text>
                <text x="9" y="39" textAnchor="end" fill="#94a3b8" fontSize="4" fontWeight="bold">SYS DESIGN ({sysDesign})</text>
              </svg>
            </div>
          </div>
        </div>

        {/* Right Col: Targets & KPIs */}
        <div className="space-y-6">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
            <Target className="w-4.5 h-4.5 text-amber-500" />
            <span>Target Recommendations</span>
          </h4>

          <div className="glass-panel p-6 space-y-4">
            <div className="p-4 rounded-xl bg-slate-950/40 border border-white/5 space-y-2">
              <p className="text-xs font-bold text-slate-350">Fastest path to placement ready:</p>
              <ul className="list-disc pl-4 text-[10px] text-slate-500 space-y-2 leading-relaxed">
                <li>Complete more coding challenges to improve overall accuracy ({data?.codingAccuracy}%).</li>
                <li>Conduct technical mock interviews to boost System Design metrics.</li>
                <li>Verify your updated ATS resume output.</li>
              </ul>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-tr from-slate-900/60 to-brand-cyan/5 border border-brand-cyan/15 space-y-2">
              <p className="text-xs font-bold text-brand-cyan">Mock Interview Target Score:</p>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                Aim for **85%** or higher in mock interview reports. Try to speak without filler pauses to optimize confidence audits.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
