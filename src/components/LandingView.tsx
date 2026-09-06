import { useState } from 'react';
import { BookOpen, ShieldCheck, Sparkles, Brain, Lock, CheckCircle2, AlertCircle } from 'lucide-react';

interface LandingViewProps {
  onSignIn: () => Promise<void>;
  isLoading: boolean;
  authError: string | null;
}

export default function LandingView({ onSignIn, isLoading, authError }: LandingViewProps) {
  const [signingIn, setSigningIn] = useState(false);

  const handleSignInClick = async () => {
    setSigningIn(true);
    try {
      await onSignIn();
    } catch {
      // Handled in parent
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen geometric-radial-bg text-slate-900 flex flex-col justify-between selection:bg-indigo-500/20 selection:text-indigo-900">
      {/* Top minimal bar */}
      <nav className="bg-white/80 backdrop-blur-xs border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs rotate-45">
              <span className="-rotate-45 font-mono font-bold text-xs">G</span>
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-lg">
              Gemini Journal
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-slate-200 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Cloud Firestore Isolated
            </span>
          </div>
        </div>
      </nav>

      {/* Main hero & sign-in card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-2xl text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-medium tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Powered by Gemini 3.6 Flash & Firestore ABAC
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-900">
              Private Journaling,{' '}
              <span className="text-indigo-600">
                Illuminated by AI
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto leading-relaxed">
              Unpack your thoughts, examine dilemmas, and explore deep reflections with
              multi-turn Gemini conversations. Your entries are cryptographically bound to your user
              identity and never shared.
            </p>
          </div>

          {/* Error Banner if any */}
          {authError && (
            <div
              id="auth-error-banner"
              className="max-w-md mx-auto p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5 text-left shadow-xs"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="flex-1">
                <p className="font-semibold text-rose-900">Sign-in Notice</p>
                <p className="text-xs text-rose-700 mt-0.5">{authError}</p>
              </div>
            </div>
          )}

          {/* Sign In CTA Card */}
          <div className="max-w-md mx-auto p-6 sm:p-8 rounded-xl bg-white border border-slate-200 shadow-sm space-y-6">
            <div className="space-y-1">
              <h2 className="text-base font-bold text-slate-900">
                Sign In to Your Private Dashboard
              </h2>
              <p className="text-xs text-slate-500">
                Authenticate with Google Federated Identity. No custom passwords stored.
              </p>
            </div>

            <button
              id="google-signin-btn"
              onClick={handleSignInClick}
              disabled={signingIn || isLoading}
              className="w-full flex items-center justify-center gap-3 px-5 py-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm transition-all duration-150 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed group cursor-pointer"
            >
              {/* Google G Logo */}
              <svg className="w-4 h-4 shrink-0 bg-white rounded-full p-0.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>
                {signingIn || isLoading ? 'Connecting to Google...' : 'Continue with Google'}
              </span>
            </button>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-center gap-4 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" /> End-to-end user isolation
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" /> Zero passwords stored
              </span>
            </div>
          </div>

          {/* 3 Tech Architecture Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-3xl mx-auto pt-4">
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Brain className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Gemini 3.6 Flash Engine</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Multi-turn conversation flow with resilient fallback ladder for real-time reflections, thematic synthesis, and brainstorming.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">User Data Isolation</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Every reflection is strictly isolated to your authenticated UID in Cloud Firestore. No cross-user reads or writes.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Session History</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Revisit past journal threads, search by topic, and continue multi-turn dialogues seamlessly across sessions.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white/60">
        <p>Enterprise-grade security model with Google Cloud Run, Firestore, and Secret Manager</p>
      </footer>
    </div>
  );
}
