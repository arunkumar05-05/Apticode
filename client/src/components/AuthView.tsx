import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, User, ShieldCheck, Sparkles, ArrowRight, KeyRound } from 'lucide-react';

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
    alert(`A sandboxed verification OTP has been dispatched to: ${email}. Use code '43210' to sign in.`);
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
      } else if (!password.trim()) {
        setValidationError('Please input your account password.');
        return;
      }
    } else {
      if (!fullName.trim()) {
        setValidationError('Please input your full name for roster registration.');
        return;
      }
      if (!password.trim()) {
        setValidationError('Please assign a secure login password.');
        return;
      }
    }

    const fallbackName = authTab === 'signin' ? (role === 'STUDENT' ? 'Rahul Sharma' : 'Prof. Shastri') : fullName;

    if (authTab === 'signin') {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password: password || 'OTP_SANDBOX' })
        });
        const result = await response.json();
        if (result.status === 'success' && result.user) {
          onAuthenticate({ name: result.user.name, email: result.user.email, role: result.user.role });
          return;
        }
      } catch {
        console.warn('Backend server offline. Switching dynamically to mock sandbox session.');
      }
    }

    if (authTab === 'signup') {
      alert(`Signup initialized! A confirmation validation link has been sent to ${email}. Logging you in directly for workspace demo...`);
    }

    onAuthenticate({ name: fallbackName, email, role });
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--bg-base)] px-4 py-6 text-slate-100 sm:px-6">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-20" />
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="relative w-full max-w-md">
        <div className="mb-5 flex items-center gap-3" onClick={onBack}>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-purple to-brand-cyan shadow-lg shadow-brand-purple/15">
            <img src="/favicon.svg" alt="AptiCode Logo" className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight">Apti<span className="text-brand-cyan">Code</span></p>
            <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Sign in to continue</p>
          </div>
        </div>

        <div className="glass-panel space-y-4 p-4 sm:p-5">
          <div className="flex rounded-[16px] bg-slate-950/40 p-1">
            {(['signin', 'signup'] as const).map((tab) => (
              <button key={tab} onClick={() => { setAuthTab(tab); setValidationError(''); }} className={`flex-1 rounded-[12px] py-2.5 text-sm font-semibold transition-all ${authTab === tab ? 'bg-brand-purple text-white' : 'text-slate-500'}`}>
                {tab === 'signin' ? 'Sign in' : 'Sign up'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => { setRole('STUDENT'); setValidationError(''); }} className={`rounded-[16px] border p-3 text-sm font-semibold ${role === 'STUDENT' ? 'border-brand-cyan/40 bg-brand-cyan/10 text-brand-cyan' : 'border-white/10 bg-slate-950/30 text-slate-400'}`}>
              <div className="mb-1 flex justify-center"><User className="h-4 w-4" /></div>
              Student
            </button>
            <button onClick={() => { setRole('ADMIN'); setValidationError(''); setLoginMethod('password'); }} className={`rounded-[16px] border p-3 text-sm font-semibold ${role === 'ADMIN' ? 'border-brand-purple/40 bg-brand-purple/10 text-brand-purple' : 'border-white/10 bg-slate-950/30 text-slate-400'}`}>
              <div className="mb-1 flex justify-center"><ShieldCheck className="h-4 w-4" /></div>
              Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {authTab === 'signup' && (
              <div className="space-y-1.5 text-left">
                <label className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Full name</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Rahul Sharma" className="h-12 w-full rounded-[16px] border border-white/10 bg-slate-950/40 pl-10 pr-4 text-sm text-slate-200 outline-none ring-0 placeholder:text-slate-500 focus:border-brand-purple/40" />
                </div>
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Email</label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@college.edu" className="h-12 w-full rounded-[16px] border border-white/10 bg-slate-950/40 pl-10 pr-4 text-sm text-slate-200 outline-none placeholder:text-slate-500 focus:border-brand-purple/40" />
              </div>
            </div>

            {role === 'STUDENT' && authTab === 'signin' && (
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
                <span>Sign-in mode</span>
                <button type="button" onClick={() => { setLoginMethod((prev) => (prev === 'password' ? 'otp' : 'password')); setValidationError(''); }} className="text-brand-cyan">
                  {loginMethod === 'password' ? 'Use OTP instead' : 'Use password instead'}
                </button>
              </div>
            )}

            {authTab === 'signin' && role === 'STUDENT' && loginMethod === 'otp' ? (
              <div className="space-y-1.5 text-left">
                <label className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Verification code</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    <input value={otpCode} onChange={(e) => setOtpCode(e.target.value)} placeholder="Enter 5-digit code" className="h-12 w-full rounded-[16px] border border-white/10 bg-slate-950/40 pl-10 pr-4 text-sm text-slate-200 outline-none placeholder:text-slate-500 focus:border-brand-purple/40" />
                  </div>
                  <button type="button" onClick={handleSendOtp} className="h-12 rounded-[16px] border border-brand-cyan/20 bg-brand-cyan/10 px-3 text-sm font-semibold text-brand-cyan">Send OTP</button>
                </div>
                {otpSent && <p className="text-xs text-emerald-400">Sandbox code ready: 43210</p>}
              </div>
            ) : (
              <div className="space-y-1.5 text-left">
                <label className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-12 w-full rounded-[16px] border border-white/10 bg-slate-950/40 pl-10 pr-4 text-sm text-slate-200 outline-none placeholder:text-slate-500 focus:border-brand-purple/40" />
                </div>
              </div>
            )}

            {validationError && <div className="rounded-[16px] border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">{validationError}</div>}

            <button type="submit" className="flex h-12 w-full items-center justify-center gap-2 rounded-[16px] bg-gradient-to-r from-brand-purple to-brand-cyan text-sm font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]">
              <span>{authTab === 'signin' ? 'Continue to workspace' : 'Create account'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {import.meta.env.DEV && (
            <div className="rounded-[16px] border border-white/10 bg-slate-950/30 p-3">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500">Sandbox shortcuts</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleAutofill('STUDENT')} className="rounded-[12px] border border-brand-cyan/20 bg-brand-cyan/10 px-3 py-2 text-[11px] font-semibold text-brand-cyan">Student demo</button>
                <button onClick={() => handleAutofill('ADMIN')} className="rounded-[12px] border border-brand-purple/20 bg-brand-purple/10 px-3 py-2 text-[11px] font-semibold text-brand-purple">Admin demo</button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
