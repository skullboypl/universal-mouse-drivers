import { normalizeLocale, type Locale } from './locale'

export type { Locale } from './locale'
export { LOCALES, LOCALE_LABELS } from './locale'

export type MessageKey =
  | 'nav.buttons'
  | 'nav.sensor'
  | 'nav.macro'
  | 'nav.soon'
  | 'nav.macroSoon'
  | 'nav.settings'
  | 'nav.disconnect'
  | 'connect.lede'
  | 'connect.demo'
  | 'connect.webhid'
  | 'connect.hint'
  | 'connect.noWebHid'
  | 'connect.savedTitle'
  | 'connect.savedSub'
  | 'connect.savedEmpty'
  | 'connect.supportedTitle'
  | 'connect.supportedSub'
  | 'connect.statusLive'
  | 'connect.statusWip'
  | 'connect.statusPlanned'
  | 'connect.contactTitle'
  | 'connect.contactBody'
  | 'connect.contactBarter'
  | 'connect.trayDownload'
  | 'buttons.title'
  | 'buttons.sub'
  | 'buttons.profile'
  | 'buttons.profileN'
  | 'buttons.restore'
  | 'buttons.export'
  | 'buttons.import'
  | 'buttons.keys'
  | 'buttons.debounce'
  | 'buttons.debounceEnable'
  | 'buttons.debounceTip'
  | 'buttons.mapHint'
  | 'buttons.off'
  | 'buttons.action.left'
  | 'buttons.action.right'
  | 'buttons.action.middle'
  | 'buttons.action.forward'
  | 'buttons.action.back'
  | 'buttons.action.dpi_cycle'
  | 'buttons.action.disabled'
  | 'buttons.action.macro'
  | 'sensor.title'
  | 'sensor.sub'
  | 'sensor.dpiStages'
  | 'sensor.stageCount'
  | 'sensor.stageCountTip'
  | 'sensor.activeStage'
  | 'sensor.activeStageTip'
  | 'sensor.stage'
  | 'sensor.dpiSliderTip'
  | 'sensor.reportRate'
  | 'sensor.reportRateTip'
  | 'sensor.sensorSetting'
  | 'sensor.mode'
  | 'sensor.modeTip'
  | 'sensor.modeLp'
  | 'sensor.modeHp'
  | 'sensor.modeCorded'
  | 'sensor.modeCordedLocked'
  | 'sensor.lod'
  | 'sensor.lodTip'
  | 'sensor.peak'
  | 'sensor.peakTip'
  | 'sensor.peakTimeout'
  | 'sensor.peakTimeoutTip'
  | 'sensor.sec30'
  | 'sensor.min'
  | 'sensor.ripple'
  | 'sensor.rippleTip'
  | 'sensor.angle'
  | 'sensor.angleTip'
  | 'sensor.motion'
  | 'sensor.motionTip'
  | 'macro.title'
  | 'macro.comingSoon'
  | 'macro.comingSoonBody'
  | 'macro.sub'
  | 'macro.list'
  | 'macro.keys'
  | 'macro.new'
  | 'macro.delete'
  | 'macro.start'
  | 'macro.stop'
  | 'macro.save'
  | 'macro.empty'
  | 'macro.selectOrCreate'
  | 'macro.deleteLast'
  | 'macro.recordingHint'
  | 'macro.recordingIdle'
  | 'macro.autoDelay'
  | 'macro.defaultDelay'
  | 'macro.playUntilReleased'
  | 'macro.playUntilPressed'
  | 'macro.playUntilThisKey'
  | 'macro.playTimes'
  | 'macro.insertAction'
  | 'macro.select'
  | 'macro.delay'
  | 'macro.keyA'
  | 'macro.space'
  | 'macro.ctrl'
  | 'macro.namePrefix'
  | 'macro.delayMs'
  | 'settings.title'
  | 'settings.language'
  | 'settings.langPl'
  | 'settings.langEn'
  | 'settings.driveVer'
  | 'settings.deviceInfo'
  | 'settings.receiverFw'
  | 'settings.mouseFw'
  | 'settings.refreshFw'
  | 'settings.fwHint'
  | 'settings.pairing'
  | 'settings.pair'
  | 'settings.pairAlert'
  | 'settings.sleep'
  | 'settings.sleepHint'
  | 'settings.sleepMin'
  | 'settings.other'
  | 'settings.boot'
  | 'settings.winMouse'
  | 'settings.winMouseAlert'
  | 'settings.advanced'
  | 'settings.longDistance'
  | 'settings.longDistanceTip'
  | 'status.ready'
  | 'status.saving'
  | 'status.saved'
  | 'status.saveError'
  | 'status.mock'
  | 'status.webhid'
  | 'status.connectingDemo'
  | 'status.selectMouse'
  | 'status.syncing'
  | 'status.disconnected'
  | 'status.applyFailed'
  | 'status.webhidFailed'
  | 'status.battUnknown'
  | 'footer.language'
  | 'write.queued'
  | 'write.writing'
  | 'write.ok'
  | 'write.error'

