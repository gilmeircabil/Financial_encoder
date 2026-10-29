import { describe, expect, it, vi, beforeEach } from 'vitest'
import type {
  AppSettings,
  TransactionFilters,
  TransactionInput,
  CategoryType,
  CalculationFilter,
  ExportRequest,
} from '../../electron/types/ipc'

// Mock the window.financialEncoder API
const mockIpcResult = <T>(data: T) => ({ ok: true as const, data })
const mockIpcError = (code: string, message: string) => ({ ok: false as const, error: { code, message } })

vi.mock('electron', () => ({
  app: {
    getPath: () => '/mock/userData',
  },
}))

// Create a mock window.financialEncoder for testing
const createMockEncoder = () => ({
  app: {
    ping: vi.fn().mockResolvedValue(mockIpcResult({ pong: true, timestamp: '2024-01-01T00:00:00Z' })),
    getInfo: vi.fn().mockResolvedValue(mockIpcResult({
      appName: 'Acorn',
      version: '1.0.13',
      electron: '34.0.0',
      chromium: '123.0.0',
      node: '20.0.0',
      platform: 'win32',
      userDataPath: '/mock/userData',
      logsDir: '/mock/logs',
      mode: 'development' as const,
    })),
  },
  db: {
    init: vi.fn().mockResolvedValue(mockIpcResult({
      connected: true,
      path: '/mock/db.sqlite',
      sizeBytes: 1024,
      schemaVersion: 1,
    })),
    getStatus: vi.fn().mockResolvedValue(mockIpcResult({
      connected: true,
      path: '/mock/db.sqlite',
      sizeBytes: 1024,
      schemaVersion: 1,
    })),
    reset: vi.fn().mockResolvedValue(mockIpcResult({
      safetyBackup: 'pre-reset-backup.db',
      deleted: { transactions: 0, categories: 0, backups: 0 },
      status: { connected: true, path: '/mock/db.sqlite', sizeBytes: 1024, schemaVersion: 1 },
    })),
  },
  settings: {
    getAll: vi.fn().mockResolvedValue(mockIpcResult({
      appName: 'Acorn',
      currency: 'PHP',
      dateFormat: 'YYYY-MM-DD',
      theme: 'system' as const,
      defaultExportFolder: '',
    })),
    set: vi.fn().mockImplementation(async (key: keyof AppSettings, value: string) =>
      mockIpcResult({ appName: 'Acorn', currency: 'PHP', dateFormat: 'YYYY-MM-DD', theme: 'system' as const, defaultExportFolder: '' })
    ),
  },
  logger: {
    log: vi.fn().mockResolvedValue(mockIpcResult({ received: true })),
  },
  transactions: {
    list: vi.fn().mockResolvedValue(mockIpcResult({
      transactions: [],
      total: 0,
      page: 1,
      page_size: 50,
      total_pages: 0,
    })),
    get: vi.fn().mockResolvedValue(mockIpcResult(null)),
    create: vi.fn().mockImplementation(async (tx: TransactionInput) =>
      mockIpcResult({ id: 1, ...tx, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z', category_name: 'Test' })
    ),
    update: vi.fn().mockImplementation(async (id: number, partial: Partial<TransactionInput>) =>
      mockIpcResult({ id, ...partial, category_name: 'Test' } as Transaction)
    ),
    delete: vi.fn().mockResolvedValue(mockIpcResult(true)),
  },
  categories: {
    list: vi.fn().mockResolvedValue(mockIpcResult([
      { id: 1, name: 'Salary', type: 'income' as CategoryType, is_default: 1, icon: null, color: null, created_at: '', updated_at: '' },
      { id: 2, name: 'Food', type: 'expense' as CategoryType, is_default: 1, icon: null, color: null, created_at: '', updated_at: '' },
    ])),
    types: vi.fn().mockResolvedValue(mockIpcResult(['income', 'expense', 'capital', 'withdrawal'])),
    create: vi.fn().mockImplementation(async (input: { name: string; type: CategoryType }) =>
      mockIpcResult({ id: 3, ...input, is_default: 0, icon: null, color: null, created_at: '', updated_at: '' })
    ),
  },
  calculations: {
    totals: vi.fn().mockResolvedValue(mockIpcResult({
      income: 10000,
      expense: 5000,
      capital: 2000,
      withdrawal: 500,
      asset: 0,
      liability: 0,
      net: 6500,
      count: 10,
    })),
    monthly: vi.fn().mockResolvedValue(mockIpcResult([
      { month: '2024-01', income: 5000, expense: 2500, capital: 1000, withdrawal: 250, net: 3250, count: 5 },
    ])),
    cashFlow: vi.fn().mockResolvedValue(mockIpcResult([
      { key: '2024-01', income: 5000, expense: 2500 },
    ])),
    byCategory: vi.fn().mockResolvedValue(mockIpcResult([
      { category_id: 1, category_name: 'Salary', type: 'income', total: 5000, count: 2 },
    ])),
  },
  imports: {
    pick: vi.fn().mockResolvedValue(mockIpcResult({
      columns: ['Date', 'Description', 'Amount'],
      rows: [['2024-01-01', 'Test', '100']],
      headers: ['Date', 'Description', 'Amount'],
      fileName: 'test.csv',
      totalRows: 1,
    })),
    drop: vi.fn().mockResolvedValue(mockIpcResult({
      columns: ['Date', 'Description', 'Amount'],
      rows: [['2024-01-01', 'Test', '100']],
      headers: ['Date', 'Description', 'Amount'],
      fileName: 'test.csv',
      totalRows: 1,
    })),
    confirm: vi.fn().mockResolvedValue(mockIpcResult({
      created: 1,
      updated: 0,
      skipped: 0,
      errors: [],
    })),
  },
  exports: {
    file: vi.fn().mockResolvedValue(mockIpcResult({
      filePath: '/mock/export.csv',
      bytes: 1024,
      rows: 10,
    })),
  },
  backups: {
    create: vi.fn().mockResolvedValue(mockIpcResult({
      id: 1,
      filename: 'backup-2024-01-01.db',
      path: '/mock/backups/backup-2024-01-01.db',
      size_bytes: 1024,
      created_at: '2024-01-01T00:00:00Z',
    })),
    list: vi.fn().mockResolvedValue(mockIpcResult([])),
    restore: vi.fn().mockResolvedValue(mockIpcResult({
      connected: true,
      path: '/mock/db.sqlite',
      sizeBytes: 1024,
      schemaVersion: 1,
    })),
    delete: vi.fn().mockResolvedValue(mockIpcResult(true)),
    export: vi.fn().mockResolvedValue(mockIpcResult({ filePath: '/mock/export.febak', bytes: 1024 })),
    importFromFile: vi.fn().mockResolvedValue(mockIpcResult({
      restored: true,
      filename: 'backup-2024-01-01.db',
      safetyBackup: 'pre-restore-backup.db',
    })),
  },
  ocr: {
    pick: vi.fn().mockResolvedValue(mockIpcResult({
      text: 'Sample OCR text',
      fileName: 'receipt.pdf',
    })),
    drop: vi.fn().mockResolvedValue(mockIpcResult({
      text: 'Sample OCR text',
      fileName: 'receipt.pdf',
    })),
    parse: vi.fn().mockResolvedValue(mockIpcResult([
      { date: '2024-01-01', description: 'Test', amount: 100, category: 'Food', type: 'expense', confidence: 0.9 },
    ])),
  },
})

// Set up the mock before importing api
const mockEncoder = createMockEncoder()

// Add to window before importing
if (typeof window !== 'undefined') {
  ;(window as unknown as { financialEncoder: typeof mockEncoder }).financialEncoder = mockEncoder
} else {
  ;(globalThis as unknown as { window: { financialEncoder: typeof mockEncoder } }).window = { financialEncoder: mockEncoder }
}

import { api } from '../../src/services/api'

describe('api service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('api.app', () => {
    it('ping returns PingResult', async () => {
      const result = await api.app.ping()
      expect(result).toEqual({ pong: true, timestamp: '2024-01-01T00:00:00Z' })
      expect(mockEncoder.app.ping).toHaveBeenCalled()
    })

    it('getInfo returns AppInfo', async () => {
      const result = await api.app.getInfo()
      expect(result).toEqual({
        appName: 'Acorn',
        version: '1.0.13',
        electron: '34.0.0',
        chromium: '123.0.0',
        node: '20.0.0',
        platform: 'win32',
        userDataPath: '/mock/userData',
        logsDir: '/mock/logs',
        mode: 'development',
      })
      expect(mockEncoder.app.getInfo).toHaveBeenCalled()
    })
  })

  describe('api.db', () => {
    it('init returns DatabaseStatus', async () => {
      const result = await api.db.init()
      expect(result).toEqual({
        connected: true,
        path: '/mock/db.sqlite',
        sizeBytes: 1024,
        schemaVersion: 1,
      })
    })

    it('getStatus returns DatabaseStatus', async () => {
      const result = await api.db.getStatus()
      expect(result).toEqual({
        connected: true,
        path: '/mock/db.sqlite',
        sizeBytes: 1024,
        schemaVersion: 1,
      })
    })

    it('reset returns ResetResult', async () => {
      const result = await api.db.reset()
      expect(result).toEqual({
        safetyBackup: 'pre-reset-backup.db',
        deleted: { transactions: 0, categories: 0, backups: 0 },
        status: { connected: true, path: '/mock/db.sqlite', sizeBytes: 1024, schemaVersion: 1 },
      })
    })
  })

  describe('api.settings', () => {
    it('getAll returns AppSettings', async () => {
      const result = await api.settings.getAll()
      expect(result).toEqual({
        appName: 'Acorn',
        currency: 'PHP',
        dateFormat: 'YYYY-MM-DD',
        theme: 'system',
        defaultExportFolder: '',
      })
    })

    it('set updates a setting and returns AppSettings', async () => {
      const result = await api.settings.set('currency', 'USD')
      expect(result.currency).toBe('PHP')
      expect(mockEncoder.settings.set).toHaveBeenCalledWith('currency', 'USD')
    })
  })

  describe('api.logger', () => {
    it('log calls the IPC logger', async () => {
      await api.logger.log('info', 'Test message', { key: 'value' })
      expect(mockEncoder.logger.log).toHaveBeenCalledWith('info', 'Test message', { key: 'value' })
    })

    it('supports all log levels', async () => {
      await api.logger.log('debug', 'debug')
      await api.logger.log('info', 'info')
      await api.logger.log('warn', 'warn')
      await api.logger.log('error', 'error')
      expect(mockEncoder.logger.log).toHaveBeenCalledTimes(4)
    })
  })

  describe('api.transactions', () => {
    it('list returns TransactionPage', async () => {
      const filters: TransactionFilters = { type: ['income'], page: 1, page_size: 10 }
      const result = await api.transactions.list(filters)
      expect(result).toEqual({
        transactions: [],
        total: 0,
        page: 1,
        page_size: 50,
        total_pages: 0,
      })
      expect(mockEncoder.transactions.list).toHaveBeenCalledWith(filters)
    })

    it('get returns Transaction or null', async () => {
      const result = await api.transactions.get(1)
      expect(result).toBeNull()
    })

    it('create returns created Transaction', async () => {
      const input: TransactionInput = {
        date: '2024-01-01',
        description: 'Test',
        category_id: 1,
        type: 'income',
        amount: 100,
        notes: 'Test note',
      }
      const result = await api.transactions.create(input)
      expect(result.description).toBe('Test')
      expect(result.amount).toBe(100)
      expect(result.type).toBe('income')
    })

    it('update returns updated Transaction or null', async () => {
      const result = await api.transactions.update(1, { amount: 200 })
      expect(result?.amount).toBe(200)
      expect(result?.id).toBe(1)
    })

    it('delete returns boolean', async () => {
      const result = await api.transactions.delete(1)
      expect(result).toBe(true)
    })
  })

  describe('api.categories', () => {
    it('list returns Category array', async () => {
      const result = await api.categories.list('expense')
      expect(result).toHaveLength(2)
      expect(result[0]).toHaveProperty('id')
      expect(result[0]).toHaveProperty('name')
      expect(result[0]).toHaveProperty('type')
    })

    it('types returns string array', async () => {
      const result = await api.categories.types()
      expect(result).toEqual(['income', 'expense', 'capital', 'withdrawal'])
    })

    it('create returns created Category', async () => {
      const result = await api.categories.create({ name: 'New Category', type: 'expense' })
      expect(result.name).toBe('New Category')
      expect(result.type).toBe('expense')
      expect(result.id).toBe(3)
    })
  })

  describe('api.calculations', () => {
    it('totals returns CalculationTotals', async () => {
      const filter: CalculationFilter = { date_from: '2024-01-01', date_to: '2024-12-31' }
      const result = await api.calculations.totals(filter)
      expect(result).toEqual({
        income: 10000,
        expense: 5000,
        capital: 2000,
        withdrawal: 500,
        asset: 0,
        liability: 0,
        net: 6500,
        count: 10,
      })
      expect(mockEncoder.calculations.totals).toHaveBeenCalledWith(filter)
    })

    it('monthly returns MonthlySummary array', async () => {
      const result = await api.calculations.monthly()
      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('month')
      expect(result[0]).toHaveProperty('income')
      expect(result[0]).toHaveProperty('expense')
    })

    it('cashFlow returns CashFlowPoint array with optional granularity', async () => {
      const result = await api.calculations.cashFlow({}, 'month')
      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('key')
      expect(result[0]).toHaveProperty('income')
      expect(result[0]).toHaveProperty('expense')
    })

    it('byCategory returns CategoryBreakdown array', async () => {
      const result = await api.calculations.byCategory()
      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('category_id')
      expect(result[0]).toHaveProperty('category_name')
      expect(result[0]).toHaveProperty('type')
      expect(result[0]).toHaveProperty('total')
      expect(result[0]).toHaveProperty('count')
    })
  })

  describe('api.imports', () => {
    it('pick returns ImportPreview', async () => {
      const result = await api.imports.pick()
      expect(result).toHaveProperty('columns')
      expect(result).toHaveProperty('rows')
      expect(result).toHaveProperty('fileName')
    })

    it('drop returns ImportPreview', async () => {
      const file = new File(['test'], 'test.csv', { type: 'text/csv' })
      const result = await api.imports.drop(file)
      expect(result).toHaveProperty('columns')
      expect(result).toHaveProperty('rows')
    })

    it('confirm returns ImportResult', async () => {
      const mapping: ImportMapping = {
        filePath: '/mock/test.csv',
        mapping: { date: 0, description: 1, amount: 2, type: -1, category: -1, notes: -1 },
      }
      const result = await api.imports.confirm(mapping)
      expect(result).toEqual({
        created: 1,
        updated: 0,
        skipped: 0,
        errors: [],
      })
    })
  })

  describe('api.exports', () => {
    it('file returns ExportResult', async () => {
      const request: ExportRequest = { format: 'csv', filter: {} }
      const result = await api.exports.file(request)
      expect(result).toEqual({
        filePath: '/mock/export.csv',
        bytes: 1024,
        rows: 10,
      })
      expect(mockEncoder.exports.file).toHaveBeenCalledWith(request)
    })
  })

  describe('api.backups', () => {
    it('create returns BackupRecord', async () => {
      const result = await api.backups.create()
      expect(result).toHaveProperty('id')
      expect(result).toHaveProperty('filename')
      expect(result).toHaveProperty('path')
      expect(result).toHaveProperty('size_bytes')
      expect(result).toHaveProperty('created_at')
    })

    it('list returns BackupRecord array', async () => {
      const result = await api.backups.list()
      expect(Array.isArray(result)).toBe(true)
    })

    it('restore returns DatabaseStatus', async () => {
      const result = await api.backups.restore(1)
      expect(result).toHaveProperty('connected')
      expect(result).toHaveProperty('path')
      expect(result).toHaveProperty('sizeBytes')
      expect(result).toHaveProperty('schemaVersion')
    })

    it('delete returns boolean', async () => {
      const result = await api.backups.delete(1)
      expect(result).toBe(true)
    })

    it('export returns BackupExportResult', async () => {
      const result = await api.backups.export()
      expect(result).toEqual({ filePath: '/mock/export.febak', bytes: 1024 })
    })

    it('importFromFile returns RestoreFileResult', async () => {
      const result = await api.backups.importFromFile()
      expect(result).toEqual({
        restored: true,
        filename: 'backup-2024-01-01.db',
        safetyBackup: 'pre-restore-backup.db',
      })
    })
  })

  describe('api.ocr', () => {
    it('pick returns ReadDocumentResult', async () => {
      const result = await api.ocr.pick()
      expect(result).toHaveProperty('text')
      expect(result).toHaveProperty('fileName')
    })

    it('drop returns ReadDocumentResult', async () => {
      const file = new File(['test'], 'receipt.pdf', { type: 'application/pdf' })
      const result = await api.ocr.drop(file)
      expect(result).toHaveProperty('text')
      expect(result).toHaveProperty('fileName')
    })

    it('parse returns ParsedDocumentLine array', async () => {
      const result = await api.ocr.parse('Sample text', 'receipt.pdf')
      expect(result).toHaveLength(1)
      expect(result[0]).toHaveProperty('date')
      expect(result[0]).toHaveProperty('description')
      expect(result[0]).toHaveProperty('amount')
      expect(result[0]).toHaveProperty('category')
      expect(result[0]).toHaveProperty('type')
      expect(result[0]).toHaveProperty('confidence')
    })
  })

  describe('ApiError', () => {
    it('throws ApiError on IPC error', async () => {
      mockEncoder.app.ping.mockResolvedValueOnce(mockIpcError('DB_ERROR', 'Database connection failed'))

      await expect(api.app.ping()).rejects.toThrow()
      try {
        await api.app.ping()
      } catch (err) {
        expect(err).toBeInstanceOf(Error)
        expect((err as Error).name).toBe('ApiError')
        expect((err as { code: string }).code).toBe('DB_ERROR')
      }
    })
  })
})