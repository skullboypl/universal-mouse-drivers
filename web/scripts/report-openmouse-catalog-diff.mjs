import fs from 'node:fs'
import path from 'node:path'

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [key, ...rest] = arg.replace(/^--/, '').split('=')
    return [key, rest.join('=')]
  }),
)

for (const required of ['before', 'after', 'output']) {
  if (!args[required]) throw new Error(`Missing --${required}=...`)
}

function catalog(file) {
  const source = fs.readFileSync(file, 'utf8')
  const entries = new Map()
  const stringField = (line, name) =>
    line.match(new RegExp(`(?:^|[, {])${name}: "([^"]*)"`))?.[1]
  const numberField = (line, name) => {
    const raw = line.match(new RegExp(`(?:^|[, {])${name}: (\\d+)`))?.[1]
    return raw == null ? null : Number(raw)
  }
  for (const line of source.split(/\r?\n/)) {
    if (!/^\s*\{ id:/.test(line)) continue
    const id = stringField(line, 'id')
    if (!id) continue
    entries.set(id, {
      id,
      brand: stringField(line, 'brand') ?? '',
      slug: stringField(line, 'slug') ?? '',
      name: stringField(line, 'name') ?? '',
      vendorId: numberField(line, 'vendorId') ?? 0,
      productId: numberField(line, 'productId') ?? 0,
      usagePage: numberField(line, 'usagePage'),
      usage: numberField(line, 'usage'),
    })
  }
  return entries
}

function hex(value) {
  return value.toString(16).toUpperCase().padStart(4, '0')
}

function label(entry) {
  return `${entry.brand} ${entry.name} (${hex(entry.vendorId)}:${hex(entry.productId)})`
}

const before = catalog(path.resolve(args.before))
const after = catalog(path.resolve(args.after))
const added = [...after.values()].filter((entry) => !before.has(entry.id))
const removed = [...before.values()].filter((entry) => !after.has(entry.id))
const changed = [...after.values()].filter((entry) => {
  const old = before.get(entry.id)
  return old && JSON.stringify(old) !== JSON.stringify(entry)
})

const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
const lines = [
  '# OpenMouse synchronization report',
  '',
  `Generated: ${timestamp}`,
  '',
  `Previous entries: ${before.size}`,
  `Current entries: ${after.size}`,
  `Added: ${added.length}`,
  `Changed: ${changed.length}`,
  `Removed: ${removed.length}`,
  '',
]

for (const [title, entries] of [
  ['Added devices', added],
  ['Changed devices', changed],
  ['Removed devices', removed],
]) {
  lines.push(`## ${title}`, '')
  if (!entries.length) lines.push('- None')
  else for (const entry of entries) lines.push(`- ${label(entry)}`)
  lines.push('')
}

fs.writeFileSync(path.resolve(args.output), `${lines.join('\n')}\n`)
console.log(`OpenMouse diff: +${added.length} ~${changed.length} -${removed.length}`)

