import { useState, useEffect } from 'react';
import type { User } from 'firebase/auth';
import {
  HelpCircle,
  Sparkles,
  Send,
  Search,
  Trash2,
  Clock,
  ChevronRight,
  Plus,
  Compass,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';
import Markdown from 'react-markdown';
import type { GeneralInquiry } from '../types.ts';
import { requestGeneralInquiry } from '../services/geminiService.ts';
import {
  saveGeneralInquiry,
  deleteGeneralInquiry,
  subscribeToGeneralInquiries,
} from '../services/firestoreService.ts';

interface InquiryViewProps {
  user: User;
}

const CATEGORY_PRESETS = [
  'General Knowledge',
  'Coding & Tech',
  'Science & Math',
  'Writing & Grammar',
  'Business & Career',
  'History & Culture',
];

const SAMPLE_QUESTIONS = [
  'Explain the difference between optimistic concurrency control and pessimistic locking.',
  'How does quantum computing differ from classical computing in simple terms?',
  'What are the key trade-offs between SQL and NoSQL database architectures?',
  'Why do leaves change color in the autumn from a biochemical perspective?',
];

export default function InquiryView({ user }: InquiryViewProps) {
  const [inquiries, setInquiries] = useState<GeneralInquiry[]>([]);
  const [activeInquiry, setActiveInquiry] = useState<GeneralInquiry | null>(null);
  const [question, setQuestion] = useState('');
  const [category, setCategory] = useState('General Knowledge');
  const [isAsking, setIsAsking] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Subscribe to real-time general inquiries for this user
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToGeneralInquiries(
      user.uid,
      (items) => {
        setInquiries(items);
      },
      (err) => {
        console.error('Failed to load general inquiries:', err);
        setErrorBanner('Failed to load past inquiries from Firestore.');
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleAsk = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanQ = question.trim();
    if (!cleanQ || isAsking) return;

    setErrorBanner(null);
    setIsAsking(true);

    const inquiryId = crypto.randomUUID();
    const nowIso = new Date().toISOString();

    try {
      // 1. Call Gemini general inquiry endpoint
      const result = await requestGeneralInquiry(user, cleanQ, category);

      // 2. Persist to Firestore under /users/{userId}/general-inquiries/{inquiryId}
      const newInquiry: GeneralInquiry = {
        id: inquiryId,
        userId: user.uid,
        question: cleanQ,
        response: result.response,
        category: category.trim() || 'General',
        createdAt: nowIso,
        updatedAt: nowIso,
        modelUsed: result.model,
      };

      await saveGeneralInquiry(user.uid, newInquiry);
      setActiveInquiry(newInquiry);
      setQuestion('');
    } catch (err) {
      console.error('Error asking Gemini:', err);
      setErrorBanner(
        err instanceof Error
          ? err.message
          : 'Failed to complete general inquiry. Please try again.'
      );
    } finally {
      setIsAsking(false);
    }
  };

  const handleDelete = async (inquiryId: string) => {
    if (!confirm('Are you sure you want to delete this inquiry record?')) return;
    setDeletingId(inquiryId);
    try {
      await deleteGeneralInquiry(user.uid, inquiryId);
      if (activeInquiry?.id === inquiryId) {
        setActiveInquiry(null);
      }
    } catch (err) {
      console.error('Failed to delete inquiry:', err);
      setErrorBanner('Could not delete inquiry from Firestore.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopyAnswer = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard errors in sandbox
    }
  };

  const filteredInquiries = inquiries.filter((item) => {
    const matchesSearch =
      !searchQuery.trim() ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.response.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' ||
      item.category?.toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-sky-50 text-sky-700 border border-sky-200">
              <HelpCircle className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              General Inquiries & Knowledge Base
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1 max-w-3xl">
            Ask Gemini direct, general knowledge questions unrelated to your personal journal.
            All inquiries and answers are securely logged in your private Firestore collection.
          </p>
        </div>

        <button
          type="button"
          id="new-inquiry-btn"
          onClick={() => {
            setActiveInquiry(null);
            setQuestion('');
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Ask New Question</span>
        </button>
      </div>

      {/* Error Banner */}
      {errorBanner && (
        <div
          id="inquiry-error-banner"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start justify-between gap-3 text-sm animate-fade-in"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorBanner(null)}
            className="text-xs font-semibold text-rose-700 hover:text-rose-900 underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Two-Column Grid: Ask & View vs History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Ask Form & Answer Display */}
        <div className="lg:col-span-8 space-y-6">
          {/* Question Input Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <label
                htmlFor="general-question-input"
                className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5"
              >
                <Compass className="w-4 h-4 text-sky-600" />
                <span>Your Direct Question</span>
              </label>
              <span className="text-[11px] text-slate-400">
                {question.length} / 4,000 chars
              </span>
            </div>

            <textarea
              id="general-question-input"
              rows={4}
              maxLength={4000}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault();
                  handleAsk();
                }
              }}
              placeholder="Ask anything: concepts, coding issues, science, world history, synthesis..."
              className="w-full bg-slate-50/60 border border-slate-200 rounded-xl p-4 text-slate-900 placeholder-slate-400 text-sm sm:text-base leading-relaxed focus:bg-white focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
            />

            {/* Category Selection */}
            <div className="space-y-1.5 pt-1">
              <span className="text-xs font-medium text-slate-600">Category / Domain:</span>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_PRESETS.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    id={`inquiry-cat-${cat.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                    onClick={() => setCategory(cat)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      category === cat
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Sample Prompts */}
            {!question && (
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <span className="text-[11px] font-medium text-slate-400">Need inspiration?</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {SAMPLE_QUESTIONS.map((q, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setQuestion(q)}
                      className="text-left p-2 rounded-lg bg-slate-50 hover:bg-sky-50/50 hover:text-sky-900 border border-slate-100 text-slate-600 text-xs line-clamp-1 transition-colors cursor-pointer"
                    >
                      💡 {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action CTA */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Press <kbd className="px-1 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">⌘</kbd> + <kbd className="px-1 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px]">Enter</kbd> to ask
              </span>
              <button
                type="button"
                id="submit-general-inquiry-btn"
                onClick={() => handleAsk()}
                disabled={!question.trim() || isAsking}
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-medium text-sm transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isAsking ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Gemini is Answering...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-sky-200" />
                    <span>Ask Gemini</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Active Inquiry Detailed View */}
          {activeInquiry && (
            <div
              id="active-inquiry-details"
              className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4"
            >
              {/* Card Meta Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
                    {activeInquiry.category || 'General'}
                  </span>
                  <span className="text-xs text-slate-400">
                    {new Date(activeInquiry.createdAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="copy-answer-btn"
                    onClick={() => handleCopyAnswer(activeInquiry.response)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                    title="Copy Answer to Clipboard"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(activeInquiry.id)}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete this record from Firestore"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                  Question:
                </span>
                <p className="text-sm font-medium text-slate-900 leading-relaxed">
                  {activeInquiry.question}
                </p>
              </div>

              {/* Response Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                    <Sparkles className="w-4 h-4 text-sky-600" />
                    <span>Gemini Response</span>
                  </div>
                  {activeInquiry.modelUsed && (
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono text-[10px] border border-slate-200">
                      {activeInquiry.modelUsed}
                    </span>
                  )}
                </div>

                <div className="prose prose-slate max-w-none text-slate-800 text-sm sm:text-base leading-relaxed p-4 rounded-xl bg-sky-50/30 border border-sky-100">
                  <div className="markdown-body">
                    <Markdown>{activeInquiry.response}</Markdown>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Past Inquiries Log */}
        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-600" />
              <h3 className="font-semibold text-sm text-slate-900">Inquiry History</h3>
            </div>
            <span className="text-xs bg-slate-100 px-2 py-0.5 rounded-full text-slate-700 font-medium">
              {inquiries.length} logged
            </span>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="search-inquiries-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter inquiries..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
            />
          </div>

          {/* Inquiries list */}
          <div className="space-y-1.5 max-h-[500px] overflow-y-auto divide-y divide-slate-100">
            {filteredInquiries.length === 0 ? (
              <div className="p-6 text-center text-slate-400 space-y-1">
                <HelpCircle className="w-6 h-6 mx-auto text-slate-300" />
                <p className="text-xs text-slate-600 font-medium">No inquiries logged yet</p>
                <p className="text-[11px]">
                  {searchQuery ? 'No matches found' : 'Ask a question above to record answers here.'}
                </p>
              </div>
            ) : (
              filteredInquiries.map((item) => {
                const isSelected = activeInquiry?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveInquiry(item)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors group flex items-start justify-between gap-2 ${
                      isSelected
                        ? 'bg-sky-50 text-slate-900 border border-sky-200'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {item.category || 'General'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(item.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-slate-800 line-clamp-2 leading-relaxed">
                        {item.question}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(item.id);
                        }}
                        disabled={deletingId === item.id}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                        title="Delete inquiry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
