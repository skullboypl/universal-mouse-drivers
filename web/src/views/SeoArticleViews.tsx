import Link from 'next/link'
import { FaqSection } from '@/components/FaqSection'
import { JsonLd } from '@/components/JsonLd'
import type { Locale } from '@/i18n/locale'
import { t } from '@/i18n/messages'
import { L, Llist } from '@/lib/l10n'
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
      {blocks.map((b) => {
        const heading = L(b.heading, lang)
        return (
          <section key={heading} className={styles.block}>
            <h2>{heading}</h2>
            {Llist(b.paragraphs, lang).map((p) => (
              <p key={p.slice(0, 48)}>{p}</p>
            ))}
            {b.bullets ? (
              <ul>
                {Llist(b.bullets, lang).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        )
      })}
    </>
  )
}

export function WhySeoView({ lang }: { lang: Locale }) {
  return (
    <article className={styles.page}>
      <JsonLd data={faqJsonLd(lang)} />
      <p className={styles.crumb}>
        <Link href={`/${lang}`}>{t(lang, 'nav.siteNav')}</Link>
        {' / '}
        {L(WHY_UMD.eyebrow, lang)}
      </p>
      <p className={styles.eyebrow}>{L(WHY_UMD.eyebrow, lang)}</p>
      <h1 className={styles.h1}>{L(WHY_UMD.h1, lang)}</h1>
      <p className={styles.intro}>{L(WHY_UMD.intro, lang)}</p>
      <Blocks blocks={WHY_UMD.blocks} lang={lang} />
      <div className={styles.ctaRow}>
        <Link className={styles.cta} href={`/${lang}`}>
          {t(lang, 'connect.webhid')}
        </Link>
        <Link className={styles.ctaGhost} href={`/${lang}/tray`}>
          {t(lang, 'nav.tray')}
        </Link>
        <Link className={styles.ctaGhost} href={`/${lang}#mice`}>
          {t(lang, 'nav.mice')}
        </Link>
      </div>
      <FaqSection title={t(lang, 'connect.faqTitle')} items={faqForPage(lang)} />
    </article>
  )
}

export function TraySeoView({ lang }: { lang: Locale }) {
  return (
    <article className={styles.page}>
      <JsonLd data={faqJsonLd(lang, BATTERY_TRAY.faqExtra)} />
      <p className={styles.crumb}>
        <Link href={`/${lang}`}>{t(lang, 'nav.siteNav')}</Link>
        {' / '}
        {L(BATTERY_TRAY.eyebrow, lang)}
      </p>
      <p className={styles.eyebrow}>{L(BATTERY_TRAY.eyebrow, lang)}</p>
      <h1 className={styles.h1}>{L(BATTERY_TRAY.h1, lang)}</h1>
      <p className={styles.intro}>{L(BATTERY_TRAY.intro, lang)}</p>

      <div className={styles.shotGrid}>
        <figure className={styles.shot}>
          <img
            src="/screenshots/umd-homepage.png"
            alt={L(BATTERY_TRAY.h1, lang)}
            width={960}
            height={540}
            loading="lazy"
          />
          <figcaption>{t(lang, 'connect.trayTitle')}</figcaption>
        </figure>
        <figure className={styles.shot}>
          <img
            src="/screenshots/umd-battery-tray.png"
            alt={t(lang, 'connect.trayTitle')}
            width={960}
            height={540}
            loading="lazy"
          />
          <figcaption>{t(lang, 'nav.tray')}</figcaption>
        </figure>
      </div>

      <Blocks blocks={BATTERY_TRAY.blocks} lang={lang} />
      <div className={styles.ctaRow}>
        <a
          className={styles.cta}
          href={BATTERY_TRAY.downloadUrl}
          download="UmdBatteryTray.exe"
        >
          {t(lang, 'connect.trayDownload')}
        </a>
        <Link className={styles.ctaGhost} href={`/${lang}#tray`}>
          {t(lang, 'connect.trayTitle')}
        </Link>
        <Link className={styles.ctaGhost} href={`/${lang}`}>
          {t(lang, 'connect.webhid')}
        </Link>
      </div>
      <FaqSection
        title={t(lang, 'connect.faqTitle')}
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
  return (
    <article className={styles.page}>
      <JsonLd data={faqJsonLd(lang, article.faqExtra)} />
      <p className={styles.crumb}>
        <Link href={`/${lang}`}>{t(lang, 'nav.siteNav')}</Link>
        {' / '}
        <Link href={`/${lang}#mice`}>{t(lang, 'nav.mice')}</Link>
        {' / '}
        {L(article.eyebrow, lang)}
      </p>
      <div className={styles.heroRow}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>{L(article.eyebrow, lang)}</p>
          <h1 className={styles.h1}>{L(article.h1, lang)}</h1>
          <p className={styles.intro}>{L(article.intro, lang)}</p>
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
          {t(lang, 'connect.webhid')}
        </Link>
        <Link className={styles.ctaGhost} href={`/${lang}#mice`}>
          {t(lang, 'nav.mice')}
        </Link>
      </div>
      <FaqSection
        title={t(lang, 'connect.faqTitle')}
        items={faqForPage(lang, article.faqExtra)}
      />
    </article>
  )
}
