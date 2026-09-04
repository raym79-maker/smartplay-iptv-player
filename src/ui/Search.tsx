import { useAppStore } from '../store/useAppStore';

export function SearchBar() {
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const setView = useAppStore((s) => s.setView);
  const view = useAppStore((s) => s.view);

  return (
    <div className="search-bar">
      <input
        type="search"
        placeholder="Search channels…"
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          if (view === 'player') setView('browse');
        }}
        onFocus={() => {
          if (view === 'connect') return;
          if (view === 'player') setView('search');
          else if (view !== 'search' && view !== 'browse' && view !== 'favorites') {
            setView('search');
          }
        }}
        aria-label="Search channels"
      />
      {searchQuery && (
        <button
          type="button"
          className="btn ghost clear-search"
          onClick={() => setSearchQuery('')}
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
}
