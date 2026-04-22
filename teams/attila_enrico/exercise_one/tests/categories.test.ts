import { describe, it, expect } from "vitest";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  getCategoriesForKind,
  isValidCategory,
} from "@/lib/categories";

describe("categories", () => {
  it("exposes the expected expense and income lists", () => {
    expect(EXPENSE_CATEGORIES).toEqual([
      "Groceries", "Utilities", "Rent", "Transport",
      "Dining", "Entertainment", "Healthcare", "Other",
    ]);
    expect(INCOME_CATEGORIES).toEqual([
      "Salary", "Freelance", "Investment", "Gift", "Other",
    ]);
  });

  it("returns the right list for a kind", () => {
    expect(getCategoriesForKind("expense")).toEqual(EXPENSE_CATEGORIES);
    expect(getCategoriesForKind("income")).toEqual(INCOME_CATEGORIES);
  });

  it("accepts a category that belongs to the kind", () => {
    expect(isValidCategory("expense", "Groceries")).toBe(true);
    expect(isValidCategory("income", "Salary")).toBe(true);
  });

  it("rejects a category that belongs to the other kind", () => {
    expect(isValidCategory("expense", "Salary")).toBe(false);
    expect(isValidCategory("income", "Groceries")).toBe(false);
  });

  it("rejects an unknown category", () => {
    expect(isValidCategory("expense", "Bitcoin")).toBe(false);
  });
});
