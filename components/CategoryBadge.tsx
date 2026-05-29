import type { TrainCategory } from "@/lib/types";

// Penanda untuk kereta non-penumpang (barang/dinas). Penumpang tak diberi badge.
export function CategoryBadge({ category }: { category?: TrainCategory }) {
  if (!category || category === "penumpang") return null;
  const label = category === "barang" ? "Barang" : "Dinas";
  return (
    <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-600 ring-1 ring-inset ring-zinc-300">
      {label}
    </span>
  );
}
