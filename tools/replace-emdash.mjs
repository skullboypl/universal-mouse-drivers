import fs from 'node:fs'
import path from 'node:path'

const roots = ['web/src', 'tray-battery', 'README.md', 'CAPROVER.md']
const EM = '\u2014'

function walk(p, out = []) {
  const st = fs.statSync(p)
  if (st.isFile()) {
    out.push(p)
    return out
  }
  for (const e of fs.readdirSync(p)) {
    if (['node_modules', '.next', 'bin', 'obj', 'publish'].includes(e)) continue
    walk(path.join(p, e), out)
  }
  return out
}

let count = 0
for (const r of roots) {
  if (!fs.existsSync(r)) continue
  const files = fs.statSync(r).isFile()
    ? [r]
    : walk(r).filter((f) => /\.(ts|tsx|js|mjs|md|cs|csproj|json|css)$/i.test(f))
  for (const f of files) {
    const c = fs.readFileSync(f, 'utf8')
    if (!c.includes(EM)) continue
    fs.writeFileSync(f, c.split(EM).join('-'))
    count++
    console.log(f)
  }
}
console.log('updated', count)
