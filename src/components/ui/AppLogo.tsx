import logoUrl from '../../assets/logo.png'

interface AppLogoProps {
  size?: number
  className?: string
  withBackground?: boolean
}

export function AppLogo({ size = 24, className, withBackground = false }: AppLogoProps): React.JSX.Element {
  const radius = withBackground
    ? size >= 64
      ? '20px'
      : size >= 48
        ? '14px'
        : '10px'
    : size >= 30
      ? '8px'
      : '6px'

  return (
    <img
      src={logoUrl}
      alt="Acorn Logo"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        borderRadius: radius,
        objectFit: 'cover',
      }}
    />
  )
}

export default AppLogo
