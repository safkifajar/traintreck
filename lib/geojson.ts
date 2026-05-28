import type {
  FeatureCollection,
  LineString,
  Point,
} from "geojson";
import type { Station, Train, SegmentGeometry } from "./types";
import { getSegmentCoords } from "./position";

// Kumpulan polyline rute unik antar pasangan stasiun berurutan dari semua kereta.
// Pakai segments asli bila ada, fallback garis lurus.
export function buildRouteGeoJSON(
  trains: Train[],
  stationsById: Record<string, Station>,
  segments: Record<string, SegmentGeometry>
): FeatureCollection<LineString> {
  const seen = new Set<string>();
  const features: FeatureCollection<LineString>["features"] = [];

  for (const train of trains) {
    for (let i = 0; i < train.stops.length - 1; i++) {
      const fromId = train.stops[i].stationId;
      const toId = train.stops[i + 1].stationId;
      const key = `${fromId}-${toId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const from = stationsById[fromId];
      const to = stationsById[toId];
      if (!from || !to) continue;
      features.push({
        type: "Feature",
        properties: { key },
        geometry: {
          type: "LineString",
          coordinates: getSegmentCoords(from, to, segments),
        },
      });
    }
  }

  return { type: "FeatureCollection", features };
}

export function buildStationGeoJSON(
  stations: Station[]
): FeatureCollection<Point> {
  return {
    type: "FeatureCollection",
    features: stations.map((s) => ({
      type: "Feature",
      properties: { id: s.id, name: s.name, isMajor: s.isMajor ? 1 : 0 },
      geometry: { type: "Point", coordinates: [s.lng, s.lat] },
    })),
  };
}
