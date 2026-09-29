import type { Locale } from '@/i18n/locale'
import type { OpenMouseCatalogEntry } from './catalog.generated'

type ControlKey = keyof OpenMouseCatalogEntry['capabilities']['controls']

const CONTROL_LABELS: Record<ControlKey, string> = {
  dpiRead: 'DPI read',
  dpiWrite: 'DPI',
  polling: 'Polling rate',
  lod: 'LOD',
  motionSync: 'Motion Sync',
  angleSnapping: 'Angle Snapping',
  rippleControl: 'Ripple Control',
  debounce: 'Debounce',
  profiles: 'Profiles',
  buttons: 'Button mapping',
  rgb: 'RGB',
  battery: 'Battery',
}

const COPY: Record<Locale, {
  title: string
  verified: string
  runtime: string
  unknown: string
  driver: string
  dpiRange: string
  pollingRates: string
  availableCount: (count: number) => string
}> = {
  pl: { title: 'Możliwości sterownika', verified: 'Dostępne', runtime: 'Po połączeniu', unknown: 'Nieustalone', driver: 'Sterownik', dpiRange: 'Zakres DPI', pollingRates: 'Częstotliwości', availableCount: (n) => `${n} funkcji` },
  en: { title: 'Driver capabilities', verified: 'Available', runtime: 'After connecting', unknown: 'Unknown', driver: 'Driver', dpiRange: 'DPI range', pollingRates: 'Polling rates', availableCount: (n) => `${n} controls` },
  de: { title: 'Treiberfunktionen', verified: 'Verfügbar', runtime: 'Nach Verbindung', unknown: 'Unbekannt', driver: 'Treiber', dpiRange: 'DPI-Bereich', pollingRates: 'Abfrageraten', availableCount: (n) => `${n} Funktionen` },
  fr: { title: 'Fonctions du pilote', verified: 'Disponible', runtime: 'Après connexion', unknown: 'Indéterminé', driver: 'Pilote', dpiRange: 'Plage DPI', pollingRates: 'Fréquences', availableCount: (n) => `${n} fonctions` },
  es: { title: 'Funciones del controlador', verified: 'Disponible', runtime: 'Tras conectar', unknown: 'Sin determinar', driver: 'Controlador', dpiRange: 'Rango DPI', pollingRates: 'Frecuencias', availableCount: (n) => `${n} funciones` },
  pt: { title: 'Recursos do controlador', verified: 'Disponível', runtime: 'Após ligar', unknown: 'Indeterminado', driver: 'Controlador', dpiRange: 'Intervalo DPI', pollingRates: 'Frequências', availableCount: (n) => `${n} recursos` },
  it: { title: 'Funzioni del driver', verified: 'Disponibile', runtime: 'Dopo il collegamento', unknown: 'Non determinato', driver: 'Driver', dpiRange: 'Intervallo DPI', pollingRates: 'Frequenze', availableCount: (n) => `${n} funzioni` },
  zh: { title: '驱动功能', verified: '可用', runtime: '连接后确认', unknown: '未知', driver: '驱动', dpiRange: 'DPI 范围', pollingRates: '回报率', availableCount: (n) => `${n} 项功能` },
  ja: { title: 'ドライバー機能', verified: '利用可能', runtime: '接続後に確認', unknown: '未確認', driver: 'ドライバー', dpiRange: 'DPI 範囲', pollingRates: 'ポーリングレート', availableCount: (n) => `${n} 機能` },
  ko: { title: '드라이버 기능', verified: '사용 가능', runtime: '연결 후 확인', unknown: '미확인', driver: '드라이버', dpiRange: 'DPI 범위', pollingRates: '폴링레이트', availableCount: (n) => `${n}개 기능` },
  ru: { title: 'Возможности драйвера', verified: 'Доступно', runtime: 'После подключения', unknown: 'Не определено', driver: 'Драйвер', dpiRange: 'Диапазон DPI', pollingRates: 'Частоты опроса', availableCount: (n) => `${n} функций` },
}

export function getOpenMouseCapabilityCopy(locale: Locale) {
  return COPY[locale]
}

export function visibleOpenMouseControls(entry: OpenMouseCatalogEntry) {
  const controls = entry.capabilities.controls
  const keys = (Object.keys(controls) as ControlKey[]).filter(
    (key) => key !== 'dpiRead' && controls[key] !== 'unknown',
  )
  return keys.map((key) => ({
    key,
    label: CONTROL_LABELS[key],
    state: controls[key],
  }))
}
