# PRD & Engineering Spec - Train Tracker Purwokerto

**Versi:** 1.0
**Tanggal:** 28 Mei 2026
**Jenis dokumen:** PRD + Technical Spec (companion untuk coding bareng Claude)
**Status:** Final untuk MVP
**Target go-live:** 21 Juli 2026

> Dokumen ini ditulis sebagai panduan koding. Tujuannya: siapa pun (termasuk Claude) bisa baca dari atas ke bawah lalu langsung implementasi tanpa perlu nebak keputusan produk atau arsitektur. Semua keputusan kunci sudah dikunci di Bab 5.

---

## 1. Ringkasan Produk

**Train Tracker Purwokerto** adalah website (mobile-first) yang menampilkan **perkiraan posisi kereta api real-time di peta**, khusus untuk kereta yang melintasi **Stasiun Purwokerto (PWT)**.

Posisi kereta **diestimasi dari jadwal resmi GAPEKA 2025** (interpolasi waktu antar stasiun), bukan dari GPS real. Tidak ada API KAI publik dan tidak ada crowdsource GPS di MVP ini.

Nilai utama buat pengguna: "Kereta yang mau saya naiki/jemput sekarang ada di mana, dan kira-kira sampai Purwokerto jam berapa?"

---

## 2. Tujuan & Non-Tujuan

### 2.1 Tujuan (MVP)
1. Menampilkan peta dengan perkiraan posisi semua kereta yang sedang berjalan dan melintasi Purwokerto.
2. Halaman detail per kereta: rute lengkap, jadwal tiap stasiun, status terkini, estimasi tiba di Purwokerto.
3. Papan jadwal Stasiun Purwokerto (kedatangan & keberangkatan hari ini) dengan status estimasi terkini.
4. Pencarian & filter kereta.
5. UX/UI yang rapi dan cepat (ini diferensiasi utama vs 168Railway).

### 2.2 Non-Tujuan (di luar scope MVP)
- GPS real-time / crowdsource posisi (ditunda ke Fase 6).
- Akun pengguna, login, kontribusi data.
- Data real-time keterlambatan kereta (GAPEKA hanya jadwal, jadi posisi = estimasi).
- Pemesanan tiket.
- Native mobile app (cukup web responsive / PWA opsional).
- Cakupan kereta nasional penuh (MVP hanya kereta yang lewat PWT).

### 2.3 Prinsip yang wajib dipegang saat koding
- **Jujur soal akurasi.** Setiap tampilan posisi WAJIB punya label "Posisi estimasi dari jadwal, bukan GPS real-time". Ini penting untuk kepercayaan dan membedakan kita secara jujur dari kompetitor.
- **Mobile-first.** Desain dan test di viewport HP dulu, baru desktop.
- **Lean.** Tidak ada database di MVP. Data statis JSON. Kompute posisi di sisi client.

---

## 3. Target Pengguna & Use Case

| Persona | Kebutuhan | Use case utama |
|---|---|---|
| Penumpang di Purwokerto | Tahu kereta sudah dekat belum | Buka papan stasiun PWT, lihat KA Taksaka diperkirakan tiba 14 menit lagi |
| Penjemput | Tahu kapan harus berangkat ke stasiun | Buka detail kereta, lihat estimasi tiba PWT |
| Railfans | Lihat pergerakan kereta di peta, eksplor rute | Buka peta, klik marker kereta, baca detail rute & rangkaian |

**Lokasi pengguna utama: Purwokerto.** Default map center dan papan stasiun fokus ke PWT.

---

## 4. Cakupan MVP (Scope Data)

**Hanya kereta yang rutenya melewati Stasiun Purwokerto (kode: PWT).**

Purwokerto berada di lintas selatan Jawa (jalur utama Cirebon/Kroya). Contoh kereta yang melintas (DAFTAR HARUS DIVERIFIKASI dari GAPEKA 2025, ini hanya ilustrasi awal): Argo Dwipangga, Argo Lawu, Taksaka, Purwojaya, Sawunggalih, Kamandaka, Joglosemarkerto, Bima, Gajayana, Turangga, Lodaya, Mutiara Selatan, Ranggajati, Wijayakusuma, Logawa, Bengawan, Gaya Baru Malam Selatan, Kutojaya Utara/Selatan, Fajar/Senja Utama.

Perkiraan jumlah: ~40-70 perjalanan KA per hari yang lewat PWT (dua arah). Ini kecil dan sepenuhnya bisa di-compute di client.

> **Tugas data prep (lihat Bab 14):** ekstrak dari GAPEKA 2025 semua kereta yang `stops` mengandung PWT, beserta seluruh stasiun di rutenya (bukan cuma PWT, supaya posisi bisa digambar sepanjang rute).

---

## 5. Keputusan Teknis (LOCKED)

Keputusan di bawah ini sudah final. Jangan diubah saat koding tanpa konfirmasi pemilik produk.

