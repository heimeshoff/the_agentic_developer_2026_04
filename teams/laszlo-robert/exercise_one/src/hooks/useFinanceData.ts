import type { BudgetCategory, IncomeEntry, Investment, PFData, SavingsGoal, Transaction } from '@/types'
import { useLocalStorage } from './useLocalStorage'

const SEED: PFData = {
  income: [
    { id: '1', source: 'Salary', amount: 5500, frequency: 'monthly', date: '2026-04-01' },
    { id: '2', source: 'Freelance', amount: 800, frequency: 'monthly', date: '2026-04-05' },
  ],
  budgetCategories: [
    { id: '1', name: 'Rent', budgeted: 1800 },
    { id: '2', name: 'Groceries', budgeted: 400 },
    { id: '3', name: 'Transport', budgeted: 200 },
    { id: '4', name: 'Entertainment', budgeted: 150 },
  ],
  transactions: [
    { id: '1', categoryId: '1', description: 'April rent', amount: 1800, date: '2026-04-01' },
    { id: '2', categoryId: '2', description: 'Weekly shop', amount: 95, date: '2026-04-07' },
    { id: '3', categoryId: '2', description: 'Weekly shop', amount: 88, date: '2026-04-14' },
    { id: '4', categoryId: '3', description: 'Monthly pass', amount: 120, date: '2026-04-02' },
    { id: '5', categoryId: '4', description: 'Cinema', amount: 28, date: '2026-04-10' },
  ],
  savingsGoals: [
    { id: '1', name: 'Emergency Fund', targetAmount: 10000, currentAmount: 3200, deadline: '2026-12-31' },
    { id: '2', name: 'Vacation', targetAmount: 3000, currentAmount: 1100, deadline: '2026-08-01' },
    { id: '3', name: 'New Laptop', targetAmount: 2000, currentAmount: 600, deadline: '2026-06-30' },
  ],
  investments: [
    { id: '1', name: 'Vanguard S&P 500', assetType: 'etf', shares: 12, purchasePrice: 420, currentPrice: 451 },
    { id: '2', name: 'Apple', assetType: 'stock', shares: 5, purchasePrice: 185, currentPrice: 193 },
    { id: '3', name: 'Bitcoin', assetType: 'crypto', shares: 0.15, purchasePrice: 62000, currentPrice: 71000 },
  ],
}

export function useFinanceData() {
  const [data, setData] = useLocalStorage<PFData>('pf_data', SEED)

  const addIncome = (entry: Omit<IncomeEntry, 'id'>) =>
    setData(prev => ({ ...prev, income: [...prev.income, { ...entry, id: crypto.randomUUID() }] }))

  const deleteIncome = (id: string) =>
    setData(prev => ({ ...prev, income: prev.income.filter(e => e.id !== id) }))

  const addCategory = (cat: Omit<BudgetCategory, 'id'>) =>
    setData(prev => ({ ...prev, budgetCategories: [...prev.budgetCategories, { ...cat, id: crypto.randomUUID() }] }))

  const deleteCategory = (id: string) =>
    setData(prev => ({
      ...prev,
      budgetCategories: prev.budgetCategories.filter(c => c.id !== id),
      transactions: prev.transactions.filter(t => t.categoryId !== id),
    }))

  const addTransaction = (tx: Omit<Transaction, 'id'>) =>
    setData(prev => ({ ...prev, transactions: [...prev.transactions, { ...tx, id: crypto.randomUUID() }] }))

  const deleteTransaction = (id: string) =>
    setData(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }))

  const addGoal = (goal: Omit<SavingsGoal, 'id'>) =>
    setData(prev => ({ ...prev, savingsGoals: [...prev.savingsGoals, { ...goal, id: crypto.randomUUID() }] }))

  const updateGoalAmount = (id: string, amount: number) =>
    setData(prev => ({
      ...prev,
      savingsGoals: prev.savingsGoals.map(g => (g.id === id ? { ...g, currentAmount: amount } : g)),
    }))

  const deleteGoal = (id: string) =>
    setData(prev => ({ ...prev, savingsGoals: prev.savingsGoals.filter(g => g.id !== id) }))

  const addInvestment = (inv: Omit<Investment, 'id'>) =>
    setData(prev => ({ ...prev, investments: [...prev.investments, { ...inv, id: crypto.randomUUID() }] }))

  const updateInvestmentPrice = (id: string, currentPrice: number) =>
    setData(prev => ({
      ...prev,
      investments: prev.investments.map(i => (i.id === id ? { ...i, currentPrice } : i)),
    }))

  const deleteInvestment = (id: string) =>
    setData(prev => ({ ...prev, investments: prev.investments.filter(i => i.id !== id) }))

  return {
    data,
    addIncome, deleteIncome,
    addCategory, deleteCategory,
    addTransaction, deleteTransaction,
    addGoal, updateGoalAmount, deleteGoal,
    addInvestment, updateInvestmentPrice, deleteInvestment,
  }
}
