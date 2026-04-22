import { describe, it, expect } from "vitest";
import { SUPPORTED_CURRENCIES, isValidCurrency, formatAmount } from "@/lib/currencies";

describe("currencies", () => {
  it("exposes a popular-first ordered allowlist", () => {
    expect(SUPPORTED_CURRENCIES.slice(0, 4)).toEqual(["EUR", "USD", "GBP", "HUF"]);
    expect(SUPPORTED_CURRENCIES).toContain("CHF");
  });

  it("accepts an allowlisted currency", () => {
    expect(isValidCurrency("EUR")).toBe(true);
  });

  it("rejects an unknown currency", () => {
    expect(isValidCurrency("XYZ")).toBe(false);
  });

  it("formats an amount using Intl.NumberFormat with the currency symbol", () => {
    expect(formatAmount(42.1, "EUR")).toMatch(/42\.10/);
    expect(formatAmount(42.1, "USD")).toMatch(/\$42\.10/);
  });
});
