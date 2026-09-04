import type { Channel } from '../core/types';
import { Html5HlsPlayer } from './Html5HlsPlayer';

/**
 * High-level player orchestration: attach video, play channel,
 * try alternate URL on failure, zap next/prev within a list.
 */
export class PlayerManager {
  private player: Html5HlsPlayer | null = null;
  private playlist: Channel[] = [];
  private index = -1;
  private onChannelChange?: (ch: Channel | null, index: number) => void;
  private onStatus?: (status: string) => void;

  attach(video: HTMLVideoElement): void {
    this.detach();
    this.player = new Html5HlsPlayer(video);
    this.player.on('error', (payload) => {
      this.onStatus?.(`Error: ${JSON.stringify(payload)}`);
    });
    this.player.on('waiting', () => this.onStatus?.('Buffering…'));
    this.player.on('playing', () => this.onStatus?.('Playing'));
  }

  detach(): void {
    this.player?.destroy();
    this.player = null;
  }

  setCallbacks(opts: {
    onChannelChange?: (ch: Channel | null, index: number) => void;
    onStatus?: (status: string) => void;
  }): void {
    this.onChannelChange = opts.onChannelChange;
    this.onStatus = opts.onStatus;
  }

  setPlaylist(channels: Channel[], startId?: string): void {
    this.playlist = channels;
    if (startId) {
      const i = channels.findIndex((c) => c.id === startId);
      this.index = i >= 0 ? i : 0;
    } else if (this.index < 0 || this.index >= channels.length) {
      this.index = channels.length > 0 ? 0 : -1;
    }
  }

  getCurrent(): Channel | null {
    if (this.index < 0 || this.index >= this.playlist.length) return null;
    return this.playlist[this.index];
  }

  getIndex(): number {
    return this.index;
  }

  async playChannel(channel: Channel): Promise<void> {
    if (!this.player) throw new Error('Player not attached');
    const i = this.playlist.findIndex((c) => c.id === channel.id);
    if (i >= 0) this.index = i;
    this.onChannelChange?.(channel, this.index);
    this.onStatus?.('Loading…');

    try {
      await this.player.load(channel.url);
      await this.player.play();
    } catch {
      if (channel.altUrl) {
        this.onStatus?.('Trying alternate URL…');
        try {
          await this.player.load(channel.altUrl);
          await this.player.play();
          return;
        } catch (e2) {
          this.onStatus?.('Playback failed');
          throw e2;
        }
      }
      this.onStatus?.('Playback failed');
      throw new Error('Playback failed');
    }
  }

  async playCurrent(): Promise<void> {
    const ch = this.getCurrent();
    if (ch) await this.playChannel(ch);
  }

  async next(): Promise<Channel | null> {
    if (this.playlist.length === 0) return null;
    this.index = (this.index + 1) % this.playlist.length;
    const ch = this.getCurrent();
    if (ch) await this.playChannel(ch);
    return ch;
  }

  async prev(): Promise<Channel | null> {
    if (this.playlist.length === 0) return null;
    this.index = (this.index - 1 + this.playlist.length) % this.playlist.length;
    const ch = this.getCurrent();
    if (ch) await this.playChannel(ch);
    return ch;
  }

  pause(): void {
    this.player?.pause();
  }

  stop(): void {
    this.player?.stop();
  }
}

/** Singleton used by the UI */
export const playerManager = new PlayerManager();