| Area | Keputusan | Alasan |
|---|---|---|
| Model data posisi | **Estimasi dari jadwal GAPEKA 2025** (interpolasi waktu antar stasiun) | Realistis untuk timeline 8 minggu, tanpa user base, tanpa API KAI |
| Cakupan | **Kereta yang melintasi Purwokerto (PWT)** | Niche jelas, data prep ringan, diferensiasi lokal |
| Diferensiasi | **UX bagus + detail per kereta + papan stasiun PWT** | Railfans suka desain; kompetitor lemah di UX |
| Framework | **Next.js (App Router) + TypeScript + Tailwind CSS** | Cepat, familiar, deploy mudah |
| Library peta | **MapLibre GL JS** | Vector tiles, animasi marker halus, modern, free |
| Map tiles/style | **OpenFreeMap** (tanpa API key) untuk start; fallback MapTiler free (pakai key) | Hindari biaya & friksi key di awal |
| Penyimpanan data | **Static JSON di repo** (`/data`). **Tidak ada DB di MVP.** | Jadwal statis, posisi dikompute on-the-fly |
| Lokasi kompute posisi | **Client-side** (pure function, recompute tiap 1 detik) | Animasi halus, nol beban server, tetap reusable di server bila perlu |
| Date/time | Semua waktu **WIB (Asia/Jakarta, UTC+7)** | GAPEKA pakai waktu lokal WIB |
| Deploy | **Vercel** | Gratis, integrasi Next.js native |
| Package manager | **pnpm** (atau npm bila lebih nyaman) | - |

**Catatan Supabase:** STATUS.md sebelumnya menyebut Supabase. Untuk MVP GAPEKA-estimasi murni, **database tidak diperlukan**. Tunda Supabase ke Fase 6 (saat ada crowdsource/akun). Susun kode supaya menambah backend nanti gampang (data loader terisolasi di `lib/trains.ts`).

---

## 6. Arsitektur Sistem

```
┌──────────────────────────────────────────────────────────┐
│                    Browser (Client)                        │
│                                                            │
│  Next.js App (App Router, mostly client components untuk   │
│  peta yang butuh interaktivitas)                           │
│                                                            │
│   ┌─────────────┐   tiap 1 detik    ┌──────────────────┐  │
│   │ Static data │ ───────────────▶  │ computeTrainPos() │  │
│   │ (JSON impor)│                    │  (pure function)  │  │
│   └─────────────┘                    └────────┬─────────┘  │
│                                               │            │
│                                               ▼            │
│                                      ┌──────────────────┐  │
│                                      │   MapLibre GL     │  │
│                                      │  (marker + route) │  │
│                                      └──────────────────┘  │
└──────────────────────────────────────────────────────────┘
            │ tiles
            ▼
   OpenFreeMap / MapTiler (vector tiles)
```

- Data GAPEKA (`stations.json`, `trains.json`, `segments.json`) di-bundle ke client.
- Posisi tiap kereta dihitung di browser dari jadwal + waktu sekarang, di-refresh tiap detik.
- MapLibre render marker kereta, marker stasiun, dan polyline rute.
- Tidak ada call ke server untuk posisi. Server hanya serve halaman statis + tiles dari penyedia map.

---

## 7. Model & Sumber Data

### 7.1 Skema Data (TypeScript types -> `lib/types.ts`)

```ts
// Hari operasi: 0 = Minggu ... 6 = Sabtu (mengikuti Date.getDay)
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Station {
  id: string;          // kode stasiun, mis. "PWT", "GMR"
  name: string;        // "Purwokerto"
  lat: number;
  lng: number;
  line: string;        // "lintas-selatan" (untuk grouping/geometry)
  isMajor?: boolean;   // tampilkan label di zoom rendah
}

export interface Stop {
  stationId: string;
  arrival: string | null;   // "HH:MM" WIB, null untuk stasiun awal
  departure: string | null; // "HH:MM" WIB, null untuk stasiun akhir
  dayOffset: number;        // 0 = hari berangkat, 1 = hari berikutnya (untuk KA lintas tengah malam)
}

export type TrainClass = "Eksekutif" | "Campuran" | "Bisnis" | "Ekonomi" | "Lokal";

export interface Train {
  id: string;                 // nomor KA, mis. "7017" (unik per perjalanan)
  name: string;               // "Argo Dwipangga"
  class: TrainClass;
  operator: string;           // "KAI"
  originId: string;           // kode stasiun awal
  destinationId: string;      // kode stasiun akhir
  daysOfOperation: DayOfWeek[]; // [0,1,2,3,4,5,6] = harian
  stops: Stop[];              // urut dari awal ke akhir, WAJIB mengandung PWT
  color?: string;             // override warna marker (opsional)
}

// Geometri rel antar dua stasiun berurutan. Key = `${fromId}-${toId}`.
// Koordinat format [lng, lat] (urutan GeoJSON).
export interface SegmentGeometry {
  key: string;                 // "GMR-JNG" dst (boleh disederhanakan jadi antar stasiun besar)
  coordinates: [number, number][];
}
```

### 7.2 Output kompute posisi (`lib/types.ts`)

