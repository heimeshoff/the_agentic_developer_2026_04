import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { IncomeEntry } from '@/types'

type Props = {
  onAdd: (entry: Omit<IncomeEntry, 'id'>) => void
}

export function IncomeForm({ onAdd }: Props) {
  const [source, setSource] = useState('')
  const [amount, setAmount] = useState('')
  const [frequency, setFrequency] = useState<'monthly' | 'one-time'>('monthly')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!source || !amount) return
    onAdd({ source, amount: parseFloat(amount), frequency, date: new Date().toISOString().split('T')[0] })
    setSource('')
    setAmount('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-end flex-wrap">
      <div className="flex flex-col gap-1.5 flex-1 min-w-32">
        <Label htmlFor="source">Source</Label>
        <Input id="source" placeholder="e.g. Salary" value={source} onChange={e => setSource(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5 w-32">
        <Label htmlFor="amount">Amount ($)</Label>
        <Input id="amount" type="number" min="0" step="0.01" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5 w-36">
        <Label>Frequency</Label>
        <Select value={frequency} onValueChange={v => setFrequency(v as 'monthly' | 'one-time')}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="one-time">One-time</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit">Add</Button>
    </form>
  )
}
