import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kebijakan Privasi — Train Tracker Purwokerto",
  description:
    "Kebijakan privasi Train Tracker Purwokerto: bagaimana data lokasi dan informasi Anda diperlakukan.",
};

export default function PrivasiPage() {
  return (
    <article className="mx-auto w-full max-w-2xl px-5 py-8">
      <Link href="/" className="text-xs font-medium text-blue-700">
        &larr; Beranda
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-zinc-900">Kebijakan Privasi</h1>
      <p className="mt-1 text-sm text-zinc-500">Terakhir diperbarui: 29 Mei 2026</p>

      <div className="mt-6 flex flex-col gap-6 text-sm leading-relaxed text-zinc-700">
        <section>
          <p>
            Train Tracker Purwokerto (&ldquo;Layanan&rdquo;) adalah proyek
            komunitas non-komersial. Kebijakan ini menjelaskan bagaimana
            informasi Anda diperlakukan saat menggunakan Layanan.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-zinc-900">
            1. Tidak ada akun & tidak ada server data
          </h2>
          <p>
            Layanan tidak meminta pendaftaran, login, atau data pribadi. Tidak
            ada basis data pengguna. Perkiraan posisi kereta dihitung langsung di
            perangkat Anda (browser) dari jadwal yang dibundel ke aplikasi.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-zinc-900">
            2. Data lokasi (fitur &ldquo;Lokasi saya&rdquo;)
          </h2>
          <p>
            Jika Anda menekan tombol &ldquo;Lokasi saya&rdquo;, browser akan
            meminta izin untuk mengakses lokasi GPS perangkat Anda. Lokasi ini
            hanya digunakan untuk menampilkan titik posisi Anda di peta{" "}
            <strong>di perangkat Anda sendiri</strong>. Lokasi{" "}
            <strong>tidak dikirim, disimpan, atau dibagikan</strong> ke server
            mana pun. Anda dapat menolak atau mencabut izin lokasi kapan saja
            melalui pengaturan browser.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-zinc-900">
            3. Peta & layanan pihak ketiga
          </h2>
          <p>
            Peta ditampilkan menggunakan penyedia ubin peta pihak ketiga
            (mis. OpenFreeMap/MapTiler). Saat memuat peta, alamat IP perangkat
            Anda dapat terlihat oleh penyedia tersebut sebagaimana lazimnya
            permintaan internet. Layanan tidak mengontrol kebijakan privasi pihak
            ketiga ini.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-zinc-900">
            4. Analitik & cookie
          </h2>
          <p>
            Layanan tidak menggunakan cookie pelacakan maupun analitik yang
            mengidentifikasi Anda secara pribadi. Penyedia hosting dapat mencatat
            log akses standar (mis. alamat IP, jenis browser) untuk keperluan
            operasional.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-zinc-900">5. Perubahan</h2>
          <p>
            Kebijakan ini dapat diperbarui sewaktu-waktu. Perubahan akan tercermin
            pada tanggal &ldquo;terakhir diperbarui&rdquo; di atas.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-zinc-900">6. Kontak</h2>
          <p>
            Pertanyaan terkait privasi:{" "}
            <a
              href="mailto:kaladigital.id@gmail.com"
              className="font-medium text-blue-700"
            >
              kaladigital.id@gmail.com
            </a>
          </p>
        </section>

        <p className="text-xs text-zinc-400">
          Lihat juga{" "}
          <Link href="/ketentuan" className="text-blue-700">
            Syarat &amp; Ketentuan
          </Link>
          .
        </p>
      </div>
    </article>
  );
}