```ts
export type TrainStatus =
  | "in_transit"          // sedang jalan antar dua stasiun
  | "dwelling"            // berhenti di stasiun
  | "not_started"         // belum berangkat hari ini
  | "arrived"             // sudah tiba di tujuan
  | "not_operating_today";// hari ini tidak beroperasi

export interface TrainPosition {
  trainId: string;
  status: TrainStatus;
  lat?: number;            // ada untuk in_transit & dwelling
  lng?: number;
  bearing?: number;        // 0-360 derajat, untuk rotasi ikon
  fromStationId?: string;  // segmen saat in_transit
  toStationId?: string;
  progress?: number;       // 0..1 dalam segmen (berbasis waktu)
  atStationId?: string;    // saat dwelling
  nextStationId?: string;
  etaNextStationMin?: number;     // menit menuju kedatangan stasiun berikutnya
  etaPurwokertoMin?: number | null; // menit menuju tiba di PWT (null bila sudah lewat)
}
```

### 7.3 Lokasi file data

```
data/
  stations.json     // Station[]
  trains.json       // Train[]
  segments.json     // SegmentGeometry[]  (boleh menyusul; fallback garis lurus)
```

### 7.4 Contoh isi data (ILUSTRASI - wajib diverifikasi dari GAPEKA 2025)

`stations.json` (koordinat HARUS diverifikasi, ini perkiraan):
```json
[
  { "id": "GMR", "name": "Gambir",     "lat": -6.1766, "lng": 106.8307, "line": "lintas-selatan", "isMajor": true },
  { "id": "CN",  "name": "Cirebon",    "lat": -6.7080, "lng": 108.5560, "line": "lintas-selatan", "isMajor": true },
  { "id": "PWT", "name": "Purwokerto", "lat": -7.4249, "lng": 109.2415, "line": "lintas-selatan", "isMajor": true },
  { "id": "KYA", "name": "Kroya",      "lat": -7.6310, "lng": 109.2470, "line": "lintas-selatan", "isMajor": true },
  { "id": "YK",  "name": "Yogyakarta", "lat": -7.7892, "lng": 110.3630, "line": "lintas-selatan", "isMajor": true },
  { "id": "SLO", "name": "Solo Balapan","lat": -7.5560, "lng": 110.8200, "line": "lintas-selatan", "isMajor": true }
]
```

`trains.json` (ILUSTRASI):
```json
[
  {
    "id": "7017",
    "name": "Argo Dwipangga",
    "class": "Eksekutif",
    "operator": "KAI",
    "originId": "GMR",
    "destinationId": "SLO",
    "daysOfOperation": [0,1,2,3,4,5,6],
    "stops": [
      { "stationId": "GMR", "arrival": null,    "departure": "08:00", "dayOffset": 0 },
      { "stationId": "CN",  "arrival": "10:45", "departure": "10:50", "dayOffset": 0 },
      { "stationId": "PWT", "arrival": "12:39", "departure": "12:44", "dayOffset": 0 },
      { "stationId": "KYA", "arrival": "13:05", "departure": "13:07", "dayOffset": 0 },
      { "stationId": "YK",  "arrival": "14:20", "departure": "14:25", "dayOffset": 0 },
      { "stationId": "SLO", "arrival": "15:30", "departure": null,    "dayOffset": 0 }
    ]
  }
]
```

---

## 8. Algoritma Estimasi Posisi (INTI PRODUK)

Ini bagian paling penting. Implementasi sebagai **pure function** di `lib/position.ts` supaya bisa dipanggil di client (utama) maupun server, dan mudah di-unit-test.

### 8.1 Helper waktu (`lib/time.ts`)

```ts
// Menit dalam sehari (0..1439) untuk "HH:MM"
export function hhmmToMinutes(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
}

// Kembalikan Date "sekarang" yang sudah dinormalisasi sebagai komponen WIB.
// Pendekatan: ambil komponen tanggal/jam di zona Asia/Jakarta lalu rekonstruksi.
export function nowWib(now: Date = new Date()): {
  year: number; month: number; day: number;
  hour: number; minute: number; dow: DayOfWeek; minutesOfDay: number;
} {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", weekday: "short", hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(now).map(p => [p.type, p.value]));
  const dowMap: Record<string, DayOfWeek> = { Sun:0, Mon:1, Tue:2, Wed:3, Thu:4, Fri:5, Sat:6 };
  const hour = Number(parts.hour) % 24;
  const minute = Number(parts.minute);
  return {
    year: Number(parts.year), month: Number(parts.month), day: Number(parts.day),
    hour, minute, dow: dowMap[parts.weekday as string],
    minutesOfDay: hour * 60 + minute,
  };
}
```

> Catatan: untuk MVP, andalkan jam perangkat klien. Risiko: jam HP user salah. Mitigasi opsional (Fase berikut): fetch waktu server sekali saat load. Dokumentasikan keterbatasan ini.

### 8.2 Helper geometri (`lib/geo.ts`)

