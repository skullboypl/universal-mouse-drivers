/** OEM G-Wolves DriverCore skin for Fenir Max (UIFolder "Fenir"). */

export const FENRIR_OEM = {
  /** Naive UI primary used by mouse.xyz DriverCore */
  accent: '#18a058',
  accentHot: '#36ad6a',
  accentSoft: 'rgba(24, 160, 88, 0.16)',
  bg: '#18181c',
  bgElevated: '#232324',
  bgPanel: '#1c1c1f',
  border: 'rgba(255, 255, 255, 0.09)',
  fg: '#e8e8ed',
  fgMuted: '#a3a3ad',
  /** DefaultDPIColors from env-models (AARRGGBB → #RRGGBB) */
  dpiColors: [
    '#ff0000',
    '#0000ff',
    '#00ff00',
    '#ff00ff',
    '#ffff00',
    '#ffffff',
    '#ffff00',
  ] as const,
  assets: {
    device: '/devices/fenrir-max/mouse.png',
    wired: '/devices/fenrir-max/wired.png',
    wireless: '/devices/fenrir-max/wireless.png',
    receiver: '/devices/fenrir-max/receiver.png',
  },
  /** OEM detail page shows Device.png ~250px wide */
  deviceDisplayWidth: 250,
} as const

export function fenrirDpiColor(index: number): string {
  return FENRIR_OEM.dpiColors[index % FENRIR_OEM.dpiColors.length] ?? '#ffffff'
}
