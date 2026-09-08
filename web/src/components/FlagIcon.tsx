import type { Locale } from '@/i18n/locale'

const FLAG_VIEW = '0 0 24 16'

/** Compact SVG flags for the language menu (not political statements - UI affordance). */
export function FlagIcon({
  locale,
  className,
}: {
  locale: Locale
  className?: string
}) {
  switch (locale) {
    case 'pl':
      return (
        <svg className={className} viewBox={FLAG_VIEW} aria-hidden>
          <rect width="24" height="8" fill="#fff" />
          <rect y="8" width="24" height="8" fill="#dc143c" />
        </svg>
      )
    case 'en':
      return (
        <svg className={className} viewBox={FLAG_VIEW} aria-hidden>
          <rect width="24" height="16" fill="#012169" />
          <path d="M0 0 L24 16 M24 0 L0 16" stroke="#fff" strokeWidth="3" />
          <path d="M0 0 L24 16 M24 0 L0 16" stroke="#c8102e" strokeWidth="1.5" />
          <path d="M12 0 V16 M0 8 H24" stroke="#fff" strokeWidth="5" />
          <path d="M12 0 V16 M0 8 H24" stroke="#c8102e" strokeWidth="2.5" />
        </svg>
      )
    case 'de':
      return (
        <svg className={className} viewBox={FLAG_VIEW} aria-hidden>
          <rect width="24" height="5.34" fill="#000" />
          <rect y="5.34" width="24" height="5.33" fill="#dd0000" />
          <rect y="10.67" width="24" height="5.33" fill="#ffce00" />
        </svg>
      )
    case 'fr':
      return (
        <svg className={className} viewBox={FLAG_VIEW} aria-hidden>
          <rect width="8" height="16" fill="#002395" />
          <rect x="8" width="8" height="16" fill="#fff" />
          <rect x="16" width="8" height="16" fill="#ed2939" />
        </svg>
      )
    case 'es':
      return (
        <svg className={className} viewBox={FLAG_VIEW} aria-hidden>
          <rect width="24" height="16" fill="#c60b1e" />
          <rect y="4" width="24" height="8" fill="#ffc400" />
        </svg>
      )
    case 'pt':
      return (
        <svg className={className} viewBox={FLAG_VIEW} aria-hidden>
          <rect width="10" height="16" fill="#006600" />
          <rect x="10" width="14" height="16" fill="#ff0000" />
          <circle cx="10" cy="8" r="3.2" fill="#ffcc00" />
          <circle cx="10" cy="8" r="2" fill="#002395" />
        </svg>
      )
    case 'it':
      return (
        <svg className={className} viewBox={FLAG_VIEW} aria-hidden>
          <rect width="8" height="16" fill="#009246" />
          <rect x="8" width="8" height="16" fill="#fff" />
          <rect x="16" width="8" height="16" fill="#ce2b37" />
        </svg>
      )
    case 'zh':
      return (
        <svg className={className} viewBox={FLAG_VIEW} aria-hidden>
          <rect width="24" height="16" fill="#de2910" />
          <polygon
            fill="#ffde00"
            points="5,3.2 5.7,5.4 8,5.4 6.15,6.7 6.85,8.9 5,7.6 3.15,8.9 3.85,6.7 2,5.4 4.3,5.4"
          />
        </svg>
      )
    case 'ja':
      return (
        <svg className={className} viewBox={FLAG_VIEW} aria-hidden>
          <rect width="24" height="16" fill="#fff" />
          <circle cx="12" cy="8" r="4.2" fill="#bc002d" />
        </svg>
      )
    case 'ko':
      return (
        <svg className={className} viewBox={FLAG_VIEW} aria-hidden>
          <rect width="24" height="16" fill="#fff" />
          <circle cx="12" cy="8" r="3.6" fill="#cd2e3a" />
          <path d="M12 8a3.6 3.6 0 0 1 0 0.01A3.6 3.6 0 0 1 8.4 8 3.6 3.6 0 0 0 12 11.6Z" fill="#0047a0" />
        </svg>
      )
    case 'ru':
      return (
        <svg className={className} viewBox={FLAG_VIEW} aria-hidden>
          <rect width="24" height="5.34" fill="#fff" />
          <rect y="5.34" width="24" height="5.33" fill="#0039a6" />
          <rect y="10.67" width="24" height="5.33" fill="#d52b1e" />
        </svg>
      )
    default:
      return (
        <svg className={className} viewBox={FLAG_VIEW} aria-hidden>
          <rect width="24" height="16" fill="#5c6675" />
        </svg>
      )
  }
}