```ts
const R = 6371000; // radius bumi meter
const toRad = (d: number) => (d * Math.PI) / 180;
const toDeg = (r: number) => (r * 180) / Math.PI;

export function haversine(a: [number, number], b: [number, number]): number {
  // a, b = [lng, lat]
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const lat1 = toRad(a[1]), lat2 = toRad(b[1]);
  const x = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export function bearing(a: [number, number], b: [number, number]): number {
  const lat1 = toRad(a[1]), lat2 = toRad(b[1]);
  const dLng = toRad(b[0] - a[0]);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1)*Math.sin(lat2) - Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// Interpolasi titik sepanjang polyline berdasarkan fraksi jarak (0..1).
// Kembalikan posisi + bearing arah gerak.
export function pointAlong(
  coords: [number, number][],
  fraction: number
): { lng: number; lat: number; bearing: number } {
  if (coords.length === 1) return { lng: coords[0][0], lat: coords[0][1], bearing: 0 };
  const segLens = [];
  let total = 0;
  for (let i = 0; i < coords.length - 1; i++) {
    const d = haversine(coords[i], coords[i+1]);
    segLens.push(d);
    total += d;
  }
  const target = Math.max(0, Math.min(1, fraction)) * total;
  let acc = 0;
  for (let i = 0; i < segLens.length; i++) {
    if (acc + segLens[i] >= target) {
      const f = segLens[i] === 0 ? 0 : (target - acc) / segLens[i];
      const lng = coords[i][0] + (coords[i+1][0] - coords[i][0]) * f;
      const lat = coords[i][1] + (coords[i+1][1] - coords[i][1]) * f;
      return { lng, lat, bearing: bearing(coords[i], coords[i+1]) };
    }
    acc += segLens[i];
  }
  const last = coords[coords.length - 1];
  const prev = coords[coords.length - 2];
  return { lng: last[0], lat: last[1], bearing: bearing(prev, last) };
}
```

### 8.3 Geometri segmen + fallback

`getSegmentCoords(fromStation, toStation, segments)`:
1. Cari di `segments.json` key `${fromId}-${toId}`. Kalau ada -> pakai polyline rel asli (lebih akurat).
2. Kalau tidak ada -> **fallback garis lurus**: `[[from.lng, from.lat], [to.lng, to.lat]]`. Tetap jalan, hanya kurang ngepas ke rel. Ini sengaja supaya MVP tidak terblokir oleh ketiadaan geometri rel.

### 8.4 Algoritma utama (`lib/position.ts`)

Pendekatan berbasis epoch supaya kasus lintas tengah malam beres otomatis.

```ts
export function computeTrainPosition(
  train: Train,
  stationsById: Record<string, Station>,
  segments: Record<string, SegmentGeometry>,
  now: Date = new Date()
): TrainPosition {
  // 1. Hitung offset menit tiap stop dari keberangkatan origin.
  //    arrivalOffset / departureOffset = menit sejak origin departure.
  const wib = nowWib(now);
  const originDepMin = hhmmToMinutes(train.stops[0].departure!); // origin pasti punya departure

  type StopCalc = { stationId: string; arrOff: number|null; depOff: number|null };
  const calc: StopCalc[] = train.stops.map(s => ({
    stationId: s.stationId,
    arrOff: s.arrival   != null ? s.dayOffset*1440 + hhmmToMinutes(s.arrival)   - originDepMin : null,
    depOff: s.departure != null ? s.dayOffset*1440 + hhmmToMinutes(s.departure) - originDepMin : null,
  }));
  const totalJourneyMin = calc[calc.length - 1].arrOff!; // offset kedatangan tujuan

  // 2. Bangun kandidat instance: kereta yang berangkat HARI INI atau KEMARIN
  //    (kemarin perlu untuk KA yang masih berjalan melewati tengah malam).
  //    elapsed = menit sejak keberangkatan origin pada instance tsb.
  const candidates = [0, -1].map(dayShift => {
    // menit "sekarang" relatif terhadap origin departure pada instance dayShift hari lalu
    const elapsed = wib.minutesOfDay - originDepMin - dayShift*1440; // dayShift -1 => +1440
    // hari operasi instance = dow keberangkatannya
    const depDow = ((wib.dow - dayShift) % 7 + 7) % 7 as DayOfWeek; // origin dep dow
    return { elapsed, depDow };
  });

  const active = candidates.find(c =>
    c.elapsed >= 0 &&
    c.elapsed <= totalJourneyMin &&
    train.daysOfOperation.includes(c.depDow)
  );

  // 3. Tidak ada instance aktif -> tentukan not_started / arrived / not_operating_today
  if (!active) {
    const todayInstance = candidates[0]; // dayShift 0
    if (!train.daysOfOperation.includes(todayInstance.depDow) &&
        !train.daysOfOperation.includes(candidates[1].depDow)) {
      return { trainId: train.id, status: "not_operating_today" };
    }
    if (todayInstance.elapsed < 0 && train.daysOfOperation.includes(todayInstance.depDow)) {
      return { trainId: train.id, status: "not_started" };
    }
    return { trainId: train.id, status: "arrived" };
  }

  const elapsed = active.elapsed;

  // 4. Cari posisi: dwelling di stasiun, atau in_transit di segmen.
  for (let i = 0; i < calc.length; i++) {
    const s = calc[i];
    // dwelling: berada di antara kedatangan & keberangkatan stasiun i
    if (s.arrOff != null && s.depOff != null && elapsed >= s.arrOff && elapsed <= s.depOff) {
      const st = stationsById[s.stationId];
      return {
        trainId: train.id, status: "dwelling", atStationId: s.stationId,
        lat: st.lat, lng: st.lng, bearing: 0,
        nextStationId: calc[i+1]?.stationId,
        etaNextStationMin: calc[i+1]?.arrOff != null ? Math.max(0, calc[i+1].arrOff! - elapsed) : undefined,
        etaPurwokertoMin: etaToPwt(calc, elapsed),
      };
    }
    // in_transit: antara keberangkatan i dan kedatangan i+1
    const next = calc[i+1];
    if (s.depOff != null && next?.arrOff != null && elapsed > s.depOff && elapsed < next.arrOff) {
      const progress = (elapsed - s.depOff) / (next.arrOff - s.depOff);
      const coords = getSegmentCoords(stationsById[s.stationId], stationsById[next.stationId], segments);
      const p = pointAlong(coords, progress);
      return {
        trainId: train.id, status: "in_transit",
        fromStationId: s.stationId, toStationId: next.stationId, progress,
        lat: p.lat, lng: p.lng, bearing: p.bearing,
        nextStationId: next.stationId,
        etaNextStationMin: Math.max(0, next.arrOff - elapsed),
        etaPurwokertoMin: etaToPwt(calc, elapsed),
      };
    }
  }

  // fallback aman (mis. tepat di boundary): anggap di stasiun terakhir yang relevan
  return { trainId: train.id, status: "arrived" };
}

// menit menuju tiba di PWT; null kalau PWT sudah dilewati atau tidak ada di rute
function etaToPwt(calc: {stationId:string; arrOff:number|null}[], elapsed: number): number | null {
  const pwt = calc.find(c => c.stationId === "PWT");
  if (!pwt || pwt.arrOff == null) return null;
  const eta = pwt.arrOff - elapsed;
  return eta >= 0 ? eta : null;
}
```

