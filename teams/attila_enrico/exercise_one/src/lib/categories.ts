export type TransactionKind = "expense" | "income";

export const EXPENSE_CATEGORIES = [
  "Groceries", "Utilities", "Rent", "Transport",
  "Dining", "Entertainment", "Healthcare", "Other",
] as const;

export const INCOME_CATEGORIES = [
  "Salary", "Freelance", "Investment", "Gift", "Other",
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type IncomeCategory = (typeof INCOME_CATEGORIES)[number];

export function getCategoriesForKind(kind: TransactionKind): readonly string[] {
  return kind === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
}

export function isValidCategory(kind: TransactionKind, category: string): boolean {
  return (getCategoriesForKind(kind) as readonly string[]).includes(category);
}
