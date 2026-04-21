import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { BudgetCategory, Transaction } from '@/types'

type Props = {
  categories: BudgetCategory[]
  onAdd: (tx: Omit<Transaction, 'id'>) => void
}

export function TransactionForm({ categories, onAdd }: Props) {
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoryId || !description || !amount) return
    onAdd({ categoryId, description, amount: parseFloat(amount), date: new Date().toISOString().split('T')[0] })
    setDescription('')
    setAmount('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-end flex-wrap">
      <div className="flex flex-col gap-1.5 w-40">
        <Label>Category</Label>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger><SelectValue placeholder="Select…" /></SelectTrigger>
          <SelectContent>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5 flex-1 min-w-32">
        <Label htmlFor="tx-desc">Description</Label>
        <Input id="tx-desc" placeholder="e.g. Weekly shop" value={description} onChange={e => setDescription(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5 w-32">
        <Label htmlFor="tx-amount">Amount ($)</Label>
        <Input id="tx-amount" type="number" min="0" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
      </div>
      <Button type="submit">Add</Button>
    </form>
  )
}