### 8.5 Catatan implementasi algoritma
- **Lintas tengah malam:** ditangani lewat `dayOffset` di data + kandidat instance "kemarin".
- **Kereta tidak harian:** `daysOfOperation` dicek per instance keberangkatan.
- **Boundary persis di waktu kedatangan/keberangkatan:** urutan cek dwelling dulu lalu transit menghindari celah; sisa boundary jatuh ke fallback.
- **Akurasi:** posisi murni fungsi waktu jadwal. Tidak ada koreksi keterlambatan. WAJIB diberi label estimasi.
- **Unit test wajib** untuk: KA harian normal, KA lintas tengah malam, KA belum berangkat, KA sudah tiba, KA dwelling di PWT, KA tidak beroperasi hari ini.

---

## 9. Spesifikasi Fitur / Halaman

Mobile-first. Semua halaman responsive. Bahasa UI: Bahasa Indonesia.

### 9.1 Peta Utama `/` (CORE)

**Tujuan:** lihat semua kereta yang sedang berjalan di peta.

Komponen & perilaku:
- MapLibre full-screen, default center = Purwokerto (`-7.4249, 109.2415`), zoom ~8 (cakup koridor PWT).
- Render **marker stasiun** (semua di scope; label hanya untuk `isMajor` saat zoom rendah).
- Render **polyline rute** (faint/abu) untuk lintas yang dicakup.
- Render **marker kereta** untuk semua train dengan status `in_transit` atau `dwelling`.
  - Ikon kereta dirotasi sesuai `bearing`.
  - Warna marker per `class` (lihat 9.6 palet).
  - Recompute posisi **tiap 1 detik** (`setInterval`), update `marker.setLngLat(...)`.
  - Untuk pergerakan halus antar update, boleh animasi transisi pakai `requestAnimationFrame` (opsional, MVP boleh tanpa).
- **Tap/klik marker kereta** -> buka bottom sheet (mobile) / panel kanan (desktop) ringkas: nama KA, kelas, status, ETA PWT, tombol "Lihat detail" -> `/kereta/[id]`.
- **Filter chips** (sticky di atas): Kelas (Semua / Eksekutif / Bisnis / Ekonomi / Lokal), Arah (Semua / ke arah barat / ke arah timur). Filter mengubah marker yang tampil.
- **Badge disclaimer** kecil tapi selalu terlihat: "Posisi estimasi dari jadwal GAPEKA, bukan GPS real-time".
- **Legend** warna kelas (collapsible).
- Tombol "Recenter ke Purwokerto".

Empty state: kalau jam menunjukkan tidak ada kereta yang sedang jalan -> tampilkan pesan "Tidak ada kereta yang sedang berjalan saat ini" + shortcut ke papan stasiun.

### 9.2 Detail Kereta `/kereta/[id]` (CORE)

**Tujuan:** info mendalam satu kereta (ini diferensiasi utama).

Bagian:
1. **Header:** nama KA, nomor KA, kelas (badge warna), operator, rute `Origin -> Destination`.
2. **Status terkini** (besar, jelas), salah satu:
   - "Dalam perjalanan, perkiraan antara {Stasiun A} dan {Stasiun B}"
   - "Berhenti di Stasiun {X}"
   - "Belum berangkat (berangkat {HH:MM} dari {Origin})"
   - "Sudah tiba di {Destination}"
   - "Tidak beroperasi hari ini"
