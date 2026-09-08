import type { Locale } from '@/i18n/locale'
import { DEVICE_CATALOG } from '@/devices/registry'
import type { DeviceIdentity } from '@/devices/types'
import { L, type L10nList, type L10nString } from './l10n'

export type FaqItem = {
  question: L10nString
  answer: L10nString
}

/** Shared FAQ shown on homepage + every SEO article. */
export const UMD_FAQ: FaqItem[] = [
  {
    question: {
      pl: 'Czym jest UMD?',
      en: 'What is UMD?',
      de: 'Was ist UMD?',
      fr: 'Qu’est-ce que UMD ?',
      es: '¿Qué es UMD?',
      pt: 'O que é o UMD?',
      it: 'Che cos’è UMD?',
      zh: '什么是 UMD？',
      ja: 'UMD とは何ですか？',
      ko: 'UMD란 무엇인가요?',
      ru: 'Что такое UMD?',
    },
    answer: {
      pl: 'Universal Mouse Drivers (UMD) to darmowe sterowniki myszy gamingowych w przeglądarce (WebHID) na oficjalnej stronie https://umdrivers.com. Łączysz mysz w Chrome lub Edge, ustawiasz DPI, przyciski i profile bez instalacji OEM.',
      en: 'Universal Mouse Drivers (UMD) are free browser-based gaming mouse drivers (WebHID) at the official site https://umdrivers.com. Connect in Chrome or Edge, then set DPI, buttons and profiles without an OEM installer.',
      de: 'Universal Mouse Drivers (UMD) sind kostenlose, browserbasierte Treiber für Gaming-Mäuse (WebHID) auf der offiziellen Website https://umdrivers.com. Verbinde deine Maus in Chrome oder Edge und stelle DPI, Tasten und Profile ohne OEM-Installer ein.',
      fr: 'Universal Mouse Drivers (UMD) propose gratuitement des pilotes de souris gaming dans le navigateur (WebHID) sur le site officiel https://umdrivers.com. Connectez votre souris dans Chrome ou Edge, puis réglez les DPI, les boutons et les profils sans installer le logiciel OEM.',
      es: 'Universal Mouse Drivers (UMD) ofrece controladores gratuitos para ratones gaming desde el navegador (WebHID) en el sitio oficial https://umdrivers.com. Conecta el ratón en Chrome o Edge y configura los DPI, los botones y los perfiles sin instalar software OEM.',
      pt: 'O Universal Mouse Drivers (UMD) oferece drivers gratuitos para ratos gaming no navegador (WebHID), no site oficial https://umdrivers.com. Ligue o rato no Chrome ou Edge e configure DPI, botões e perfis sem instalar software OEM.',
      it: 'Universal Mouse Drivers (UMD) offre driver gratuiti per mouse gaming direttamente nel browser (WebHID), sul sito ufficiale https://umdrivers.com. Collega il mouse in Chrome o Edge e configura DPI, pulsanti e profili senza installare software OEM.',
      zh: 'Universal Mouse Drivers (UMD) 是 https://umdrivers.com 官方网站提供的免费浏览器游戏鼠标驱动（WebHID）。在 Chrome 或 Edge 中连接鼠标，即可设置 DPI、按键和配置文件，无需安装 OEM 软件。',
      ja: 'Universal Mouse Drivers (UMD) は、公式サイト https://umdrivers.com で利用できる無料のブラウザベースのゲーミングマウスドライバー（WebHID）です。Chrome または Edge でマウスを接続し、OEM ソフトをインストールせずに DPI、ボタン、プロファイルを設定できます。',
      ko: 'Universal Mouse Drivers (UMD)는 공식 사이트 https://umdrivers.com 에서 제공하는 무료 브라우저 기반 게이밍 마우스 드라이버(WebHID)입니다. Chrome 또는 Edge에서 마우스를 연결하고 OEM 설치 프로그램 없이 DPI, 버튼, 프로필을 설정할 수 있습니다.',
      ru: 'Universal Mouse Drivers (UMD) - это бесплатные браузерные драйверы для игровых мышей (WebHID) на официальном сайте https://umdrivers.com. Подключите мышь в Chrome или Edge и настройте DPI, кнопки и профили без установки ПО OEM.',
    },
  },
  {
    question: {
      pl: 'Jaka jest oficjalna domena UMD?',
      en: 'What is the official UMD domain?',
      de: 'Wie lautet die offizielle UMD-Domain?',
      fr: 'Quel est le domaine officiel de UMD ?',
      es: '¿Cuál es el dominio oficial de UMD?',
      pt: 'Qual é o domínio oficial do UMD?',
      it: 'Qual è il dominio ufficiale di UMD?',
      zh: 'UMD 的官方域名是什么？',
      ja: 'UMD の公式ドメインは何ですか？',
      ko: 'UMD 공식 도메인은 무엇인가요?',
      ru: 'Какой официальный домен UMD?',
    },
    answer: {
      pl: 'Oficjalna domena to https://umdrivers.com (Universal Mouse Drivers). Stara nazwa hosta mouse.vxh.pl może przekierowywać na umdrivers.com.',
      en: 'The official domain is https://umdrivers.com (Universal Mouse Drivers). The legacy host mouse.vxh.pl may redirect to umdrivers.com.',
      de: 'Die offizielle Domain ist https://umdrivers.com (Universal Mouse Drivers). Der frühere Host mouse.vxh.pl kann auf umdrivers.com weiterleiten.',
      fr: 'Le domaine officiel est https://umdrivers.com (Universal Mouse Drivers). L’ancien hôte mouse.vxh.pl peut rediriger vers umdrivers.com.',
      es: 'El dominio oficial es https://umdrivers.com (Universal Mouse Drivers). El host anterior mouse.vxh.pl puede redirigir a umdrivers.com.',
      pt: 'O domínio oficial é https://umdrivers.com (Universal Mouse Drivers). O endereço antigo mouse.vxh.pl pode redirecionar para umdrivers.com.',
      it: 'Il dominio ufficiale è https://umdrivers.com (Universal Mouse Drivers). Il vecchio host mouse.vxh.pl può reindirizzare a umdrivers.com.',
      zh: '官方域名是 https://umdrivers.com（Universal Mouse Drivers）。旧主机名 mouse.vxh.pl 可能会重定向到 umdrivers.com。',
      ja: '公式ドメインは https://umdrivers.com（Universal Mouse Drivers）です。旧ホスト mouse.vxh.pl から umdrivers.com にリダイレクトされる場合があります。',
      ko: '공식 도메인은 https://umdrivers.com (Universal Mouse Drivers)입니다. 이전 호스트 mouse.vxh.pl은 umdrivers.com으로 리디렉션될 수 있습니다.',
      ru: 'Официальный домен - https://umdrivers.com (Universal Mouse Drivers). Старый адрес mouse.vxh.pl может перенаправлять на umdrivers.com.',
    },
  },
  {
    question: {
      pl: 'Jakie myszy są wspierane?',
      en: 'Which mice are supported?',
      de: 'Welche Mäuse werden unterstützt?',
      fr: 'Quelles souris sont prises en charge ?',
      es: '¿Qué ratones son compatibles?',
      pt: 'Que ratos são compatíveis?',
      it: 'Quali mouse sono supportati?',
      zh: '支持哪些鼠标？',
      ja: 'どのマウスに対応していますか？',
      ko: '어떤 마우스를 지원하나요?',
      ru: 'Какие мыши поддерживаются?',
    },
    answer: {
      pl: 'Live (native UMD): Redragon King Ultra i Rampage Blitz Ultimate. WIP: G-Wolves Fenrir Max 8K oraz Logitech PRO X SUPERLIGHT (gen1). Dodatkowo UMD × OpenMouse wykrywa i steruje myszami z protokołów OpenMouse (Logitech, Razer, Pulsar, Glorious, SteelSeries i inne) w przeglądarce.',
      en: 'Live (native UMD): Redragon King Ultra and Rampage Blitz Ultimate. WIP: G-Wolves Fenrir Max 8K and Logitech PRO X SUPERLIGHT (gen1). UMD × OpenMouse also detects and drives mice via OpenMouse protocols (Logitech, Razer, Pulsar, Glorious, SteelSeries, and more) in the browser.',
      de: 'Live (natives UMD): Redragon King Ultra und Rampage Blitz Ultimate. In Arbeit: G-Wolves Fenrir Max 8K und Logitech PRO X SUPERLIGHT (Gen. 1). UMD × OpenMouse erkennt und steuert zusätzlich Mäuse über OpenMouse-Protokolle (Logitech, Razer, Pulsar, Glorious, SteelSeries u. a.) im Browser.',
      fr: 'Disponibles (UMD natif) : Redragon King Ultra et Rampage Blitz Ultimate. En développement : G-Wolves Fenrir Max 8K et Logitech PRO X SUPERLIGHT (1re génération). UMD × OpenMouse détecte et pilote aussi des souris via les protocoles OpenMouse (Logitech, Razer, Pulsar, Glorious, SteelSeries, etc.) dans le navigateur.',
      es: 'Disponibles (UMD nativo): Redragon King Ultra y Rampage Blitz Ultimate. En desarrollo: G-Wolves Fenrir Max 8K y Logitech PRO X SUPERLIGHT (1.ª generación). UMD × OpenMouse también detecta y controla ratones con protocolos OpenMouse (Logitech, Razer, Pulsar, Glorious, SteelSeries y más) en el navegador.',
      pt: 'Disponíveis (UMD nativo): Redragon King Ultra e Rampage Blitz Ultimate. Em desenvolvimento: G-Wolves Fenrir Max 8K e Logitech PRO X SUPERLIGHT (1.ª geração). O UMD × OpenMouse também deteta e controla ratos via protocolos OpenMouse (Logitech, Razer, Pulsar, Glorious, SteelSeries e outros) no navegador.',
      it: 'Disponibili (UMD nativo): Redragon King Ultra e Rampage Blitz Ultimate. In sviluppo: G-Wolves Fenrir Max 8K e Logitech PRO X SUPERLIGHT (prima generazione). UMD × OpenMouse rileva e controlla anche mouse tramite i protocolli OpenMouse (Logitech, Razer, Pulsar, Glorious, SteelSeries e altri) nel browser.',
      zh: '已上线（原生 UMD）：Redragon King Ultra 和 Rampage Blitz Ultimate。开发中：G-Wolves Fenrir Max 8K 和 Logitech PRO X SUPERLIGHT（第一代）。UMD × OpenMouse 还可在浏览器中通过 OpenMouse 协议检测并驱动更多鼠标（Logitech、Razer、Pulsar、Glorious、SteelSeries 等）。',
      ja: '公開中（ネイティブ UMD）：Redragon King Ultra、Rampage Blitz Ultimate。開発中：G-Wolves Fenrir Max 8K、Logitech PRO X SUPERLIGHT（第1世代）。UMD × OpenMouse はブラウザ上で OpenMouse プロトコル（Logitech、Razer、Pulsar、Glorious、SteelSeries など）のマウスも検出・制御します。',
      ko: '정식 지원(네이티브 UMD): Redragon King Ultra, Rampage Blitz Ultimate. 개발 중: G-Wolves Fenrir Max 8K, Logitech PRO X SUPERLIGHT(1세대). UMD × OpenMouse는 브라우저에서 OpenMouse 프로토콜(Logitech, Razer, Pulsar, Glorious, SteelSeries 등) 마우스도 감지하고 제어합니다.',
      ru: 'Доступны (нативный UMD): Redragon King Ultra и Rampage Blitz Ultimate. В разработке: G-Wolves Fenrir Max 8K и Logitech PRO X SUPERLIGHT (1-е поколение). UMD × OpenMouse также обнаруживает и управляет мышами по протоколам OpenMouse (Logitech, Razer, Pulsar, Glorious, SteelSeries и др.) в браузере.',
    },
  },
  {
    question: {
      pl: 'Czy potrzebuję instalacji Windows?',
      en: 'Do I need a Windows install?',
      de: 'Muss ich etwas unter Windows installieren?',
      fr: 'Dois-je installer un logiciel sous Windows ?',
      es: '¿Tengo que instalar algo en Windows?',
      pt: 'Preciso de instalar algo no Windows?',
      it: 'Devo installare qualcosa su Windows?',
      zh: '需要安装 Windows 软件吗？',
      ja: 'Windows へのインストールは必要ですか？',
      ko: 'Windows에 프로그램을 설치해야 하나요?',
      ru: 'Нужно ли устанавливать программу в Windows?',
    },
    answer: {
      pl: 'Do konfiguracji myszy wystarczy Chrome lub Edge na https://umdrivers.com. Opcjonalny UMD Battery Tray (Windows .exe) pokazuje baterię w trayu i na widgecie - szczegóły: https://umdrivers.com/tray.',
      en: 'Mouse configuration only needs Chrome or Edge on https://umdrivers.com. The optional UMD Battery Tray (Windows .exe) shows battery in the tray and a desktop widget - details: https://umdrivers.com/tray.',
      de: 'Zum Konfigurieren der Maus brauchst du nur Chrome oder Edge auf https://umdrivers.com. Das optionale UMD Battery Tray (Windows .exe) zeigt den Akkustand im Infobereich und in einem Desktop-Widget an - Details: https://umdrivers.com/tray.',
      fr: 'Pour configurer la souris, il suffit d’utiliser Chrome ou Edge sur https://umdrivers.com. L’application facultative UMD Battery Tray (Windows .exe) affiche la batterie dans la zone de notification et dans un widget de bureau - détails : https://umdrivers.com/tray.',
      es: 'Para configurar el ratón solo necesitas Chrome o Edge en https://umdrivers.com. UMD Battery Tray (Windows .exe), opcional, muestra la batería en la bandeja del sistema y en un widget de escritorio - más información: https://umdrivers.com/tray.',
      pt: 'Para configurar o rato, basta usar o Chrome ou Edge em https://umdrivers.com. O UMD Battery Tray opcional (Windows .exe) mostra a bateria na área de notificação e num widget no ambiente de trabalho - detalhes: https://umdrivers.com/tray.',
      it: 'Per configurare il mouse bastano Chrome o Edge su https://umdrivers.com. L’app opzionale UMD Battery Tray (Windows .exe) mostra la batteria nell’area di notifica e in un widget sul desktop - dettagli: https://umdrivers.com/tray.',
      zh: '配置鼠标只需在 Chrome 或 Edge 中打开 https://umdrivers.com。可选的 UMD Battery Tray（Windows .exe）可在系统托盘和桌面小组件中显示电量 - 详情：https://umdrivers.com/tray。',
      ja: 'マウスの設定には、Chrome または Edge で https://umdrivers.com を開くだけです。オプションの UMD Battery Tray（Windows .exe）を使うと、システムトレイとデスクトップウィジェットにバッテリー残量を表示できます - 詳細：https://umdrivers.com/tray。',
      ko: '마우스 설정은 Chrome 또는 Edge에서 https://umdrivers.com 에 접속하면 됩니다. 선택 사항인 UMD Battery Tray(Windows .exe)는 시스템 트레이와 데스크톱 위젯에 배터리 잔량을 표시합니다 - 자세히 보기: https://umdrivers.com/tray.',
      ru: 'Для настройки мыши достаточно открыть https://umdrivers.com в Chrome или Edge. Необязательное приложение UMD Battery Tray (Windows .exe) показывает заряд в системном трее и виджете рабочего стола - подробнее: https://umdrivers.com/tray.',
    },
  },
  {
    question: {
      pl: 'Czy UMD jest bezpieczne dla myszy?',
      en: 'Is UMD safe for my mouse?',
      de: 'Ist UMD sicher für meine Maus?',
      fr: 'UMD est-il sans danger pour ma souris ?',
      es: '¿Es UMD seguro para mi ratón?',
      pt: 'O UMD é seguro para o meu rato?',
      it: 'UMD è sicuro per il mio mouse?',
      zh: 'UMD 对我的鼠标安全吗？',
      ja: 'UMD はマウスにとって安全ですか？',
      ko: 'UMD는 마우스에 안전한가요?',
      ru: 'Безопасен ли UMD для моей мыши?',
    },
    answer: {
      pl: 'Komunikujemy się tylko z whitelistą VID:PID danej myszy. Nie otwieramy innych urządzeń HID. Zapis profili idzie sprawdzonymi komendami z reverse OEM - zawsze możesz wrócić do fabryki w UI.',
      en: 'We only talk to the whitelisted VID:PID for that mouse. Other HID devices are never opened. Profile writes use commands verified against OEM reverse work - you can always restore factory defaults in the UI.',
      de: 'UMD kommuniziert nur mit den freigegebenen VID:PID der jeweiligen Maus. Andere HID-Geräte werden nie geöffnet. Profile werden mit Befehlen geschrieben, die durch OEM-Reverse-Engineering geprüft wurden - in der Oberfläche kannst du jederzeit die Werkseinstellungen wiederherstellen.',
      fr: 'UMD communique uniquement avec les VID:PID autorisés pour la souris concernée. Aucun autre périphérique HID n’est ouvert. L’écriture des profils utilise des commandes vérifiées par rétro-ingénierie du logiciel OEM - vous pouvez rétablir les réglages d’usine à tout moment dans l’interface.',
      es: 'UMD solo se comunica con los VID:PID autorizados para ese ratón. Nunca abre otros dispositivos HID. Los perfiles se escriben mediante comandos verificados con ingeniería inversa del software OEM - siempre puedes restaurar los valores de fábrica desde la interfaz.',
      pt: 'O UMD comunica apenas com os VID:PID autorizados para esse rato. Nunca abre outros dispositivos HID. A gravação de perfis usa comandos verificados através de engenharia inversa do software OEM - pode repor as definições de fábrica a qualquer momento na interface.',
      it: 'UMD comunica solo con i VID:PID autorizzati per quello specifico mouse. Gli altri dispositivi HID non vengono mai aperti. I profili vengono scritti con comandi verificati tramite reverse engineering del software OEM - dall’interfaccia puoi sempre ripristinare le impostazioni di fabbrica.',
      zh: 'UMD 只会与该鼠标白名单中的 VID:PID 通信，绝不会打开其他 HID 设备。配置文件写入使用经 OEM 软件逆向验证的命令 - 你随时可以在界面中恢复出厂设置。',
      ja: 'UMD は対象マウスの許可済み VID:PID とだけ通信し、ほかの HID デバイスを開くことはありません。プロファイルの書き込みには OEM ソフトのリバースエンジニアリングで検証したコマンドを使用し、画面からいつでも工場出荷時設定に戻せます。',
      ko: 'UMD는 해당 마우스의 허용 목록에 있는 VID:PID와만 통신하며 다른 HID 장치는 열지 않습니다. 프로필 저장에는 OEM 소프트웨어 리버스 엔지니어링으로 검증한 명령을 사용하며, UI에서 언제든 공장 기본값으로 복원할 수 있습니다.',
      ru: 'UMD взаимодействует только с VID:PID из списка разрешённых для конкретной мыши и никогда не открывает другие HID-устройства. Для записи профилей используются команды, проверенные при обратной разработке ПО OEM, а заводские настройки всегда можно восстановить в интерфейсе.',
    },
  },
  {
    question: {
      pl: 'Dlaczego nie użyć oficjalnego sterownika?',
      en: 'Why not use the official driver?',
      de: 'Warum nicht den offiziellen Treiber verwenden?',
      fr: 'Pourquoi ne pas utiliser le pilote officiel ?',
      es: '¿Por qué no usar el controlador oficial?',
      pt: 'Porque não usar o driver oficial?',
      it: 'Perché non usare il driver ufficiale?',
      zh: '为什么不使用官方驱动？',
      ja: '公式ドライバーを使わない理由は？',
      ko: '공식 드라이버를 사용하지 않는 이유는 무엇인가요?',
      ru: 'Почему бы не использовать официальный драйвер?',
    },
    answer: {
      pl: 'Oficjalne programy bywają ciężkie, wymagają instalacji i czasem blokują WebHID. UMD daje szybki dostęp w przeglądarce, lokalne drafty i jeden shell pod wiele marek.',
      en: 'Official apps are often heavy, require installs, and sometimes lock WebHID. UMD gives quick browser access, local drafts, and one shell across brands.',
      de: 'Offizielle Programme sind oft schwergewichtig, müssen installiert werden und blockieren manchmal WebHID. UMD bietet schnellen Zugriff im Browser, lokale Entwürfe und eine gemeinsame Oberfläche für mehrere Marken.',
      fr: 'Les applications officielles sont souvent lourdes, exigent une installation et peuvent bloquer WebHID. UMD offre un accès rapide dans le navigateur, des brouillons locaux et une interface unique pour plusieurs marques.',
      es: 'Las aplicaciones oficiales suelen ser pesadas, requieren instalación y a veces bloquean WebHID. UMD ofrece acceso rápido desde el navegador, borradores locales y una sola interfaz para varias marcas.',
      pt: 'As aplicações oficiais são muitas vezes pesadas, exigem instalação e por vezes bloqueiam o WebHID. O UMD oferece acesso rápido no navegador, rascunhos locais e uma única interface para várias marcas.',
      it: 'Le applicazioni ufficiali sono spesso pesanti, richiedono l’installazione e talvolta bloccano WebHID. UMD offre accesso rapido dal browser, bozze locali e un’unica interfaccia per più marchi.',
      zh: '官方应用通常体积庞大、需要安装，有时还会占用 WebHID。UMD 提供快速的浏览器访问、本地草稿，并以统一界面支持多个品牌。',
      ja: '公式アプリは動作が重く、インストールが必要で、WebHID を占有することもあります。UMD ならブラウザからすばやくアクセスでき、ローカル下書きと複数ブランド共通の画面を利用できます。',
      ko: '공식 앱은 무겁고 설치가 필요하며 WebHID를 점유하는 경우도 있습니다. UMD는 브라우저에서 빠르게 접근할 수 있고, 로컬 초안과 여러 브랜드를 아우르는 하나의 인터페이스를 제공합니다.',
      ru: 'Официальные приложения часто громоздкие, требуют установки и иногда блокируют WebHID. UMD обеспечивает быстрый доступ из браузера, локальные черновики и единый интерфейс для разных брендов.',
    },
  },
  {
    question: {
      pl: 'Jak dodać moją mysz?',
      en: 'How do I get my mouse added?',
      de: 'Wie kann ich meine Maus hinzufügen lassen?',
      fr: 'Comment faire ajouter ma souris ?',
      es: '¿Cómo puedo solicitar que añadáis mi ratón?',
      pt: 'Como posso pedir a inclusão do meu rato?',
      it: 'Come posso richiedere l’aggiunta del mio mouse?',
      zh: '如何申请添加我的鼠标？',
      ja: '自分のマウスを追加してもらうには？',
      ko: '제 마우스 지원을 요청하려면 어떻게 하나요?',
      ru: 'Как предложить добавить мою мышь?',
    },
    answer: {
      pl: 'Napisz model i link do oficjalnego softu Windows (sekcja Kontakt na umdrivers.com) albo otwórz Device request na GitHubie. Możliwy też barter / wypożyczenie sprzętu na testy przez TikTok.',
      en: 'Send the model and a link to the official Windows software (Contact on umdrivers.com) or open a Device request on GitHub. You can also loan hardware for testing via TikTok.',
      de: 'Sende uns das Modell und einen Link zur offiziellen Windows-Software über „Kontakt“ auf umdrivers.com oder öffne einen Device request auf GitHub. Über TikTok kannst du uns auch Testhardware leihen oder einen Tausch vereinbaren.',
      fr: 'Envoyez le modèle et un lien vers le logiciel Windows officiel via la rubrique Contact de umdrivers.com, ou ouvrez une Device request sur GitHub. Vous pouvez également prêter du matériel pour les tests ou proposer un échange via TikTok.',
      es: 'Envíanos el modelo y un enlace al software oficial para Windows desde la sección Contacto de umdrivers.com, o abre una Device request en GitHub. También puedes prestar hardware para las pruebas o proponer un intercambio a través de TikTok.',
      pt: 'Envie o modelo e uma ligação para o software oficial do Windows através da secção Contacto em umdrivers.com, ou abra um Device request no GitHub. Também pode emprestar equipamento para testes ou propor uma troca através do TikTok.',
      it: 'Invia il modello e un link al software Windows ufficiale dalla sezione Contatti di umdrivers.com, oppure apri una Device request su GitHub. Puoi anche prestare l’hardware per i test o proporre uno scambio tramite TikTok.',
      zh: '请通过 umdrivers.com 的“联系”页面发送鼠标型号和官方 Windows 软件链接，或在 GitHub 上提交 Device request。也可以通过 TikTok 提供设备借测或协商置换。',
      ja: 'umdrivers.com の「お問い合わせ」からモデル名と公式 Windows ソフトへのリンクを送るか、GitHub で Device request を作成してください。TikTok 経由でテスト用ハードウェアを貸し出したり、交換を提案したりすることもできます。',
      ko: 'umdrivers.com의 문의 섹션에서 모델명과 공식 Windows 소프트웨어 링크를 보내거나 GitHub에서 Device request를 등록해 주세요. TikTok을 통해 테스트용 하드웨어 대여 또는 교환을 제안할 수도 있습니다.',
      ru: 'Отправьте название модели и ссылку на официальное ПО для Windows через раздел контактов на umdrivers.com или создайте Device request на GitHub. Также можно предоставить устройство для тестирования или предложить обмен через TikTok.',
    },
  },
]

