import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "./categories";
import type { RangePreset } from "./aggregations";

export type { RangePreset };

export interface ChartParams {
  range: RangePreset;
  from?: string;
  to?: string;
  category?: string;
  month?: string;
}

const RANGE_PRESETS: readonly RangePreset[] = [
  "this-month",
  "last-3-months",
  "this-year",
  "all",
  "custom",
] as const;

const DEFAULT_RANGE: RangePreset = "this-month";

const ISO_DATE_RE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

const VALID_CATEGORIES: ReadonlySet<string> = new Set<string>([
  ...EXPENSE_CATEGORIES,
  ...INCOME_CATEGORIES,
]);

type SearchParamsLike =
  | URLSearchParams
  | { [key: string]: string | string[] | undefined }
  | Record<string, string | undefined>;

function readParam(input: SearchParamsLike, key: string): string | undefined {
  if (input instanceof URLSearchParams) {
    const v = input.get(key);
    return v === null ? undefined : v;
  }
  const raw = (input as { [k: string]: string | string[] | undefined })[key];
  if (raw === undefined) return undefined;
  if (Array.isArray(raw)) return raw.length > 0 ? raw[0] : undefined;
  return raw;
}

function isRangePreset(value: string): value is RangePreset {
  return (RANGE_PRESETS as readonly string[]).includes(value);
}

function isValidIsoDate(value: string): boolean {
  if (!ISO_DATE_RE.test(value)) return false;
  // Reject impossible calendar dates (e.g. 2026-02-30) by round-tripping
  // through `Date`.
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return false;
  return d.toISOString().slice(0, 10) === value;
}

function isValidMonth(value: string): boolean {
  return MONTH_RE.test(value);
}

function isValidCategoryToken(value: string): boolean {
  return VALID_CATEGORIES.has(value);
}

export function parseChartParams(searchParams: SearchParamsLike): ChartParams {
  const rawRange = readParam(searchParams, "range");
  let range: RangePreset = DEFAULT_RANGE;
  if (rawRange !== undefined && isRangePreset(rawRange)) {
    range = rawRange;
  }

  let from: string | undefined;
  let to: string | undefined;

  if (range === "custom") {
    const rawFrom = readParam(searchParams, "from");
    const rawTo = readParam(searchParams, "to");
    if (
      rawFrom !== undefined &&
      rawTo !== undefined &&
      isValidIsoDate(rawFrom) &&
      isValidIsoDate(rawTo)
    ) {
      from = rawFrom;
      to = rawTo;
    } else {
      // `range=custom` with missing/malformed dates falls back to the default.
      range = DEFAULT_RANGE;
    }
  }

  const rawCategory = readParam(searchParams, "category");
  const category =
    rawCategory !== undefined && isValidCategoryToken(rawCategory)
      ? rawCategory
      : undefined;

  const rawMonth = readParam(searchParams, "month");
  const month =
    rawMonth !== undefined && isValidMonth(rawMonth) ? rawMonth : undefined;

  const result: ChartParams = { range };
  if (from !== undefined) result.from = from;
  if (to !== undefined) result.to = to;
  if (category !== undefined) result.category = category;
  if (month !== undefined) result.month = month;
  return result;
}

export function buildChartHref(
  prev: ChartParams,
  patch: Partial<ChartParams>,
): string {
  // Merge: explicit `undefined` in patch drops the key.
  const merged: ChartParams = { ...prev };
  if (patch.range !== undefined) merged.range = patch.range;
  else if ("range" in patch) delete (merged as Partial<ChartParams>).range;
  if (patch.from !== undefined) merged.from = patch.from;
  else if ("from" in patch) delete merged.from;
  if (patch.to !== undefined) merged.to = patch.to;
  else if ("to" in patch) delete merged.to;
  if (patch.category !== undefined) merged.category = patch.category;
  else if ("category" in patch) delete merged.category;
  if (patch.month !== undefined) merged.month = patch.month;
  else if ("month" in patch) delete merged.month;

  // `range` is required on `ChartParams`; if the merge somehow dropped it
  // (e.g. patch had `range: undefined`), restore the default.
  if (merged.range === undefined) {
    merged.range = DEFAULT_RANGE;
  }

  // Drop `from`/`to` whenever the active range is not `custom`.
  if (merged.range !== "custom") {
    delete merged.from;
    delete merged.to;
  }

  const params = new URLSearchParams();

  // Only emit `range` when it differs from the default to keep URLs short.
  if (merged.range !== DEFAULT_RANGE) {
    params.set("range", merged.range);
  }
  if (merged.range === "custom") {
    if (merged.from !== undefined) params.set("from", merged.from);
    if (merged.to !== undefined) params.set("to", merged.to);
  }
  if (merged.category !== undefined) params.set("category", merged.category);
  if (merged.month !== undefined) params.set("month", merged.month);

  const qs = params.toString();
  return qs.length === 0 ? "/app" : `/app?${qs}`;
}
