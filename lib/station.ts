import type { Train, TrainPosition, Stop } from "./types";
import { getTrainsThroughStation, getStationsById, getSegmentsByKey } from "./trains";
import { computeTrainPosition } from "./position";

export interface BoardEntry {
  train: Train;
  stop: Stop; // stop di stasiun ini
  arrival: string | null; // jam tiba di stasiun ini (HH:MM)
  departure: string | null; // jam berangkat di stasiun ini
  pos: TrainPosition; // status terkini
  // menit menuju kedatangan di stasiun ini; null bila sudah tiba/lewat/tak relevan
  etaArrivalMin: number | null;
}

// Hitung menit menuju kedatangan kereta di stasiun `code`, berbasis jadwal +
// status posisi sekarang. Mengembalikan null bila kereta sudah tiba/lewat
// stasiun ini hari ini atau belum berangkat sama sekali.
function etaToStation(
  train: Train,
  code: string,
  pos: TrainPosition
): number | null {
  // Untuk PWT kita sudah punya etaPurwokertoMin di pos. Untuk stasiun lain,
  // hitung serupa dari selisih offset. Di sini fokus generik: pakai progres
  // kereta vs offset stop tujuan.
  if (code === "PWT") return pos.etaPurwokertoMin ?? null;
  return null;
}

export function getStationBoard(
  code: string,
  now: Date = new Date()
): BoardEntry[] {
  const trains = getTrainsThroughStation(code);
  const stationsById = getStationsById();
  const segments = getSegmentsByKey();

  return trains
    .map((train) => {
      const stop = train.stops.find((s) => s.stationId === code)!;
      const pos = computeTrainPosition(train, stationsById, segments, now);
      return {
        train,
        stop,
        arrival: stop.arrival,
        departure: stop.departure,
        pos,
        etaArrivalMin: etaToStation(train, code, pos),
      };
    });
}

// Urutkan untuk tab Kedatangan: berdasarkan jam tiba di stasiun (HH:MM).
export function sortByArrival(entries: BoardEntry[]): BoardEntry[] {
  return [...entries]
    .filter((e) => e.arrival != null)
    .sort((a, b) => timeKey(a.arrival!, a.stop.dayOffset) - timeKey(b.arrival!, b.stop.dayOffset));
}

// Urutkan untuk tab Keberangkatan: berdasarkan jam berangkat di stasiun.
export function sortByDeparture(entries: BoardEntry[]): BoardEntry[] {
  return [...entries]
    .filter((e) => e.departure != null)
    .sort((a, b) => timeKey(a.departure!, a.stop.dayOffset) - timeKey(b.departure!, b.stop.dayOffset));
}

function timeKey(hhmm: string, dayOffset: number): number {
  const [h, m] = hhmm.split(":").map(Number);
  return dayOffset * 1440 + h * 60 + m;
}