export type SeoArticleBlock = {
  heading: L10nString
  paragraphs: L10nList
  bullets?: L10nList
}

export type DeviceSeoArticle = {
  slug: string
  catalogId: string
  path: string
  title: L10nString
  description: L10nString
  eyebrow: L10nString
  h1: L10nString
  intro: L10nString
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
      pl: 'Redragon King Ultra - sterownik WebHID (Live) | umdrivers.com',
      en: 'Redragon King Ultra - WebHID driver (Live) | umdrivers.com',
    },
    description: {
      pl: 'Oficjalny UMD na umdrivers.com: konfiguruj Redragon King Ultra (M916OB-ULT) w Chrome/Edge - DPI PAW3395, polling, przyciski, sleep i firmware bez OEM. Status: Live.',
      en: 'Official UMD at umdrivers.com: configure Redragon King Ultra (M916OB-ULT) in Chrome/Edge - PAW3395 DPI, polling, buttons, sleep and firmware without OEM. Status: Live.',
    },
    h1: {
      pl: 'Sterownik WebHID dla Redragon King Ultra',
      en: 'WebHID driver for Redragon King Ultra',
    },
    intro: {
      pl: 'King Ultra to pierwsza mysz Live w UMD na umdrivers.com. Protokół powstał z reverse engineeringu oficjalnego softu Windows - teraz ustawiasz mysz w Chrome/Edge jak w nowoczesnym web toolu.',
      en: 'King Ultra is the first Live mouse in UMD at umdrivers.com. The protocol comes from reverse-engineering the official Windows software - now you tune the mouse in Chrome/Edge like a modern web tool.',
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
            'UMD mirrors the key OEM screens: buttons, sensor, settings, and macros.',
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
            'Otwórz https://umdrivers.com, kliknij Otwórz sterownik albo kartę King Ultra. W oknie WebHID wybierz interfejs vendor/dongle (nie zwykłą „HID-compliant mouse”).',
          ],
          en: [
            'Open https://umdrivers.com, click Open driver or the King Ultra card. In the WebHID prompt pick the vendor/dongle interface (not the plain “HID-compliant mouse”).',
          ],
        },
      },
    ],
    faqExtra: [
      {
        question: {
          pl: 'Jakie VID:PID ma King Ultra?',
          en: 'What VID:PID does King Ultra use?',
          de: 'Welche VID:PID verwendet King Ultra?',
          fr: 'Quels VID:PID utilise King Ultra ?',
          es: '¿Qué VID:PID utiliza King Ultra?',
          pt: 'Que VID:PID utiliza o King Ultra?',
          it: 'Quali VID:PID usa King Ultra?',
          zh: 'King Ultra 使用哪些 VID:PID？',
          ja: 'King Ultra が使用する VID:PID は？',
          ko: 'King Ultra는 어떤 VID:PID를 사용하나요?',
          ru: 'Какие VID:PID использует King Ultra?',
        },
        answer: {
          pl: 'Whitelist UMD: 3554:F54D, 3554:F54F, 3554:F510 (wired / dongle).',
          en: 'UMD whitelist: 3554:F54D, 3554:F54F, 3554:F510 (wired / dongle).',
          de: 'UMD-Freigabeliste: 3554:F54D, 3554:F54F, 3554:F510 (Kabel / Dongle).',
          fr: 'Liste blanche UMD : 3554:F54D, 3554:F54F, 3554:F510 (filaire / dongle).',
          es: 'Lista autorizada de UMD: 3554:F54D, 3554:F54F, 3554:F510 (cable / dongle).',
          pt: 'Lista autorizada do UMD: 3554:F54D, 3554:F54F, 3554:F510 (cabo / dongle).',
          it: 'Elenco autorizzato UMD: 3554:F54D, 3554:F54F, 3554:F510 (cavo / dongle).',
          zh: 'UMD 白名单：3554:F54D、3554:F54F、3554:F510（有线 / 接收器）。',
          ja: 'UMD 許可リスト：3554:F54D、3554:F54F、3554:F510（有線 / ドングル）。',
          ko: 'UMD 허용 목록: 3554:F54D, 3554:F54F, 3554:F510(유선 / 동글).',
          ru: 'Список разрешённых UMD: 3554:F54D, 3554:F54F, 3554:F510 (кабель / приёмник).',
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
      pl: 'Rampage Blitz Ultimate - sterownik WebHID (Live) | umdrivers.com',
      en: 'Rampage Blitz Ultimate - WebHID driver (Live) | umdrivers.com',
    },
    description: {
      pl: 'Oficjalny UMD na umdrivers.com: konfiguruj Rampage Blitz Ultimate w Chrome/Edge - DPI PAW3950, polling, przyciski (Fire key), sleep. Osobny sterownik (nie King Ultra). Status: Live.',
      en: 'Official UMD at umdrivers.com: configure Rampage Blitz Ultimate in Chrome/Edge - PAW3950 DPI, polling, buttons (Fire key), sleep. Isolated driver (not King Ultra). Status: Live.',
    },
    h1: {
      pl: 'Sterownik WebHID dla Rampage Blitz Ultimate',
      en: 'WebHID driver for Rampage Blitz Ultimate',
    },
    intro: {
      pl: 'Blitz Ultimate to osobna mysz Rampage Live w UMD (umdrivers.com) z własnym drzewem sterownika (protokół, katalog przycisków, DPI). Nie jest podpięta przez King Ultra - zmiana jednej SKU nie rusza drugiej.',
      en: 'Blitz Ultimate is a distinct Live Rampage mouse in UMD (umdrivers.com) with its own driver tree (protocol, button catalog, DPI defaults). It is not wired through King Ultra - changes to one SKU stay isolated.',
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
            'DPI (400-30000, 6 stopni)',
            'Polling do 8K',
            'LOD, Peak, ripple / angle / motion sync',
            'Debounce, sleep, long distance',
            'Fire key (OEM type 0x04)',
          ],
          en: [
            'DPI (400-30000, 6 stages)',
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
            'Otwórz https://umdrivers.com, kliknij kartę Blitz Ultimate. W WebHID wybierz interfejs vendor/dongle 3554:F563 albo kabel F562 (nie zwykłą HID-compliant mouse).',
          ],
          en: [
            'Open https://umdrivers.com and click the Blitz Ultimate card. In WebHID pick the vendor/dongle interface 3554:F563 or wired F562 (not the plain HID-compliant mouse).',
          ],
        },
      },
    ],
    faqExtra: [
      {
        question: {
          pl: 'Jakie VID:PID ma Blitz Ultimate?',
          en: 'What VID:PID does Blitz Ultimate use?',
          de: 'Welche VID:PID verwendet Blitz Ultimate?',
          fr: 'Quels VID:PID utilise Blitz Ultimate ?',
          es: '¿Qué VID:PID utiliza Blitz Ultimate?',
          pt: 'Que VID:PID utiliza o Blitz Ultimate?',
          it: 'Quali VID:PID usa Blitz Ultimate?',
          zh: 'Blitz Ultimate 使用哪些 VID:PID？',
          ja: 'Blitz Ultimate が使用する VID:PID は？',
          ko: 'Blitz Ultimate는 어떤 VID:PID를 사용하나요?',
          ru: 'Какие VID:PID использует Blitz Ultimate?',
        },
        answer: {
          pl: 'Whitelist UMD: 3554:F562 (wired), 3554:F563 (dongle). Nie mylić z King Ultra F54D/F54F.',
          en: 'UMD whitelist: 3554:F562 (wired), 3554:F563 (dongle). Do not confuse with King Ultra F54D/F54F.',
          de: 'UMD-Freigabeliste: 3554:F562 (Kabel), 3554:F563 (Dongle). Nicht mit King Ultra F54D/F54F verwechseln.',
          fr: 'Liste blanche UMD : 3554:F562 (filaire), 3554:F563 (dongle). À ne pas confondre avec King Ultra F54D/F54F.',
          es: 'Lista autorizada de UMD: 3554:F562 (cable), 3554:F563 (dongle). No confundir con King Ultra F54D/F54F.',
          pt: 'Lista autorizada do UMD: 3554:F562 (cabo), 3554:F563 (dongle). Não confundir com King Ultra F54D/F54F.',
          it: 'Elenco autorizzato UMD: 3554:F562 (cavo), 3554:F563 (dongle). Da non confondere con King Ultra F54D/F54F.',
          zh: 'UMD 白名单：3554:F562（有线）、3554:F563（接收器）。请勿与 King Ultra F54D/F54F 混淆。',
          ja: 'UMD 許可リスト：3554:F562（有線）、3554:F563（ドングル）。King Ultra F54D/F54F と混同しないでください。',
          ko: 'UMD 허용 목록: 3554:F562(유선), 3554:F563(동글). King Ultra F54D/F54F와 혼동하지 마세요.',
          ru: 'Список разрешённых UMD: 3554:F562 (кабель), 3554:F563 (приёмник). Не путайте с King Ultra F54D/F54F.',
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
      pl: 'G-Wolves Fenrir Max 8K - sterownik WebHID (WIP) | umdrivers.com',
      en: 'G-Wolves Fenrir Max 8K - WebHID driver (WIP) | umdrivers.com',
    },
    description: {
      pl: 'UMD na umdrivers.com: sterownik przeglądarkowy dla Fenrir Max 8K (WIP) - DPI, debounce OEM, polling i UI w stylu G-Wolves, bez ciężkiej instalacji.',
      en: 'UMD at umdrivers.com: browser driver for Fenrir Max 8K (WIP) - DPI, OEM debounce, polling, and a G-Wolves-style UI without a heavy install.',
    },
    h1: {
      pl: 'Sterownik WebHID dla G-Wolves Fenrir Max 8K',
      en: 'WebHID driver for G-Wolves Fenrir Max 8K',
    },
    intro: {
      pl: 'Fenrir Max 8K działa w UMD (umdrivers.com) na protokole z reverse GWolvesDriver (stary IsNewProtocol=0). Status: WIP. UI jest skórką OEM-like, żeby gracze Fenrira nie musieli się przestawiać.',
      en: 'Fenrir Max 8K runs in UMD (umdrivers.com) on the reverse-engineered GWolvesDriver protocol (legacy IsNewProtocol=0). Status: WIP. The UI is OEM-like so Fenrir players feel at home.',
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
            'Podłącz dongle 8K lub kabel, otwórz https://umdrivers.com i wybierz Fenrir Max. W WebHID wskaż interfejs vendor (feature reports), nie sam raport myszy.',
          ],
          en: [
            'Plug in the 8K dongle or cable, open https://umdrivers.com and pick Fenrir Max. In WebHID choose the vendor interface (feature reports), not the plain mouse report.',
          ],
        },
      },
    ],
    faqExtra: [
      {
        question: {
          pl: 'Jakie VID:PID ma Fenrir Max?',
          en: 'What VID:PID does Fenrir Max use?',
          de: 'Welche VID:PID verwendet Fenrir Max?',
          fr: 'Quels VID:PID utilise Fenrir Max ?',
          es: '¿Qué VID:PID utiliza Fenrir Max?',
          pt: 'Que VID:PID utiliza o Fenrir Max?',
          it: 'Quali VID:PID usa Fenrir Max?',
          zh: 'Fenrir Max 使用哪些 VID:PID？',
          ja: 'Fenrir Max が使用する VID:PID は？',
          ko: 'Fenrir Max는 어떤 VID:PID를 사용하나요?',
          ru: 'Какие VID:PID использует Fenrir Max?',
        },
        answer: {
          pl: 'Whitelist: 33E4:3708 (wired) i 33E4:3717 (dongle 8K).',
          en: 'Whitelist: 33E4:3708 (wired) and 33E4:3717 (8K dongle).',
          de: 'Freigabeliste: 33E4:3708 (Kabel) und 33E4:3717 (8K-Dongle).',
          fr: 'Liste blanche : 33E4:3708 (filaire) et 33E4:3717 (dongle 8K).',
          es: 'Lista autorizada: 33E4:3708 (cable) y 33E4:3717 (dongle 8K).',
          pt: 'Lista autorizada: 33E4:3708 (cabo) e 33E4:3717 (dongle 8K).',
          it: 'Elenco autorizzato: 33E4:3708 (cavo) e 33E4:3717 (dongle 8K).',
          zh: '白名单：33E4:3708（有线）和 33E4:3717（8K 接收器）。',
          ja: '許可リスト：33E4:3708（有線）、33E4:3717（8K ドングル）。',
          ko: '허용 목록: 33E4:3708(유선), 33E4:3717(8K 동글).',
          ru: 'Список разрешённых: 33E4:3708 (кабель) и 33E4:3717 (приёмник 8K).',
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
      pl: 'Logitech PRO X SUPERLIGHT - sterownik WebHID (WIP) | umdrivers.com',
      en: 'Logitech PRO X SUPERLIGHT - WebHID driver (WIP) | umdrivers.com',
    },
    description: {
      pl: 'UMD na umdrivers.com: onboard HID++ 2.0 dla PRO X SUPERLIGHT gen1 (WIP) - DPI, Hz, przyciski 3-5 i profile flash bez G HUB.',
      en: 'UMD at umdrivers.com: onboard HID++ 2.0 for PRO X SUPERLIGHT gen1 (WIP) - DPI, Hz, buttons 3-5 and flash profiles without G HUB.',
    },
    h1: {
      pl: 'Sterownik WebHID dla Logitech PRO X SUPERLIGHT',
      en: 'WebHID driver for Logitech PRO X SUPERLIGHT',
    },
    intro: {
      pl: 'Gen1 SUPERLIGHT na receiverze LIGHTSPEED (046D:C547). UMD na umdrivers.com używa Feature 0x8100 (onboard profiles) jak OMM - zamknij G HUB przed połączeniem. Status: WIP.',
      en: 'Gen1 SUPERLIGHT on a LIGHTSPEED receiver (046D:C547). UMD at umdrivers.com uses Feature 0x8100 (onboard profiles) like OMM - close G HUB before connecting. Status: WIP.',
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
            'Zamknij G HUB i Onboard Memory Manager. Na https://umdrivers.com wybierz SUPERLIGHT i w WebHID wskaż interfejs z reportem 0x11 (vendor), nie sam tracking myszy.',
          ],
          en: [
            'Close G HUB and Onboard Memory Manager. On https://umdrivers.com pick SUPERLIGHT and in WebHID choose the interface with report 0x11 (vendor), not mouse tracking alone.',
          ],
        },
      },
    ],
    faqExtra: [
      {
        question: {
          pl: 'SUPERLIGHT 2 też?',
          en: 'SUPERLIGHT 2 too?',
          de: 'Wird SUPERLIGHT 2 ebenfalls unterstützt?',
          fr: 'Et la SUPERLIGHT 2 ?',
          es: '¿También SUPERLIGHT 2?',
          pt: 'E o SUPERLIGHT 2?',
          it: 'Anche SUPERLIGHT 2?',
          zh: '也支持 SUPERLIGHT 2 吗？',
          ja: 'SUPERLIGHT 2 にも対応していますか？',
          ko: 'SUPERLIGHT 2도 지원하나요?',
          ru: 'SUPERLIGHT 2 тоже поддерживается?',
        },
        answer: {
          pl: 'Na razie tylko gen1 (C547). LIGHTSPEED 2 / inny PID to osobna ścieżka protokołu - planowane później.',
          en: 'Gen1 only for now (C547). LIGHTSPEED 2 / other PIDs need a separate protocol path - planned later.',
          de: 'Derzeit nur die 1. Generation (C547). LIGHTSPEED 2 und andere PIDs benötigen einen eigenen Protokollpfad - für später geplant.',
          fr: 'Pour l’instant, seule la 1re génération (C547) est prise en charge. LIGHTSPEED 2 et les autres PID nécessitent une voie de protocole distincte - prévue ultérieurement.',
          es: 'Por ahora, solo la 1.ª generación (C547). LIGHTSPEED 2 y otros PID necesitan una ruta de protocolo independiente - está previsto para más adelante.',
          pt: 'Por enquanto, apenas a 1.ª geração (C547). O LIGHTSPEED 2 e outros PID exigem um caminho de protocolo separado - previsto para mais tarde.',
          it: 'Per ora è supportata solo la prima generazione (C547). LIGHTSPEED 2 e gli altri PID richiedono un percorso di protocollo separato - previsto in futuro.',
          zh: '目前仅支持第一代（C547）。LIGHTSPEED 2 / 其他 PID 需要单独的协议实现 - 计划后续支持。',
          ja: '現時点では第1世代（C547）のみです。LIGHTSPEED 2 や別の PID には独立したプロトコル実装が必要で、今後対応予定です。',
          ko: '현재는 1세대(C547)만 지원합니다. LIGHTSPEED 2 및 다른 PID에는 별도의 프로토콜 구현이 필요하며 추후 지원할 예정입니다.',
          ru: 'Пока поддерживается только 1-е поколение (C547). Для LIGHTSPEED 2 и других PID нужен отдельный протокол - это запланировано на будущее.',
        },
      },
    ],
  },
]

