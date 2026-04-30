"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  buildChartHref,
  type ChartParams,
  type RangePreset,
} from "@/lib/chartUrlState";

interface RangeControlsProps {
  params: ChartParams;
}

interface PresetOption {
  value: Exclude<RangePreset, "custom"> | "custom";
  label: string;
}

const PRESETS: readonly PresetOption[] = [
  { value: "this-month", label: "This month" },
  { value: "last-3-months", label: "Last 3 months" },
  { value: "this-year", label: "This year" },
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom" },
] as const;

const ISO_DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return false;
  return d.toISOString().slice(0, 10) === value;
}

export function RangeControls({
  params,
}: RangeControlsProps): React.ReactElement {
  const router = useRouter();
  const isCustom = params.range === "custom";

  // `customOpen` reflects whether the date inputs are visible. Begins true
  // whenever the URL already declares a custom range; otherwise it flips on
  // when the user clicks the Custom preset and stays on until they pick a
  // different preset.
  const [customOpen, setCustomOpen] = useState<boolean>(isCustom);
  const [from, setFrom] = useState<string>(params.from ?? "");
  const [to, setTo] = useState<string>(params.to ?? "");

  // Keep the local typing state in sync when the URL changes from outside
  // (e.g. preset click pushes a new href and the server re-renders).
  useEffect(() => {
    setCustomOpen((open) => open || isCustom);
  }, [isCustom]);

  useEffect(() => {
    setFrom(params.from ?? "");
    setTo(params.to ?? "");
  }, [params.from, params.to]);

  const handlePresetClick = (preset: PresetOption["value"]): void => {
    if (preset === "custom") {
      // Reveal the inputs but do NOT push yet — the user must pick both
      // dates before we navigate.
      setCustomOpen(true);
      return;
    }
    setCustomOpen(false);
    router.push(buildChartHref(params, { range: preset }));
  };

  const tryPushCustom = (nextFrom: string, nextTo: string): void => {
    if (nextFrom === "" || nextTo === "") return;
    if (!isValidIsoDate(nextFrom) || !isValidIsoDate(nextTo)) return;
    if (nextFrom > nextTo) return;
    router.push(
      buildChartHref(params, {
        range: "custom",
        from: nextFrom,
        to: nextTo,
      }),
    );
  };

  const handleFromChange = (value: string): void => {
    setFrom(value);
    tryPushCustom(value, to);
  };

  const handleToChange = (value: string): void => {
    setTo(value);
    tryPushCustom(from, value);
  };

  const presetButtonClass = (selected: boolean): string =>
    "rounded px-3 py-1 text-sm " +
    (selected
      ? "bg-text text-surface"
      : "border border-border bg-surface text-muted hover:text-text");

  const showCustomInputs = customOpen || isCustom;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => {
          const selected =
            preset.value === "custom"
              ? isCustom || customOpen
              : params.range === preset.value;
          return (
            <button
              key={preset.value}
              type="button"
              onClick={() => handlePresetClick(preset.value)}
              aria-pressed={selected}
              className={presetButtonClass(selected)}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {showCustomInputs && (
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-muted">
            <span>From</span>
            <input
              type="date"
              value={from}
              onChange={(e) => handleFromChange(e.target.value)}
              className="rounded border border-border bg-surface px-2 py-1 text-sm text-text"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-muted">
            <span>To</span>
            <input
              type="date"
              value={to}
              onChange={(e) => handleToChange(e.target.value)}
              className="rounded border border-border bg-surface px-2 py-1 text-sm text-text"
            />
          </label>
        </div>
      )}
    </div>
  );
}
