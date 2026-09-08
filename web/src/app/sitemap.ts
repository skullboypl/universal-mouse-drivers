import type { MetadataRoute } from 'next'
import { SEO_PAGES, absoluteUrl, localePath } from '@/lib/seo'
import { SITE } from '@/lib/site'
import {
  getOpenMouseBrands,
  getOpenMouseNamedEntries,
  OPENMOUSE_HUB_PATH,
  openMouseBrandPath,
  openMouseDevicePath,
} from '@/devices/openmouse/catalog'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const entries: MetadataRoute.Sitemap = []

  for (const page of Object.values(SEO_PAGES)) {
    if (page.index === false) continue
    for (const lang of SITE.locales) {
      const path = localePath(lang, page.path)
      entries.push({
        url: absoluteUrl(path),
        lastModified: now,
        changeFrequency: page.id === 'home' ? 'weekly' : 'monthly',
        priority:
          page.id === 'home'
            ? 1
            : page.id === 'why' || page.id === 'tray'
              ? 0.9
              : page.id.startsWith('mouse-')
                ? 0.85
                : 0.7,
        alternates: {
          languages: {
            ...Object.fromEntries(
              SITE.locales.map((loc) => [
                loc === 'zh' ? 'zh-CN' : loc,
                absoluteUrl(localePath(loc, page.path)),
              ]),
            ),
            'x-default': absoluteUrl(localePath('en', page.path)),
          },
        },
      })
    }
  }

  const omPaths = [
    OPENMOUSE_HUB_PATH,
    ...getOpenMouseBrands().map(openMouseBrandPath),
    ...getOpenMouseNamedEntries().map((e) =>
      openMouseDevicePath(e.brandSlug, e.slug),
    ),
  ]

  for (const omPath of omPaths) {
    for (const lang of SITE.locales) {
      const path = localePath(lang, omPath)
      entries.push({
        url: absoluteUrl(path),
        lastModified: now,
        changeFrequency: 'weekly',
        priority: omPath === OPENMOUSE_HUB_PATH ? 0.88 : 0.8,
        alternates: {
          languages: {
            ...Object.fromEntries(
              SITE.locales.map((loc) => [
                loc === 'zh' ? 'zh-CN' : loc,
                absoluteUrl(localePath(loc, omPath)),
              ]),
            ),
            'x-default': absoluteUrl(localePath('en', omPath)),
          },
        },
      })
    }
  }

  return entries
}
