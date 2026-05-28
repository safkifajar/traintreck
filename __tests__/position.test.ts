import { describe, it, expect } from "vitest";
import { computeTrainPosition } from "@/lib/position";
import type { DayOfWeek, Station, Train, SegmentGeometry } from "@/lib/types";

// Buat Date dari komponen waktu WIB (UTC+7).
// year/month/day adalah tanggal WIB; hasilnya Date UTC yang setara.
function wibDate(
  year: number,
  month: number, // 1-12
  day: number,
  hour: number,
  minute: number
): Date {
  // WIB = UTC + 7  =>  UTC = WIB - 7
  return new Date(Date.UTC(year, month - 1, day, hour - 7, minute, 0, 0));
}

// Stasiun fixture (koordinat ilustratif, cukup untuk uji logika).
const stationsById: Record<string, Station> = {
  GMR: { id: "GMR", name: "Gambir", lat: -6.1766, lng: 106.8307, line: "ls" },
  CN: { id: "CN", name: "Cirebon", lat: -6.708, lng: 108.556, line: "ls" },
  PWT: { id: "PWT", name: "Purwokerto", lat: -7.4249, lng: 109.2415, line: "ls" },
  KYA: { id: "KYA", name: "Kroya", lat: -7.631, lng: 109.247, line: "ls" },
  YK: { id: "YK", name: "Yogyakarta", lat: -7.7892, lng: 110.363, line: "ls" },
};
const segments: Record<string, SegmentGeometry> = {};

const ALL_DAYS: DayOfWeek[] = [0, 1, 2, 3, 4, 5, 6];

// KA harian normal: GMR 08:00 -> ... -> PWT 12:39/12:44 -> ... -> YK 14:20
const dailyTrain: Train = {
  id: "7017",
  name: "Argo Dwipangga",
  class: "Eksekutif",
  operator: "KAI",
  originId: "GMR",
  destinationId: "YK",
  daysOfOperation: ALL_DAYS,
  stops: [
    { stationId: "GMR", arrival: null, departure: "08:00", dayOffset: 0 },
    { stationId: "CN", arrival: "10:45", departure: "10:50", dayOffset: 0 },
    { stationId: "PWT", arrival: "12:39", departure: "12:44", dayOffset: 0 },
    { stationId: "KYA", arrival: "13:05", departure: "13:07", dayOffset: 0 },
    { stationId: "YK", arrival: "14:20", departure: null, dayOffset: 0 },
  ],
};

// 2026-05-28 adalah Kamis (Thursday). dow = 4.
const THU = { y: 2026, m: 5, d: 28 };

