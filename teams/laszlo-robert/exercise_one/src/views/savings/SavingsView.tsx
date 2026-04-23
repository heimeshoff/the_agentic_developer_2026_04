import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { sumBy } from '@/lib/utils'
import { useLanguage } from '@/i18n/LanguageContext'
import type { SavingsGoal } from '@/types'
import { SavingsGoalCard } from './SavingsGoalCard'
import { SavingsGoalForm } from './SavingsGoalForm'

type Props = {
  goals: SavingsGoal[]
  onAdd: (goal: Omit<SavingsGoal, 'id'>) => void
  onUpdateAmount: (id: string, amount: number) => void
  onDelete: (id: string) => void
}

export function SavingsView({ goals, onAdd, onUpdateAmount, onDelete }: Props) {
  const { t, formatCurrency } = useLanguage()
  const totalSaved = sumBy(goals, g => g.currentAmount)
  const totalTarget = sumBy(goals, g => g.targetAmount)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('savingsTotalSaved')}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold text-green-600">{formatCurrency(totalSaved)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">{t('savingsTotalTargets')}</CardTitle></CardHeader>
          <CardContent><p className="text-2xl font-bold">{formatCurrency(totalTarget)}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{t('savingsNewGoal')}</CardTitle></CardHeader>
        <CardContent><SavingsGoalForm onAdd={onAdd} /></CardContent>
      </Card>

      <div className="space-y-3">
        {goals.length === 0 && <p className="text-muted-foreground text-center py-8">{t('savingsEmpty')}</p>}
        {goals.map(g => (
          <SavingsGoalCard key={g.id} goal={g} onUpdateAmount={onUpdateAmount} onDelete={onDelete} />
        ))}
      </div>
    </div>
  )
}
