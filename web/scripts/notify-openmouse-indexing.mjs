/**
 * Notifies Google's Indexing API for OpenMouse model pages that were added
 * or changed by this sync run. No-op (exit 0) when
 * GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON is not set, so this step never fails
 * a run before the key is attached (see CAPROVER.md).
 *
 * Usage: node scripts/notify-openmouse-indexing.mjs --before=<file> --after=<file> [--locales=pl,en]
 */
import fs from 'node:fs'
import path from 'node:path'
import { notifyGoogleIndexing, readServiceAccountFromEnv } from './google-indexing.mjs'

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, '').split('=')
    return [key, rest.join('=')]
  }),
)
for (const required of ['before', 'after']) {
  if (!args[required]) throw new Error(`Missing --${required}=...`)
}

const account = readServiceAccountFromEnv()
if (!account) {
  console.log(
    'notify-openmouse-indexing: GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON not set, skipping.',
  )
  process.exit(0)
}

function catalog(file) {
  const source = fs.readFileSync(file, 'utf8')
  const entries = new Map()
  const stringField = (line, name) =>
    line.match(new RegExp(`(?:^|[, {])${name}: "([^"]*)"`))?.[1]
  for (const line of source.split(/\r?\n/)) {
    if (!/^\s*\{ id:/.test(line)) continue
    const id = stringField(line, 'id')
    if (!id) continue
    entries.set(id, {
      id,
      brandSlug: stringField(line, 'brandSlug') ?? '',
      slug: stringField(line, 'slug') ?? '',
      hasProductName: /hasProductName: true/.test(line),
    })
  }
  return entries
}

const before = catalog(path.resolve(args.before))
const after = catalog(path.resolve(args.after))
const changed = [...after.values()].filter((entry) => {
  if (!entry.hasProductName) return false
  const old = before.get(entry.id)
  return !old || JSON.stringify(old) !== JSON.stringify(entry)
})

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://umdrivers.com').replace(/\/$/, '')
// Keep the request count modest (Indexing API default quota is 200/day);
// x-default(pl) + en cover discovery for the rest via hreflang.
const locales = (args.locales ?? 'pl,en').split(',').filter(Boolean)
const seen = new Set()
const urls = []
for (const entry of changed) {
  for (const locale of locales) {
    const url = `${siteUrl}/${locale}/mice/openmouse/${entry.brandSlug}/${entry.slug}`
    if (seen.has(url)) continue
    seen.add(url)
    urls.push(url)
  }
}

if (urls.length === 0) {
  console.log('notify-openmouse-indexing: no changed named devices.')
  process.exit(0)
}

const results = await notifyGoogleIndexing(urls, account)
const failed = results.filter((r) => !r.ok)
for (const r of results) {
  console.log(`${r.ok ? 'OK' : 'FAIL'} ${r.status} ${r.url}`)
}
console.log(`notify-openmouse-indexing: ${results.length - failed.length}/${results.length} accepted.`)
if (failed.length > 0) {
  console.log(
    'Non-fatal: Google only guarantees Indexing API processing for JobPosting/BroadcastEvent ' +
      'pages, so rejections for ordinary model pages are expected. See OPENMOUSE_SEO_ROADMAP.md.',
  )
}
