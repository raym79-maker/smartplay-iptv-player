import type { Account, Category, Channel, M3uAccount } from '../core/types';

/** Parse attributes from an #EXTINF line */
function parseExtInfAttrs(line: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const attrRe = /([a-zA-Z0-9_-]+)="([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = attrRe.exec(line)) !== null) {
    attrs[m[1].toLowerCase()] = m[2];
  }
  return attrs;
}

/** Channel display name from #EXTINF (after last comma) */
function parseExtInfName(line: string): string {
  const comma = line.lastIndexOf(',');
  if (comma === -1) return 'Unknown';
  return line.slice(comma + 1).trim() || 'Unknown';
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64) || 'item';
}

/** Small deterministic hash for stable IDs when tvg-id is unavailable. */
function stableHash(value: string): string {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = ((hash << 5) + hash) ^ value.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

/**
 * Parse M3U / M3U8 playlist text into categories + channels.
 * Supports #EXTINF with tvg-id, tvg-logo, group-title, and following URL line.
 */
export function parseM3u(content: string): {
  categories: Category[];
  channels: Channel[];
} {
  const lines = content
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const categoryMap = new Map<string, Category>();
  const channels: Channel[] = [];
  const usedIds = new Set<string>();
  let pending: {
    name: string;
    logo?: string;
    group: string;
    tvgId?: string;
  } | null = null;

  for (const line of lines) {
    if (line.startsWith('#EXTINF')) {
      const attrs = parseExtInfAttrs(line);
      const name = parseExtInfName(line);
      const group = attrs['group-title'] || 'Uncategorized';
      pending = {
        name,
        logo: attrs['tvg-logo'] || attrs['logo'] || undefined,
        group,
        tvgId: attrs['tvg-id'] || undefined,
      };
      continue;
    }

    if (line.startsWith('#')) continue;

    if (pending) {
      const group = pending.group;
      const catId = `m3u:${slugify(group)}`;
      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, { id: catId, name: group });
      }

      const identity = pending.tvgId?.trim()
        ? `tvg:${slugify(pending.tvgId)}`
        : `url:${stableHash(line)}`;
      let id = `m3u:${identity}`;
      if (usedIds.has(id)) {
        id = `${id}:${stableHash(`${pending.name}|${group}|${line}`)}`;
      }
      usedIds.add(id);

      channels.push({
        id,
        name: pending.name,
        logo: pending.logo,
        categoryId: catId,
        url: line,
        groupTitle: group,
        meta: pending.tvgId ? { tvg_id: pending.tvgId } : undefined,
      });
      pending = null;
    }
  }

  return {
    categories: Array.from(categoryMap.values()),
    channels,
  };
}

export async function fetchM3uContent(account: M3uAccount): Promise<string> {
  if (account.content && account.content.trim().length > 0) {
    return account.content;
  }
  if (!account.url) {
    throw new Error('Provide an M3U URL or paste playlist text');
  }
  const res = await fetch(account.url);
  if (!res.ok) throw new Error(`M3U fetch failed: HTTP ${res.status}`);
  return await res.text();
}

export async function loadM3uCatalog(account: M3uAccount): Promise<{
  categories: Category[];
  channels: Channel[];
}> {
  const content = await fetchM3uContent(account);
  if (!content.includes('#EXT')) {
    throw new Error('Content does not look like a valid M3U playlist');
  }
  return parseM3u(content);
}

export function isM3uAccount(account: Account | null): account is M3uAccount {
  return !!account && account.type === 'm3u';
}