type Dict = Record<MessageKey, string>

const en: Dict = {
  'nav.buttons': 'Buttons',
  'nav.sensor': 'Sensor',
  'nav.macro': 'Macro',
  'nav.soon': 'Soon',
  'nav.macroSoon': 'Macro editor coming soon',
  'nav.settings': 'Settings',
  'nav.disconnect': 'Disconnect',
  'connect.lede':
    'WebHID drivers in the browser - connect a supported mouse, keep drafts locally, expand the list with the community.',
  'connect.demo': 'Try demo profile',
  'connect.webhid': 'Connect via WebHID',
  'connect.hint':
    'Only whitelisted VID:PID pairs are requested. Prefer the vendor/dongle interface (Output reports) - not the plain “HID-compliant mouse”.',
  'connect.noWebHid': 'WebHID needs Chrome or Edge on localhost / HTTPS.',
  'connect.savedTitle': 'Saved devices',
  'connect.savedSub':
    'Mice you already authorized in this browser. Click to reconnect.',
  'connect.savedEmpty': 'No saved HID devices yet - connect once to pin one here.',
  'connect.supportedTitle': 'Supported devices',
  'connect.supportedSub':
    'Live means full write path. WIP means UI + protocol RE. Planned means next in queue.',
  'connect.statusLive': 'Live',
  'connect.statusWip': 'WIP',
  'connect.statusPlanned': 'Planned',
  'connect.contactTitle': 'Want your mouse here?',
  'connect.contactBody':
    'Send the model, Windows driver package link, and VID:PID. We will review adding it to UMD.',
  'connect.contactBarter':
    'You can also ship your mouse for testing as a barter - DM on TikTok',
  'connect.trayDownload': 'Download UMD Battery Tray (Windows .exe)',
  'buttons.title': 'Button mapping',
  'buttons.sub':
    'Profiles, binds, debounce - changes auto-save after a short delay.',
  'buttons.profile': 'Profile',
  'buttons.profileN': 'Profile {n}',
  'buttons.restore': 'Restore',
  'buttons.export': 'Export',
  'buttons.import': 'Import',
  'buttons.keys': 'Keys',
  'buttons.debounce': 'Debounce time',
  'buttons.debounceEnable': 'Enable debounce',
  'buttons.debounceTip':
    'Off writes 0 ms to the mouse. Lower values can cause double-clicks - OEM warns below 8 ms.',
  'buttons.mapHint':
    'Numbers match physical buttons (OEM layout). Click a number or change the bind below.',
  'buttons.off': 'off',
  'buttons.action.left': 'Left button',
  'buttons.action.right': 'Right button',
  'buttons.action.middle': 'Middle button',
  'buttons.action.forward': 'Forward',
  'buttons.action.back': 'Back',
  'buttons.action.dpi_cycle': 'DPI cycle',
  'buttons.action.disabled': 'Disabled',
  'buttons.action.macro': 'Macro',
  'sensor.title': 'Sensor',
  'sensor.sub':
    'DPI and flags update in the UI instantly; the mouse is written after a short debounce.',
  'sensor.dpiStages': 'DPI stages',
  'sensor.stageCount': 'Number of stages',
  'sensor.stageCountTip':
    'How many DPI levels you can cycle with the DPI button (1–7).',
  'sensor.activeStage': 'Edit stage',
  'sensor.activeStageTip':
    'Which stage you are editing now - also becomes the active stage on the mouse.',
  'sensor.stage': 'Stage',
  'sensor.dpiSliderTip':
    'Drag freely - the value updates live. The mouse is written only after you pause (debounce).',
  'sensor.reportRate': 'Report rate',
  'sensor.reportRateTip':
    'How often the mouse reports position to the PC (Hz). Higher = lower latency, more power use.',
  'sensor.sensorSetting': 'Sensor setting',
  'sensor.mode': 'Mode select',
  'sensor.modeTip':
    'LP: low power. HP: high performance. Corded: max mode when plugged in or at 2 kHz+ polling.',
  'sensor.modeLp': 'LP - low power',
  'sensor.modeHp': 'HP - high performance',
  'sensor.modeCorded': 'Corded',
  'sensor.modeCordedLocked': 'needs 2 kHz+ or USB',
  'sensor.lod': 'LOD',
  'sensor.lodTip':
    'Lift-off distance - how high you must lift the mouse before tracking stops.',
  'sensor.peak': 'Peak Performance',
  'sensor.peakTip':
    'Keeps the sensor LED bright and tracking at maximum performance for a limited time.',
  'sensor.peakTimeout': 'Peak duration',
  'sensor.peakTimeoutTip':
    'How long Peak Performance stays on after you enable it.',
  'sensor.sec30': '30 sec',
  'sensor.min': 'min',
  'sensor.ripple': 'Ripple control',
  'sensor.rippleTip':
    'Smooths high-speed “ripple” jitter on some surfaces. May feel slightly less raw.',
  'sensor.angle': 'Angle snapping',
  'sensor.angleTip':
    'Snaps near-horizontal / near-vertical movement to a straight line. Off is recommended for FPS.',
  'sensor.motion': 'Motion sync',
  'sensor.motionTip':
    'Aligns sensor samples with the USB report rate for more consistent feel.',
  'macro.title': 'Macro',
  'macro.comingSoon': 'Coming soon',
  'macro.comingSoonBody':
    'Macro recording and flash write are not enabled yet. This tab will open when the HID path is ready.',
  'macro.sub': 'Record and edit macros - assign them from Buttons.',
  'macro.list': 'Macros list',
  'macro.keys': 'Keys list',
  'macro.new': 'New macro',
  'macro.delete': 'Delete',
  'macro.start': 'Start recording',
  'macro.stop': 'Stop recording',
  'macro.save': 'Save',
  'macro.empty': 'No macros yet.',
  'macro.selectOrCreate': 'Select or create a macro.',
  'macro.deleteLast': 'Delete last',
  'macro.recordingHint': 'Focus here and press keys to record.',
  'macro.recordingIdle': 'Enable recording, then focus this panel.',
  'macro.autoDelay': 'Automatic insertion delay',
  'macro.defaultDelay': 'Default time delay',
  'macro.playUntilReleased': 'Cycle until key released',
  'macro.playUntilPressed': 'Cycle until key pressed',
  'macro.playUntilThisKey': 'Cycle until this key pressed',
  'macro.playTimes': 'Times of cycles',
  'macro.insertAction': 'Insert action',
  'macro.select': 'Select…',
  'macro.delay': 'Delay',
  'macro.keyA': 'Key A',
  'macro.space': 'Space',
  'macro.ctrl': 'Ctrl',
  'macro.namePrefix': 'Macro {n}',
  'macro.delayMs': 'Delay {n}ms',
  'settings.title': 'Settings',
  'settings.language': 'Language',
  'settings.langPl': 'Polski',
  'settings.langEn': 'English',
  'settings.driveVer': 'Driver version: {v}',
  'settings.deviceInfo': 'Device information',
  'settings.receiverFw': 'Receiver firmware:',
  'settings.mouseFw': 'Mouse firmware:',
  'settings.refreshFw': 'Refresh firmware',
  'settings.fwHint':
    'Move the mouse (wake it) before refresh. Close the OEM Redragon app if versions stay blank.',
  'settings.pairing': 'Pairing tool',
  'settings.pair': 'Pair (Space)',
  'settings.pairAlert':
    'Pairing requires a confirmed HID sequence or local bridge. Not enabled until reverse engineering is done.',
  'settings.sleep': 'Sleep mode',
  'settings.sleepHint': 'Time until mouse sleep after not moving',
  'settings.sleepMin': '{n} min',
  'settings.other': 'Other',
  'settings.boot': 'Run on system boot (requires bridge helper)',
  'settings.winMouse': 'Windows Mouse Properties',
  'settings.winMouseAlert':
    'Windows Mouse Properties is opened by the optional local bridge (main.cpl).',
  'settings.advanced': 'Advanced setting',
  'settings.longDistance': 'Long distance',
  'settings.longDistanceTip':
    'Farther range and stronger anti-interference, higher current, shorter battery life.',
  'status.ready': 'UMD ready',
  'status.saving': 'Saving…',
  'status.saved': 'Saved',
  'status.saveError': 'Save error',
  'status.mock': 'Demo profile online - local draft + auto-save',
  'status.webhid':
    'WebHID connected - local draft auto-saves; device writes use RE protocol',
  'status.connectingDemo': 'Connecting demo…',
  'status.selectMouse': 'Select a supported mouse…',
  'status.syncing': 'syncing…',
  'status.disconnected': 'Device disconnected',
  'status.applyFailed': 'Apply failed',
  'status.webhidFailed': 'WebHID connect failed',
  'status.battUnknown': 'batt -',
  'footer.language': 'Language',
  'write.queued': 'Write queued…',
  'write.writing': 'Writing to mouse…',
  'write.ok': 'Written to mouse',
  'write.error': 'Write failed',
}

