import type { Locale } from '@/i18n/locale'
import { DEVICE_CATALOG } from '@/devices/registry'
import type { DeviceIdentity } from '@/devices/types'

export type FaqItem = {
  question: Record<Locale, string>
  answer: Record<Locale, string>
}

/** Shared FAQ shown on homepage + every SEO article. */
export const UMD_FAQ: FaqItem[] = [
  {
    question: {
      pl: 'Czym jest UMD?',
      en: 'What is UMD?',
    },
    answer: {
      pl: 'Universal Mouse Drivers to sterowniki myszy gamingowych w przeglądarce (WebHID). Łączysz mysz w Chrome lub Edge, ustawiasz DPI, przyciski i profile bez instalacji OEM.',
      en: 'Universal Mouse Drivers are browser-based gaming mouse drivers (WebHID). Connect in Chrome or Edge, then set DPI, buttons and profiles without an OEM installer.',
    },
  },
  {
    question: {
      pl: 'Jakie myszy są wspierane?',
      en: 'Which mice are supported?',
    },
    answer: {
      pl: 'Aktualnie: Redragon King Ultra, G-Wolves Fenrir Max 8K oraz Logitech PRO X SUPERLIGHT (gen1). Lista rośnie wraz z reverse engineeringiem kolejnych protokołów.',
      en: 'Currently: Redragon King Ultra, G-Wolves Fenrir Max 8K, and Logitech PRO X SUPERLIGHT (gen1). The list grows as more protocols are reverse-engineered.',
    },
  },
  {
    question: {
      pl: 'Czy potrzebuję instalacji Windows?',
      en: 'Do I need a Windows install?',
    },
    answer: {
      pl: 'Do konfiguracji myszy wystarczy Chrome lub Edge na mouse.vxh.pl. Opcjonalny UMD Battery Tray (Windows .exe) pokazuje baterię w trayu i na widgecie - szczegóły i pobieranie: mouse.vxh.pl/tray.',
      en: 'Mouse configuration only needs Chrome or Edge on mouse.vxh.pl. The optional UMD Battery Tray (Windows .exe) shows battery in the tray and a desktop widget - details and download: mouse.vxh.pl/tray.',
    },
  },
  {
    question: {
      pl: 'Czy UMD jest bezpieczne dla myszy?',
      en: 'Is UMD safe for my mouse?',
    },
    answer: {
      pl: 'Komunikujemy się tylko z whitelistą VID:PID danej myszy. Nie otwieramy innych urządzeń HID. Zapis profili idzie sprawdzonymi komendami z reverse OEM - zawsze możesz wrócić do fabryki w UI.',
      en: 'We only talk to the whitelisted VID:PID for that mouse. Other HID devices are never opened. Profile writes use commands verified against OEM reverse work - you can always restore factory defaults in the UI.',
    },
  },
  {
    question: {
      pl: 'Dlaczego nie użyć oficjalnego sterownika?',
      en: 'Why not use the official driver?',
    },
    answer: {
      pl: 'Oficjalne programy bywają ciężkie, wymagają instalacji i czasem blokują WebHID. UMD daje szybki dostęp w przeglądarce, lokalne drafty i jeden shell pod wiele marek.',
      en: 'Official apps are often heavy, require installs, and sometimes lock WebHID. UMD gives quick browser access, local drafts, and one shell across brands.',
    },
  },
  {
    question: {
      pl: 'Jak dodać moją mysz?',
      en: 'How do I get my mouse added?',
    },
    answer: {
      pl: 'Napisz model i link do oficjalnego softu Windows (sekcja Kontakt). Możliwy też barter / wypożyczenie sprzętu na testy przez TikTok.',
      en: 'Send the model and a link to the official Windows software (Contact section). You can also loan hardware for testing via TikTok.',
    },
  },
]

export type SeoArticleBlock = {
  heading: Record<Locale, string>
  paragraphs: Record<Locale, string[]>
  bullets?: Record<Locale, string[]>
}

