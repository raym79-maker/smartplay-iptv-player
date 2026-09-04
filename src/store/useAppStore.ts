import { create } from 'zustand';
import type {
  Account,
  Category,
  Channel,
  ConnectionMode,
  ViewId,
} from '../core/types';
import {
  clearAllPersisted,
  loadPersistedState,
  saveAccount,
  saveFavorites,
  saveLastCategoryId,
  saveLastChannelId,
} from '../core/storage';
import { isXtreamAccount, loadXtreamCatalog } from '../providers/xtream';
import { isM3uAccount, loadM3uCatalog } from '../providers/m3u';

interface AppState {
  hydrated: boolean;
  view: ViewId;
  playerReturnView: ViewId;
  connectionMode: ConnectionMode;
  account: Account | null;
  categories: Category[];
  channels: Channel[];
  selectedCategoryId: string | null;
  selectedChannelId: string | null;
  playbackQueueIds: string[];
  favoriteIds: string[];
  searchQuery: string;
  loading: boolean;
  error: string | null;
  playerStatus: string;

  hydrate: () => Promise<void>;
  setView: (view: ViewId) => void;
  setPlayerReturnView: (view: ViewId) => void;
  setConnectionMode: (mode: ConnectionMode) => void;
  setSearchQuery: (q: string) => void;
  setPlayerStatus: (s: string) => void;
  setSelectedCategory: (id: string | null) => void;
  selectChannel: (id: string | null) => void;
  setPlaybackQueue: (ids: string[]) => void;
  toggleFavorite: (channelId: string) => void;
  connect: (account: Account) => Promise<void>;
  reloadCatalog: () => Promise<void>;
  disconnect: () => Promise<void>;
  filteredChannels: () => Channel[];
  favoriteChannels: () => Channel[];
}

export const useAppStore = create<AppState>((set, get) => ({
  hydrated: false,
  view: 'connect',
  playerReturnView: 'browse',
  connectionMode: 'xtream',
  account: null,
  categories: [],
  channels: [],
  selectedCategoryId: null,
  selectedChannelId: null,
  playbackQueueIds: [],
  favoriteIds: [],
  searchQuery: '',
  loading: false,
  error: null,
  playerStatus: '',

  hydrate: async () => {
    const persisted = await loadPersistedState();
    set({
      account: persisted.account,
      favoriteIds: persisted.favoriteIds,
      selectedCategoryId: persisted.lastCategoryId,
      selectedChannelId: persisted.lastChannelId,
      hydrated: true,
      view: persisted.account ? 'browse' : 'connect',
      connectionMode: persisted.account?.type === 'm3u' ? 'm3u' : 'xtream',
    });
    if (persisted.account) {
      try {
        await get().reloadCatalog();
      } catch (e) {
        set({
          error: e instanceof Error ? e.message : 'Failed to reload catalog',
          view: 'connect',
        });
      }
    }
  },

  setView: (view) => set({ view }),
  setPlayerReturnView: (view) => set({ playerReturnView: view }),
  setConnectionMode: (mode) => set({ connectionMode: mode }),
  setSearchQuery: (q) => set({ searchQuery: q }),
  setPlayerStatus: (s) => set({ playerStatus: s }),

  setSelectedCategory: (id) => {
    set({ selectedCategoryId: id });
    void saveLastCategoryId(id);
  },

  selectChannel: (id) => {
    set({ selectedChannelId: id });
    void saveLastChannelId(id);
  },

  setPlaybackQueue: (ids) => set({ playbackQueueIds: ids }),

  toggleFavorite: (channelId) => {
    const { favoriteIds } = get();
    const next = favoriteIds.includes(channelId)
      ? favoriteIds.filter((id) => id !== channelId)
      : [...favoriteIds, channelId];
    set({ favoriteIds: next });
    void saveFavorites(next);
  },

  connect: async (account) => {
    set({ loading: true, error: null });
    try {
      let categories: Category[] = [];
      let channels: Channel[] = [];
      if (isXtreamAccount(account)) {
        const catalog = await loadXtreamCatalog(account);
        categories = catalog.categories;
        channels = catalog.channels;
      } else if (isM3uAccount(account)) {
        const catalog = await loadM3uCatalog(account);
        categories = catalog.categories;
        channels = catalog.channels;
      } else {
        throw new Error('Unknown account type');
      }

      await saveAccount(account);
      const firstCat = categories[0]?.id ?? null;
      set({
        account,
        categories,
        channels,
        selectedCategoryId: firstCat,
        playbackQueueIds: [],
        playerReturnView: 'browse',
        loading: false,
        error: null,
        view: 'browse',
      });
      void saveLastCategoryId(firstCat);
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : 'Connection failed',
      });
      throw e;
    }
  },

  reloadCatalog: async () => {
    const { account } = get();
    if (!account) return;
    set({ loading: true, error: null });
    try {
      let categories: Category[] = [];
      let channels: Channel[] = [];
      if (isXtreamAccount(account)) {
        const catalog = await loadXtreamCatalog(account);
        categories = catalog.categories;
        channels = catalog.channels;
      } else {
        const catalog = await loadM3uCatalog(account);
        categories = catalog.categories;
        channels = catalog.channels;
      }
      const { selectedCategoryId } = get();
      const stillValid =
        selectedCategoryId && categories.some((c) => c.id === selectedCategoryId);
      set({
        categories,
        channels,
        playbackQueueIds: [],
        selectedCategoryId: stillValid
          ? selectedCategoryId
          : categories[0]?.id ?? null,
        loading: false,
      });
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : 'Reload failed',
      });
      throw e;
    }
  },

  disconnect: async () => {
    await clearAllPersisted();
    set({
      account: null,
      categories: [],
      channels: [],
      selectedCategoryId: null,
      selectedChannelId: null,
      playbackQueueIds: [],
      favoriteIds: [],
      searchQuery: '',
      error: null,
      view: 'connect',
      playerReturnView: 'browse',
      playerStatus: '',
    });
  },

  filteredChannels: () => {
    const { channels, selectedCategoryId, searchQuery, view, favoriteIds } =
      get();
    let list = channels;

    if (view === 'favorites') {
      list = channels.filter((c) => favoriteIds.includes(c.id));
    } else if (selectedCategoryId) {
      list = channels.filter((c) => c.categoryId === selectedCategoryId);
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.groupTitle || '').toLowerCase().includes(q)
      );
    }
    return list;
  },

  favoriteChannels: () => {
    const { channels, favoriteIds } = get();
    return channels.filter((c) => favoriteIds.includes(c.id));
  },
}));
