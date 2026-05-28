import { MapView } from "@/components/map/MapView";
import { getAllStations, getAllTrains } from "@/lib/trains";

export default function Home() {
  const stations = getAllStations();
  const trains = getAllTrains();
  return <MapView stations={stations} trains={trains} />;
}
