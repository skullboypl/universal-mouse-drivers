import { normalizeLocale, type Locale } from './locale'

export type { Locale } from './locale'
export { LOCALES, LOCALE_LABELS } from './locale'

export type MessageKey =
  | 'nav.buttons'
  | 'nav.sensor'
  | 'nav.macro'
  | 'nav.mouse'
  | 'nav.settings'
  | 'nav.disconnect'
  | 'nav.soon'
  | 'nav.macroSoon'
  | 'nav.mice'
  | 'nav.contact'
  | 'nav.why'
  | 'nav.faq'
  | 'nav.tray'
  | 'nav.siteNav'
  | 'nav.deviceNav'
  | 'connect.faqTitle'
  | 'connect.learnMore'
  | 'connect.trayEyebrow'
  | 'connect.trayTitle'
  | 'connect.trayBody'
  | 'connect.trayFeat1'
  | 'connect.trayFeat2'
  | 'connect.trayFeat3'
  | 'connect.trayFeat4'
  | 'connect.trayFeat5'
  | 'connect.trayLang'
  | 'connect.trayDownload'
  | 'connect.trayMore'
  | 'connect.trayNote'
  | 'connect.lede'
  | 'connect.demo'
  | 'connect.webhid'
  | 'connect.open'
  | 'connect.soon'
  | 'connect.pcOnly'
  | 'connect.pcOnlyTip'
  | 'connect.noWebHid'
  | 'connect.step1'
  | 'connect.step2'
  | 'connect.step3'
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
  | 'connect.contactEmailLabel'
  | 'connect.contactEmailCta'
  | 'connect.contactTiktokLabel'
  | 'connect.contactTiktokCta'
  | 'connect.contactNeedTitle'
  | 'connect.contactNeed1'
  | 'connect.contactNeed2'
  | 'connect.contactNeed3'
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
  | 'buttons.action.fire'
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
  | 'settings.sleepSec'
  | 'settings.sleepMin'
  | 'settings.other'
  | 'settings.boot'
  | 'settings.trayOnline'
  | 'settings.trayOffline'
  | 'settings.trayDownloadRun'
  | 'settings.mouseSite'
  | 'settings.winMouse'
  | 'settings.winMouseAlert'
  | 'settings.advanced'
  | 'settings.longDistance'
  | 'settings.longDistanceTip'
  | 'settings.umdProfile'
  | 'settings.umdProfileHint'
  | 'settings.umdExport'
  | 'settings.umdImport'
  | 'settings.umdImportOk'
  | 'settings.umdImportFail'
  | 'status.ready'
  | 'status.saving'
  | 'status.saved'
  | 'status.saveError'
  | 'status.mock'
  | 'status.webhid'
  | 'status.connectingDemo'
  | 'status.selectMouse'
  | 'status.syncing'
  | 'status.reading'
  | 'status.readOk'
  | 'status.disconnected'
  | 'status.applyFailed'
  | 'status.webhidFailed'
  | 'status.battUnknown'
  | 'footer.language'
  | 'footer.madeWith'
  | 'footer.links'
  | 'write.queued'
  | 'write.writing'
  | 'write.ok'
  | 'write.error'

type Dict = Record<MessageKey, string>

