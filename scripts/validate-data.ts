// Validasi data statis sesuai PRD Bab 14.4.
// CATATAN: data/trains.json saat ini adalah PLACEHOLDER (jadwal estimasi,
// bukan GAPEKA 2025 resmi). Koordinat stasiun dari OpenStreetMap (faktual).
// Ganti isi trains.json dengan jadwal resmi saat tersedia; validator ini tetap berlaku.
import type { Station, Train } from "@/lib/types";
import { hhmmToMinutes } from "@/lib/time";
import { PWT_CODE } from "@/lib/position";

export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

export function validateData(
  stations: Station[],
  trains: Train[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const stationIds = new Set(stations.map((s) => s.id));

  // Stasiun: id unik, koordinat valid.
  const seenStation = new Set<string>();
  for (const s of stations) {
    if (seenStation.has(s.id)) errors.push(`Stasiun duplikat: ${s.id}`);
    seenStation.add(s.id);
    if (s.lat < -11 || s.lat > 6) errors.push(`${s.id}: lat di luar Indonesia (${s.lat})`);
    if (s.lng < 95 || s.lng > 141) errors.push(`${s.id}: lng di luar Indonesia (${s.lng})`);
  }
  if (!stationIds.has(PWT_CODE)) errors.push(`Stasiun ${PWT_CODE} (Purwokerto) tidak ada di stations.json`);

  // Kereta.
  const seenTrain = new Set<string>();
  for (const t of trains) {
    const tag = `KA ${t.id} (${t.name})`;
    if (seenTrain.has(t.id)) errors.push(`${tag}: id KA duplikat`);
    seenTrain.add(t.id);

    if (t.stops.length < 2) {
      errors.push(`${tag}: butuh minimal 2 stops`);
      continue;
    }

    // Origin punya departure, destination punya arrival.
    const first = t.stops[0];
    const last = t.stops[t.stops.length - 1];
    if (first.departure == null) errors.push(`${tag}: stasiun awal (${first.stationId}) wajib punya departure`);
    if (last.arrival == null) errors.push(`${tag}: stasiun akhir (${last.stationId}) wajib punya arrival`);
    if (first.stationId !== t.originId) warnings.push(`${tag}: originId (${t.originId}) != stop pertama (${first.stationId})`);
    if (last.stationId !== t.destinationId) warnings.push(`${tag}: destinationId (${t.destinationId}) != stop terakhir (${last.stationId})`);

    // Semua stationId dikenal.
    for (const s of t.stops) {
      if (!stationIds.has(s.stationId)) errors.push(`${tag}: stationId tak dikenal: ${s.stationId}`);
    }

    // PWT wajib ada di rute (scope MVP).
    if (!t.stops.some((s) => s.stationId === PWT_CODE)) {
      errors.push(`${tag}: rute tidak melewati ${PWT_CODE}`);
    }

    // daysOfOperation tidak kosong & valid.
    if (t.daysOfOperation.length === 0) errors.push(`${tag}: daysOfOperation kosong`);
    for (const d of t.daysOfOperation) {
      if (d < 0 || d > 6) errors.push(`${tag}: hari operasi tak valid: ${d}`);
    }

    // Stops urut waktu naik (pakai dayOffset*1440 + menit).
    let prevAbs = -Infinity;
    for (const s of t.stops) {
      for (const [label, val] of [
        ["arrival", s.arrival],
        ["departure", s.departure],
      ] as const) {
        if (val == null) continue;
        const abs = s.dayOffset * 1440 + hhmmToMinutes(val);
        if (abs < prevAbs) {
          errors.push(`${tag}: waktu mundur di ${s.stationId} (${label} ${val}, dayOffset ${s.dayOffset})`);
        }
        prevAbs = abs;
      }
    }
  }

  return { errors, warnings };
}
