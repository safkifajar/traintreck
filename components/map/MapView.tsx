"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type maplibregl from "maplibre-gl";
import type { Station, Train, TrainClass } from "@/lib/types";
import { getLivePositions, getStationsById } from "@/lib/trains";
import {
  classColor,
  etaPwtText,
  isLive,
  statusLabel,
  trainDirection,
  type Direction,
} from "@/lib/display";
import { getTrainsPassingNear, nearestStation } from "@/lib/nearby";
import { useClickOutside } from "@/lib/useClickOutside";
import { TrainMap, PWT_CENTER, type MapTrain } from "./TrainMap";
import { ClassBadge } from "@/components/ClassBadge";
import { CategoryBadge } from "@/components/CategoryBadge";
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
  // Kelas tinggi container peta. Default flex-1 (isi sisa layar);
  // di landing dipakai tinggi tetap agar bisa di-scroll bersama hero.
  heightClass?: string;
}

export function MapView({
  stations,
  trains,
  heightClass = "flex-1",
}: MapViewProps) {
  const [now, setNow] = useState(() => new Date());
  const [classFilter, setClassFilter] = useState<TrainClass | "Semua">("Semua");
  const [dirFilter, setDirFilter] = useState<Direction | "Semua">("Semua");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  useClickOutside(filterRef, () => setFilterOpen(false), filterOpen);
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
  const activeFilterCount =
    (classFilter !== "Semua" ? 1 : 0) + (dirFilter !== "Semua" ? 1 : 0);

  // Kereta yang akan lewat dekat lokasi user (jika lokasi aktif).
  const nearby = useMemo(() => {
    if (!userLocation) return null;
    const stationsById = getStationsById();
    const passing = getTrainsPassingNear(
      userLocation.lat,
      userLocation.lng,
      trains,
      stationsById,
      now
    ).slice(0, 5);
    const nearSt = nearestStation(userLocation.lat, userLocation.lng, stations);
    return { passing, nearSt };
  }, [userLocation, trains, stations, now]);

  // Fokus & zoom dekat ke Stasiun Purwokerto.
  function focusPwt() {
    mapInstanceRef.current?.flyTo({ center: PWT_CENTER, zoom: 15 });
  }

  function locateMe() {
    if (!("geolocation" in navigator)) {
      setLocError("Perangkat tidak mendukung lokasi.");
      return;
    }
    setLocating(true);
    setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setLocating(false);
        mapInstanceRef.current?.flyTo({ center: [loc.lng, loc.lat], zoom: 13 });
      },
      (err) => {
        setLocating(false);
        setLocError(
          err.code === err.PERMISSION_DENIED
            ? "Izin lokasi ditolak. Aktifkan di pengaturan browser."
            : "Tidak bisa mendapatkan lokasi. Coba lagi."
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }

  return (
    <div className={`relative ${heightClass}`}>
      <TrainMap
        stations={stations}
        liveTrains={liveTrains}
        allTrains={trains}
        onSelectTrain={(id) => setSelectedId(id)}
        selectedTrainId={selectedId}
        onMapReady={(m) => (mapInstanceRef.current = m)}
        userLocation={userLocation}
      />

      {/* Kontrol + disclaimer, bertumpuk di bawah-tengah */}
      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex flex-col items-center gap-2 px-3">
        <div className="pointer-events-auto flex flex-wrap justify-center gap-2">
          <button
            onClick={focusPwt}
            className="rounded-full bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-md"
          >
            Stasiun PWT
          </button>
          <button
            onClick={locateMe}
            disabled={locating}
            className="rounded-full bg-blue-600 px-3 py-2 text-xs font-medium text-white shadow-md disabled:opacity-60"
          >
            {locating ? "Mencari…" : "Lokasi saya"}
          </button>

          {/* Filter + panel (popover ke atas) */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-md"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M3 6h18M6 12h12M10 18h4" />
              </svg>
              Filter
              {activeFilterCount > 0 && (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {filterOpen && (
              <div className="absolute bottom-full left-1/2 mb-2 w-60 -translate-x-1/2 rounded-xl bg-white p-3 text-left shadow-lg">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-semibold text-zinc-900">
                    Kelas
                  </span>
                  {classFilter !== "Semua" && (
                    <button
                      onClick={() => setClassFilter("Semua")}
                      className="text-[11px] text-blue-600"
                    >
                      reset
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {CLASS_FILTERS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setClassFilter(c)}
                      className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
                        classFilter === c
                          ? "border-zinc-900 bg-zinc-900 text-white"
                          : "border-zinc-200 bg-white text-zinc-700"
                      }`}
                    >
                      {c !== "Semua" && (
                        <span
                          className="inline-block h-2 w-2 rounded-full"
                          style={{ backgroundColor: classColor(c as TrainClass) }}
                        />
                      )}
                      {c}
                    </button>
                  ))}
                </div>

                <div className="mb-1 mt-3 text-xs font-semibold text-zinc-900">
                  Arah
                </div>
                <div className="flex gap-1.5">
                  {(["Semua", "barat", "timur"] as const).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDirFilter(d)}
                      className={`flex-1 rounded-full border px-2.5 py-1 text-xs font-medium ${
                        dirFilter === d
                          ? "border-blue-600 bg-blue-600 text-white"
                          : "border-zinc-200 bg-white text-zinc-700"
                      }`}
                    >
                      {d === "Semua"
                        ? "Semua"
                        : d === "barat"
                          ? "Ke barat"
                          : "Ke timur"}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {locError && (
          <p className="pointer-events-auto max-w-[260px] rounded-md bg-white/95 px-2 py-1 text-center text-[11px] text-red-600 shadow">
            {locError}
          </p>
        )}
        <Disclaimer variant="badge" />
      </div>

      {/* Panel kereta lewat dekat lokasi user (kanan-atas) */}
      {nearby && !selected && (
        <div className="absolute right-3 top-3 z-10 w-64">
          <div className="rounded-2xl border border-zinc-100 bg-white/95 p-3 shadow-lg backdrop-blur">
            <p className="text-xs font-semibold text-zinc-900">
              Kereta lewat dekat Anda
            </p>
            {nearby.nearSt && (
              <p className="text-[11px] text-zinc-500">
                Stasiun terdekat: {nearby.nearSt.station.name} (
                {(nearby.nearSt.distanceMeters / 1000).toFixed(1)} km)
              </p>
            )}
            {nearby.passing.length === 0 ? (
              <p className="mt-2 text-xs text-zinc-500">
                Tidak ada kereta yang akan lewat dekat lokasi Anda saat ini.
              </p>
            ) : (
              <ul className="mt-2 flex flex-col gap-1.5">
                {nearby.passing.map((n) => (
                  <li key={n.train.id}>
                    <Link
                      href={`/kereta/${encodeURIComponent(n.train.id)}`}
                      className="flex items-center justify-between gap-2 rounded-lg bg-zinc-50 px-2 py-1.5"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-medium text-zinc-900">
                          {n.train.name}
                        </span>
                        <span className="text-[10px] text-zinc-500">
                          lewat ~{n.passHhmm}
                        </span>
                      </span>
                      <span
                        className="shrink-0 text-xs font-semibold"
                        style={{ color: classColor(n.train.class) }}
                      >
                        {n.etaMin === 0 ? "sekarang" : `${n.etaMin} mnt`}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-[10px] leading-tight text-zinc-400">
              Estimasi dari jadwal, bukan posisi GPS kereta.
            </p>
          </div>
        </div>
      )}

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
          <div className="rounded-t-2xl border-t border-zinc-100 bg-white p-4 pt-3 shadow-2xl sm:rounded-2xl sm:border">
            <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-zinc-200 sm:hidden" />
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold text-zinc-900">
                    {selected.train.name}
                  </span>
                  <ClassBadge trainClass={selected.train.class} />
                  <CategoryBadge category={selected.train.category} />
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">
                  KA {selected.train.id} &middot;{" "}
                  {statusLabel(selected.pos.status)}
                </p>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="-mr-1 -mt-1 rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100"
                aria-label="Tutup"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <div
              className="mt-3 rounded-lg px-3 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: classColor(selected.train.class) }}
            >
              {etaPwtText(selected.pos)}
            </div>
            <Link
              href={`/kereta/${encodeURIComponent(selected.train.id)}`}
              className="mt-2 block rounded-lg bg-zinc-900 px-3 py-2 text-center text-sm font-medium text-white"
            >
              Lihat detail &rarr;
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

