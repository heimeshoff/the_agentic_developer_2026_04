import type { Expense } from './types';

const KEY = 'duepi:expenses';
const VERSION = 1;

interface Envelope<T> {
  version: number;
  items: T[];
}

export function loadExpenses(): Expense[] {
  const raw = localStorage.getItem(KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Envelope<Expense>;
    if (parsed.version !== VERSION) return [];
    return parsed.items;
  } catch {
    return [];
  }
}

export function saveExpenses(items: Expense[]): void {
  const envelope: Envelope<Expense> = { version: VERSION, items };
  localStorage.setItem(KEY, JSON.stringify(envelope));
}
