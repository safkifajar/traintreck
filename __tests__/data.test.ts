import { describe, it, expect } from "vitest";
import stationsData from "@/data/stations.json";
import trainsData from "@/data/trains.json";
import type { Station, Train } from "@/lib/types";
import { validateData } from "@/scripts/validate-data";
import { getLivePositions, getTrainsThroughStation } from "@/lib/trains";

const stations = stationsData as Station[];
const trains = trainsData as Train[];

describe("validasi data statis (PRD Bab 14.4)", () => {
  const result = validateData(stations, trains);

  it("tidak ada error validasi", () => {
    expect(result.errors).toEqual([]);
  });

  it("tidak ada warning validasi", () => {
    expect(result.warnings).toEqual([]);
  });

  it("semua KA lewat PWT", () => {
    expect(getTrainsThroughStation("PWT").length).toBe(trains.length);
  });
});

describe("getLivePositions", () => {
  it("menghasilkan posisi untuk setiap kereta", () => {
    const positions = getLivePositions(new Date());
    expect(positions.length).toBe(trains.length);
    for (const { pos } of positions) {
      expect(pos.trainId).toBeDefined();
      expect(pos.status).toBeDefined();
    }
  });

  it("pada jam ramai (siang) minimal satu KA in_transit", () => {
    // 12:00 WIB Kamis 2026-05-28 (UTC = 05:00)
    const noon = new Date(Date.UTC(2026, 4, 28, 5, 0));
    const positions = getLivePositions(noon);
    const moving = positions.filter(
      (p) => p.pos.status === "in_transit" || p.pos.status === "dwelling"
    );
    expect(moving.length).toBeGreaterThan(0);
  });
});
