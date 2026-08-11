import Link from 'next/link'
import { FaqSection } from '@/components/FaqSection'
import { JsonLd } from '@/components/JsonLd'
import type { Locale } from '@/i18n/locale'
import {
  faqForPage,
  faqJsonLd,
  WHY_UMD,
  BATTERY_TRAY,
  type DeviceSeoArticle,
  type SeoArticleBlock,
} from '@/lib/seoContent'
import styles from './SeoArticle.module.css'

function Blocks({
  blocks,
  lang,
}: {
  blocks: SeoArticleBlock[]
  lang: Locale
}) {
  return (
    <>
      {blocks.map((b) => (
        <section key={b.heading[lang]} className={styles.block}>
          <h2>{b.heading[lang]}</h2>
          {b.paragraphs[lang].map((p) => (
            <p key={p.slice(0, 48)}>{p}</p>
          ))}
          {b.bullets ? (
            <ul>
              {b.bullets[lang].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </section>
      ))}
    </>
  )
}

export function WhySeoView({ lang }: { lang: Locale }) {
  const pl = lang === 'pl'
  return (
    <article className={styles.page}>
      <JsonLd data={faqJsonLd(lang)} />
      <p className={styles.crumb}>
        <Link href={`/${lang}`}>{pl ? 'Start' : 'Home'}</Link>
        {' / '}
        {WHY_UMD.eyebrow[lang]}
      </p>
      <p className={styles.eyebrow}>{WHY_UMD.eyebrow[lang]}</p>
      <h1 className={styles.h1}>{WHY_UMD.h1[lang]}</h1>
      <p className={styles.intro}>{WHY_UMD.intro[lang]}</p>
      <Blocks blocks={WHY_UMD.blocks} lang={lang} />
      <div className={styles.ctaRow}>
        <Link className={styles.cta} href={`/${lang}`}>
          {pl ? 'Otwórz sterownik' : 'Open driver'}
        </Link>
        <Link className={styles.ctaGhost} href={`/${lang}/tray`}>
          {pl ? 'Battery Tray' : 'Battery Tray'}
        </Link>
        <Link className={styles.ctaGhost} href={`/${lang}#mice`}>
          {pl ? 'Wspierane myszy' : 'Supported mice'}
        </Link>
      </div>
      <FaqSection title="FAQ" items={faqForPage(lang)} />
    </article>
  )
}

export function TraySeoView({ lang }: { lang: Locale }) {
  const pl = lang === 'pl'
  return (
    <article className={styles.page}>
      <JsonLd data={faqJsonLd(lang, BATTERY_TRAY.faqExtra)} />
      <p className={styles.crumb}>
        <Link href={`/${lang}`}>{pl ? 'Start' : 'Home'}</Link>
        {' / '}
        {BATTERY_TRAY.eyebrow[lang]}
      </p>
      <p className={styles.eyebrow}>{BATTERY_TRAY.eyebrow[lang]}</p>
      <h1 className={styles.h1}>{BATTERY_TRAY.h1[lang]}</h1>
      <p className={styles.intro}>{BATTERY_TRAY.intro[lang]}</p>

      <div className={styles.shotGrid}>
        <figure className={styles.shot}>
          <img
            src="/screenshots/umd-homepage.png"
            alt={
              pl
                ? 'Strona główna UMD w przeglądarce'
                : 'UMD homepage in the browser'
            }
            width={960}
            height={540}
            loading="lazy"
          />
          <figcaption>
            {pl ? 'Sterownik WebHID - strona główna' : 'WebHID driver - homepage'}
          </figcaption>
        </figure>
        <figure className={styles.shot}>
          <img
            src="/screenshots/umd-battery-tray.png"
            alt={
              pl
                ? 'UMD Battery Tray - ustawienia Windows'
                : 'UMD Battery Tray - Windows settings'
            }
            width={960}
            height={540}
            loading="lazy"
          />
          <figcaption>
            {pl
              ? 'Battery Tray - ustawienia i widget'
              : 'Battery Tray - settings and widget'}
          </figcaption>
        </figure>
      </div>

      <Blocks blocks={BATTERY_TRAY.blocks} lang={lang} />
      <div className={styles.ctaRow}>
        <a
          className={styles.cta}
          href={BATTERY_TRAY.downloadUrl}
          download="UmdBatteryTray.exe"
        >
          {pl ? 'Pobierz UmdBatteryTray.exe' : 'Download UmdBatteryTray.exe'}
        </a>
        <Link className={styles.ctaGhost} href={`/${lang}#tray`}>
          {pl ? 'Sekcja na start' : 'Homepage section'}
        </Link>
        <Link className={styles.ctaGhost} href={`/${lang}`}>
          {pl ? 'Otwórz sterownik' : 'Open driver'}
        </Link>
      </div>
      <FaqSection
        title="FAQ"
        items={faqForPage(lang, BATTERY_TRAY.faqExtra)}
      />
    </article>
  )
}

export function DeviceSeoView({
  lang,
  article,
  imageUrl,
}: {
  lang: Locale
  article: DeviceSeoArticle
  imageUrl?: string
}) {
  const pl = lang === 'pl'
  return (
    <article className={styles.page}>
      <JsonLd data={faqJsonLd(lang, article.faqExtra)} />
      <p className={styles.crumb}>
        <Link href={`/${lang}`}>{pl ? 'Start' : 'Home'}</Link>
        {' / '}
        <Link href={`/${lang}#mice`}>{pl ? 'Myszy' : 'Mice'}</Link>
        {' / '}
        {article.eyebrow[lang]}
      </p>
      <div className={styles.heroRow}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{article.eyebrow[lang]}</p>
          <h1 className={styles.h1}>{article.h1[lang]}</h1>
          <p className={styles.intro}>{article.intro[lang]}</p>
        </div>
        {imageUrl ? (
          <div className={styles.heroArt}>
            <img src={imageUrl} alt="" width={200} height={200} />
          </div>
        ) : null}
      </div>
      <Blocks blocks={article.blocks} lang={lang} />
      <div className={styles.ctaRow}>
        <Link className={styles.cta} href={`/${lang}`}>
          {pl ? 'Otwórz sterownik' : 'Open driver'}
        </Link>
        <Link className={styles.ctaGhost} href={`/${lang}/why`}>
          {pl ? 'Dlaczego UMD' : 'Why UMD'}
        </Link>
      </div>
      <FaqSection
        title="FAQ"
        items={faqForPage(lang, article.faqExtra)}
      />
    </article>
  )
}
