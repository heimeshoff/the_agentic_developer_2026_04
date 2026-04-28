import { useLanguage } from '@/i18n/LanguageContext'

type Props = {
  monthlyIncome: number
  monthlySpent: number
  portfolioValue: number
}

export function SummaryBar({ monthlyIncome, monthlySpent, portfolioValue }: Props) {
  const { t, formatCurrency } = useLanguage()
  const net = monthlyIncome - monthlySpent
  return (
    <div className="border-t bg-muted/50 py-3">
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between gap-4 text-sm">
        <div className="flex items-center gap-6">
          <span className="text-muted-foreground">{t('summaryMonthlyIncome')}: <strong className="text-green-600">{formatCurrency(monthlyIncome)}</strong></span>
          <span className="text-muted-foreground">{t('summaryMonthlySpent')}: <strong className="text-orange-600">{formatCurrency(monthlySpent)}</strong></span>
          <span className="text-muted-foreground">
            {t('summaryNet')}: <strong className={net >= 0 ? 'text-green-600' : 'text-destructive'}>{formatCurrency(net)}</strong>
          </span>
        </div>
        <span className="text-muted-foreground">{t('summaryPortfolioValue')}: <strong>{formatCurrency(portfolioValue)}</strong></span>
      </div>
    </div>
  )
}
