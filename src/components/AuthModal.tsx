import React, { useState } from 'react';
import { X, Lock, Mail, User, ShieldCheck, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, signInWithEmail, signUpWithEmail, signInGuest, logout } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password);
      }
      onClose();
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGuestLogin = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await signInGuest();
      onClose();
    } catch (err: any) {
      // If offline or blocked, still close and let local storage handle it
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Icon & Heading */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="font-black text-xl text-slate-900 dark:text-white">
            {user ? 'Account & Cross-Device Sync' : mode === 'signin' ? 'Sign In to SikaGrocer' : 'Create Free Account'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {user 
              ? `Logged in as ${user.email || 'Guest User'}. All grocery lists and prices sync across devices.`
              : 'Sync your grocery lists and price benchmarks between iPhone, Android, and Web.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {user ? (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/30 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              <div>
                <span className="font-bold text-emerald-800 dark:text-emerald-300 block">
                  Cloud Sync Active
                </span>
                <span className="text-slate-600 dark:text-slate-400 text-[11px]">
                  ID: {user.uid.slice(0, 12)}...
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={async () => {
                await logout();
                onClose();
              }}
              className="w-full py-2.5 rounded-xl border border-rose-300 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 font-bold transition-colors"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Mode Switch Tabs */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  mode === 'signin'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  mode === 'signup'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="you@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 mt-2"
              >
                <span>{mode === 'signin' ? 'Sign In' : 'Create Account'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-white dark:bg-slate-900 px-2 text-slate-400 font-bold">
                  Or instant access
                </span>
              </div>
            </div>

            {/* Quick Guest / Offline Mode */}
            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Continue as Guest (No Password Required)</span>
            </button>

          </div>
        )}

      </div>
    </div>
  );
};
