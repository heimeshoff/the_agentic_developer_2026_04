import { cn } from '@/lib/utils'

type Tab = 'income' | 'budget' | 'savings' | 'investments'

const TABS: { id: Tab; label: string }[] = [
  { id: 'income', label: 'Income' },
  { id: 'budget', label: 'Budget' },
  { id: 'savings', label: 'Savings' },
  { id: 'investments', label: 'Investments' },
]

type Props = { active: Tab; onChange: (tab: Tab) => void }

export function NavBar({ active, onChange }: Props) {
  return (
    <nav className="border-b bg-background sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 flex items-center gap-1 h-14">
        <span className="font-bold text-lg mr-4">FinanceApp</span>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              active === t.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  )
}

export type { Tab }