export type DeviceSeoArticle = {
  slug: string
  catalogId: string
  path: string
  title: Record<Locale, string>
  description: Record<Locale, string>
  eyebrow: Record<Locale, string>
  h1: Record<Locale, string>
  intro: Record<Locale, string>
  blocks: SeoArticleBlock[]
  faqExtra?: FaqItem[]
}

function deviceById(id: string): DeviceIdentity {
  const d = DEVICE_CATALOG.find((x) => x.id === id)
  if (!d) throw new Error(`Unknown catalog id ${id}`)
  return d
}

export const DEVICE_SEO_ARTICLES: DeviceSeoArticle[] = [
  {
    slug: 'redragon-king-ultra',
    catalogId: 'redragon-king-ultra',
    path: '/mice/redragon-king-ultra',
    eyebrow: { pl: 'Redragon', en: 'Redragon' },
    title: {
      pl: 'Redragon King Ultra - sterownik WebHID | UMD',
      en: 'Redragon King Ultra - WebHID driver | UMD',
    },
    description: {
      pl: 'Konfiguruj Redragon King Ultra (M916OB-ULT) w przeglądarce: DPI, polling, przyciski, sleep i firmware bez OEM. Sensor PixArt PAW3395.',
      en: 'Configure Redragon King Ultra (M916OB-ULT) in the browser: DPI, polling, buttons, sleep and firmware without OEM. PixArt PAW3395 sensor.',
    },
    h1: {
      pl: 'Sterownik WebHID dla Redragon King Ultra',
      en: 'WebHID driver for Redragon King Ultra',
    },
    intro: {
      pl: 'King Ultra to pierwsza mysz w UMD. Protokół powstał z reverse engineeringu oficjalnego softu Windows - teraz ustawiasz mysz w Chrome/Edge jak w nowoczesnym web toolu.',
      en: 'King Ultra is the first mouse in UMD. The protocol comes from reverse-engineering the official Windows software - now you tune the mouse in Chrome/Edge like a modern web tool.',
    },
    blocks: [
      {
        heading: {
          pl: 'Co możesz ustawić',
          en: 'What you can configure',
        },
        paragraphs: {
          pl: [
            'UMD odwzorowuje kluczowe ekrany OEM: przyciski, sensor, ustawienia i (wkrótce) makra.',
          ],
          en: [
            'UMD mirrors the key OEM screens: buttons, sensor, settings, and (soon) macros.',
          ],
        },
        bullets: {
          pl: [
            'DPI i aktywny stopień',
            'Polling rate do 8K (zależnie od trybu)',
            'LOD, Peak Performance, ripple / angle / motion sync',
            'Debounce, sleep, long distance',
            'Import / eksport profilu UMD JSON',
          ],
          en: [
            'DPI and active stage',
            'Polling rate up to 8K (mode dependent)',
            'LOD, Peak Performance, ripple / angle / motion sync',
            'Debounce, sleep, long distance',
            'Import / export UMD JSON profiles',
          ],
        },
      },
      {
        heading: { pl: 'Jak połączyć', en: 'How to connect' },
        paragraphs: {
          pl: [
            'Otwórz UMD, kliknij Otwórz sterownik albo kartę King Ultra. W oknie WebHID wybierz interfejs vendor/dongle (nie zwykłą „HID-compliant mouse”).',
          ],
          en: [
            'Open UMD, click Open driver or the King Ultra card. In the WebHID prompt pick the vendor/dongle interface (not the plain “HID-compliant mouse”).',
          ],
        },
      },
    ],
    faqExtra: [
      {
        question: {
          pl: 'Jakie VID:PID ma King Ultra?',
          en: 'What VID:PID does King Ultra use?',
        },
        answer: {
          pl: 'Whitelist UMD: 3554:F54D, 3554:F54F, 3554:F510 (wired / dongle).',
          en: 'UMD whitelist: 3554:F54D, 3554:F54F, 3554:F510 (wired / dongle).',
        },
      },
    ],
  },
  {
    slug: 'rampage-blitz-ultimate',
    catalogId: 'rampage-blitz-ultimate',
    path: '/mice/rampage-blitz-ultimate',
    eyebrow: { pl: 'Rampage', en: 'Rampage' },
    title: {
      pl: 'Rampage Blitz Ultimate - sterownik WebHID | UMD',
      en: 'Rampage Blitz Ultimate - WebHID driver | UMD',
    },
    description: {
      pl: 'Konfiguruj Rampage Blitz Ultimate w przeglądarce: DPI PAW3950, polling, przyciski (Fire key), sleep i long distance - ten sam stos HIDUsb co King Ultra, osobne PID.',
      en: 'Configure Rampage Blitz Ultimate in the browser: PAW3950 DPI, polling, buttons (Fire key), sleep and long distance - same HIDUsb stack as King Ultra, separate PIDs.',
    },
    h1: {
      pl: 'Sterownik WebHID dla Rampage Blitz Ultimate',
      en: 'WebHID driver for Rampage Blitz Ultimate',
    },
    intro: {
      pl: 'Blitz Ultimate to osobna mysz Rampage w UMD. Protokół HIDUsb V11 jest wspólny z Redragon King Ultra (to samo OEM Mouse Drive Beta), ale VID/PID, art, DPI grades i mapa przycisków są własne.',
      en: 'Blitz Ultimate is a distinct Rampage mouse in UMD. The HIDUsb V11 protocol is shared with Redragon King Ultra (same OEM Mouse Drive Beta), but VID/PID, art, DPI grades and button map are its own.',
    },
    blocks: [
      {
        heading: {
          pl: 'Co możesz ustawić',
          en: 'What you can configure',
        },
        paragraphs: {
          pl: [
            'Te same ekrany co King Ultra: przyciski, sensor, ustawienia - z domyślnymi stopniami DPI i Fire key z OEM Config.ini.',
          ],
          en: [
            'Same screens as King Ultra: buttons, sensor, settings - with Blitz DPI grades and Fire key from OEM Config.ini.',
          ],
        },
        bullets: {
          pl: [
            'DPI (400–30000, 6 stopni)',
            'Polling do 8K',
            'LOD, Peak, ripple / angle / motion sync',
            'Debounce, sleep, long distance',
            'Fire key (OEM type 0x04)',
          ],
          en: [
            'DPI (400–30000, 6 stages)',
            'Polling up to 8K',
            'LOD, Peak, ripple / angle / motion sync',
            'Debounce, sleep, long distance',
            'Fire key (OEM type 0x04)',
          ],
        },
      },
      {
        heading: { pl: 'Jak połączyć', en: 'How to connect' },
        paragraphs: {
          pl: [
            'Otwórz UMD, kliknij kartę Blitz Ultimate. W WebHID wybierz interfejs vendor/dongle 3554:F563 albo kabel F562 (nie zwykłą HID-compliant mouse).',
          ],
          en: [
            'Open UMD and click the Blitz Ultimate card. In WebHID pick the vendor/dongle interface 3554:F563 or wired F562 (not the plain HID-compliant mouse).',
          ],
        },
      },
    ],
    faqExtra: [
      {
        question: {
          pl: 'Jakie VID:PID ma Blitz Ultimate?',
          en: 'What VID:PID does Blitz Ultimate use?',
        },
        answer: {
          pl: 'Whitelist UMD: 3554:F562 (wired), 3554:F563 (dongle). Nie mylić z King Ultra F54D/F54F.',
          en: 'UMD whitelist: 3554:F562 (wired), 3554:F563 (dongle). Do not confuse with King Ultra F54D/F54F.',
        },
      },
    ],
  },
  {
    slug: 'gwolves-fenrir-max',
    catalogId: 'gwolves-fenrir-max',
    path: '/mice/gwolves-fenrir-max',
    eyebrow: { pl: 'G-Wolves', en: 'G-Wolves' },
    title: {
      pl: 'G-Wolves Fenrir Max 8K - sterownik WebHID | UMD',
      en: 'G-Wolves Fenrir Max 8K - WebHID driver | UMD',
    },
    description: {
      pl: 'Sterownik przeglądarkowy dla Fenrir Max 8K: DPI, debounce OEM, polling i UI w stylu drivera G-Wolves - bez ciężkiej instalacji.',
      en: 'Browser driver for Fenrir Max 8K: DPI, OEM debounce, polling, and a G-Wolves-style UI - without a heavy install.',
    },
    h1: {
      pl: 'Sterownik WebHID dla G-Wolves Fenrir Max 8K',
      en: 'WebHID driver for G-Wolves Fenrir Max 8K',
    },
    intro: {
      pl: 'Fenrir Max 8K działa w UMD na protokole z reverse GWolvesDriver (stary IsNewProtocol=0). UI jest skórką OEM-like, żeby gracze Fenrira nie musieli się przestawiać.',
      en: 'Fenrir Max 8K runs in UMD on the reverse-engineered GWolvesDriver protocol (legacy IsNewProtocol=0). The UI is OEM-like so Fenrir players feel at home.',
    },
    blocks: [
      {
        heading: { pl: 'Funkcje', en: 'Features' },
        paragraphs: {
          pl: ['Skupiamy się na tym, czego używasz w grach FPS:'],
          en: ['We focus on what FPS players actually use:'],
        },
        bullets: {
          pl: [
            'Tabela DPI / XY sync',
            'Polling (w tym ścieżki 8K dongla)',
            'Debounce przycisków i scrolla w stylu OEM',
            'Lift-off i flagi sensora',
            'Profile onboard',
          ],
          en: [
            'DPI table / XY sync',
            'Polling (including 8K dongle paths)',
            'OEM-style button and scroll debounce',
            'Lift-off and sensor flags',
            'Onboard profiles',
          ],
        },
      },
      {
        heading: { pl: 'Jak połączyć', en: 'How to connect' },
        paragraphs: {
          pl: [
            'Podłącz dongle 8K lub kabel, otwórz UMD i wybierz Fenrir Max. W WebHID wskaż interfejs vendor (feature reports), nie sam raport myszy.',
          ],
          en: [
            'Plug in the 8K dongle or cable, open UMD and pick Fenrir Max. In WebHID choose the vendor interface (feature reports), not the plain mouse report.',
          ],
        },
      },
    ],
    faqExtra: [
      {
        question: {
          pl: 'Jakie VID:PID ma Fenrir Max?',
          en: 'What VID:PID does Fenrir Max use?',
        },
        answer: {
          pl: 'Whitelist: 33E4:3708 (wired) i 33E4:3717 (dongle 8K).',
          en: 'Whitelist: 33E4:3708 (wired) and 33E4:3717 (8K dongle).',
        },
      },
    ],
  },
  {
    slug: 'logitech-pro-x-superlight',
    catalogId: 'logitech-pro-x-superlight',
    path: '/mice/logitech-pro-x-superlight',
    eyebrow: { pl: 'Logitech', en: 'Logitech' },
    title: {
      pl: 'Logitech PRO X SUPERLIGHT - sterownik WebHID | UMD',
      en: 'Logitech PRO X SUPERLIGHT - WebHID driver | UMD',
    },
    description: {
      pl: 'Onboard profile HID++ 2.0 dla PRO X SUPERLIGHT gen1: DPI, Hz, przypisania przycisków 3-5 i profile flash bez G HUB.',
      en: 'Onboard HID++ 2.0 profiles for PRO X SUPERLIGHT gen1: DPI, Hz, button assignments 3-5 and flash profiles without G HUB.',
    },
    h1: {
      pl: 'Sterownik WebHID dla Logitech PRO X SUPERLIGHT',
      en: 'WebHID driver for Logitech PRO X SUPERLIGHT',
    },
    intro: {
      pl: 'Gen1 SUPERLIGHT na receiverze LIGHTSPEED (046D:C547). UMD używa Feature 0x8100 (onboard profiles) jak OMM - zamknij G HUB przed połączeniem.',
      en: 'Gen1 SUPERLIGHT on a LIGHTSPEED receiver (046D:C547). UMD uses Feature 0x8100 (onboard profiles) like OMM - close G HUB before connecting.',
    },
    blocks: [
      {
        heading: { pl: 'Funkcje', en: 'Features' },
        paragraphs: {
          pl: ['Ścieżka onboard zgodna z OMM / Solaar:'],
          en: ['Onboard path aligned with OMM / Solaar:'],
        },
        bullets: {
          pl: [
            'Tabela DPI (sloty 1-5) i CRC sektora',
            'Report rate w profilu (np. 1000 Hz)',
            'Przyciski Middle / Back / Forward (L/R zablokowane jak w OMM)',
            'Profile flash 1-5 + przywrócenie fabryki',
            'Bateria (Feature 0x1004)',
          ],
          en: [
            'DPI table (slots 1-5) and sector CRC',
            'Report rate in profile (e.g. 1000 Hz)',
            'Middle / Back / Forward buttons (L/R locked like OMM)',
            'Flash profiles 1-5 + factory restore',
            'Battery (Feature 0x1004)',
          ],
        },
      },
      {
        heading: { pl: 'Jak połączyć', en: 'How to connect' },
        paragraphs: {
          pl: [
            'Zamknij G HUB i Onboard Memory Manager. W UMD wybierz SUPERLIGHT i w WebHID wskaż interfejs z reportem 0x11 (vendor), nie sam tracking myszy.',
          ],
          en: [
            'Close G HUB and Onboard Memory Manager. In UMD pick SUPERLIGHT and in WebHID choose the interface with report 0x11 (vendor), not mouse tracking alone.',
          ],
        },
      },
    ],
    faqExtra: [
      {
        question: {
          pl: 'SUPERLIGHT 2 też?',
          en: 'SUPERLIGHT 2 too?',
        },
        answer: {
          pl: 'Na razie tylko gen1 (C547). LIGHTSPEED 2 / inny PID to osobna ścieżka protokołu - planowane później.',
          en: 'Gen1 only for now (C547). LIGHTSPEED 2 / other PIDs need a separate protocol path - planned later.',
        },
      },
    ],
  },
]

