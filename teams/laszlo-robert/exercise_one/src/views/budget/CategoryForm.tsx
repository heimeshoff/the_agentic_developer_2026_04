import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { BudgetCategory } from '@/types'

type Props = { onAdd: (cat: Omit<BudgetCategory, 'id'>) => void }

export function CategoryForm({ onAdd }: Props) {
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
        <Label htmlFor="cat-name">Category</Label>
        <Input id="cat-name" placeholder="e.g. Groceries" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5 w-36">
        <Label htmlFor="cat-budget">Monthly Budget ($)</Label>
        <Input id="cat-budget" type="number" min="0" step="0.01" placeholder="0.00" value={budgeted} onChange={e => setBudgeted(e.target.value)} />
      </div>
      <Button type="submit">Add Category</Button>
    </form>
  )
}
