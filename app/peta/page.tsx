import type { Metadata } from "next";
import { MapView } from "@/components/map/MapView";
import { getAllStations, getAllTrains } from "@/lib/trains";

export const metadata: Metadata = {
  title: "Peta — Train Tracker Purwokerto",
  description:
    "Perkiraan posisi kereta api di peta untuk kereta yang melintasi Stasiun Purwokerto (PWT). Update tiap detik.",
};

export default function MapPage() {
  const stations = getAllStations();
  const trains = getAllTrains();
  return <MapView stations={stations} trains={trains} />;
}
