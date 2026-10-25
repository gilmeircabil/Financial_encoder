import * as path from 'path'
import { getDb } from './connection'
import type { AppSettings } from '../types/ipc'

export const DEFAULT_SETTINGS: AppSettings = {
  appName: 'Acorn',
  currency: 'PHP',
  dateFormat: 'YYYY-MM-DD',
  theme: 'system',
  defaultExportFolder: '',
}

export type { AppSettings }

export const SETTING_KEYS: Record<keyof AppSettings, keyof AppSettings> = {
  appName: 'appName',
  currency: 'currency',
  dateFormat: 'dateFormat',
  theme: 'theme',
  defaultExportFolder: 'defaultExportFolder',
}

const VALID_THEMES = new Set(['light', 'dark', 'system'])
// Display tokens only (YYYY / MMMM / MMM / MM / DD / D) plus common separators.
const VALID_DATE_FORMAT_PATTERN = /^[YMD\-\/.\s]+$/
const CONTROL_CHARS = /[\u0000-\u001f]/

const LEGACY_COUNTRY_TO_ISO: Record<string, string> = {
  'east timor': 'USD',
  'united states': 'USD',
  'united states of america': 'USD',
  'philippines': 'PHP',
  'united kingdom': 'GBP',
  'germany': 'EUR',
  'france': 'EUR',
  'spain': 'EUR',
  'italy': 'EUR',
  'japan': 'JPY',
  'canada': 'CAD',
  'australia': 'AUD',
  'singapore': 'SGD',
  '$': 'USD',
  '₱': 'PHP',
  '€': 'EUR',
  '£': 'GBP',
  '¥': 'JPY',
}

export function normalizeCurrencyToIso(val: string): string {
  if (!val) return 'USD'
  const trimmed = val.trim()
  if (/^[A-Za-z]{3}$/.test(trimmed)) {
    return trimmed.toUpperCase()
  }
  const match = LEGACY_COUNTRY_TO_ISO[trimmed.toLowerCase()]
  if (match) {
    return match
  }
  return 'USD'
}

export function isAppSettingKey(value: unknown): value is keyof AppSettings {
  return typeof value === 'string' && value in SETTING_KEYS
}

/** Returns all settings merged over their defaults, migrating any legacy currency value to ISO code. */
export function getAllSettings(): AppSettings {
  const db = getDb()
  const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[]
  const persisted: Record<string, string> = {}
  for (const row of rows) {
    persisted[row.key] = row.value
  }

  if (persisted.currency) {
    const normalized = normalizeCurrencyToIso(persisted.currency)
    if (normalized !== persisted.currency) {
      db.prepare("UPDATE settings SET value = ?, updated_at = datetime('now') WHERE key = 'currency'").run(normalized)
      persisted.currency = normalized
    }
  }

  return { ...DEFAULT_SETTINGS, ...persisted } as AppSettings
}

/**
 * Persists a setting. Values are validated here in the main process so the
 * renderer can never write arbitrary or malformed settings.
 */
export function setSetting(key: keyof AppSettings, value: string): AppSettings {
  if (!isAppSettingKey(key)) {
    throw new Error(`Unknown setting key: ${key}`)
  }
  if (typeof value !== 'string' || value.length > 200) {
    throw new Error(`Invalid value for setting: ${key}`)
  }
  if (key === 'theme' && !VALID_THEMES.has(value)) {
    throw new Error(`Invalid theme value: ${value}`)
  }
  let finalValue = value
  if (key === 'currency') {
    finalValue = normalizeCurrencyToIso(value)
  }
  if (key === 'dateFormat' && !VALID_DATE_FORMAT_PATTERN.test(value)) {
    throw new Error('Invalid date format.')
  }
  if (key === 'defaultExportFolder') {
    if (value !== '' && (!path.isAbsolute(value) || CONTROL_CHARS.test(value))) {
      throw new Error('Invalid export folder.')
    }
  }

  const db = getDb()
  db.prepare(
    `INSERT INTO settings (key, value, updated_at)
     VALUES (?, ?, datetime('now'))
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
  ).run(key, finalValue)

  return getAllSettings()
}