"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import type { Station, Train, TrainPosition } from "@/lib/types";
import { classColor } from "@/lib/display";
import { buildRouteGeoJSON, buildStationGeoJSON } from "@/lib/geojson";
import { getSegmentsByKey, getStationsById } from "@/lib/trains";

const PWT: [number, number] = [109.2415, -7.4249];

const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;
const MAPTILER_STYLE = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_KEY}`
  : null;

export interface MapTrain {
  train: Train;
  pos: TrainPosition;
}

interface TrainMapProps {
  stations: Station[];
  // Kereta yang harus tampil (sudah difilter & hanya yang punya posisi).
  liveTrains: MapTrain[];
  allTrains: Train[]; // untuk membangun geometri rute lengkap
  onSelectTrain?: (trainId: string) => void;
  selectedTrainId?: string | null;
  interactive?: boolean;
  className?: string;
  onMapReady?: (map: maplibregl.Map) => void;
  // Lokasi pengguna (titik biru). null = tidak ditampilkan.
  userLocation?: { lat: number; lng: number } | null;
}

export const PWT_CENTER = PWT;

// Elemen marker "lokasi saya" — titik biru bergaya Google Maps.
function makeUserLocationEl(): HTMLDivElement {
  const el = document.createElement("div");
  el.style.width = "16px";
  el.style.height = "16px";
  el.style.borderRadius = "50%";
  el.style.background = "#1a73e8";
  el.style.border = "3px solid white";
  el.style.boxShadow = "0 0 0 2px rgba(26,115,232,0.4), 0 1px 4px rgba(0,0,0,0.4)";
  return el;
}

function makeTrainEl(color: string): HTMLDivElement {
  const el = document.createElement("div");
  el.className = "tt-train-marker";
  el.style.width = "26px";
  el.style.height = "26px";
  el.style.display = "flex";
  el.style.alignItems = "center";
  el.style.justifyContent = "center";
  const inner = document.createElement("div");
  inner.className = "tt-train-icon";
  inner.style.width = "18px";
  inner.style.height = "18px";
  inner.style.borderRadius = "50% 50% 50% 0";
  inner.style.transformOrigin = "center";
  inner.style.background = color;
  inner.style.border = "2px solid white";
  inner.style.boxShadow = "0 1px 4px rgba(0,0,0,0.4)";
  el.appendChild(inner);
  return el;
}

export function TrainMap({
  stations,
  liveTrains,
  allTrains,
  onSelectTrain,
  selectedTrainId,
  interactive = true,
  className,
  onMapReady,
  userLocation,
}: TrainMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const userMarkerRef = useRef<maplibregl.Marker | null>(null);
  const loadedRef = useRef(false);
  // Simpan data terbaru di ref supaya loop interval & selectedTrain memakai nilai terkini
  // tanpa re-init map.
  const liveRef = useRef<MapTrain[]>(liveTrains);
  const selectRef = useRef<((id: string) => void) | undefined>(onSelectTrain);
  liveRef.current = liveTrains;
  selectRef.current = onSelectTrain;

  // Init map sekali.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OPENFREEMAP_STYLE,
      center: PWT,
      zoom: 7.5,
      attributionControl: { compact: true },
      interactive,
    });
    mapRef.current = map;

    // Fallback ke MapTiler bila OpenFreeMap gagal load.
    map.on("error", (e) => {
      const msg = String(e?.error?.message ?? "");
      if (!loadedRef.current && MAPTILER_STYLE && /style|tiles|fetch/i.test(msg)) {
        map.setStyle(MAPTILER_STYLE);
      }
    });

    map.on("load", () => {
      loadedRef.current = true;
      const stationsById = getStationsById();
      const segments = getSegmentsByKey();

      // Rute (faint).
      map.addSource("routes", {
        type: "geojson",
        data: buildRouteGeoJSON(allTrains, stationsById, segments),
      });
      map.addLayer({
        id: "routes-line",
        type: "line",
        source: "routes",
        paint: {
          "line-color": "#94a3b8",
          "line-width": 2,
          "line-opacity": 0.5,
        },
      });

      // Stasiun.
      map.addSource("stations", {
        type: "geojson",
        data: buildStationGeoJSON(stations),
      });
      map.addLayer({
        id: "stations-circle",
        type: "circle",
        source: "stations",
        paint: {
          "circle-radius": ["case", ["==", ["get", "isMajor"], 1], 5, 3],
          "circle-color": "#0f172a",
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 1.5,
        },
      });
      map.addLayer({
        id: "stations-label",
        type: "symbol",
        source: "stations",
        layout: {
          "text-field": ["get", "name"],
          "text-size": 11,
          "text-offset": [0, 1.1],
          "text-anchor": "top",
          // Label hanya stasiun besar di zoom rendah.
          "text-allow-overlap": false,
        },
        paint: {
          "text-color": "#1e293b",
          "text-halo-color": "#ffffff",
          "text-halo-width": 1.5,
        },
        filter: ["==", ["get", "isMajor"], 1],
      });

      syncMarkers();
      onMapReady?.(map);
    });

    const markers = markersRef.current;
    return () => {
      map.remove();
      mapRef.current = null;
      markers.clear();
      loadedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sinkronkan marker kereta dengan data live terbaru.
  function syncMarkers() {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    const markers = markersRef.current;
    const live = liveRef.current;
    const present = new Set<string>();

    for (const { train, pos } of live) {
      if (pos.lat == null || pos.lng == null) continue;
      present.add(train.id);
      let marker = markers.get(train.id);
      const color = train.color ?? classColor(train.class);
      if (!marker) {
        const el = makeTrainEl(color);
        el.addEventListener("click", (ev) => {
          ev.stopPropagation();
          selectRef.current?.(train.id);
        });
        marker = new maplibregl.Marker({ element: el, anchor: "center" });
        marker.setLngLat([pos.lng, pos.lat]).addTo(map);
        markers.set(train.id, marker);
      } else {
        marker.setLngLat([pos.lng, pos.lat]);
      }
      const icon = marker.getElement().querySelector(
        ".tt-train-icon"
      ) as HTMLElement | null;
      if (icon) {
        const rot = pos.status === "in_transit" ? pos.bearing ?? 0 : 0;
        icon.style.transform = `rotate(${rot + 45}deg)`;
        icon.style.outline =
          selectedTrainId === train.id ? "2px solid #0ea5e9" : "none";
        icon.style.outlineOffset = "2px";
      }
    }

    // Hapus marker kereta yang tak lagi live.
    for (const [id, marker] of markers) {
      if (!present.has(id)) {
        marker.remove();
        markers.delete(id);
      }
    }
  }

  // Update marker tiap kali liveTrains berubah (parent recompute tiap 1 detik).
  useEffect(() => {
    syncMarkers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveTrains, selectedTrainId]);

  // Marker lokasi pengguna.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;
    if (userLocation) {
      if (!userMarkerRef.current) {
        userMarkerRef.current = new maplibregl.Marker({
          element: makeUserLocationEl(),
          anchor: "center",
        });
      }
      userMarkerRef.current
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map);
    } else if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }
  }, [userLocation]);

  return (
    <div className={className ?? "absolute inset-0"}>
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}
