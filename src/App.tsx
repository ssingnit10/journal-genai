import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, signInWithGoogle, logoutUser } from './lib/firebase.ts';
import {
  saveUserInteraction,
  deleteUserInteraction,
  subscribeToUserInteractions,
} from './services/firestoreService.ts';
import { requestGeminiReflection } from './services/geminiService.ts';
import type { JournalInteraction, ReflectionMode, UserAuthProfile, ChatMessage, AppSection } from './types.ts';

import Header from './components/Header.tsx';
import LandingView from './components/LandingView.tsx';
import JournalEditor from './components/JournalEditor.tsx';
import ReflectionThread from './components/ReflectionThread.tsx';
import HistorySidebar from './components/HistorySidebar.tsx';
import ErrorBanner from './components/ErrorBanner.tsx';
import InquiryView from './components/InquiryView.tsx';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [currentSection, setCurrentSection] = useState<AppSection>('journal');
  const [interactions, setInteractions] = useState<JournalInteraction[]>([]);
  const [activeInteraction, setActiveInteraction] = useState<JournalInteraction | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingFollowUp, setIsSendingFollowUp] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [generalError, setGeneralError] = useState<string | null>(null);

  // 1. Firebase Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setCurrentUser(user);
        setAuthLoading(false);
        setAuthError(null);
      },
      (error) => {
        console.error('Auth state change error:', error);
        setAuthError('Authentication session error. Please refresh and try again.');
        setAuthLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 2. Real-time Firestore subscriber for user's isolated interactions
  useEffect(() => {
    if (!currentUser) {
      setInteractions([]);
      setActiveInteraction(null);
      return;
    }

    const unsubscribe = subscribeToUserInteractions(
      currentUser.uid,
      (items) => {
        setInteractions(items);
        // Keep active interaction in sync with latest document data
        setActiveInteraction((prev) => {
          if (!prev) return null;
          const updated = items.find((i) => i.id === prev.id);
          return updated || prev;
        });
      },
      (err) => {
        console.error('Firestore subscription error:', err);
        setGeneralError('Could not sync journal entries from Firestore. Please check permissions.');
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Handle Google Sign In
  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err.code === 'auth/popup-blocked') {
        setAuthError('Sign-in popup was blocked by your browser. Please allow popups for this domain.');
      } else if (err.code === 'auth/cancelled-popup-request') {
        // User closed the popup, ignore
      } else {
        setAuthError(err.message || 'Failed to sign in with Google. Please try again.');
      }
    }
  };

  // Handle Sign Out
  const handleSignOut = async () => {
    try {
      await logoutUser();
      setActiveInteraction(null);
      setShowHistory(false);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  // Generate initial reflection
  const handleGenerateReflection = async (
    prompt: string,
    mode: ReflectionMode,
    title?: string,
    tags?: string[]
  ) => {
    if (!currentUser) return;
    setIsGenerating(true);
    setGeneralError(null);
    setSaveStatus('idle');

    try {
      const result = await requestGeminiReflection(currentUser, prompt, mode, []);

      // Auto-generate title if none was provided
      const resolvedTitle =
        title?.trim() ||
        prompt.split('\n')[0].slice(0, 50).trim() ||
        `${mode.toUpperCase()} Reflection`;

      const newId = `int_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const nowIso = new Date().toISOString();

      const newInteraction: JournalInteraction = {
        id: newId,
        userId: currentUser.uid,
        title: resolvedTitle,
        prompt,
        response: result.response,
        mode,
        messages: [],
        tags: Array.isArray(tags) && tags.length > 0 ? tags : [],
        createdAt: nowIso,
        updatedAt: nowIso,
        modelUsed: result.model,
      };

      // Persist to user's isolated Firestore collection
      setSaveStatus('saving');
      try {
        await saveUserInteraction(currentUser.uid, newInteraction);
        setSaveStatus('saved');
      } catch (saveErr) {
        setSaveStatus('error');
        console.error('Save to Firestore failed:', saveErr);
        setGeneralError('Reflection generated, but failed to save to Firestore. Click retry to persist.');
      }

      setActiveInteraction(newInteraction);
    } catch (aiErr: any) {
      console.error('AI reflection generation failed:', aiErr);
      setGeneralError(aiErr.message || 'Failed to connect to Gemini 3.6 Flash. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Multi-Turn Follow-Up
  const handleSendFollowUp = async (followUpText: string) => {
    if (!currentUser || !activeInteraction) return;
    setIsSendingFollowUp(true);
    setGeneralError(null);

    const userMessage: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      role: 'user',
      content: followUpText,
      timestamp: new Date().toISOString(),
    };

    const currentHistory = activeInteraction.messages || [];
    const updatedHistory = [...currentHistory, userMessage];

    // Optimistically update active interaction
    const intermediateInteraction: JournalInteraction = {
      ...activeInteraction,
      messages: updatedHistory,
      updatedAt: new Date().toISOString(),
    };
    setActiveInteraction(intermediateInteraction);

    try {
      const result = await requestGeminiReflection(
        currentUser,
        followUpText,
        activeInteraction.mode,
        updatedHistory
      );

      const assistantMessage: ChatMessage = {
        id: `msg_a_${Date.now()}`,
        role: 'assistant',
        content: result.response,
        timestamp: new Date().toISOString(),
      };

      const finalInteraction: JournalInteraction = {
        ...intermediateInteraction,
        messages: [...updatedHistory, assistantMessage],
        updatedAt: new Date().toISOString(),
        modelUsed: result.model,
      };

      setSaveStatus('saving');
      await saveUserInteraction(currentUser.uid, finalInteraction);
      setSaveStatus('saved');
      setActiveInteraction(finalInteraction);
    } catch (err: any) {
      console.error('Follow-up turn failed:', err);
      setGeneralError(err.message || 'Failed to generate follow-up response from Gemini.');
      setSaveStatus('error');
    } finally {
      setIsSendingFollowUp(false);
    }
  };

  // Delete Interaction
  const handleDeleteInteraction = async (interactionId: string) => {
    if (!currentUser) return;
    try {
      await deleteUserInteraction(currentUser.uid, interactionId);
      if (activeInteraction?.id === interactionId) {
        setActiveInteraction(null);
      }
    } catch (err) {
      console.error('Delete failed:', err);
      setGeneralError('Could not delete interaction. Please verify database permissions.');
    }
  };

  // Retry Save
  const handleRetrySave = async () => {
    if (!currentUser || !activeInteraction) return;
    setSaveStatus('saving');
    try {
      await saveUserInteraction(currentUser.uid, activeInteraction);
      setSaveStatus('saved');
      setGeneralError(null);
    } catch (err) {
      console.error('Retry save failed:', err);
      setSaveStatus('error');
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen geometric-radial-bg flex flex-col items-center justify-center text-slate-700">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium text-slate-500">Verifying secure session...</p>
      </div>
    );
  }

  // If unauthenticated, show LandingView
  if (!currentUser) {
    return (
      <LandingView
        onSignIn={handleSignIn}
        isLoading={authLoading}
        authError={authError}
      />
    );
  }

  const userProfile: UserAuthProfile = {
    uid: currentUser.uid,
    displayName: currentUser.displayName,
    email: currentUser.email,
    photoURL: currentUser.photoURL,
  };

  return (
    <div className="min-h-screen geometric-radial-bg text-slate-900 flex flex-col selection:bg-indigo-500/20 selection:text-indigo-900 font-sans">
      {/* Sticky Header */}
      <Header
        user={userProfile}
        currentSection={currentSection}
        onSelectSection={setCurrentSection}
        onSignOut={handleSignOut}
        onNewEntry={() => setActiveInteraction(null)}
        onToggleHistory={() => setShowHistory((prev) => !prev)}
        showHistory={showHistory}
        historyCount={interactions.length}
      />

      {/* Main Workspace Layout */}
      {currentSection === 'inquiries' ? (
        <div className="flex-1 overflow-y-auto">
          <InquiryView user={currentUser} />
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-8 max-w-4xl mx-auto w-full space-y-6">
            {/* General Error Banner */}
            {generalError && (
              <ErrorBanner
                message={generalError}
                onRetry={saveStatus === 'error' ? handleRetrySave : undefined}
                onDismiss={() => setGeneralError(null)}
              />
            )}

            {/* Active Thread or Editor */}
            {activeInteraction ? (
              <div className="space-y-6">
                {/* Back to write button */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setActiveInteraction(null)}
                    className="text-xs text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-1 font-medium cursor-pointer"
                  >
                    ← Write New Reflection
                  </button>
                </div>

                {/* Multi-turn reflection thread */}
                <ReflectionThread
                  interaction={activeInteraction}
                  onSendFollowUp={handleSendFollowUp}
                  isSendingFollowUp={isSendingFollowUp}
                />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-1">
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                    Reflect & Journal
                  </h1>
                  <p className="text-sm text-slate-500">
                    Select a mode, write your thoughts, and receive thoughtful synthesis from Gemini 3.6 Flash.
                  </p>
                </div>

                <JournalEditor
                  initialInteraction={null}
                  onGenerateReflection={handleGenerateReflection}
                  isGenerating={isGenerating}
                  saveStatus={saveStatus}
                  onRetrySave={handleRetrySave}
                />
              </div>
            )}
          </main>

          {/* Slide-over or desktop side panel for Journal History */}
          {showHistory && (
            <HistorySidebar
              interactions={interactions}
              activeId={activeInteraction?.id || null}
              onSelectInteraction={(item) => {
                setActiveInteraction(item);
                // On small screens, hide history after selection
                if (window.innerWidth < 1024) {
                  setShowHistory(false);
                }
              }}
              onDeleteInteraction={handleDeleteInteraction}
              onClose={() => setShowHistory(false)}
            />
          )}
        </div>
      )}
    </div>
  );
}
