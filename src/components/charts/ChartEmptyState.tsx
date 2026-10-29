interface ChartEmptyStateProps {
  /** Height of the empty state container */
  height?: number | string
  /** Main title text */
  title: string
  /** Optional hint text */
  hint?: string
  /** Optional action button */
  action?: React.ReactNode
}

function ChartEmptyState({ height = '100%', title, hint, action }: ChartEmptyStateProps): React.JSX.Element {
  return (
    <div
      className="chart-empty"
      style={{
        height: typeof height === 'number' ? `${height}px` : height,
        minHeight: 220,
        flex: '1 1 auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <p className="chart-empty__title">{title}</p>
      {hint && <p className="chart-empty__hint">{hint}</p>}
      {action && <div className="chart-empty__action">{action}</div>}
    </div>
  )
}

export default ChartEmptyState