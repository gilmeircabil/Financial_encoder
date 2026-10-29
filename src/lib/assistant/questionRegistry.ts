import type { IconName } from '../../components/ui/Icon'

export type QuestionCategoryId =
  | 'my_money'
  | 'expenses'
  | 'comparisons'
  | 'transactions'
  | 'planning'

export interface QuestionCategory {
  id: QuestionCategoryId
  label: string
  iconName: IconName
  description: string
}

export interface QuestionDefinition {
  id: string
  categoryId: QuestionCategoryId
  label: string
  prompt: string
  iconName: IconName
  handlerId: string
  defaultFollowUps: string[]
}

export const QUESTION_CATEGORIES: QuestionCategory[] = [
  {
    id: 'my_money',
    label: 'My Money',
    iconName: 'wallet',
    description: 'Income, profit, savings, and cash flow',
  },
  {
    id: 'expenses',
    label: 'Expenses',
    iconName: 'expenses',
    description: 'Spending breakdown, top costs, and reduction',
  },
  {
    id: 'comparisons',
    label: 'Comparisons',
    iconName: 'trendingUp',
    description: 'Month-over-month changes and trends',
  },
  {
    id: 'transactions',
    label: 'Transactions',
    iconName: 'transactions',
    description: 'Recent, large, and uncategorized entries',
  },
  {
    id: 'planning',
    label: 'Financial Planning',
    iconName: 'reports',
    description: 'Summaries, budgets, and actionable advice',
  },
]

