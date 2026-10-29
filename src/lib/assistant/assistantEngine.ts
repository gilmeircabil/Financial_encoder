import { api } from '../../services/api'
import { computeFinance } from '../finance'
import { formatCurrency } from '../../utils/currency'
import type { Category } from '../../../electron/types/ipc'
import { parseIntent } from './intentParser'
import { findQuestionByPrompt } from './questionRegistry'
import {
  FinancialAnalysisService,
} from './financialAnalysisService'
import type { AssistantMessage } from './types'

export async function processAssistantQuery(
  prompt: string,
  categories: Category[] = [],
  currencyCode: string = 'PHP',
  apiService = api,
  referenceDate: Date = new Date(),
): Promise<AssistantMessage> {
  const analysisService = new FinancialAnalysisService(apiService)
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  const id = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

  // 1. Direct registry question lookup
  const registeredQuestion = findQuestionByPrompt(prompt)
  const questionId = registeredQuestion?.id

  try {
    if (questionId) {
      switch (questionId) {
        case 'q_earn_this_month':
          return await handleEarnThisMonth(analysisService, currencyCode, id, timestamp, referenceDate)
        case 'q_spend_this_month':
          return await handleSpendThisMonth(analysisService, currencyCode, id, timestamp, referenceDate)
        case 'q_profit_or_loss':
          return await handleProfitOrLoss(analysisService, currencyCode, id, timestamp, referenceDate)
        case 'q_savings_this_month':
          return await handleSavingsThisMonth(analysisService, currencyCode, id, timestamp, referenceDate)
        case 'q_net_cash_flow':
          return await handleNetCashFlow(analysisService, currencyCode, id, timestamp, referenceDate)
        case 'q_where_money_going':
          return await handleWhereMoneyGoing(analysisService, currencyCode, id, timestamp, referenceDate)
        case 'q_top_5_expenses':
          return await handleTop5Expenses(analysisService, currencyCode, id, timestamp, referenceDate)
        case 'q_expenses_increased':
          return await handleExpensesIncreased(analysisService, currencyCode, id, timestamp, referenceDate)
        case 'q_reduce_expenses':
          return await handleReduceExpenses(analysisService, currencyCode, id, timestamp, referenceDate)
        case 'q_spend_by_category':
          return await handleSpendByCategory(analysisService, currencyCode, id, timestamp, referenceDate)
        case 'q_compare_last_month':
          return await handleCompareLastMonth(analysisService, currencyCode, id, timestamp, referenceDate)
        case 'q_why_expenses_increased':
          return await handleWhyExpensesIncreased(analysisService, currencyCode, id, timestamp, referenceDate)
        case 'q_what_changed':
          return await handleWhatChanged(analysisService, currencyCode, id, timestamp, referenceDate)
        case 'q_income_expense_trend':
          return await handleIncomeExpenseTrend(analysisService, currencyCode, id, timestamp, referenceDate)
        case 'q_spending_more_than_earn':
          return await handleSpendingMoreThanEarn(analysisService, currencyCode, id, timestamp, referenceDate)
        case 'q_recent_transactions':
          return await handleRecentTransactions(analysisService, currencyCode, id, timestamp)
        case 'q_largest_transaction':
          return await handleLargestTransaction(analysisService, undefined, currencyCode, id, timestamp)
        case 'q_transactions_above_1000':
          return await handleTransactionsAboveThreshold(analysisService, 1000, currencyCode, id, timestamp)
        case 'q_uncategorized_transactions':
          return await handleUncategorizedTransactions(analysisService, currencyCode, id, timestamp)
        case 'q_summarize_transactions':
          return await handleSummarizeTransactions(analysisService, currencyCode, id, timestamp, referenceDate)
        case 'q_summary_this_month':
          return await handleSummaryThisMonth(analysisService, currencyCode, id, timestamp, referenceDate)
        case 'q_explain_cash_flow':
          return await handleExplainCashFlow(analysisService, currencyCode, id, timestamp, referenceDate)
        case 'q_create_budget':
          return await handleCreateBudget(analysisService, currencyCode, id, timestamp, referenceDate)
        case 'q_afford_to_spend':
          return await handleAffordToSpend(analysisService, currencyCode, id, timestamp, referenceDate)
        case 'q_improve_finances':
          return await handleImproveFinances(analysisService, currencyCode, id, timestamp, referenceDate)
      }
    }

    // 2. Intent parsing for free-form queries
    const intent = parseIntent(prompt, categories, referenceDate)

    if (intent.kind === 'summary' && /earn|income|salary|revenue/i.test(prompt)) {
      return await handleEarnThisMonth(analysisService, currencyCode, id, timestamp, referenceDate)
    }

    if (intent.kind === 'summary' && /spend|expense|cost|outflow/i.test(prompt)) {
      return await handleSpendThisMonth(analysisService, currencyCode, id, timestamp, referenceDate)
    }

    if (/profit|loss|in the red|in the black/i.test(prompt)) {
      return await handleProfitOrLoss(analysisService, currencyCode, id, timestamp, referenceDate)
    }

    if (intent.kind === 'savings_rate' || /save|savings/i.test(prompt)) {
      return await handleSavingsThisMonth(analysisService, currencyCode, id, timestamp, referenceDate)
    }

    if (intent.kind === 'cash_position' || /net cash flow|cash position/i.test(prompt)) {
      return await handleNetCashFlow(analysisService, currencyCode, id, timestamp, referenceDate)
    }

    if (/where.*money going|spending breakdown|most of my money/i.test(prompt)) {
      return await handleWhereMoneyGoing(analysisService, currencyCode, id, timestamp, referenceDate)
    }

    if (intent.kind === 'biggest_transaction' && /top|5/i.test(prompt)) {
      return await handleTop5Expenses(analysisService, currencyCode, id, timestamp, referenceDate)
    }

    if (/which expenses increased|highest increase|expenses grew/i.test(prompt)) {
      return await handleExpensesIncreased(analysisService, currencyCode, id, timestamp, referenceDate)
    }

    if (/reduce|cut back|save money|lower expense/i.test(prompt)) {
      return await handleReduceExpenses(analysisService, currencyCode, id, timestamp, referenceDate)
    }

    if (intent.kind === 'spending_category') {
      if (intent.categoryName) {
        return await handleSingleCategorySpend(analysisService, intent.categoryName, currencyCode, id, timestamp, referenceDate)
      }
      return await handleSpendByCategory(analysisService, currencyCode, id, timestamp, referenceDate)
    }

    if (/compare.*last month|month over month|vs last month/i.test(prompt)) {
      return await handleCompareLastMonth(analysisService, currencyCode, id, timestamp, referenceDate)
    }

    if (/why.*expenses increase/i.test(prompt)) {
      return await handleWhyExpensesIncreased(analysisService, currencyCode, id, timestamp, referenceDate)
    }

    if (/what changed/i.test(prompt)) {
      return await handleWhatChanged(analysisService, currencyCode, id, timestamp, referenceDate)
    }

    if (/trend|history|past months/i.test(prompt)) {
      return await handleIncomeExpenseTrend(analysisService, currencyCode, id, timestamp, referenceDate)
    }

    if (/spending more than.*earn|deficit/i.test(prompt)) {
      return await handleSpendingMoreThanEarn(analysisService, currencyCode, id, timestamp, referenceDate)
    }

    if (/recent transaction/i.test(prompt)) {
      return await handleRecentTransactions(analysisService, currencyCode, id, timestamp)
    }

    if (intent.kind === 'biggest_transaction') {
      const txType = intent.type === 'income' || intent.type === 'expense' ? intent.type : undefined
      return await handleLargestTransaction(analysisService, txType, currencyCode, id, timestamp)
    }

    if (/above|over|greater than/i.test(prompt)) {
      return await handleTransactionsAboveThreshold(analysisService, 1000, currencyCode, id, timestamp)
    }

    if (/without a category|uncategorized/i.test(prompt)) {
      return await handleUncategorizedTransactions(analysisService, currencyCode, id, timestamp)
    }

    if (/summarize.*transactions/i.test(prompt)) {
      return await handleSummarizeTransactions(analysisService, currencyCode, id, timestamp, referenceDate)
    }

    if (/explain.*cash flow/i.test(prompt)) {
      return await handleExplainCashFlow(analysisService, currencyCode, id, timestamp, referenceDate)
    }

    if (/create.*budget|spending budget/i.test(prompt)) {
      return await handleCreateBudget(analysisService, currencyCode, id, timestamp, referenceDate)
    }

    if (/afford to spend|how much can i spend/i.test(prompt)) {
      return await handleAffordToSpend(analysisService, currencyCode, id, timestamp, referenceDate)
    }

    if (intent.kind === 'anomalies' || /improve|recommendation|advice/i.test(prompt)) {
      return await handleImproveFinances(analysisService, currencyCode, id, timestamp, referenceDate)
    }

    if (intent.kind === 'burn_rate') {
      return await handleBurnRate(analysisService, currencyCode, id, timestamp, referenceDate)
    }

    // Default general financial summary
    return await handleSummaryThisMonth(analysisService, currencyCode, id, timestamp, referenceDate)
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown database error'
    return {
      id,
      sender: 'assistant',
      timestamp,
      text: `An error occurred while calculating financial records: ${errorMsg}. All operations run safely on your local computer.`,
      suggestions: [
        'How much money did I earn this month?',
        'How much did I spend this month?',
        'Give me a financial summary for this month.',
      ],
    }
  }
}

