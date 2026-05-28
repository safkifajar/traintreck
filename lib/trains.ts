import stationsData from "@/data/stations.json";
import trainsData from "@/data/trains.json";
import segmentsData from "@/data/segments.json";
import type { Station, Train, SegmentGeometry, TrainPosition } from "./types";
import { computeTrainPosition } from "./position";

const stations = stationsData as Station[];
const trains = trainsData as Train[];
const segments = segmentsData as SegmentGeometry[];

export function getStationsById(): Record<string, Station> {
  return Object.fromEntries(stations.map((s) => [s.id, s]));
}

export function getSegmentsByKey(): Record<string, SegmentGeometry> {
  return Object.fromEntries(segments.map((s) => [s.key, s]));
}

export function getAllStations(): Station[] {
  return stations;
}

export function getAllTrains(): Train[] {
  return trains;
}

export function getTrainById(id: string): Train | undefined {
  return trains.find((t) => t.id === id);
}

export function getTrainsThroughStation(code: string): Train[] {
  return trains.filter((t) => t.stops.some((s) => s.stationId === code));
}

// Hitung posisi semua kereta untuk waktu tertentu (dipakai peta).
export function getLivePositions(
  now: Date = new Date()
): { train: Train; pos: TrainPosition }[] {
  const stationsById = getStationsById();
  const segmentsByKey = getSegmentsByKey();
  return trains.map((train) => ({
    train,
    pos: computeTrainPosition(train, stationsById, segmentsByKey, now),
  }));
}
