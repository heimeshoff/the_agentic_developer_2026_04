import { Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/lib/utils'
import type { BudgetCategory, Transaction } from '@/types'

type Props = {
  category: BudgetCategory
  transactions: Transaction[]
  onDelete: (id: string) => void
}

export function BudgetCategoryCard({ category, transactions, onDelete }: Props) {
  const spent = transactions.filter(t => t.categoryId === category.id).reduce((s, t) => s + t.amount, 0)
  const pct = Math.min(100, (spent / category.budgeted) * 100)
  const over = spent > category.budgeted

  return (
    <div className="p-4 rounded-lg border bg-card space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-medium">{category.name}</span>
        <div className="flex items-center gap-2">
          {over && <Badge variant="destructive">Over budget</Badge>}
          <span className="text-sm text-muted-foreground">
            {formatCurrency(spent)} / {formatCurrency(category.budgeted)}
          </span>
          <Button variant="ghost" size="icon" onClick={() => onDelete(category.id)}>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
      <Progress value={pct} className={over ? '[&>div]:bg-destructive' : ''} />
    </div>
  )
}
