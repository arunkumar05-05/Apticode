import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Mail, User, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';

const getFirebaseErrorMessage = (error: any, defaultFallback: string): string => {
  const code = error?.code || error?.message;
  switch (code) {
    case 'auth/operation-not-allowed':
      return 'Email/password accounts are not enabled. Please enable this option in the Firebase Console.';
    case 'auth/invalid-email':
      return 'The email address is invalid. Please check the format.';
    case 'auth/network-request-failed':
      return 'A network error occurred. Please check your internet connection and try again.';
    case 'auth/email-already-in-use':
      return 'This email address is already registered.';
    case 'auth/weak-password':
      return 'The password is too weak. It must be at least 6 characters.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Your account has been temporarily locked due to repeated failed requests. Please wait a few minutes and try again.';
    default:
      return error?.message || defaultFallback;
  }
};

interface AuthViewProps {
  onAuthenticate: (user: { name: string; email: string; role: 'STUDENT' | 'ADMIN'; token: string }) => void;
  onBack: () => void;
}

export default function AuthView({ onAuthenticate, onBack }: AuthViewProps) {
  const [authTab, setAuthTab] = useState<'signin' | 'signup'>('signin');
  const [role, setRole] = useState<'STUDENT' | 'ADMIN'>('STUDENT');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [validationError, setValidationError] = useState('');
  const [verificationEmailSent, setVerificationEmailSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [sandboxUsers, setSandboxUsers] = useState<Array<{ email: string; fullName: string; role: 'STUDENT' | 'ADMIN' }>>([]);

  // Resend cooldown timer
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
    return pass.length >= 6 && /[a-zA-Z]/.test(pass) && /[0-9!@#$%^&*()_+\-=\[\]{};':",./<>?]/.test(pass);
  };

  const handleResendVerification = async () => {
    if (resendCooldown > 0 || isLoading) return;
    setValidationError('');
    if (!email.trim() || !validateEmail(email.trim())) {
      setValidationError('Please input a valid college email address.');
      return;
    }
    if (!password.trim()) {
      setValidationError('Please enter your password first.');
      return;
    }
    
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      await sendEmailVerification(userCredential.user);
      setResendCooldown(60); // 60-second cooldown between resend attempts
      setValidationError('Verification link resent! Please check your inbox. You can resend again in 60 seconds.');
    } catch (err: any) {
      console.error(err);
      setValidationError(getFirebaseErrorMessage(err, 'Failed to resend verification link.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return; // Prevent duplicate submissions
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

    const hasConfig = import.meta.env.VITE_FIREBASE_API_KEY && !import.meta.env.VITE_FIREBASE_API_KEY.includes('PLACEHOLDER');

    if (authTab === 'signin') {
      setIsLoading(true);
      try {
        let result: any = null;
        if (hasConfig) {
          const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
          const user = userCredential.user;

          if (!user.emailVerified && !import.meta.env.DEV) {
            setValidationError('Your email address is not verified. Please check your inbox or click "Resend verification link" below.');
            setIsLoading(false);
            return;
          }

          const idToken = await user.getIdToken();
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/firebase-verify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ idToken, role, email: email.trim() })
          });
          result = await response.json();
        } else {
          // Sandbox Mode (or fallback mode)
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim(), password })
          });
          result = await response.json();
        }

        if (result && result.status === 'success' && result.user) {
          onAuthenticate({ 
            name: result.user.name, 
            email: result.user.email, 
            role: result.user.role,
            token: result.token
          });
          return;
        } else {
          setValidationError(result?.message || 'Verification failed on server.');
        }
      } catch (err: any) {
        console.error('Auth Error:', err);
        setValidationError(getFirebaseErrorMessage(err, 'Invalid credentials or connection error.'));
      } finally {
        setIsLoading(false);
      }
    } else {
      // Sign Up
      if (!fullName.trim()) {
        setValidationError('Please input your full name for roster registration.');
        return;
      }
      if (!validatePassword(password)) {
        setValidationError('Password must be at least 6 characters long and contain both letters and numbers/special characters.');
        return;
      }

      if (!hasConfig) {
        // Sandbox Sign Up Fallback: Create account directly on backend database!
        setIsLoading(true);
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim(), password, fullName: fullName.trim(), role })
          });
          const result = await response.json();
          if (result.status === 'success' && result.user) {
            setVerificationEmailSent(true);
            alert(`[Sandbox Mode] Account successfully registered for ${email}. You can now sign in!`);
            setAuthTab('signin');
          } else {
            setValidationError(result.message || 'Failed to register sandbox user.');
          }
        } catch (err) {
          setValidationError('Connection failed. Sandbox server offline.');
        } finally {
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );

        await sendEmailVerification(userCredential.user, {
          url: `${window.location.origin}/signin`,
          handleCodeInApp: false,
        });

        setVerificationEmailSent(true);
        alert(`Registration initialized! A verification email link has been sent to ${email}. Please verify your email before logging in.`);
        setAuthTab('signin');
      } catch (error: any) {
        console.error('Signup error:', error.code);
        setValidationError(getFirebaseErrorMessage(error, 'Failed to create user.'));
      } finally {
        setIsLoading(false);
      }
    }
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
            <button onClick={() => { setRole('ADMIN'); setValidationError(''); }} className={`rounded-[16px] border p-3 text-sm font-semibold ${role === 'ADMIN' ? 'border-brand-purple/40 bg-brand-purple/10 text-brand-purple' : 'border-white/10 bg-slate-950/30 text-slate-400'}`}>
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

            <div className="space-y-1.5 text-left">
              <label className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="h-12 w-full rounded-[16px] border border-white/10 bg-slate-950/40 pl-10 pr-4 text-sm text-slate-200 outline-none placeholder:text-slate-500 focus:border-brand-purple/40" />
              </div>
            </div>

            {validationError && <div className="rounded-[16px] border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">{validationError}</div>}

            {validationError.includes('verified') && (
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={resendCooldown > 0 || isLoading}
                className={`mt-1 text-xs block text-left bg-transparent border-0 p-0 ${resendCooldown > 0 || isLoading ? 'text-slate-500 cursor-not-allowed' : 'text-brand-cyan hover:underline cursor-pointer'}`}
              >
                {resendCooldown > 0 ? `Resend available in ${resendCooldown}s` : 'Resend verification link'}
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`flex h-12 w-full items-center justify-center gap-2 rounded-[16px] bg-gradient-to-r from-brand-purple to-brand-cyan text-sm font-semibold text-white transition-all ${isLoading ? 'opacity-60 cursor-not-allowed' : 'hover:brightness-110 active:scale-[0.98]'}`}
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
