import { useAppStore } from '../store/useAppStore';
import type { Channel } from '../core/types';

function ChannelCard({
  channel,
  isFavorite,
  isSelected,
  onSelect,
  onToggleFav,
}: {
  channel: Channel;
  isFavorite: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onToggleFav: () => void;
}) {
  return (
    <div
      className={isSelected ? 'channel-card selected' : 'channel-card'}
      tabIndex={0}
      role="button"
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="channel-logo">
        {channel.logo ? (
          <img
            src={channel.logo}
            alt=""
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <span className="logo-fallback">{channel.name.slice(0, 2)}</span>
        )}
      </div>
      <div className="channel-meta">
        <div className="channel-name">{channel.name}</div>
        {channel.groupTitle && (
          <div className="channel-group">{channel.groupTitle}</div>
        )}
      </div>
      <button
        type="button"
        className={isFavorite ? 'fav-btn on' : 'fav-btn'}
        aria-label={isFavorite ? 'Remove favorite' : 'Add favorite'}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFav();
        }}
      >
        {isFavorite ? '★' : '☆'}
      </button>
    </div>
  );
}

export function ChannelList({ title }: { title?: string }) {
  const filteredChannels = useAppStore((s) => s.filteredChannels);
  const favoriteIds = useAppStore((s) => s.favoriteIds);
  const selectedChannelId = useAppStore((s) => s.selectedChannelId);
  const selectChannel = useAppStore((s) => s.selectChannel);
  const toggleFavorite = useAppStore((s) => s.toggleFavorite);
  const setView = useAppStore((s) => s.setView);
  const channels = filteredChannels();

  function openPlayer(ch: Channel) {
    selectChannel(ch.id);
    setView('player');
  }

  return (
    <section className="channel-list" aria-label="Channels">
      <header className="list-header">
        <h2>{title || 'Channels'}</h2>
        <span className="muted">{channels.length} channels</span>
      </header>
      {channels.length === 0 ? (
        <div className="empty-state">No channels match this filter.</div>
      ) : (
        <div className="channel-grid">
          {channels.map((ch) => (
            <ChannelCard
              key={ch.id}
              channel={ch}
              isFavorite={favoriteIds.includes(ch.id)}
              isSelected={selectedChannelId === ch.id}
              onSelect={() => openPlayer(ch)}
              onToggleFav={() => toggleFavorite(ch.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
