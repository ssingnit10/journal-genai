import { useState, useEffect } from 'react';
import { Sparkles, FileText, Lightbulb, MessageSquare, Send, Check, AlertCircle, Tag, Plus, X } from 'lucide-react';
import type { ReflectionMode, JournalInteraction } from '../types.ts';

interface JournalEditorProps {
  initialInteraction?: JournalInteraction | null;
  onGenerateReflection: (prompt: string, mode: ReflectionMode, title?: string, tags?: string[]) => Promise<void>;
  isGenerating: boolean;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  onRetrySave?: () => void;
}

const PRESET_TAGS = ['Work', 'Personal', 'Ideas', 'Goals', 'Health', 'Learning'];

const STARTER_PROMPTS = [
  '🌱 A key insight or breakthrough I had today...',
  '🧗 A challenging conversation or decision I need to untangle...',
  '🧭 Brainstorming creative angles for a new initiative...',
  '✨ Reflecting on what brought me energy vs. drained me this week...',
];

export default function JournalEditor({
  initialInteraction,
  onGenerateReflection,
  isGenerating,
  saveStatus,
  onRetrySave,
}: JournalEditorProps) {
  const [prompt, setPrompt] = useState('');
  const [title, setTitle] = useState('');
  const [mode, setMode] = useState<ReflectionMode>('reflect');
  const [tags, setTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [showCustomTagInput, setShowCustomTagInput] = useState(false);

  useEffect(() => {
    if (initialInteraction) {
      setPrompt(initialInteraction.prompt || '');
      setTitle(initialInteraction.title || '');
      setMode(initialInteraction.mode || 'reflect');
      setTags(Array.isArray(initialInteraction.tags) ? initialInteraction.tags : []);
    } else {
      setPrompt('');
      setTitle('');
      setMode('reflect');
      setTags([]);
    }
  }, [initialInteraction]);

  const toggleTag = (tag: string) => {
    if (tags.includes(tag)) {
      setTags(tags.filter((t) => t !== tag));
    } else if (tags.length < 10) {
      setTags([...tags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    const cleaned = customTagInput.trim().replace(/^#+/, '').slice(0, 30);
    if (!cleaned) return;
    if (tags.length >= 10) return;
    if (!tags.some((t) => t.toLowerCase() === cleaned.toLowerCase())) {
      setTags([...tags, cleaned]);
    }
    setCustomTagInput('');
    setShowCustomTagInput(false);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim() || isGenerating) return;
    await onGenerateReflection(prompt.trim(), mode, title.trim(), tags);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const wordCount = prompt.trim() ? prompt.trim().split(/\s+/).length : 0;
  const charCount = prompt.length;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6 shadow-xs space-y-4">
      {/* Mode Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            id="mode-reflect-btn"
            onClick={() => setMode('reflect')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              mode === 'reflect'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Reflect & Inquire
          </button>

          <button
            type="button"
            id="mode-summarize-btn"
            onClick={() => setMode('summarize')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              mode === 'summarize'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-sky-600" />
            Deep Summary
          </button>

          <button
            type="button"
            id="mode-brainstorm-btn"
            onClick={() => setMode('brainstorm')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              mode === 'brainstorm'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5 text-emerald-600" />
            Brainstorm
          </button>

          <button
            type="button"
            id="mode-chat-btn"
            onClick={() => setMode('chat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              mode === 'chat'
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
            Dialogue
          </button>
        </div>

        {/* Save Status Feedback */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1.5 text-indigo-600 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-ping" />
              Saving to Firestore...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-emerald-600 font-medium">
              <Check className="w-3.5 h-3.5" />
              Saved to Firestore
            </span>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-1.5 text-rose-600 font-medium">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Save error</span>
              {onRetrySave && (
                <button
                  onClick={onRetrySave}
                  className="underline hover:text-rose-700 text-xs ml-1 cursor-pointer"
                >
                  Retry
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Starter Chips */}
      {!initialInteraction && !prompt && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Prompt Starters
          </p>
          <div className="flex flex-wrap gap-2">
            {STARTER_PROMPTS.map((starter, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setPrompt(starter + ' ')}
                className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors text-left cursor-pointer"
              >
                {starter}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Optional Title */}
      <div>
        <input
          id="journal-title-input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Entry Title or Topic (optional)..."
          maxLength={150}
          className="w-full bg-slate-50/50 border border-slate-200 rounded-lg px-4 py-2 text-slate-900 placeholder-slate-400 text-sm focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
        />
      </div>

      {/* Main Journal Input Textarea */}
      <div className="relative">
        <textarea
          id="journal-prompt-textarea"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Write your journal entry, stream of consciousness, thoughts, or dilemma here..."
          rows={6}
          maxLength={4000}
          className="w-full bg-slate-50/50 border border-slate-200 rounded-xl p-4 text-slate-900 placeholder-slate-400 text-sm sm:text-base leading-relaxed focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-y transition-colors"
        />

        {/* Char / Word Counter & Submit Hint */}
        <div className="flex items-center justify-between pt-2 px-1 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span>{wordCount} words</span>
            <span>•</span>
            <span className={charCount > 3800 ? 'text-amber-600 font-medium' : ''}>
              {charCount} / 4,000 chars
            </span>
          </div>
          <span className="hidden sm:inline text-slate-400">
            Press <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[10px]">⌘</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[10px]">Enter</kbd> to reflect
          </span>
        </div>
      </div>

      {/* Tags & Categories Assignment */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <Tag className="w-3.5 h-3.5 text-indigo-600" />
            <span>Tags & Categories:</span>
          </div>
          <span className="text-[11px] text-slate-400">
            {tags.length} / 10 selected
          </span>
        </div>

        {/* Preset & Custom Tags Row */}
        <div className="flex flex-wrap items-center gap-1.5">
          {PRESET_TAGS.map((preset) => {
            const isSelected = tags.includes(preset);
            return (
              <button
                key={preset}
                type="button"
                id={`tag-preset-${preset.toLowerCase()}`}
                onClick={() => toggleTag(preset)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>#{preset}</span>
                {isSelected && <X className="w-3 h-3 text-indigo-200 hover:text-white" />}
              </button>
            );
          })}

          {/* Custom tags */}
          {tags
            .filter((t) => !PRESET_TAGS.includes(t))
            .map((customTag) => (
              <span
                key={customTag}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-600 text-white shadow-xs"
              >
                <span>#{customTag}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(customTag)}
                  className="hover:text-indigo-200 cursor-pointer"
                  title={`Remove #${customTag}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

          {/* Custom Tag Input Toggle */}
          {showCustomTagInput ? (
            <div className="flex items-center gap-1">
              <input
                id="custom-tag-input"
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTag();
                  } else if (e.key === 'Escape') {
                    setShowCustomTagInput(false);
                  }
                }}
                placeholder="Custom tag..."
                maxLength={30}
                className="bg-slate-50 border border-indigo-300 rounded-md px-2 py-0.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-28"
                autoFocus
              />
              <button
                type="button"
                id="confirm-add-tag-btn"
                onClick={handleAddCustomTag}
                className="px-2 py-0.5 rounded-md bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 cursor-pointer"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setShowCustomTagInput(false)}
                className="p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            tags.length < 10 && (
              <button
                type="button"
                id="open-custom-tag-btn"
                onClick={() => setShowCustomTagInput(true)}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 border border-dashed border-indigo-200 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Custom</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Action CTA */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          id="generate-reflection-btn"
          onClick={() => handleSubmit()}
          disabled={!prompt.trim() || isGenerating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isGenerating ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Gemini is Reflecting...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-indigo-200" />
              <span>Reflect with Gemini 3.6 Flash</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
