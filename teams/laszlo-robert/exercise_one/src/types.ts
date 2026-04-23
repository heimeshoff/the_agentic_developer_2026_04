export type IncomeEntry = {
  id: string
  source: string
  amount: number
  frequency: 'monthly' | 'one-time'
  date: string
}

export type BudgetCategory = {
  id: string
  name: string
  budgeted: number
}

export type Transaction = {
  id: string
  categoryId: string
  description: string
  amount: number
  date: string
}

export type SavingsGoal = {
  id: string
  name: string
  targetAmount: number
  currentAmount: number
  deadline: string
}

export type Investment = {
  id: string
  name: string
  assetType: 'stock' | 'etf' | 'crypto' | 'other'
  shares: number
  purchasePrice: number
  currentPrice: number
}

export type PFData = {
  income: IncomeEntry[]
  budgetCategories: BudgetCategory[]
  transactions: Transaction[]
  savingsGoals: SavingsGoal[]
  investments: Investment[]
}