3. **Estimasi tiba di Purwokerto** (highlight, karena niche): "Tiba di Purwokerto ~{HH:MM} ({N} menit lagi)" atau "Sudah melewati Purwokerto".
4. **Mini map:** posisi kereta + polyline rute + marker stasiun. Reuse komponen map.
5. **Tabel perjalanan (timeline stops):** semua stops urut, kolom: Stasiun | Tiba | Berangkat. Visual:
   - Stasiun yang sudah dilewati: redup + checkmark.
   - Stasiun sedang disinggahi: highlight.
   - Stasiun PWT: tandai khusus (pin/border).
   - Stasiun belum dilewati: normal.
6. **Disclaimer estimasi** di bawah.

State: kalau `id` tidak ada -> halaman 404 ramah ("Kereta tidak ditemukan").

### 9.3 Papan Stasiun Purwokerto `/stasiun/[code]` (CORE, fitur unggulan)

Default & utama: `/stasiun/pwt`.

**Tujuan:** papan kedatangan/keberangkatan ala stasiun, fokus PWT.

- Dua tab: **Kedatangan** & **Keberangkatan** (di PWT).
- Daftar kereta hari ini yang singgah di PWT, urut waktu (kedatangan untuk tab Kedatangan, keberangkatan untuk tab Keberangkatan).
- Tiap baris: nama KA + nomor, kelas (badge), waktu (HH:MM di PWT), tujuan akhir, dan **status estimasi terkini** ("Tiba ~12 menit lagi" / "Sudah berangkat" / "Belum berangkat dari asal").
- Highlight kereta yang **akan tiba <30 menit lagi** (paling relevan untuk penumpang/penjemput).
- Tap baris -> detail kereta.
- Auto-refresh status tiap 30 detik.
- Disclaimer estimasi.

### 9.4 Daftar & Cari Kereta `/kereta`

- Search box: cari by nama atau nomor KA (filter instan, case-insensitive, ignore spasi).
- Filter: Arah, Kelas, Status (Sedang jalan / Semua).
- Sort default: estimasi tiba di PWT paling dekat di atas.
- Tiap item: nama, nomor, kelas, rute, status ringkas, ETA PWT. Tap -> detail.
- Empty state untuk hasil search kosong.

### 9.5 Navigasi global
- Bottom nav (mobile) / top nav (desktop): **Peta** | **Stasiun PWT** | **Daftar Kereta**.
- Header app: logo/nama + link.

### 9.6 Sistem desain ringkas
- **Palet kelas kereta** (marker & badge):
  - Eksekutif: `#1565C0` (biru)
  - Campuran: `#6A1B9A` (ungu)
  - Bisnis: `#2E7D32` (hijau)
  - Ekonomi: `#EF6C00` (oranye)
  - Lokal: `#455A64` (abu gelap)
- Font: default system / Inter via next/font.
- Tailwind. Komponen kecil reusable: `TrainStatusBadge`, `ClassBadge`, `Disclaimer`.
- Dark map style opsional, default light.
- **Hindari icon emoji redundan** di UI. Cukup warna + teks. (Preferensi pemilik produk.)

---

## 10. Data Layer / Query (`lib/trains.ts`)

Semua akses data lewat modul ini supaya gampang diganti ke API/DB nanti.

```ts
import stations from "@/data/stations.json";
import trains from "@/data/trains.json";
import segments from "@/data/segments.json";

export function getStationsById(): Record<string, Station> { /* index by id */ }
export function getSegmentsByKey(): Record<string, SegmentGeometry> { /* index by key */ }
export function getAllTrains(): Train[] { return trains as Train[]; }
export function getTrainById(id: string): Train | undefined { /* find */ }
export function getTrainsThroughStation(code: string): Train[] { /* stops includes code */ }

// Hitung posisi semua kereta untuk waktu tertentu (dipakai peta).
export function getLivePositions(now = new Date()): { train: Train; pos: TrainPosition }[] { /* map computeTrainPosition */ }
```

Semua fungsi pure / sinkron (data statis di-bundle). Tidak ada I/O.

---

## 11. Struktur Folder Project

```
train-tracker/
  app/
    layout.tsx
    page.tsx                  # Peta utama (client component utk map)
    kereta/
      page.tsx                # Daftar + search
      [id]/page.tsx           # Detail kereta
    stasiun/
      [code]/page.tsx         # Papan stasiun (default pwt)
    not-found.tsx
  components/
    map/
      TrainMap.tsx            # wrapper MapLibre
      TrainMarkers.tsx
      StationMarkers.tsx
      RouteLayer.tsx
    DepartureBoard.tsx
    TrainScheduleTable.tsx
    TrainStatusBadge.tsx
    ClassBadge.tsx
    Disclaimer.tsx
    FilterChips.tsx
    BottomNav.tsx
  lib/
    types.ts
    time.ts
    geo.ts
    position.ts               # computeTrainPosition (INTI)
    trains.ts                 # data loaders & query
  data/
    stations.json
    trains.json
    segments.json
  scripts/
    build-data.ts             # (opsional) parse sumber GAPEKA -> JSON
  public/
    icons/train.svg
  __tests__/
    position.test.ts          # unit test algoritma posisi
    geo.test.ts
  next.config.js
  tailwind.config.ts
  package.json
  README.md
  DECISIONS.md                # ringkasan Bab 5
```

