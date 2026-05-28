import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllStations, getStationsById } from "@/lib/trains";
import { DepartureBoard } from "@/components/DepartureBoard";

function resolveStation(codeParam: string) {
  const code = codeParam.toUpperCase();
  const station = getStationsById()[code];
  return station ? { code, station } : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const resolved = resolveStation(code);
  if (!resolved) return { title: "Stasiun tidak ditemukan" };
  return {
    title: `Stasiun ${resolved.station.name} — Train Tracker Purwokerto`,
    description: `Papan kedatangan & keberangkatan kereta di Stasiun ${resolved.station.name} (${resolved.code}). Status estimasi dari jadwal.`,
  };
}

export default async function StationPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const resolved = resolveStation(code);
  if (!resolved) notFound();

  const destNameById = Object.fromEntries(
    getAllStations().map((s) => [s.id, s.name])
  );

  return (
    <DepartureBoard
      code={resolved.code}
      stationName={resolved.station.name}
      destNameById={destNameById}
    />
  );
}
