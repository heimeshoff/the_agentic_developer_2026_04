import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, formatDate, sumBy } from '@/lib/utils'
import type { BudgetCategory, Transaction } from '@/types'
import { BudgetCategoryCard } from './BudgetCategoryCard'
import { CategoryForm } from './CategoryForm'
import { TransactionForm } from './TransactionForm'

type Props = {
  categories: BudgetCategory[]
  transactions: Transaction[]
  onAddCategory: (cat: Omit<BudgetCategory, 'id'>) => void
  onDeleteCategory: (id: string) => void
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void
  onDeleteTransaction: (id: string) => void
}

export function BudgetView({ categories, transactions, onAddCategory, onDeleteCategory, onAddTransaction, onDeleteTransaction }: Props) {
  const totalBudgeted = sumBy(categories, c => c.budgeted)
  const totalSpent = sumBy(transactions, t => t.amount)
  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c.name]))

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Budgeted</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatCurrency(totalBudgeted)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-orange-600">{formatCurrency(totalSpent)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Remaining</CardTitle></CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${totalBudgeted - totalSpent >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {formatCurrency(totalBudgeted - totalSpent)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Add Category</CardTitle></CardHeader>
        <CardContent><CategoryForm onAdd={onAddCategory} /></CardContent>
      </Card>

      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Categories</h3>
        {categories.length === 0 && <p className="text-muted-foreground text-center py-4">No categories yet.</p>}
        {categories.map(c => (
          <BudgetCategoryCard key={c.id} category={c} transactions={transactions} onDelete={onDeleteCategory} />
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>Add Transaction</CardTitle></CardHeader>
        <CardContent><TransactionForm categories={categories} onAdd={onAddTransaction} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Transactions</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No transactions yet.</TableCell></TableRow>
              )}
              {[...transactions].sort((a, b) => b.date.localeCompare(a.date)).map(tx => (
                <TableRow key={tx.id}>
                  <TableCell className="text-muted-foreground">{formatDate(tx.date)}</TableCell>
                  <TableCell>{categoryMap[tx.categoryId] ?? '—'}</TableCell>
                  <TableCell>{tx.description}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(tx.amount)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => onDeleteTransaction(tx.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
