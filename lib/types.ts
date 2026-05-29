// Hari operasi: 0 = Minggu ... 6 = Sabtu (mengikuti Date.getDay)
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Station {
  id: string; // kode stasiun, mis. "PWT", "GMR"
  name: string; // "Purwokerto"
  lat: number;
  lng: number;
  line: string; // "lintas-selatan" (untuk grouping/geometry)
  isMajor?: boolean; // tampilkan label di zoom rendah
}

export interface Stop {
  stationId: string;
  arrival: string | null; // "HH:MM" WIB, null untuk stasiun awal
  departure: string | null; // "HH:MM" WIB, null untuk stasiun akhir
  dayOffset: number; // 0 = hari berangkat, 1 = hari berikutnya (untuk KA lintas tengah malam)
}

export type TrainClass =
  | "Eksekutif"
  | "Campuran"
  | "Bisnis"
  | "Ekonomi"
  | "Lokal";

// Jenis perjalanan: penumpang (komersial), barang (angkutan), dinas (KLB non-komersial).
export type TrainCategory = "penumpang" | "barang" | "dinas";

export interface Train {
  id: string; // nomor KA, mis. "7017" (unik per perjalanan)
  name: string; // "Argo Dwipangga"
  class: TrainClass;
  category?: TrainCategory; // jenis perjalanan; default "penumpang" bila absen
  operator: string; // "KAI"
  originId: string; // kode stasiun awal
  destinationId: string; // kode stasiun akhir
  daysOfOperation: DayOfWeek[]; // [0,1,2,3,4,5,6] = harian
  stops: Stop[]; // urut dari awal ke akhir, WAJIB mengandung PWT
  color?: string; // override warna marker (opsional)
}

// Geometri rel antar dua stasiun berurutan. Key = `${fromId}-${toId}`.
// Koordinat format [lng, lat] (urutan GeoJSON).
export interface SegmentGeometry {
  key: string; // "GMR-JNG" dst (boleh disederhanakan jadi antar stasiun besar)
  coordinates: [number, number][];
}

export type TrainStatus =
  | "in_transit" // sedang jalan antar dua stasiun
  | "dwelling" // berhenti di stasiun
  | "not_started" // belum berangkat hari ini
  | "arrived" // sudah tiba di tujuan
  | "not_operating_today"; // hari ini tidak beroperasi

export interface TrainPosition {
  trainId: string;
  status: TrainStatus;
  lat?: number; // ada untuk in_transit & dwelling
  lng?: number;
  bearing?: number; // 0-360 derajat, untuk rotasi ikon
  fromStationId?: string; // segmen saat in_transit
  toStationId?: string;
  progress?: number; // 0..1 dalam segmen (berbasis waktu)
  atStationId?: string; // saat dwelling
  nextStationId?: string;
  etaNextStationMin?: number; // menit menuju kedatangan stasiun berikutnya
  etaPurwokertoMin?: number | null; // menit menuju tiba di PWT (null bila sudah lewat)
}
