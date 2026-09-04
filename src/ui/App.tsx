import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { ConnectScreen } from './ConnectScreen';
import { Categories } from './Categories';
import { ChannelList } from './ChannelList';
import { FavoritesView } from './Favorites';
import { PlayerView } from './PlayerView';
import { SearchBar } from './Search';

export function App() {
  const hydrate = useAppStore((s) => s.hydrate);
  const hydrated = useAppStore((s) => s.hydrated);
  const view = useAppStore((s) => s.view);
  const loading = useAppStore((s) => s.loading);
  const account = useAppStore((s) => s.account);
  const disconnect = useAppStore((s) => s.disconnect);
  const setView = useAppStore((s) => s.setView);
  const channels = useAppStore((s) => s.channels);
  const categories = useAppStore((s) => s.categories);
  const searchQuery = useAppStore((s) => s.searchQuery);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!hydrated) {
    return (
      <div className="boot-screen">
        <div className="spinner" />
        <p>Loading Smartplay…</p>
      </div>
    );
  }

  if (view === 'connect' || !account) {
    return <ConnectScreen />;
  }

  if (view === 'player') {
    return <PlayerView />;
  }

  const listTitle =
    view === 'favorites'
      ? 'Favorites'
      : searchQuery
        ? `Search: “${searchQuery}”`
        : undefined;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <span className="brand-mark sm">▶</span>
          <strong>Smartplay</strong>
          <span className="muted ver">v0.2</span>
        </div>
        <SearchBar />
        <div className="topbar-actions">
          <span className="muted stats">
            {categories.length} cats · {channels.length} ch
          </span>
          {loading && <span className="loading-pill">Loading…</span>}
          <button
            type="button"
            className="btn ghost"
            onClick={() => setView('favorites')}
          >
            ★ Fav
          </button>
          <button
            type="button"
            className="btn ghost danger"
            onClick={() => void disconnect()}
          >
            Disconnect
          </button>
        </div>
      </header>

      <div className="main-layout">
        <aside className="sidebar">
          <Categories />
        </aside>
        <main className="content">
          {view === 'favorites' ? (
            <FavoritesView />
          ) : (
            <ChannelList title={listTitle} />
          )}
        </main>
      </div>
    </div>
  );
}
