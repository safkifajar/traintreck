import type { Train, TrainPosition, Stop } from "./types";
import { hhmmToMinutes, nowWib } from "./time";

export type StopState = "passed" | "current" | "upcoming";

export interface StopView {
  stop: Stop;
  state: StopState;
  isPwt: boolean;
}

// Tentukan state tiap stop relatif posisi sekarang.
// Pakai elapsed (menit sejak origin departure) yang direkonstruksi dari pos.
// Sederhana & robust: tentukan dari status + from/at/next station.
export function buildStopViews(
  train: Train,
  pos: TrainPosition,
  now: Date = new Date()
): StopView[] {
  const stops = train.stops;

  // Hitung elapsed untuk membandingkan tiap offset stop (sama seperti position.ts).
  const wib = nowWib(now);
  const originDepMin = hhmmToMinutes(stops[0].departure!);
  const offsets = stops.map((s) => {
    const ref = s.arrival ?? s.departure!;
    return s.dayOffset * 1440 + hhmmToMinutes(ref) - originDepMin;
  });

  // elapsed pada instance aktif. Bila tidak in_transit/dwelling, perkirakan
  // dari jam sekarang vs origin (instance hari ini atau kemarin).
  let elapsed: number | null = null;
  if (pos.status === "in_transit" || pos.status === "dwelling") {
    // cari instance: today / yesterday yang membuat elapsed di rentang.
    const total = offsets[offsets.length - 1];
    for (const shift of [0, -1]) {
      const e = wib.minutesOfDay - originDepMin - shift * 1440;
      if (e >= 0 && e <= total) {
        elapsed = e;
        break;
      }
    }
  } else if (pos.status === "arrived") {
    elapsed = Infinity;
  } else {
    elapsed = -Infinity; // not_started / not_operating
  }

  return stops.map((stop, i) => {
    const isPwt = stop.stationId === "PWT";
    let state: StopState = "upcoming";
    if (elapsed === Infinity) {
      state = "passed";
    } else if (elapsed === -Infinity) {
      state = "upcoming";
    } else if (elapsed != null) {
      const arrOff = stop.arrival != null ? offsets[i] : null;
      const depOff =
        stop.departure != null
          ? stop.dayOffset * 1440 + hhmmToMinutes(stop.departure) - originDepMin
          : null;
      // current: sedang dwelling di sini, atau sedang transit menuju sini.
      if (pos.status === "dwelling" && pos.atStationId === stop.stationId) {
        state = "current";
      } else if (
        pos.status === "in_transit" &&
        pos.toStationId === stop.stationId
      ) {
        state = "current";
      } else {
        const ref = depOff ?? arrOff ?? offsets[i];
        state = ref <= elapsed ? "passed" : "upcoming";
      }
    }
    return { stop, state, isPwt };
  });
}
