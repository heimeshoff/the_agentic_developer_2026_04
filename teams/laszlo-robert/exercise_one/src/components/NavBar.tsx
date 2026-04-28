import { cn } from '@/lib/utils'
import { THEMES, THEME_LABELS, type Theme } from '@/hooks/useTheme'
import { useLanguage } from '@/i18n/LanguageContext'
import { LANGUAGES, LANGUAGE_LABELS, type Language } from '@/i18n/messages'
import type { MessageKey } from '@/i18n/messages'

type Tab = 'income' | 'budget' | 'savings' | 'investments'

type TabMeta = { id: Tab; key: MessageKey; prefix?: string }

const TAB_META: Record<Theme, TabMeta[]> = {
  original: [
    { id: 'income', key: 'tabIncome' },
    { id: 'budget', key: 'tabBudget' },
    { id: 'savings', key: 'tabSavings' },
    { id: 'investments', key: 'tabInvestments' },
  ],
  matrix: [
    { id: 'income', key: 'tabIncome', prefix: '> ' },
    { id: 'budget', key: 'tabBudget', prefix: '> ' },
    { id: 'savings', key: 'tabSavings', prefix: '> ' },
    { id: 'investments', key: 'tabInvestments', prefix: '> ' },
  ],
  sonic: [
    { id: 'income', key: 'tabIncome' },
    { id: 'budget', key: 'tabBudget' },
    { id: 'savings', key: 'tabSavings' },
    { id: 'investments', key: 'tabInvestments' },
  ],
}

const BRAND: Record<Theme, { text: string; className: string }> = {
  original: { text: 'FinanceApp', className: 'font-bold text-lg' },
  matrix: {
    text: 'THE_MATRIX://FINANCE',
    className: 'font-bold text-lg tracking-[0.3em] text-primary glow',
  },
  sonic: {
    text: 'SONIC FINANCE',
    className:
      'font-extrabold text-lg tracking-wider text-secondary drop-shadow-[2px_2px_0_rgba(0,0,0,0.55)]',
  },
}

type Props = {
  active: Tab
  onChange: (tab: Tab) => void
  theme: Theme
  onThemeChange: (theme: Theme) => void
}

export function NavBar({ active, onChange, theme, onThemeChange }: Props) {
  const { t, language, setLanguage } = useLanguage()
  const tabs = TAB_META[theme]
  const brand = BRAND[theme]

  return (
    <nav className="border-b bg-background/85 backdrop-blur sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 flex items-center gap-1 h-14">
        <span className={cn('mr-4 flex items-center gap-2', brand.className)}>
          {brand.text}
          {theme === 'sonic' && <span aria-hidden className="sonic-ring inline-block w-4 h-4 rounded-full border-[3px] border-yellow-400" />}
        </span>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors',
              active === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted',
            )}
          >
            {(tab.prefix ?? '') + t(tab.key)}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border bg-background/70 p-0.5">
            {LANGUAGES.map(l => (
              <button
                key={l}
                onClick={() => setLanguage(l as Language)}
                aria-pressed={language === l}
                className={cn(
                  'px-2.5 py-1 rounded text-xs font-semibold transition-colors',
                  language === l
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {LANGUAGE_LABELS[l]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-md border bg-background/70 p-0.5">
            {THEMES.map(th => (
              <button
                key={th}
                onClick={() => onThemeChange(th)}
                aria-pressed={theme === th}
                className={cn(
                  'px-2.5 py-1 rounded text-xs font-semibold transition-colors',
                  theme === th
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {THEME_LABELS[th]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  )
}

export type { Tab }
