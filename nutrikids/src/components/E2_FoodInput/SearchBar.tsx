import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { searchFood } from '../../services/api';

interface Suggestion { id: string; name: string; brand: string; }

interface Props {
  onSelect: (name: string) => void;
}

const HISTORY_KEY = 'nutrikids-search-history';

function getHistory(): string[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
  catch { return []; }
}
function saveHistory(q: string) {
  const h = [q, ...getHistory().filter(x => x !== q)].slice(0, 10);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
}

export default function SearchBar({ onSelect }: Props) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [history, setHistory] = useState<string[]>(getHistory);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setSuggestions([]); return; }
    setLoading(true);
    const res = await searchFood(q);
    setSuggestions(res);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => doSearch(query), 300);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [query, doSearch]);

  const handleSelect = (name: string) => {
    setQuery(name);
    saveHistory(name);
    setHistory(getHistory());
    setOpen(false);
    onSelect(name);
  };

  const clearHistory = () => {
    localStorage.removeItem(HISTORY_KEY);
    setHistory([]);
  };

  return (
    <div className="relative flex-1 max-w-lg">
      <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm focus-within:border-green-400 focus-within:ring-2 focus-within:ring-green-100 transition-all">
        <span className="text-gray-400 text-lg">🔍</span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={t('search.placeholder')}
          className="flex-1 outline-none text-sm text-gray-800 placeholder-gray-400 bg-transparent"
        />
        {loading && <span className="text-xs text-gray-400 animate-pulse">...</span>}
        {query && (
          <button onClick={() => { setQuery(''); setSuggestions([]); inputRef.current?.focus(); }} className="text-gray-400 hover:text-gray-600">✕</button>
        )}
      </div>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-50 overflow-hidden animate-fade-in-up">
          {suggestions.length > 0 && (
            <ul>
              {suggestions.map(s => (
                <li key={s.id}>
                  <button
                    onMouseDown={() => handleSelect(s.name)}
                    className="w-full text-left px-4 py-2.5 hover:bg-green-50 transition-colors text-sm"
                  >
                    <div className="font-medium text-gray-800">{s.name}</div>
                    <div className="text-xs text-gray-400">{s.brand}</div>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {!query && history.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-50">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('search.history')}</span>
                <button onClick={clearHistory} className="text-xs text-gray-400 hover:text-red-400 transition-colors">{t('search.clearAll')}</button>
              </div>
              {history.map(h => (
                <button
                  key={h}
                  onMouseDown={() => handleSelect(h)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-2"
                >
                  <span className="text-gray-300">🕐</span>{h}
                </button>
              ))}
            </div>
          )}

          {query && suggestions.length === 0 && !loading && (
            <div className="px-4 py-4 text-center text-sm text-gray-400">
              {t('search.noResults')}
              <button className="block mx-auto mt-2 text-green-500 hover:underline text-xs">{t('search.reportMissing')}</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
