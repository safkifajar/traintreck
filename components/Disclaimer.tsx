const TEXT = "Posisi estimasi dari jadwal GAPEKA, bukan GPS real-time.";

// Disclaimer estimasi posisi. WAJIB muncul di semua tampilan posisi (PRD Bab 2.3).
export function Disclaimer({
  variant = "block",
}: {
  variant?: "block" | "badge";
}) {
  if (variant === "badge") {
    return (
      <span className="pointer-events-none inline-flex items-center rounded-full bg-zinc-900/80 px-2.5 py-1 text-[11px] font-medium text-white shadow-sm backdrop-blur">
        {TEXT}
      </span>
    );
  }
  return (
    <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
      {TEXT}
    </p>
  );
}
