import { vi } from 'vitest'
import * as matchers from '@testing-library/jest-dom/matchers'
import { expect } from 'vitest'
import * as axeMatchers from 'vitest-axe/matchers'

expect.extend(matchers)
expect.extend(axeMatchers)

// Mock electron
vi.mock('electron', () => ({
  app: {
    getPath: (name: string) => {
      if (name === 'userData') return '/mock/userData'
      return `/mock/${name}`
    },
  },
  nativeTheme: {
    shouldUseDarkColors: false,
  },
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
globalThis.ResizeObserver = class ResizeObserver {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}