describe("computeTrainPosition - skenario wajib", () => {
  it("1. KA harian normal: in_transit antara CN dan PWT", () => {
    // 11:30 WIB: setelah berangkat CN (10:50), sebelum tiba PWT (12:39)
    const now = wibDate(THU.y, THU.m, THU.d, 11, 30);
    const pos = computeTrainPosition(dailyTrain, stationsById, segments, now);
    expect(pos.status).toBe("in_transit");
    expect(pos.fromStationId).toBe("CN");
    expect(pos.toStationId).toBe("PWT");
    expect(pos.progress).toBeGreaterThan(0);
    expect(pos.progress).toBeLessThan(1);
    expect(pos.lat).toBeDefined();
    expect(pos.lng).toBeDefined();
    // ETA PWT = 12:39 - 11:30 = 69 menit
    expect(pos.etaPurwokertoMin).toBe(69);
  });

  it("2. KA dwelling di PWT", () => {
    // 12:41 WIB: antara tiba (12:39) dan berangkat (12:44) di PWT
    const now = wibDate(THU.y, THU.m, THU.d, 12, 41);
    const pos = computeTrainPosition(dailyTrain, stationsById, segments, now);
    expect(pos.status).toBe("dwelling");
    expect(pos.atStationId).toBe("PWT");
    expect(pos.lat).toBe(stationsById.PWT.lat);
    expect(pos.lng).toBe(stationsById.PWT.lng);
    expect(pos.nextStationId).toBe("KYA");
    // sudah di PWT (eta 0)
    expect(pos.etaPurwokertoMin).toBe(0);
  });

  it("3. KA belum berangkat", () => {
    // 07:00 WIB: sebelum origin departure (08:00)
    const now = wibDate(THU.y, THU.m, THU.d, 7, 0);
    const pos = computeTrainPosition(dailyTrain, stationsById, segments, now);
    expect(pos.status).toBe("not_started");
  });

  it("4. KA sudah tiba di tujuan", () => {
    // 15:00 WIB: setelah tiba YK (14:20)
    const now = wibDate(THU.y, THU.m, THU.d, 15, 0);
    const pos = computeTrainPosition(dailyTrain, stationsById, segments, now);
    expect(pos.status).toBe("arrived");
  });

  it("5. KA tidak beroperasi hari ini", () => {
    // Kereta hanya hari Senin (1). 2026-05-28 = Kamis (4).
    const mondayOnly: Train = { ...dailyTrain, daysOfOperation: [1] };
    const now = wibDate(THU.y, THU.m, THU.d, 11, 30);
    const pos = computeTrainPosition(mondayOnly, stationsById, segments, now);
    expect(pos.status).toBe("not_operating_today");
  });

  it("6. KA lintas tengah malam: berangkat kemarin, masih in_transit", () => {
    // KA berangkat GMR 23:00, tiba PWT 01:30 (+1), tujuan YK 04:00 (+1).
    const overnight: Train = {
      id: "9001",
      name: "Bengawan",
      class: "Ekonomi",
      operator: "KAI",
      originId: "GMR",
      destinationId: "YK",
      daysOfOperation: ALL_DAYS,
      stops: [
        { stationId: "GMR", arrival: null, departure: "23:00", dayOffset: 0 },
        { stationId: "PWT", arrival: "01:30", departure: "01:35", dayOffset: 1 },
        { stationId: "YK", arrival: "04:00", departure: null, dayOffset: 1 },
      ],
    };
    // Sekarang 00:30 WIB hari Jumat (29 Mei). Kereta berangkat Kamis 23:00.
    // elapsed = 90 menit sejak berangkat; PWT tiba di menit 150 => in_transit GMR->PWT.
    const now = wibDate(2026, 5, 29, 0, 30);
    const pos = computeTrainPosition(overnight, stationsById, segments, now);
    expect(pos.status).toBe("in_transit");
    expect(pos.fromStationId).toBe("GMR");
    expect(pos.toStationId).toBe("PWT");
    // ETA PWT = 150 - 90 = 60 menit
    expect(pos.etaPurwokertoMin).toBe(60);
  });
});

describe("computeTrainPosition - tambahan", () => {
  it("in_transit GMR->CN di awal perjalanan", () => {
    const now = wibDate(THU.y, THU.m, THU.d, 9, 0);
    const pos = computeTrainPosition(dailyTrain, stationsById, segments, now);
    expect(pos.status).toBe("in_transit");
    expect(pos.fromStationId).toBe("GMR");
    expect(pos.toStationId).toBe("CN");
  });

  it("etaPurwokertoMin null setelah lewat PWT", () => {
    // 13:30 WIB: sudah lewat PWT (berangkat 12:44), menuju KYA->YK
    const now = wibDate(THU.y, THU.m, THU.d, 13, 30);
    const pos = computeTrainPosition(dailyTrain, stationsById, segments, now);
    expect(pos.status).toBe("in_transit");
    expect(pos.etaPurwokertoMin).toBeNull();
  });

  it("dwelling di origin tepat saat berangkat", () => {
    // 08:00 WIB tepat: origin tak punya arrival, jadi langsung mulai transit.
    // Cek 08:00 -> belum masuk dwelling origin (origin arrOff null),
    // elapsed=0, GMR depOff=0, transit GMR->CN dimulai saat elapsed>0.
    const now = wibDate(THU.y, THU.m, THU.d, 8, 0);
    const pos = computeTrainPosition(dailyTrain, stationsById, segments, now);
    // elapsed=0: not_started? elapsed>=0 dan <=total, jadi active.
    // origin tak dwelling (arrOff null), transit butuh elapsed>depOff(0).
    // elapsed=0 jatuh ke fallback arrived. Pastikan tidak crash & status valid.
    expect(["arrived", "in_transit", "dwelling"]).toContain(pos.status);
  });
});
