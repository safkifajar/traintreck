"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  getStationBoard,
  sortByArrival,
  sortByDeparture,
  type BoardEntry,
} from "@/lib/station";
import { nowWib } from "@/lib/time";
import { boardStatusText } from "@/lib/display";
import { ClassBadge } from "./ClassBadge";
import { CategoryBadge } from "./CategoryBadge";
import { Disclaimer } from "./Disclaimer";

type Tab = "kedatangan" | "keberangkatan";

interface DepartureBoardProps {
  code: string;
  stationName: string;
  destNameById: Record<string, string>;
}

export function DepartureBoard({
  code,
  stationName,
  destNameById,
}: DepartureBoardProps) {
  const [tab, setTab] = useState<Tab>("kedatangan");
  const [now, setNow] = useState(() => new Date());

  // Auto-refresh status tiap 30 detik (PRD Bab 9.3).
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  const board = useMemo(() => getStationBoard(code, now), [code, now]);
  const rows = useMemo(
    () => (tab === "kedatangan" ? sortByArrival(board) : sortByDeparture(board)),
    [board, tab]
  );

  // Index baris pertama yang waktunya >= sekarang (kereta berikutnya).
  const nowMin = useMemo(() => nowWib(now).minutesOfDay, [now]);
  const firstUpcomingIndex = useMemo(() => {
    const idx = rows.findIndex((e) => {
      const t = tab === "kedatangan" ? e.arrival : e.departure;
      if (!t) return false;
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m >= nowMin;
    });
    return idx; // -1 bila semua sudah lewat
  }, [rows, tab, nowMin]);

  // Auto-scroll ke kereta berikutnya saat halaman dibuka / ganti tab.
  const upcomingRef = useRef<HTMLLIElement>(null);
  const didScrollRef = useRef(false);
  useEffect(() => {
    didScrollRef.current = false;
  }, [tab]);
  useEffect(() => {
    if (didScrollRef.current) return;
    if (firstUpcomingIndex > 0 && upcomingRef.current) {
      didScrollRef.current = true;
      // delay kecil agar layout (sticky header) sudah siap
      const id = setTimeout(() => {
        upcomingRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 150);
      return () => clearTimeout(id);
    }
  }, [firstUpcomingIndex]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-4">
      {/* Bagian atas sticky saat scroll */}
      <div className="sticky top-0 z-20 -mx-4 bg-zinc-50/95 px-4 pb-2 pt-4 backdrop-blur sm:top-14">
        <header className="mb-3">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-blue-700 px-1.5 py-0.5 text-xs font-bold text-white">
              {code}
            </span>
            <h1 className="text-xl font-bold text-zinc-900">
              Stasiun {stationName}
            </h1>
          </div>
          <p className="mt-0.5 text-sm text-zinc-500">
            {rows.length} kereta &middot;{" "}
            {tab === "kedatangan" ? "kedatangan" : "keberangkatan"} hari ini
          </p>
        </header>

        <div className="flex gap-1 rounded-xl bg-zinc-100 p-1">
          {(["kedatangan", "keberangkatan"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold capitalize transition-colors ${
                tab === t
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-2">
          <Disclaimer />
        </div>
      </div>

      <ul className="flex flex-col gap-2">
        {rows.map((entry, i) => (
          <BoardRow
            key={entry.train.id}
            entry={entry}
            tab={tab}
            code={code}
            destName={destNameById[entry.train.destinationId] ?? entry.train.destinationId}
            isPast={firstUpcomingIndex >= 0 && i < firstUpcomingIndex}
            markerRef={i === firstUpcomingIndex ? upcomingRef : undefined}
            showNowLine={i === firstUpcomingIndex && firstUpcomingIndex > 0}
          />
        ))}
        {rows.length === 0 && (
          <li className="rounded-lg bg-white p-6 text-center text-sm text-zinc-500 shadow-sm">
            Tidak ada kereta untuk ditampilkan.
          </li>
        )}
      </ul>
    </div>
  );
}

function BoardRow({
  entry,
  tab,
  code,
  destName,
  isPast = false,
  markerRef,
  showNowLine = false,
}: {
  entry: BoardEntry;
  tab: Tab;
  code: string;
  destName: string;
  isPast?: boolean;
  markerRef?: React.Ref<HTMLLIElement>;
  showNowLine?: boolean;
}) {
  const time = tab === "kedatangan" ? entry.arrival : entry.departure;
  const isOriginHere = entry.train.originId === code;
  const soon =
    entry.etaArrivalMin != null &&
    entry.etaArrivalMin > 0 &&
    entry.etaArrivalMin <= 30;
  const status = boardStatusText(entry.pos, entry.etaArrivalMin, isOriginHere);

  return (
    <li ref={markerRef} className={isPast ? "opacity-50" : ""}>
      {showNowLine && (
        <div className="mb-2 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-600" />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-blue-600">
            Sekarang
          </span>
          <span className="h-px flex-1 bg-blue-200" />
        </div>
      )}
      <Link
        href={`/kereta/${encodeURIComponent(entry.train.id)}`}
        className={`flex items-center gap-3 rounded-lg border p-3 shadow-sm ${
          soon ? "border-blue-300 bg-blue-50" : "border-transparent bg-white"
        }`}
      >
        <div className="w-12 shrink-0 text-center">
          <div className="text-lg font-semibold tabular-nums leading-none text-zinc-900">
            {time ?? "--:--"}
          </div>
          {time && (
            <div className="mt-0.5 text-[10px] font-medium text-zinc-400">
              WIB
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate font-medium text-zinc-900">
              {entry.train.name}
            </span>
            <CategoryBadge category={entry.train.category} />
          </span>
          <p className="truncate text-xs text-zinc-500">
            {entry.train.id} &middot; {tab === "kedatangan" ? "dari" : "menuju"}{" "}
            {destName}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1 text-right">
          <ClassBadge trainClass={entry.train.class} />
          <span
            className={`text-xs font-medium ${
              soon ? "text-blue-700" : "text-zinc-500"
            }`}
          >
            {status}
          </span>
        </div>
      </Link>
    </li>
  );
}
