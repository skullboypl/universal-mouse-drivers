/**
 * Webpack (Next.js) resolves package "exports" with conditions that only
 * include `import` - many subpaths then fail with ERR_PACKAGE_PATH_NOT_EXPORTED.
 * Add `default` + `require` pointing at the same ESM file for every export map entry.
 *
 * Also strip CommonJS `module.exports` footers from ESM files that OpenMouse still
 * ships (Orbital host-protocol) — webpack evaluates them in the browser and throws
 * "exports is not defined", which aborts OpenMouse createSupportedClient.
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..', 'node_modules', '@openmouse', 'protocol')
const pkgPath = path.join(root, 'package.json')

if (!fs.existsSync(pkgPath)) {
  console.warn('[patch-openmouse-exports] @openmouse/protocol not installed - skip')
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

/** ESM files that still append CommonJS export footers. */
const cjsFooterFiles = [
  path.join(root, 'dist', 'drivers', 'orbital', 'host-protocol.js'),
]

let stripped = 0
for (const file of cjsFooterFiles) {
  if (!fs.existsSync(file)) continue
  const before = fs.readFileSync(file, 'utf8')
  const after = before
    .replace(
      /\r?\nif\s*\(\s*typeof\s+module\s*!==\s*["']undefined["']\s*&&\s*module\.exports\s*\)\s*\{\s*module\.exports\s*=\s*[^;]+;\s*\}\r?\n?/g,
      '\n',
    )
    .replace(
      /\r?\nif\s*\(\s*typeof\s+exports\s*!==\s*["']undefined["']\s*\)\s*\{[\s\S]*?\}\r?\n?/g,
      '\n',
    )
  if (after !== before) {
    fs.writeFileSync(file, after)
    stripped++
    console.log(
      `[patch-openmouse-exports] stripped CJS footer: ${path.relative(root, file)}`,
    )
  }
}
if (stripped === 0) {
  console.log('[patch-openmouse-exports] no CJS footers to strip')
}
