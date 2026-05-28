"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type maplibregl from "maplibre-gl";
import type { Station, Train, TrainClass } from "@/lib/types";
import { getLivePositions } from "@/lib/trains";
import {
  classColor,
  etaPwtText,
  isLive,
  statusLabel,
  trainDirection,
  type Direction,
} from "@/lib/display";
import { TrainMap, PWT_CENTER, type MapTrain } from "./TrainMap";
import { ClassBadge } from "@/components/ClassBadge";
import { Disclaimer } from "@/components/Disclaimer";

const CLASS_FILTERS: (TrainClass | "Semua")[] = [
  "Semua",
  "Eksekutif",
  "Campuran",
  "Bisnis",
  "Ekonomi",
  "Lokal",
];

interface MapViewProps {
  stations: Station[];
  trains: Train[];
}

export function MapView({ stations, trains }: MapViewProps) {
  const [now, setNow] = useState(() => new Date());
  const [classFilter, setClassFilter] = useState<TrainClass | "Semua">("Semua");
  const [dirFilter, setDirFilter] = useState<Direction | "Semua">("Semua");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);

  const lngById = useMemo(
    () => Object.fromEntries(stations.map((s) => [s.id, s.lng])),
    [stations]
  );

  // Recompute posisi semua kereta tiap 1 detik.
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const allPositions = useMemo(() => getLivePositions(now), [now]);

  // Kereta live (in_transit/dwelling) setelah filter.
  const liveTrains: MapTrain[] = useMemo(() => {
    return allPositions
      .filter(({ pos }) => isLive(pos.status))
      .filter(({ train }) =>
        classFilter === "Semua" ? true : train.class === classFilter
      )
      .filter(({ train }) =>
        dirFilter === "Semua"
          ? true
          : trainDirection(train, lngById) === dirFilter
      )
      .map(({ train, pos }) => ({ train, pos }));
  }, [allPositions, classFilter, dirFilter, lngById]);

  const selected = useMemo(
    () => liveTrains.find((t) => t.train.id === selectedId) ?? null,
    [liveTrains, selectedId]
  );

  const hasLive = liveTrains.length > 0;

  function recenter() {
    mapInstanceRef.current?.flyTo({ center: PWT_CENTER, zoom: 7.5 });
  }

  return (
    <div className="relative flex-1">
      <TrainMap
        stations={stations}
        liveTrains={liveTrains}
        allTrains={trains}
        onSelectTrain={(id) => setSelectedId(id)}
        selectedTrainId={selectedId}
        onMapReady={(m) => (mapInstanceRef.current = m)}
      />

      {/* Filter chips sticky di atas */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-col gap-2 p-3">
        <div className="pointer-events-auto flex gap-1.5 overflow-x-auto pb-1">
          {CLASS_FILTERS.map((c) => (
            <button
              key={c}
              onClick={() => setClassFilter(c)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium shadow-sm ${
                classFilter === c
                  ? "bg-zinc-900 text-white"
                  : "bg-white text-zinc-700"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="pointer-events-auto flex gap-1.5">
          {(["Semua", "barat", "timur"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDirFilter(d)}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium shadow-sm ${
                dirFilter === d
                  ? "bg-blue-700 text-white"
                  : "bg-white text-zinc-700"
              }`}
            >
              {d === "Semua"
                ? "Semua arah"
                : d === "barat"
                  ? "Ke barat"
                  : "Ke timur"}
            </button>
          ))}
        </div>
      </div>

      {/* Disclaimer badge selalu terlihat */}
      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex justify-center px-3">
        <Disclaimer variant="badge" />
      </div>

      {/* Recenter button */}
      <button
        onClick={recenter}
        className="absolute right-3 top-28 z-10 rounded-full bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-md sm:top-32"
      >
        Ke Purwokerto
      </button>

      {/* Legend kelas */}
      <Legend />

      {/* Empty state */}
      {!hasLive && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6">
          <div className="pointer-events-auto max-w-xs rounded-lg bg-white/95 p-4 text-center shadow-lg">
            <p className="text-sm font-medium text-zinc-800">
              Tidak ada kereta yang sedang berjalan saat ini
            </p>
            <Link
              href="/stasiun/pwt"
              className="mt-2 inline-block text-sm font-medium text-blue-700"
            >
              Lihat papan Stasiun PWT &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* Bottom sheet ringkas */}
      {selected && (
        <div className="absolute inset-x-0 bottom-0 z-20 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-80">
          <div className="rounded-t-2xl bg-white p-4 shadow-2xl sm:rounded-2xl">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-zinc-900">
                    {selected.train.name}
                  </span>
                  <ClassBadge trainClass={selected.train.class} />
                </div>
                <p className="text-xs text-zinc-500">
                  KA {selected.train.id} &middot; {statusLabel(selected.pos.status)}
                </p>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100"
                aria-label="Tutup"
              >
                &times;
              </button>
            </div>
            <p className="mt-2 text-sm font-medium" style={{ color: classColor(selected.train.class) }}>
              {etaPwtText(selected.pos)}
            </p>
            <Link
              href={`/kereta/${selected.train.id}`}
              className="mt-3 block rounded-lg bg-zinc-900 px-3 py-2 text-center text-sm font-medium text-white"
            >
              Lihat detail
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function Legend() {
  const [open, setOpen] = useState(false);
  const classes: TrainClass[] = [
    "Eksekutif",
    "Campuran",
    "Bisnis",
    "Ekonomi",
    "Lokal",
  ];
  return (
    <div className="absolute left-3 bottom-14 z-10 sm:bottom-16">
      <button
        onClick={() => setOpen((v) => !v)}
        className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-md"
      >
        {open ? "Tutup legenda" : "Legenda"}
      </button>
      {open && (
        <div className="mt-2 rounded-lg bg-white p-3 shadow-md">
          {classes.map((c) => (
            <div key={c} className="flex items-center gap-2 py-0.5 text-xs">
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: classColor(c) }}
              />
              {c}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