// -----------------------------------------------------------------------------
// Category A: My Money Handlers
// -----------------------------------------------------------------------------

async function handleEarnThisMonth(
  analysis: FinancialAnalysisService,
  currencyCode: string,
  id: string,
  timestamp: string,
  refDate: Date,
): Promise<AssistantMessage> {
  const { period, totals } = await analysis.getCurrentMonthTotals(refDate)
  const income = totals.income

  return {
    id,
    sender: 'assistant',
    timestamp,
    text: `In **${period.label}**, you earned a total of **${formatCurrency(income, currencyCode)}** from recorded income transactions.`,
    data: {
      headline: 'Monthly Income',
      dateRangeLabel: period.label,
      primaryValue: formatCurrency(income, currencyCode),
      primaryLabel: 'Total Income Earned',
      variant: income > 0 ? 'positive' : 'neutral',
      badge: income > 0 ? 'Recorded Inflow' : 'No Income Logged',
      breakdown: [
        { label: 'Total Income', value: formatCurrency(income, currencyCode) },
        { label: 'Period', value: `${period.start} to ${period.end}` },
      ],
      actionLink: '/income',
      actionLabel: 'Open Income Ledger',
    },
    suggestions: [
      'How much did I spend this month?',
      'Am I making a profit or a loss?',
      'Compare this month with last month.',
    ],
  }
}

async function handleSpendThisMonth(
  analysis: FinancialAnalysisService,
  currencyCode: string,
  id: string,
  timestamp: string,
  refDate: Date,
): Promise<AssistantMessage> {
  const { period, totals } = await analysis.getCurrentMonthTotals(refDate)
  const expense = totals.expense
  const categories = await analysis.getExpenseCategories({ date_from: period.start, date_to: period.end })
  const topCat = categories[0]

  return {
    id,
    sender: 'assistant',
    timestamp,
    text: `In **${period.label}**, your operational spending totaled **${formatCurrency(expense, currencyCode)}** across ${categories.length} active categories.${topCat ? ` Your largest category was **${topCat.category_name}** at ${formatCurrency(topCat.total, currencyCode)}.` : ''}`,
    data: {
      headline: 'Monthly Expenses',
      dateRangeLabel: period.label,
      primaryValue: formatCurrency(expense, currencyCode),
      primaryLabel: 'Total Operational Expenses',
      variant: expense > 0 ? 'negative' : 'neutral',
      badge: topCat ? `Top: ${topCat.category_name}` : 'No Spending Logged',
      breakdown: [
        { label: 'Total Expenses', value: formatCurrency(expense, currencyCode) },
        { label: 'Active Categories', value: String(categories.length) },
        { label: 'Top Category', value: topCat ? `${topCat.category_name} (${formatCurrency(topCat.total, currencyCode)})` : 'None' },
      ],
      actionLink: '/expenses',
      actionLabel: 'Open Expenses Ledger',
    },
    suggestions: [
      'Where is most of my money going?',
      'What are my top 5 biggest expenses?',
      'How much did I save this month?',
    ],
  }
}

async function handleProfitOrLoss(
  analysis: FinancialAnalysisService,
  currencyCode: string,
  id: string,
  timestamp: string,
  refDate: Date,
): Promise<AssistantMessage> {
  const { period, totals } = await analysis.getCurrentMonthTotals(refDate)
  const profit = totals.income - totals.expense
  const isSurplus = profit > 0
  const isDeficit = profit < 0

  let statusText = 'balanced at break-even'
  if (isSurplus) statusText = `operating at a net profit of **${formatCurrency(profit, currencyCode)}**`
  else if (isDeficit) statusText = `operating at a net loss of **${formatCurrency(Math.abs(profit), currencyCode)}**`

  return {
    id,
    sender: 'assistant',
    timestamp,
    text: `For **${period.label}**, your records are ${statusText}. Income totaled **${formatCurrency(totals.income, currencyCode)}** against **${formatCurrency(totals.expense, currencyCode)}** in expenses.\n\n*Note: This reflects operating income minus operating expenses recorded in Acorn.*`,
    data: {
      headline: 'Operating Profit & Loss',
      dateRangeLabel: period.label,
      primaryValue: (isSurplus ? '+' : '') + formatCurrency(profit, currencyCode),
      primaryLabel: 'Net Operating Income',
      variant: isSurplus ? 'positive' : isDeficit ? 'negative' : 'neutral',
      badge: isSurplus ? 'Profit (Surplus)' : isDeficit ? 'Loss (Deficit)' : 'Break-Even',
      breakdown: [
        { label: 'Total Income', value: formatCurrency(totals.income, currencyCode) },
        { label: 'Total Expenses', value: formatCurrency(totals.expense, currencyCode) },
        { label: 'Net Profit / Loss', value: (isSurplus ? '+' : '') + formatCurrency(profit, currencyCode) },
      ],
      actionLink: '/reports',
      actionLabel: 'View Financial Report',
    },
    suggestions: [
      'What is my net cash flow?',
      'Compare this month with last month.',
      'Show my income and expenses trend.',
    ],
  }
}

