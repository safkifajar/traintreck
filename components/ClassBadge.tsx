import type { TrainClass } from "@/lib/types";
import { classColor } from "@/lib/display";

export function ClassBadge({ trainClass }: { trainClass: TrainClass }) {
  return (
    <span
      className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: classColor(trainClass) }}
    >
      {trainClass}
    </span>
  );
}
