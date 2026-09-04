import { get, set, del } from 'idb-keyval';
import type { Account, AppPersistedState } from './types';

const KEYS = {
  account: 'smartplay:account',
  favorites: 'smartplay:favorites',
  lastCategoryId: 'smartplay:lastCategoryId',
  lastChannelId: 'smartplay:lastChannelId',
} as const;

const LS_PREFIX = 'smartplay:ls:';

/** localStorage fallback when IndexedDB is unavailable */
async function idbGet<T>(key: string): Promise<T | undefined> {
  try {
    return await get<T>(key);
  } catch {
    try {
      const raw = localStorage.getItem(LS_PREFIX + key);
      return raw ? (JSON.parse(raw) as T) : undefined;
    } catch {
      return undefined;
    }
  }
}

async function idbSet<T>(key: string, value: T): Promise<void> {
  try {
    await set(key, value);
  } catch {
    try {
      localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
    } catch {
      /* ignore quota / private mode */
    }
  }
}

async function idbDel(key: string): Promise<void> {
  try {
    await del(key);
  } catch {
    try {
      localStorage.removeItem(LS_PREFIX + key);
    } catch {
      /* ignore */
    }
  }
}

export async function loadPersistedState(): Promise<AppPersistedState> {
  const [account, favoriteIds, lastCategoryId, lastChannelId] = await Promise.all([
    idbGet<Account>(KEYS.account),
    idbGet<string[]>(KEYS.favorites),
    idbGet<string>(KEYS.lastCategoryId),
    idbGet<string>(KEYS.lastChannelId),
  ]);

  return {
    account: account ?? null,
    favoriteIds: favoriteIds ?? [],
    lastCategoryId: lastCategoryId ?? null,
    lastChannelId: lastChannelId ?? null,
  };
}

export async function saveAccount(account: Account | null): Promise<void> {
  if (account) await idbSet(KEYS.account, account);
  else await idbDel(KEYS.account);
}

export async function saveFavorites(favoriteIds: string[]): Promise<void> {
  await idbSet(KEYS.favorites, favoriteIds);
}

export async function saveLastCategoryId(id: string | null): Promise<void> {
  if (id) await idbSet(KEYS.lastCategoryId, id);
  else await idbDel(KEYS.lastCategoryId);
}

export async function saveLastChannelId(id: string | null): Promise<void> {
  if (id) await idbSet(KEYS.lastChannelId, id);
  else await idbDel(KEYS.lastChannelId);
}

export async function clearAllPersisted(): Promise<void> {
  await Promise.all([
    idbDel(KEYS.account),
    idbDel(KEYS.favorites),
    idbDel(KEYS.lastCategoryId),
    idbDel(KEYS.lastChannelId),
  ]);
}