---

## 12. Integrasi MapLibre GL (detail teknis)

- Paket: `maplibre-gl`. Import CSS `maplibre-gl/dist/maplibre-gl.css`.
- Komponen map **harus client component** (`"use client"`), init di `useEffect`, simpan instance di `useRef`. Cleanup `map.remove()` saat unmount.
- **Style/tiles:**
  - Default: OpenFreeMap style URL (tanpa key), mis. `https://tiles.openfreemap.org/styles/liberty`.
  - Fallback: MapTiler `https://api.maptiler.com/maps/streets/style.json?key=ENV_KEY` (`NEXT_PUBLIC_MAPTILER_KEY`).
- **Rute (polyline):** tambahkan sebagai GeoJSON source + line layer. Bangun FeatureCollection dari `segments.json` (atau garis lurus antar stops bila segmen kosong).
- **Marker stasiun:** GeoJSON source + circle layer + symbol layer (label `isMajor`). Atau HTML markers untuk jumlah kecil.
- **Marker kereta:** gunakan `new maplibregl.Marker({ element })` dengan elemen HTML custom (ikon SVG yang bisa dirotasi via CSS `transform: rotate(bearing)`). Simpan map `trainId -> Marker` untuk update posisi tanpa recreate.
- **Loop update:** `setInterval(() => { positions = getLivePositions(); updateMarkers(positions); }, 1000)`. Bersihkan saat unmount.
- Tangani marker yang statusnya berubah jadi `arrived/not_started` -> remove dari peta.
- Performa: jumlah kereta puluhan, aman. Jangan recreate marker tiap tick, cukup `setLngLat` + update rotasi.

---

## 13. State Machine Status Kereta

```
not_operating_today  (hari ini tidak di daysOfOperation)
        │
        ▼ (hari operasi)
not_started ──(elapsed>=0)──▶ dwelling@origin ──▶ in_transit ──▶ dwelling@stasiun ──▶ ... ──▶ arrived
                                   ▲___________________│  (bergantian per stop)
```

- `not_started`: `elapsed < 0` pada instance hari operasi.
- `arrived`: `elapsed > totalJourneyMin`.
- `dwelling`: `arrOff <= elapsed <= depOff` di suatu stasiun.
- `in_transit`: `depOff[i] < elapsed < arrOff[i+1]`.

---

## 14. Sumber Data & Tugas Data Prep

> Tanpa data yang benar, produk tidak berguna. Ini pekerjaan kritis.

### 14.1 Yang dibutuhkan
1. **Jadwal GAPEKA 2025** untuk semua KA yang lewat PWT (semua stops + waktu tiba/berangkat).
2. **Koordinat stasiun** (lat/lng) untuk semua stasiun di rute tersebut.
3. **Geometri rel** antar stasiun (opsional, fallback garis lurus).

### 14.2 Sumber yang boleh dipakai
- Jadwal resmi KAI (web/app KAI Access untuk verifikasi jadwal publik) - **hanya baca jadwal publik, JANGAN scraping data live/posisi (melanggar ToS)**.
- Komunitas railfans / GAPEKA 2025 yang beredar publik.
- 168Railway sebagai pembanding cek kelengkapan (jangan copy data mentah, verifikasi sendiri).
- **Koordinat stasiun:** OpenStreetMap (node `railway=station`).
- **Geometri rel:** OpenStreetMap (`railway=rail`) via Overpass API, ekstrak koridor lintas selatan; sederhanakan jadi polyline per pasangan stasiun. Kalau berat, **skip dulu, pakai garis lurus**.

### 14.3 Strategi bertahap
1. **Tahap 1 (cepat):** input manual 5-10 kereta populer lewat PWT + stasiun-stasiunnya, garis lurus. Cukup untuk membangun & menguji seluruh aplikasi.
2. **Tahap 2:** lengkapi semua kereta yang lewat PWT.
3. **Tahap 3 (opsional):** tambah geometri rel OSM untuk posisi yang lebih ngepas.

### 14.4 Validasi data (wajib)
- Tiap train: stops urut waktu naik, origin punya `departure`, destination punya `arrival`, PWT ada di stops.
- Tulis script validasi sederhana di `scripts/build-data.ts` atau test.

### 14.5 Open questions data (perlu keputusan pemilik produk)
- Sumber unduh GAPEKA 2025 final yang dipakai? (akurasi jadwal = kepercayaan produk)
- Repo GitHub: public atau private? (kalau public, pastikan data tidak melanggar lisensi sumber)
- Nama domain: subdomain Vercel dulu, atau beli domain sebelum launch?

---

## 15. Non-Functional Requirements

