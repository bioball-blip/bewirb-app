import { Link } from 'react-router-dom'

type LogoProps = {
  withTagline?: boolean
  size?: 'sm' | 'lg'
  align?: 'center' | 'left'
  variant?: 'dark' | 'light'
  linkTo?: string
}

export function Logo({
  withTagline = false,
  size = 'lg',
  align = 'center',
  variant = 'dark',
  linkTo,
}: LogoProps) {
  const iconHeight = size === 'lg' ? 28 : 20
  const iconWidth = (iconHeight * 40) / 24
  const textSize = size === 'lg' ? 'text-2xl' : 'text-lg'
  const markColor = variant === 'light' ? 'text-crewwerk-cream' : 'text-crewwerk'
  const taglineColor =
    variant === 'light' ? 'text-crewwerk-cream/70' : 'text-gray-500'

  const content = (
    <div
      className={
        'flex flex-col gap-1 ' +
        (align === 'center' ? 'items-center' : 'items-start')
      }
    >
      <div className="flex items-center gap-2">
        <svg
          width={iconWidth}
          height={iconHeight}
          viewBox="0 0 40 24"
          fill="none"
          className={`${markColor} shrink-0`}
        >
          <circle cx="12" cy="4" r="2.5" fill="currentColor" />
          <circle cx="24" cy="4" r="2.5" fill="currentColor" />
          <circle
            cx="13"
            cy="16"
            r="7"
            fill="none"
            stroke="currentColor"
            strokeWidth="4.5"
          />
          <circle
            cx="23"
            cy="16"
            r="7"
            fill="none"
            stroke="currentColor"
            strokeWidth="4.5"
          />
        </svg>
        <span className={`${textSize} font-bold ${markColor}`}>Crewwerk</span>
      </div>
      {withTagline && <p className={`text-xs ${taglineColor}`}>Gemeinsam mehr erreichen.</p>}
    </div>
  )

  if (linkTo) {
    return (
      <Link to={linkTo} className="hover:opacity-80 transition-opacity">
        {content}
      </Link>
    )
  }

  return content
}
