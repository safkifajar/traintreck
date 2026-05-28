import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllStations, getTrainById } from "@/lib/trains";
import { TrainDetail } from "@/components/TrainDetail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const train = getTrainById(decodeURIComponent(id));
  if (!train) return { title: "Kereta tidak ditemukan" };
  return {
    title: `${train.name} (${train.id}) — Train Tracker Purwokerto`,
    description: `Status, rute, dan estimasi tiba di Purwokerto untuk ${train.name} ${train.id}.`,
  };
}

export default async function TrainDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const train = getTrainById(decodeURIComponent(id));
  if (!train) notFound();

  const stations = getAllStations();
  const nameById = Object.fromEntries(stations.map((s) => [s.id, s.name]));

  return (
    <TrainDetail train={train} stations={stations} nameById={nameById} />
  );
}
