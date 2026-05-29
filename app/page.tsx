import Link from "next/link";
import { MapView } from "@/components/map/MapView";
import { getAllStations, getAllTrains } from "@/lib/trains";

export default function Home() {
  const stations = getAllStations();
  const trains = getAllTrains();

  return (
    <div className="flex flex-1 flex-col">
      {/* Hero sambutan */}
      <section className="bg-gradient-to-b from-blue-700 to-blue-600 px-5 py-8 text-white">
        <div className="mx-auto w-full max-w-2xl">
          <h1 className="text-2xl font-bold leading-tight sm:text-3xl">
            Train Tracker Purwokerto
          </h1>
          <p className="mt-2 text-sm text-blue-50 sm:text-base">
            Perkiraan posisi kereta api di peta untuk semua kereta yang melintasi
            Stasiun Purwokerto (PWT). Lihat kereta bergerak, estimasi tiba, dan
            papan stasiun.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href="#peta"
              className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-blue-700"
            >
              Lihat peta
            </a>
            <Link
              href="/stasiun/pwt"
              className="rounded-lg bg-blue-500/40 px-4 py-2 text-sm font-semibold text-white ring-1 ring-inset ring-white/40"
            >
              Papan Stasiun PWT
            </Link>
            <Link
              href="/kereta"
              className="rounded-lg bg-blue-500/40 px-4 py-2 text-sm font-semibold text-white ring-1 ring-inset ring-white/40"
            >
              Daftar Kereta
            </Link>
          </div>
          <p className="mt-4 text-xs text-blue-100">
            Posisi estimasi dari jadwal GAPEKA, bukan GPS real-time.
          </p>
        </div>
      </section>

      {/* Peta */}
      <div id="peta" className="relative">
        <MapView
          stations={stations}
          trains={trains}
          heightClass="h-[78vh] min-h-[420px]"
        />
      </div>
    </div>
  );
}
