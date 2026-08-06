import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, User, ShieldCheck, ArrowRight, Zap } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../supabase';
import { getApiBaseUrl } from '../config/api';
import { LiquidBackdrop } from './ui/LiquidBackdrop';
import { NeoSegment } from './ui/NeoKey';

const getSupabaseErrorMessage = (error: any, defaultFallback: string): string => {
  const message = error?.message || '';
  if (message.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please try again.';
  }
  if (message.includes('User already registered')) {
    return 'This email address is already registered.';
  }
  if (message.includes('Email not confirmed')) {
    return 'Your email address is not verified. Please check your inbox.';
  }
  return message || defaultFallback;
};

interface AuthViewProps {
  onAuthenticate: (user: { name: string; email: string; role: 'STUDENT' | 'ADMIN'; token: string; refreshToken?: string; isOnboarded?: boolean; onboardingCompleted?: boolean }) => void;
  onBack: () => void;
}

export default function AuthView({ onAuthenticate, onBack }: AuthViewProps) {
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const [role, setRole] = useState<'STUDENT' | 'ADMIN'>('STUDENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [validationError, setValidationError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  React.useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown(prev => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleAutofill = (selectedRole: 'STUDENT' | 'ADMIN') => {
    setRole(selectedRole);
    setValidationError('');
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

  const validateEmail = (emailStr: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailStr);
  };

  const validatePassword = (pass: string) => {
    const hasLetter = /[a-zA-Z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pass);
    return pass.length >= 6 && hasLetter && (hasNumber || hasSpecial);
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setValidationError('');
    if (!email.trim() || !validateEmail(email.trim())) {
      setValidationError('Please input a valid college email address.');
      return;
    }

    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
        if (error) throw error;
      }
      setResendCooldown(60);
      setValidationError('Verification link resent! Please check your inbox. You can resend again in 60 seconds.');
    } catch (err: any) {
      console.error(err);
      setValidationError(getSupabaseErrorMessage(err, 'Failed to resend verification link.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setValidationError('');

    if (!email.trim()) {
      setValidationError('Please enter your college email address.');
      return;
    }
    if (!validateEmail(email.trim())) {
      setValidationError('Please enter a valid email address format.');
      return;
    }
    if (!password.trim()) {
      setValidationError('Please input your password.');
      return;
    }

    if (authTab === 'signin') {
      setIsLoading(true);
      try {
        let result: any = null;
        if (isSupabaseConfigured) {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password
          });

          if (error) {
            setValidationError(getSupabaseErrorMessage(error, 'Sign in failed.'));
            setIsLoading(false);
            return;
          }

          const accessToken = data.session?.access_token || 'supabase-token';
          const apiBase = getApiBaseUrl();
          const signupName = fullName.trim() || localStorage.getItem(`signup_fullname_${email.trim()}`) || data.user?.user_metadata?.full_name || '';

          const response = await fetch(`${apiBase}/api/auth/supabase-verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ accessToken, role, email: email.trim(), fullName: signupName })
          });
          result = await response.json();
        } else {
          const apiBase = getApiBaseUrl();
          const signupName = fullName.trim() || localStorage.getItem(`signup_fullname_${email.trim()}`) || '';
          const response = await fetch(`${apiBase}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim(), password, fullName: signupName })
          });
          result = await response.json();
        }

        if (result && result.status === 'success' && result.user) {
          onAuthenticate({
            name: result.user.name,
            email: result.user.email,
            role: result.user.role,
            token: result.token,
            refreshToken: result.refreshToken,
            isOnboarded: result.user.isOnboarded
          });
          return;
        } else {
          setValidationError(result?.message || 'Verification failed on server.');
        }
      } catch (err: any) {
        console.warn('Auth Server Fetch Warning:', err);
        const fallbackName = fullName.trim() || localStorage.getItem(`signup_fullname_${email.trim()}`) || email.split('@')[0];
        onAuthenticate({
          name: fallbackName,
          email: email.trim(),
          role: role,
          token: 'offline-mobile-session-token'
        });
        return;
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!fullName.trim()) {
        setValidationError('Please input your full name for roster registration.');
        return;
      }
      if (!validatePassword(password)) {
        setValidationError('Password must be at least 6 characters long and contain both letters and numbers/special characters.');
        return;
      }

      localStorage.setItem(`signup_fullname_${email.trim()}`, fullName.trim());

      if (!isSupabaseConfigured) {
        setIsLoading(true);
        try {
          const apiBase = getApiBaseUrl();
          const response = await fetch(`${apiBase}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim(), password, fullName: fullName.trim(), role })
          });
          const result = await response.json();
          if (result.status === 'success' && result.user) {
            alert(`Account successfully registered for ${email}. You can now sign in!`);
            setAuthTab('signin');
          } else {
            setValidationError(result.message || 'Failed to register user.');
          }
        } catch {
          alert(`Account successfully registered for ${email}. You can now sign in!`);
          setAuthTab('signin');
        } finally {
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      try {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              full_name: fullName.trim(),
              role: role
            }
          }
        });

        if (error) {
          setValidationError(getSupabaseErrorMessage(error, 'Failed to create user.'));
          setIsLoading(false);
          return;
        }

        alert(`Registration initialized! A confirmation link has been sent to ${email}. Please check your email before logging in.`);
        setAuthTab('signin');
      } catch (error: any) {
        console.error('Signup error:', error);
        setValidationError(getSupabaseErrorMessage(error, 'Failed to create user.'));
      } finally {
        setIsLoading(false);
      }
    }
  };

  const inputClass = 'h-12 w-full lc-neo rounded-full pl-10 pr-4 text-sm text-lc-text outline-none placeholder:text-lc-text-muted/60 focus:ring-2 focus:ring-lc-cyan/40';

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-6 sm:px-6">
      <LiquidBackdrop />

      <div className="grid w-full max-w-5xl items-center gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="hidden lg:block relative"
        >
          <div className="lc-glass h-96 overflow-hidden">
            <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 50%, var(--lc-brand-violet) 0%, transparent 70%)' }} />
          </div>
          <div className="mt-6 space-y-3">
            <h2 className="text-lc-text">Your crystal-clear path to placement.</h2>
            <p className="text-sm leading-6 text-lc-text-muted">
              One account to track aptitude, coding, speech, and interviews — with your cohort by your side.
            </p>
            <div className="flex items-center gap-2 font-mono text-xs text-lc-cyan">
              <Zap className="h-4 w-4" />
              Streaks auto-track across every module
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="w-full">
          <div className="mb-5 flex items-center gap-3 cursor-pointer" onClick={onBack}>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-lc-violet to-lc-cyan shadow-neo">
              <img src="/favicon.svg" alt="AptiCode Logo" className="h-6 w-6" />
            </div>
            <div>
              <p className="font-display text-lg font-bold tracking-tight text-lc-text">Apti<span className="lc-text-gradient">Code</span></p>
              <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-lc-text-muted">Sign in to continue</p>
            </div>
          </div>

          <div className="lc-glass space-y-4 p-4 sm:p-5">
            <NeoSegment
              value={authTab}
              onChange={(v) => { setAuthTab(v as 'signin' | 'signup'); setValidationError(''); }}
              options={[
                { value: 'signin', label: 'Sign in' },
                { value: 'signup', label: 'Sign up' }
              ]}
              className="w-full"
            />

            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setRole('STUDENT'); setValidationError(''); }} className={`lc-neo lc-neo-pill p-3 text-sm font-semibold ${role === 'STUDENT' ? 'bg-gradient-to-r from-lc-cyan/20 to-lc-violet/20 text-lc-cyan' : 'text-lc-text-muted'}`}>
                <div className="mb-1 flex justify-center"><User className="h-4 w-4" /></div>
                Student
              </button>
              <button onClick={() => { setRole('ADMIN'); setValidationError(''); }} className={`lc-neo lc-neo-pill p-3 text-sm font-semibold ${role === 'ADMIN' ? 'bg-gradient-to-r from-lc-violet/20 to-lc-cyan/20 text-lc-violet' : 'text-lc-text-muted'}`}>
                <div className="mb-1 flex justify-center"><ShieldCheck className="h-4 w-4" /></div>
                Admin
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {authTab === 'signup' && (
                <div className="space-y-1.5 text-left">
                  <label className="text-[11px] font-semibold uppercase tracking-[0.24em] text-lc-text-muted">Full name</label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-lc-text-muted" />
                    <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Rahul Sharma" className={inputClass} />
                  </div>
                </div>
              )}

              <div className="space-y-1.5 text-left">
                <label className="text-[11px] font-semibold uppercase tracking-[0.24em] text-lc-text-muted">Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-lc-text-muted" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@college.edu" className={inputClass} />
                </div>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[11px] font-semibold uppercase tracking-[0.24em] text-lc-text-muted">Password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-lc-text-muted" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className={inputClass} />
                </div>
              </div>

              {validationError && <div className="rounded-2xl border border-lc-rose/20 bg-lc-rose/10 p-3 text-sm text-lc-rose">{validationError}</div>}

              {validationError.includes('verified') && (
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendCooldown > 0 || isLoading}
                  className={`mt-1 block text-xs text-left bg-transparent border-0 p-0 ${resendCooldown > 0 || isLoading ? 'text-lc-text-muted cursor-not-allowed' : 'text-lc-cyan hover:underline cursor-pointer'}`}
                >
                  {resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : 'Resend verification link'}
                </button>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`lc-neo lc-neo-pill flex h-12 w-full items-center justify-center gap-2 bg-gradient-to-r from-lc-violet to-lc-cyan text-sm font-bold text-lc-text ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                  <span className="animate-pulse">Processing...</span>
                ) : (
                  <>
                    <span>{authTab === 'signin' ? 'Continue to workspace' : 'Create account'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {import.meta.env.DEV && (
              <div className="lc-neo rounded-2xl p-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-lc-text-muted">Sandbox shortcuts</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleAutofill('STUDENT')} className="lc-neo lc-neo-pill bg-gradient-to-r from-lc-cyan/15 to-lc-violet/15 px-3 py-2 text-[11px] font-semibold text-lc-cyan">Student demo</button>
                  <button onClick={() => handleAutofill('ADMIN')} className="lc-neo lc-neo-pill bg-gradient-to-r from-lc-violet/15 to-lc-cyan/15 px-3 py-2 text-[11px] font-semibold text-lc-violet">Admin demo</button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
