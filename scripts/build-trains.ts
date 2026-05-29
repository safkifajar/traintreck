// Generator trains.json dari papan jadwal PWT (data/source/pwt-board-*.tsv)
// + model koridor (data/source/corridor.json).
//
// Cara pakai:  node --experimental-strip-types scripts/build-trains.ts
//
// CATATAN AKURASI: jam di PWT adalah DATA ASLI (GAPEKA 2025 via 168railway).
// Jam di stasiun lain DIESTIMASI proporsional jarak koridor (km perkiraan).
// Jadi ETA Purwokerto akurat; posisi marker di luar PWT adalah estimasi.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

interface Corridor {
  mainline: Record<string, number>;
  branchTegal: { _from: string } & Record<string, number>;
  branchMalang: { _from: string } & Record<string, number>;
}
const corridor: Corridor = JSON.parse(
  readFileSync(join(ROOT, "data/source/corridor.json"), "utf8")
);

// Nama stasiun (seperti di board) -> kode stasiun di stations.json.
const NAME_TO_ID: Record<string, string> = {
  "Jakarta Gudang": "JAKG",
  "Gambir": "GMR",
  "Pasar Senen": "PSE",
  "Kampung Bandan": "KPB",
  "Jatinegara": "JNG",
  "Cirebon": "CN",
  "Cirebon Prujakan": "CNP",
  "Tegal": "TG",
  "Bumiayu": "BMA",
  "Prupuk": "PPK",
  "Purwokerto": "PWT",
  "Kroya": "KYA",
  "Kutoarjo": "KTA",
  "Yogyakarta": "YK",
  "Lempuyangan": "LPN",
  "Purwosari": "PWS",
  "Solo Balapan": "SLO",
  "Solo Jebres": "SK",
  "Madiun": "MN",
  "Jombang": "JG",
  "Surabaya Gubeng": "SGU",
  "Blitar": "BL",
  "Malang": "ML",
};

type TrainClass = "Eksekutif" | "Campuran" | "Bisnis" | "Ekonomi" | "Lokal";

// Klasifikasi kelas dari nama kereta (heuristik GAPEKA umum).
const EKSEKUTIF = [
  "Argo", "Taksaka", "Bima", "Gajayana", "Manahan", "Cakrabuana",
  "Senja Utama", "Fajar Utama", "Sembrani", "Purwojaya",
];
const EKONOMI = [
  "Bengawan", "Progo", "Serayu", "Logawa", "Bogowonto", "Gajahwong",
  "Kutojaya", "Jaka Tingkir", "Gayabaru", "Jayakarta", "Singasari",
  "Bangunkarta", "Mataram", "Kahuripan", "Pasundan",
];
const LOKAL = ["Baturraden", "Joglosemarkerto", "Kamandaka", "Prameks", "Madiun Jaya"];

function classify(name: string): TrainClass {
  if (EKSEKUTIF.some((k) => name.includes(k))) return "Eksekutif";
  if (LOKAL.some((k) => name.includes(k))) return "Lokal";
  if (EKONOMI.some((k) => name.includes(k))) return "Ekonomi";
  // KLB/PLB/barang/parcel/dinas -> Campuran (penanda lain-lain).
  return "Campuran";
}

type TrainCategory = "penumpang" | "barang" | "dinas";

// Klasifikasi jenis perjalanan dari id + nama.
// barang: angkutan barang (tanker, parcel, kirim KPJR).
// dinas:  KLB non-komersial (ukur, rescue, inspeksi, rombongan, kirim
//         lokomotif/rangkaian, motis). PLB tambahan = tetap penumpang.
function categorize(id: string, name: string): TrainCategory {
  if (/Tanker|Parcel|Gudang/i.test(name)) return "barang";
  if (
    /KLB|Kereta Ukur|Rescue|Inspeksi|Rombongan|Kirim (Lokomotif|Rangkaian|KPJR)|^Kirim |Motis|KPJR|Asistensi/i.test(
      name
    )
  ) {
    return "dinas";
  }
  return "penumpang";
}

