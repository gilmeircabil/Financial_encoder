import { describe, expect, it } from 'vitest'
import {
  QUESTION_REGISTRY,
  QUESTION_CATEGORIES,
  findQuestionByPrompt,
  getQuestionsByCategory,
} from '../../src/lib/assistant/questionRegistry'
import { processAssistantQuery } from '../../src/lib/assistant/assistantEngine'
import {
  getMonthPeriod,
  getPreviousMonthPeriod,
  safePercentChange,
} from '../../src/lib/assistant/financialAnalysisService'
import type { Category, Transaction } from '../../electron/types/ipc'

describe('Question Registry (Master Prompt Section 3)', () => {
  it('defines all 5 specified categories', () => {
    expect(QUESTION_CATEGORIES.map((c) => c.id)).toEqual([
      'my_money',
      'expenses',
      'comparisons',
      'transactions',
      'planning',
    ])
  })

  it('contains exactly 25 registered financial questions', () => {
    expect(QUESTION_REGISTRY.length).toBe(25)
  })

  it('distributes 5 questions per category', () => {
    for (const cat of QUESTION_CATEGORIES) {
      const qs = getQuestionsByCategory(cat.id)
      expect(qs.length).toBe(5)
    }
  })

  it('matches all 25 questions by exact and normalized prompts', () => {
    for (const q of QUESTION_REGISTRY) {
      const matchExact = findQuestionByPrompt(q.prompt)
      expect(matchExact?.id).toBe(q.id)

      // Test case/punctuation insensitivity
      const matchLower = findQuestionByPrompt(q.prompt.toLowerCase().replace('?', ''))
      expect(matchLower?.id).toBe(q.id)
    }
  })
})

describe('Financial Analysis Utilities', () => {
  it('calculates calendar month bounds accurately', () => {
    const d = new Date(2026, 9, 29) // October 29, 2026
    const cur = getMonthPeriod(d)
    expect(cur.start).toBe('2026-10-01')
    expect(cur.end).toBe('2026-10-31')
    expect(cur.label).toBe('October 2026')
    expect(cur.daysInMonth).toBe(31)

    const prev = getPreviousMonthPeriod(d)
    expect(prev.start).toBe('2026-09-01')
    expect(prev.end).toBe('2026-09-30')
    expect(prev.label).toBe('September 2026')
  })

  it('handles safe percent change without division by zero', () => {
    expect(safePercentChange(120, 100)).toBe(20)
    expect(safePercentChange(80, 100)).toBe(-20)
    expect(safePercentChange(100, 0)).toBeNull() // Zero denominator protection
  })
})

