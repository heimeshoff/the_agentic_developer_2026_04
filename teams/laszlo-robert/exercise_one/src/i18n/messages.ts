export const LANGUAGES = ['en', 'de'] as const
export type Language = (typeof LANGUAGES)[number]

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'EN',
  de: 'DE',
}

export const LOCALES: Record<Language, string> = {
  en: 'en-US',
  de: 'de-DE',
}

export const CURRENCIES: Record<Language, string> = {
  en: 'USD',
  de: 'EUR',
}

export const CURRENCY_SYMBOLS: Record<Language, string> = {
  en: '$',
  de: '€',
}

type Dict = {
  // NavBar tabs
  tabIncome: string
  tabBudget: string
  tabSavings: string
  tabInvestments: string
  // SummaryBar
  summaryMonthlyIncome: string
  summaryMonthlySpent: string
  summaryNet: string
  summaryPortfolioValue: string
  // IncomeView
  incomeMonthly: string
  incomeOneTime: string
  incomeAdd: string
  incomeEmpty: string
  // IncomeForm
  incomeSource: string
  incomeSourcePlaceholder: string
  incomeAmount: string
  incomeFrequency: string
  incomeFreqMonthly: string
  incomeFreqOneTime: string
  add: string
  // BudgetView
  budgetTotalBudgeted: string
  budgetTotalSpent: string
  budgetRemaining: string
  budgetAddCategory: string
  budgetCategories: string
  budgetCategoriesEmpty: string
  budgetAddTransaction: string
  budgetRecentTx: string
  budgetColDate: string
  budgetColCategory: string
  budgetColDescription: string
  budgetColAmount: string
  budgetTxEmpty: string
  budgetOverBudget: string
  // CategoryForm
  categoryLabel: string
  categoryPlaceholder: string
  categoryMonthlyBudget: string
  categoryAdd: string
  // TransactionForm
  txCategory: string
  txCategorySelect: string
  txDescription: string
  txDescPlaceholder: string
  txAmount: string
  // SavingsView
  savingsTotalSaved: string
  savingsTotalTargets: string
  savingsNewGoal: string
  savingsEmpty: string
  // SavingsGoalCard
  savingsComplete: string
  savingsDue: string
  savingsContributionAmount: string
  savingsSave: string
  savingsCancel: string
  savingsAddContribution: string
  // SavingsGoalForm
  goalName: string
  goalNamePlaceholder: string
  goalTarget: string
  goalCurrent: string
  goalDeadline: string
  goalAdd: string
  // InvestmentsView
  invTotalInvested: string
  invCurrentValue: string
  invTotalGainLoss: string
  invAdd: string
  invPortfolio: string
  invColName: string
  invColType: string
  invColShares: string
  invColBuyPrice: string
  invColCurrentPrice: string
  invColValue: string
  invColGainLoss: string
  invEmpty: string
  invOk: string
  // InvestmentForm
  invNameTicker: string
  invNamePlaceholder: string
  invType: string
  invTypeStock: string
  invTypeEtf: string
  invTypeCrypto: string
  invTypeOther: string
  invShares: string
  invBuyPrice: string
  invCurrentPrice: string
}

const en: Dict = {
  tabIncome: 'Income',
  tabBudget: 'Budget',
  tabSavings: 'Savings',
  tabInvestments: 'Investments',

  summaryMonthlyIncome: 'Monthly Income',
  summaryMonthlySpent: 'Monthly Spent',
  summaryNet: 'Net',
  summaryPortfolioValue: 'Portfolio Value',

  incomeMonthly: 'Monthly Income',
  incomeOneTime: 'One-time Income',
  incomeAdd: 'Add Income',
  incomeEmpty: 'No income entries yet.',

  incomeSource: 'Source',
  incomeSourcePlaceholder: 'e.g. Salary',
  incomeAmount: 'Amount',
  incomeFrequency: 'Frequency',
  incomeFreqMonthly: 'Monthly',
  incomeFreqOneTime: 'One-time',
  add: 'Add',

  budgetTotalBudgeted: 'Total Budgeted',
  budgetTotalSpent: 'Total Spent',
  budgetRemaining: 'Remaining',
  budgetAddCategory: 'Add Category',
  budgetCategories: 'Categories',
  budgetCategoriesEmpty: 'No categories yet.',
  budgetAddTransaction: 'Add Transaction',
  budgetRecentTx: 'Recent Transactions',
  budgetColDate: 'Date',
  budgetColCategory: 'Category',
  budgetColDescription: 'Description',
  budgetColAmount: 'Amount',
  budgetTxEmpty: 'No transactions yet.',
  budgetOverBudget: 'Over budget',

  categoryLabel: 'Category',
  categoryPlaceholder: 'e.g. Groceries',
  categoryMonthlyBudget: 'Monthly Budget',
  categoryAdd: 'Add Category',

  txCategory: 'Category',
  txCategorySelect: 'Select…',
  txDescription: 'Description',
  txDescPlaceholder: 'e.g. Weekly shop',
  txAmount: 'Amount',

  savingsTotalSaved: 'Total Saved',
  savingsTotalTargets: 'Total Targets',
  savingsNewGoal: 'New Goal',
  savingsEmpty: 'No savings goals yet.',

  savingsComplete: 'Complete',
  savingsDue: 'Due',
  savingsContributionAmount: 'Amount',
  savingsSave: 'Save',
  savingsCancel: 'Cancel',
  savingsAddContribution: '+ Add Contribution',

  goalName: 'Goal Name',
  goalNamePlaceholder: 'e.g. Emergency Fund',
  goalTarget: 'Target',
  goalCurrent: 'Saved so far',
  goalDeadline: 'Deadline',
  goalAdd: 'Add Goal',

  invTotalInvested: 'Total Invested',
  invCurrentValue: 'Current Value',
  invTotalGainLoss: 'Total Gain / Loss',
  invAdd: 'Add Investment',
  invPortfolio: 'Portfolio',
  invColName: 'Name',
  invColType: 'Type',
  invColShares: 'Shares',
  invColBuyPrice: 'Buy Price',
  invColCurrentPrice: 'Current Price',
  invColValue: 'Value',
  invColGainLoss: 'Gain / Loss',
  invEmpty: 'No investments yet.',
  invOk: 'OK',

  invNameTicker: 'Name / Ticker',
  invNamePlaceholder: 'e.g. AAPL',
  invType: 'Type',
  invTypeStock: 'Stock',
  invTypeEtf: 'ETF',
  invTypeCrypto: 'Crypto',
  invTypeOther: 'Other',
  invShares: 'Shares',
  invBuyPrice: 'Buy Price',
  invCurrentPrice: 'Current Price',
}

