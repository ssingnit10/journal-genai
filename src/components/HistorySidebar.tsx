import { useState, useMemo } from 'react';
import { Search, Clock, Trash2, X, ChevronRight, Sparkles, FileText, Lightbulb, MessageSquare, Tag } from 'lucide-react';
import type { JournalInteraction, ReflectionMode } from '../types.ts';

interface HistorySidebarProps {
  interactions: JournalInteraction[];
  activeId: string | null;
  onSelectInteraction: (interaction: JournalInteraction) => void;
  onDeleteInteraction: (interactionId: string) => Promise<void>;
  onClose: () => void;
}

export default function HistorySidebar({
  interactions,
  activeId,
  onSelectInteraction,
  onDeleteInteraction,
  onClose,
}: HistorySidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<string>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Extract all unique tags across entries
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    interactions.forEach((item) => {
      if (Array.isArray(item.tags)) {
        item.tags.forEach((t) => set.add(t));
      }
    });
    return Array.from(set);
  }, [interactions]);

  const filteredInteractions = interactions.filter((item) => {
    const matchesQuery =
      !searchQuery.trim() ||
      item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.prompt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.response?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (Array.isArray(item.tags) && item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesMode = filterMode === 'all' || item.mode === filterMode;
    const matchesTag = filterTag === 'all' || (Array.isArray(item.tags) && item.tags.includes(filterTag));

    return matchesQuery && matchesMode && matchesTag;
  });

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this journal reflection? This action cannot be undone.')) {
      setDeletingId(id);
      try {
        await onDeleteInteraction(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const getModeIcon = (mode: ReflectionMode) => {
    switch (mode) {
      case 'summarize':
        return <FileText className="w-3.5 h-3.5 text-sky-500" />;
      case 'brainstorm':
        return <Lightbulb className="w-3.5 h-3.5 text-emerald-500" />;
      case 'chat':
        return <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />;
      case 'reflect':
      default:
        return <Sparkles className="w-3.5 h-3.5 text-indigo-600" />;
    }
  };

  return (
    <aside className="w-full sm:w-80 lg:w-96 bg-white border-l border-slate-200 flex flex-col h-[calc(100vh-4rem)] sticky top-16 z-20 text-slate-900 shadow-sm">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          <h3 className="font-semibold text-sm text-slate-900">Recent History</h3>
          <span className="text-xs bg-white px-2 py-0.5 rounded-full text-slate-600 border border-slate-200 font-medium">
            {interactions.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          title="Close History Sidebar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search & Mode Filters */}
      <div className="p-3 border-b border-slate-200 space-y-2 bg-white">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search past reflections..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
          {['all', 'reflect', 'summarize', 'brainstorm', 'chat'].map((m) => (
            <button
              key={m}
              onClick={() => setFilterMode(m)}
              className={`px-2.5 py-1 rounded-md capitalize whitespace-nowrap transition-colors cursor-pointer ${
                filterMode === m
                  ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        {/* Tag Filter Pills */}
        {availableTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 text-[10px] border-t border-slate-100">
            <span className="text-slate-400 font-medium shrink-0 flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-400" />
              <span>Tags:</span>
            </span>
            <button
              onClick={() => setFilterTag('all')}
              className={`px-2 py-0.5 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                filterTag === 'all'
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            {availableTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setFilterTag(filterTag === tag ? 'all' : tag)}
                className={`px-2 py-0.5 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                  filterTag === tag
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {filteredInteractions.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <Clock className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-700 font-medium">No reflections found</p>
            <p className="text-[11px] text-slate-400">
              {searchQuery || filterTag !== 'all' ? 'Try clearing filters or search keywords' : 'Create your first reflection to see it saved here.'}
            </p>
          </div>
        ) : (
          filteredInteractions.map((item) => {
            const isSelected = item.id === activeId;
            const dateStr = new Date(item.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            });

            return (
              <div
                key={item.id}
                onClick={() => onSelectInteraction(item)}
                className={`p-3.5 cursor-pointer transition-colors group flex items-start justify-between gap-2 border-l-3 ${
                  isSelected
                    ? 'bg-indigo-50/80 border-indigo-600 text-slate-900'
                    : 'border-transparent hover:bg-slate-50'
                }`}
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-1.5">
                    {getModeIcon(item.mode)}
                    <span className="text-xs font-semibold text-slate-900 truncate">
                      {item.title || item.prompt.slice(0, 40) || 'Untitled Reflection'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                    {item.prompt}
                  </p>

                  {/* Tag Badges */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      {item.tags.map((tag) => (
                        <span
                          key={tag}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFilterTag(filterTag === tag ? 'all' : tag);
                          }}
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium transition-colors cursor-pointer ${
                            filterTag === tag
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
                          }`}
                          title={`Filter by #${tag}`}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                    <span>{dateStr}</span>
                    {item.messages && item.messages.length > 0 && (
                      <>
                        <span>•</span>
                        <span>{item.messages.length + 1} turns</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={(e) => handleDelete(e, item.id)}
                    disabled={deletingId === item.id}
                    className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                    title="Delete reflection"
                  >
                    {deletingId === item.id ? (
                      <span className="w-3 h-3 border border-rose-500 border-t-transparent rounded-full animate-spin inline-block" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/70 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Cloud Sync Active</span>
        </div>
        <span className="text-[10px] text-slate-400">Secure Firestore ABAC</span>
      </div>
    </aside>
  );
}

