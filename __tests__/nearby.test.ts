import { describe, it, expect } from "vitest";
import { projectPointToSegment } from "@/lib/geo";
import { getTrainsPassingNear, nearestStation } from "@/lib/nearby";
import type { Station, Train, DayOfWeek } from "@/lib/types";

describe("projectPointToSegment", () => {
  const a: [number, number] = [109.0, -7.4];
  const b: [number, number] = [109.2, -7.4]; // horizontal ke timur

  it("titik di tengah segmen -> t~0.5, jarak kecil", () => {
    const mid: [number, number] = [109.1, -7.4];
    const r = projectPointToSegment(mid, a, b);
    expect(r.t).toBeCloseTo(0.5, 1);
    expect(r.distance).toBeLessThan(50);
  });

  it("titik di luar (sebelum a) -> t=0 (clamped)", () => {
    const before: [number, number] = [108.8, -7.4];
    const r = projectPointToSegment(before, a, b);
    expect(r.t).toBe(0);
  });

  it("titik melenceng ke utara -> jarak > 0", () => {
    const off: [number, number] = [109.1, -7.35];
    const r = projectPointToSegment(off, a, b);
    expect(r.distance).toBeGreaterThan(1000);
  });
});

// Fixture: rute A(09:00 dep) -> B(arr 10:00) garis lurus, user dekat tengah segmen.
const stationsById: Record<string, Station> = {
  A: { id: "A", name: "A", lat: -7.4, lng: 109.0, line: "x" },
  B: { id: "B", name: "B", lat: -7.4, lng: 109.2, line: "x" },
  PWT: { id: "PWT", name: "Purwokerto", lat: -7.4196, lng: 109.2218, line: "x" },
};
const ALL_DAYS: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];
const train: Train = {
  id: "T1",
  name: "Uji",
  class: "Ekonomi",
  operator: "KAI",
  originId: "A",
  destinationId: "B",
  daysOfOperation: ALL_DAYS,
  stops: [
    { stationId: "A", arrival: null, departure: "09:00", dayOffset: 0 },
    { stationId: "B", arrival: "10:00", departure: null, dayOffset: 0 },
  ],
};

function wibDate(h: number, m: number): Date {
  // 2026-05-28 (Kamis) jam WIB -> UTC (WIB-7)
  return new Date(Date.UTC(2026, 4, 28, h - 7, m));
}

describe("getTrainsPassingNear", () => {
  it("user di tengah segmen, jam 09:00 -> kereta lewat ~30 menit lagi", () => {
    // titik tengah A-B (109.1, -7.4); kereta lewat tengah pada 09:30.
    const res = getTrainsPassingNear(-7.4, 109.1, [train], stationsById, wibDate(9, 0));
    expect(res.length).toBe(1);
    expect(res[0].etaMin).toBeGreaterThanOrEqual(28);
    expect(res[0].etaMin).toBeLessThanOrEqual(32);
    expect(res[0].passHhmm).toBe("09:30");
    expect(res[0].distanceToRailMeters).toBeLessThan(50);
  });

  it("user jauh dari rel (>5km) -> tidak muncul", () => {
    const res = getTrainsPassingNear(-7.0, 109.1, [train], stationsById, wibDate(9, 0));
    expect(res.length).toBe(0);
  });

  it("kereta sudah lewat titik -> tidak muncul", () => {
    // jam 09:45, kereta lewat tengah 09:30 -> sudah lewat
    const res = getTrainsPassingNear(-7.4, 109.1, [train], stationsById, wibDate(9, 45));
    expect(res.length).toBe(0);
  });
});

describe("nearestStation", () => {
  it("kembalikan stasiun terdekat", () => {
    const r = nearestStation(-7.4196, 109.2218, Object.values(stationsById));
    expect(r?.station.id).toBe("PWT");
  });
});