async function handleSavingsThisMonth(
  analysis: FinancialAnalysisService,
  currencyCode: string,
  id: string,
  timestamp: string,
  refDate: Date,
): Promise<AssistantMessage> {
  const { period, totals } = await analysis.getCurrentMonthTotals(refDate)
  const unspentIncome = totals.income - totals.expense
  const savingsEstimate = Math.max(0, unspentIncome)
  const savingsRate = totals.income > 0 ? Math.max(0, Math.round((unspentIncome / totals.income) * 100)) : 0

  return {
    id,
    sender: 'assistant',
    timestamp,
    text: `In **${period.label}**, you retained **${formatCurrency(savingsEstimate, currencyCode)}** in unspent income (estimated savings rate: **${savingsRate}%**).\n\n*Important: Acorn tracks transaction cash movements. This figure represents operating income minus expenses, rather than confirmed deposits into dedicated savings accounts.*`,
    data: {
      headline: 'Estimated Monthly Savings',
      dateRangeLabel: period.label,
      primaryValue: formatCurrency(savingsEstimate, currencyCode),
      primaryLabel: 'Unspent Retained Income',
      variant: savingsEstimate > 0 ? 'positive' : 'neutral',
      badge: `${savingsRate}% Savings Rate`,
      breakdown: [
        { label: 'Income Earned', value: formatCurrency(totals.income, currencyCode) },
        { label: 'Expenses Incurred', value: formatCurrency(totals.expense, currencyCode) },
        { label: 'Estimated Retained Amount', value: formatCurrency(savingsEstimate, currencyCode) },
      ],
      actionLink: '/dashboard',
      actionLabel: 'Review Dashboard',
    },
    suggestions: [
      'What is my net cash flow?',
      'Help me create a monthly spending budget.',
      'How much can I afford to spend?',
    ],
  }
}

async function handleNetCashFlow(
  analysis: FinancialAnalysisService,
  currencyCode: string,
  id: string,
  timestamp: string,
  refDate: Date,
): Promise<AssistantMessage> {
  const { period, totals } = await analysis.getCurrentMonthTotals(refDate)
  const cashIn = totals.income + totals.capital
  const cashOut = totals.expense + totals.withdrawal
  const netCashFlow = totals.net

  return {
    id,
    sender: 'assistant',
    timestamp,
    text: `Your net cash flow for **${period.label}** is **${netCashFlow >= 0 ? '+' : ''}${formatCurrency(netCashFlow, currencyCode)}**.\n\nTotal cash in was **${formatCurrency(cashIn, currencyCode)}** (income and capital) against total cash out of **${formatCurrency(cashOut, currencyCode)}** (expenses and withdrawals).`,
    data: {
      headline: 'Net Cash Flow',
      dateRangeLabel: period.label,
      primaryValue: (netCashFlow >= 0 ? '+' : '') + formatCurrency(netCashFlow, currencyCode),
      primaryLabel: 'Net Cash Movement',
      variant: netCashFlow >= 0 ? 'positive' : 'negative',
      badge: netCashFlow >= 0 ? 'Positive Cash Flow' : 'Negative Cash Flow',
      breakdown: [
        { label: 'Cash In (Inflows)', value: formatCurrency(cashIn, currencyCode) },
        { label: 'Cash Out (Outflows)', value: formatCurrency(cashOut, currencyCode) },
        { label: 'Net Cash Flow', value: (netCashFlow >= 0 ? '+' : '') + formatCurrency(netCashFlow, currencyCode) },
      ],
      actionLink: '/cash-flow',
      actionLabel: 'Open Cash Flow Analysis',
    },
    suggestions: [
      'Explain my cash flow in simple terms.',
      'Compare this month with last month.',
      'Give me a financial summary for this month.',
    ],
  }
}

// -----------------------------------------------------------------------------
// Category B: Expenses Handlers
// -----------------------------------------------------------------------------

async function handleWhereMoneyGoing(
  analysis: FinancialAnalysisService,
  currencyCode: string,
  id: string,
  timestamp: string,
  refDate: Date,
): Promise<AssistantMessage> {
  const { period, totals } = await analysis.getCurrentMonthTotals(refDate)
  const categories = await analysis.getExpenseCategories({ date_from: period.start, date_to: period.end })

  if (categories.length === 0) {
    return {
      id,
      sender: 'assistant',
      timestamp,
      text: `No expense records were found for **${period.label}**.`,
      suggestions: ['How much money did I earn this month?', 'Show my most recent transactions.'],
    }
  }

  const topCats = categories.slice(0, 5)
  const totalExp = totals.expense || 1
  const breakdownRows = topCats.map((c) => ({
    label: c.category_name,
    value: `${formatCurrency(c.total, currencyCode)} (${Math.round((c.total / totalExp) * 100)}%)`,
  }))

  const topName = topCats[0].category_name
  const topPct = Math.round((topCats[0].total / totalExp) * 100)

  return {
    id,
    sender: 'assistant',
    timestamp,
    text: `Most of your spending in **${period.label}** is concentrated in **${topName}**, accounting for **${topPct}%** (${formatCurrency(topCats[0].total, currencyCode)}) of your total **${formatCurrency(totals.expense, currencyCode)}** in expenses.`,
    data: {
      headline: 'Expense Allocation',
      dateRangeLabel: period.label,
      primaryValue: `${topPct}%`,
      primaryLabel: `Top Category: ${topName}`,
      variant: 'neutral',
      badge: `${categories.length} Categories`,
      breakdown: breakdownRows,
      actionLink: '/expenses',
      actionLabel: 'View Expenses Ledger',
    },
    suggestions: [
      'What are my top 5 biggest expenses?',
      'Show me expenses I could reduce.',
      'How much did I spend in each category?',
    ],
  }
}

async function handleTop5Expenses(
  analysis: FinancialAnalysisService,
  currencyCode: string,
  id: string,
  timestamp: string,
  refDate: Date,
): Promise<AssistantMessage> {
  const { period } = await analysis.getCurrentMonthTotals(refDate)
  const topList = await analysis.getTopExpenses(5, { date_from: period.start, date_to: period.end })

  if (topList.length === 0) {
    return {
      id,
      sender: 'assistant',
      timestamp,
      text: `No expense transactions were recorded in **${period.label}**.`,
      suggestions: ['How much did I spend this month?', 'Show my most recent transactions.'],
    }
  }

  const tableRows = topList.map((tx) => [
    tx.date,
    tx.description || 'Untitled',
    tx.category_name || 'Uncategorized',
    formatCurrency(tx.amount, currencyCode),
  ])

  return {
    id,
    sender: 'assistant',
    timestamp,
    text: `Here are your largest individual expense transactions recorded in **${period.label}**:`,
    data: {
      headline: 'Top Expense Transactions',
      dateRangeLabel: period.label,
      table: {
        headers: ['Date', 'Description', 'Category', 'Amount'],
        rows: tableRows,
      },
      actionLink: '/transactions',
      actionLabel: 'View in Transactions',
    },
    suggestions: [
      'Where is most of my money going?',
      'Show me expenses I could reduce.',
      'Which expenses increased the most?',
    ],
  }
}

