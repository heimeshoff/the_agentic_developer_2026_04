import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/i18n/LanguageContext'
import type { SavingsGoal } from '@/types'

type Props = { onAdd: (goal: Omit<SavingsGoal, 'id'>) => void }

export function SavingsGoalForm({ onAdd }: Props) {
  const { t, currencySymbol } = useLanguage()
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [current, setCurrent] = useState('')
  const [deadline, setDeadline] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !target) return
    onAdd({ name, targetAmount: parseFloat(target), currentAmount: parseFloat(current || '0'), deadline })
    setName(''); setTarget(''); setCurrent(''); setDeadline('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-end flex-wrap">
      <div className="flex flex-col gap-1.5 flex-1 min-w-32">
        <Label htmlFor="goal-name">{t('goalName')}</Label>
        <Input id="goal-name" placeholder={t('goalNamePlaceholder')} value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5 w-32">
        <Label htmlFor="goal-target">{t('goalTarget')} ({currencySymbol})</Label>
        <Input id="goal-target" type="number" min="0" step="0.01" placeholder="0.00" value={target} onChange={e => setTarget(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5 w-32">
        <Label htmlFor="goal-current">{t('goalCurrent')} ({currencySymbol})</Label>
        <Input id="goal-current" type="number" min="0" step="0.01" placeholder="0.00" value={current} onChange={e => setCurrent(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5 w-40">
        <Label htmlFor="goal-deadline">{t('goalDeadline')}</Label>
        <Input id="goal-deadline" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
      </div>
      <Button type="submit">{t('goalAdd')}</Button>
    </form>
  )
}