const de: Dict = {
  tabIncome: 'Einkommen',
  tabBudget: 'Budget',
  tabSavings: 'Sparen',
  tabInvestments: 'Investitionen',

  summaryMonthlyIncome: 'Monatliches Einkommen',
  summaryMonthlySpent: 'Monatliche Ausgaben',
  summaryNet: 'Netto',
  summaryPortfolioValue: 'Portfoliowert',

  incomeMonthly: 'Monatliches Einkommen',
  incomeOneTime: 'Einmaliges Einkommen',
  incomeAdd: 'Einkommen hinzufügen',
  incomeEmpty: 'Noch keine Einkommenseinträge.',

  incomeSource: 'Quelle',
  incomeSourcePlaceholder: 'z. B. Gehalt',
  incomeAmount: 'Betrag',
  incomeFrequency: 'Häufigkeit',
  incomeFreqMonthly: 'Monatlich',
  incomeFreqOneTime: 'Einmalig',
  add: 'Hinzufügen',

  budgetTotalBudgeted: 'Budgetiert gesamt',
  budgetTotalSpent: 'Ausgegeben gesamt',
  budgetRemaining: 'Verbleibend',
  budgetAddCategory: 'Kategorie hinzufügen',
  budgetCategories: 'Kategorien',
  budgetCategoriesEmpty: 'Noch keine Kategorien.',
  budgetAddTransaction: 'Transaktion hinzufügen',
  budgetRecentTx: 'Letzte Transaktionen',
  budgetColDate: 'Datum',
  budgetColCategory: 'Kategorie',
  budgetColDescription: 'Beschreibung',
  budgetColAmount: 'Betrag',
  budgetTxEmpty: 'Noch keine Transaktionen.',
  budgetOverBudget: 'Budget überschritten',

  categoryLabel: 'Kategorie',
  categoryPlaceholder: 'z. B. Lebensmittel',
  categoryMonthlyBudget: 'Monatsbudget',
  categoryAdd: 'Kategorie hinzufügen',

  txCategory: 'Kategorie',
  txCategorySelect: 'Auswählen…',
  txDescription: 'Beschreibung',
  txDescPlaceholder: 'z. B. Wocheneinkauf',
  txAmount: 'Betrag',

  savingsTotalSaved: 'Gesamt gespart',
  savingsTotalTargets: 'Gesamtziele',
  savingsNewGoal: 'Neues Ziel',
  savingsEmpty: 'Noch keine Sparziele.',

  savingsComplete: 'Erreicht',
  savingsDue: 'Fällig',
  savingsContributionAmount: 'Betrag',
  savingsSave: 'Speichern',
  savingsCancel: 'Abbrechen',
  savingsAddContribution: '+ Beitrag hinzufügen',

  goalName: 'Zielname',
  goalNamePlaceholder: 'z. B. Notgroschen',
  goalTarget: 'Ziel',
  goalCurrent: 'Bisher gespart',
  goalDeadline: 'Frist',
  goalAdd: 'Ziel hinzufügen',

  invTotalInvested: 'Gesamt investiert',
  invCurrentValue: 'Aktueller Wert',
  invTotalGainLoss: 'Gewinn / Verlust gesamt',
  invAdd: 'Investition hinzufügen',
  invPortfolio: 'Portfolio',
  invColName: 'Name',
  invColType: 'Typ',
  invColShares: 'Anteile',
  invColBuyPrice: 'Kaufpreis',
  invColCurrentPrice: 'Aktueller Preis',
  invColValue: 'Wert',
  invColGainLoss: 'Gewinn / Verlust',
  invEmpty: 'Noch keine Investitionen.',
  invOk: 'OK',

  invNameTicker: 'Name / Ticker',
  invNamePlaceholder: 'z. B. AAPL',
  invType: 'Typ',
  invTypeStock: 'Aktie',
  invTypeEtf: 'ETF',
  invTypeCrypto: 'Krypto',
  invTypeOther: 'Sonstige',
  invShares: 'Anteile',
  invBuyPrice: 'Kaufpreis',
  invCurrentPrice: 'Aktueller Preis',
}

export const MESSAGES: Record<Language, Dict> = { en, de }
export type MessageKey = keyof Dict
