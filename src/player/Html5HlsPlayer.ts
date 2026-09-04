import Hls from 'hls.js';

export type PlayerEvent =
  | 'playing'
  | 'paused'
  | 'ended'
  | 'error'
  | 'waiting'
  | 'canplay';

type Listener = (payload?: unknown) => void;

/**
 * Thin wrapper around HTMLVideoElement + hls.js for HLS streams.
 * Falls back to native HLS (Safari) when available.
 */
export class Html5HlsPlayer {
  private video: HTMLVideoElement;
  private hls: Hls | null = null;
  private listeners = new Map<PlayerEvent, Set<Listener>>();
  private currentUrl: string | null = null;

  constructor(video: HTMLVideoElement) {
    this.video = video;
    this.bindVideoEvents();
  }

  private bindVideoEvents(): void {
    this.video.addEventListener('playing', () => this.emit('playing'));
    this.video.addEventListener('pause', () => this.emit('paused'));
    this.video.addEventListener('ended', () => this.emit('ended'));
    this.video.addEventListener('waiting', () => this.emit('waiting'));
    this.video.addEventListener('canplay', () => this.emit('canplay'));
    this.video.addEventListener('error', () => {
      const err = this.video.error;
      this.emit('error', {
        code: err?.code,
        message: err?.message || 'Video error',
      });
    });
  }

  on(event: PlayerEvent, fn: Listener): () => void {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(fn);
    return () => this.listeners.get(event)?.delete(fn);
  }

  private emit(event: PlayerEvent, payload?: unknown): void {
    this.listeners.get(event)?.forEach((fn) => fn(payload));
  }

  async load(url: string): Promise<void> {
    this.destroyHls();
    this.currentUrl = url;

    const canNative =
      this.video.canPlayType('application/vnd.apple.mpegurl') !== '';

    if (Hls.isSupported() && !canNative) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 90,
      });
      this.hls = hls;
      hls.loadSource(url);
      hls.attachMedia(this.video);
      await new Promise<void>((resolve, reject) => {
        const onManifest = () => {
          cleanup();
          resolve();
        };
        const onError = (_: unknown, data: { fatal?: boolean; type?: string; details?: string }) => {
          if (data.fatal) {
            cleanup();
            this.emit('error', data);
            reject(new Error(data.details || data.type || 'HLS fatal error'));
          }
        };
        const cleanup = () => {
          hls.off(Hls.Events.MANIFEST_PARSED, onManifest);
          hls.off(Hls.Events.ERROR, onError);
        };
        hls.on(Hls.Events.MANIFEST_PARSED, onManifest);
        hls.on(Hls.Events.ERROR, onError);
      });
    } else if (canNative) {
      this.video.src = url;
      await new Promise<void>((resolve, reject) => {
        const onOk = () => {
          cleanup();
          resolve();
        };
        const onErr = () => {
          cleanup();
          reject(new Error('Native HLS load failed'));
        };
        const cleanup = () => {
          this.video.removeEventListener('loadedmetadata', onOk);
          this.video.removeEventListener('error', onErr);
        };
        this.video.addEventListener('loadedmetadata', onOk);
        this.video.addEventListener('error', onErr);
      });
    } else {
      // Progressive / MPEG-TS / progressive MP4 — try direct
      this.video.src = url;
    }
  }

  async play(): Promise<void> {
    try {
      await this.video.play();
    } catch (e) {
      this.emit('error', e);
      throw e;
    }
  }

  pause(): void {
    this.video.pause();
  }

  stop(): void {
    this.pause();
    this.destroyHls();
    this.video.removeAttribute('src');
    this.video.load();
    this.currentUrl = null;
  }

  getUrl(): string | null {
    return this.currentUrl;
  }

  getVideoElement(): HTMLVideoElement {
    return this.video;
  }

  destroy(): void {
    this.stop();
    this.listeners.clear();
  }

  private destroyHls(): void {
    if (this.hls) {
      this.hls.destroy();
      this.hls = null;
    }
  }
}
