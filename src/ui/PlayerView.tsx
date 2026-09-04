import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { playerManager } from '../player/PlayerManager';

export function PlayerView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const channels = useAppStore((s) => s.channels);
  const selectedChannelId = useAppStore((s) => s.selectedChannelId);
  const playbackQueueIds = useAppStore((s) => s.playbackQueueIds);
  const selectChannel = useAppStore((s) => s.selectChannel);
  const setView = useAppStore((s) => s.setView);
  const setPlayerStatus = useAppStore((s) => s.setPlayerStatus);
  const playerStatus = useAppStore((s) => s.playerStatus);
  const favoriteIds = useAppStore((s) => s.favoriteIds);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const view = useAppStore((s) => s.view);

  const channelById = useMemo(
    () => new Map(channels.map((channel) => [channel.id, channel])),
    [channels]
  );

  const current = selectedChannelId
    ? channelById.get(selectedChannelId) || null
    : null;

  const playbackQueue = useMemo(() => {
    const queue = playbackQueueIds
      .map((id) => channelById.get(id))
      .filter((channel): channel is NonNullable<typeof channel> => !!channel);
    return queue.length > 0 ? queue : channels;
  }, [playbackQueueIds, channelById, channels]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    playerManager.attach(video);
    playerManager.setCallbacks({
      onChannelChange: (ch) => {
        if (ch && ch.id !== useAppStore.getState().selectedChannelId) {
          selectChannel(ch.id);
        }
      },
      onStatus: setPlayerStatus,
    });

    return () => {
      playerManager.detach();
    };
  }, [selectChannel, setPlayerStatus]);

  useEffect(() => {
    if (view !== 'player' || !current) return;

    playerManager.setPlaylist(playbackQueue, current.id);
    void playerManager.playChannel(current).catch(() => {
      /* status already set */
    });
  }, [current, playbackQueue, view]);

  const goBack = useCallback(() => {
    playerManager.pause();
    setView('browse');
  }, [setView]);

  const selectRelative = useCallback(
    (direction: 1 | -1) => {
      if (playbackQueue.length === 0) return;
      const currentIndex = selectedChannelId
        ? playbackQueue.findIndex((channel) => channel.id === selectedChannelId)
        : -1;
      const baseIndex = currentIndex >= 0 ? currentIndex : 0;
      const nextIndex =
        (baseIndex + direction + playbackQueue.length) % playbackQueue.length;
      const nextChannel = playbackQueue[nextIndex];
      if (nextChannel && nextChannel.id !== selectedChannelId) {
        selectChannel(nextChannel.id);
      }
    },
    [playbackQueue, selectedChannelId, selectChannel]
  );

  const zapNext = useCallback(() => {
    selectRelative(1);
  }, [selectRelative]);

  const zapPrev = useCallback(() => {
    selectRelative(-1);
  }, [selectRelative]);

  useEffect(() => {
    if (view !== 'player') return;

    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      switch (e.key) {
        case 'ArrowRight':
        case 'ChannelDown':
        case 'ArrowDown':
          e.preventDefault();
          zapNext();
          break;
        case 'ArrowLeft':
        case 'ChannelUp':
        case 'ArrowUp':
          e.preventDefault();
          zapPrev();
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
        <button type="button" className="btn" onClick={zapPrev}>
          ⟵ Prev
        </button>
        <button type="button" className="btn" onClick={zapNext}>
          Next ⟶
        </button>
        <span className="hint muted">
          Arrows zap · Enter play/pause · Esc back · F favorite
        </span>
      </div>
    </div>
  );
}