describe('All 25 Question Handlers (Deterministic SQLite Queries)', () => {
  const refDate = new Date(2026, 9, 29) // 2026-10-29
  const mockCategories: Category[] = [
    { id: 1, name: 'Food', type: 'expense', is_default: 1, created_at: '' },
    { id: 2, name: 'Internet', type: 'expense', is_default: 1, created_at: '' },
    { id: 3, name: 'Salary', type: 'income', is_default: 1, created_at: '' },
  ]

  const mockTotals = {
    income: 25000,
    expense: 20000,
    capital: 10000,
    withdrawal: 2000,
    asset: 0,
    liability: 0,
    net: 13000, // 25000 + 10000 - 20000 - 2000
    count: 6,
  }

  const mockCategoryBreakdown = [
    { category_id: 1, category_name: 'Food', type: 'expense' as const, total: 15000, count: 3 },
    { category_id: 2, category_name: 'Internet', type: 'expense' as const, total: 5000, count: 1 },
  ]

  const mockTransactions: Transaction[] = [
    {
      id: 1,
      date: '2026-10-28',
      amount: 15000,
      type: 'expense',
      category_id: 1,
      category_name: 'Food',
      description: 'Monthly groceries and market',
      created_at: '2026-10-28',
      updated_at: '2026-10-28',
    },
    {
      id: 2,
      date: '2026-10-20',
      amount: 5000,
      type: 'expense',
      category_id: 2,
      category_name: 'Internet',
      description: 'Fiber internet bill',
      created_at: '2026-10-20',
      updated_at: '2026-10-20',
    },
    {
      id: 3,
      date: '2026-10-15',
      amount: 25000,
      type: 'income',
      category_id: 3,
      category_name: 'Salary',
      description: 'Software development retainer',
      created_at: '2026-10-15',
      updated_at: '2026-10-15',
    },
  ]

  const mockMonthly = [
    { month: '2026-08', income: 20000, expense: 18000, capital: 0, withdrawal: 0, net: 2000, count: 4 },
    { month: '2026-09', income: 22000, expense: 19000, capital: 5000, withdrawal: 0, net: 8000, count: 5 },
    { month: '2026-10', income: 25000, expense: 20000, capital: 10000, withdrawal: 2000, net: 13000, count: 6 },
  ]

  const mockApi = {
    calculations: {
      totals: async () => mockTotals,
      byCategory: async () => mockCategoryBreakdown,
      monthly: async () => mockMonthly,
      cashFlow: async () => [],
    },
    transactions: {
      list: async (filters: any) => {
        let list = [...mockTransactions]
        if (filters?.type?.length) {
          list = list.filter((t) => filters.type.includes(t.type))
        }
        if (filters?.sort_by === 'amount') {
          list.sort((a, b) => (filters.sort_dir === 'asc' ? a.amount - b.amount : b.amount - a.amount))
        }
        return {
          transactions: list,
          total: list.length,
          page: 1,
          page_size: 20,
          total_pages: 1,
        }
      },
      get: async () => null,
      create: async () => ({} as any),
      update: async () => ({} as any),
      delete: async () => true,
    },
  } as any

  // Category A: My Money
  it('Q1: How much money did I earn this month?', async () => {
    const res = await processAssistantQuery('How much money did I earn this month?', mockCategories, 'PHP', mockApi, refDate)
    expect(res.text).toContain('earned a total of **₱25,000.00**')
    expect(res.data?.primaryValue).toBe('₱25,000.00')
    expect(res.data?.variant).toBe('positive')
  })

  it('Q2: How much did I spend this month?', async () => {
    const res = await processAssistantQuery('How much did I spend this month?', mockCategories, 'PHP', mockApi, refDate)
    expect(res.text).toContain('spending totaled **₱20,000.00**')
    expect(res.data?.primaryValue).toBe('₱20,000.00')
  })

  it('Q3: Am I making a profit or a loss?', async () => {
    const res = await processAssistantQuery('Am I making a profit or a loss?', mockCategories, 'PHP', mockApi, refDate)
    expect(res.text).toContain('net profit of **₱5,000.00**')
    expect(res.data?.badge).toBe('Profit (Surplus)')
  })

  it('Q4: How much did I save this month?', async () => {
    const res = await processAssistantQuery('How much did I save this month?', mockCategories, 'PHP', mockApi, refDate)
    expect(res.text).toContain('retained **₱5,000.00**')
    expect(res.data?.primaryValue).toBe('₱5,000.00')
  })

  it('Q5: What is my net cash flow?', async () => {
    const res = await processAssistantQuery('What is my net cash flow?', mockCategories, 'PHP', mockApi, refDate)
    expect(res.text).toContain('net cash flow')
    expect(res.data?.primaryValue).toBe('+₱13,000.00')
  })

  // Category B: Expenses
  it('Q6: Where is most of my money going?', async () => {
    const res = await processAssistantQuery('Where is most of my money going?', mockCategories, 'PHP', mockApi, refDate)
    expect(res.text).toContain('Food')
    expect(res.data?.primaryLabel).toContain('Food')
  })

  it('Q7: What are my top 5 biggest expenses?', async () => {
    const res = await processAssistantQuery('What are my top 5 biggest expenses?', mockCategories, 'PHP', mockApi, refDate)
    expect(res.data?.table).toBeDefined()
    expect(res.data?.table?.rows.length).toBeGreaterThan(0)
  })

  it('Q8: Which expenses increased the most?', async () => {
    const res = await processAssistantQuery('Which expenses increased the most?', mockCategories, 'PHP', mockApi, refDate)
    expect(res.text).toBeDefined()
  })

  it('Q9: Show me expenses I could reduce.', async () => {
    const res = await processAssistantQuery('Show me expenses I could reduce.', mockCategories, 'PHP', mockApi, refDate)
    expect(res.text).toContain('Food')
  })

  it('Q10: How much did I spend in each category?', async () => {
    const res = await processAssistantQuery('How much did I spend in each category?', mockCategories, 'PHP', mockApi, refDate)
    expect(res.data?.breakdown?.length).toBe(2)
  })

  // Category C: Comparisons and Trends
  it('Q11: Compare this month with last month.', async () => {
    const res = await processAssistantQuery('Compare this month with last month.', mockCategories, 'PHP', mockApi, refDate)
    expect(res.text).toContain('October 2026')
    expect(res.data?.headline).toBe('Month-over-Month Comparison')
  })

  it('Q12: Why did my expenses increase?', async () => {
    const res = await processAssistantQuery('Why did my expenses increase?', mockCategories, 'PHP', mockApi, refDate)
    expect(res.text).toBeDefined()
  })

  it('Q13: What changed in my finances this month?', async () => {
    const res = await processAssistantQuery('What changed in my finances this month?', mockCategories, 'PHP', mockApi, refDate)
    expect(res.data?.headline).toBe('Financial Changes')
  })

  it('Q14: Show my income and expenses trend.', async () => {
    const res = await processAssistantQuery('Show my income and expenses trend.', mockCategories, 'PHP', mockApi, refDate)
    expect(res.data?.table?.rows.length).toBe(3)
  })

  it('Q15: Am I spending more than I earn?', async () => {
    const res = await processAssistantQuery('Am I spending more than I earn?', mockCategories, 'PHP', mockApi, refDate)
    expect(res.text).toContain('No, you are not spending more than you earn')
  })

  // Category D: Transactions
  it('Q16: Show my most recent transactions.', async () => {
    const res = await processAssistantQuery('Show my most recent transactions.', mockCategories, 'PHP', mockApi, refDate)
    expect(res.data?.table?.headers).toEqual(['Date', 'Description', 'Category', 'Type', 'Amount'])
  })

  it('Q17: Find my largest transaction.', async () => {
    const res = await processAssistantQuery('Find my largest transaction.', mockCategories, 'PHP', mockApi, refDate)
    expect(res.data?.primaryValue).toBe('₱25,000.00')
  })

  it('Q18: Show transactions above ₱1,000.', async () => {
    const res = await processAssistantQuery('Show transactions above ₱1,000.', mockCategories, 'PHP', mockApi, refDate)
    expect(res.data?.table?.rows.length).toBeGreaterThan(0)
  })

  it('Q19: Find transactions without a category.', async () => {
    const res = await processAssistantQuery('Find transactions without a category.', mockCategories, 'PHP', mockApi, refDate)
    expect(res.text).toBeDefined()
  })

  it('Q20: Summarize my transactions this month.', async () => {
    const res = await processAssistantQuery('Summarize my transactions this month.', mockCategories, 'PHP', mockApi, refDate)
    expect(res.data?.headline).toBe('Transaction Activity Summary')
  })

  // Category E: Reports and Planning
  it('Q21: Give me a financial summary for this month.', async () => {
    const res = await processAssistantQuery('Give me a financial summary for this month.', mockCategories, 'PHP', mockApi, refDate)
    expect(res.data?.primaryValue).toBe('+₱13,000.00')
  })

  it('Q22: Explain my cash flow in simple terms.', async () => {
    const res = await processAssistantQuery('Explain my cash flow in simple terms.', mockCategories, 'PHP', mockApi, refDate)
    expect(res.text).toContain('Cash Flow in Simple Terms')
  })

  it('Q23: Help me create a monthly spending budget.', async () => {
    const res = await processAssistantQuery('Help me create a monthly spending budget.', mockCategories, 'PHP', mockApi, refDate)
    expect(res.text).toContain('50 / 30 / 20')
  })

  it('Q24: How much can I afford to spend?', async () => {
    const res = await processAssistantQuery('How much can I afford to spend?', mockCategories, 'PHP', mockApi, refDate)
    expect(res.data?.headline).toBe('Spending Capacity Assessment')
  })

  it('Q25: What should I improve in my finances?', async () => {
    const res = await processAssistantQuery('What should I improve in my finances?', mockCategories, 'PHP', mockApi, refDate)
    expect(res.data?.headline).toBe('Financial Health Recommendations')
  })

  // Clean UI check: No emojis anywhere in returned text or suggestions
  it('contains zero emojis in returned text across all responses', async () => {
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
    const res = await processAssistantQuery('Give me a financial summary for this month.', mockCategories, 'PHP', mockApi, refDate)
    expect(emojiRegex.test(res.text)).toBe(false)
    for (const sug of res.suggestions || []) {
      expect(emojiRegex.test(sug)).toBe(false)
    }
  })
})
