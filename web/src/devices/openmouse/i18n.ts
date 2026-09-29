import type { Locale } from '@/i18n/locale'

type OpenMouseCopy = {
  hubDescription: (count: number) => string
  hubTitle: string
  hubSubtitle: string
  searchAll: string
  searchBrand: string
  namedOnly: string
  allBrands: string
  connect: string
  howTitle: string
  howBody: string
  brandHowTitle: string
  brandHowBody: (brand: string) => string
  brands: string
  mouseList: string
  brandMouseList: (brand: string) => string
  named: string
  empty: string
  native: string
  openMouseHint: string
  namedHint: string
  deviceDescription: (name: string, brand: string, vidPid: string) => string
  brandDescription: (brand: string, count: number) => string
  connectShort: string
  stepsTitle: string
  steps: [string, string, string]
}

export const OPENMOUSE_COPY: Record<Locale, OpenMouseCopy> = {
  pl: {
    hubDescription: (n) => `Katalog ${n} urządzeń OpenMouse w Universal Mouse Drivers: wyszukiwanie modeli, marki i obsługa WebHID bez ciężkiego instalatora producenta.`,
    hubTitle: 'Urządzenia społecznościowe OpenMouse',
    hubSubtitle: 'Te myszy korzystają z protokołów OpenMouse. Wybierz markę, znajdź model i połącz go bezpośrednio w Chrome lub Edge.',
    searchAll: 'Szukaj nazwy, marki lub VID:PID…', searchBrand: 'Szukaj w tej marce…', namedOnly: 'Tylko modele z nazwą', allBrands: 'Wszystkie marki', connect: 'Połącz mysz w UMD',
    howTitle: 'Jak to działa?', howBody: 'Sterowniki natywne UMD mają pełny, dedykowany interfejs. Urządzenia społecznościowe są wykrywane przez OpenMouse i korzystają ze wspólnego panelu WebHID.',
    brandHowTitle: 'Ta marka w UMD', brandHowBody: (b) => `Urządzenia ${b} są obsługiwane przez protokoły OpenMouse w UMD. Wybierz model z listy i połącz go przez WebHID.`,
    brands: 'Marki', mouseList: 'Lista myszy', brandMouseList: (b) => `Myszy ${b}`, named: 'Nazwany model', empty: 'Brak wyników. Zmień filtr lub wyszukiwanie.', native: 'Natywny UMD',
    openMouseHint: 'Protokoły OpenMouse w panelu UMD WebHID', namedHint: 'Nazwa modelu pochodzi z map urządzeń OpenMouse',
    deviceDescription: (n, b, id) => `${n} marki ${b} jest obsługiwany przez społecznościowy sterownik OpenMouse w Universal Mouse Drivers. Identyfikator HID urządzenia to ${id}. W Chrome lub Edge można połączyć mysz przez WebHID i skonfigurować udostępnione ustawienia sensora, w tym DPI.`,
    brandDescription: (b, n) => `${b}: ${n} urządzeń w katalogu OpenMouse i UMD. Przeglądaj modele, filtruj listę i łącz zgodną mysz przez WebHID bez instalowania rozbudowanego programu producenta.`,
    connectShort: 'Połącz w UMD', stepsTitle: 'Jak połączyć', steps: ['Otwórz umdrivers.com w Chrome lub Edge na komputerze.', 'Zamknij program producenta lub inną aplikację, która może blokować dostęp HID.', 'Kliknij „Połącz” i wybierz tę mysz na liście urządzeń WebHID.'],
  },
  en: {
    hubDescription: (n) => `Browse ${n} OpenMouse devices in Universal Mouse Drivers with model search, brand pages and WebHID support without a heavy OEM installer.`,
    hubTitle: 'Community devices powered by OpenMouse',
    hubSubtitle: 'These mice use OpenMouse protocols. Choose a brand, find your model and connect it directly in Chrome or Edge.',
    searchAll: 'Search by name, brand or VID:PID…', searchBrand: 'Search this brand…', namedOnly: 'Named models only', allBrands: 'All brands', connect: 'Connect a mouse in UMD',
    howTitle: 'How does it work?', howBody: 'Native UMD drivers have a complete dedicated interface. Community devices are detected through OpenMouse and use a shared WebHID panel.',
    brandHowTitle: 'This brand in UMD', brandHowBody: (b) => `${b} devices are supported through OpenMouse protocols in UMD. Choose a model from the list and connect it through WebHID.`,
    brands: 'Brands', mouseList: 'Mouse list', brandMouseList: (b) => `${b} mice`, named: 'Named model', empty: 'No results. Change the filter or search term.', native: 'UMD native',
    openMouseHint: 'OpenMouse protocols in the UMD WebHID panel', namedHint: 'The model name comes from OpenMouse device maps',
    deviceDescription: (n, b, id) => `${n} by ${b} is supported by the OpenMouse community driver in Universal Mouse Drivers. Its HID identifier is ${id}. Connect the mouse through WebHID in Chrome or Edge to configure the available sensor settings, including DPI.`,
    brandDescription: (b, n) => `${b}: ${n} devices in the OpenMouse and UMD catalog. Browse models, filter the list and connect a compatible mouse through WebHID without installing a large OEM utility.`,
    connectShort: 'Connect in UMD', stepsTitle: 'How to connect', steps: ['Open umdrivers.com in Chrome or Edge on a desktop computer.', 'Close the manufacturer utility or another app that may block HID access.', 'Click “Connect” and select this mouse in the WebHID device list.'],
  },
  de: {
    hubDescription: (n) => `Durchsuche ${n} OpenMouse-Geräte in Universal Mouse Drivers mit Modellsuche, Markenseiten und WebHID-Unterstützung ohne große Hersteller-Software.`,
    hubTitle: 'Community-Geräte mit OpenMouse', hubSubtitle: 'Diese Mäuse verwenden OpenMouse-Protokolle. Wähle eine Marke, finde dein Modell und verbinde es direkt in Chrome oder Edge.',
    searchAll: 'Nach Name, Marke oder VID:PID suchen…', searchBrand: 'Diese Marke durchsuchen…', namedOnly: 'Nur benannte Modelle', allBrands: 'Alle Marken', connect: 'Maus mit UMD verbinden',
    howTitle: 'Wie funktioniert das?', howBody: 'Native UMD-Treiber bieten eine vollständige eigene Oberfläche. Community-Geräte werden über OpenMouse erkannt und verwenden ein gemeinsames WebHID-Panel.',
    brandHowTitle: 'Diese Marke in UMD', brandHowBody: (b) => `Geräte von ${b} werden in UMD über OpenMouse-Protokolle unterstützt. Wähle ein Modell aus der Liste und verbinde es über WebHID.`,
    brands: 'Marken', mouseList: 'Mausliste', brandMouseList: (b) => `${b}-Mäuse`, named: 'Benanntes Modell', empty: 'Keine Ergebnisse. Ändere Filter oder Suchbegriff.', native: 'UMD nativ', openMouseHint: 'OpenMouse-Protokolle im UMD-WebHID-Panel', namedHint: 'Der Modellname stammt aus den OpenMouse-Gerätedaten',
    deviceDescription: (n, b, id) => `${n} von ${b} wird vom Community-Treiber OpenMouse in Universal Mouse Drivers unterstützt. Die HID-Kennung lautet ${id}. Verbinde die Maus in Chrome oder Edge über WebHID, um verfügbare Sensoreinstellungen wie DPI zu konfigurieren.`,
    brandDescription: (b, n) => `${b}: ${n} Geräte im OpenMouse- und UMD-Katalog. Durchsuche die Modelle und verbinde eine kompatible Maus über WebHID, ohne eine umfangreiche Hersteller-Software zu installieren.`,
    connectShort: 'In UMD verbinden', stepsTitle: 'So verbindest du die Maus', steps: ['Öffne umdrivers.com auf einem Computer in Chrome oder Edge.', 'Schließe die Hersteller-Software und andere Apps, die den HID-Zugriff blockieren könnten.', 'Klicke auf „Verbinden“ und wähle diese Maus in der WebHID-Geräteliste aus.'],
  },
  fr: {
    hubDescription: (n) => `Parcourez ${n} appareils OpenMouse dans Universal Mouse Drivers avec recherche par modèle, pages de marque et prise en charge WebHID, sans lourd logiciel constructeur.`,
    hubTitle: 'Périphériques communautaires OpenMouse', hubSubtitle: 'Ces souris utilisent les protocoles OpenMouse. Choisissez une marque, trouvez votre modèle et connectez-le directement dans Chrome ou Edge.',
    searchAll: 'Rechercher par nom, marque ou VID:PID…', searchBrand: 'Rechercher dans cette marque…', namedOnly: 'Modèles nommés uniquement', allBrands: 'Toutes les marques', connect: 'Connecter une souris dans UMD',
    howTitle: 'Comment ça fonctionne ?', howBody: 'Les pilotes UMD natifs disposent d’une interface dédiée complète. Les appareils communautaires sont détectés par OpenMouse et utilisent un panneau WebHID commun.',
    brandHowTitle: 'Cette marque dans UMD', brandHowBody: (b) => `Les appareils ${b} sont pris en charge dans UMD grâce aux protocoles OpenMouse. Choisissez un modèle dans la liste et connectez-le via WebHID.`,
    brands: 'Marques', mouseList: 'Liste des souris', brandMouseList: (b) => `Souris ${b}`, named: 'Modèle identifié', empty: 'Aucun résultat. Modifiez le filtre ou la recherche.', native: 'UMD natif', openMouseHint: 'Protocoles OpenMouse dans le panneau WebHID d’UMD', namedHint: 'Le nom du modèle provient des cartes d’appareils OpenMouse',
    deviceDescription: (n, b, id) => `${n} de ${b} est prise en charge par le pilote communautaire OpenMouse dans Universal Mouse Drivers. Son identifiant HID est ${id}. Connectez la souris via WebHID dans Chrome ou Edge pour configurer les réglages de capteur disponibles, notamment le DPI.`,
    brandDescription: (b, n) => `${b} : ${n} appareils dans le catalogue OpenMouse et UMD. Parcourez les modèles et connectez une souris compatible via WebHID sans installer un logiciel constructeur volumineux.`,
    connectShort: 'Connecter dans UMD', stepsTitle: 'Comment connecter la souris', steps: ['Ouvrez umdrivers.com dans Chrome ou Edge sur un ordinateur.', 'Fermez le logiciel du fabricant ou toute autre application susceptible de bloquer l’accès HID.', 'Cliquez sur « Connecter » et sélectionnez cette souris dans la liste WebHID.'],
  },
  es: {
    hubDescription: (n) => `Explora ${n} dispositivos OpenMouse en Universal Mouse Drivers con búsqueda de modelos, páginas de marcas y compatibilidad WebHID sin instalar una pesada aplicación del fabricante.`,
    hubTitle: 'Dispositivos comunitarios con OpenMouse', hubSubtitle: 'Estos ratones usan protocolos OpenMouse. Elige una marca, encuentra tu modelo y conéctalo directamente en Chrome o Edge.',
    searchAll: 'Buscar por nombre, marca o VID:PID…', searchBrand: 'Buscar en esta marca…', namedOnly: 'Solo modelos con nombre', allBrands: 'Todas las marcas', connect: 'Conectar un ratón en UMD',
    howTitle: '¿Cómo funciona?', howBody: 'Los controladores nativos de UMD tienen una interfaz dedicada completa. OpenMouse detecta los dispositivos comunitarios, que usan un panel WebHID común.',
    brandHowTitle: 'Esta marca en UMD', brandHowBody: (b) => `Los dispositivos ${b} son compatibles mediante los protocolos OpenMouse en UMD. Elige un modelo de la lista y conéctalo mediante WebHID.`,
    brands: 'Marcas', mouseList: 'Lista de ratones', brandMouseList: (b) => `Ratones ${b}`, named: 'Modelo identificado', empty: 'No hay resultados. Cambia el filtro o la búsqueda.', native: 'UMD nativo', openMouseHint: 'Protocolos OpenMouse en el panel WebHID de UMD', namedHint: 'El nombre del modelo procede de los mapas de dispositivos OpenMouse',
    deviceDescription: (n, b, id) => `${n} de ${b} es compatible con el controlador comunitario OpenMouse de Universal Mouse Drivers. Su identificador HID es ${id}. Conecta el ratón mediante WebHID en Chrome o Edge para configurar los ajustes de sensor disponibles, incluido el DPI.`,
    brandDescription: (b, n) => `${b}: ${n} dispositivos en el catálogo de OpenMouse y UMD. Explora los modelos y conecta un ratón compatible mediante WebHID sin instalar una aplicación pesada del fabricante.`,
    connectShort: 'Conectar en UMD', stepsTitle: 'Cómo conectar', steps: ['Abre umdrivers.com en Chrome o Edge desde un ordenador.', 'Cierra la aplicación del fabricante u otras aplicaciones que puedan bloquear el acceso HID.', 'Pulsa «Conectar» y selecciona este ratón en la lista de dispositivos WebHID.'],
  },
  pt: {
    hubDescription: (n) => `Explore ${n} dispositivos OpenMouse no Universal Mouse Drivers com pesquisa de modelos, páginas de marcas e suporte WebHID sem instalar um programa pesado do fabricante.`,
    hubTitle: 'Dispositivos comunitários com OpenMouse', hubSubtitle: 'Estes ratos usam protocolos OpenMouse. Escolha uma marca, encontre o seu modelo e ligue-o diretamente no Chrome ou Edge.',
    searchAll: 'Pesquisar por nome, marca ou VID:PID…', searchBrand: 'Pesquisar nesta marca…', namedOnly: 'Apenas modelos identificados', allBrands: 'Todas as marcas', connect: 'Ligar um rato no UMD',
    howTitle: 'Como funciona?', howBody: 'Os controladores nativos do UMD têm uma interface dedicada completa. Os dispositivos comunitários são detetados pelo OpenMouse e usam um painel WebHID comum.',
    brandHowTitle: 'Esta marca no UMD', brandHowBody: (b) => `Os dispositivos ${b} são suportados no UMD através dos protocolos OpenMouse. Escolha um modelo na lista e ligue-o por WebHID.`,
    brands: 'Marcas', mouseList: 'Lista de ratos', brandMouseList: (b) => `Ratos ${b}`, named: 'Modelo identificado', empty: 'Sem resultados. Altere o filtro ou a pesquisa.', native: 'UMD nativo', openMouseHint: 'Protocolos OpenMouse no painel WebHID do UMD', namedHint: 'O nome do modelo vem dos mapas de dispositivos OpenMouse',
    deviceDescription: (n, b, id) => `${n} da ${b} é suportado pelo controlador comunitário OpenMouse no Universal Mouse Drivers. O identificador HID é ${id}. Ligue o rato por WebHID no Chrome ou Edge para configurar as definições de sensor disponíveis, incluindo DPI.`,
    brandDescription: (b, n) => `${b}: ${n} dispositivos no catálogo OpenMouse e UMD. Explore os modelos e ligue um rato compatível por WebHID sem instalar um programa pesado do fabricante.`,
    connectShort: 'Ligar no UMD', stepsTitle: 'Como ligar', steps: ['Abra umdrivers.com no Chrome ou Edge num computador.', 'Feche o programa do fabricante ou outra aplicação que possa bloquear o acesso HID.', 'Clique em «Ligar» e selecione este rato na lista de dispositivos WebHID.'],
  },
  it: {
    hubDescription: (n) => `Esplora ${n} dispositivi OpenMouse in Universal Mouse Drivers con ricerca dei modelli, pagine dei marchi e supporto WebHID senza installare un pesante programma del produttore.`,
    hubTitle: 'Dispositivi della community con OpenMouse', hubSubtitle: 'Questi mouse usano i protocolli OpenMouse. Scegli un marchio, trova il modello e collegalo direttamente in Chrome o Edge.',
    searchAll: 'Cerca per nome, marchio o VID:PID…', searchBrand: 'Cerca in questo marchio…', namedOnly: 'Solo modelli identificati', allBrands: 'Tutti i marchi', connect: 'Collega un mouse in UMD',
    howTitle: 'Come funziona?', howBody: 'I driver UMD nativi hanno un’interfaccia dedicata completa. I dispositivi della community vengono rilevati tramite OpenMouse e usano un pannello WebHID comune.',
    brandHowTitle: 'Questo marchio in UMD', brandHowBody: (b) => `I dispositivi ${b} sono supportati in UMD tramite i protocolli OpenMouse. Scegli un modello dall’elenco e collegalo con WebHID.`,
    brands: 'Marchi', mouseList: 'Elenco dei mouse', brandMouseList: (b) => `Mouse ${b}`, named: 'Modello identificato', empty: 'Nessun risultato. Modifica il filtro o la ricerca.', native: 'UMD nativo', openMouseHint: 'Protocolli OpenMouse nel pannello WebHID di UMD', namedHint: 'Il nome del modello proviene dalle mappe dei dispositivi OpenMouse',
    deviceDescription: (n, b, id) => `${n} di ${b} è supportato dal driver della community OpenMouse in Universal Mouse Drivers. Il suo identificatore HID è ${id}. Collega il mouse tramite WebHID in Chrome o Edge per configurare le impostazioni del sensore disponibili, incluso il DPI.`,
    brandDescription: (b, n) => `${b}: ${n} dispositivi nel catalogo OpenMouse e UMD. Esplora i modelli e collega un mouse compatibile tramite WebHID senza installare un pesante programma del produttore.`,
    connectShort: 'Collega in UMD', stepsTitle: 'Come collegare il mouse', steps: ['Apri umdrivers.com in Chrome o Edge su un computer.', 'Chiudi il programma del produttore o altre applicazioni che potrebbero bloccare l’accesso HID.', 'Fai clic su «Collega» e seleziona questo mouse nell’elenco dei dispositivi WebHID.'],
  },
  zh: {
    hubDescription: (n) => `在 Universal Mouse Drivers 中浏览 ${n} 款 OpenMouse 设备，支持型号搜索、品牌页面和 WebHID，无需安装臃肿的厂商软件。`,
    hubTitle: 'OpenMouse 社区设备', hubSubtitle: '这些鼠标使用 OpenMouse 协议。选择品牌、找到型号，然后在 Chrome 或 Edge 中直接连接。',
    searchAll: '按名称、品牌或 VID:PID 搜索…', searchBrand: '在此品牌中搜索…', namedOnly: '仅显示已识别型号', allBrands: '所有品牌', connect: '在 UMD 中连接鼠标',
    howTitle: '如何使用？', howBody: 'UMD 原生驱动提供完整的专用界面。社区设备由 OpenMouse 识别，并使用统一的 WebHID 面板。',
    brandHowTitle: 'UMD 中的此品牌', brandHowBody: (b) => `${b} 设备通过 UMD 中的 OpenMouse 协议获得支持。请从列表选择型号并通过 WebHID 连接。`,
    brands: '品牌', mouseList: '鼠标列表', brandMouseList: (b) => `${b} 鼠标`, named: '已识别型号', empty: '没有结果。请更改筛选条件或搜索内容。', native: 'UMD 原生', openMouseHint: 'UMD WebHID 面板中的 OpenMouse 协议', namedHint: '型号名称来自 OpenMouse 设备映射',
    deviceDescription: (n, b, id) => `${b} ${n} 可通过 Universal Mouse Drivers 中的 OpenMouse 社区驱动使用。其 HID 标识符为 ${id}。在 Chrome 或 Edge 中通过 WebHID 连接鼠标，即可配置可用的传感器设置，包括 DPI。`,
    brandDescription: (b, n) => `${b}：OpenMouse 与 UMD 目录中共有 ${n} 款设备。浏览型号并通过 WebHID 连接兼容鼠标，无需安装臃肿的厂商软件。`,
    connectShort: '在 UMD 中连接', stepsTitle: '连接方法', steps: ['在电脑上的 Chrome 或 Edge 中打开 umdrivers.com。', '关闭厂商软件或其他可能占用 HID 访问的应用。', '点击“连接”，然后在 WebHID 设备列表中选择此鼠标。'],
  },
  ja: {
    hubDescription: (n) => `Universal Mouse Drivers で ${n} 台の OpenMouse 対応デバイスを検索できます。メーカー製の重いソフトを入れずに、モデル検索、ブランドページ、WebHID を利用できます。`,
    hubTitle: 'OpenMouse コミュニティデバイス', hubSubtitle: 'これらのマウスは OpenMouse プロトコルを使用します。ブランドとモデルを選び、Chrome または Edge から直接接続できます。',
    searchAll: '名前、ブランド、VID:PID で検索…', searchBrand: 'このブランド内を検索…', namedOnly: '名称が判明しているモデルのみ', allBrands: 'すべてのブランド', connect: 'UMD でマウスを接続',
    howTitle: '仕組み', howBody: 'UMD ネイティブドライバーには専用の完全な画面があります。コミュニティデバイスは OpenMouse で検出され、共通の WebHID パネルを使用します。',
    brandHowTitle: 'UMD でのこのブランド', brandHowBody: (b) => `${b} のデバイスは、UMD 内の OpenMouse プロトコルでサポートされています。リストからモデルを選び、WebHID で接続してください。`,
    brands: 'ブランド', mouseList: 'マウス一覧', brandMouseList: (b) => `${b} のマウス`, named: '識別済みモデル', empty: '該当する結果がありません。フィルターまたは検索語を変更してください。', native: 'UMD ネイティブ', openMouseHint: 'UMD WebHID パネルの OpenMouse プロトコル', namedHint: 'モデル名は OpenMouse のデバイスマップに基づいています',
    deviceDescription: (n, b, id) => `${b} の ${n} は、Universal Mouse Drivers の OpenMouse コミュニティドライバーでサポートされています。HID 識別子は ${id} です。Chrome または Edge から WebHID で接続し、DPI など利用可能なセンサー設定を変更できます。`,
    brandDescription: (b, n) => `${b}：OpenMouse と UMD のカタログに ${n} 台のデバイスがあります。モデルを検索し、メーカー製の重いソフトを入れずに WebHID で対応マウスを接続できます。`,
    connectShort: 'UMD で接続', stepsTitle: '接続方法', steps: ['パソコンの Chrome または Edge で umdrivers.com を開きます。', 'HID アクセスを占有する可能性があるメーカー製ソフトや他のアプリを終了します。', '「接続」をクリックし、WebHID のデバイス一覧からこのマウスを選びます。'],
  },
  ko: {
    hubDescription: (n) => `Universal Mouse Drivers에서 ${n}개의 OpenMouse 장치를 검색하고 브랜드 페이지와 WebHID를 이용할 수 있습니다. 무거운 제조사 프로그램을 설치할 필요가 없습니다.`,
    hubTitle: 'OpenMouse 커뮤니티 장치', hubSubtitle: '이 마우스들은 OpenMouse 프로토콜을 사용합니다. 브랜드와 모델을 선택한 뒤 Chrome 또는 Edge에서 바로 연결하세요.',
    searchAll: '이름, 브랜드 또는 VID:PID로 검색…', searchBrand: '이 브랜드에서 검색…', namedOnly: '이름이 확인된 모델만', allBrands: '모든 브랜드', connect: 'UMD에서 마우스 연결',
    howTitle: '어떻게 작동하나요?', howBody: 'UMD 네이티브 드라이버는 완전한 전용 화면을 제공합니다. 커뮤니티 장치는 OpenMouse로 감지되며 공통 WebHID 패널을 사용합니다.',
    brandHowTitle: 'UMD의 이 브랜드', brandHowBody: (b) => `${b} 장치는 UMD의 OpenMouse 프로토콜을 통해 지원됩니다. 목록에서 모델을 선택하고 WebHID로 연결하세요.`,
    brands: '브랜드', mouseList: '마우스 목록', brandMouseList: (b) => `${b} 마우스`, named: '확인된 모델', empty: '검색 결과가 없습니다. 필터나 검색어를 바꿔 보세요.', native: 'UMD 네이티브', openMouseHint: 'UMD WebHID 패널의 OpenMouse 프로토콜', namedHint: '모델명은 OpenMouse 장치 맵에서 가져옵니다',
    deviceDescription: (n, b, id) => `${b}의 ${n}은 Universal Mouse Drivers의 OpenMouse 커뮤니티 드라이버로 지원됩니다. HID 식별자는 ${id}입니다. Chrome 또는 Edge에서 WebHID로 연결하여 DPI 등 제공되는 센서 설정을 구성할 수 있습니다.`,
    brandDescription: (b, n) => `${b}: OpenMouse 및 UMD 카탈로그에 ${n}개의 장치가 있습니다. 모델을 검색하고 무거운 제조사 프로그램 없이 WebHID로 호환 마우스를 연결하세요.`,
    connectShort: 'UMD에서 연결', stepsTitle: '연결 방법', steps: ['컴퓨터의 Chrome 또는 Edge에서 umdrivers.com을 엽니다.', 'HID 접근을 막을 수 있는 제조사 프로그램이나 다른 앱을 종료합니다.', '“연결”을 누르고 WebHID 장치 목록에서 이 마우스를 선택합니다.'],
  },
  ru: {
    hubDescription: (n) => `Просматривайте ${n} устройств OpenMouse в Universal Mouse Drivers: поиск моделей, страницы брендов и поддержка WebHID без установки тяжёлой программы производителя.`,
    hubTitle: 'Устройства сообщества OpenMouse', hubSubtitle: 'Эти мыши используют протоколы OpenMouse. Выберите бренд, найдите модель и подключите её напрямую в Chrome или Edge.',
    searchAll: 'Поиск по названию, бренду или VID:PID…', searchBrand: 'Поиск по этому бренду…', namedOnly: 'Только модели с названием', allBrands: 'Все бренды', connect: 'Подключить мышь в UMD',
    howTitle: 'Как это работает?', howBody: 'Нативные драйверы UMD имеют полноценный отдельный интерфейс. Устройства сообщества определяются через OpenMouse и используют общую панель WebHID.',
    brandHowTitle: 'Этот бренд в UMD', brandHowBody: (b) => `Устройства ${b} поддерживаются в UMD через протоколы OpenMouse. Выберите модель из списка и подключите её через WebHID.`,
    brands: 'Бренды', mouseList: 'Список мышей', brandMouseList: (b) => `Мыши ${b}`, named: 'Опознанная модель', empty: 'Ничего не найдено. Измените фильтр или запрос.', native: 'Нативный UMD', openMouseHint: 'Протоколы OpenMouse в панели UMD WebHID', namedHint: 'Название модели взято из карт устройств OpenMouse',
    deviceDescription: (n, b, id) => `${n} от ${b} поддерживается драйвером сообщества OpenMouse в Universal Mouse Drivers. HID-идентификатор устройства: ${id}. Подключите мышь через WebHID в Chrome или Edge, чтобы настроить доступные параметры сенсора, включая DPI.`,
    brandDescription: (b, n) => `${b}: ${n} устройств в каталоге OpenMouse и UMD. Просматривайте модели и подключайте совместимую мышь через WebHID без установки тяжёлой программы производителя.`,
    connectShort: 'Подключить в UMD', stepsTitle: 'Как подключить', steps: ['Откройте umdrivers.com в Chrome или Edge на компьютере.', 'Закройте программу производителя и другие приложения, которые могут блокировать доступ HID.', 'Нажмите «Подключить» и выберите эту мышь в списке устройств WebHID.'],
  },
}

export function getOpenMouseCopy(locale: Locale): OpenMouseCopy {
  return OPENMOUSE_COPY[locale]
}