const en: Dict = {
  'nav.buttons': 'Buttons',
  'nav.sensor': 'Sensor',
  'nav.macro': 'Macro',
  'nav.mouse': 'Mouse',
  'nav.settings': 'Settings',
  'nav.disconnect': 'Disconnect',
  'nav.soon': 'Soon',
  'nav.macroSoon': 'Macro editor coming soon',
  'nav.mice': 'Supported mice',
  'nav.contact': 'Contact',
  'nav.why': 'Why UMD',
  'nav.faq': 'FAQ',
  'nav.tray': 'Battery tray',
  'nav.siteNav': 'Site',
  'nav.deviceNav': 'Device',
  'connect.faqTitle': 'FAQ',
  'connect.learnMore': 'Learn more',
  'connect.trayEyebrow': 'Windows helper',
  'connect.trayTitle': 'UMD Battery Tray',
  'connect.trayBody':
    'Optional EV-signed .exe when you want battery % in the Windows tray without keeping the browser open. Works with King Ultra, Fenrir Max, and PRO X SUPERLIGHT.',
  'connect.trayFeat1': 'System tray icon with percent and charging status',
  'connect.trayFeat2': 'Optional always-on-top desktop widget',
  'connect.trayFeat3': 'Pick which supported mouse to monitor',
  'connect.trayFeat4': 'Poll interval and Start with Windows',
  'connect.trayFeat5': 'Checks for updates on start (auto-update)',
  'connect.trayLang':
    'This site (and this download section) is available in English and Polish - switch in the header.',
  'connect.trayDownload': 'Download UmdBatteryTray.exe',
  'connect.trayMore': 'Full details',
  'connect.trayNote':
    'Close G HUB / OEM apps / Chrome WebHID if the tray cannot open the mouse.',
  'connect.lede':
    'Open a driver for your mouse in the browser - no Windows installer.',
  'connect.demo': 'Try without a mouse',
  'connect.webhid': 'Open driver',
  'connect.open': 'Open',
  'connect.soon': 'Soon',
  'connect.pcOnly': 'PC only',
  'connect.pcOnlyTip': 'WebHID works in desktop Chrome or Edge — not on phone / tablet.',
  'connect.noWebHid': 'Use Chrome or Edge (desktop) to connect a mouse.',
  'connect.step1': 'Pick your mouse',
  'connect.step2': 'Allow it in the browser prompt',
  'connect.step3': 'Change DPI, buttons, and profiles',
  'connect.savedTitle': 'Your mice',
  'connect.savedSub': 'Already connected on this computer - click to reopen.',
  'connect.savedEmpty': 'Connect a mouse once and it will show up here.',
  'connect.supportedTitle': 'Choose a mouse',
  'connect.supportedSub': 'Click a model to open its driver.',
  'connect.statusLive': 'Ready',
  'connect.statusWip': 'Beta',
  'connect.statusPlanned': 'Soon',
  'connect.contactTitle': 'Want your mouse here?',
  'connect.contactBody':
    'UMD grows with community requests. Tell us what you use - we will check if we can add a browser driver.',
  'connect.contactBarter':
    'You can also loan your mouse for testing. Message on TikTok and we will figure out shipping.',
  'connect.contactEmailLabel': 'Email',
  'connect.contactEmailCta': 'Write to us',
  'connect.contactTiktokLabel': 'TikTok',
  'connect.contactTiktokCta': 'Send a DM',
  'connect.contactNeedTitle': 'Helpful to include',
  'connect.contactNeed1': 'Mouse brand and exact model name',
  'connect.contactNeed2': 'Link to the official Windows software',
  'connect.contactNeed3': 'Whether you have a spare unit for testing',
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
  'buttons.action.fire': 'Fire key',
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
  'settings.sleepSec': '{n} sec',
  'settings.sleepMin': '{n} min',
  'settings.other': 'Other',
  'settings.boot': 'Run on system boot (requires bridge helper)',
  'settings.trayOnline': 'Tray online · v{v} · battery {n}%',
  'settings.trayOffline':
    'Tray offline - run UmdBatteryTray.exe on this PC (browser on mouse.vxh.pl talks to the tray on your machine; the server cannot)',
  'settings.trayDownloadRun': 'Download and run UMD Battery Tray',
  'settings.mouseSite': 'UMD · mouse.vxh.pl',
  'settings.winMouse': 'Windows Mouse Properties',
  'settings.winMouseAlert':
    'Windows Mouse Properties is opened by the optional local bridge (main.cpl).',
  'settings.advanced': 'Advanced setting',
  'settings.longDistance': 'Long distance',
  'settings.longDistanceTip':
    'Farther range and stronger anti-interference, higher current, shorter battery life.',
  'settings.umdProfile': 'UMD profile file',
  'settings.umdProfileHint':
    'Export or import a JSON snapshot of buttons, DPI slots, and report rate for this mouse.',
  'settings.umdExport': 'Export UMD JSON',
  'settings.umdImport': 'Import UMD JSON',
  'settings.umdImportOk': 'Profile imported.',
  'settings.umdImportFail': 'Import failed - wrong device or invalid JSON.',
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
  'status.reading': 'Reading from mouse…',
  'status.readOk': 'Read from mouse',
  'status.disconnected': 'Device disconnected',
  'status.applyFailed': 'Apply failed',
  'status.webhidFailed': 'WebHID connect failed',
  'status.battUnknown': 'batt -',
  'footer.language': 'Language',
  'footer.madeWith': 'Made with',
  'footer.links': 'Footer',
  'write.queued': 'Write queued…',
  'write.writing': 'Writing to mouse…',
  'write.ok': 'Written to mouse',
  'write.error': 'Write failed',
}

