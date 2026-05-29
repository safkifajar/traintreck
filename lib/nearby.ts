import type { Station, Train } from "./types";
import { hhmmToMinutes, nowWib } from "./time";
import { projectPointToSegment, haversine } from "./geo";

export interface NearbyTrain {
  train: Train;
  // segmen tempat kereta lewat paling dekat dengan user
  fromStationId: string;
  toStationId: string;
  // jarak (meter) titik user ke rel segmen tsb
  distanceToRailMeters: number;
  // menit menuju kereta melewati titik terdekat user; >=0 (mendatang)
  etaMin: number;
  passHhmm: string; // perkiraan jam lewat (HH:MM)
}

const MAX_RAIL_DISTANCE_M = 5000; // hanya relevan bila user <5km dari rel

// Offset menit tiap stop relatif keberangkatan origin (seperti position.ts).
function stopOffsets(train: Train): { arr: (number | null)[]; dep: (number | null)[]; total: number } {
  const originDep = hhmmToMinutes(train.stops[0].departure!);
  const arr = train.stops.map((s) =>
    s.arrival != null ? s.dayOffset * 1440 + hhmmToMinutes(s.arrival) - originDep : null
  );
  const dep = train.stops.map((s) =>
    s.departure != null ? s.dayOffset * 1440 + hhmmToMinutes(s.departure) - originDep : null
  );
  const total = arr[arr.length - 1] ?? 0;
  return { arr, dep, total };
}

// elapsed (menit sejak origin dep) pada instance aktif hari ini/kemarin; null bila tak aktif.
function activeElapsed(train: Train, now: Date): number | null {
  const wib = nowWib(now);
  const originDep = hhmmToMinutes(train.stops[0].departure!);
  const { total } = stopOffsets(train);
  for (const shift of [0, -1]) {
    const elapsed = wib.minutesOfDay - originDep - shift * 1440;
    const depDow = ((((wib.dow - shift) % 7) + 7) % 7) as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    if (elapsed >= 0 && elapsed <= total && train.daysOfOperation.includes(depDow)) {
      return elapsed;
    }
  }
  return null;
}

// Cari kereta yang akan melewati titik user, urut ETA terdekat.
export function getTrainsPassingNear(
  userLat: number,
  userLng: number,
  trains: Train[],
  stationsById: Record<string, Station>,
  now: Date = new Date()
): NearbyTrain[] {
  const p: [number, number] = [userLng, userLat];
  const result: NearbyTrain[] = [];

  for (const train of trains) {
    const elapsed = activeElapsed(train, now);
    if (elapsed == null) continue; // hanya kereta yang sedang dalam window perjalanan
    const { arr, dep } = stopOffsets(train);

    // Cari segmen terdekat dari titik user.
    let best: {
      i: number;
      t: number;
      dist: number;
    } | null = null;
    for (let i = 0; i < train.stops.length - 1; i++) {
      const a = stationsById[train.stops[i].stationId];
      const b = stationsById[train.stops[i + 1].stationId];
      if (!a || !b) continue;
      const { t, distance } = projectPointToSegment(
        p,
        [a.lng, a.lat],
        [b.lng, b.lat]
      );
      if (!best || distance < best.dist) best = { i, t, dist: distance };
    }
    if (!best || best.dist > MAX_RAIL_DISTANCE_M) continue;

    // Waktu kereta melewati titik = interpolasi dep[i] -> arr[i+1] pada fraksi t.
    const depI = dep[best.i];
    const arrNext = arr[best.i + 1];
    if (depI == null || arrNext == null) continue;
    const passOff = depI + (arrNext - depI) * best.t;
    const etaMin = passOff - elapsed;
    if (etaMin < 0) continue; // sudah lewat titik ini

    // Jam lewat perkiraan (WIB).
    const originDep = hhmmToMinutes(train.stops[0].departure!);
    const absMin = (((originDep + passOff) % 1440) + 1440) % 1440;
    const passHhmm = `${String(Math.floor(absMin / 60)).padStart(2, "0")}:${String(
      Math.round(absMin % 60)
    ).padStart(2, "0")}`;

    result.push({
      train,
      fromStationId: train.stops[best.i].stationId,
      toStationId: train.stops[best.i + 1].stationId,
      distanceToRailMeters: Math.round(best.dist),
      etaMin: Math.round(etaMin),
      passHhmm,
    });
  }

  return result.sort((a, b) => a.etaMin - b.etaMin);
}

// Stasiun terdekat dari titik (untuk konteks tampilan).
export function nearestStation(
  userLat: number,
  userLng: number,
  stations: Station[]
): { station: Station; distanceMeters: number } | null {
  let best: { station: Station; distanceMeters: number } | null = null;
  for (const s of stations) {
    const d = haversine([userLng, userLat], [s.lng, s.lat]);
    if (!best || d < best.distanceMeters)
      best = { station: s, distanceMeters: Math.round(d) };
  }
  return best;
}
