import { describe, it, expect } from "vitest";
import {
  parseChartParams,
  buildChartHref,
  type ChartParams,
} from "@/lib/chartUrlState";
import { EXPENSE_CATEGORIES } from "@/lib/categories";

const KNOWN_CATEGORY = EXPENSE_CATEGORIES[0]; // "Groceries"

describe("parseChartParams", () => {
  it("returns the default range for an empty object", () => {
    expect(parseChartParams({})).toEqual({ range: "this-month" });
  });

  it("falls back to the default when range is unknown", () => {
    expect(parseChartParams({ range: "next-decade" })).toEqual({
      range: "this-month",
    });
  });

  it("passes valid presets through unchanged", () => {
    expect(parseChartParams({ range: "last-3-months" })).toEqual({
      range: "last-3-months",
    });
    expect(parseChartParams({ range: "this-year" })).toEqual({
      range: "this-year",
    });
    expect(parseChartParams({ range: "all" })).toEqual({ range: "all" });
  });

  it("parses range=custom with valid from and to", () => {
    expect(
      parseChartParams({
        range: "custom",
        from: "2026-01-01",
        to: "2026-01-31",
      }),
    ).toEqual({
      range: "custom",
      from: "2026-01-01",
      to: "2026-01-31",
    });
  });

  it("falls back to default when range=custom is missing from", () => {
    expect(parseChartParams({ range: "custom", to: "2026-01-31" })).toEqual({
      range: "this-month",
    });
  });

  it("falls back to default when range=custom is missing to", () => {
    expect(parseChartParams({ range: "custom", from: "2026-01-01" })).toEqual({
      range: "this-month",
    });
  });

  it("falls back to default when range=custom is missing both from and to", () => {
    expect(parseChartParams({ range: "custom" })).toEqual({
      range: "this-month",
    });
  });

  it("falls back to default when range=custom has malformed from (out-of-range month/day)", () => {
    expect(
      parseChartParams({
        range: "custom",
        from: "2026-13-40",
        to: "2026-01-31",
      }),
    ).toEqual({ range: "this-month" });
  });

  it("falls back to default when range=custom has non-date from", () => {
    expect(
      parseChartParams({
        range: "custom",
        from: "not-a-date",
        to: "2026-01-31",
      }),
    ).toEqual({ range: "this-month" });
  });

  it("falls back to default when range=custom has a calendar-impossible date (2026-02-30)", () => {
    expect(
      parseChartParams({
        range: "custom",
        from: "2026-02-30",
        to: "2026-03-31",
      }),
    ).toEqual({ range: "this-month" });
  });

  it("ignores from/to when range is not custom", () => {
    expect(
      parseChartParams({
        range: "this-year",
        from: "2026-01-01",
        to: "2026-01-31",
      }),
    ).toEqual({ range: "this-year" });
  });

  it("keeps a known category", () => {
    expect(parseChartParams({ category: KNOWN_CATEGORY })).toEqual({
      range: "this-month",
      category: KNOWN_CATEGORY,
    });
  });

  it("drops an unknown category", () => {
    expect(parseChartParams({ category: "Crypto" })).toEqual({
      range: "this-month",
    });
  });

  it("keeps a valid YYYY-MM month", () => {
    expect(parseChartParams({ month: "2026-04" })).toEqual({
      range: "this-month",
      month: "2026-04",
    });
  });

  it("drops a single-digit-month month value", () => {
    expect(parseChartParams({ month: "2026-4" })).toEqual({
      range: "this-month",
    });
  });

  it("drops an out-of-range month value", () => {
    expect(parseChartParams({ month: "2026-13" })).toEqual({
      range: "this-month",
    });
  });

  it("drops a non-date month value", () => {
    expect(parseChartParams({ month: "abc" })).toEqual({
      range: "this-month",
    });
  });

  it("uses the first element of an array-valued search param", () => {
    expect(parseChartParams({ range: ["custom", "all"] })).toEqual({
      range: "this-month",
    });
    expect(parseChartParams({ range: ["this-year", "all"] })).toEqual({
      range: "this-year",
    });
  });

  it("accepts a URLSearchParams instance with the same result as an object", () => {
    const objectInput = {
      range: "custom",
      from: "2026-01-01",
      to: "2026-01-31",
      category: KNOWN_CATEGORY,
      month: "2026-04",
    };
    const usp = new URLSearchParams(
      "range=custom&from=2026-01-01&to=2026-01-31" +
        `&category=${encodeURIComponent(KNOWN_CATEGORY)}&month=2026-04`,
    );
    expect(parseChartParams(usp)).toEqual(parseChartParams(objectInput));
  });

  it("never throws on garbage input and falls back to default", () => {
    const garbage = {
      range: 42 as unknown as string,
      from: null as unknown as string,
    };
    expect(() => parseChartParams(garbage)).not.toThrow();
    expect(parseChartParams(garbage)).toEqual({ range: "this-month" });
  });
});

