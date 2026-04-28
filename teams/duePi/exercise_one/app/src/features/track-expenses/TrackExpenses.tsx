import { useEffect, useMemo, useState } from 'react';
import { loadExpenses, saveExpenses } from './storage';
import { EXPENSE_CATEGORIES, type Expense, type ExpenseCategory } from './types';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function sortNewestFirst(items: Expense[]): Expense[] {
  return [...items].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.createdAt < b.createdAt ? 1 : -1;
  });
}

export function TrackExpenses() {
  const [items, setItems] = useState<Expense[]>(() => loadExpenses());
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(today());
  const [category, setCategory] = useState<ExpenseCategory>(EXPENSE_CATEGORIES[0]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    saveExpenses(items);
  }, [items]);

  const sorted = useMemo(() => sortNewestFirst(items), [items]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError('Amount must be greater than zero.');
      return;
    }
    const entry: Expense = {
      id: crypto.randomUUID(),
      amount: parsed,
      date,
      category,
      createdAt: new Date().toISOString(),
    };
    setItems((prev) => [...prev, entry]);
    setAmount('');
    setDate(today());
    setCategory(EXPENSE_CATEGORIES[0]);
    setError(null);
  }

  return (
    <section style={{ maxWidth: 640, margin: '2rem auto', padding: '0 1rem' }}>
      <h1>Expenses</h1>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <label>
          Amount
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </label>

        <label>
          Date
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem' }}
          />
        </label>

        <label>
          Category
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
            style={{ width: '100%', padding: '0.5rem' }}
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        {error && (
          <p role="alert" style={{ color: 'crimson', margin: 0 }}>{error}</p>
        )}

        <button type="submit" style={{ padding: '0.6rem 1rem' }}>Add expense</button>
      </form>

      {sorted.length === 0 ? (
        <p>No expenses yet — add one above.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Date</th>
              <th style={{ textAlign: 'right', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Amount</th>
              <th style={{ textAlign: 'left', padding: '0.5rem', borderBottom: '1px solid #ddd' }}>Category</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((e) => (
              <tr key={e.id}>
                <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{e.date}</td>
                <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                  {e.amount.toFixed(2)}
                </td>
                <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{e.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
