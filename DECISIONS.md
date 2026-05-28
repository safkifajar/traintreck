# DECISIONS — Train Tracker Purwokerto

Ringkasan keputusan teknis terkunci (LOCKED) dari PRD Bab 5. Jangan diubah tanpa konfirmasi pemilik produk. Saat ada keputusan baru, update file ini dan PRD Bab 5.

| Area | Keputusan | Alasan |
|---|---|---|
| Model data posisi | Estimasi dari jadwal GAPEKA 2025 (interpolasi waktu antar stasiun) | Realistis untuk timeline 8 minggu, tanpa user base, tanpa API KAI |
| Cakupan | Kereta yang melintasi Purwokerto (PWT) | Niche jelas, data prep ringan, diferensiasi lokal |
| Diferensiasi | UX bagus + detail per kereta + papan stasiun PWT | Railfans suka desain; kompetitor lemah di UX |
| Framework | Next.js (App Router) + TypeScript + Tailwind CSS | Cepat, familiar, deploy mudah |
| Library peta | MapLibre GL JS | Vector tiles, animasi marker halus, modern, free |
| Map tiles/style | OpenFreeMap (tanpa API key); fallback MapTiler free (pakai key) | Hindari biaya & friksi key di awal |
| Penyimpanan data | Static JSON di repo (`/data`). Tidak ada DB di MVP. | Jadwal statis, posisi dikompute on-the-fly |
| Lokasi kompute posisi | Client-side (pure function, recompute tiap 1 detik) | Animasi halus, nol beban server, reusable di server bila perlu |
| Date/time | Semua waktu WIB (Asia/Jakarta, UTC+7) | GAPEKA pakai waktu lokal WIB |
| Deploy | Vercel | Gratis, integrasi Next.js native |
| Package manager | npm | Pasti tersedia dengan Node |

## Catatan
- **Supabase ditunda ke Fase 6** (saat ada crowdsource/akun). Susun kode agar penambahan backend nanti mudah: data loader terisolasi di `lib/trains.ts`.
- **Jujur soal akurasi:** setiap tampilan posisi WAJIB punya disclaimer "Posisi estimasi dari jadwal GAPEKA, bukan GPS real-time".
- **Mobile-first:** desain & uji di viewport HP (360px) dulu, baru desktop.

## Status Data (PENTING)
- **`data/trains.json` di-GENERATE** oleh `scripts/build-trains.ts` dari `data/source/pwt-board-2026-05-28.tsv` + `data/source/corridor.json`. Jangan edit `trains.json` manual — edit sumber lalu regenerate: `node --experimental-strip-types scripts/build-trains.ts`.
- **Jam di PWT = DATA ASLI** GAPEKA 2025, diambil dari papan jadwal Stasiun Purwokerto di 168railway.com (per 2026-05-28, 196 perjalanan KA: penumpang, tambahan/PLB, barang, KLB/dinas).
- **Jam di stasiun NON-PWT = ESTIMASI** proporsional jarak koridor (km perkiraan di `corridor.json`, kecepatan rata-rata ~60 km/jam). Konsekuensi: **ETA Purwokerto akurat**, tapi posisi marker di luar PWT adalah perkiraan. Disclaimer estimasi tetap wajib di UI.
- **Catatan akurasi yang harus dipahami:** data board 168 hanya memuat jam di PWT + asal/tujuan, BUKAN stasiun antara atau urutan jalur sebenarnya. Rute lengkap disusun via "model koridor sederhana" (lihat `corridor.json`). Stasiun antara & jamnya adalah konstruksi, bukan jadwal resmi.
- **Sumber 168railway:** dipakai SEBAGAI SUMBER JAM PWT atas keputusan pemilik produk. Catatan: 168 adalah kompetitor & robots.txt-nya `ai-train=no`. PRD Bab 14.2 menyarankan verifikasi sendiri; jam PWT sebaiknya dicross-check dengan GAPEKA resmi DJKA sebelum produksi.
- **`data/stations.json` koordinat dari OpenStreetMap** (faktual). PWT diperbarui ke -7.4196, 109.2218 (dari 168).
- **Regenerasi/update:** untuk jadwal hari/tanggal lain, ganti file board di `data/source/` lalu jalankan ulang generator. Skema `Train` tidak berubah; `scripts/validate-data.ts` tetap berlaku.
