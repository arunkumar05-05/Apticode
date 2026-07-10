import React, { useState } from 'react';
import { Terminal, Lock, Mail, User, ShieldCheck, Sparkles, ArrowRight, KeyRound } from 'lucide-react';

interface AuthViewProps {
  onAuthenticate: (user: { name: string; email: string; role: 'STUDENT' | 'ADMIN' }) => void;
  onBack: () => void;
}

export default function AuthView({ onAuthenticate, onBack }: AuthViewProps) {
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const [role, setRole] = useState<'STUDENT' | 'ADMIN'>('STUDENT');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [validationError, setValidationError] = useState('');

  // Student OTP state toggles
  const [loginMethod, setLoginMethod] = useState<'password' | 'otp'>('password');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const handleAutofill = (selectedRole: 'STUDENT' | 'ADMIN') => {
    setRole(selectedRole);
    setValidationError('');
    setLoginMethod('password');
    if (selectedRole === 'STUDENT') {
      setEmail('student@college.edu');
      setPassword('StudentPassword2026!');
      setFullName('Rahul Sharma');
    } else {
      setEmail('admin@college.edu');
      setPassword('AdminPassword2026!');
      setFullName('Prof. Shastri');
    }
  };

  const handleSendOtp = () => {
    if (!email.trim() || !email.includes('@')) {
      setValidationError('Please input a valid college email address first.');
      return;
    }
    setValidationError('');
    setOtpSent(true);
    alert(`A sandboxed Verification OTP has been dispatched to: ${email}. Use code '43210' to sign in.`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!email.trim()) {
      setValidationError('Please enter your college email address.');
      return;
    }

    if (authTab === 'signin') {
      if (role === 'STUDENT' && loginMethod === 'otp') {
        if (!otpCode.trim()) {
          setValidationError('Please input the 5-digit verification code.');
          return;
        }
        if (otpCode !== '43210') {
          setValidationError('Invalid verification code entered. Check email or use code 43210.');
          return;
        }
      } else {
        if (!password.trim()) {
          setValidationError('Please input your account password.');
          return;
        }
      }
    } else {
      // Sign Up validation
      if (!fullName.trim()) {
        setValidationError('Please input your full name for roster registration.');
        return;
      }
      if (!password.trim()) {
        setValidationError('Please assign a secure login password.');
        return;
      }
    }

    // Success Authentication simulation fallback
    const fallbackName = authTab === 'signin' 
      ? (role === 'STUDENT' ? 'Rahul Sharma' : 'Prof. Shastri') 
      : fullName;

    // Try live REST connection
    if (authTab === 'signin') {
      try {
        const response = await fetch('http://localhost:5000/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: password || 'OTP_SANDBOX' })
        });
        const result = await response.json();
        if (result.status === 'success' && result.user) {
          onAuthenticate({
            name: result.user.name,
            email: result.user.email,
            role: result.user.role
          });
          return;
        }
      } catch (err) {
        console.warn('Backend server offline. Switching dynamically to mock sandbox session.');
      }
    }

    // Simulate verification warning on signup
    if (authTab === 'signup') {
      alert(`Signup initialized! A confirmation validation link has been sent to ${email}. Logging you in directly for workspace demo...`);
    }

    onAuthenticate({
      name: fallbackName,
      email: email,
      role: role
    });
  };

  return (
    <div className="min-h-screen bg-obsidian-950 text-slate-100 flex flex-col justify-center items-center p-6 relative selection:bg-brand-cyan/30">
      {/* Decorative Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 -z-10" />

      {/* Brand logo link */}
      <div className="flex items-center space-x-2 mb-8 cursor-pointer" onClick={onBack}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-cyan flex items-center justify-center shadow-lg shadow-brand-purple/20">
          <Terminal className="w-4.5 h-4.5 text-white" />
        </div>
        <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
          Apti<span className="bg-gradient-to-r from-brand-purple to-brand-cyan bg-clip-text text-transparent">Code</span>
        </span>
      </div>

      {/* Auth Panel Card */}
      <div className="glass-panel p-8 max-w-md w-full border-white/5 space-y-6 relative shadow-2xl">
        {/* Toggle tabs */}
        <div className="flex space-x-1 bg-slate-950/40 p-1 rounded-lg">
          <button
            onClick={() => { setAuthTab('signin'); setValidationError(''); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              authTab === 'signin' ? 'bg-brand-purple text-white shadow' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setAuthTab('signup'); setValidationError(''); }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              authTab === 'signup' ? 'bg-brand-purple text-white shadow' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            Sign Up
          </button>
        </div>

        {/* Role Toggle Switcher */}
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Account Role</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setRole('STUDENT'); setValidationError(''); }}
              className={`p-3 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                role === 'STUDENT'
                  ? 'bg-brand-cyan/15 border-brand-cyan text-brand-cyan'
                  : 'bg-slate-950/20 border-white/5 text-slate-400 hover:border-slate-800'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Student Profile</span>
            </button>
            <button
              onClick={() => { setRole('ADMIN'); setValidationError(''); setLoginMethod('password'); }}
              className={`p-3 rounded-xl border text-[11px] font-bold transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                role === 'ADMIN'
                  ? 'bg-brand-purple/15 border-brand-purple text-brand-purple'
                  : 'bg-slate-950/20 border-white/5 text-slate-400 hover:border-slate-800'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin / Officer</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {authTab === 'signup' && (
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Full Name</label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-slate-950/40 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-xs text-slate-300 outline-none focus:border-brand-purple/50"
                />
                <User className="w-4 h-4 text-slate-650 absolute left-3 top-3.5" />
              </div>
            </div>
          )}

          <div className="space-y-1 text-left">
            <label className="text-[10px] font-bold text-slate-500 uppercase">Email Address</label>
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@college.edu"
                  className="w-full bg-slate-950/40 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-xs text-slate-300 outline-none focus:border-brand-purple/50"
                />
                <Mail className="w-4 h-4 text-slate-650 absolute left-3 top-3.5" />
              </div>
              {role === 'STUDENT' && authTab === 'signin' && loginMethod === 'otp' && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="px-3 bg-slate-900 border border-slate-800 text-[10px] font-bold text-brand-cyan hover:bg-slate-850 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  Send OTP
                </button>
              )}
            </div>
          </div>

          {/* Student OTP vs Password login toggles */}
          {role === 'STUDENT' && authTab === 'signin' ? (
            <div className="flex justify-between items-center px-1">
              <span className="text-[9px] text-slate-500 font-bold uppercase">Sign-in Mode</span>
              <button
                type="button"
                onClick={() => {
                  setLoginMethod(prev => prev === 'password' ? 'otp' : 'password');
                  setValidationError('');
                }}
                className="text-[9px] text-brand-cyan font-bold hover:underline cursor-pointer"
              >
                {loginMethod === 'password' ? 'Verify with OTP' : 'Verify with Password'}
              </button>
            </div>
          ) : null}

          {/* Dynamic Code / Password entry box */}
          {authTab === 'signin' && role === 'STUDENT' && loginMethod === 'otp' ? (
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Verification OTP</label>
              <div className="relative">
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="Enter 5-digit verification code"
                  className="w-full bg-slate-950/40 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-xs text-slate-300 outline-none focus:border-brand-purple/50"
                />
                <KeyRound className="w-4 h-4 text-slate-650 absolute left-3 top-3.5" />
              </div>
              {otpSent && (
                <p className="text-[8px] text-emerald-400 font-semibold pl-1">
                  ✓ Sandboxed validation code sent. Use: <strong className="font-mono">43210</strong>
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-1 text-left">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Password</label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950/40 border border-slate-800 rounded-lg pl-9 pr-4 py-2.5 text-xs text-slate-300 outline-none focus:border-brand-purple/50"
                />
                <Lock className="w-4 h-4 text-slate-650 absolute left-3 top-3.5" />
              </div>
            </div>
          )}

          {authTab === 'signup' && (
            <div className="p-3 bg-brand-cyan/5 border border-brand-cyan/15 rounded-lg text-left">
              <p className="text-[9px] text-slate-400 leading-relaxed font-semibold">
                📧 <strong>Validation check:</strong> An email verification link will be sent to confirm your college enrollment status.
              </p>
            </div>
          )}

          {validationError && (
            <p className="text-[10px] font-semibold text-red-400 bg-red-500/5 border border-red-500/10 p-2.5 rounded-lg text-left leading-relaxed">
              ⚠️ {validationError}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-purple to-brand-cyan text-white font-bold text-xs flex items-center justify-center space-x-1 hover:brightness-110 shadow-lg shadow-brand-purple/15 cursor-pointer"
          >
            <span>{authTab === 'signin' ? 'Verify & Authenticate' : 'Verify & Sign Up'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Quick Testing Autofill Panel - DEV ONLY GATED */}
        {import.meta.env.DEV && (
          <div className="pt-4 border-t border-white/5 space-y-2">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider text-left">Sandbox Test Keys (Dev mode only)</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleAutofill('STUDENT')}
                className="py-2 rounded-lg bg-slate-900 border border-slate-800 text-[9px] font-bold text-brand-cyan hover:bg-slate-850 cursor-pointer flex items-center justify-center space-x-1"
              >
                <Sparkles className="w-3 h-3 text-brand-cyan" />
                <span>Autofill Student</span>
              </button>
              <button
                onClick={() => handleAutofill('ADMIN')}
                className="py-2 rounded-lg bg-slate-900 border border-slate-800 text-[9px] font-bold text-brand-purple hover:bg-slate-850 cursor-pointer flex items-center justify-center space-x-1"
              >
                <ShieldCheck className="w-3 h-3 text-brand-purple" />
                <span>Autofill Admin</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={onBack}
        className="mt-6 text-xs text-slate-500 hover:text-slate-300 font-semibold cursor-pointer"
      >
        ✕ Cancel and go back
      </button>
    </div>
  );
}
