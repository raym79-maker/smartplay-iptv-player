import { useState, type FormEvent } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { M3uAccount, XtreamAccount } from '../core/types';

export function ConnectScreen() {
  const connectionMode = useAppStore((s) => s.connectionMode);
  const setConnectionMode = useAppStore((s) => s.setConnectionMode);
  const connect = useAppStore((s) => s.connect);
  const loading = useAppStore((s) => s.loading);
  const error = useAppStore((s) => s.error);
  const account = useAppStore((s) => s.account);

  const [server, setServer] = useState(
    account?.type === 'xtream' ? account.server : ''
  );
  const [username, setUsername] = useState(
    account?.type === 'xtream' ? account.username : ''
  );
  const [password, setPassword] = useState(
    account?.type === 'xtream' ? account.password : ''
  );
  const [m3uUrl, setM3uUrl] = useState(
    account?.type === 'm3u' ? account.url || '' : ''
  );
  const [m3uText, setM3uText] = useState(
    account?.type === 'm3u' ? account.content || '' : ''
  );
  const [localError, setLocalError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);
    try {
      if (connectionMode === 'xtream') {
        if (!server.trim() || !username.trim() || !password.trim()) {
          setLocalError('Server, username and password are required');
          return;
        }
        const acc: XtreamAccount = {
          type: 'xtream',
          server: server.trim(),
          username: username.trim(),
          password: password.trim(),
        };
        await connect(acc);
      } else {
        if (!m3uUrl.trim() && !m3uText.trim()) {
          setLocalError('Paste an M3U URL or playlist text');
          return;
        }
        const acc: M3uAccount = {
          type: 'm3u',
          url: m3uUrl.trim() || undefined,
          content: m3uText.trim() || undefined,
        };
        await connect(acc);
      }
    } catch {
      /* error already in store */
    }
  }

  function onFileChange(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      setM3uText(text);
    };
    reader.readAsText(file);
  }

  return (
    <div className="connect-screen">
      <div className="connect-card" role="form">
        <div className="brand">
          <div className="brand-mark" aria-hidden>
            ▶
          </div>
          <div>
            <h1>Smartplay IPTV Player</h1>
            <p className="muted">v0.2 — Live TV · Xtream &amp; M3U</p>
          </div>
        </div>

        <div className="tabs" role="tablist">
          <button
            type="button"
            role="tab"
            className={connectionMode === 'xtream' ? 'tab active' : 'tab'}
            aria-selected={connectionMode === 'xtream'}
            onClick={() => setConnectionMode('xtream')}
          >
            Xtream Codes
          </button>
          <button
            type="button"
            role="tab"
            className={connectionMode === 'm3u' ? 'tab active' : 'tab'}
            aria-selected={connectionMode === 'm3u'}
            onClick={() => setConnectionMode('m3u')}
          >
            M3U Playlist
          </button>
        </div>

        <form onSubmit={onSubmit} className="connect-form">
          {connectionMode === 'xtream' ? (
            <>
              <label>
                <span>Server URL</span>
                <input
                  type="url"
                  placeholder="http://example.com:8080"
                  value={server}
                  onChange={(e) => setServer(e.target.value)}
                  autoComplete="url"
                  autoFocus
                />
              </label>
              <label>
                <span>Username</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />
              </label>
              <label>
                <span>Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </label>
            </>
          ) : (
            <>
              <label>
                <span>M3U URL (optional)</span>
                <input
                  type="url"
                  placeholder="https://example.com/playlist.m3u"
                  value={m3uUrl}
                  onChange={(e) => setM3uUrl(e.target.value)}
                />
              </label>
              <label>
                <span>Or paste playlist / upload file</span>
                <textarea
                  rows={8}
                  placeholder="#EXTM3U&#10;#EXTINF:-1 tvg-logo=&quot;…&quot; group-title=&quot;News&quot;,Channel Name&#10;http://…"
                  value={m3uText}
                  onChange={(e) => setM3uText(e.target.value)}
                />
              </label>
              <label className="file-label">
                <span>Load .m3u file</span>
                <input
                  type="file"
                  accept=".m3u,.m3u8,audio/x-mpegurl,application/vnd.apple.mpegurl,text/plain"
                  onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
                />
              </label>
            </>
          )}

          {(localError || error) && (
            <div className="error-banner" role="alert">
              {localError || error}
            </div>
          )}

          <button type="submit" className="btn primary" disabled={loading}>
            {loading ? 'Connecting…' : 'Connect'}
          </button>

          <p className="legal-note">
            Use only playlists you are authorized to access. Smartplay does not
            bundle or sell IPTV content.
          </p>
        </form>
      </div>
    </div>
  );
}
