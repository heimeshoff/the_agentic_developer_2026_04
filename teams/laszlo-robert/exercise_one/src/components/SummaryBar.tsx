import { formatCurrency } from '@/lib/utils'

type Props = {
  totalIncome: number
  totalSpent: number
  netWorth: number
}

export function SummaryBar({ totalIncome, totalSpent, netWorth }: Props) {
  const net = totalIncome - totalSpent
  return (
    <div className="border-t bg-muted/50 py-3">
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between gap-4 text-sm">
        <div className="flex items-center gap-6">
          <span className="text-muted-foreground">Monthly Income: <strong className="text-green-600">{formatCurrency(totalIncome)}</strong></span>
          <span className="text-muted-foreground">Spent: <strong className="text-orange-600">{formatCurrency(totalSpent)}</strong></span>
          <span className="text-muted-foreground">
            Net: <strong className={net >= 0 ? 'text-green-600' : 'text-destructive'}>{formatCurrency(net)}</strong>
          </span>
        </div>
        <span className="text-muted-foreground">Portfolio Value: <strong>{formatCurrency(netWorth)}</strong></span>
      </div>
    </div>
  )
}
