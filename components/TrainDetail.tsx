"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Station, Train } from "@/lib/types";
import { getStationsById, getSegmentsByKey } from "@/lib/trains";
import { computeTrainPosition } from "@/lib/position";
import { buildStopViews } from "@/lib/detail";
import {
  classColor,
  detailStatusText,
  etaPwtText,
  isLive,
} from "@/lib/display";
import { ClassBadge } from "./ClassBadge";
import { CategoryBadge } from "./CategoryBadge";
import { TrainStatusBadge } from "./TrainStatusBadge";
import { Disclaimer } from "./Disclaimer";
import { TrainScheduleTable } from "./TrainScheduleTable";
import { TrainMap, type MapTrain } from "./map/TrainMap";

interface Props {
  train: Train;
  stations: Station[];
  nameById: Record<string, string>;
}

export function TrainDetail({ train, stations, nameById }: Props) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const pos = useMemo(() => {
    return computeTrainPosition(train, getStationsById(), getSegmentsByKey(), now);
  }, [train, now]);

  const stopViews = useMemo(
    () => buildStopViews(train, pos, now),
    [train, pos, now]
  );

  const originDeparture = train.stops[0].departure;
  const statusText = detailStatusText(
    pos,
    nameById,
    train.originId,
    originDeparture,
    train.destinationId
  );

  // Stasiun yang relevan untuk mini map = stasiun di rute kereta ini.
  const routeStations = useMemo(() => {
    const ids = new Set(train.stops.map((s) => s.stationId));
    return stations.filter((s) => ids.has(s.id));
  }, [train, stations]);

  const liveTrains: MapTrain[] = isLive(pos.status) ? [{ train, pos }] : [];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4">
      {/* Header */}
      <header className="mb-4">
        <Link href="/kereta" className="text-xs font-medium text-blue-700">
          &larr; Daftar kereta
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold text-zinc-900">{train.name}</h1>
          <ClassBadge trainClass={train.class} />
          <CategoryBadge category={train.category} />
        </div>
        <p className="text-sm text-zinc-500">
          {train.id} &middot; {train.operator} &middot;{" "}
          {nameById[train.originId] ?? train.originId} &rarr;{" "}
          {nameById[train.destinationId] ?? train.destinationId}
        </p>
      </header>

      {/* Status terkini */}
      <section className="mb-3 rounded-xl border border-zinc-100 bg-white p-4 shadow-sm">
        <div className="mb-1.5 flex items-center gap-2">
          <TrainStatusBadge status={pos.status} />
        </div>
        <p className="text-base font-medium text-zinc-900">{statusText}</p>
      </section>

      {/* ETA Purwokerto highlight */}
      <section
        className="mb-3 rounded-xl p-4 text-white shadow-sm"
        style={{ backgroundColor: classColor(train.class) }}
      >
        <p className="text-xs uppercase tracking-wide opacity-80">
          Estimasi tiba di Purwokerto
        </p>
        <p className="mt-0.5 text-lg font-semibold">{etaPwtText(pos)}</p>
      </section>

      {/* Mini map */}
      <section className="mb-3 h-56 overflow-hidden rounded-xl border border-zinc-100 shadow-sm">
        <TrainMap
          stations={routeStations}
          liveTrains={liveTrains}
          allTrains={[train]}
          interactive={false}
          className="relative h-full w-full"
        />
      </section>

      {/* Timeline stops */}
      <section className="mb-3 rounded-xl border border-zinc-100 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">
            Perjalanan
          </h2>
          <span className="text-[10px] text-zinc-400">
            Tiba / Berangkat (WIB)
          </span>
        </div>
        <TrainScheduleTable stopViews={stopViews} nameById={nameById} />
      </section>

      <Disclaimer />
    </div>
  );
}
