import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan — Train Tracker Purwokerto",
  description:
    "Syarat & ketentuan penggunaan Train Tracker Purwokerto, termasuk batasan akurasi data estimasi.",
};

export default function KetentuanPage() {
  return (
    <article className="mx-auto w-full max-w-2xl px-5 py-8">
      <Link href="/" className="text-xs font-medium text-blue-700">
        &larr; Beranda
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-zinc-900">
        Syarat &amp; Ketentuan
      </h1>
      <p className="mt-1 text-sm text-zinc-500">Terakhir diperbarui: 29 Mei 2026</p>

      <div className="mt-6 flex flex-col gap-6 text-sm leading-relaxed text-zinc-700">
        <section>
          <p>
            Dengan menggunakan Train Tracker Purwokerto (&ldquo;Layanan&rdquo;),
            Anda menyetujui syarat &amp; ketentuan berikut. Layanan ini adalah
            proyek komunitas non-komersial.
          </p>
        </section>

        <section className="rounded-lg bg-amber-50 p-4">
          <h2 className="mb-1 font-semibold text-amber-900">
            1. Posisi & jadwal adalah ESTIMASI
          </h2>
          <p className="text-amber-800">
            Posisi kereta yang ditampilkan adalah <strong>perkiraan</strong> yang
            dihitung dari jadwal, <strong>bukan lokasi GPS real-time</strong>.
            Waktu kedatangan/keberangkatan adalah estimasi dan dapat berbeda dari
            kondisi sebenarnya (mis. keterlambatan, perubahan jadwal, gangguan
            operasional). Jangan jadikan Layanan sebagai satu-satunya acuan untuk
            keputusan penting seperti mengejar kereta. Selalu konfirmasi ke sumber
            resmi PT KAI.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-zinc-900">
            2. Bukan layanan resmi KAI
          </h2>
          <p>
            Layanan ini <strong>tidak berafiliasi, tidak didukung, dan tidak
            disponsori</strong> oleh PT Kereta Api Indonesia (Persero) maupun
            instansi pemerintah mana pun. Seluruh nama kereta dan stasiun adalah
            milik pemegang haknya masing-masing. Untuk informasi resmi, jadwal
            pasti, dan pembelian tiket, gunakan kanal resmi PT KAI.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-zinc-900">
            3. Sumber data
          </h2>
          <p>
            Data jadwal berbasis informasi jadwal publik dan dapat mengandung
            ketidakakuratan atau ketidaklengkapan. Data disediakan apa adanya
            tanpa jaminan kebenaran.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-zinc-900">
            4. Batasan tanggung jawab
          </h2>
          <p>
            Layanan disediakan &ldquo;sebagaimana adanya&rdquo; (as is) tanpa
            jaminan apa pun. Pengelola tidak bertanggung jawab atas kerugian,
            keterlambatan, atau konsekuensi apa pun yang timbul dari penggunaan
            atau ketidakmampuan menggunakan Layanan.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-zinc-900">
            5. Penggunaan yang wajar
          </h2>
          <p>
            Anda setuju menggunakan Layanan untuk keperluan pribadi dan tidak
            melakukan tindakan yang dapat mengganggu, membebani, atau merusak
            Layanan.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-zinc-900">6. Perubahan</h2>
          <p>
            Syarat ini dapat diperbarui sewaktu-waktu. Penggunaan Layanan yang
            berkelanjutan berarti Anda menyetujui versi terbaru.
          </p>
        </section>

        <section>
          <h2 className="mb-1 font-semibold text-zinc-900">7. Kontak</h2>
          <p>
            Pertanyaan:{" "}
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
          <Link href="/privasi" className="text-blue-700">
            Kebijakan Privasi
          </Link>
          .
        </p>
      </div>
    </article>
  );
}
