import { useState } from 'react'
import { NavBar, type Tab } from '@/components/NavBar'
import { SummaryBar } from '@/components/SummaryBar'
import { useFinanceData } from '@/hooks/useFinanceData'
import { sumBy } from '@/lib/utils'
import { BudgetView } from '@/views/budget/BudgetView'
import { IncomeView } from '@/views/income/IncomeView'
import { InvestmentsView } from '@/views/investments/InvestmentsView'
import { SavingsView } from '@/views/savings/SavingsView'

export default function App() {
  const [tab, setTab] = useState<Tab>('income')
  const {
    data,
    addIncome, deleteIncome,
    addCategory, deleteCategory,
    addTransaction, deleteTransaction,
    addGoal, updateGoalAmount, deleteGoal,
    addInvestment, updateInvestmentPrice, deleteInvestment,
  } = useFinanceData()

  const totalIncome = sumBy(data.income.filter(e => e.frequency === 'monthly'), e => e.amount)
  const totalSpent = sumBy(data.transactions, t => t.amount)
  const portfolioValue = sumBy(data.investments, i => i.currentPrice * i.shares)

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar active={tab} onChange={setTab} />
      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-6">
        {tab === 'income' && (
          <IncomeView income={data.income} onAdd={addIncome} onDelete={deleteIncome} />
        )}
        {tab === 'budget' && (
          <BudgetView
            categories={data.budgetCategories}
            transactions={data.transactions}
            onAddCategory={addCategory}
            onDeleteCategory={deleteCategory}
            onAddTransaction={addTransaction}
            onDeleteTransaction={deleteTransaction}
          />
        )}
        {tab === 'savings' && (
          <SavingsView
            goals={data.savingsGoals}
            onAdd={addGoal}
            onUpdateAmount={updateGoalAmount}
            onDelete={deleteGoal}
          />
        )}
        {tab === 'investments' && (
          <InvestmentsView
            investments={data.investments}
            onAdd={addInvestment}
            onUpdatePrice={updateInvestmentPrice}
            onDelete={deleteInvestment}
          />
        )}
      </main>
      <SummaryBar totalIncome={totalIncome} totalSpent={totalSpent} netWorth={portfolioValue} />
    </div>
  )
}
