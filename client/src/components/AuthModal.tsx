import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, UserPlus, LogIn, Database, LockKeyhole } from 'lucide-react';
import { startLogin } from '@/const';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'signup';
  initialError?: string;
}

/**
 * The product uses the platform OAuth flow for both sign-in and sign-up.
 * The OAuth callback upserts the user record and creates the session cookie;
 * credentials are never collected or stored by this application.
 */
export function authLaunchErrorMessage(_error: unknown): string {
  return 'Unable to open the secure account portal. Check your connection and try again.';
}

export default function AuthModal({ isOpen, onClose, defaultMode = 'login', initialError }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>(defaultMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError ?? null);

  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setLoading(false);
      setError(initialError ?? null);
    }
  }, [defaultMode, initialError, isOpen]);

  const handleContinue = () => {
    setError(null);
    setLoading(true);
    try {
      startLogin();
    } catch (launchError) {
      setLoading(false);
      setError(authLaunchErrorMessage(launchError));
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl"
          >
            <button onClick={onClose} aria-label="Close authentication dialog" className="absolute right-4 top-4 rounded-lg border border-slate-800 bg-slate-950 p-2 text-slate-400 transition-colors hover:text-white">
              <X className="h-4 w-4" />
            </button>

            <div className="flex flex-col gap-6 p-6 sm:p-8">
              <div className="flex flex-col gap-2 pr-8">
                <div className="flex items-center gap-1.5 font-mono text-xs font-semibold uppercase text-amber-500">
                  <ShieldCheck className="h-4 w-4" /> Secure account access
                </div>
                <h2 id="auth-modal-title" className="text-xl font-extrabold tracking-tight text-white">
                  {mode === 'login' ? 'Log in to Raito-FX Pro' : 'Create your Raito-FX Pro account'}
                </h2>
                <p className="text-xs leading-5 text-slate-400">
                  {mode === 'login'
                    ? 'Continue with the secure account portal to restore your saved dashboard and trading workspace.'
                    : 'Create an account through the secure account portal. Your profile and dashboard records will be saved to your account.'}
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <LockKeyhole className="mb-2 h-4 w-4 text-emerald-400" />
                  <p className="text-[11px] font-bold text-slate-200">Protected session</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <Database className="mb-2 h-4 w-4 text-sky-400" />
                  <p className="text-[11px] font-bold text-slate-200">Saved account data</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <ShieldCheck className="mb-2 h-4 w-4 text-amber-400" />
                  <p className="text-[11px] font-bold text-slate-200">Private workspace</p>
                </div>
              </div>

              {error && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs leading-5 text-rose-300" role="alert">{error}</div>}

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs leading-5 text-slate-400">
                <p className="font-bold text-slate-200">Need to recover access?</p>
                <p className="mt-1">Continue to the secure identity-provider portal to use its passwordless email, passkey, or recovery options. Raito-FX Pro does not store a separate password.</p>
                <button type="button" onClick={handleContinue} disabled={loading} className="mt-2 font-bold text-amber-400 underline decoration-amber-500/40 underline-offset-4 hover:text-amber-300">Open recovery options</button>
              </div>

              <button
                type="button"
                onClick={handleContinue}
                disabled={loading}
                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-amber-500/10 transition-all hover:bg-amber-400 active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
              >
                {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" /> : mode === 'login' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                {loading ? 'Opening secure account portal…' : mode === 'login' ? 'Continue to Log In' : 'Continue to Sign Up'}
              </button>

              <div className="border-t border-slate-800/60 pt-4 text-center text-xs">
                <span className="text-slate-500">{mode === 'login' ? "Don't have an account yet?" : 'Already have an account?'}</span>
                <button type="button" onClick={() => { setError(null); setMode(mode === 'login' ? 'signup' : 'login'); }} className="ml-1.5 font-bold text-amber-500 transition-all hover:text-amber-400 hover:underline">
                  {mode === 'login' ? 'Sign Up' : 'Log In'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
