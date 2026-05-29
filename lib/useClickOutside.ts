import { useEffect, type RefObject } from "react";

// Panggil handler saat klik/tap terjadi di luar elemen ref. Aktif hanya bila `when` true.
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  handler: () => void,
  when: boolean
) {
  useEffect(() => {
    if (!when) return;
    function onPointer(e: PointerEvent) {
      const el = ref.current;
      if (el && !el.contains(e.target as Node)) handler();
    }
    // pakai pointerdown agar responsif di mobile & desktop
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [ref, handler, when]);
}