async function handleExpensesIncreased(
  analysis: FinancialAnalysisService,
  currencyCode: string,
  id: string,
  timestamp: string,
  refDate: Date,
): Promise<AssistantMessage> {
  const compRows = await analysis.getCategoryComparison(refDate)
  const increases = compRows.filter((r) => r.diff > 0).slice(0, 5)

  if (increases.length === 0) {
    return {
      id,
      sender: 'assistant',
      timestamp,
      text: `None of your expense categories increased compared to last month. Spending across all categories was stable or decreased.`,
      suggestions: ['Compare this month with last month.', 'Where is most of my money going?'],
    }
  }

  const topIncrease = increases[0]
  const pctStr = topIncrease.pctChange !== null ? ` (+${topIncrease.pctChange}%)` : ''

  return {
    id,
    sender: 'assistant',
    timestamp,
    text: `**${topIncrease.categoryName}** had the largest spending increase this month, growing by **${formatCurrency(topIncrease.diff, currencyCode)}**${pctStr} from last month.`,
    data: {
      headline: 'Category Increases',
      primaryValue: `+${formatCurrency(topIncrease.diff, currencyCode)}`,
      primaryLabel: `Largest Increase: ${topIncrease.categoryName}`,
      variant: 'negative',
      badge: `${increases.length} Categories Rose`,
      breakdown: increases.map((r) => ({
        label: r.categoryName,
        value: `+${formatCurrency(r.diff, currencyCode)} (${formatCurrency(r.previousAmount, currencyCode)} -> ${formatCurrency(r.currentAmount, currencyCode)})`,
      })),
      actionLink: '/expenses',
      actionLabel: 'Inspect Expense Categories',
    },
    suggestions: [
      'Why did my expenses increase?',
      'Show me expenses I could reduce.',
      'Compare this month with last month.',
    ],
  }
}

async function handleReduceExpenses(
  analysis: FinancialAnalysisService,
  currencyCode: string,
  id: string,
  timestamp: string,
  refDate: Date,
): Promise<AssistantMessage> {
  const { period, totals } = await analysis.getCurrentMonthTotals(refDate)
  const categories = await analysis.getExpenseCategories({ date_from: period.start, date_to: period.end })

  if (categories.length === 0) {
    return {
      id,
      sender: 'assistant',
      timestamp,
      text: `No expense data is currently available for **${period.label}** to identify reduction opportunities.`,
      suggestions: ['How much money did I earn this month?', 'Show my most recent transactions.'],
    }
  }

  const top3 = categories.slice(0, 3)
  const suggestionsText = top3
    .map((c) => `- **${c.category_name}**: ${formatCurrency(c.total, currencyCode)} (${Math.round((c.total / (totals.expense || 1)) * 100)}% of total). Setting a fixed limit or auditing recurring payments here could yield the highest impact.`)
    .join('\n')

  return {
    id,
    sender: 'assistant',
    timestamp,
    text: `Based on your records for **${period.label}**, here are the highest-impact categories where spending is concentrated:\n\n${suggestionsText}\n\n*These observations represent areas of highest expenditure; they are suggested starting points for review rather than judgments about necessity.*`,
    data: {
      headline: 'Potential Reduction Areas',
      dateRangeLabel: period.label,
      badge: 'Analytical Suggestion',
      breakdown: top3.map((c) => ({
        label: c.category_name,
        value: formatCurrency(c.total, currencyCode),
      })),
      actionLink: '/expenses',
      actionLabel: 'Review Expenses',
    },
    suggestions: [
      'What are my top 5 biggest expenses?',
      'Help me create a monthly spending budget.',
      'What should I improve in my finances?',
    ],
  }
}

async function handleSpendByCategory(
  analysis: FinancialAnalysisService,
  currencyCode: string,
  id: string,
  timestamp: string,
  refDate: Date,
): Promise<AssistantMessage> {
  const { period, totals } = await analysis.getCurrentMonthTotals(refDate)
  const categories = await analysis.getExpenseCategories({ date_from: period.start, date_to: period.end })

  if (categories.length === 0) {
    return {
      id,
      sender: 'assistant',
      timestamp,
      text: `No category spending was recorded in **${period.label}**.`,
      suggestions: ['How much money did I earn this month?', 'Show my most recent transactions.'],
    }
  }

  const totalExp = totals.expense || 1
  const breakdownRows = categories.map((c) => ({
    label: c.category_name,
    value: `${formatCurrency(c.total, currencyCode)} (${Math.round((c.total / totalExp) * 100)}%)`,
  }))

  return {
    id,
    sender: 'assistant',
    timestamp,
    text: `You have **${categories.length}** expense categories with activity in **${period.label}**, totaling **${formatCurrency(totals.expense, currencyCode)}**:`,
    data: {
      headline: 'Category Breakdown',
      dateRangeLabel: period.label,
      primaryValue: formatCurrency(totals.expense, currencyCode),
      primaryLabel: 'Total Spending',
      variant: 'neutral',
      breakdown: breakdownRows,
      actionLink: '/expenses',
      actionLabel: 'Open Expenses Ledger',
    },
    suggestions: [
      'Where is most of my money going?',
      'Find transactions without a category.',
      'Show me expenses I could reduce.',
    ],
  }
}

async function handleSingleCategorySpend(
  analysis: FinancialAnalysisService,
  categoryName: string,
  currencyCode: string,
  id: string,
  timestamp: string,
  refDate: Date,
): Promise<AssistantMessage> {
  const { period, totals } = await analysis.getCurrentMonthTotals(refDate)
  const categories = await analysis.getExpenseCategories({ date_from: period.start, date_to: period.end })
  const match = categories.find((c) => c.category_name.toLowerCase() === categoryName.toLowerCase())

  const amount = match ? match.total : 0
  const pct = totals.expense > 0 ? Math.round((amount / totals.expense) * 100) : 0

  return {
    id,
    sender: 'assistant',
    timestamp,
    text: match
      ? `You spent **${formatCurrency(amount, currencyCode)}** on **${match.category_name}** in ${period.label} (${pct}% of total expenses).`
      : `No expenses were recorded under category **${categoryName}** in ${period.label}.`,
    data: {
      headline: `Category: ${categoryName}`,
      dateRangeLabel: period.label,
      primaryValue: formatCurrency(amount, currencyCode),
      primaryLabel: `${categoryName} Spending`,
      variant: 'negative',
      badge: `${pct}% of Total Expenses`,
      actionLink: '/expenses',
      actionLabel: 'View in Expenses Ledger',
    },
    suggestions: [
      'Where is most of my money going?',
      'How much did I spend in each category?',
      'Show me expenses I could reduce.',
    ],
  }
}

// -----------------------------------------------------------------------------
// Category C: Comparisons and Trends Handlers
// -----------------------------------------------------------------------------