function hhmmToMin(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
}
function minToHhmm(min: number): string {
  const m = ((min % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

// Posisi km sebuah stasiun di koridor (mainline atau cabang).
function kmOf(id: string): number | null {
  if (id in corridor.mainline) return corridor.mainline[id];
  if (id in corridor.branchTegal && id !== "_from")
    return corridor.branchTegal[id] as number;
  if (id in corridor.branchMalang && id !== "_from")
    return corridor.branchMalang[id] as number;
  return null;
}

// Bangun urutan stasiun antara dua titik mengikuti koridor utama,
// menyertakan stasiun mainline yang berada di antara keduanya (inklusif ujung).
const MAINLINE_ORDER = Object.keys(corridor.mainline).sort(
  (a, b) => corridor.mainline[a] - corridor.mainline[b]
);

function pathBetween(fromId: string, toId: string): string[] {
  // Kasus cabang (Tegal/Malang): sambungkan via titik _from di mainline.
  const branchOf = (id: string): { from: string } | null => {
    if (id === "TG") return { from: corridor.branchTegal._from };
    if (id === "BL" || id === "ML") return { from: corridor.branchMalang._from };
    return null;
  };

  const expandMain = (a: string, b: string): string[] => {
    const ka = corridor.mainline[a];
    const kb = corridor.mainline[b];
    if (ka == null || kb == null) return [a, b];
    const asc = ka <= kb;
    const seq = MAINLINE_ORDER.filter((s) => {
      const k = corridor.mainline[s];
      return asc ? k >= ka && k <= kb : k <= ka && k >= kb;
    });
    return asc ? seq : seq.reverse();
  };

  const fb = branchOf(fromId);
  const tb = branchOf(toId);

  if (!fb && !tb) return expandMain(fromId, toId);
  if (fb && !tb) return [fromId, ...expandMain(fb.from, toId)];
  if (!fb && tb) return [...expandMain(fromId, tb.from), toId];
  // keduanya cabang
  return [fromId, ...expandMain(fb!.from, tb!.from), toId];
}

interface Stop {
  stationId: string;
  arrival: string | null;
  departure: string | null;
  dayOffset: number;
}
interface Train {
  id: string;
  name: string;
  class: TrainClass;
  category: TrainCategory;
  operator: string;
  originId: string;
  destinationId: string;
  daysOfOperation: number[];
  stops: Stop[];
}

const DWELL = 2; // menit berhenti default di stasiun antara
const SPEED_KM_PER_MIN = 1.0; // ~60 km/jam rata-rata (perkiraan)

function buildTrain(
  rawNo: string,
  name: string,
  originId: string,
  destId: string,
  arrPWT: string | null,
  depPWT: string | null
): Train | null {
  const path = pathBetween(originId, destId);
  if (!path.includes("PWT")) return null; // wajib lewat PWT
  // Hilangkan duplikat berurutan.
  const seq = path.filter((s, i) => i === 0 || s !== path[i - 1]);

  const kmList = seq.map(kmOf);
  if (kmList.some((k) => k == null)) return null;

  const pwtIdx = seq.indexOf("PWT");

  // Jangkar waktu di PWT: pakai arr (atau dep) sebagai menit absolut hari board.
  const anchorArr = arrPWT ? hhmmToMin(arrPWT) : depPWT ? hhmmToMin(depPWT) : null;
  const anchorDep = depPWT ? hhmmToMin(depPWT) : arrPWT ? hhmmToMin(arrPWT) : null;
  if (anchorArr == null || anchorDep == null) return null;

  // Jarak KUMULATIF sepanjang path (seq sudah urut geografis benar, termasuk
  // cabang), sehingga selalu monoton naik sesuai arah perjalanan.
  const cum: number[] = [0];
  for (let i = 1; i < seq.length; i++) {
    cum[i] = cum[i - 1] + Math.abs(kmList[i]! - kmList[i - 1]!);
  }
  const pwtCum = cum[pwtIdx];

  // Estimasi menit absolut KONTINU tiap stasiun, PWT sebagai jangkar.
  // along = jarak kumulatif dari PWT (negatif = sebelum PWT, positif = sesudah).
  type Calc = { id: string; arrAbs: number; depAbs: number };
  const calc: Calc[] = seq.map((id, i) => {
    const along = cum[i] - pwtCum;
    const isPwt = i === pwtIdx;
    if (isPwt) return { id, arrAbs: anchorArr, depAbs: anchorDep };
    if (along < 0) {
      const t = anchorArr + Math.round(along / SPEED_KM_PER_MIN);
      return { id, arrAbs: t, depAbs: t + DWELL };
    }
    const t = anchorDep + Math.round(along / SPEED_KM_PER_MIN);
    return { id, arrAbs: t, depAbs: t + DWELL };
  });

  // Geser semua agar nilai absolut terkecil >= 0, lalu derive dayOffset.
  const minAbs = Math.min(...calc.map((c) => Math.min(c.arrAbs, c.depAbs)));
  const shift = minAbs < 0 ? -Math.floor(minAbs / 1440) * 1440 : 0;

  const cleanStops: Stop[] = calc.map((c, i) => {
    const isOrigin = i === 0;
    const isDest = i === seq.length - 1;
    let arr = c.arrAbs + shift;
    const dep = c.depAbs + shift;
    // Model Stop hanya punya 1 dayOffset, jadi arrival & departure wajib di hari
    // yang sama. Bila dwell kebetulan menyeberang tengah malam (arr & dep beda
    // hari), tiadakan dwell (arr = dep) agar konsisten — kehilangan ~2 menit tak
    // signifikan untuk estimasi posisi.
    if (Math.floor(arr / 1440) !== Math.floor(dep / 1440)) arr = dep;
    const ref = isOrigin ? dep : arr;
    return {
      stationId: c.id,
      arrival: isOrigin ? null : minToHhmm(arr),
      departure: isDest ? null : minToHhmm(dep),
      dayOffset: Math.floor(ref / 1440),
    };
  });

  const id = rawNo.replace(/\s+/g, "_");
  return {
    id,
    name,
    class: classify(name),
    category: categorize(rawNo, name),
    operator: "KAI",
    originId,
    destinationId: destId,
    daysOfOperation: [0, 1, 2, 3, 4, 5, 6],
    stops: cleanStops,
  };
}

// ---- Parse board ----
const board = readFileSync(
  join(ROOT, "data/source/pwt-board-2026-05-28.tsv"),
  "utf8"
);
const lines = board.split(/\r?\n/).filter((l) => l && !l.startsWith("#"));

const trains: Train[] = [];
const skipped: string[] = [];

for (const line of lines) {
  const parts = line.split("\t");
  if (parts.length < 5) continue;
  const [rawNo, name, route, arr, dep] = parts.map((p) => p.trim());
  const m = route.split("→").map((s) => s.trim());
  if (m.length !== 2) {
    skipped.push(`${rawNo}: route tak terbaca`);
    continue;
  }
  const originId = NAME_TO_ID[m[0]];
  const destId = NAME_TO_ID[m[1]];
  if (!originId || !destId) {
    skipped.push(`${rawNo}: stasiun tak dikenal (${m[0]} / ${m[1]})`);
    continue;
  }
  const arrPWT = arr === "-" ? null : arr;
  const depPWT = dep === "-" ? null : dep;
  const t = buildTrain(rawNo, name, originId, destId, arrPWT, depPWT);
  if (!t) {
    skipped.push(`${rawNo}: gagal bangun (mungkin tak lewat PWT)`);
    continue;
  }
  trains.push(t);
}

writeFileSync(
  join(ROOT, "data/trains.json"),
  JSON.stringify(trains, null, 2) + "\n"
);

console.log(`Generated ${trains.length} trains.`);
if (skipped.length) {
  console.log(`Skipped ${skipped.length}:`);
  for (const s of skipped) console.log("  - " + s);
}