describe("buildChartHref", () => {
  it("returns /app for the default range (range omitted from URL)", () => {
    expect(buildChartHref({ range: "this-month" }, {})).toBe("/app");
  });

  it("emits range when it differs from the default", () => {
    expect(buildChartHref({ range: "this-year" }, {})).toBe(
      "/app?range=this-year",
    );
  });

  it("emits range, from, and to for a custom range", () => {
    const href = buildChartHref(
      { range: "custom", from: "2026-01-01", to: "2026-01-31" },
      {},
    );
    expect(href).toBe("/app?range=custom&from=2026-01-01&to=2026-01-31");
  });

  it("drops from/to when switching from custom to a preset", () => {
    expect(
      buildChartHref(
        { range: "custom", from: "2026-01-01", to: "2026-01-31" },
        { range: "this-month" },
      ),
    ).toBe("/app");
  });

  it("emits category and month when present", () => {
    const href = buildChartHref(
      { range: "this-month", category: KNOWN_CATEGORY, month: "2026-04" },
      {},
    );
    expect(href).toBe(
      `/app?category=${encodeURIComponent(KNOWN_CATEGORY)}&month=2026-04`,
    );
  });

  it("clears category when patch sets category to undefined explicitly", () => {
    const prev: ChartParams = {
      range: "this-month",
      category: KNOWN_CATEGORY,
    };
    expect(buildChartHref(prev, { category: undefined })).toBe("/app");
  });

  it("is a no-op for keys not in the patch (category in prev survives)", () => {
    const prev: ChartParams = {
      range: "this-month",
      category: KNOWN_CATEGORY,
    };
    expect(buildChartHref(prev, {})).toBe(
      `/app?category=${encodeURIComponent(KNOWN_CATEGORY)}`,
    );
  });

  it("round-trips a custom range through parseChartParams", () => {
    const href = buildChartHref(
      { range: "custom", from: "2026-01-01", to: "2026-01-31" },
      {},
    );
    const qs = href.split("?")[1] ?? "";
    expect(parseChartParams(new URLSearchParams(qs))).toEqual({
      range: "custom",
      from: "2026-01-01",
      to: "2026-01-31",
    });
  });

  it("round-trips a category query through parseChartParams", () => {
    const href = buildChartHref(
      { range: "this-month", category: KNOWN_CATEGORY },
      {},
    );
    const qs = href.split("?")[1] ?? "";
    expect(parseChartParams(new URLSearchParams(qs))).toEqual({
      range: "this-month",
      category: KNOWN_CATEGORY,
    });
  });

  it("round-trips a month query through parseChartParams", () => {
    const href = buildChartHref({ range: "this-month", month: "2026-04" }, {});
    const qs = href.split("?")[1] ?? "";
    expect(parseChartParams(new URLSearchParams(qs))).toEqual({
      range: "this-month",
      month: "2026-04",
    });
  });
});
