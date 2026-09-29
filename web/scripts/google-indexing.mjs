/**
 * Minimal Google Indexing API v3 client (service-account JWT, no dependency
 * on `googleapis`). See https://developers.google.com/search/apis/indexing-api/v3/using-api
 *
 * IMPORTANT: Google states this API only guarantees processing for pages
 * marked up as JobPosting or a BroadcastEvent inside a VideoObject. Ordinary
 * catalog/model pages are outside its documented scope - Google may accept
 * the call and still ignore it. Calling it anyway is harmless (Google either
 * queues it or drops it); the sitemap + Search Console URL Inspection remain
 * the reliable path for these pages (see OPENMOUSE_SEO_ROADMAP.md).
 */
import { createSign } from 'node:crypto'

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

/** @param {{client_email: string, private_key: string}} account */
async function getAccessToken(account) {
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const now = Math.floor(Date.now() / 1000)
  const claims = base64url(
    JSON.stringify({
      iss: account.client_email,
      scope: 'https://www.googleapis.com/auth/indexing',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  )
  const signature = createSign('RSA-SHA256')
    .update(`${header}.${claims}`)
    .sign(account.private_key)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
  const jwt = `${header}.${claims}.${signature}`

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  if (!res.ok) throw new Error(`token exchange failed: ${res.status} ${await res.text()}`)
  return (await res.json()).access_token
}

/**
 * @param {string} url
 * @param {string} accessToken
 * @param {'URL_UPDATED' | 'URL_DELETED'} type
 */
async function publishUrlNotification(url, accessToken, type = 'URL_UPDATED') {
  const res = await fetch('https://indexing.googleapis.com/v3/urlNotifications:publish', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url, type }),
  })
  return { url, ok: res.ok, status: res.status, body: await res.text().catch(() => '') }
}

/**
 * Notifies Google for every URL, reusing one access token. Never throws for
 * an individual URL failure; returns per-URL results so the caller can log
 * and continue.
 * @param {string[]} urls
 * @param {{client_email: string, private_key: string}} account
 */
export async function notifyGoogleIndexing(urls, account) {
  if (urls.length === 0) return []
  const accessToken = await getAccessToken(account)
  const results = []
  for (const url of urls) {
    try {
      results.push(await publishUrlNotification(url, accessToken))
    } catch (err) {
      results.push({ url, ok: false, status: 0, body: String(err) })
    }
  }
  return results
}

/** Parses GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON, or returns null if unset/invalid. */
export function readServiceAccountFromEnv(env = process.env) {
  const raw = env.GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!parsed.client_email || !parsed.private_key) return null
    return parsed
  } catch {
    return null
  }
}