const pl: Dict = {
  'nav.buttons': 'Przyciski',
  'nav.sensor': 'Sensor',
  'nav.macro': 'Makro',
  'nav.soon': 'Wkrótce',
  'nav.macroSoon': 'Edytor makr wkrótce',
  'nav.settings': 'Ustawienia',
  'nav.disconnect': 'Rozłącz',
  'connect.lede':
    'Sterowniki WebHID w przeglądarce - podłącz wspieraną mysz, trzymaj draft lokalnie, rozwijaj listę ze społecznością.',
  'connect.demo': 'Profil demo',
  'connect.webhid': 'Połącz przez WebHID',
  'connect.hint':
    'Tylko dozwolone pary VID:PID. Wybierz interfejs vendor/dongle (z Output reports) - nie zwykłą „HID-compliant mouse”.',
  'connect.noWebHid':
    'WebHID wymaga Chrome lub Edge na localhost / HTTPS.',
  'connect.savedTitle': 'Zapisane urządzenia',
  'connect.savedSub':
    'Myszy już autoryzowane w tej przeglądarce. Kliknij, żeby połączyć ponownie.',
  'connect.savedEmpty':
    'Brak zapisanych HID - połącz raz, żeby przypiąć urządzenie tutaj.',
  'connect.supportedTitle': 'Wspierane urządzenia',
  'connect.supportedSub':
    'Live = pełny zapis. WIP = UI + reverse engineering protokołu. Planned = w kolejce.',
  'connect.statusLive': 'Live',
  'connect.statusWip': 'WIP',
  'connect.statusPlanned': 'Planowane',
  'connect.contactTitle': 'Chcesz dodać swoją mysz?',
  'connect.contactBody':
    'Napisz model, link do sterownika Windows i VID:PID. Sprawdzimy dodanie do UMD.',
  'connect.contactBarter':
    'Możesz też wysłać myszkę na testy w ramach barteru - napisz na TikToku',
  'connect.trayDownload': 'Pobierz UMD Battery Tray (Windows .exe)',
  'buttons.title': 'Mapowanie przycisków',
  'buttons.sub':
    'Profile, przypisania, debounce - zmiany zapisują się automatycznie po chwili.',
  'buttons.profile': 'Profil',
  'buttons.profileN': 'Profil {n}',
  'buttons.restore': 'Przywróć',
  'buttons.export': 'Eksport',
  'buttons.import': 'Import',
  'buttons.keys': 'Klawisze',
  'buttons.debounce': 'Czas debounce',
  'buttons.debounceEnable': 'Włącz debounce',
  'buttons.debounceTip':
    'Wyłączenie zapisuje 0 ms na mysz. Za nisko = double-click - OEM ostrzega poniżej 8 ms.',
  'buttons.mapHint':
    'Cyfry = fizyczne przyciski (układ OEM). Kliknij numer albo zmień przypisanie poniżej.',
  'buttons.off': 'wył.',
  'buttons.action.left': 'Lewy przycisk',
  'buttons.action.right': 'Prawy przycisk',
  'buttons.action.middle': 'Środkowy przycisk',
  'buttons.action.forward': 'Do przodu',
  'buttons.action.back': 'Do tyłu',
  'buttons.action.dpi_cycle': 'Cykl DPI',
  'buttons.action.disabled': 'Wyłączony',
  'buttons.action.macro': 'Makro',
  'sensor.title': 'Sensor',
  'sensor.sub':
    'DPI i flagi od razu w UI; zapis na mysz dopiero po krótkim debounce.',
  'sensor.dpiStages': 'Poziomy DPI',
  'sensor.stageCount': 'Liczba poziomów',
  'sensor.stageCountTip':
    'Ile poziomów DPI możesz przełączać przyciskiem DPI (1–7).',
  'sensor.activeStage': 'Edytowany poziom',
  'sensor.activeStageTip':
    'Który poziom teraz edytujesz - staje się też aktywnym poziomem na myszy.',
  'sensor.stage': 'Poziom',
  'sensor.dpiSliderTip':
    'Przesuwaj swobodnie - wartość w UI jest natychmiastowa. Zapis na mysz dopiero gdy przestaniecie ruszać suwakiem.',
  'sensor.reportRate': 'Częstotliwość raportowania',
  'sensor.reportRateTip':
    'Jak często mysz wysyła pozycję do PC (Hz). Wyżej = niższa latencja, większy pobór energii.',
  'sensor.sensorSetting': 'Ustawienia sensora',
  'sensor.mode': 'Tryb sensora',
  'sensor.modeTip':
    'LP: niski pobór. HP: wysoka wydajność. Corded: tryb przewodowy / max - dostępny przy USB albo pollingu ≥ 2 kHz.',
  'sensor.modeLp': 'LP - niski pobór',
  'sensor.modeHp': 'HP - wysoka wydajność',
  'sensor.modeCorded': 'Przewodowy',
  'sensor.modeCordedLocked': 'wymaga 2 kHz+ lub USB',
  'sensor.lod': 'LOD',
  'sensor.lodTip':
    'Lift-off distance - od jakiej wysokości nad podkładką sensor przestaje śledzić ruch.',
  'sensor.peak': 'Peak Performance',
  'sensor.peakTip':
    'Sensor świeci mocniej i działa w trybie maksymalnej wydajności przez ograniczony czas.',
  'sensor.peakTimeout': 'Czas Peak',
  'sensor.peakTimeoutTip':
    'Jak długo Peak Performance zostaje włączony po aktywacji.',
  'sensor.sec30': '30 s',
  'sensor.min': 'min',
  'sensor.ripple': 'Kontrola ripple',
  'sensor.rippleTip':
    'Wygładza „falowanie” przy bardzo szybkich ruchach. Może lekko zmniejszyć surowość trackingu.',
  'sensor.angle': 'Angle snapping',
  'sensor.angleTip':
    'Przyciąga prawie poziome / pionowe ruchy do prostej linii. Do FPS zwykle lepiej wyłączyć.',
  'sensor.motion': 'Motion sync',
  'sensor.motionTip':
    'Synchronizuje próbki sensora z częstotliwością USB - bardziej równe odczucie.',
  'macro.title': 'Makro',
  'macro.sub': 'Nagrywaj i edytuj makro - przypisz je w Przyciskach.',
  'macro.list': 'Lista makro',
  'macro.keys': 'Lista klawiszy',
  'macro.new': 'Nowe makro',
  'macro.delete': 'Usuń',
  'macro.start': 'Start nagrywania',
  'macro.stop': 'Stop nagrywania',
  'macro.save': 'Zapisz',
  'macro.empty': 'Brak makro.',
  'macro.selectOrCreate': 'Wybierz lub utwórz makro.',
  'macro.deleteLast': 'Usuń ostatnie',
  'macro.recordingHint': 'Kliknij tutaj i naciskaj klawisze, żeby nagrywać.',
  'macro.recordingIdle': 'Włącz nagrywanie, potem kliknij ten panel.',
  'macro.autoDelay': 'Automatyczne wstawianie opóźnienia',
  'macro.defaultDelay': 'Domyślne opóźnienie',
  'macro.playUntilReleased': 'Pętla do zwolnienia klawisza',
  'macro.playUntilPressed': 'Pętla do naciśnięcia klawisza',
  'macro.playUntilThisKey': 'Pętla do naciśnięcia tego klawisza',
  'macro.playTimes': 'Liczba cykli',
  'macro.insertAction': 'Wstaw akcję',
  'macro.select': 'Wybierz…',
  'macro.delay': 'Opóźnienie',
  'macro.keyA': 'Klawisz A',
  'macro.space': 'Spacja',
  'macro.ctrl': 'Ctrl',
  'macro.namePrefix': 'Makro {n}',
  'macro.delayMs': 'Opóźnienie {n} ms',
  'settings.title': 'Ustawienia',
  'settings.language': 'Język',
  'settings.langPl': 'Polski',
  'settings.langEn': 'English',
  'settings.driveVer': 'Wersja sterownika: {v}',
  'settings.deviceInfo': 'Informacje o urządzeniu',
  'settings.receiverFw': 'Firmware receivera:',
  'settings.mouseFw': 'Firmware myszy:',
  'settings.refreshFw': 'Odśwież firmware',
  'settings.fwHint':
    'Przed odświeżeniem rusz myszą (wybudź). Zamknij oficjalny driver Redragon, jeśli wersje zostają puste.',
  'settings.pairing': 'Narzędzie parowania',
  'settings.pair': 'Paruj (Spacja)',
  'settings.pairAlert':
    'Parowanie wymaga potwierdzonej sekwencji HID albo lokalnego bridge. Niedostępne, dopóki RE nie jest gotowe.',
  'settings.sleep': 'Tryb uśpienia',
  'settings.sleepHint': 'Czas do uśpienia po braku ruchu',
  'settings.sleepMin': '{n} min',
  'settings.other': 'Inne',
  'settings.boot': 'Uruchom przy starcie systemu (wymaga bridge)',
  'settings.winMouse': 'Właściwości myszy Windows',
  'settings.winMouseAlert':
    'Właściwości myszy Windows otwiera opcjonalny lokalny bridge (main.cpl).',
  'settings.advanced': 'Zaawansowane',
  'settings.longDistance': 'Duży zasięg',
  'settings.longDistanceTip':
    'Większy zasięg i odporność na zakłócenia, wyższy prąd, krótszy czas pracy.',
  'status.ready': 'UMD gotowe',
  'status.saving': 'Zapisywanie…',
  'status.saved': 'Zapisano',
  'status.saveError': 'Błąd zapisu',
  'status.mock': 'Profil demo online - draft lokalny + auto-zapis',
  'status.webhid':
    'WebHID połączony - auto-zapis lokalny; zapis do myszy przez protokół RE',
  'status.connectingDemo': 'Łączenie z demo…',
  'status.selectMouse': 'Wybierz wspieraną mysz…',
  'status.syncing': 'synchronizacja…',
  'status.disconnected': 'Urządzenie rozłączone',
  'status.applyFailed': 'Nie udało się zastosować',
  'status.webhidFailed': 'Połączenie WebHID nieudane',
  'status.battUnknown': 'bat. -',
  'footer.language': 'Język',
  'write.queued': 'Zapis za chwilę…',
  'write.writing': 'Zapisuję na mysz…',
  'write.ok': 'Zapisano na myszy',
  'write.error': 'Zapis nieudany',
}

const dictionaries: Record<Locale, Dict> = { pl, en }

export type MessageVars = Record<string, string | number>

export function t(
  locale: Locale | string,
  key: MessageKey,
  vars?: MessageVars,
): string {
  const loc = normalizeLocale(locale) ?? 'pl'
  let text = dictionaries[loc][key] ?? en[key] ?? key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replaceAll(`{${k}}`, String(v))
    }
  }
  return text
}
