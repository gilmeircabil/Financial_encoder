import { describe, expect, it, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import PageHeader from '../../src/components/ui/PageHeader'
import { Icon } from '../../src/components/ui/Icon'

afterEach(() => {
  cleanup()
})

describe('PageHeader', () => {
  it('renders title and description', () => {
    render(<PageHeader title="Test Page" description="Page description" />)
    expect(screen.getByText('Test Page')).toBeInTheDocument()
    expect(screen.getByText('Page description')).toBeInTheDocument()
  })

  it('renders without description when not provided', () => {
    render(<PageHeader title="Test Page" />)
    expect(screen.getByText('Test Page')).toBeInTheDocument()
    expect(screen.queryByText('Page description')).not.toBeInTheDocument()
  })

  it('renders action buttons when provided', () => {
    const handleClick = vi.fn()
    render(
      <PageHeader
        title="Test Page"
        description="Page description"
        actions={
          <div>
            <button onClick={handleClick} data-testid="action-btn">Action</button>
            <a href="/link" data-testid="action-link">Link</a>
          </div>
        }
      />
    )
    expect(screen.getByTestId('action-btn')).toBeInTheDocument()
    expect(screen.getByTestId('action-link')).toHaveAttribute('href', '/link')
  })

  it('has correct heading hierarchy', () => {
    render(<PageHeader title="Test Page" description="Page description" />)
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Test Page')
  })

  it('applies correct classes', () => {
    const { container } = render(<PageHeader title="Test Page" description="Page description" />)
    const header = container.querySelector('.page-header')
    expect(header).toBeInTheDocument()
  })

  it('renders action area with proper spacing', () => {
    render(
      <PageHeader
        title="Test Page"
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <button data-testid="btn1">Btn 1</button>
            <button data-testid="btn2">Btn 2</button>
          </div>
        }
      />
    )
    expect(screen.getByTestId('btn1')).toBeInTheDocument()
    expect(screen.getByTestId('btn2')).toBeInTheDocument()
  })
})