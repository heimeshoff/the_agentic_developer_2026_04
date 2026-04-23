import { useState } from 'react'
import { MatrixRain } from '@/components/MatrixRain'
import { NavBar, type Tab } from '@/components/NavBar'
import { SonicStripes } from '@/components/SonicStripes'
import { SummaryBar } from '@/components/SummaryBar'
import { useFinanceData } from '@/hooks/useFinanceData'
import { useTheme } from '@/hooks/useTheme'
import { sumBy } from '@/lib/utils'
import { BudgetView } from '@/views/budget/BudgetView'
import { IncomeView } from '@/views/income/IncomeView'
import { InvestmentsView } from '@/views/investments/InvestmentsView'
import { SavingsView } from '@/views/savings/SavingsView'

export default function App() {
  const [tab, setTab] = useState<Tab>('income')
  const { theme, setTheme } = useTheme()
  const {
    data,
    addIncome, deleteIncome,
    addCategory, deleteCategory,
    addTransaction, deleteTransaction,
    addGoal, updateGoalAmount, deleteGoal,
    addInvestment, updateInvestmentPrice, deleteInvestment,
  } = useFinanceData()

  const currentMonth = new Date().toISOString().slice(0, 7)
  const inCurrentMonth = (iso: string) => iso.startsWith(currentMonth)

  const monthlyIncome = sumBy(
    data.income.filter(e => e.frequency === 'monthly' || inCurrentMonth(e.date)),
    e => e.amount,
  )
  const monthlySpent = sumBy(data.transactions.filter(t => inCurrentMonth(t.date)), t => t.amount)
  const portfolioValue = sumBy(data.investments, i => i.currentPrice * i.shares)

  return (
    <div className="min-h-screen flex flex-col relative">
      {theme === 'matrix' && <MatrixRain />}
      {theme === 'sonic' && <SonicStripes />}
      <div className="relative z-10 flex flex-col flex-1 min-h-screen">
      <NavBar active={tab} onChange={setTab} theme={theme} onThemeChange={setTheme} />
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
      <SummaryBar monthlyIncome={monthlyIncome} monthlySpent={monthlySpent} portfolioValue={portfolioValue} />
      </div>
    </div>
  )
}
