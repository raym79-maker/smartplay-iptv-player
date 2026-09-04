export type PlayerEvent =
  | 'playing'
  | 'paused'
  | 'ended'
  | 'error'
  | 'waiting'
  | 'canplay';

export type PlayerListener = (payload?: unknown) => void;

/**
 * Platform-neutral playback contract.
 *
 * Web currently uses Html5HlsPlayer. Android can later provide a native
 * Media3/ExoPlayer-backed adapter without changing PlayerManager or the UI.
 */
export interface PlayerAdapter {
  on(event: PlayerEvent, fn: PlayerListener): () => void;
  load(url: string): Promise<void>;
  play(): Promise<void>;
  pause(): void;
  stop(): void;
  destroy(): void;
  getUrl(): string | null;
}
