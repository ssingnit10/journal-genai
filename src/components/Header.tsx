import { BookOpen, LogOut, Plus, Clock, HelpCircle } from 'lucide-react';
import type { UserAuthProfile, AppSection } from '../types.ts';

interface HeaderProps {
  user: UserAuthProfile;
  currentSection: AppSection;
  onSelectSection: (section: AppSection) => void;
  onSignOut: () => void;
  onNewEntry: () => void;
  onToggleHistory: () => void;
  showHistory: boolean;
  historyCount: number;
}

export default function Header({
  user,
  currentSection,
  onSelectSection,
  onSignOut,
  onNewEntry,
  onToggleHistory,
  showHistory,
  historyCount,
}: HeaderProps) {
  const userInitials = (user.displayName || user.email || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 text-slate-900 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo & Geometric Identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center relative">
            {/* Geometric 45-degree diamond symbol */}
            <div className="w-6 h-6 bg-indigo-600 rounded-[3px] transform rotate-45 flex items-center justify-center shadow-xs transition-transform hover:rotate-90 duration-300">
              <div className="w-2.5 h-2.5 bg-white rounded-[1px]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-slate-900 text-base sm:text-lg">
                Gemini Reflections
              </span>
              <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-medium rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Firestore Isolated
              </span>
            </div>
          </div>
        </div>

        {/* Section Navigation Switcher */}
        <nav className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
          <button
            type="button"
            id="nav-journal-tab"
            onClick={() => onSelectSection('journal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              currentSection === 'journal'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Journal</span>
          </button>
          <button
            type="button"
            id="nav-inquiries-tab"
            onClick={() => onSelectSection('inquiries')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              currentSection === 'inquiries'
                ? 'bg-white text-sky-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>General Inquiries</span>
          </button>
        </nav>

        {/* Action Controls & User Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {currentSection === 'journal' && (
            <>
              <button
                id="new-reflection-btn"
                onClick={onNewEntry}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors shadow-xs cursor-pointer"
                title="Start a new journal reflection"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New Reflection</span>
              </button>

              <button
                id="toggle-history-btn"
                onClick={onToggleHistory}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                  showHistory
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
                title="Toggle journal history"
              >
                <Clock className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">History</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  showHistory ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {historyCount}
                </span>
              </button>
            </>
          )}

          {/* User badge */}
          <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
            <div className="hidden md:block text-right">
              <span className="text-xs text-slate-500 block">
                Reflecting as <b className="text-slate-900 font-semibold">{user.displayName || 'User'}</b>
              </span>
              <span className="text-[11px] text-slate-400 block truncate max-w-[130px]">
                {user.email}
              </span>
            </div>

            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User Avatar'}
                referrerPolicy="no-referrer"
                className="w-8 h-8 rounded-full border border-slate-200 object-cover shadow-xs"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 border border-slate-300 flex items-center justify-center text-xs font-bold shadow-xs">
                {userInitials}
              </div>
            )}

            <button
              id="sign-out-btn"
              onClick={onSignOut}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors ml-0.5 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