export const WHY_UMD = {
  path: '/why',
  title: {
    pl: 'Dlaczego powstaje UMD | Universal Mouse Drivers',
    en: 'Why UMD exists | Universal Mouse Drivers',
  },
  description: {
    pl: 'Dlaczego budujemy Universal Mouse Drivers: reverse engineering zamiast zamkniętych OEM, WebHID jak Wooting i jeden shell pod wiele myszy.',
    en: 'Why we build Universal Mouse Drivers: reverse engineering instead of locked OEM apps, WebHID like Wooting, and one shell for many mice.',
  },
  eyebrow: { pl: 'Misja', en: 'Mission' },
  h1: {
    pl: 'Dlaczego powstaje UMD',
    en: 'Why UMD exists',
  },
  intro: {
    pl: 'Bo dobre myszy zasługują na dobre narzędzia - a oficjalne sterowniki często są ciężkie, zamknięte albo niedostępne do współpracy. UMD to odpowiedź społecznościowa: WebHID, reverse protokołów i UI, które da się używać codziennie.',
    en: 'Because good mice deserve good tools - and official drivers are often heavy, closed, or unwilling to collaborate. UMD is a community answer: WebHID, protocol reverse work, and UI you can actually live in.',
  },
  blocks: [
    {
      heading: {
        pl: 'Problem z OEM',
        en: 'The OEM problem',
      },
      paragraphs: {
        pl: [
          'Producenci rzadko udostępniają dokumentację HID. Instalatory Windows ciągną usługi w tle, a niektóre myszy w ogóle nie mają sensownego softu poza Chinami.',
          'Gdy nie da się dostać projektu / SDK, zostaje reverse engineering: sniff, dekompilacja, mapowanie reportów - i własny driver w przeglądarce.',
        ],
        en: [
          'Vendors rarely ship HID documentation. Windows installers drag background services, and some mice have no usable software outside China.',
          'When there is no project / SDK, reverse engineering remains: sniff, decompile, map reports - then ship our own browser driver.',
        ],
      },
    },
    {
      heading: {
        pl: 'Model jak Wooting',
        en: 'The Wooting model',
      },
      paragraphs: {
        pl: [
          'WebHID pozwala konfigurować sprzęt bez natywnego instalatora. UMD idzie tą drogą: mouse.vxh.pl w Chrome / Edge, whitelist VID:PID, opcjonalny lekki tray tylko tam, gdzie przeglądarka nie wystarczy.',
        ],
        en: [
          'WebHID lets you configure hardware without a native installer. UMD follows that path: mouse.vxh.pl in Chrome / Edge, VID:PID whitelist, and an optional light tray only where the browser is not enough.',
        ],
      },
    },
    {
      heading: {
        pl: 'Jeden shell, wiele marek',
        en: 'One shell, many brands',
      },
      paragraphs: {
        pl: [
          'Każda mysz ma własny driver i protokół, ale wspólny produkt: UMD. Dzięki temu Redragon, G-Wolves i Logitech mogą żyć obok siebie bez trzech osobnych „chińskich exe”.',
        ],
        en: [
          'Each mouse keeps its own driver and protocol, but one product: UMD. That way Redragon, G-Wolves and Logitech can live side by side without three separate OEM executables.',
        ],
      },
    },
    {
      heading: {
        pl: 'Społeczność',
        en: 'Community',
      },
      paragraphs: {
        pl: [
          'Lista urządzeń rośnie dzięki zgłoszeniom, barterom sprzętu i testom. Jeśli masz mysz, której nie ma na liście - napisz. To właśnie dlatego powstaje UMD.',
        ],
        en: [
          'The device list grows through requests, hardware loans, and testing. If your mouse is missing - write in. That is exactly why UMD exists.',
        ],
      },
    },
  ] as SeoArticleBlock[],
}

