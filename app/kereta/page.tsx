import type { Metadata } from "next";
import { getAllStations } from "@/lib/trains";
import { TrainListView } from "@/components/TrainListView";

export const metadata: Metadata = {
  title: "Daftar Kereta — Train Tracker Purwokerto",
  description:
    "Cari dan filter kereta yang melintasi Purwokerto. Urut berdasarkan estimasi tiba di Purwokerto.",
};

export default function TrainListPage() {
  return <TrainListView stations={getAllStations()} />;
}
