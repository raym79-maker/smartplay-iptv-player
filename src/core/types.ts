/** Connection mode chosen on the Connect screen */
export type ConnectionMode = 'xtream' | 'm3u';

/** Saved Xtream Codes credentials */
export interface XtreamAccount {
  type: 'xtream';
  server: string;
  username: string;
  password: string;
  /** Optional display name */
  label?: string;
}

/** Saved M3U source (URL or pasted text) */
export interface M3uAccount {
  type: 'm3u';
  /** Remote playlist URL, if any */
  url?: string;
  /** Raw playlist text (when pasted / uploaded) */
  content?: string;
  label?: string;
}

export type Account = XtreamAccount | M3uAccount;

export interface Category {
  id: string;
  name: string;
  /** Optional parent for nested categories (unused in v0.2) */
  parentId?: string;
}

export interface Channel {
  id: string;
  name: string;
  logo?: string;
  categoryId: string;
  /** Primary playable stream URL */
  url: string;
  /** Alternate URL (e.g. .ts fallback for Xtream) */
  altUrl?: string;
  /** Original group-title / category name for M3U */
  groupTitle?: string;
  /** Provider-specific extra fields */
  meta?: Record<string, string | number | boolean | undefined>;
}

export type ViewId =
  | 'connect'
  | 'browse'
  | 'player'
  | 'search'
  | 'favorites';

export interface AppPersistedState {
  account: Account | null;
  favoriteIds: string[];
  lastCategoryId: string | null;
  lastChannelId: string | null;
}
