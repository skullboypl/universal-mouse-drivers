# OpenMouse SEO, catalog and UI roadmap

Updated: 2026-09-29

This file is the working checklist for fixing Google indexing and rebuilding the
OpenMouse catalog. Check an item only after its acceptance criteria pass.

## 1. Google indexing audit

- [x] Verify production `robots.txt` is reachable and permits public pages.
- [x] Verify production `sitemap.xml` is reachable.
- [x] Count sitemap URLs and identify the dominant page group.
- [x] Confirm the OpenMouse locale duplication problem.
- [x] Replace request-time `lastModified: new Date()` with honest stable dates or omit it.
- [x] Add complete HTML `hreflang` alternates to OpenMouse hub, brand and model metadata.
- [x] Remove duplicated site suffixes such as `UMD · UMD` from OpenMouse page titles.
- [x] Validate canonical, robots, language and status code for representative URLs.
- [x] Assess whether the sitemap needs splitting (it does not at current size).
- [x] Produce a Search Console submission and validation checklist.
- [x] Document why Google's general Indexing API must not be used as a bulk indexer
      for ordinary model pages.
- [x] Add Google Indexing API plumbing (`web/scripts/google-indexing.mjs`,
      `notify-openmouse-indexing.mjs`) wired into the sync workflow, gated on
      the `GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON` repo secret (attach the
      service-account JSON key later; no-ops until then).

Acceptance criteria:

- Every indexable URL returns HTTP 200 with a self-canonical URL.
- Every translated page exposes correct reciprocal `hreflang` links and `x-default`.
- Sitemap modification dates describe real content changes.
- No indexable page contains a language fallback presented as another language.

### Search Console rollout checklist

- [x] After the shared production build, run `node scripts/validate-openmouse-seo.mjs http://localhost:3000`
      from `web/` against a local server and resolve every reported issue.
- [ ] After deployment, run the same validator against `https://umdrivers.com`;
      check a sample of hub, brand and model URLs in Google URL Inspection.
- [ ] In the verified `https://umdrivers.com` Search Console property, submit
      `https://umdrivers.com/sitemap.xml` in **Sitemaps** and confirm **Success**.
- [ ] Compare the **Page indexing** report's discovered, crawled and indexed counts
      after Google has processed the sitemap; investigate excluded canonical or
      duplicate-language patterns by inspecting representative URLs.

