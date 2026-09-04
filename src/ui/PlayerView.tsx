import { useEffect, useRef, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { playerManager } from '../player/PlayerManager';

export function PlayerView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const channels = useAppStore((s) => s.channels);
  const selectedChannelId = useAppStore((s) => s.selectedChannelId);
  const selectChannel = useAppStore((s) => s.selectChannel);
  const setView = useAppStore((s) => s.setView);
  const setPlayerStatus = useAppStore((s) => s.setPlayerStatus);
  const playerStatus = useAppStore((s) => s.playerStatus);
  const favoriteIds = useAppStore((s) => s.favoriteIds);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const filteredChannels = useAppStore((s) => s.filteredChannels);
  const view = useAppStore((s) => s.view);

  const current =
    channels.find((c) => c.id === selectedChannelId) || null;

  const zapList = useCallback(() => {
    const filtered = filteredChannels();
    // Prefer current category/filter list for zapping; fall back to all
    if (filtered.length > 0 && selectedChannelId) {
      if (filtered.some((c) => c.id === selectedChannelId)) return filtered;
    }
    return channels;
  }, [filteredChannels, channels, selectedChannelId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    playerManager.attach(video);
    playerManager.setCallbacks({
      onChannelChange: (ch) => {
        if (ch) selectChannel(ch.id);
      },
      onStatus: setPlayerStatus,
    });

    return () => {
      playerManager.detach();
    };
  }, [selectChannel, setPlayerStatus]);

  useEffect(() => {
    if (view !== 'player' || !selectedChannelId) return;
    const list = zapList();
    const ch = list.find((c) => c.id === selectedChannelId) ||
      channels.find((c) => c.id === selectedChannelId);
    if (!ch) return;
    playerManager.setPlaylist(list, ch.id);
    void playerManager.playChannel(ch).catch(() => {
      /* status already set */
    });
  }, [selectedChannelId, view]); // eslint-disable-line react-hooks/exhaustive-deps

  const goBack = useCallback(() => {
    playerManager.pause();
    setView('browse');
  }, [setView]);

  const zapNext = useCallback(async () => {
    const list = zapList();
    playerManager.setPlaylist(list, selectedChannelId || undefined);
    const ch = await playerManager.next();
    if (ch) selectChannel(ch.id);
  }, [zapList, selectedChannelId, selectChannel]);

  const zapPrev = useCallback(async () => {
    const list = zapList();
    playerManager.setPlaylist(list, selectedChannelId || undefined);
    const ch = await playerManager.prev();
    if (ch) selectChannel(ch.id);
  }, [zapList, selectedChannelId, selectChannel]);

  useEffect(() => {
    if (view !== 'player') return;

    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      switch (e.key) {
        case 'ArrowRight':
        case 'ChannelDown':
          e.preventDefault();
          void zapNext();
          break;
        case 'ArrowLeft':
        case 'ChannelUp':
          e.preventDefault();
          void zapPrev();
          break;
        case 'ArrowUp':
          e.preventDefault();
          void zapPrev();
          break;
        case 'ArrowDown':
          e.preventDefault();
          void zapNext();
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          {
            const v = videoRef.current;
            if (v) {
              if (v.paused) void v.play();
              else v.pause();
            }
          }
          break;
        case 'Escape':
        case 'Backspace':
          e.preventDefault();
          goBack();
          break;
        case 'f':
        case 'F':
          if (current) toggleFavorite(current.id);
          break;
        default:
          break;
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [view, zapNext, zapPrev, goBack, current, toggleFavorite]);

  const isFav = current ? favoriteIds.includes(current.id) : false;

  return (
    <div className="player-view">
      <div className="player-stage">
        <video
          ref={videoRef}
          className="player-video"
          controls
          playsInline
          autoPlay
        />
        <div className="player-overlay-top">
          <button type="button" className="btn ghost" onClick={goBack}>
            ← Back
          </button>
          <div className="now-playing">
            {current?.logo && (
              <img src={current.logo} alt="" className="np-logo" />
            )}
            <div>
              <div className="np-name">{current?.name || 'No channel'}</div>
              <div className="np-status muted">{playerStatus}</div>
            </div>
          </div>
          <button
            type="button"
            className={isFav ? 'btn ghost fav on' : 'btn ghost fav'}
            onClick={() => current && toggleFavorite(current.id)}
            disabled={!current}
            aria-label="Toggle favorite"
          >
            {isFav ? '★' : '☆'}
          </button>
        </div>
      </div>

      <div className="player-controls">
        <button type="button" className="btn" onClick={() => void zapPrev()}>
          ⟵ Prev
        </button>
        <button type="button" className="btn" onClick={() => void zapNext()}>
          Next ⟶
        </button>
        <span className="hint muted">
          Arrows zap · Enter play/pause · Esc back · F favorite
        </span>
      </div>
    </div>
  );
}
