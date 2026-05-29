"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Station, TrainClass } from "@/lib/types";
import { useClickOutside } from "@/lib/useClickOutside";
import { getLivePositions } from "@/lib/trains";
import {
  classColor,
  etaPwtText,
  isLive,
  normalizeSearch,
  statusLabel,
  trainDirection,
  type Direction,
} from "@/lib/display";
import { ClassBadge } from "./ClassBadge";
import { CategoryBadge } from "./CategoryBadge";

const CLASS_FILTERS: (TrainClass | "Semua")[] = [
  "Semua",
  "Eksekutif",
  "Campuran",
  "Bisnis",
  "Ekonomi",
  "Lokal",
];

interface Props {
  stations: Station[];
}

export function TrainListView({ stations }: Props) {
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState<TrainClass | "Semua">("Semua");
  const [dirFilter, setDirFilter] = useState<Direction | "Semua">("Semua");
  const [onlyLive, setOnlyLive] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  useClickOutside(filterRef, () => setFilterOpen(false), filterOpen);
  const activeFilterCount =
    (classFilter !== "Semua" ? 1 : 0) +
    (dirFilter !== "Semua" ? 1 : 0) +
    (onlyLive ? 1 : 0);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const lngById = useMemo(
    () => Object.fromEntries(stations.map((s) => [s.id, s.lng])),
    [stations]
  );
  const nameById = useMemo(
    () => Object.fromEntries(stations.map((s) => [s.id, s.name])),
    [stations]
  );

  const positions = useMemo(() => getLivePositions(now), [now]);

  const rows = useMemo(() => {
    const q = normalizeSearch(query);
    return positions
      .filter(({ train }) => {
        if (q && !normalizeSearch(`${train.name} ${train.id}`).includes(q))
          return false;
        if (classFilter !== "Semua" && train.class !== classFilter) return false;
        if (
          dirFilter !== "Semua" &&
          trainDirection(train, lngById) !== dirFilter
        )
          return false;
        return true;
      })
      .filter(({ pos }) => (onlyLive ? isLive(pos.status) : true))
      .sort((a, b) => {
        // Sort: ETA PWT terdekat di atas; null (sudah lewat/tak relevan) di bawah.
        const ea = a.pos.etaPurwokertoMin;
        const eb = b.pos.etaPurwokertoMin;
        if (ea == null && eb == null) return 0;
        if (ea == null) return 1;
        if (eb == null) return -1;
        return ea - eb;
      });
  }, [positions, query, classFilter, dirFilter, onlyLive, lngById]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-4">
      {/* Bagian atas sticky saat scroll */}
      <div className="sticky top-0 z-20 -mx-4 bg-zinc-50/95 px-4 pb-2 pt-4 backdrop-blur sm:top-14">
        <header className="mb-3">
          <h1 className="text-xl font-bold text-zinc-900">Daftar Kereta</h1>
          <p className="mt-0.5 text-sm text-zinc-500">
            {rows.length} kereta &middot; urut estimasi tiba di Purwokerto
          </p>
        </header>

      {/* Search + tombol Filter sebaris */}
      <div className="mb-2 flex items-center gap-2">
        <div className="relative flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4-4" />
          </svg>
          <input
            type="search"
            inputMode="search"
            placeholder="Cari nama atau nomor KA…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="relative shrink-0" ref={filterRef}>
        <button
          onClick={() => setFilterOpen((v) => !v)}
          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-700"
        >
          <svg
            width="16"
            height="16"
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
          <div className="absolute right-0 top-full z-10 mt-2 w-60 rounded-xl border border-zinc-100 bg-white p-3 shadow-lg">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-900">Kelas</span>
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
                  {d === "Semua" ? "Semua" : d === "barat" ? "Ke barat" : "Ke timur"}
                </button>
              ))}
            </div>

            <div className="mb-1 mt-3 text-xs font-semibold text-zinc-900">
              Status
            </div>
            <button
              onClick={() => setOnlyLive((v) => !v)}
              className={`w-full rounded-full border px-2.5 py-1 text-xs font-medium ${
                onlyLive
                  ? "border-green-700 bg-green-700 text-white"
                  : "border-zinc-200 bg-white text-zinc-700"
              }`}
            >
              Hanya yang sedang jalan
            </button>
          </div>
        )}
        </div>
      </div>

      {/* Chip filter aktif */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-1.5 pb-1">
          {classFilter !== "Semua" && (
            <ActiveChip
              label={classFilter}
              onClear={() => setClassFilter("Semua")}
            />
          )}
          {dirFilter !== "Semua" && (
            <ActiveChip
              label={dirFilter === "barat" ? "Ke barat" : "Ke timur"}
              onClear={() => setDirFilter("Semua")}
            />
          )}
          {onlyLive && (
            <ActiveChip label="Sedang jalan" onClear={() => setOnlyLive(false)} />
          )}
          <button
            onClick={() => {
              setClassFilter("Semua");
              setDirFilter("Semua");
              setOnlyLive(false);
            }}
            className="text-xs font-medium text-blue-600"
          >
            Hapus semua
          </button>
        </div>
      )}
      </div>

      <ul className="mt-2 flex flex-col gap-2">
        {rows.map(({ train, pos }) => (
          <li key={train.id}>
            <Link
              href={`/kereta/${encodeURIComponent(train.id)}`}
              className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate font-medium text-zinc-900">
                    {train.name}
                  </span>
                  <CategoryBadge category={train.category} />
                </span>
                <p className="truncate text-xs text-zinc-500">
                  {train.id} &middot; {nameById[train.originId] ?? train.originId}{" "}
                  &rarr; {nameById[train.destinationId] ?? train.destinationId}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                <ClassBadge trainClass={train.class} />
                <div className="text-xs font-medium text-zinc-700">
                  {etaPwtText(pos)}
                </div>
                <div className="text-[11px] text-zinc-400">
                  {statusLabel(pos.status)}
                </div>
              </div>
            </Link>
          </li>
        ))}
        {rows.length === 0 && (
          <li className="rounded-lg bg-white p-6 text-center text-sm text-zinc-500 shadow-sm">
            Tidak ada kereta yang cocok dengan pencarian/filter.
          </li>
        )}
      </ul>
    </div>
  );
}

function ActiveChip({
  label,
  onClear,
}: {
  label: string;
  onClear: () => void;
}) {
  return (
    <button
      onClick={onClear}
      className="flex items-center gap-1 rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white"
    >
      {label}
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      >
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  );
}
