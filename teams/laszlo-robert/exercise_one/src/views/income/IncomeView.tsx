import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, sumBy } from '@/lib/utils'
import type { IncomeEntry } from '@/types'
import { IncomeCard } from './IncomeCard'
import { IncomeForm } from './IncomeForm'

type Props = {
  income: IncomeEntry[]
  onAdd: (entry: Omit<IncomeEntry, 'id'>) => void
  onDelete: (id: string) => void
}

export function IncomeView({ income, onAdd, onDelete }: Props) {
  const monthlyTotal = sumBy(income.filter(e => e.frequency === 'monthly'), e => e.amount)
  const oneTimeTotal = sumBy(income.filter(e => e.frequency === 'one-time'), e => e.amount)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Monthly Income</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{formatCurrency(monthlyTotal)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">One-time Income</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatCurrency(oneTimeTotal)}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Add Income</CardTitle></CardHeader>
        <CardContent><IncomeForm onAdd={onAdd} /></CardContent>
      </Card>

      <div className="space-y-2">
        {income.length === 0 && <p className="text-muted-foreground text-center py-8">No income entries yet.</p>}
        {income.map(e => <IncomeCard key={e.id} entry={e} onDelete={onDelete} />)}
      </div>
    </div>
  )
}
