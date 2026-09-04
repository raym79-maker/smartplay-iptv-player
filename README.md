# Smartplay IPTV Player v0.2

**EN** - Lightweight web IPTV player for user-provided Xtream Codes or M3U live lists.
**ES** - Reproductor IPTV web ligero para listas proporcionadas por el usuario (Xtream Codes o M3U).

> v0.2: live TV only. No VOD UI, no payments, no activations. No third-party playlists shipped with the app.
> v0.2: solo TV en vivo. Sin VOD, sin pagos ni activaciones. La app no incluye listas de terceros.

## Features / Funciones

| Feature | Status |
|--------|--------|
| Connect Xtream (server + user + pass) | Yes |
| Connect M3U (URL, paste, or file) | Yes |
| Live categories + channel logos | Yes |
| Play with hls.js / native HLS | Yes |
| Channel zap (next/prev + keyboard) | Yes |
| Favorites + search | Yes |
| Persist account and favorites (IndexedDB) | Yes |
| VOD / payments / bundled lists | Out of scope |

## Stack

- React 18 + TypeScript + Vite
- Zustand
- IndexedDB via idb-keyval (localStorage fallback)
- hls.js for browser HLS playback
- Plain CSS (dark IPTV UI, remote-friendly focus)

## Quick start / Inicio rapido

```bash
npm install
npm run dev
```

Open the URL Vite prints (default http://localhost:5173).

### Build / Compilar

```bash
npm run build
npm run preview
```

Output goes to dist/.

## How to use / Como usar

1. Xtream: enter panel URL, username, password, then Connect.
   Live URL pattern: {server}/live/{user}/{pass}/{stream_id}.m3u8 (.ts tried as fallback).

2. M3U: paste a playlist URL, paste #EXTM3U text, or upload a .m3u / .m3u8 file.

3. Browse categories, select a channel, play.
   Keyboard: Left/Right or Up/Down zap, Enter play/pause, Esc back, F favorite.

Credentials and favorites are stored locally in the browser (IndexedDB).

## Project structure / Estructura

```
src/
  core/        models, types, storage
  providers/   m3u.ts, xtream.ts
  player/      PlayerManager + Html5HlsPlayer
  ui/          App, Connect, Categories, ChannelList, PlayerView, Search, Favorites
  store/       useAppStore.ts
```

## Android / POCO Pad / Capacitor (later)

v0.2 is a browser app. A future release may wrap this with Capacitor for Android tablets (e.g. POCO Pad). Not included in this version.

v0.2 es una app web. Una version futura puede empaquetarse con Capacitor para Android (p. ej. POCO Pad). No esta incluido aqui.

## Legal

Smartplay IPTV Player is a player only. Load only playlists and streams you are authorized to use.

Smartplay IPTV Player es solo un reproductor. Carga unicamente listas y streams que estes autorizado a usar.

## License

MIT (or as specified by the repository owner).