async function handleCompareLastMonth(
  analysis: FinancialAnalysisService,
  currencyCode: string,
  id: string,
  timestamp: string,
  refDate: Date,
): Promise<AssistantMessage> {
  const comp = await analysis.compareMonthWithPrevious(refDate)

  const incomePctStr = comp.incomePct !== null ? ` (${comp.incomePct >= 0 ? '+' : ''}${comp.incomePct}%)` : ''
  const expensePctStr = comp.expensePct !== null ? ` (${comp.expensePct >= 0 ? '+' : ''}${comp.expensePct}%)` : ''

  return {
    id,
    sender: 'assistant',
    timestamp,
    text: `Comparing **${comp.currentMonth.label}** with **${comp.previousMonth.label}**:\n\n- Income: **${formatCurrency(comp.currentTotals.income, currencyCode)}** vs. ${formatCurrency(comp.previousTotals.income, currencyCode)}${incomePctStr}\n- Expenses: **${formatCurrency(comp.currentTotals.expense, currencyCode)}** vs. ${formatCurrency(comp.previousTotals.expense, currencyCode)}${expensePctStr}\n- Net Result: **${comp.currentTotals.income - comp.currentTotals.expense >= 0 ? '+' : ''}${formatCurrency(comp.currentTotals.income - comp.currentTotals.expense, currencyCode)}** vs. ${formatCurrency(comp.previousTotals.income - comp.previousTotals.expense, currencyCode)}`,
    data: {
      headline: 'Month-over-Month Comparison',
      breakdown: [
        { label: `Income (${comp.currentMonth.label})`, value: formatCurrency(comp.currentTotals.income, currencyCode) },
        { label: `Income (${comp.previousMonth.label})`, value: formatCurrency(comp.previousTotals.income, currencyCode) },
        { label: `Expenses (${comp.currentMonth.label})`, value: formatCurrency(comp.currentTotals.expense, currencyCode) },
        { label: `Expenses (${comp.previousMonth.label})`, value: formatCurrency(comp.previousTotals.expense, currencyCode) },
        { label: 'Net Cash Flow Shift', value: (comp.cashFlowDiff >= 0 ? '+' : '') + formatCurrency(comp.cashFlowDiff, currencyCode) },
      ],
      actionLink: '/cash-flow',
      actionLabel: 'Compare in Cash Flow Chart',
    },
    suggestions: [
      'Why did my expenses increase?',
      'What changed in my finances this month?',
      'Show my income and expenses trend.',
    ],
  }
}

async function handleWhyExpensesIncreased(
  analysis: FinancialAnalysisService,
  currencyCode: string,
  id: string,
  timestamp: string,
  refDate: Date,
): Promise<AssistantMessage> {
  const comp = await analysis.compareMonthWithPrevious(refDate)
  const diff = comp.expenseDiff

  if (diff <= 0) {
    return {
      id,
      sender: 'assistant',
      timestamp,
      text: `Your overall expenses did not increase this month. In fact, total spending changed by **${diff < 0 ? '-' : ''}${formatCurrency(Math.abs(diff), currencyCode)}** compared to last month.`,
      suggestions: ['Compare this month with last month.', 'Where is most of my money going?'],
    }
  }

  const categoryDiffs = await analysis.getCategoryComparison(refDate)
  const mainDrivers = categoryDiffs.filter((c) => c.diff > 0).slice(0, 3)

  const driversSummary = mainDrivers
    .map((c) => `- **${c.categoryName}**: grew by ${formatCurrency(c.diff, currencyCode)} (${formatCurrency(c.previousAmount, currencyCode)} -> ${formatCurrency(c.currentAmount, currencyCode)})`)
    .join('\n')

  return {
    id,
    sender: 'assistant',
    timestamp,
    text: `Your expenses increased by **${formatCurrency(diff, currencyCode)}** this month. The primary measurable drivers were:\n\n${driversSummary}`,
    data: {
      headline: 'Expense Growth Drivers',
      primaryValue: `+${formatCurrency(diff, currencyCode)}`,
      primaryLabel: 'Total Expense Expansion',
      variant: 'negative',
      breakdown: mainDrivers.map((c) => ({
        label: c.categoryName,
        value: `+${formatCurrency(c.diff, currencyCode)}`,
      })),
      actionLink: '/expenses',
      actionLabel: 'Investigate in Expenses',
    },
    suggestions: [
      'Which expenses increased the most?',
      'Show me expenses I could reduce.',
      'Compare this month with last month.',
    ],
  }
}

async function handleWhatChanged(
  analysis: FinancialAnalysisService,
  currencyCode: string,
  id: string,
  timestamp: string,
  refDate: Date,
): Promise<AssistantMessage> {
  const comp = await analysis.compareMonthWithPrevious(refDate)

  const incChange = comp.incomeDiff >= 0 ? `increased by ${formatCurrency(comp.incomeDiff, currencyCode)}` : `decreased by ${formatCurrency(Math.abs(comp.incomeDiff), currencyCode)}`
  const expChange = comp.expenseDiff >= 0 ? `increased by ${formatCurrency(comp.expenseDiff, currencyCode)}` : `decreased by ${formatCurrency(Math.abs(comp.expenseDiff), currencyCode)}`

  return {
    id,
    sender: 'assistant',
    timestamp,
    text: `Here is what changed in **${comp.currentMonth.label}** relative to **${comp.previousMonth.label}**:\n\n- Income ${incChange}.\n- Expenses ${expChange}.\n- Net cash flow shifted by **${comp.cashFlowDiff >= 0 ? '+' : ''}${formatCurrency(comp.cashFlowDiff, currencyCode)}**.`,
    data: {
      headline: 'Financial Changes',
      breakdown: [
        { label: 'Income Change', value: (comp.incomeDiff >= 0 ? '+' : '') + formatCurrency(comp.incomeDiff, currencyCode) },
        { label: 'Expense Change', value: (comp.expenseDiff >= 0 ? '+' : '') + formatCurrency(comp.expenseDiff, currencyCode) },
        { label: 'Net Profit Change', value: (comp.netDiff >= 0 ? '+' : '') + formatCurrency(comp.netDiff, currencyCode) },
      ],
      actionLink: '/reports',
      actionLabel: 'View Full Reports',
    },
    suggestions: [
      'Compare this month with last month.',
      'Give me a financial summary for this month.',
      'What should I improve in my finances?',
    ],
  }
}

async function handleIncomeExpenseTrend(
  analysis: FinancialAnalysisService,
  currencyCode: string,
  id: string,
  timestamp: string,
  _refDate: Date,
): Promise<AssistantMessage> {
  const trends = await analysis.getMonthlyTrend(6)

  if (trends.length === 0) {
    return {
      id,
      sender: 'assistant',
      timestamp,
      text: 'No historical monthly records are available to construct a trend.',
      suggestions: ['Give me a financial summary for this month.', 'Show my most recent transactions.'],
    }
  }

  const tableRows = trends.map((t) => [
    t.month,
    formatCurrency(t.income, currencyCode),
    formatCurrency(t.expense, currencyCode),
    (t.income - t.expense >= 0 ? '+' : '') + formatCurrency(t.income - t.expense, currencyCode),
  ])

  return {
    id,
    sender: 'assistant',
    timestamp,
    text: `Here is your income and expenses trajectory over the past **${trends.length} months**:`,
    data: {
      headline: 'Multi-Month Trend',
      table: {
        headers: ['Month', 'Income', 'Expenses', 'Net Profit'],
        rows: tableRows,
      },
      actionLink: '/cash-flow',
      actionLabel: 'Open Interactive Cash Flow Chart',
    },
    suggestions: [
      'Am I spending more than I earn?',
      'Compare this month with last month.',
      'Explain my cash flow in simple terms.',
    ],
  }
}

