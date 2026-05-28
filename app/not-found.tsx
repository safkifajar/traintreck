import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-2xl font-semibold text-zinc-900">
        Tidak ditemukan
      </h1>
      <p className="max-w-sm text-sm text-zinc-500">
        Halaman, kereta, atau stasiun yang Anda cari tidak tersedia.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
      >
        Kembali ke peta
      </Link>
    </div>
  );
}