- **Mobile-first & responsive** (uji di lebar 360px dulu).
- **Performa:** TTI cepat; map init < 2 detik di koneksi normal; update marker tidak nge-lag (puluhan marker).
- **Akurasi waktu:** semua perhitungan dalam WIB; konsisten lintas device.
- **Aksesibilitas dasar:** kontras warna cukup, target tap >= 44px.
- **PWA (opsional, nice-to-have):** installable + offline shell. Tidak wajib MVP.
- **SEO dasar** untuk halaman detail kereta (judul dinamis) - bagus untuk akuisisi organik.
- **Disclaimer estimasi** muncul di semua tampilan posisi (legal & kepercayaan).

---

## 16. Roadmap / Milestone (8 minggu menuju 21 Juli 2026)

Disesuaikan dengan posisi sekarang (28 Mei, di belakang jadwal). Asumsi part-time + koding bareng Claude.

| Periode | Fokus | Deliverable |
|---|---|---|
| Minggu 0: 28 Mei - 1 Jun | Setup repo, scaffold Next.js+TS+Tailwind, tulis `types.ts/time.ts/geo.ts/position.ts` + unit test, data Tahap 1 (5-10 KA), peta dasar render marker stasiun | Foundation jalan, peta tampil |
| Minggu 1-2: 2 - 15 Jun | Marker kereta bergerak (loop 1s), route layer, halaman Detail Kereta, Papan Stasiun PWT | 3 halaman inti fungsional |
| Minggu 3: 16 - 22 Jun | Daftar+Search, filter, navigasi, polish UX, responsive | Aplikasi fitur-lengkap |
| Minggu 4: 23 - 29 Jun | Lengkapi data semua KA lewat PWT (Tahap 2), validasi data, QA internal | Data lengkap + QA |
| Minggu 5-6: 30 Jun - 13 Jul | Closed beta ~20-50 railfans, kumpulkan feedback, bugfix, iterasi UX | Feedback + perbaikan |
| Minggu 7: 14 - 20 Jul | Polish akhir, landing page, deploy production, monitoring | Siap launch |
| 21 Jul | Soft launch publik | LIVE |

**Sequencing koding yang disarankan (penting):** bangun `lib/` (algoritma + helper) + unit test **sebelum** UI. Logika posisi adalah inti; kalau ini solid, UI tinggal konsumsi.

---

## 17. Definition of Done (MVP)

- [ ] Peta menampilkan posisi estimasi semua KA yang sedang berjalan & lewat PWT, update tiap detik.
- [ ] Klik kereta -> detail dengan rute, jadwal stops, status, ETA PWT.
- [ ] Papan Stasiun PWT (kedatangan & keberangkatan) dengan status estimasi.
- [ ] Daftar + search + filter kereta.
- [ ] Semua tampilan posisi punya disclaimer estimasi.
- [ ] Responsive di mobile (360px) sampai desktop.
- [ ] Unit test algoritma posisi hijau (6 skenario di 8.5).
- [ ] Data semua KA lewat PWT lengkap & tervalidasi.
- [ ] Deploy di Vercel, bisa diakses publik.

---

## 18. Fase 6 (Pasca-MVP, opsional - hanya jika ada traksi)

- Crowdsource GPS: user railfans share lokasi saat naik kereta (model 168Railway).
- Tambah Supabase (Postgres): tabel kontribusi posisi, agregasi, anti-abuse.
- Akun pengguna ringan.
- Koreksi posisi real berdasarkan GPS (blend dengan estimasi GAPEKA).
- Arsitektur sekarang sudah disiapkan: `lib/trains.ts` jadi titik ganti dari static JSON ke API.

---

## 19. Glosarium

| Istilah | Arti |
|---|---|
| GAPEKA | Grafik Perjalanan Kereta Api - jadwal resmi tahunan KAI |
| PWT | Kode stasiun Purwokerto |
| dwelling | Kereta sedang berhenti di stasiun |
| in_transit | Kereta sedang berjalan antar stasiun |
| dayOffset | Penanda hari untuk stop (0 = hari berangkat, 1 = hari berikutnya) |
| bearing | Arah hadap (derajat 0-360) untuk rotasi ikon kereta |
| segment | Ruas rel antara dua stasiun berurutan |

---

## Lampiran A: Perintah Setup Awal (referensi)

```bash
pnpm create next-app@latest train-tracker --typescript --tailwind --app --eslint
cd train-tracker
pnpm add maplibre-gl
pnpm add -D vitest @types/node
# init data files kosong di /data, lalu isi sesuai Bab 7
```

## Lampiran B: Checklist sebelum mulai koding
1. Konfirmasi sumber GAPEKA 2025 (Bab 14.5).
2. Putuskan repo public/private + domain.
3. Siapkan `data/stations.json` & `data/trains.json` Tahap 1 (5-10 KA lewat PWT) - verifikasi koordinat & jadwal.
4. Bangun `lib/` + unit test dulu, baru UI.
```
```
```

*Dokumen ini companion untuk koding. Saat ada keputusan baru, update Bab 5 (LOCKED decisions) dan DECISIONS.md di repo.*
