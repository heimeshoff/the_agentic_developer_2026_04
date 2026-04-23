import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import {
  CURRENCIES,
  CURRENCY_SYMBOLS,
  LANGUAGES,
  LOCALES,
  MESSAGES,
  type Language,
  type MessageKey,
} from './messages'

type LanguageContextValue = {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: MessageKey) => string
  formatCurrency: (amount: number) => string
  formatDate: (iso: string) => string
  currencySymbol: string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useLocalStorage<Language>('pf_language', 'en')
  const safeLang: Language = LANGUAGES.includes(language) ? language : 'en'

  const t = useCallback(
    (key: MessageKey) => MESSAGES[safeLang][key],
    [safeLang],
  )

  const formatCurrency = useCallback(
    (amount: number) =>
      new Intl.NumberFormat(LOCALES[safeLang], {
        style: 'currency',
        currency: CURRENCIES[safeLang],
      }).format(amount),
    [safeLang],
  )

  const formatDate = useCallback(
    (iso: string) =>
      new Intl.DateTimeFormat(LOCALES[safeLang], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(iso)),
    [safeLang],
  )

  const value = useMemo<LanguageContextValue>(
    () => ({
      language: safeLang,
      setLanguage,
      t,
      formatCurrency,
      formatDate,
      currencySymbol: CURRENCY_SYMBOLS[safeLang],
    }),
    [safeLang, setLanguage, t, formatCurrency, formatDate],
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
