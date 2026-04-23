import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/i18n/LanguageContext'
import type { BudgetCategory } from '@/types'

type Props = { onAdd: (cat: Omit<BudgetCategory, 'id'>) => void }

export function CategoryForm({ onAdd }: Props) {
  const { t, currencySymbol } = useLanguage()
  const [name, setName] = useState('')
  const [budgeted, setBudgeted] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !budgeted) return
    onAdd({ name, budgeted: parseFloat(budgeted) })
    setName('')
    setBudgeted('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-end flex-wrap">
      <div className="flex flex-col gap-1.5 flex-1 min-w-32">
        <Label htmlFor="cat-name">{t('categoryLabel')}</Label>
        <Input id="cat-name" placeholder={t('categoryPlaceholder')} value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5 w-36">
        <Label htmlFor="cat-budget">{t('categoryMonthlyBudget')} ({currencySymbol})</Label>
        <Input id="cat-budget" type="number" min="0" step="0.01" placeholder="0.00" value={budgeted} onChange={e => setBudgeted(e.target.value)} />
      </div>
      <Button type="submit">{t('categoryAdd')}</Button>
    </form>
  )
}
