import type { DayOfWeek } from "./types";

// Menit dalam sehari (0..1439) untuk "HH:MM"
export function hhmmToMinutes(s: string): number {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
}

// Format menit-dalam-sehari (boleh > 1440) jadi "HH:MM" WIB.
export function minutesToHhmm(min: number): string {
  const m = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export interface WibNow {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  dow: DayOfWeek;
  minutesOfDay: number;
}

// Kembalikan komponen waktu "sekarang" di zona Asia/Jakarta (WIB).
// Pendekatan: ambil komponen tanggal/jam di zona Asia/Jakarta lalu rekonstruksi.
export function nowWib(now: Date = new Date()): WibNow {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(now).map((p) => [p.type, p.value])
  );
  const dowMap: Record<string, DayOfWeek> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const hour = Number(parts.hour) % 24;
  const minute = Number(parts.minute);
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour,
    minute,
    dow: dowMap[parts.weekday as string],
    minutesOfDay: hour * 60 + minute,
  };
}
