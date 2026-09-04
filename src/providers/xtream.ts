import type { Account, Category, Channel, XtreamAccount } from '../core/types';

interface XtreamAuthResponse {
  user_info?: {
    auth?: number | string;
    status?: string;
    message?: string;
  };
  server_info?: Record<string, unknown>;
}

interface XtreamCategory {
  category_id: string | number;
  category_name: string;
  parent_id?: number;
}

interface XtreamStream {
  num?: number;
  name: string;
  stream_type?: string;
  stream_id: number | string;
  stream_icon?: string;
  epg_channel_id?: string;
  category_id?: string | number;
  custom_sid?: string;
  tv_archive?: number;
  direct_source?: string;
  tv_archive_duration?: number;
}

function normalizeServer(server: string): string {
  let s = server.trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(s)) {
    s = `http://${s}`;
  }
  return s;
}

function apiUrl(account: XtreamAccount, action?: string): string {
  const base = normalizeServer(account.server);
  const params = new URLSearchParams({
    username: account.username,
    password: account.password,
  });
  if (action) params.set('action', action);
  return `${base}/player_api.php?${params.toString()}`;
}

/** Build live stream URLs (.m3u8 primary, .ts alternate) */
export function buildLiveUrls(
  account: XtreamAccount,
  streamId: string | number
): { url: string; altUrl: string } {
  const base = normalizeServer(account.server);
  const id = String(streamId);
  return {
    url: `${base}/live/${account.username}/${account.password}/${id}.m3u8`,
    altUrl: `${base}/live/${account.username}/${account.password}/${id}.ts`,
  };
}

export async function authenticateXtream(
  account: XtreamAccount
): Promise<XtreamAuthResponse> {
  const res = await fetch(apiUrl(account), { method: 'GET' });
  if (!res.ok) {
    throw new Error(`Xtream auth failed: HTTP ${res.status}`);
  }
  const data = (await res.json()) as XtreamAuthResponse;
  const auth = data.user_info?.auth;
  const ok = auth === 1 || auth === '1';
  if (!ok) {
    const msg =
      data.user_info?.message ||
      data.user_info?.status ||
      'Invalid credentials or inactive account';
    throw new Error(String(msg));
  }
  return data;
}

export async function fetchLiveCategories(
  account: XtreamAccount
): Promise<Category[]> {
  const res = await fetch(apiUrl(account, 'get_live_categories'));
  if (!res.ok) throw new Error(`Categories failed: HTTP ${res.status}`);
  const raw = (await res.json()) as XtreamCategory[];
  if (!Array.isArray(raw)) return [];
  return raw.map((c) => ({
    id: String(c.category_id),
    name: c.category_name || `Category ${c.category_id}`,
  }));
}

export async function fetchLiveStreams(
  account: XtreamAccount
): Promise<Channel[]> {
  const res = await fetch(apiUrl(account, 'get_live_streams'));
  if (!res.ok) throw new Error(`Streams failed: HTTP ${res.status}`);
  const raw = (await res.json()) as XtreamStream[];
  if (!Array.isArray(raw)) return [];

  return raw.map((s) => {
    const id = String(s.stream_id);
    const { url, altUrl } = buildLiveUrls(account, id);
    const categoryId = s.category_id != null ? String(s.category_id) : 'uncategorized';
    return {
      id: `xtream:${id}`,
      name: s.name || `Stream ${id}`,
      logo: s.stream_icon || undefined,
      categoryId,
      url,
      altUrl,
      meta: {
        stream_id: id,
        epg_channel_id: s.epg_channel_id,
        num: s.num,
      },
    };
  });
}

export async function loadXtreamCatalog(account: XtreamAccount): Promise<{
  categories: Category[];
  channels: Channel[];
}> {
  await authenticateXtream(account);
  const [categories, channels] = await Promise.all([
    fetchLiveCategories(account),
    fetchLiveStreams(account),
  ]);

  // Ensure every channel category exists
  const catIds = new Set(categories.map((c) => c.id));
  const missing = new Set<string>();
  for (const ch of channels) {
    if (!catIds.has(ch.categoryId)) missing.add(ch.categoryId);
  }
  const extras: Category[] = [...missing].map((id) => ({
    id,
    name: id === 'uncategorized' ? 'Uncategorized' : `Category ${id}`,
  }));

  return {
    categories: [...categories, ...extras],
    channels,
  };
}

export function isXtreamAccount(account: Account | null): account is XtreamAccount {
  return !!account && account.type === 'xtream';
}
