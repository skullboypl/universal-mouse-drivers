/**
 * Webpack (Next.js) resolves package "exports" with conditions that only
 * include `import` — many subpaths then fail with ERR_PACKAGE_PATH_NOT_EXPORTED.
 * Add `default` + `require` pointing at the same ESM file for every export map entry.
 */
const fs = require('fs')
const path = require('path')

const pkgPath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@openmouse',
  'protocol',
  'package.json',
)

if (!fs.existsSync(pkgPath)) {
  console.warn('[patch-openmouse-exports] @openmouse/protocol not installed — skip')
  process.exit(0)
}

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
let changed = 0
for (const [key, value] of Object.entries(pkg.exports || {})) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) continue
  const entry = value
  const target = entry.import || entry.default || entry.require
  if (!target || typeof target !== 'string') continue
  if (!entry.default) {
    entry.default = target
    changed++
  }
  if (!entry.require) {
    entry.require = target
    changed++
  }
  pkg.exports[key] = entry
}

if (changed > 0) {
  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`)
  console.log(`[patch-openmouse-exports] patched ${changed} export fields`)
} else {
  console.log('[patch-openmouse-exports] already patched')
}
