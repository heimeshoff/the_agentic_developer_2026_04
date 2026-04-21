import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { SavingsGoal } from '@/types'

type Props = { onAdd: (goal: Omit<SavingsGoal, 'id'>) => void }

export function SavingsGoalForm({ onAdd }: Props) {
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
        <Label htmlFor="goal-name">Goal Name</Label>
        <Input id="goal-name" placeholder="e.g. Emergency Fund" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5 w-32">
        <Label htmlFor="goal-target">Target ($)</Label>
        <Input id="goal-target" type="number" min="0" step="0.01" placeholder="0.00" value={target} onChange={e => setTarget(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5 w-32">
        <Label htmlFor="goal-current">Saved so far ($)</Label>
        <Input id="goal-current" type="number" min="0" step="0.01" placeholder="0.00" value={current} onChange={e => setCurrent(e.target.value)} />
      </div>
      <div className="flex flex-col gap-1.5 w-40">
        <Label htmlFor="goal-deadline">Deadline</Label>
        <Input id="goal-deadline" type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
      </div>
      <Button type="submit">Add Goal</Button>
    </form>
  )
}
