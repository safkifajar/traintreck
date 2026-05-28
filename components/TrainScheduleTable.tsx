import type { StopView } from "@/lib/detail";

interface Props {
  stopViews: StopView[];
  nameById: Record<string, string>;
}

export function TrainScheduleTable({ stopViews, nameById }: Props) {
  return (
    <ol className="flex flex-col">
      {stopViews.map((sv, i) => {
        const { stop, state, isPwt } = sv;
        const name = nameById[stop.stationId] ?? stop.stationId;
        const isLast = i === stopViews.length - 1;
        return (
          <li key={`${stop.stationId}-${i}`} className="flex gap-3">
            {/* Rel timeline */}
            <div className="flex w-5 flex-col items-center">
              <span
                className={`mt-1.5 h-3 w-3 shrink-0 rounded-full border-2 ${
                  state === "current"
                    ? "border-blue-600 bg-blue-600"
                    : state === "passed"
                      ? "border-zinc-300 bg-zinc-300"
                      : "border-zinc-400 bg-white"
                }`}
              />
              {!isLast && (
                <span
                  className={`w-0.5 flex-1 ${
                    state === "passed" ? "bg-zinc-300" : "bg-zinc-200"
                  }`}
                />
              )}
            </div>
            {/* Konten */}
            <div
              className={`flex flex-1 items-center justify-between gap-2 pb-4 ${
                state === "passed" ? "opacity-50" : ""
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`truncate ${
                      state === "current"
                        ? "font-semibold text-blue-700"
                        : "font-medium text-zinc-900"
                    }`}
                  >
                    {name}
                  </span>
                  {isPwt && (
                    <span className="rounded border border-blue-300 bg-blue-50 px-1 text-[10px] font-semibold text-blue-700">
                      PWT
                    </span>
                  )}
                  {state === "passed" && (
                    <span className="text-xs text-zinc-400">&#10003;</span>
                  )}
                </div>
              </div>
              <div className="shrink-0 text-right text-xs tabular-nums text-zinc-600">
                <span className="inline-block w-12">
                  {stop.arrival ?? "—"}
                </span>
                <span className="mx-1 text-zinc-300">/</span>
                <span className="inline-block w-12">
                  {stop.departure ?? "—"}
                </span>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
