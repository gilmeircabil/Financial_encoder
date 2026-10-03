interface AppLogoProps {
  size?: number
  className?: string
  withBackground?: boolean
}

export function AppLogo({ size = 24, className, withBackground = false }: AppLogoProps): React.JSX.Element {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      {withBackground ? (
        <rect x="1" y="1" width="98" height="98" rx="22" fill="var(--bg-surface)" stroke="var(--border-strong)" strokeWidth="2.5" />
      ) : null}
      {/* Outer precision geometric diamond */}
      <polygon
        points="50,15 85,50 50,85 15,50"
        fill="none"
        stroke={withBackground ? 'var(--text)' : 'currentColor'}
        strokeWidth="6"
        strokeLinejoin="round"
      />
      {/* Vertical encoder axis */}
      <line
        x1="50"
        y1="32"
        x2="50"
        y2="68"
        stroke={withBackground ? 'var(--text)' : 'currentColor'}
        strokeWidth="7.5"
      />
      {/* Horizontal balance bars */}
      <rect x="34" y="37" width="32" height="7.5" rx="1" fill={withBackground ? 'var(--text)' : 'currentColor'} />
      <rect x="28" y="46.25" width="44" height="7.5" rx="1" fill={withBackground ? 'var(--text)' : 'currentColor'} />
      <rect x="36" y="55.5" width="28" height="7.5" rx="1" fill={withBackground ? 'var(--text)' : 'currentColor'} />
      {/* Central vault core */}
      <circle
        cx="50"
        cy="50"
        r="9"
        fill={withBackground ? 'var(--bg-surface)' : 'var(--bg-surface)'}
        stroke={withBackground ? 'var(--text)' : 'currentColor'}
        strokeWidth="4.5"
      />
    </svg>
  )
}

export default AppLogo