export const QUESTION_REGISTRY: QuestionDefinition[] = [
  // Category A: My Money
  {
    id: 'q_earn_this_month',
    categoryId: 'my_money',
    label: 'How much money did I earn this month?',
    prompt: 'How much money did I earn this month?',
    iconName: 'income',
    handlerId: 'handleEarnThisMonth',
    defaultFollowUps: [
      'How much did I spend this month?',
      'Am I making a profit or a loss?',
      'Compare this month with last month.',
    ],
  },
  {
    id: 'q_spend_this_month',
    categoryId: 'my_money',
    label: 'How much did I spend this month?',
    prompt: 'How much did I spend this month?',
    iconName: 'expenses',
    handlerId: 'handleSpendThisMonth',
    defaultFollowUps: [
      'Where is most of my money going?',
      'What are my top 5 biggest expenses?',
      'How much did I save this month?',
    ],
  },
  {
    id: 'q_profit_or_loss',
    categoryId: 'my_money',
    label: 'Am I making a profit or a loss?',
    prompt: 'Am I making a profit or a loss?',
    iconName: 'scale',
    handlerId: 'handleProfitOrLoss',
    defaultFollowUps: [
      'What is my net cash flow?',
      'Compare this month with last month.',
      'Show my income and expenses trend.',
    ],
  },
  {
    id: 'q_savings_this_month',
    categoryId: 'my_money',
    label: 'How much did I save this month?',
    prompt: 'How much did I save this month?',
    iconName: 'wallet',
    handlerId: 'handleSavingsThisMonth',
    defaultFollowUps: [
      'What is my net cash flow?',
      'Help me create a monthly spending budget.',
      'How much can I afford to spend?',
    ],
  },
  {
    id: 'q_net_cash_flow',
    categoryId: 'my_money',
    label: 'What is my net cash flow?',
    prompt: 'What is my net cash flow?',
    iconName: 'cashflow',
    handlerId: 'handleNetCashFlow',
    defaultFollowUps: [
      'Explain my cash flow in simple terms.',
      'Compare this month with last month.',
      'Give me a financial summary for this month.',
    ],
  },

  // Category B: Expenses
  {
    id: 'q_where_money_going',
    categoryId: 'expenses',
    label: 'Where is most of my money going?',
    prompt: 'Where is most of my money going?',
    iconName: 'expenses',
    handlerId: 'handleWhereMoneyGoing',
    defaultFollowUps: [
      'What are my top 5 biggest expenses?',
      'Show me expenses I could reduce.',
      'How much did I spend in each category?',
    ],
  },
  {
    id: 'q_top_5_expenses',
    categoryId: 'expenses',
    label: 'What are my top 5 biggest expenses?',
    prompt: 'What are my top 5 biggest expenses?',
    iconName: 'trendingUp',
    handlerId: 'handleTop5Expenses',
    defaultFollowUps: [
      'Where is most of my money going?',
      'Show me expenses I could reduce.',
      'Which expenses increased the most?',
    ],
  },
  {
    id: 'q_expenses_increased',
    categoryId: 'expenses',
    label: 'Which expenses increased the most?',
    prompt: 'Which expenses increased the most?',
    iconName: 'arrowUp',
    handlerId: 'handleExpensesIncreased',
    defaultFollowUps: [
      'Why did my expenses increase?',
      'Show me expenses I could reduce.',
      'Compare this month with last month.',
    ],
  },
  {
    id: 'q_reduce_expenses',
    categoryId: 'expenses',
    label: 'Show me expenses I could reduce.',
    prompt: 'Show me expenses I could reduce.',
    iconName: 'filter',
    handlerId: 'handleReduceExpenses',
    defaultFollowUps: [
      'What are my top 5 biggest expenses?',
      'Help me create a monthly spending budget.',
      'What should I improve in my finances?',
    ],
  },
  {
    id: 'q_spend_by_category',
    categoryId: 'expenses',
    label: 'How much did I spend in each category?',
    prompt: 'How much did I spend in each category?',
    iconName: 'tag',
    handlerId: 'handleSpendByCategory',
    defaultFollowUps: [
      'Where is most of my money going?',
      'Find transactions without a category.',
      'Show me expenses I could reduce.',
    ],
  },

  // Category C: Comparisons and Trends
  {
    id: 'q_compare_last_month',
    categoryId: 'comparisons',
    label: 'Compare this month with last month.',
    prompt: 'Compare this month with last month.',
    iconName: 'calendar',
    handlerId: 'handleCompareLastMonth',
    defaultFollowUps: [
      'Why did my expenses increase?',
      'What changed in my finances this month?',
      'Show my income and expenses trend.',
    ],
  },
  {
    id: 'q_why_expenses_increased',
    categoryId: 'comparisons',
    label: 'Why did my expenses increase?',
    prompt: 'Why did my expenses increase?',
    iconName: 'arrowUp',
    handlerId: 'handleWhyExpensesIncreased',
    defaultFollowUps: [
      'Which expenses increased the most?',
      'Show me expenses I could reduce.',
      'Compare this month with last month.',
    ],
  },
  {
    id: 'q_what_changed',
    categoryId: 'comparisons',
    label: 'What changed in my finances this month?',
    prompt: 'What changed in my finances this month?',
    iconName: 'trendingUp',
    handlerId: 'handleWhatChanged',
    defaultFollowUps: [
      'Compare this month with last month.',
      'Give me a financial summary for this month.',
      'What should I improve in my finances?',
    ],
  },
  {
    id: 'q_income_expense_trend',
    categoryId: 'comparisons',
    label: 'Show my income and expenses trend.',
    prompt: 'Show my income and expenses trend.',
    iconName: 'trendingUp',
    handlerId: 'handleIncomeExpenseTrend',
    defaultFollowUps: [
      'Am I spending more than I earn?',
      'Compare this month with last month.',
      'Explain my cash flow in simple terms.',
    ],
  },
  {
    id: 'q_spending_more_than_earn',
    categoryId: 'comparisons',
    label: 'Am I spending more than I earn?',
    prompt: 'Am I spending more than I earn?',
    iconName: 'scale',
    handlerId: 'handleSpendingMoreThanEarn',
    defaultFollowUps: [
      'Am I making a profit or a loss?',
      'Show me expenses I could reduce.',
      'How much can I afford to spend?',
    ],
  },

  // Category D: Transactions
  {
    id: 'q_recent_transactions',
    categoryId: 'transactions',
    label: 'Show my most recent transactions.',
    prompt: 'Show my most recent transactions.',
    iconName: 'transactions',
    handlerId: 'handleRecentTransactions',
    defaultFollowUps: [
      'Find my largest transaction.',
      'Summarize my transactions this month.',
      'Find transactions without a category.',
    ],
  },
  {
    id: 'q_largest_transaction',
    categoryId: 'transactions',
    label: 'Find my largest transaction.',
    prompt: 'Find my largest transaction.',
    iconName: 'arrowUpRight',
    handlerId: 'handleLargestTransaction',
    defaultFollowUps: [
      'Show transactions above ₱1,000.',
      'What are my top 5 biggest expenses?',
      'Show my most recent transactions.',
    ],
  },
  {
    id: 'q_transactions_above_1000',
    categoryId: 'transactions',
    label: 'Show transactions above ₱1,000.',
    prompt: 'Show transactions above ₱1,000.',
    iconName: 'filter',
    handlerId: 'handleTransactionsAboveThreshold',
    defaultFollowUps: [
      'Find my largest transaction.',
      'Show my most recent transactions.',
      'Where is most of my money going?',
    ],
  },
  {
    id: 'q_uncategorized_transactions',
    categoryId: 'transactions',
    label: 'Find transactions without a category.',
    prompt: 'Find transactions without a category.',
    iconName: 'tag',
    handlerId: 'handleUncategorizedTransactions',
    defaultFollowUps: [
      'How much did I spend in each category?',
      'Summarize my transactions this month.',
      'Show my most recent transactions.',
    ],
  },
  {
    id: 'q_summarize_transactions',
    categoryId: 'transactions',
    label: 'Summarize my transactions this month.',
    prompt: 'Summarize my transactions this month.',
    iconName: 'reports',
    handlerId: 'handleSummarizeTransactions',
    defaultFollowUps: [
      'Give me a financial summary for this month.',
      'Show my most recent transactions.',
      'Where is most of my money going?',
    ],
  },

  // Category E: Reports and Financial Planning
  {
    id: 'q_summary_this_month',
    categoryId: 'planning',
    label: 'Give me a financial summary for this month.',
    prompt: 'Give me a financial summary for this month.',
    iconName: 'reports',
    handlerId: 'handleSummaryThisMonth',
    defaultFollowUps: [
      'Explain my cash flow in simple terms.',
      'Compare this month with last month.',
      'What should I improve in my finances?',
    ],
  },
  {
    id: 'q_explain_cash_flow',
    categoryId: 'planning',
    label: 'Explain my cash flow in simple terms.',
    prompt: 'Explain my cash flow in simple terms.',
    iconName: 'cashflow',
    handlerId: 'handleExplainCashFlow',
    defaultFollowUps: [
      'What is my net cash flow?',
      'Compare this month with last month.',
      'How much can I afford to spend?',
    ],
  },
  {
    id: 'q_create_budget',
    categoryId: 'planning',
    label: 'Help me create a monthly spending budget.',
    prompt: 'Help me create a monthly spending budget.',
    iconName: 'wallet',
    handlerId: 'handleCreateBudget',
    defaultFollowUps: [
      'How much can I afford to spend?',
      'Show me expenses I could reduce.',
      'What should I improve in my finances?',
    ],
  },
  {
    id: 'q_afford_to_spend',
    categoryId: 'planning',
    label: 'How much can I afford to spend?',
    prompt: 'How much can I afford to spend?',
    iconName: 'scale',
    handlerId: 'handleAffordToSpend',
    defaultFollowUps: [
      'Help me create a monthly spending budget.',
      'Am I spending more than I earn?',
      'What is my net cash flow?',
    ],
  },
  {
    id: 'q_improve_finances',
    categoryId: 'planning',
    label: 'What should I improve in my finances?',
    prompt: 'What should I improve in my finances?',
    iconName: 'trendingUp',
    handlerId: 'handleImproveFinances',
    defaultFollowUps: [
      'Show me expenses I could reduce.',
      'Give me a financial summary for this month.',
      'Help me create a monthly spending budget.',
    ],
  },
]

export function getQuestionById(id: string): QuestionDefinition | undefined {
  return QUESTION_REGISTRY.find((q) => q.id === id)
}

export function getQuestionsByCategory(categoryId: QuestionCategoryId): QuestionDefinition[] {
  return QUESTION_REGISTRY.filter((q) => q.categoryId === categoryId)
}

export function findQuestionByPrompt(prompt: string): QuestionDefinition | undefined {
  const normalized = prompt.trim().toLowerCase().replace(/[?.,!]/g, '')
  return QUESTION_REGISTRY.find((q) => {
    const qNorm = q.prompt.trim().toLowerCase().replace(/[?.,!]/g, '')
    return qNorm === normalized
  })
}
