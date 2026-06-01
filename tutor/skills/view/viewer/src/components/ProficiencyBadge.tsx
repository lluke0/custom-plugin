export type ProficiencyLevel = 'weak' | 'fair' | 'good' | 'mastered' | 'unmeasured'

interface LevelStyle {
  bg: string
  bgDark: string
  text: string
  textDark: string
  dot: string
  dotDark: string
  label: string
}

const LEVEL_STYLES: Record<ProficiencyLevel, LevelStyle> = {
  weak: {
    bg: '#fdecec',
    bgDark: 'rgba(223, 80, 80, 0.22)',
    text: '#9b2828',
    textDark: '#ff9b9b',
    dot: '#d64141',
    dotDark: '#ff6565',
    label: 'Weak',
  },
  fair: {
    bg: '#fdf3dd',
    bgDark: 'rgba(217, 145, 30, 0.22)',
    text: '#7a4f07',
    textDark: '#ffc970',
    dot: '#d9911e',
    dotDark: '#ffae3d',
    label: 'Fair',
  },
  good: {
    bg: '#ddedd8',
    bgDark: 'rgba(68, 147, 98, 0.22)',
    text: '#2a5c30',
    textDark: '#8ecf9a',
    dot: '#4a9365',
    dotDark: '#6ec283',
    label: 'Good',
  },
  mastered: {
    bg: '#d8e5f4',
    bgDark: 'rgba(80, 155, 230, 0.22)',
    text: '#1a4f85',
    textDark: '#97c4ed',
    dot: '#2f7fc9',
    dotDark: '#5fa5e0',
    label: 'Mastered',
  },
  unmeasured: {
    bg: '#e8e7e3',
    bgDark: 'rgba(160, 160, 155, 0.2)',
    text: '#5a5956',
    textDark: '#a8a6a1',
    dot: '#8c8a85',
    dotDark: '#a0a0a0',
    label: 'Unmeasured',
  },
}

export function levelFromRate(rate: number | null): ProficiencyLevel {
  if (rate === null) return 'unmeasured'
  if (rate < 40) return 'weak'
  if (rate < 70) return 'fair'
  if (rate < 90) return 'good'
  return 'mastered'
}

interface Props {
  level: ProficiencyLevel
  rate?: number | null
  /** Prestige tier from the rebirth skill (⭐×N). 0 / undefined → no star shown. */
  prestige?: number
  size?: 'sm' | 'md' | 'lg'
}

export function ProficiencyBadge({ level, rate, prestige, size = 'md' }: Props) {
  const s = LEVEL_STYLES[level]
  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  const sizeStyle =
    size === 'sm'
      ? { fontSize: 'var(--fs-micro)', height: '20px', padding: '0 8px', gap: '5px', dotSize: 5 }
      : size === 'lg'
      ? { fontSize: 'var(--fs-ui)', height: '26px', padding: '0 11px', gap: '7px', dotSize: 7 }
      : { fontSize: 'var(--fs-small)', height: '22px', padding: '0 9px', gap: '6px', dotSize: 6 }

  return (
    <span
      className="inline-flex items-center font-medium align-middle"
      style={{
        fontSize: sizeStyle.fontSize,
        height: sizeStyle.height,
        padding: sizeStyle.padding,
        gap: sizeStyle.gap,
        background: isDark ? s.bgDark : s.bg,
        color: isDark ? s.textDark : s.text,
        borderRadius: '4px',
        lineHeight: 1,
        fontWeight: 500,
        letterSpacing: '-0.002em',
      }}
    >
      <span
        aria-hidden
        style={{
          width: sizeStyle.dotSize,
          height: sizeStyle.dotSize,
          borderRadius: '50%',
          background: isDark ? s.dotDark : s.dot,
          flexShrink: 0,
        }}
      />
      <span>{s.label}</span>
      {typeof rate === 'number' && (
        <span
          style={{
            opacity: 0.78,
            fontVariantNumeric: 'tabular-nums',
            fontSize: '0.92em',
            fontWeight: 600,
            marginLeft: '-1px',
          }}
        >
          {rate}%
        </span>
      )}
      {typeof prestige === 'number' && prestige > 0 && (
        <span
          aria-label={`prestige tier ${prestige}`}
          style={{
            marginLeft: '3px',
            color: isDark ? '#ffd86b' : '#c8870a',
            fontWeight: 600,
            fontSize: '0.92em',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          ⭐×{prestige}
        </span>
      )}
    </span>
  )
}
