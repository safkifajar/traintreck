import type { TrainClass, TrainStatus, TrainPosition, Train } from "./types";

// Palet warna per kelas kereta (PRD Bab 9.6).
export const CLASS_COLORS: Record<TrainClass, string> = {
  Eksekutif: "#1565C0",
  Campuran: "#6A1B9A",
  Bisnis: "#2E7D32",
  Ekonomi: "#EF6C00",
  Lokal: "#455A64",
};

export function classColor(c: TrainClass): string {
  return CLASS_COLORS[c];
}

// Label status ringkas (untuk badge).
export function statusLabel(status: TrainStatus): string {
  switch (status) {
    case "in_transit":
      return "Dalam perjalanan";
    case "dwelling":
      return "Berhenti di stasiun";
    case "not_started":
      return "Belum berangkat";
    case "arrived":
      return "Sudah tiba";
    case "not_operating_today":
      return "Tidak beroperasi";
  }
}

// Warna badge status (kontras cukup, teks putih).
export function statusColor(status: TrainStatus): string {
  switch (status) {
    case "in_transit":
      return "#2563eb"; // biru
    case "dwelling":
      return "#d97706"; // amber
    case "not_started":
      return "#64748b"; // slate
    case "arrived":
      return "#16a34a"; // hijau
    case "not_operating_today":
      return "#9ca3af"; // abu
  }
}

// Apakah kereta sedang tampil di peta (punya posisi).
export function isLive(status: TrainStatus): boolean {
  return status === "in_transit" || status === "dwelling";
}

// Deskripsi ETA Purwokerto untuk ringkasan.
export function etaPwtText(pos: TrainPosition): string {
  if (pos.etaPurwokertoMin == null) return "Sudah melewati Purwokerto";
  if (pos.etaPurwokertoMin === 0) return "Sedang di Purwokerto";
  return `Tiba PWT ~${pos.etaPurwokertoMin} menit lagi`;
}

// Status terkini verbose untuk halaman detail (PRD Bab 9.2).
export function detailStatusText(
  pos: TrainPosition,
  nameById: Record<string, string>,
  originId: string,
  originDeparture: string | null,
  destId: string
): string {
  const name = (id?: string) => (id ? (nameById[id] ?? id) : "");
  switch (pos.status) {
    case "in_transit":
      return `Dalam perjalanan, perkiraan antara ${name(pos.fromStationId)} dan ${name(pos.toStationId)}`;
    case "dwelling":
      return `Berhenti di Stasiun ${name(pos.atStationId)}`;
    case "not_started":
      return `Belum berangkat (berangkat ${originDeparture ?? "-"} dari ${name(originId)})`;
    case "arrived":
      return `Sudah tiba di ${name(destId)}`;
    case "not_operating_today":
      return "Tidak beroperasi hari ini";
  }
}

// Deskripsi status untuk papan stasiun (relatif terhadap kedatangan di stasiun).
// etaArrivalMin: menit menuju tiba di stasiun ini (null bila tak relevan).
export function boardStatusText(
  pos: TrainPosition,
  etaArrivalMin: number | null,
  isOriginHere: boolean
): string {
  if (pos.status === "not_operating_today") return "Tidak beroperasi hari ini";
  if (pos.status === "arrived") return "Perjalanan selesai";
  if (isOriginHere && pos.status === "not_started") return "Belum berangkat (mulai dari sini)";
  if (pos.status === "not_started") return "Belum berangkat dari asal";
  if (etaArrivalMin != null) {
    if (etaArrivalMin === 0) return "Sedang di stasiun";
    if (etaArrivalMin <= 60) return `Tiba ~${etaArrivalMin} menit lagi`;
    return `Perkiraan tiba ~${Math.round(etaArrivalMin / 60)} jam lagi`;
  }
  // eta null tapi sedang jalan -> kemungkinan sudah lewat stasiun ini
  if (pos.status === "in_transit" || pos.status === "dwelling")
    return "Sudah melewati stasiun";
  return statusLabel(pos.status);
}

// Normalisasi string untuk pencarian: lowercase + hapus spasi.
export function normalizeSearch(s: string): string {
  return s.toLowerCase().replace(/\s+/g, "");
}

// Arah perjalanan kasar untuk filter (barat = ke Jakarta, timur = ke Surabaya/Solo).
// Heuristik: bandingkan bujur origin vs destination via stops.
export type Direction = "barat" | "timur";

export function trainDirection(
  train: Train,
  lngById: Record<string, number>
): Direction {
  const originLng = lngById[train.originId];
  const destLng = lngById[train.destinationId];
  if (originLng == null || destLng == null) return "timur";
  return destLng >= originLng ? "timur" : "barat";
}
