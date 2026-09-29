/** Validate a built/deployed OpenMouse site's sitemap and rendered metadata. */
const origin = process.argv[2]
if (!origin) {
  console.error('Usage: node scripts/validate-openmouse-seo.mjs https://umdrivers.com')
  process.exit(2)
}

const base = new URL(origin).origin
const locales = ['pl', 'en', 'de', 'fr', 'es', 'pt', 'it', 'zh', 'ja', 'ko', 'ru']
const langTag = (locale) => locale === 'zh' ? 'zh-CN' : locale
const expectedLanguages = [...locales.map(langTag), 'x-default']
const errors = []

function onTargetOrigin(value) {
  const url = new URL(value, base)
  return `${base}${url.pathname}${url.search}`
}

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}=["']([^"']*)["']`, 'i'))
  return match?.[1]
}

function links(markup, rel) {
  return [...markup.matchAll(/<link\b[^>]*>/gi)]
    .map(([tag]) => tag)
    .filter((tag) => attribute(tag, 'rel') === rel)
}

async function read(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`)
  return response.text()
}

function expectedLinks(path) {
  return Object.fromEntries(expectedLanguages.map((language) => [
    language,
    `${base}/${language === 'x-default' ? 'en' : language === 'zh-CN' ? 'zh' : language}${path}`,
  ]))
}

const xml = await read(`${base}/sitemap.xml`)
const sitemapUrls = new Map()
for (const [, block] of xml.matchAll(/<url>([\s\S]*?)<\/url>/g)) {
  const loc = block.match(/<loc>([^<]+)<\/loc>/)?.[1]
  if (loc) sitemapUrls.set(onTargetOrigin(loc), block)
}

const openMouseUrls = [...sitemapUrls.keys()].filter((url) =>
  /^\/(?:pl|en|de|fr|es|pt|it|zh|ja|ko|ru)\/mice\/openmouse(?:\/|$)/.test(new URL(url).pathname),
)
if (!openMouseUrls.length) errors.push('Sitemap has no OpenMouse URLs')

for (const url of openMouseUrls) {
  const pathname = new URL(url).pathname
  const path = pathname.replace(/^\/(?:pl|en|de|fr|es|pt|it|zh|ja|ko|ru)/, '')
  const expected = expectedLinks(path)
  const sitemapBlock = sitemapUrls.get(url)
  const alternates = [...sitemapBlock.matchAll(/<xhtml:link\b[^>]*\/>/g)].map(([tag]) => tag)
  const found = new Map(alternates.map((tag) => [
    attribute(tag, 'hreflang'),
    onTargetOrigin(attribute(tag, 'href')),
  ]))
  for (const [language, href] of Object.entries(expected)) {
    if (found.get(language) !== href) errors.push(`${url}: sitemap ${language} is ${found.get(language) ?? 'missing'}`)
    if (!sitemapUrls.has(href)) errors.push(`${url}: alternate ${href} is missing from sitemap`)
  }
  if (found.size !== expectedLanguages.length) errors.push(`${url}: sitemap has ${found.size} language links`)
}

const englishPaths = openMouseUrls.map((url) => new URL(url).pathname)
const hub = '/en/mice/openmouse'
const brand = englishPaths.find((path) => /^\/en\/mice\/openmouse\/[^/]+$/.test(path))
const device = englishPaths.find((path) => /^\/en\/mice\/openmouse\/[^/]+\/[^/]+$/.test(path))
for (const sample of [hub, brand, device]) {
  if (!sample) {
    errors.push('Sitemap has no hub, brand, or named device sample')
    continue
  }
  const path = sample.replace(/^\/en/, '')
  const expected = expectedLinks(path)
  const descriptions = new Map()
  for (const locale of locales) {
    const url = `${base}/${locale}${path}`
    let html
    try {
      html = await read(url)
    } catch (error) {
      errors.push(String(error))
      continue
    }
    const actualLang = attribute(html.match(/<html\b[^>]*>/i)?.[0] ?? '', 'lang')
    if (actualLang !== langTag(locale)) errors.push(`${url}: html lang is ${actualLang ?? 'missing'}`)
    const canonicals = links(html, 'canonical').map((tag) => onTargetOrigin(attribute(tag, 'href')))
    if (canonicals.length !== 1 || canonicals[0] !== url) errors.push(`${url}: invalid self-canonical ${canonicals.join(', ')}`)
    const alternates = new Map(links(html, 'alternate').map((tag) => [
      attribute(tag, 'hreflang'), onTargetOrigin(attribute(tag, 'href')),
    ]))
    for (const [language, href] of Object.entries(expected)) {
      if (alternates.get(language) !== href) errors.push(`${url}: HTML ${language} is ${alternates.get(language) ?? 'missing'}`)
    }
    if (alternates.size !== expectedLanguages.length) errors.push(`${url}: HTML has ${alternates.size} language links`)
    const title = html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? ''
    if (!title || /\bUMD\s*[·|:-]\s*UMD\b/i.test(title)) errors.push(`${url}: invalid title ${title}`)
    const descriptionTag = [...html.matchAll(/<meta\b[^>]*>/gi)]
      .map(([tag]) => tag)
      .find((tag) => attribute(tag, 'name') === 'description')
    descriptions.set(locale, attribute(descriptionTag ?? '', 'content') ?? '')
    if (/<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html)) errors.push(`${url}: noindex`)
  }
  const englishDescription = descriptions.get('en')
  for (const locale of locales.filter((value) => value !== 'en')) {
    if (!descriptions.get(locale) || descriptions.get(locale) === englishDescription) {
      errors.push(`${base}/${locale}${path}: description falls back to English`)
    }
  }
}

if (errors.length) {
  console.error(`OpenMouse SEO validation failed (${errors.length} issues):`)
  for (const error of errors.slice(0, 50)) console.error(`- ${error}`)
  if (errors.length > 50) console.error(`... and ${errors.length - 50} more`)
  process.exit(1)
}

console.log(`OpenMouse SEO valid: ${openMouseUrls.length} sitemap URLs, ${locales.length * 3} rendered sample pages`)
