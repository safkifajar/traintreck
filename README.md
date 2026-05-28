# Train Tracker Purwokerto

Website mobile-first yang menampilkan **perkiraan posisi kereta api di peta**, khusus kereta yang melintasi **Stasiun Purwokerto (PWT)**. Posisi diestimasi dari jadwal (interpolasi waktu antar stasiun), **bukan GPS real-time**.

> **Jujur soal akurasi:** posisi kereta adalah ESTIMASI dari jadwal, bukan lokasi GPS sebenarnya. Disclaimer ini muncul di semua tampilan posisi.

## Fitur

- **Peta** (`/`) — posisi estimasi semua kereta yang sedang berjalan, update tiap detik, filter kelas & arah, tap marker untuk ringkasan.
- **Detail kereta** (`/kereta/[id]`) — status terkini, estimasi tiba di Purwokerto, timeline rute, mini map.
- **Papan Stasiun PWT** (`/stasiun/pwt`) — kedatangan & keberangkatan dengan status estimasi, auto-refresh 30 detik, highlight tiba <30 menit.
- **Daftar & cari** (`/kereta`) — cari nama/nomor KA, filter kelas/arah/status, urut estimasi tiba PWT.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- MapLibre GL JS + OpenFreeMap (fallback MapTiler)
- Tanpa database — data statis JSON, posisi dikompute di client
- Vitest untuk unit test

## Menjalankan

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit test (22 test)
```

> **Catatan Windows:** `npm run dev` memakai `--webpack` karena binding SWC native
> Turbopack ditolak di sebagian mesin Windows (butuh Visual C++ Redistributable).
> Di Vercel/Linux, `npm run build` memakai Turbopack default tanpa masalah.
> Jika butuh build lokal di Windows, coba `npm run build:webpack`.

## Data

Jadwal ada di `data/`:

- `stations.json` — stasiun + koordinat (dari OpenStreetMap).
- `trains.json` — **di-generate** oleh `scripts/build-trains.ts`. JANGAN edit manual.
- `segments.json` — geometri rel opsional (fallback garis lurus bila kosong).

### Sumber & akurasi jadwal

- **Jam di PWT = data asli** GAPEKA 2025 (papan jadwal Stasiun Purwokerto).
- **Jam di stasiun lain = estimasi** proporsional jarak (model koridor). ETA Purwokerto akurat; posisi marker di luar PWT adalah perkiraan.
- Detail & keputusan: lihat [DECISIONS.md](DECISIONS.md).

### Regenerasi data

Ganti papan jadwal di `data/source/`, lalu:

```bash
node --experimental-strip-types scripts/build-trains.ts
npm test   # validasi data
```

## Konfigurasi opsional

`NEXT_PUBLIC_MAPTILER_KEY` — fallback map tiles bila OpenFreeMap gagal. Lihat `.env.local.example`. Tanpa key, app tetap jalan memakai OpenFreeMap.

## Deploy

Push ke GitHub, lalu import di [Vercel](https://vercel.com/new). Tanpa konfigurasi tambahan — Vercel mendeteksi Next.js otomatis dan build dengan Turbopack/SWC native Linux.