async function handleSpendingMoreThanEarn(
  analysis: FinancialAnalysisService,
  currencyCode: string,
  id: string,
  timestamp: string,
  refDate: Date,
): Promise<AssistantMessage> {
  const { period, totals } = await analysis.getCurrentMonthTotals(refDate)
  const isSpendingMore = totals.expense > totals.income
  const gap = Math.abs(totals.income - totals.expense)

  return {
    id,
    sender: 'assistant',
    timestamp,
    text: isSpendingMore
      ? `**Yes, you are currently spending more than you earn.** In **${period.label}**, expenses (${formatCurrency(totals.expense, currencyCode)}) exceed income (${formatCurrency(totals.income, currencyCode)}) by **${formatCurrency(gap, currencyCode)}**.`
      : `**No, you are not spending more than you earn.** In **${period.label}**, you earned **${formatCurrency(totals.income, currencyCode)}** and spent **${formatCurrency(totals.expense, currencyCode)}**, leaving a positive margin of **${formatCurrency(gap, currencyCode)}**.`,
    data: {
      headline: 'Income vs. Expense Test',
      dateRangeLabel: period.label,
      primaryValue: (isSpendingMore ? '-' : '+') + formatCurrency(gap, currencyCode),
      primaryLabel: isSpendingMore ? 'Operational Deficit' : 'Operational Surplus',
      variant: isSpendingMore ? 'negative' : 'positive',
      badge: isSpendingMore ? 'Spending Exceeds Earnings' : 'Within Earnings',
      breakdown: [
        { label: 'Earned', value: formatCurrency(totals.income, currencyCode) },
        { label: 'Spent', value: formatCurrency(totals.expense, currencyCode) },
      ],
      actionLink: '/dashboard',
      actionLabel: 'Return to Dashboard',
    },
    suggestions: [
      'Am I making a profit or a loss?',
      'Show me expenses I could reduce.',
      'How much can I afford to spend?',
    ],
  }
}

// -----------------------------------------------------------------------------
// Category D: Transactions Handlers
// -----------------------------------------------------------------------------

async function handleRecentTransactions(
  analysis: FinancialAnalysisService,
  currencyCode: string,
  id: string,
  timestamp: string,
): Promise<AssistantMessage> {
  const transactions = await analysis.getRecentTransactions(5)

  if (transactions.length === 0) {
    return {
      id,
      sender: 'assistant',
      timestamp,
      text: 'No transactions have been logged in your vault yet.',
      suggestions: ['Give me a financial summary for this month.'],
    }
  }

  const tableRows = transactions.map((t) => [
    t.date,
    t.description || 'Untitled',
    t.category_name || 'Uncategorized',
    t.type.toUpperCase(),
    formatCurrency(t.amount, currencyCode),
  ])

  return {
    id,
    sender: 'assistant',
    timestamp,
    text: `Here are your **5 most recent** recorded transactions:`,
    data: {
      headline: 'Recent Transactions',
      table: {
        headers: ['Date', 'Description', 'Category', 'Type', 'Amount'],
        rows: tableRows,
      },
      actionLink: '/transactions',
      actionLabel: 'Open All Transactions',
    },
    suggestions: [
      'Find my largest transaction.',
      'Summarize my transactions this month.',
      'Find transactions without a category.',
    ],
  }
}

async function handleLargestTransaction(
  analysis: FinancialAnalysisService,
  type: 'income' | 'expense' | undefined,
  currencyCode: string,
  id: string,
  timestamp: string,
): Promise<AssistantMessage> {
  const tx = await analysis.getLargestTransaction(type)

  if (!tx) {
    return {
      id,
      sender: 'assistant',
      timestamp,
      text: `No matching transactions were found.`,
      suggestions: ['Show my most recent transactions.'],
    }
  }

  return {
    id,
    sender: 'assistant',
    timestamp,
    text: `Your single largest recorded transaction is **"${tx.description || 'Untitled'}"** for **${formatCurrency(tx.amount, currencyCode)}** (${tx.type.toUpperCase()}) under category **${tx.category_name || 'Uncategorized'}** on ${tx.date}.`,
    data: {
      headline: 'Largest Transaction',
      primaryValue: formatCurrency(tx.amount, currencyCode),
      primaryLabel: tx.description || 'Untitled',
      variant: tx.type === 'income' ? 'positive' : tx.type === 'expense' ? 'negative' : 'capital',
      badge: tx.type.toUpperCase(),
      breakdown: [
        { label: 'Date', value: tx.date },
        { label: 'Category', value: tx.category_name || 'Uncategorized' },
        { label: 'Transaction Type', value: tx.type.toUpperCase() },
      ],
      actionLink: '/transactions',
      actionLabel: 'Locate in Transactions',
    },
    suggestions: [
      'Show transactions above ₱1,000.',
      'What are my top 5 biggest expenses?',
      'Show my most recent transactions.',
    ],
  }
}

async function handleTransactionsAboveThreshold(
  analysis: FinancialAnalysisService,
  threshold: number,
  currencyCode: string,
  id: string,
  timestamp: string,
): Promise<AssistantMessage> {
  const txs = await analysis.getTransactionsAboveAmount(threshold, 10)

  if (txs.length === 0) {
    return {
      id,
      sender: 'assistant',
      timestamp,
      text: `No transactions with an amount equal to or exceeding **${formatCurrency(threshold, currencyCode)}** were found.`,
      suggestions: ['Show my most recent transactions.', 'Find my largest transaction.'],
    }
  }

  const tableRows = txs.map((t) => [
    t.date,
    t.description || 'Untitled',
    t.type.toUpperCase(),
    formatCurrency(t.amount, currencyCode),
  ])

  return {
    id,
    sender: 'assistant',
    timestamp,
    text: `Found **${txs.length}** transactions with amounts of **${formatCurrency(threshold, currencyCode)}** or higher:`,
    data: {
      headline: `Transactions >= ${formatCurrency(threshold, currencyCode)}`,
      table: {
        headers: ['Date', 'Description', 'Type', 'Amount'],
        rows: tableRows,
      },
      actionLink: '/transactions',
      actionLabel: 'Filter in Transactions',
    },
    suggestions: [
      'Find my largest transaction.',
      'Show my most recent transactions.',
      'Where is most of my money going?',
    ],
  }
}

async function handleUncategorizedTransactions(
  analysis: FinancialAnalysisService,
  currencyCode: string,
  id: string,
  timestamp: string,
): Promise<AssistantMessage> {
  const uncategorized = await analysis.getUncategorizedTransactions(10)

  if (uncategorized.length === 0) {
    return {
      id,
      sender: 'assistant',
      timestamp,
      text: 'Good news! All of your transactions have an assigned category. No uncategorized transactions were found.',
      suggestions: ['How much did I spend in each category?', 'Summarize my transactions this month.'],
    }
  }

  const tableRows = uncategorized.map((t) => [
    t.date,
    t.description || 'Untitled',
    t.type.toUpperCase(),
    formatCurrency(t.amount, currencyCode),
  ])

  return {
    id,
    sender: 'assistant',
    timestamp,
    text: `You have **${uncategorized.length}** transactions without a category. Assigning categories ensures accurate financial reporting:`,
    data: {
      headline: 'Uncategorized Records',
      badge: `${uncategorized.length} Uncategorized`,
      table: {
        headers: ['Date', 'Description', 'Type', 'Amount'],
        rows: tableRows,
      },
      actionLink: '/transactions',
      actionLabel: 'Categorize in Transactions',
    },
    suggestions: [
      'How much did I spend in each category?',
      'Summarize my transactions this month.',
      'Show my most recent transactions.',
    ],
  }
}

