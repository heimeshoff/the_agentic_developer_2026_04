import { Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { IncomeEntry } from '@/types'

type Props = {
  entry: IncomeEntry
  onDelete: (id: string) => void
}

export function IncomeCard({ entry, onDelete }: Props) {
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg border bg-card">
      <div className="flex flex-col gap-0.5">
        <span className="font-medium">{entry.source}</span>
        <span className="text-sm text-muted-foreground">{formatDate(entry.date)}</span>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant={entry.frequency === 'monthly' ? 'default' : 'secondary'}>{entry.frequency}</Badge>
        <span className="font-semibold text-green-600">{formatCurrency(entry.amount)}</span>
        <Button variant="ghost" size="icon" onClick={() => onDelete(entry.id)}>
          <Trash2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    </div>
  )
}