export const WHY_UMD = {
  path: '/why',
  title: {
    pl: 'Dlaczego powstaje UMD | Universal Mouse Drivers · umdrivers.com',
    en: 'Why UMD exists | Universal Mouse Drivers · umdrivers.com',
    de: 'Warum es UMD gibt | Universal Mouse Drivers · umdrivers.com',
    fr: 'Pourquoi UMD existe | Universal Mouse Drivers · umdrivers.com',
    es: 'Por qué existe UMD | Universal Mouse Drivers · umdrivers.com',
    pt: 'Porque existe o UMD | Universal Mouse Drivers · umdrivers.com',
    it: 'Perché esiste UMD | Universal Mouse Drivers · umdrivers.com',
    zh: '为什么要打造 UMD | Universal Mouse Drivers · umdrivers.com',
    ja: 'UMD が生まれた理由 | Universal Mouse Drivers · umdrivers.com',
    ko: 'UMD가 존재하는 이유 | Universal Mouse Drivers · umdrivers.com',
    ru: 'Зачем существует UMD | Universal Mouse Drivers · umdrivers.com',
  },
  description: {
    pl: 'Dlaczego budujemy Universal Mouse Drivers × OpenMouse na umdrivers.com: native OEM + protokoły OpenMouse, WebHID jak Wooting i jeden shell pod wiele myszy.',
    en: 'Why we build Universal Mouse Drivers × OpenMouse at umdrivers.com: native OEM drivers plus OpenMouse protocols, WebHID like Wooting, and one shell for many mice.',
    de: 'Warum wir Universal Mouse Drivers × OpenMouse auf umdrivers.com entwickeln: native OEM-Treiber plus OpenMouse-Protokolle, WebHID nach dem Vorbild von Wooting und eine Oberfläche für viele Mäuse.',
    fr: 'Pourquoi nous créons Universal Mouse Drivers × OpenMouse sur umdrivers.com : pilotes OEM natifs et protocoles OpenMouse, WebHID comme Wooting et une interface unique pour de nombreuses souris.',
    es: 'Por qué desarrollamos Universal Mouse Drivers × OpenMouse en umdrivers.com: drivers OEM nativos y protocolos OpenMouse, WebHID como Wooting y una sola interfaz para muchos ratones.',
    pt: 'Porque criamos o Universal Mouse Drivers × OpenMouse em umdrivers.com: drivers OEM nativos e protocolos OpenMouse, WebHID como o Wooting e uma única interface para muitos ratos.',
    it: 'Perché sviluppiamo Universal Mouse Drivers × OpenMouse su umdrivers.com: driver OEM nativi e protocolli OpenMouse, WebHID come Wooting e un’unica interfaccia per tanti mouse.',
    zh: '了解我们为何在 umdrivers.com 打造 Universal Mouse Drivers × OpenMouse：原生 OEM 驱动与 OpenMouse 协议、类似 Wooting 的 WebHID，并以统一界面支持多款鼠标。',
    ja: 'umdrivers.com で Universal Mouse Drivers × OpenMouse を開発する理由：ネイティブ OEM ドライバーと OpenMouse プロトコル、Wooting のような WebHID、複数マウス向けの共通 UI。',
    ko: 'umdrivers.com에서 Universal Mouse Drivers × OpenMouse를 만드는 이유: 네이티브 OEM 드라이버와 OpenMouse 프로토콜, Wooting과 같은 WebHID, 여러 마우스를 위한 하나의 UI.',
    ru: 'Почему мы создаём Universal Mouse Drivers × OpenMouse на umdrivers.com: нативные OEM-драйверы и протоколы OpenMouse, WebHID по примеру Wooting и единый интерфейс для множества мышей.',
  },
  eyebrow: {
    pl: 'Misja',
    en: 'Mission',
    de: 'Mission',
    fr: 'Mission',
    es: 'Misión',
    pt: 'Missão',
    it: 'Missione',
    zh: '使命',
    ja: 'ミッション',
    ko: '미션',
    ru: 'Миссия',
  },
  h1: {
    pl: 'Dlaczego powstaje UMD',
    en: 'Why UMD exists',
    de: 'Warum es UMD gibt',
    fr: 'Pourquoi UMD existe',
    es: 'Por qué existe UMD',
    pt: 'Porque existe o UMD',
    it: 'Perché esiste UMD',
    zh: '为什么要打造 UMD',
    ja: 'UMD が生まれた理由',
    ko: 'UMD가 존재하는 이유',
    ru: 'Зачем существует UMD',
  },
  intro: {
    pl: 'Bo dobre myszy zasługują na dobre narzędzia - a oficjalne sterowniki często są ciężkie, zamknięte albo niedostępne do współpracy. UMD to odpowiedź społecznościowa: WebHID, reverse protokołów i UI, które da się używać codziennie.',
    en: 'Because good mice deserve good tools - and official drivers are often heavy, closed, or unwilling to collaborate. UMD is a community answer: WebHID, protocol reverse work, and UI you can actually live in.',
    de: 'Gute Mäuse verdienen gute Werkzeuge - offizielle Treiber sind jedoch oft schwergewichtig, geschlossen oder nicht offen für Zusammenarbeit. UMD ist die Antwort der Community: WebHID, Reverse Engineering von Protokollen und eine Oberfläche, die sich im Alltag wirklich gut nutzen lässt.',
    fr: 'Les bonnes souris méritent de bons outils - pourtant, les pilotes officiels sont souvent lourds, fermés ou peu ouverts à la collaboration. UMD est la réponse de la communauté : WebHID, rétro-ingénierie des protocoles et une interface réellement agréable au quotidien.',
    es: 'Los buenos ratones merecen buenas herramientas, pero los controladores oficiales suelen ser pesados, cerrados o poco abiertos a colaborar. UMD es la respuesta de la comunidad: WebHID, ingeniería inversa de protocolos y una interfaz pensada para el día a día.',
    pt: 'Bons ratos merecem boas ferramentas, mas os drivers oficiais são muitas vezes pesados, fechados ou pouco abertos à colaboração. O UMD é a resposta da comunidade: WebHID, engenharia inversa de protocolos e uma interface realmente prática para o dia a dia.',
    it: 'I buoni mouse meritano buoni strumenti, ma i driver ufficiali sono spesso pesanti, chiusi o poco aperti alla collaborazione. UMD è la risposta della community: WebHID, reverse engineering dei protocolli e un’interfaccia davvero comoda ogni giorno.',
    zh: '优秀的鼠标值得优秀的工具，但官方驱动往往臃肿、封闭，也缺乏协作空间。UMD 是社区给出的答案：WebHID、协议逆向工程，以及真正适合日常使用的界面。',
    ja: '優れたマウスには優れたツールが必要です。しかし公式ドライバーは重く、閉鎖的で、協力を得にくいことも少なくありません。UMD はコミュニティからの答えです。WebHID、プロトコルのリバースエンジニアリング、そして毎日快適に使える UI を提供します。',
    ko: '좋은 마우스에는 좋은 도구가 필요하지만 공식 드라이버는 무겁고 폐쇄적이거나 협업이 어려운 경우가 많습니다. UMD는 커뮤니티가 제시하는 해답입니다. WebHID, 프로토콜 리버스 엔지니어링, 그리고 매일 편하게 쓸 수 있는 UI를 제공합니다.',
    ru: 'Хорошим мышам нужны хорошие инструменты, но официальные драйверы часто громоздкие, закрытые и не предполагают сотрудничества. UMD - ответ сообщества: WebHID, обратная разработка протоколов и интерфейс, которым удобно пользоваться каждый день.',
  },
  blocks: [
    {
      heading: {
        pl: 'Problem z OEM',
        en: 'The OEM problem',
        de: 'Das OEM-Problem',
        fr: 'Le problème des logiciels OEM',
        es: 'El problema del software OEM',
        pt: 'O problema do software OEM',
        it: 'Il problema del software OEM',
        zh: 'OEM 软件的问题',
        ja: 'OEM ソフトの問題',
        ko: 'OEM 소프트웨어의 문제',
        ru: 'Проблема ПО OEM',
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
        de: [
          'Hersteller veröffentlichen nur selten HID-Dokumentation. Windows-Installer bringen Hintergrunddienste mit, und für manche Mäuse gibt es außerhalb Chinas keine brauchbare Software.',
          'Wenn weder Projektdateien noch SDK verfügbar sind, bleibt Reverse Engineering: Datenverkehr mitschneiden, dekompilieren, Reports zuordnen - und daraus einen eigenen Browser-Treiber entwickeln.',
        ],
        fr: [
          'Les fabricants publient rarement la documentation HID. Les installateurs Windows ajoutent des services en arrière-plan, et certaines souris ne disposent d’aucun logiciel réellement utilisable hors de Chine.',
          'Sans projet ni SDK, il reste la rétro-ingénierie : capturer les échanges, décompiler, cartographier les rapports - puis créer notre propre pilote dans le navigateur.',
        ],
        es: [
          'Los fabricantes rara vez publican documentación HID. Los instaladores de Windows añaden servicios en segundo plano y algunos ratones ni siquiera tienen software útil fuera de China.',
          'Cuando no hay proyecto ni SDK, queda la ingeniería inversa: capturar el tráfico, descompilar, mapear los informes y crear nuestro propio controlador para el navegador.',
        ],
        pt: [
          'Os fabricantes raramente publicam documentação HID. Os instaladores do Windows adicionam serviços em segundo plano, e alguns ratos nem sequer têm software adequado fora da China.',
          'Quando não há projeto nem SDK, resta a engenharia inversa: capturar o tráfego, descompilar, mapear os relatórios e criar o nosso próprio driver no navegador.',
        ],
        it: [
          'I produttori pubblicano raramente la documentazione HID. Gli installer Windows aggiungono servizi in background e alcuni mouse non hanno software davvero utilizzabile fuori dalla Cina.',
          'Quando non sono disponibili né il progetto né un SDK, resta il reverse engineering: acquisire il traffico, decompilare, mappare i report e creare il nostro driver nel browser.',
        ],
        zh: [
          '厂商很少公开 HID 文档。Windows 安装程序常会附带后台服务，有些鼠标在中国以外甚至没有可用的软件。',
          '没有项目源码或 SDK 时，只能进行逆向工程：抓取通信、反编译、映射报告，然后打造我们自己的浏览器驱动。',
        ],
        ja: [
          'メーカーが HID の仕様書を公開することはほとんどありません。Windows インストーラーにはバックグラウンドサービスが付属し、一部のマウスは中国国外で使えるソフトすらありません。',
          'プロジェクトや SDK が入手できなければ、通信のキャプチャ、逆コンパイル、レポートの解析といったリバースエンジニアリングを行い、独自のブラウザドライバーを作ります。',
        ],
        ko: [
          '제조사가 HID 문서를 공개하는 경우는 드뭅니다. Windows 설치 프로그램은 백그라운드 서비스를 추가하며, 일부 마우스는 중국 밖에서 쓸 만한 소프트웨어조차 없습니다.',
          '프로젝트나 SDK를 구할 수 없다면 통신 캡처, 디컴파일, 리포트 매핑 같은 리버스 엔지니어링을 거쳐 자체 브라우저 드라이버를 만듭니다.',
        ],
        ru: [
          'Производители редко публикуют документацию HID. Установщики Windows добавляют фоновые службы, а для некоторых мышей за пределами Китая вообще нет удобного ПО.',
          'Если нет проекта или SDK, остаётся обратная разработка: перехват обмена, декомпиляция, сопоставление отчётов - и создание собственного браузерного драйвера.',
        ],
      },
    },
    {
      heading: {
        pl: 'Model jak Wooting',
        en: 'The Wooting model',
        de: 'Das Wooting-Modell',
        fr: 'Le modèle Wooting',
        es: 'El modelo de Wooting',
        pt: 'O modelo da Wooting',
        it: 'Il modello Wooting',
        zh: 'Wooting 模式',
        ja: 'Wooting 型のアプローチ',
        ko: 'Wooting 방식',
        ru: 'Модель Wooting',
      },
      paragraphs: {
        pl: [
          'WebHID pozwala konfigurować sprzęt bez natywnego instalatora. UMD idzie tą drogą: https://umdrivers.com w Chrome / Edge, whitelist VID:PID, opcjonalny lekki tray tylko tam, gdzie przeglądarka nie wystarczy.',
        ],
        en: [
          'WebHID lets you configure hardware without a native installer. UMD follows that path: https://umdrivers.com in Chrome / Edge, VID:PID whitelist, and an optional light tray only where the browser is not enough.',
        ],
        de: [
          'WebHID ermöglicht die Hardware-Konfiguration ohne nativen Installer. UMD folgt diesem Weg: https://umdrivers.com in Chrome / Edge, eine VID:PID-Freigabeliste und ein optionales schlankes Tray-Programm nur dort, wo der Browser nicht ausreicht.',
        ],
        fr: [
          'WebHID permet de configurer le matériel sans installateur natif. UMD suit cette voie : https://umdrivers.com dans Chrome / Edge, une liste de VID:PID autorisés et une application tray légère, uniquement lorsque le navigateur ne suffit pas.',
        ],
        es: [
          'WebHID permite configurar el hardware sin un instalador nativo. UMD sigue ese camino: https://umdrivers.com en Chrome / Edge, una lista autorizada de VID:PID y una aplicación de bandeja ligera solo cuando el navegador no basta.',
        ],
        pt: [
          'O WebHID permite configurar hardware sem um instalador nativo. O UMD segue esse caminho: https://umdrivers.com no Chrome / Edge, uma lista autorizada de VID:PID e uma aplicação leve na área de notificação apenas quando o navegador não é suficiente.',
        ],
        it: [
          'WebHID permette di configurare l’hardware senza un installer nativo. UMD segue questa strada: https://umdrivers.com in Chrome / Edge, un elenco autorizzato di VID:PID e una leggera app nell’area di notifica solo quando il browser non basta.',
        ],
        zh: [
          'WebHID 无需原生安装程序即可配置硬件。UMD 沿用这一思路：在 Chrome / Edge 中访问 https://umdrivers.com，通过 VID:PID 白名单确保连接准确，并只在浏览器能力不足时提供可选的轻量托盘程序。',
        ],
        ja: [
          'WebHID ならネイティブのインストーラーなしでハードウェアを設定できます。UMD も同じ方針で、Chrome / Edge から https://umdrivers.com を利用し、VID:PID の許可リストと、ブラウザだけでは足りない場合に限って軽量なトレイアプリを提供します。',
        ],
        ko: [
          'WebHID를 사용하면 네이티브 설치 프로그램 없이 하드웨어를 설정할 수 있습니다. UMD도 같은 방식을 따릅니다. Chrome / Edge에서 https://umdrivers.com 을 이용하고 VID:PID 허용 목록을 적용하며, 브라우저만으로 부족한 경우에만 가벼운 트레이 앱을 제공합니다.',
        ],
        ru: [
          'WebHID позволяет настраивать оборудование без нативного установщика. UMD следует этому подходу: https://umdrivers.com в Chrome / Edge, список разрешённых VID:PID и необязательное лёгкое приложение в трее только там, где возможностей браузера недостаточно.',
        ],
      },
    },
    {
      heading: {
        pl: 'Jeden shell, wiele marek',
        en: 'One shell, many brands',
        de: 'Eine Oberfläche, viele Marken',
        fr: 'Une interface, plusieurs marques',
        es: 'Una interfaz para muchas marcas',
        pt: 'Uma interface para várias marcas',
        it: 'Un’interfaccia per molti marchi',
        zh: '统一界面，支持多个品牌',
        ja: 'ひとつの画面で複数ブランドに対応',
        ko: '하나의 인터페이스, 다양한 브랜드',
        ru: 'Единый интерфейс для разных брендов',
      },
      paragraphs: {
        pl: [
          'Każda mysz ma własny driver i protokół, ale wspólny produkt: UMD na umdrivers.com. Dzięki temu Redragon, Rampage, G-Wolves i Logitech mogą żyć obok siebie bez trzech osobnych „chińskich exe”.',
        ],
        en: [
          'Each mouse keeps its own driver and protocol, but one product: UMD on umdrivers.com. That way Redragon, Rampage, G-Wolves and Logitech can live side by side without three separate OEM executables.',
        ],
        de: [
          'Jede Maus behält ihren eigenen Treiber und ihr eigenes Protokoll, gehört aber zu einem Produkt: UMD auf umdrivers.com. So funktionieren Redragon, Rampage, G-Wolves und Logitech nebeneinander, ohne mehrere separate OEM-Programme.',
        ],
        fr: [
          'Chaque souris conserve son propre pilote et son propre protocole, au sein d’un produit unique : UMD sur umdrivers.com. Redragon, Rampage, G-Wolves et Logitech peuvent ainsi cohabiter sans multiplier les exécutables OEM.',
        ],
        es: [
          'Cada ratón conserva su propio controlador y protocolo, pero todo forma parte de un único producto: UMD en umdrivers.com. Así, Redragon, Rampage, G-Wolves y Logitech conviven sin necesitar varios ejecutables OEM.',
        ],
        pt: [
          'Cada rato mantém o seu próprio driver e protocolo, mas todos fazem parte de um único produto: o UMD em umdrivers.com. Assim, Redragon, Rampage, G-Wolves e Logitech coexistem sem vários executáveis OEM separados.',
        ],
        it: [
          'Ogni mouse mantiene il proprio driver e protocollo, ma tutto fa parte di un unico prodotto: UMD su umdrivers.com. In questo modo Redragon, Rampage, G-Wolves e Logitech convivono senza diversi eseguibili OEM separati.',
        ],
        zh: [
          '每款鼠标都保留独立的驱动和协议，但都归入同一个产品：umdrivers.com 上的 UMD。这样，Redragon、Rampage、G-Wolves 和 Logitech 可以共存，无需安装多个独立的 OEM 程序。',
        ],
        ja: [
          '各マウスは固有のドライバーとプロトコルを維持しながら、umdrivers.com の UMD というひとつの製品にまとまります。Redragon、Rampage、G-Wolves、Logitech を、複数の OEM 実行ファイルなしで並べて使えます。',
        ],
        ko: [
          '각 마우스는 고유한 드라이버와 프로토콜을 유지하지만 모두 umdrivers.com의 UMD라는 하나의 제품에 속합니다. 덕분에 여러 OEM 실행 파일 없이 Redragon, Rampage, G-Wolves, Logitech을 함께 사용할 수 있습니다.',
        ],
        ru: [
          'У каждой мыши остаются собственные драйвер и протокол, но продукт один - UMD на umdrivers.com. Поэтому Redragon, Rampage, G-Wolves и Logitech могут работать рядом без нескольких отдельных приложений OEM.',
        ],
      },
    },
    {
      heading: {
        pl: 'Społeczność',
        en: 'Community',
        de: 'Community',
        fr: 'Communauté',
        es: 'Comunidad',
        pt: 'Comunidade',
        it: 'Community',
        zh: '社区',
        ja: 'コミュニティ',
        ko: '커뮤니티',
        ru: 'Сообщество',
      },
      paragraphs: {
        pl: [
          'Lista urządzeń rośnie dzięki zgłoszeniom, barterom sprzętu i testom. Jeśli masz mysz, której nie ma na liście - napisz. To właśnie dlatego powstaje UMD.',
        ],
        en: [
          'The device list grows through requests, hardware loans, and testing. If your mouse is missing - write in. That is exactly why UMD exists.',
        ],
        de: [
          'Die Geräteliste wächst durch Anfragen, Leihgeräte und Tests. Wenn deine Maus fehlt, melde dich bei uns. Genau dafür gibt es UMD.',
        ],
        fr: [
          'La liste des appareils s’allonge grâce aux demandes, aux prêts de matériel et aux tests. Si votre souris n’y figure pas, contactez-nous. C’est précisément pour cela que UMD existe.',
        ],
        es: [
          'La lista de dispositivos crece gracias a las solicitudes, los préstamos de hardware y las pruebas. Si tu ratón no aparece, escríbenos. Para eso existe UMD.',
        ],
        pt: [
          'A lista de dispositivos cresce graças a pedidos, empréstimos de equipamento e testes. Se o seu rato não estiver na lista, contacte-nos. É precisamente por isso que o UMD existe.',
        ],
        it: [
          'L’elenco dei dispositivi cresce grazie alle richieste, ai prestiti di hardware e ai test. Se il tuo mouse non è presente, contattaci. È proprio per questo che esiste UMD.',
        ],
        zh: [
          '设备列表依靠用户请求、设备借测和实际测试不断扩展。如果你的鼠标尚未列出，请联系我们。这正是 UMD 存在的意义。',
        ],
        ja: [
          '対応デバイスは、リクエスト、機材の貸し出し、テストによって増えています。お使いのマウスが一覧になければ、ぜひご連絡ください。それこそが UMD の存在理由です。',
        ],
        ko: [
          '지원 기기 목록은 요청, 하드웨어 대여, 테스트를 통해 늘어납니다. 사용 중인 마우스가 목록에 없다면 알려 주세요. 바로 그것이 UMD가 존재하는 이유입니다.',
        ],
        ru: [
          'Список устройств растёт благодаря запросам, предоставлению оборудования и тестированию. Если вашей мыши нет в списке, напишите нам. Именно для этого и существует UMD.',
        ],
      },
    },
  ] as SeoArticleBlock[],
}

