import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve('web/src')
const brokenPrefix = "'use client'" + '\\n\\n'
const goodPrefix = "'use client'\n\n"

function walk(d, out = []) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(p)
  }
  return out
}

for (const f of walk(root)) {
  let c = fs.readFileSync(f, 'utf8')
  if (!c.includes(brokenPrefix)) continue
  fs.writeFileSync(f, c.split(brokenPrefix).join(goodPrefix))
  console.log('fixed prefix', path.relative(root, f))
}

const cp = path.join(root, 'pages/ConnectPage.tsx')
let c = fs.readFileSync(cp, 'utf8')
c = c.split('nav.push())').join("nav.push(lp('/device/sensor'))")
fs.writeFileSync(cp, c)
console.log('--- connect ---')
console.log(c.slice(0, 320))
