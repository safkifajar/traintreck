"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  getStationBoard,
  sortByArrival,
  sortByDeparture,
  type BoardEntry,
} from "@/lib/station";
import { boardStatusText } from "@/lib/display";
import { ClassBadge } from "./ClassBadge";
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

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4">
      <header className="mb-3">
        <h1 className="text-xl font-semibold text-zinc-900">
          Stasiun {stationName}
        </h1>
        <p className="text-sm text-zinc-500">
          Papan {tab === "kedatangan" ? "kedatangan" : "keberangkatan"} hari ini
          &middot; {rows.length} kereta
        </p>
      </header>

      <div className="mb-3 flex gap-1 rounded-lg bg-zinc-100 p-1">
        {(["kedatangan", "keberangkatan"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium capitalize ${
              tab === t ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mb-3">
        <Disclaimer />
      </div>

      <ul className="flex flex-col gap-2">
        {rows.map((entry) => (
          <BoardRow
            key={entry.train.id}
            entry={entry}
            tab={tab}
            code={code}
            destName={destNameById[entry.train.destinationId] ?? entry.train.destinationId}
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
}: {
  entry: BoardEntry;
  tab: Tab;
  code: string;
  destName: string;
}) {
  const time = tab === "kedatangan" ? entry.arrival : entry.departure;
  const isOriginHere = entry.train.originId === code;
  const soon =
    entry.etaArrivalMin != null &&
    entry.etaArrivalMin > 0 &&
    entry.etaArrivalMin <= 30;
  const status = boardStatusText(entry.pos, entry.etaArrivalMin, isOriginHere);

  return (
    <li>
      <Link
        href={`/kereta/${encodeURIComponent(entry.train.id)}`}
        className={`flex items-center gap-3 rounded-lg border p-3 shadow-sm ${
          soon ? "border-blue-300 bg-blue-50" : "border-transparent bg-white"
        }`}
      >
        <div className="w-12 shrink-0 text-center">
          <div className="text-lg font-semibold tabular-nums text-zinc-900">
            {time ?? "--:--"}
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-zinc-900">
              {entry.train.name}
            </span>
            <ClassBadge trainClass={entry.train.class} />
          </div>
          <p className="truncate text-xs text-zinc-500">
            {entry.train.id} &middot; {tab === "kedatangan" ? "dari" : "menuju"}{" "}
            {destName}
          </p>
        </div>
        <div className="shrink-0 text-right">
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
