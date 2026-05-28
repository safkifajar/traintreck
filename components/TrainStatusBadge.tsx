import type { TrainStatus } from "@/lib/types";
import { statusColor, statusLabel } from "@/lib/display";

export function TrainStatusBadge({ status }: { status: TrainStatus }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white"
      style={{ backgroundColor: statusColor(status) }}
    >
      {statusLabel(status)}
    </span>
  );
}