async function handleSummarizeTransactions(
  analysis: FinancialAnalysisService,
  currencyCode: string,
  id: string,
  timestamp: string,
  refDate: Date,
): Promise<AssistantMessage> {
  const { period, totals } = await analysis.getCurrentMonthTotals(refDate)

  return {
    id,
    sender: 'assistant',
    timestamp,
    text: `Transaction summary for **${period.label}**: **${totals.count}** total records logged. Income: **${formatCurrency(totals.income, currencyCode)}**, Expenses: **${formatCurrency(totals.expense, currencyCode)}**, Capital: **${formatCurrency(totals.capital, currencyCode)}**, Withdrawals: **${formatCurrency(totals.withdrawal, currencyCode)}**.`,
    data: {
      headline: 'Transaction Activity Summary',
      dateRangeLabel: period.label,
      primaryValue: String(totals.count),
      primaryLabel: 'Total Records Logged',
      variant: 'neutral',
      breakdown: [
        { label: 'Income Volume', value: formatCurrency(totals.income, currencyCode) },
        { label: 'Expense Volume', value: formatCurrency(totals.expense, currencyCode) },
        { label: 'Capital Contributions', value: formatCurrency(totals.capital, currencyCode) },
        { label: 'Owner Withdrawals', value: formatCurrency(totals.withdrawal, currencyCode) },
      ],
      actionLink: '/transactions',
      actionLabel: 'Open Transactions Table',
    },
    suggestions: [
      'Give me a financial summary for this month.',
      'Show my most recent transactions.',
      'Where is most of my money going?',
    ],
  }
}

// -----------------------------------------------------------------------------
// Category E: Reports and Planning Handlers
// -----------------------------------------------------------------------------

async function handleSummaryThisMonth(
  analysis: FinancialAnalysisService,
  currencyCode: string,
  id: string,
  timestamp: string,
  refDate: Date,
): Promise<AssistantMessage> {
  const { period, totals } = await analysis.getCurrentMonthTotals(refDate)
  const metrics = computeFinance(totals)
  const categories = await analysis.getExpenseCategories({ date_from: period.start, date_to: period.end })
  const topExp = categories[0]

  return {
    id,
    sender: 'assistant',
    timestamp,
    text: `Executive summary for **${period.label}**: Inflows totaled **${formatCurrency(metrics.totalIncome + metrics.capitalAdded, currencyCode)}** against **${formatCurrency(metrics.totalExpenses, currencyCode)}** in operational expenses. Net cash flow stands at **${metrics.cashPosition >= 0 ? '+' : ''}${formatCurrency(metrics.cashPosition, currencyCode)}**.`,
    data: {
      headline: 'Executive Monthly Summary',
      dateRangeLabel: period.label,
      primaryValue: (metrics.cashPosition >= 0 ? '+' : '') + formatCurrency(metrics.cashPosition, currencyCode),
      primaryLabel: 'Net Cash Flow',
      variant: metrics.cashPosition >= 0 ? 'positive' : 'negative',
      badge: metrics.netProfit >= 0 ? 'Operating Surplus' : 'Operating Deficit',
      breakdown: [
        { label: 'Operating Income', value: formatCurrency(metrics.totalIncome, currencyCode) },
        { label: 'Operating Expenses', value: formatCurrency(metrics.totalExpenses, currencyCode) },
        { label: 'Capital Contributions', value: formatCurrency(metrics.capitalAdded, currencyCode) },
        { label: 'Top Expense Category', value: topExp ? `${topExp.category_name} (${formatCurrency(topExp.total, currencyCode)})` : 'None' },
      ],
      actionLink: '/reports',
      actionLabel: 'View Detailed Financial Reports',
    },
    suggestions: [
      'Explain my cash flow in simple terms.',
      'Compare this month with last month.',
      'What should I improve in my finances?',
    ],
  }
}

async function handleExplainCashFlow(
  analysis: FinancialAnalysisService,
  currencyCode: string,
  id: string,
  timestamp: string,
  refDate: Date,
): Promise<AssistantMessage> {
  const { period, totals } = await analysis.getCurrentMonthTotals(refDate)
  const totalIn = totals.income + totals.capital
  const totalOut = totals.expense + totals.withdrawal
  const net = totals.net

  const explanation = net >= 0
    ? `You brought in more cash than you spent (**+${formatCurrency(net, currencyCode)}** net). Money flowed in from income (${formatCurrency(totals.income, currencyCode)}) and capital additions (${formatCurrency(totals.capital, currencyCode)}), while outflows went to expenses (${formatCurrency(totals.expense, currencyCode)}) and withdrawals (${formatCurrency(totals.withdrawal, currencyCode)}).`
    : `More cash left your accounts than came in (**-${formatCurrency(Math.abs(net), currencyCode)}** net). Your outflows of ${formatCurrency(totalOut, currencyCode)} exceeded inflows of ${formatCurrency(totalIn, currencyCode)}.`

  return {
    id,
    sender: 'assistant',
    timestamp,
    text: `**Cash Flow in Simple Terms (${period.label})**:\n\n${explanation}`,
    data: {
      headline: 'Cash Flow Mechanics',
      dateRangeLabel: period.label,
      primaryValue: (net >= 0 ? '+' : '') + formatCurrency(net, currencyCode),
      primaryLabel: 'Net Cash Velocity',
      variant: net >= 0 ? 'positive' : 'negative',
      badge: net >= 0 ? 'Solvent Inflow' : 'Net Liquidity Drain',
      breakdown: [
        { label: 'Total Inflows', value: formatCurrency(totalIn, currencyCode) },
        { label: 'Total Outflows', value: formatCurrency(totalOut, currencyCode) },
      ],
      actionLink: '/cash-flow',
      actionLabel: 'Inspect Cash Flow Chart',
    },
    suggestions: [
      'What is my net cash flow?',
      'Compare this month with last month.',
      'How much can I afford to spend?',
    ],
  }
}

