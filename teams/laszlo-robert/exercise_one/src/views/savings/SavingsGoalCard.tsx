import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { useLanguage } from '@/i18n/LanguageContext'
import type { SavingsGoal } from '@/types'

type Props = {
  goal: SavingsGoal
  onUpdateAmount: (id: string, amount: number) => void
  onDelete: (id: string) => void
}

export function SavingsGoalCard({ goal, onUpdateAmount, onDelete }: Props) {
  const { t, formatCurrency, formatDate } = useLanguage()
  const [contributing, setContributing] = useState(false)
  const [amount, setAmount] = useState('')
  const pct = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)
  const done = goal.currentAmount >= goal.targetAmount

  const handleContribute = (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount) return
    onUpdateAmount(goal.id, goal.currentAmount + parseFloat(amount))
    setAmount('')
    setContributing(false)
  }

  return (
    <div className="p-4 rounded-lg border bg-card space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold">{goal.name}</span>
            {done && <Badge className="bg-green-500">{t('savingsComplete')}</Badge>}
          </div>
          {goal.deadline && (
            <span className="text-xs text-muted-foreground">{t('savingsDue')} {formatDate(goal.deadline)}</span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-sm text-muted-foreground">{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</span>
          <Button variant="ghost" size="icon" onClick={() => onDelete(goal.id)}>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      <Progress value={pct} className={done ? '[&>div]:bg-green-500' : ''} />

      {!done && (
        contributing ? (
          <form onSubmit={handleContribute} className="flex gap-2 items-center">
            <Input type="number" min="0" step="0.01" placeholder={t('savingsContributionAmount')} value={amount} onChange={e => setAmount(e.target.value)} className="w-32" />
            <Button type="submit" size="sm">{t('savingsSave')}</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setContributing(false)}>{t('savingsCancel')}</Button>
          </form>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setContributing(true)}>{t('savingsAddContribution')}</Button>
        )
      )}
    </div>
  )
}
