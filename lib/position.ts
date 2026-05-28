import type {
  DayOfWeek,
  SegmentGeometry,
  Station,
  Train,
  TrainPosition,
} from "./types";
import { hhmmToMinutes, nowWib } from "./time";
import { pointAlong } from "./geo";

export const PWT_CODE = "PWT";

// Ambil polyline rel antar dua stasiun. Pakai geometri asli bila ada di
// segments (key `${fromId}-${toId}`), jika tidak fallback garis lurus.
export function getSegmentCoords(
  from: Station,
  to: Station,
  segments: Record<string, SegmentGeometry>
): [number, number][] {
  const seg = segments[`${from.id}-${to.id}`];
  if (seg && seg.coordinates.length >= 2) return seg.coordinates;
  return [
    [from.lng, from.lat],
    [to.lng, to.lat],
  ];
}

interface StopCalc {
  stationId: string;
  arrOff: number | null; // menit sejak origin departure
  depOff: number | null;
}

// menit menuju tiba di PWT; 0 bila sedang berhenti di PWT;
// null bila sudah berangkat dari PWT atau PWT tidak ada di rute.
function etaToPwt(calc: StopCalc[], elapsed: number): number | null {
  const pwt = calc.find((c) => c.stationId === PWT_CODE);
  if (!pwt || pwt.arrOff == null) return null;
  // Masih sedang berhenti di PWT (antara tiba dan berangkat) -> 0.
  if (pwt.depOff != null && elapsed >= pwt.arrOff && elapsed <= pwt.depOff) {
    return 0;
  }
  const eta = pwt.arrOff - elapsed;
  return eta >= 0 ? eta : null;
}

export function computeTrainPosition(
  train: Train,
  stationsById: Record<string, Station>,
  segments: Record<string, SegmentGeometry>,
  now: Date = new Date()
): TrainPosition {
  const wib = nowWib(now);
  // origin pasti punya departure
  const originDepMin = hhmmToMinutes(train.stops[0].departure!);

  // 1. Offset menit tiap stop relatif terhadap keberangkatan origin.
  const calc: StopCalc[] = train.stops.map((s) => ({
    stationId: s.stationId,
    arrOff:
      s.arrival != null
        ? s.dayOffset * 1440 + hhmmToMinutes(s.arrival) - originDepMin
        : null,
    depOff:
      s.departure != null
        ? s.dayOffset * 1440 + hhmmToMinutes(s.departure) - originDepMin
        : null,
  }));
  const totalJourneyMin = calc[calc.length - 1].arrOff!;

  // 2. Kandidat instance: berangkat HARI INI (dayShift 0) atau KEMARIN (-1).
  //    Kemarin perlu untuk KA yang masih berjalan melewati tengah malam.
  const candidates = [0, -1].map((dayShift) => {
    const elapsed = wib.minutesOfDay - originDepMin - dayShift * 1440;
    const depDow = ((((wib.dow - dayShift) % 7) + 7) % 7) as DayOfWeek;
    return { elapsed, depDow };
  });

  const active = candidates.find(
    (c) =>
      c.elapsed >= 0 &&
      c.elapsed <= totalJourneyMin &&
      train.daysOfOperation.includes(c.depDow)
  );

  // 3. Tidak ada instance aktif -> not_started / arrived / not_operating_today.
  if (!active) {
    const today = candidates[0];
    if (
      !train.daysOfOperation.includes(today.depDow) &&
      !train.daysOfOperation.includes(candidates[1].depDow)
    ) {
      return { trainId: train.id, status: "not_operating_today" };
    }
    if (today.elapsed < 0 && train.daysOfOperation.includes(today.depDow)) {
      return { trainId: train.id, status: "not_started" };
    }
    return { trainId: train.id, status: "arrived" };
  }

  const elapsed = active.elapsed;

  // 4. Tentukan posisi: dwelling di stasiun, atau in_transit di segmen.
  for (let i = 0; i < calc.length; i++) {
    const s = calc[i];
    // dwelling: berada di antara kedatangan & keberangkatan stasiun i
    if (
      s.arrOff != null &&
      s.depOff != null &&
      elapsed >= s.arrOff &&
      elapsed <= s.depOff
    ) {
      const st = stationsById[s.stationId];
      const next = calc[i + 1];
      return {
        trainId: train.id,
        status: "dwelling",
        atStationId: s.stationId,
        lat: st.lat,
        lng: st.lng,
        bearing: 0,
        nextStationId: next?.stationId,
        etaNextStationMin:
          next?.arrOff != null ? Math.max(0, next.arrOff - elapsed) : undefined,
        etaPurwokertoMin: etaToPwt(calc, elapsed),
      };
    }
    // in_transit: antara keberangkatan i dan kedatangan i+1
    const next = calc[i + 1];
    if (
      s.depOff != null &&
      next?.arrOff != null &&
      elapsed > s.depOff &&
      elapsed < next.arrOff
    ) {
      const progress = (elapsed - s.depOff) / (next.arrOff - s.depOff);
      const coords = getSegmentCoords(
        stationsById[s.stationId],
        stationsById[next.stationId],
        segments
      );
      const p = pointAlong(coords, progress);
      return {
        trainId: train.id,
        status: "in_transit",
        fromStationId: s.stationId,
        toStationId: next.stationId,
        progress,
        lat: p.lat,
        lng: p.lng,
        bearing: p.bearing,
        nextStationId: next.stationId,
        etaNextStationMin: Math.max(0, next.arrOff - elapsed),
        etaPurwokertoMin: etaToPwt(calc, elapsed),
      };
    }
  }

  // fallback aman (mis. tepat di boundary akhir): anggap sudah tiba.
  return { trainId: train.id, status: "arrived" };
}