async function handleCreateBudget(
  analysis: FinancialAnalysisService,
  currencyCode: string,
  id: string,
  timestamp: string,
  refDate: Date,
): Promise<AssistantMessage> {
  const { period, totals } = await analysis.getCurrentMonthTotals(refDate)
  const income = totals.income > 0 ? totals.income : 50000 // Fallback benchmark

  // 50/30/20 guideline
  const needs = income * 0.5
  const wants = income * 0.3
  const savings = income * 0.2

  return {
    id,
    sender: 'assistant',
    timestamp,
    text: `Here is a proposed **50 / 30 / 20 Monthly Spending Framework** based on **${formatCurrency(income, currencyCode)}** in income for **${period.label}**:\n\n- **50% Needs / Operating Essentials**: ${formatCurrency(needs, currencyCode)}\n- **30% Discretionary / Flexible Wants**: ${formatCurrency(wants, currencyCode)}\n- **20% Savings / Retained Buffer**: ${formatCurrency(savings, currencyCode)}\n\n*This is an editable planning model to help guide targets. It does not alter your existing records.*`,
    data: {
      headline: 'Proposed 50/30/20 Monthly Budget',
      primaryValue: formatCurrency(income, currencyCode),
      primaryLabel: 'Base Income Reference',
      variant: 'neutral',
      badge: 'Planning Benchmark',
      breakdown: [
        { label: 'Essentials (50%)', value: formatCurrency(needs, currencyCode) },
        { label: 'Discretionary (30%)', value: formatCurrency(wants, currencyCode) },
        { label: 'Savings & Buffer (20%)', value: formatCurrency(savings, currencyCode) },
      ],
      actionLink: '/expenses',
      actionLabel: 'Compare with Actual Expenses',
    },
    suggestions: [
      'How much can I afford to spend?',
      'Show me expenses I could reduce.',
      'What should I improve in my finances?',
    ],
  }
}

async function handleAffordToSpend(
  analysis: FinancialAnalysisService,
  currencyCode: string,
  id: string,
  timestamp: string,
  refDate: Date,
): Promise<AssistantMessage> {
  const { period, totals } = await analysis.getCurrentMonthTotals(refDate)
  const remainingCash = totals.income - totals.expense
  const currentBurn = totals.expense / Math.max(1, refDate.getDate())
  const daysLeft = Math.max(0, period.daysInMonth - refDate.getDate())
  const estimatedSafeDaily = daysLeft > 0 ? Math.max(0, remainingCash / daysLeft) : 0

  return {
    id,
    sender: 'assistant',
    timestamp,
    text: `Based strictly on your recorded month-to-date income (${formatCurrency(totals.income, currencyCode)}) and spending (${formatCurrency(totals.expense, currencyCode)}):\n\n- Remaining unallocated surplus: **${formatCurrency(Math.max(0, remainingCash), currencyCode)}**\n- Days remaining in ${period.label}: **${daysLeft} days**\n- Estimated safe daily pace: **${formatCurrency(estimatedSafeDaily, currencyCode)} / day**\n\n*Important limitations: This estimate is computed from recorded transactions. Acorn does not track off-ledger liabilities, upcoming invoices, or minimum bank reserve requirements. Treat this as a pacing guide rather than guaranteed spending money.*`,
    data: {
      headline: 'Spending Capacity Assessment',
      dateRangeLabel: period.label,
      primaryValue: `${formatCurrency(estimatedSafeDaily, currencyCode)} / day`,
      primaryLabel: 'Estimated Safe Daily Spending',
      variant: remainingCash > 0 ? 'positive' : 'negative',
      badge: `${daysLeft} Days Remaining`,
      breakdown: [
        { label: 'Current Operating Surplus', value: formatCurrency(Math.max(0, remainingCash), currencyCode) },
        { label: 'Daily Burn Pacing', value: `${formatCurrency(currentBurn, currencyCode)} / day` },
        { label: 'Days Remaining', value: `${daysLeft} days` },
      ],
      actionLink: '/cash-flow',
      actionLabel: 'Review Cash Velocity',
    },
    suggestions: [
      'Help me create a monthly spending budget.',
      'Am I spending more than I earn?',
      'What is my net cash flow?',
    ],
  }
}

async function handleImproveFinances(
  analysis: FinancialAnalysisService,
  currencyCode: string,
  id: string,
  timestamp: string,
  refDate: Date,
): Promise<AssistantMessage> {
  const { period, totals } = await analysis.getCurrentMonthTotals(refDate)
  const categories = await analysis.getExpenseCategories({ date_from: period.start, date_to: period.end })
  const uncategorized = await analysis.getUncategorizedTransactions(5)

  const observations: string[] = []

  if (totals.expense > totals.income && totals.income > 0) {
    observations.push(`- **Address operating deficit**: Expenses exceed income by ${formatCurrency(totals.expense - totals.income, currencyCode)} this month.`)
  }

  if (categories.length > 0) {
    const top = categories[0]
    const topPct = Math.round((top.total / (totals.expense || 1)) * 100)
    if (topPct >= 40) {
      observations.push(`- **High category concentration**: **${top.category_name}** accounts for ${topPct}% of all spending. Diversifying or capping this area will stabilize cash flow.`)
    }
  }

  if (uncategorized.length > 0) {
    observations.push(`- **Audit uncategorized items**: ${uncategorized.length} transactions lack categories, which reduces financial visibility.`)
  }

  if (observations.length === 0) {
    observations.push(`- Your spending is well distributed across categories and within recorded income for ${period.label}. Continue logging transactions promptly.`)
  }

  return {
    id,
    sender: 'assistant',
    timestamp,
    text: `Based on your records for **${period.label}**, here are evidence-based recommendations:\n\n${observations.join('\n')}`,
    data: {
      headline: 'Financial Health Recommendations',
      dateRangeLabel: period.label,
      badge: 'Actionable Insights',
      breakdown: [
        { label: 'Active Categories', value: String(categories.length) },
        { label: 'Operating Margin', value: totals.income > 0 ? `${Math.round(((totals.income - totals.expense) / totals.income) * 100)}%` : 'N/A' },
      ],
      actionLink: '/reports',
      actionLabel: 'Open Financial Reports',
    },
    suggestions: [
      'Show me expenses I could reduce.',
      'Give me a financial summary for this month.',
      'Help me create a monthly spending budget.',
    ],
  }
}

async function handleBurnRate(
  analysis: FinancialAnalysisService,
  currencyCode: string,
  id: string,
  timestamp: string,
  refDate: Date,
): Promise<AssistantMessage> {
  const { period, totals } = await analysis.getCurrentMonthTotals(refDate)
  const days = Math.max(1, refDate.getDate())
  const dailyBurn = totals.expense / days
  const projectedMonthly = dailyBurn * period.daysInMonth

  return {
    id,
    sender: 'assistant',
    timestamp,
    text: `In **${period.label}** across ${days} calendar days, your operational cash burn averaged **${formatCurrency(dailyBurn, currencyCode)} / day**. Projected monthly burn rate is **${formatCurrency(projectedMonthly, currencyCode)}**.`,
    data: {
      headline: 'Burn Rate Analysis',
      dateRangeLabel: period.label,
      primaryValue: `${formatCurrency(dailyBurn, currencyCode)} / day`,
      primaryLabel: 'Daily Average Burn',
      variant: 'negative',
      breakdown: [
        { label: 'Month-to-Date Spending', value: formatCurrency(totals.expense, currencyCode) },
        { label: 'Days Analyzed', value: `${days} of ${period.daysInMonth} days` },
        { label: 'Projected Monthly Run-Rate', value: formatCurrency(projectedMonthly, currencyCode) },
      ],
      actionLink: '/expenses',
      actionLabel: 'Inspect Expenses',
    },
    suggestions: [
      'Show me expenses I could reduce.',
      'How much did I spend this month?',
      'How much can I afford to spend?',
    ],
  }
}