/** Optional Windows battery helper (.exe). */
export const BATTERY_TRAY = {
  path: '/tray',
  title: {
    pl: 'UMD Battery Tray - bateria w trayu Windows | Universal Mouse Drivers',
    en: 'UMD Battery Tray - Windows tray battery | Universal Mouse Drivers',
  },
  description: {
    pl: 'Pobierz UMD Battery Tray: lekki, podpisany EV .exe z poziomem baterii w trayu Windows i opcjonalnym widgetem. King Ultra, Fenrir Max, PRO X SUPERLIGHT.',
    en: 'Download UMD Battery Tray: a light EV-signed Windows .exe for system-tray battery and an optional desktop widget. King Ultra, Fenrir Max, PRO X SUPERLIGHT.',
  },
  eyebrow: { pl: 'Windows .exe', en: 'Windows .exe' },
  h1: {
    pl: 'UMD Battery Tray',
    en: 'UMD Battery Tray',
  },
  intro: {
    pl: 'Sterownik myszy zostaje w przeglądarce. Tray to osobny, lekki helper Windows: procent baterii w ikonie systemowej i opcjonalny widget na pulpicie - bez trzymania Chrome / Edge otwartego.',
    en: 'The mouse driver stays in the browser. The tray is a separate, light Windows helper: battery percent in the system icon and an optional desktop widget - without leaving Chrome / Edge open.',
  },
  downloadUrl: '/api/downloads/UmdBatteryTray.exe',
  blocks: [
    {
      heading: {
        pl: 'Po co ten exe?',
        en: 'Why this .exe?',
      },
      paragraphs: {
        pl: [
          'WebHID świetnie konfiguruje DPI i przyciski, ale przeglądarka nie siedzi 24/7 w trayu. Battery Tray czyta baterię natywnie (HidSharp) tymi samymi protokołami co UMD w przeglądarce.',
          'Plik jest self-contained, podpisany EV (Authenticode) i nie instaluje usług w tle jak typowy soft OEM.',
        ],
        en: [
          'WebHID is great for DPI and buttons, but the browser does not live in the system tray. Battery Tray reads battery natively (HidSharp) with the same protocols as UMD in the browser.',
          'The build is self-contained, EV Authenticode-signed, and does not install background services like typical OEM software.',
        ],
      },
    },
    {
      heading: {
        pl: 'Funkcje',
        en: 'Features',
      },
      paragraphs: {
        pl: [
          'Jeden helper pod wszystkie myszy wspierane przez UMD - wybierasz źródło baterii w menu albo w Ustawieniach.',
        ],
        en: [
          'One helper for every UMD-supported mouse - pick the battery source from the tray menu or Settings.',
        ],
      },
      bullets: {
        pl: [
          'Ikona w trayu: bateria / procent / oba + tooltip',
          'Opcjonalny widget na pulpicie (zawsze na wierzchu, przezroczystość, rozmiar)',
          'Wybór myszy: King Ultra, Fenrir Max, PRO X SUPERLIGHT',
          'Interwał odświeżania 15–300 s i autostart z Windows',
          'Auto-update: sprawdzanie aktualizacji przy starcie',
          'Współpraca z ustawieniami na mouse.vxh.pl, gdy tray działa na tym samym PC',
        ],
        en: [
          'Tray icon: battery / percent / both + tooltip',
          'Optional desktop widget (always on top, opacity, size)',
          'Mouse picker: King Ultra, Fenrir Max, PRO X SUPERLIGHT',
          'Poll interval 15–300 s and Start with Windows',
          'Auto-update: checks for a new build on start',
          'Works with Settings on mouse.vxh.pl when the tray runs on the same PC',
        ],
      },
    },
    {
      heading: {
        pl: 'Jak uruchomić',
        en: 'How to run',
      },
      paragraphs: {
        pl: [
          'Pobierz UmdBatteryTray.exe, uruchom na PC z Windows. Zamknij G HUB / OMM / soft OEM / Chrome WebHID, jeśli tray nie otworzy myszy (exclusive HID).',
          'Strona UMD jest po polsku i angielsku (przełącznik w nagłówku). Sam tray ma UI po angielsku.',
        ],
        en: [
          'Download UmdBatteryTray.exe and run it on Windows. Close G HUB / OMM / OEM apps / Chrome WebHID if the tray cannot open the mouse (exclusive HID).',
          'The UMD site is available in English and Polish (header switch). The tray UI itself is English.',
        ],
      },
    },
  ] as SeoArticleBlock[],
  faqExtra: [
    {
      question: {
        pl: 'Czy tray zastępuje sterownik w przeglądarce?',
        en: 'Does the tray replace the browser driver?',
      },
      answer: {
        pl: 'Nie. Tray pokazuje baterię. DPI, przyciski i profile nadal ustawiasz na mouse.vxh.pl w Chrome / Edge.',
        en: 'No. The tray shows battery. DPI, buttons and profiles still go through mouse.vxh.pl in Chrome / Edge.',
      },
    },
    {
      question: {
        pl: 'Skąd wziąć aktualną wersję?',
        en: 'Where do I get the latest build?',
      },
      answer: {
        pl: 'Przycisk pobierania na tej stronie albo na mouse.vxh.pl (#tray). Auto-update przy starcie trayu pobiera nowszą wersję z mouse.vxh.pl.',
        en: 'The download button on this page or on mouse.vxh.pl (#tray). Auto-update on tray start fetches a newer build from mouse.vxh.pl.',
      },
    },
  ] as FaqItem[],
}

export function getDeviceSeo(slug: string): DeviceSeoArticle | undefined {
  return DEVICE_SEO_ARTICLES.find((a) => a.slug === slug)
}

export function getDeviceIdentityForSeo(
  article: DeviceSeoArticle,
): DeviceIdentity {
  return deviceById(article.catalogId)
}

export function faqForPage(
  lang: Locale,
  extra?: FaqItem[],
): { question: string; answer: string }[] {
  return [...(extra ?? []), ...UMD_FAQ].map((f) => ({
    question: f.question[lang],
    answer: f.answer[lang],
  }))
}

export function faqJsonLd(
  lang: Locale,
  extra?: FaqItem[],
): Record<string, unknown> {
  const items = faqForPage(lang, extra)
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}
