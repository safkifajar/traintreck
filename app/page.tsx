import Link from "next/link";

const FEATURES = [
  {
    href: "/peta",
    title: "Peta Langsung",
    desc: "Lihat perkiraan posisi semua kereta yang sedang berjalan, bergerak di peta.",
  },
  {
    href: "/stasiun/pwt",
    title: "Papan Stasiun PWT",
    desc: "Kedatangan & keberangkatan di Purwokerto dengan estimasi waktu terkini.",
  },
  {
    href: "/kereta",
    title: "Daftar & Cari Kereta",
    desc: "Cari kereta, lihat rute, dan estimasi tiba di Purwokerto.",
  },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-b from-blue-700 to-blue-600 px-5 py-12 text-white">
        <div className="mx-auto w-full max-w-2xl">
          <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
            Train Tracker Purwokerto
          </h1>
          <p className="mt-3 text-base text-blue-50">
            Perkiraan posisi kereta api di peta untuk semua kereta yang
            melintasi Stasiun Purwokerto (PWT).
          </p>
          <Link
            href="/peta"
            className="mt-5 inline-block rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-blue-700"
          >
            Buka Peta &rarr;
          </Link>
          <p className="mt-5 text-xs text-blue-100">
            Posisi estimasi dari jadwal GAPEKA, bukan GPS real-time.
          </p>
        </div>
      </section>

      {/* Fitur */}
      <section className="mx-auto w-full max-w-2xl px-5 py-6">
        <div className="flex flex-col gap-3">
          {FEATURES.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="group flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:border-blue-300 hover:shadow-md"
            >
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold text-zinc-900">{f.title}</h2>
                <p className="mt-1 text-sm text-zinc-500">{f.desc}</p>
              </div>
              <svg
                className="shrink-0 text-zinc-300 transition-colors group-hover:text-blue-500"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </Link>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mx-auto mt-auto w-full max-w-2xl px-5 py-6">
        <p className="text-xs text-zinc-400">
          Proyek komunitas non-komersial. Tidak berafiliasi dengan PT KAI.
        </p>
        <div className="mt-2 flex gap-4 text-xs">
          <Link href="/privasi" className="text-zinc-500 hover:text-blue-700">
            Kebijakan Privasi
          </Link>
          <Link href="/ketentuan" className="text-zinc-500 hover:text-blue-700">
            Syarat &amp; Ketentuan
          </Link>
        </div>
      </footer>
    </main>
  );
}
