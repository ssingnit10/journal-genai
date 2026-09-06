import { useState } from 'react';
import Markdown from 'react-markdown';
import {
  Sparkles,
  User,
  Copy,
  Check,
  Send,
  Clock,
  CornerDownRight,
  MessageSquare,
  Lock,
  Unlock,
  BookOpen,
} from 'lucide-react';
import type { JournalInteraction, ChatMessage } from '../types.ts';

interface ReflectionThreadProps {
  interaction: JournalInteraction;
  onSendFollowUp: (followUpText: string) => Promise<void>;
  isSendingFollowUp: boolean;
}

export default function ReflectionThread({
  interaction,
  onSendFollowUp,
  isSendingFollowUp,
}: ReflectionThreadProps) {
  const [followUp, setFollowUp] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    try {
      return localStorage.getItem('reflection_read_mode') === 'true';
    } catch {
      return false;
    }
  });

  const toggleLock = () => {
    setIsLocked((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('reflection_read_mode', String(next));
      } catch {
        // Safe fallback
      }
      return next;
    });
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFollowUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || !followUp.trim() || isSendingFollowUp) return;
    const text = followUp.trim();
    setFollowUp('');
    await onSendFollowUp(text);
  };

  const formattedDate = new Date(interaction.createdAt).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            {interaction.title || 'Reflection Session'}
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {formattedDate}
            </span>
            <span>•</span>
            <span className="capitalize px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
              {interaction.mode}
            </span>
            {interaction.tags && interaction.tags.length > 0 && (
              <>
                <span>•</span>
                <div className="flex flex-wrap items-center gap-1">
                  {interaction.tags.map((t) => (
                    <span
                      key={t}
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200"
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              </>
            )}
            {interaction.modelUsed && (
              <>
                <span>•</span>
                <span className="text-indigo-600 font-mono text-[11px] font-medium">
                  {interaction.modelUsed}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Header Actions: Toggle Lock & Copy Response */}
        <div className="flex items-center gap-2">
          <button
            id="toggle-lock-input-btn"
            type="button"
            onClick={toggleLock}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border shadow-xs transition-colors cursor-pointer ${
              isLocked
                ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title={isLocked ? 'Unlock text input to write follow-ups' : 'Lock text input for distraction-free reading'}
            aria-pressed={isLocked}
          >
            {isLocked ? (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Locked (Reading Mode)</span>
              </>
            ) : (
              <>
                <Unlock className="w-3.5 h-3.5 text-slate-400" />
                <span>Lock Input</span>
              </>
            )}
          </button>

          <button
            id="copy-reflection-btn"
            onClick={() => handleCopy(interaction.response, 'main')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 text-xs border border-slate-200 shadow-xs transition-colors cursor-pointer"
            title="Copy Gemini reflection to clipboard"
          >
            {copiedId === 'main' ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy Response</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Primary Journal Input Box (User Prompt) */}
      <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600">
          <div className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
            <User className="w-3 h-3" />
          </div>
          <span>Your Journal Entry</span>
        </div>
        <div className="text-slate-800 text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-sans">
          {interaction.prompt}
        </div>
      </div>

      {/* Primary Gemini Reflection Box */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4 relative overflow-hidden">
        {/* Geometric subtle radial accent */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/5 rounded-full pointer-events-none blur-xl" />

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600">
            <div className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-3 h-3" />
            </div>
            <span>Gemini AI Reflection & Synthesis</span>
          </div>
        </div>

        <div className="prose prose-slate max-w-none text-slate-800 text-sm sm:text-base leading-relaxed space-y-3">
          <Markdown>{interaction.response}</Markdown>
        </div>
      </div>

      {/* Multi-Turn Conversation Thread (Follow-up turns) */}
      {interaction.messages && interaction.messages.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400 px-1">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
            <span>Continued Dialogue ({interaction.messages.length} messages)</span>
          </div>

          <div className="flex flex-col space-y-3">
            {interaction.messages.map((msg) => (
              <div
                key={msg.id}
                className={`max-w-[85%] p-4 rounded-2xl transition-all shadow-xs ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white self-end rounded-br-xs'
                    : 'bg-white text-slate-900 self-start rounded-bl-xs border border-slate-200'
                } space-y-1.5`}
              >
                <div className={`flex items-center justify-between text-xs pb-1 border-b ${
                  msg.role === 'user' ? 'border-indigo-500/60 text-indigo-100' : 'border-slate-100 text-slate-400'
                }`}>
                  <span className="font-semibold flex items-center gap-1.5">
                    {msg.role === 'user' ? (
                      <>
                        <User className="w-3 h-3 text-indigo-200" />
                        <span>You</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        <span className="text-indigo-600 font-bold">Gemini</span>
                      </>
                    )}
                  </span>
                  <span className={`text-[10px] ${msg.role === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {msg.role === 'user' ? (
                    msg.content
                  ) : (
                    <div className="prose prose-slate text-sm max-w-none">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactive Follow-Up Input Box / Clean Reading Mode */}
      {isLocked ? (
        <div id="reading-mode-banner" className="pt-2">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left transition-all shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-200/60 flex items-center justify-center shrink-0">
                <BookOpen className="w-4 h-4 text-amber-700" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-800">Reading Mode Active</p>
                <p className="text-[11px] text-slate-500">
                  Text input is locked for a clean, distraction-free reading experience of past reflections.
                </p>
              </div>
            </div>
            <button
              id="unlock-reading-mode-btn"
              type="button"
              onClick={toggleLock}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 shadow-xs transition-colors cursor-pointer shrink-0"
              title="Unlock text input to write follow-ups"
            >
              <Unlock className="w-3.5 h-3.5 text-slate-500" />
              <span>Unlock to Reply</span>
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleFollowUpSubmit} className="pt-2">
          <div className="bg-white border border-slate-200 rounded-xl p-3 sm:p-4 shadow-xs space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
              <CornerDownRight className="w-3.5 h-3.5 text-indigo-600" />
              <span>Continue the reflection with Gemini</span>
            </div>

            <div className="flex gap-2">
              <input
                id="follow-up-input"
                type="text"
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                placeholder="Ask a follow-up question or share another thought..."
                maxLength={2000}
                disabled={isSendingFollowUp}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:opacity-50 transition-colors"
              />
              <button
                id="send-follow-up-btn"
                type="submit"
                disabled={!followUp.trim() || isSendingFollowUp}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed shrink-0 cursor-pointer"
              >
                {isSendingFollowUp ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