Google's [sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
limits one uncompressed sitemap to 50 MB or 50,000 URLs and says `lastmod`
should reflect a significant content update. The current production sitemap has
2,684 URLs and is 4,264,391 bytes, so a split/index would add complexity without
meeting a size need. Google ignores sitemap `priority` and `changefreq` values.
The [Search Console Sitemaps report](https://support.google.com/webmasters/answer/7451001?hl=en)
accepts the published sitemap URL and shows fetch/parse errors. Submission does
not guarantee indexing. Google's [Indexing API](https://developers.google.com/search/apis/indexing-api/v3/using-api)
only supports pages with `JobPosting` or `BroadcastEvent` embedded in a
`VideoObject`; ordinary mouse model pages are outside its scope. Use the sitemap
for the catalog and URL Inspection for a small diagnostic sample.

## 2. Real translations for all supported locales

- [x] Add locale-specific OpenMouse copy for Polish, English, German, French,
      Spanish, Portuguese, Italian, Simplified Chinese, Japanese, Korean and Russian.
- [x] Translate model descriptions used in body copy and metadata.
- [x] Translate brand descriptions used in body copy and metadata.
- [x] Translate hub labels, search, filters, explanations and empty state.
- [x] Translate connection instructions on every model page.
- [x] Run a production build after the translation change.
- [x] Render and inspect one model page in every locale.
- [x] Add an automated check preventing English fallback on indexable non-English
      OpenMouse pages.

Acceptance criteria:

- All eleven locale pages contain language-appropriate visible copy and metadata.
- Locale-specific HTML builds without errors.

## 3. Per-device OpenMouse capabilities

- [x] Inspect the upstream driver registry and map each VID:PID to its driver.
- [x] Generate a stable per-device capability record during catalog generation.
- [x] Cover DPI read/write and range, polling rates, LOD, Motion Sync,
      Angle Snapping, Ripple Control, debounce, profiles, buttons, RGB and battery.
- [x] Mark runtime-only or device-dependent capabilities explicitly.
- [x] Show only capabilities proven by the matched driver definition.
- [ ] Add capability data to model metadata or structured data where useful.
- [x] Add generator fixture tests for representative driver families.

Acceptance criteria:

- A model page clearly states which controls are available before connecting.
- Unknown capabilities are labelled unknown, never inferred from the brand alone.
- Generated capability data stays reproducible from the pinned upstream revision.

## 4. Product images and fallback chain

- [x] Inspect the OpenMouse UI repository for model image assets and mappings.
- [x] Record upstream license and source revision for every imported asset.
- [ ] Reuse one verified image across wired/receiver HID variants of the same model.
- [ ] Store production images locally instead of hotlinking them.
- [x] Generate an image manifest with source, model and fallback type.
- [x] Implement the fallback chain:
  - [x] verified product image;
  - [x] upstream OpenMouse model graphic;
  - [x] brand logo;
  - [x] generic mouse silhouette with brand and model name.
- [x] Handle browser image failures without broken-image icons or layout shifts.
- [ ] Check all generated image paths for HTTP 200.

Acceptance criteria:

- Every catalog card and model page always has a valid visual.
- No missing upstream image can cause a 404 in the rendered page.
- Asset provenance is preserved in a machine-readable manifest.

## 5. Catalog and model-page redesign

Direction: a precise, dark product utility inspired by Wallhack Utility. Use the
reference for information hierarchy and restraint, without copying its branding.

- [x] Create a compact visual token set for surfaces, type, spacing and states.
- [x] Redesign catalog cards around the product image, model name and real support.
- [x] Give model pages a strong product viewport and a compact capabilities panel.
- [x] Move VID:PID and protocol diagnostics below the main product information.
- [x] Remove repeated pills, nested cards and decorative gradients.
- [x] Preserve search, brand filtering and keyboard navigation.
- [x] Add responsive layouts for phone, tablet and desktop.
- [x] Add visible keyboard focus and respect reduced-motion preferences.
- [x] Review screenshots at desktop and mobile widths before completion.

Acceptance criteria:

- Product identity and supported controls are understandable at a glance.
- The page remains useful with animation disabled.
- No broken visual, horizontal overflow or inaccessible control remains.

## 6. Daily OpenMouse synchronization

- [x] Add a daily scheduled workflow.
- [x] Replace the workflow's own `schedule:` cron with a self-dispatch from
      the running Next.js app (`web/instrumentation.ts` ->
      `web/src/lib/openmouseSyncScheduler.ts`), so no cron needs to be
      configured outside the app. The workflow keeps `workflow_dispatch` for
      manual runs; the heavy build/publish steps stay on GitHub's runners,
      never inside the hardened production container.
- [x] Check the upstream `mouse-protocol` revision and dependency lock.
- [x] Rebuild the HID catalog, capabilities and image mapping when upstream changes.
- [x] Produce a diff report listing added, changed and removed HID entries.
- [x] Run generator tests and the production Next.js build.
- [x] Prevent publishing when validation fails.
- [x] Define the safe publication route used by the current deployment.
- [x] Retain the previous generated catalog for rollback and comparison.
- [x] Add a manual workflow trigger for recovery and testing.

Acceptance criteria:

- The check runs at least once every 24 hours.
- A new supported HID reaches the generated app only with its matching protocol code.
- Failed updates leave the currently deployed catalog untouched.

## 7. Final validation and rollout

- [x] Run the full relevant test suite and production build.
- [x] Crawl local generated routes and verify status, metadata and image assets.
- [x] Compare sitemap URLs with indexable routes and canonical URLs.
- [ ] Deploy the validated change through the project's normal release path.
- [ ] Submit the new sitemap in Google Search Console.
- [ ] Request inspection for a small representative sample, not every URL.
- [ ] Monitor discovered, crawled and indexed counts for four weeks.
- [ ] Record follow-up findings and any rejected page patterns in this file.

## Evidence log

- 2026-09-29: generated capabilities from pinned `@openmouse/protocol` revision
  `f5e15a8c9990aab671f981a110e50da1cd16c23e` for 388 VID:PID entries.
  Registry probes identify one conditional driver for 375 entries, leave 8
  unknown, and mark 5 ambiguous. Synthetic HID descriptors cannot confirm a
  real device's command interface; all matches require connection validation.
  Four capability generator tests pass (VAXEE, Glorious Classic, unavailable
  placeholder setters, unknown VID:PID). `tsc --noEmit` currently fails in the
  unrelated `pro-x3-superstrike/protocol.test.ts` import extension (TS5097).

- 2026-09-29: production robots and sitemap returned HTTP 200.
- 2026-09-29: sitemap contained 2,684 URLs; 2,552 were OpenMouse routes.
- 2026-09-29: all sitemap entries used the same request-time modification timestamp.
- 2026-09-29: OpenMouse body copy used Polish for `pl` and English for every other
  locale, creating large groups of near-duplicate localized pages.
- 2026-09-29: full eleven-locale OpenMouse copy added locally.
- 2026-09-29: Next.js production build passed after the translation work.
- 2026-09-29: OpenMouse UI image mapping is in `src/ui/device-images.ts` at
  upstream revision `02d7b178664f6fb6799977375003b5a5c9b69417`; it resolves
  images from device-reported model names, while image bytes live in the
  separate `openmouse-devices` Cloudflare R2 bucket, not the Git repository.
- 2026-09-29: upstream code is AGPL-3.0, but `public/devices/README.md`
  describes product renders as third-party copyrighted artwork and repeatedly
  says to confirm redistribution terms. No upstream model image was therefore
  imported without an explicit rights record. See
  `web/src/devices/openmouse/product-images.provenance.json`.
- 2026-09-29: replaced the Bing image-search downloader with a local approved
  asset manifest and validator. It mapped 0 of 388 catalog HID entries because
  no model image currently has confirmed redistribution rights; cards and model
  pages now fall through product image -> upstream graphic -> brand logo ->
  inline local mouse silhouette. Broken brand logos fall back to the local
  generic icon or are hidden if that icon also fails.
- 2026-09-29: removed request-time `lastModified` from all generated sitemap
  entries because the project has no reliable per-page significant-update date.
- 2026-09-29: OpenMouse hub, brand and named-device metadata now use absolute
  self-canonicals, 11 reciprocal locale alternates plus `x-default` and absolute
  titles to bypass the root `· UMD` title template.
- 2026-09-29: targeted ESLint and `node --check` passed. The new validator checks
  all OpenMouse sitemap alternates and 33 rendered sample pages. Against the
  old production deployment it correctly reports 440 HTML metadata issues.
- 2026-09-29: `tsc --noEmit` remains blocked by an unrelated TS5097 import in
  `src/devices/mice/logitech/pro-x3-superstrike/protocol.test.ts:33`.
- 2026-09-29: integrated production build passed. Local SEO validation passed
  for 2,563 OpenMouse sitemap URLs and 33 rendered sample pages across all 11
  locales, including a guard against English metadata fallback. Desktop and
  390-pixel mobile browser reviews passed without broken layout or missing art.

- 2026-09-29: removed the workflow's `schedule:` cron; the app now
  self-dispatches it. Added Google Indexing API plumbing gated on a repo
  secret. Full site visual rebuild per DESIGN_RESEARCH_2026.md not started
  yet beyond this catalog/model redesign - see that document's "Zalecana
  kolejność wdrożenia" for the remaining phases.