/** Optional Windows battery helper (.exe). */
export const BATTERY_TRAY = {
  path: '/tray',
  title: {
    pl: 'UMD Battery Tray - bateria w trayu Windows | umdrivers.com',
    en: 'UMD Battery Tray - Windows tray battery | umdrivers.com',
    de: 'UMD Battery Tray - Akkustand im Windows-Infobereich | umdrivers.com',
    fr: 'UMD Battery Tray - batterie dans la zone de notification Windows | umdrivers.com',
    es: 'UMD Battery Tray - batería en la bandeja de Windows | umdrivers.com',
    pt: 'UMD Battery Tray - bateria na área de notificação do Windows | umdrivers.com',
    it: 'UMD Battery Tray - batteria nell’area di notifica di Windows | umdrivers.com',
    zh: 'UMD Battery Tray - Windows 托盘电量显示 | umdrivers.com',
    ja: 'UMD Battery Tray - Windows トレイでバッテリー表示 | umdrivers.com',
    ko: 'UMD Battery Tray - Windows 트레이 배터리 표시 | umdrivers.com',
    ru: 'UMD Battery Tray - заряд в системном трее Windows | umdrivers.com',
  },
  description: {
    pl: 'Pobierz z umdrivers.com/tray: lekki, podpisany EV .exe z poziomem baterii w trayu Windows i opcjonalnym widgetem. King Ultra, Blitz Ultimate, Fenrir Max, PRO X SUPERLIGHT.',
    en: 'Download from umdrivers.com/tray: a light EV-signed Windows .exe for system-tray battery and an optional desktop widget. King Ultra, Blitz Ultimate, Fenrir Max, PRO X SUPERLIGHT.',
    de: 'Download auf umdrivers.com/tray: eine schlanke, EV-signierte Windows-.exe mit Akkustand im Infobereich und optionalem Desktop-Widget. King Ultra, Blitz Ultimate, Fenrir Max, PRO X SUPERLIGHT.',
    fr: 'À télécharger sur umdrivers.com/tray : un .exe Windows léger, signé EV, qui affiche la batterie dans la zone de notification et dans un widget de bureau facultatif. King Ultra, Blitz Ultimate, Fenrir Max, PRO X SUPERLIGHT.',
    es: 'Descárgalo en umdrivers.com/tray: un .exe ligero para Windows, firmado con certificado EV, que muestra la batería en la bandeja del sistema y en un widget de escritorio opcional. King Ultra, Blitz Ultimate, Fenrir Max, PRO X SUPERLIGHT.',
    pt: 'Transfira em umdrivers.com/tray: um .exe leve para Windows, assinado com certificado EV, que mostra a bateria na área de notificação e num widget opcional no ambiente de trabalho. King Ultra, Blitz Ultimate, Fenrir Max, PRO X SUPERLIGHT.',
    it: 'Scaricalo da umdrivers.com/tray: un .exe leggero per Windows, firmato EV, che mostra la batteria nell’area di notifica e in un widget desktop opzionale. King Ultra, Blitz Ultimate, Fenrir Max, PRO X SUPERLIGHT.',
    zh: '从 umdrivers.com/tray 下载：轻量且带 EV 签名的 Windows .exe，可在系统托盘中显示电量，并提供可选桌面小组件。支持 King Ultra、Blitz Ultimate、Fenrir Max、PRO X SUPERLIGHT。',
    ja: 'umdrivers.com/tray からダウンロード：軽量で EV 署名済みの Windows .exe。システムトレイにバッテリー残量を表示し、オプションのデスクトップウィジェットも利用できます。King Ultra、Blitz Ultimate、Fenrir Max、PRO X SUPERLIGHT に対応。',
    ko: 'umdrivers.com/tray에서 다운로드하세요. 가볍고 EV 서명된 Windows .exe로 시스템 트레이에 배터리를 표시하며 선택 사항인 데스크톱 위젯도 제공합니다. King Ultra, Blitz Ultimate, Fenrir Max, PRO X SUPERLIGHT 지원.',
    ru: 'Скачайте с umdrivers.com/tray: лёгкий Windows .exe с EV-подписью, который показывает заряд в системном трее и дополнительном виджете рабочего стола. King Ultra, Blitz Ultimate, Fenrir Max, PRO X SUPERLIGHT.',
  },
  eyebrow: {
    pl: 'Windows .exe',
    en: 'Windows .exe',
    de: 'Windows .exe',
    fr: 'Windows .exe',
    es: 'Windows .exe',
    pt: 'Windows .exe',
    it: 'Windows .exe',
    zh: 'Windows .exe',
    ja: 'Windows .exe',
    ko: 'Windows .exe',
    ru: 'Windows .exe',
  },
  h1: {
    pl: 'UMD Battery Tray',
    en: 'UMD Battery Tray',
    de: 'UMD Battery Tray',
    fr: 'UMD Battery Tray',
    es: 'UMD Battery Tray',
    pt: 'UMD Battery Tray',
    it: 'UMD Battery Tray',
    zh: 'UMD Battery Tray',
    ja: 'UMD Battery Tray',
    ko: 'UMD Battery Tray',
    ru: 'UMD Battery Tray',
  },
  intro: {
    pl: 'Sterownik myszy zostaje w przeglądarce. Tray to osobny, lekki helper Windows: procent baterii w ikonie systemowej i opcjonalny widget na pulpicie - bez trzymania Chrome / Edge otwartego.',
    en: 'The mouse driver stays in the browser. The tray is a separate, light Windows helper: battery percent in the system icon and an optional desktop widget - without leaving Chrome / Edge open.',
    de: 'Der Maustreiber bleibt im Browser. Das Tray-Programm ist ein separates, schlankes Windows-Hilfsprogramm: Akkustand in der Systemleiste und ein optionales Desktop-Widget - ganz ohne dauerhaft geöffnetes Chrome / Edge.',
    fr: 'Le pilote de la souris reste dans le navigateur. L’application tray est un utilitaire Windows distinct et léger : pourcentage de batterie dans l’icône système et widget de bureau facultatif - sans laisser Chrome / Edge ouvert.',
    es: 'El controlador del ratón permanece en el navegador. La aplicación de bandeja es una utilidad ligera e independiente para Windows: muestra el porcentaje de batería en el icono del sistema y, si quieres, en un widget de escritorio - sin dejar Chrome / Edge abierto.',
    pt: 'O driver do rato permanece no navegador. A aplicação da área de notificação é um utilitário Windows separado e leve: mostra a percentagem da bateria no ícone do sistema e, opcionalmente, num widget no ambiente de trabalho - sem manter o Chrome / Edge aberto.',
    it: 'Il driver del mouse rimane nel browser. L’app nell’area di notifica è un’utilità Windows separata e leggera: mostra la percentuale della batteria nell’icona di sistema e, se vuoi, in un widget desktop - senza lasciare Chrome / Edge aperto.',
    zh: '鼠标驱动仍在浏览器中运行。托盘程序是独立的轻量 Windows 助手：可在系统图标中显示电量百分比，并提供可选桌面小组件，无需让 Chrome / Edge 始终保持打开。',
    ja: 'マウスドライバーはブラウザで使い続けます。トレイアプリは独立した軽量 Windows ヘルパーで、システムアイコンにバッテリー残量を表示し、オプションのデスクトップウィジェットも利用できます。Chrome / Edge を開いたままにする必要はありません。',
    ko: '마우스 드라이버는 브라우저에 그대로 유지됩니다. 트레이 앱은 별도의 가벼운 Windows 도우미로, 시스템 아이콘에 배터리 잔량을 표시하고 선택 사항인 데스크톱 위젯도 제공합니다. Chrome / Edge를 계속 열어 둘 필요가 없습니다.',
    ru: 'Драйвер мыши остаётся в браузере. Приложение в трее - отдельная лёгкая утилита для Windows: процент заряда в системном значке и дополнительный виджет на рабочем столе без необходимости держать Chrome / Edge открытым.',
  },
  downloadUrl: '/api/downloads/UmdBatteryTray.exe',
  blocks: [
    {
      heading: {
        pl: 'Po co ten exe?',
        en: 'Why this .exe?',
        de: 'Warum diese .exe?',
        fr: 'Pourquoi ce fichier .exe ?',
        es: '¿Para qué sirve este .exe?',
        pt: 'Para que serve este .exe?',
        it: 'Perché questo file .exe?',
        zh: '为什么需要这个 .exe？',
        ja: 'なぜ .exe が必要なのですか？',
        ko: '이 .exe가 필요한 이유는 무엇인가요?',
        ru: 'Зачем нужен этот .exe?',
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
        de: [
          'WebHID eignet sich hervorragend für DPI und Tasten, aber der Browser läuft nicht dauerhaft im Infobereich. Battery Tray liest den Akkustand nativ über HidSharp und dieselben Protokolle wie UMD im Browser aus.',
          'Die Anwendung ist eigenständig, mit EV Authenticode signiert und installiert keine Hintergrunddienste wie typische OEM-Software.',
        ],
        fr: [
          'WebHID est idéal pour régler les DPI et les boutons, mais le navigateur ne reste pas dans la zone de notification. Battery Tray lit nativement la batterie avec HidSharp et les mêmes protocoles que UMD dans le navigateur.',
          'L’application est autonome, signée EV avec Authenticode et n’installe aucun service en arrière-plan contrairement aux logiciels OEM classiques.',
        ],
        es: [
          'WebHID es perfecto para configurar los DPI y los botones, pero el navegador no permanece en la bandeja del sistema. Battery Tray lee la batería de forma nativa con HidSharp y los mismos protocolos que UMD en el navegador.',
          'La aplicación es autónoma, cuenta con firma EV Authenticode y no instala servicios en segundo plano como suele hacer el software OEM.',
        ],
        pt: [
          'O WebHID é excelente para configurar DPI e botões, mas o navegador não permanece na área de notificação. O Battery Tray lê a bateria nativamente com HidSharp e os mesmos protocolos que o UMD no navegador.',
          'A aplicação é autónoma, tem assinatura EV Authenticode e não instala serviços em segundo plano como o software OEM típico.',
        ],
        it: [
          'WebHID è perfetto per configurare DPI e pulsanti, ma il browser non resta nell’area di notifica. Battery Tray legge la batteria in modo nativo con HidSharp e gli stessi protocolli usati da UMD nel browser.',
          'L’applicazione è autonoma, firmata EV con Authenticode e non installa servizi in background come il tipico software OEM.',
        ],
        zh: [
          'WebHID 很适合设置 DPI 和按键，但浏览器不会全天驻留在系统托盘中。Battery Tray 使用 HidSharp 和与浏览器版 UMD 相同的协议，原生读取电量。',
          '该程序为独立运行版本，带有 EV Authenticode 签名，不会像常见 OEM 软件那样安装后台服务。',
        ],
        ja: [
          'WebHID は DPI やボタンの設定に最適ですが、ブラウザはシステムトレイに常駐しません。Battery Tray は HidSharp とブラウザ版 UMD と同じプロトコルを使って、バッテリー情報をネイティブに読み取ります。',
          'アプリは自己完結型で EV Authenticode 署名済みです。一般的な OEM ソフトのようなバックグラウンドサービスはインストールしません。',
        ],
        ko: [
          'WebHID는 DPI와 버튼 설정에 적합하지만 브라우저가 시스템 트레이에 상주하지는 않습니다. Battery Tray는 HidSharp와 브라우저 UMD에서 사용하는 동일한 프로토콜로 배터리를 네이티브 방식으로 읽습니다.',
          '앱은 자체 포함형이며 EV Authenticode 서명이 적용되어 있고, 일반적인 OEM 소프트웨어처럼 백그라운드 서비스를 설치하지 않습니다.',
        ],
        ru: [
          'WebHID отлично подходит для настройки DPI и кнопок, но браузер не работает постоянно в системном трее. Battery Tray считывает заряд нативно через HidSharp, используя те же протоколы, что и UMD в браузере.',
          'Приложение автономно, подписано EV Authenticode и не устанавливает фоновые службы, характерные для обычного ПО OEM.',
        ],
      },
    },
    {
      heading: {
        pl: 'Funkcje',
        en: 'Features',
        de: 'Funktionen',
        fr: 'Fonctionnalités',
        es: 'Funciones',
        pt: 'Funcionalidades',
        it: 'Funzionalità',
        zh: '功能',
        ja: '機能',
        ko: '기능',
        ru: 'Возможности',
      },
      paragraphs: {
        pl: [
          'Jeden helper pod wszystkie myszy wspierane przez UMD - wybierasz źródło baterii w menu albo w Ustawieniach.',
        ],
        en: [
          'One helper for every UMD-supported mouse - pick the battery source from the tray menu or Settings.',
        ],
        de: [
          'Ein Hilfsprogramm für alle von UMD unterstützten Mäuse - wähle die Akkuquelle im Tray-Menü oder in den Einstellungen.',
        ],
        fr: [
          'Un seul utilitaire pour toutes les souris prises en charge par UMD - sélectionnez la source de batterie dans le menu tray ou dans les Paramètres.',
        ],
        es: [
          'Una sola utilidad para todos los ratones compatibles con UMD - elige la fuente de batería desde el menú de la bandeja o en Ajustes.',
        ],
        pt: [
          'Um único utilitário para todos os ratos compatíveis com o UMD - escolha a fonte da bateria no menu da área de notificação ou nas Definições.',
        ],
        it: [
          'Un’unica utilità per tutti i mouse supportati da UMD - scegli la sorgente della batteria dal menu nell’area di notifica o dalle Impostazioni.',
        ],
        zh: [
          '一个助手即可支持所有 UMD 兼容鼠标 - 可从托盘菜单或“设置”中选择电量来源。',
        ],
        ja: [
          'UMD が対応するすべてのマウスをひとつのヘルパーで管理できます。トレイメニューまたは設定からバッテリー情報の取得元を選択してください。',
        ],
        ko: [
          '하나의 도우미로 모든 UMD 지원 마우스를 관리할 수 있습니다. 트레이 메뉴 또는 설정에서 배터리 소스를 선택하세요.',
        ],
        ru: [
          'Одна утилита для всех мышей с поддержкой UMD - выберите источник данных о заряде в меню трея или настройках.',
        ],
      },
      bullets: {
        pl: [
          'Ikona w trayu: bateria / procent / oba + tooltip',
          'Opcjonalny widget na pulpicie (zawsze na wierzchu, przezroczystość, rozmiar)',
          'Wybór myszy: King Ultra, Blitz Ultimate, Fenrir Max, PRO X SUPERLIGHT',
          'Interwał odświeżania 15-300 s i autostart z Windows',
          'Auto-update: sprawdzanie aktualizacji przy starcie',
          'Współpraca z ustawieniami na umdrivers.com, gdy tray działa na tym samym PC',
        ],
        en: [
          'Tray icon: battery / percent / both + tooltip',
          'Optional desktop widget (always on top, opacity, size)',
          'Mouse picker: King Ultra, Blitz Ultimate, Fenrir Max, PRO X SUPERLIGHT',
          'Poll interval 15-300 s and Start with Windows',
          'Auto-update: checks for a new build on start',
          'Works with Settings on umdrivers.com when the tray runs on the same PC',
        ],
        de: [
          'Tray-Symbol: Akku / Prozent / beides + Tooltip',
          'Optionales Desktop-Widget (immer im Vordergrund, Deckkraft, Größe)',
          'Mausauswahl: King Ultra, Blitz Ultimate, Fenrir Max, PRO X SUPERLIGHT',
          'Aktualisierungsintervall von 15-300 s und Autostart mit Windows',
          'Automatische Updates: prüft beim Start auf eine neue Version',
          'Arbeitet mit den Einstellungen auf umdrivers.com zusammen, wenn das Tray-Programm auf demselben PC läuft',
        ],
        fr: [
          'Icône tray : batterie / pourcentage / les deux + infobulle',
          'Widget de bureau facultatif (toujours visible, opacité, taille)',
          'Sélection de la souris : King Ultra, Blitz Ultimate, Fenrir Max, PRO X SUPERLIGHT',
          'Intervalle d’actualisation de 15 à 300 s et démarrage avec Windows',
          'Mise à jour automatique : recherche une nouvelle version au démarrage',
          'Fonctionne avec les Paramètres sur umdrivers.com lorsque l’application tray s’exécute sur le même PC',
        ],
        es: [
          'Icono de bandeja: batería / porcentaje / ambos + información emergente',
          'Widget de escritorio opcional (siempre visible, opacidad, tamaño)',
          'Selector de ratón: King Ultra, Blitz Ultimate, Fenrir Max, PRO X SUPERLIGHT',
          'Intervalo de actualización de 15-300 s e inicio con Windows',
          'Actualización automática: busca una versión nueva al iniciarse',
          'Funciona con los Ajustes de umdrivers.com cuando la aplicación de bandeja se ejecuta en el mismo PC',
        ],
        pt: [
          'Ícone na área de notificação: bateria / percentagem / ambos + descrição',
          'Widget opcional no ambiente de trabalho (sempre visível, opacidade, tamanho)',
          'Seletor de rato: King Ultra, Blitz Ultimate, Fenrir Max, PRO X SUPERLIGHT',
          'Intervalo de atualização de 15-300 s e arranque com o Windows',
          'Atualização automática: procura uma nova versão ao iniciar',
          'Funciona com as Definições em umdrivers.com quando a aplicação é executada no mesmo PC',
        ],
        it: [
          'Icona nell’area di notifica: batteria / percentuale / entrambe + descrizione',
          'Widget desktop opzionale (sempre in primo piano, opacità, dimensioni)',
          'Selezione del mouse: King Ultra, Blitz Ultimate, Fenrir Max, PRO X SUPERLIGHT',
          'Intervallo di aggiornamento di 15-300 s e avvio con Windows',
          'Aggiornamento automatico: verifica la disponibilità di una nuova versione all’avvio',
          'Funziona con le Impostazioni su umdrivers.com quando l’app è in esecuzione sullo stesso PC',
        ],
        zh: [
          '托盘图标：电池 / 百分比 / 两者同时显示 + 提示信息',
          '可选桌面小组件（始终置顶、透明度、尺寸）',
          '鼠标选择：King Ultra、Blitz Ultimate、Fenrir Max、PRO X SUPERLIGHT',
          '15-300 秒刷新间隔，并可随 Windows 启动',
          '自动更新：启动时检查新版本',
          '托盘程序与 umdrivers.com 在同一台 PC 上运行时，可配合网站“设置”使用',
        ],
        ja: [
          'トレイアイコン：バッテリー / パーセント / 両方 + ツールチップ',
          'オプションのデスクトップウィジェット（常に手前、透明度、サイズ）',
          'マウス選択：King Ultra、Blitz Ultimate、Fenrir Max、PRO X SUPERLIGHT',
          '15～300 秒の更新間隔と Windows 起動時の自動実行',
          '自動更新：起動時に新しいバージョンを確認',
          '同じ PC でトレイアプリが動作している場合、umdrivers.com の設定と連携',
        ],
        ko: [
          '트레이 아이콘: 배터리 / 퍼센트 / 둘 다 + 툴팁',
          '선택 사항인 데스크톱 위젯(항상 위, 투명도, 크기)',
          '마우스 선택: King Ultra, Blitz Ultimate, Fenrir Max, PRO X SUPERLIGHT',
          '15-300초 새로 고침 간격 및 Windows 시작 시 실행',
          '자동 업데이트: 시작할 때 새 버전 확인',
          '트레이 앱과 umdrivers.com이 같은 PC에서 실행될 때 웹 설정과 연동',
        ],
        ru: [
          'Значок в трее: батарея / проценты / оба варианта + подсказка',
          'Дополнительный виджет рабочего стола (поверх окон, прозрачность, размер)',
          'Выбор мыши: King Ultra, Blitz Ultimate, Fenrir Max, PRO X SUPERLIGHT',
          'Интервал обновления 15-300 с и запуск вместе с Windows',
          'Автообновление: проверка новой версии при запуске',
          'Работа с настройками на umdrivers.com, когда приложение запущено на том же ПК',
        ],
      },
    },
    {
      heading: {
        pl: 'Jak uruchomić',
        en: 'How to run',
        de: 'So startest du die Anwendung',
        fr: 'Comment lancer l’application',
        es: 'Cómo ejecutar la aplicación',
        pt: 'Como executar a aplicação',
        it: 'Come avviare l’applicazione',
        zh: '如何运行',
        ja: '起動方法',
        ko: '실행 방법',
        ru: 'Как запустить',
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
        de: [
          'Lade UmdBatteryTray.exe herunter und starte die Datei unter Windows. Schließe G HUB / OMM / OEM-Apps / Chrome WebHID, falls das Tray-Programm wegen exklusivem HID-Zugriff nicht auf die Maus zugreifen kann.',
          'Die UMD-Website ist in mehreren Sprachen verfügbar. Die Oberfläche des Tray-Programms selbst ist derzeit auf Englisch.',
        ],
        fr: [
          'Téléchargez UmdBatteryTray.exe et lancez-le sous Windows. Fermez G HUB / OMM / les applications OEM / Chrome WebHID si l’application tray ne parvient pas à ouvrir la souris en raison d’un accès HID exclusif.',
          'Le site UMD est disponible en plusieurs langues. L’interface de l’application tray elle-même est actuellement en anglais.',
        ],
        es: [
          'Descarga UmdBatteryTray.exe y ejecútalo en Windows. Cierra G HUB / OMM / las aplicaciones OEM / Chrome WebHID si la aplicación de bandeja no puede abrir el ratón debido al acceso HID exclusivo.',
          'El sitio de UMD está disponible en varios idiomas. La interfaz de la aplicación de bandeja está actualmente en inglés.',
        ],
        pt: [
          'Transfira UmdBatteryTray.exe e execute-o no Windows. Feche o G HUB / OMM / aplicações OEM / Chrome WebHID se a aplicação não conseguir abrir o rato devido ao acesso HID exclusivo.',
          'O site do UMD está disponível em vários idiomas. A interface da aplicação da área de notificação está atualmente em inglês.',
        ],
        it: [
          'Scarica UmdBatteryTray.exe e avvialo su Windows. Chiudi G HUB / OMM / le app OEM / Chrome WebHID se l’app non riesce ad accedere al mouse a causa dell’accesso HID esclusivo.',
          'Il sito UMD è disponibile in più lingue. L’interfaccia dell’app nell’area di notifica è attualmente in inglese.',
        ],
        zh: [
          '下载 UmdBatteryTray.exe 并在 Windows 中运行。如果托盘程序因 HID 独占访问而无法打开鼠标，请关闭 G HUB / OMM / OEM 应用 / Chrome WebHID。',
          'UMD 网站提供多种语言。托盘程序界面目前为英文。',
        ],
        ja: [
          'UmdBatteryTray.exe をダウンロードし、Windows で実行します。HID の排他アクセスが原因でトレイアプリがマウスを開けない場合は、G HUB / OMM / OEM アプリ / Chrome WebHID を終了してください。',
          'UMD サイトは複数言語に対応しています。トレイアプリ本体の UI は現在英語です。',
        ],
        ko: [
          'UmdBatteryTray.exe를 다운로드하여 Windows에서 실행하세요. 독점 HID 접근 때문에 트레이 앱이 마우스를 열지 못하면 G HUB / OMM / OEM 앱 / Chrome WebHID를 종료하세요.',
          'UMD 사이트는 여러 언어를 지원합니다. 트레이 앱 자체의 UI는 현재 영어입니다.',
        ],
        ru: [
          'Скачайте UmdBatteryTray.exe и запустите его в Windows. Закройте G HUB / OMM / приложения OEM / Chrome WebHID, если утилита не может открыть мышь из-за эксклюзивного доступа HID.',
          'Сайт UMD доступен на нескольких языках. Интерфейс самого приложения в трее пока остаётся на английском.',
        ],
      },
    },
  ] as SeoArticleBlock[],
  faqExtra: [
    {
      question: {
        pl: 'Czy tray zastępuje sterownik w przeglądarce?',
        en: 'Does the tray replace the browser driver?',
        de: 'Ersetzt das Tray-Programm den Browser-Treiber?',
        fr: 'L’application tray remplace-t-elle le pilote dans le navigateur ?',
        es: '¿La aplicación de bandeja sustituye al controlador del navegador?',
        pt: 'A aplicação da área de notificação substitui o driver no navegador?',
        it: 'L’app nell’area di notifica sostituisce il driver nel browser?',
        zh: '托盘程序会取代浏览器驱动吗？',
        ja: 'トレイアプリはブラウザドライバーの代わりになりますか？',
        ko: '트레이 앱이 브라우저 드라이버를 대체하나요?',
        ru: 'Приложение в трее заменяет браузерный драйвер?',
      },
      answer: {
        pl: 'Nie. Tray pokazuje baterię. DPI, przyciski i profile nadal ustawiasz na https://umdrivers.com w Chrome / Edge.',
        en: 'No. The tray shows battery. DPI, buttons and profiles still go through https://umdrivers.com in Chrome / Edge.',
        de: 'Nein. Das Tray-Programm zeigt den Akkustand an. DPI, Tasten und Profile stellst du weiterhin in Chrome / Edge auf https://umdrivers.com ein.',
        fr: 'Non. L’application tray affiche la batterie. Les DPI, les boutons et les profils se règlent toujours sur https://umdrivers.com dans Chrome / Edge.',
        es: 'No. La aplicación de bandeja muestra la batería. Los DPI, los botones y los perfiles se siguen configurando en https://umdrivers.com desde Chrome / Edge.',
        pt: 'Não. A aplicação da área de notificação mostra a bateria. Os DPI, botões e perfis continuam a ser configurados em https://umdrivers.com no Chrome / Edge.',
        it: 'No. L’app nell’area di notifica mostra la batteria. DPI, pulsanti e profili si configurano sempre su https://umdrivers.com in Chrome / Edge.',
        zh: '不会。托盘程序只显示电量。DPI、按键和配置文件仍需在 Chrome / Edge 中通过 https://umdrivers.com 设置。',
        ja: 'いいえ。トレイアプリはバッテリー残量を表示するものです。DPI、ボタン、プロファイルの設定は引き続き Chrome / Edge で https://umdrivers.com から行います。',
        ko: '아니요. 트레이 앱은 배터리를 표시합니다. DPI, 버튼, 프로필은 계속 Chrome / Edge에서 https://umdrivers.com 을 통해 설정합니다.',
        ru: 'Нет. Приложение в трее показывает заряд. DPI, кнопки и профили по-прежнему настраиваются на https://umdrivers.com в Chrome / Edge.',
      },
    },
    {
      question: {
        pl: 'Skąd wziąć aktualną wersję?',
        en: 'Where do I get the latest build?',
        de: 'Wo bekomme ich die neueste Version?',
        fr: 'Où télécharger la dernière version ?',
        es: '¿Dónde puedo descargar la última versión?',
        pt: 'Onde posso obter a versão mais recente?',
        it: 'Dove posso scaricare la versione più recente?',
        zh: '在哪里获取最新版本？',
        ja: '最新版はどこで入手できますか？',
        ko: '최신 버전은 어디에서 받을 수 있나요?',
        ru: 'Где скачать последнюю версию?',
      },
      answer: {
        pl: 'Przycisk pobierania na tej stronie albo na https://umdrivers.com/tray. Auto-update przy starcie trayu pobiera nowszą wersję z umdrivers.com.',
        en: 'The download button on this page or on https://umdrivers.com/tray. Auto-update on tray start fetches a newer build from umdrivers.com.',
        de: 'Über den Download-Button auf dieser Seite oder unter https://umdrivers.com/tray. Die automatische Aktualisierung sucht beim Start des Tray-Programms auf umdrivers.com nach einer neueren Version.',
        fr: 'Utilisez le bouton de téléchargement de cette page ou rendez-vous sur https://umdrivers.com/tray. Au démarrage, la mise à jour automatique récupère une version plus récente depuis umdrivers.com.',
        es: 'Usa el botón de descarga de esta página o visita https://umdrivers.com/tray. Al iniciarse, la actualización automática obtiene una versión más reciente desde umdrivers.com.',
        pt: 'Use o botão de transferência desta página ou aceda a https://umdrivers.com/tray. Ao iniciar, a atualização automática obtém uma versão mais recente a partir de umdrivers.com.',
        it: 'Usa il pulsante di download in questa pagina oppure visita https://umdrivers.com/tray. All’avvio, l’aggiornamento automatico scarica una versione più recente da umdrivers.com.',
        zh: '使用本页的下载按钮，或访问 https://umdrivers.com/tray。托盘程序启动时会通过自动更新从 umdrivers.com 获取新版本。',
        ja: 'このページのダウンロードボタン、または https://umdrivers.com/tray から入手できます。トレイアプリの起動時に、自動更新が umdrivers.com から新しいバージョンを取得します。',
        ko: '이 페이지의 다운로드 버튼 또는 https://umdrivers.com/tray 에서 받을 수 있습니다. 트레이 앱을 시작하면 자동 업데이트가 umdrivers.com에서 새 버전을 가져옵니다.',
        ru: 'Используйте кнопку загрузки на этой странице или перейдите на https://umdrivers.com/tray. При запуске автоматическое обновление загружает новую версию с umdrivers.com.',
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
    question: L(f.question, lang),
    answer: L(f.answer, lang),
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