const pl: Dict = {
  'nav.buttons': 'Przyciski',
  'nav.sensor': 'Sensor',
  'nav.macro': 'Makro',
  'nav.mouse': 'Myszka',
  'nav.settings': 'Ustawienia',
  'nav.disconnect': 'Rozłącz',
  'nav.soon': 'Wkrótce',
  'nav.macroSoon': 'Edytor makr wkrótce',
  'nav.mice': 'Wspierane myszy',
  'nav.contact': 'Kontakt',
  'nav.why': 'Dlaczego UMD',
  'nav.faq': 'FAQ',
  'nav.tray': 'Tray baterii',
  'nav.siteNav': 'Strona',
  'nav.deviceNav': 'Urządzenie',
  'connect.faqTitle': 'FAQ',
  'connect.learnMore': 'Więcej info',
  'connect.trayEyebrow': 'Helper Windows',
  'connect.trayTitle': 'UMD Battery Tray',
  'connect.trayBody':
    'Opcjonalny, podpisany EV .exe, gdy chcesz poziom baterii w trayu Windows bez otwartej przeglądarki. Działa z King Ultra, Fenrir Max i PRO X SUPERLIGHT.',
  'connect.trayFeat1': 'Ikona w trayu z procentem i statusem ładowania',
  'connect.trayFeat2': 'Opcjonalny widget na pulpicie (zawsze na wierzchu)',
  'connect.trayFeat3': 'Wybór, którą wspieraną mysz monitorować',
  'connect.trayFeat4': 'Interwał odświeżania i autostart z Windows',
  'connect.trayFeat5': 'Sprawdzanie aktualizacji przy starcie (auto-update)',
  'connect.trayLang':
    'Ta strona (i ta sekcja pobierania) jest po polsku i angielsku - przełącznik w nagłówku.',
  'connect.trayDownload': 'Pobierz UmdBatteryTray.exe',
  'connect.trayMore': 'Pełny opis',
  'connect.trayNote':
    'Zamknij G HUB / aplikacje OEM / Chrome WebHID, jeśli tray nie otworzy myszy.',
  'connect.lede':
    'Otwórz sterownik myszy w przeglądarce - bez instalacji Windows.',
  'connect.demo': 'Wypróbuj bez myszy',
  'connect.webhid': 'Otwórz sterownik',
  'connect.open': 'Otwórz',
  'connect.soon': 'Wkrótce',
  'connect.pcOnly': 'Tylko PC',
  'connect.pcOnlyTip':
    'WebHID działa w Chrome lub Edge na komputerze — nie na telefonie / tablecie.',
  'connect.noWebHid':
    'Do podłączenia myszy użyj Chrome lub Edge (wersja desktop).',
  'connect.step1': 'Wybierz mysz',
  'connect.step2': 'Zezwól w oknie przeglądarki',
  'connect.step3': 'Ustaw DPI, przyciski i profile',
  'connect.savedTitle': 'Twoje myszy',
  'connect.savedSub': 'Już łączone na tym komputerze - kliknij, żeby otworzyć ponownie.',
  'connect.savedEmpty':
    'Po pierwszym połączeniu mysz pojawi się tutaj.',
  'connect.supportedTitle': 'Wybierz mysz',
  'connect.supportedSub':
    'Kliknij model, żeby otworzyć jego sterownik.',
  'connect.statusLive': 'Gotowe',
  'connect.statusWip': 'Beta',
  'connect.statusPlanned': 'Wkrótce',
  'connect.contactTitle': 'Chcesz dodać swoją mysz?',
  'connect.contactBody':
    'UMD rośnie dzięki prośbom społeczności. Napisz, czego używasz - sprawdzimy, czy da się dodać sterownik w przeglądarce.',
  'connect.contactBarter':
    'Możesz też wypożyczyć myszkę na testy. Napisz na TikToku, dogadamy wysyłkę.',
  'connect.contactEmailLabel': 'E-mail',
  'connect.contactEmailCta': 'Napisz do nas',
  'connect.contactTiktokLabel': 'TikTok',
  'connect.contactTiktokCta': 'Wyślij DM',
  'connect.contactNeedTitle': 'Przydatne w wiadomości',
  'connect.contactNeed1': 'Marka i dokładny model myszy',
  'connect.contactNeed2': 'Link do oficjalnego oprogramowania Windows',
  'connect.contactNeed3': 'Czy masz zapasową sztukę na testy',
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
  'buttons.action.fire': 'Fire key',
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
  'macro.comingSoon': 'Wkrótce',
  'macro.comingSoonBody':
    'Nagrywanie makr i zapis do flash nie są jeszcze włączone. Zakładka otworzy się, gdy będzie gotowa ścieżka HID.',
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
  'settings.sleepSec': '{n} sek',
  'settings.sleepMin': '{n} min',
  'settings.other': 'Inne',
  'settings.boot': 'Uruchom przy starcie systemu (wymaga bridge)',
  'settings.trayOnline': 'Tray online · v{v} · bateria {n}%',
  'settings.trayOffline':
    'Tray wyłączony - uruchom UmdBatteryTray.exe na tym PC (przeglądarka na mouse.vxh.pl łączy się z trayem u Ciebie; serwer tego nie widzi)',
  'settings.trayDownloadRun': 'Pobierz i uruchom UMD Battery Tray',
  'settings.mouseSite': 'UMD · mouse.vxh.pl',
  'settings.winMouse': 'Właściwości myszy Windows',
  'settings.winMouseAlert':
    'Właściwości myszy Windows otwiera opcjonalny lokalny bridge (main.cpl).',
  'settings.advanced': 'Zaawansowane',
  'settings.longDistance': 'Duży zasięg',
  'settings.longDistanceTip':
    'Większy zasięg i odporność na zakłócenia, wyższy prąd, krótszy czas pracy.',
  'settings.umdProfile': 'Plik profilu UMD',
  'settings.umdProfileHint':
    'Eksport lub import JSON ze snapshotem przycisków, gniazd DPI i Hz dla tej myszy.',
  'settings.umdExport': 'Eksportuj UMD JSON',
  'settings.umdImport': 'Importuj UMD JSON',
  'settings.umdImportOk': 'Zaimportowano profil.',
  'settings.umdImportFail': 'Import nieudany - zły device lub uszkodzony JSON.',
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
  'status.reading': 'Odczytuję z myszy…',
  'status.readOk': 'Odczytano z myszy',
  'status.disconnected': 'Urządzenie rozłączone',
  'status.applyFailed': 'Nie udało się zastosować',
  'status.webhidFailed': 'Połączenie WebHID nieudane',
  'status.battUnknown': 'bat. -',
  'footer.language': 'Język',
  'footer.madeWith': 'Made with',
  'footer.links': 'Stopka',
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
