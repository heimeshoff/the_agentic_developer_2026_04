export type ExpenseCategory =
  | 'hobbies'
  | 'food'
  | 'rents'
  | 'transport'
  | 'insurance';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'hobbies',
  'food',
  'rents',
  'transport',
  'insurance',
];

export interface Expense {
  id: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  createdAt: string;
}
