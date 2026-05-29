"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Station, TrainClass } from "@/lib/types";
import { getLivePositions } from "@/lib/trains";
import {
  etaPwtText,
  isLive,
  normalizeSearch,
  statusLabel,
  trainDirection,
  type Direction,
} from "@/lib/display";
import { ClassBadge } from "./ClassBadge";

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
    <div className="mx-auto w-full max-w-2xl px-4 py-4">
      <header className="mb-3">
        <h1 className="text-xl font-semibold text-zinc-900">Daftar Kereta</h1>
        <p className="text-sm text-zinc-500">
          {rows.length} kereta &middot; urut estimasi tiba di Purwokerto
        </p>
      </header>

      <input
        type="search"
        inputMode="search"
        placeholder="Cari nama atau nomor KA…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="mb-3 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-400"
      />

      <div className="mb-2 flex gap-1.5 overflow-x-auto pb-1">
        {CLASS_FILTERS.map((c) => (
          <button
            key={c}
            onClick={() => setClassFilter(c)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
              classFilter === c
                ? "bg-zinc-900 text-white"
                : "bg-white text-zinc-700 border border-zinc-200"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {(["Semua", "barat", "timur"] as const).map((d) => (
          <button
            key={d}
            onClick={() => setDirFilter(d)}
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
              dirFilter === d
                ? "bg-blue-700 text-white"
                : "bg-white text-zinc-700 border border-zinc-200"
            }`}
          >
            {d === "Semua" ? "Semua arah" : d === "barat" ? "Ke barat" : "Ke timur"}
          </button>
        ))}
        <button
          onClick={() => setOnlyLive((v) => !v)}
          className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
            onlyLive
              ? "bg-green-700 text-white"
              : "bg-white text-zinc-700 border border-zinc-200"
          }`}
        >
          Sedang jalan
        </button>
      </div>

      <ul className="flex flex-col gap-2">
        {rows.map(({ train, pos }) => (
          <li key={train.id}>
            <Link
              href={`/kereta/${encodeURIComponent(train.id)}`}
              className="flex items-center gap-3 rounded-lg bg-white p-3 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <span className="block truncate font-medium text-zinc-900">
                  {train.name}
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
