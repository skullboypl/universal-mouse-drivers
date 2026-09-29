/** G-Wolves Fenrir Max asset paths and DPI-stage swatch colors. */

export const FENRIR_OEM = {
  /** DefaultDPIColors from env-models (AARRGGBB -> #RRGGBB) - per-stage
   *  swatches driven by the mouse's own factory data, not page theming. */
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
} as const

export function fenrirDpiColor(index: number): string {
  return FENRIR_OEM.dpiColors[index % FENRIR_OEM.dpiColors.length] ?? '#ffffff'
}
