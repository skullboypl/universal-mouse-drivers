import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'

const root = path.dirname(fileURLToPath(import.meta.url))
const web = path.resolve(root, '..')
const svg = fs.readFileSync(path.join(web, 'public/favicon.svg'))
const tmp = path.join(web, 'public/_fav-build')
fs.mkdirSync(tmp, { recursive: true })

const sizes = [16, 32, 48, 180, 192, 512]
const pngs = []
for (const s of sizes) {
  const out = path.join(tmp, `icon-${s}.png`)
  await sharp(svg).resize(s, s).png().toFile(out)
  pngs.push(out)
  console.log('wrote', out)
}

await sharp(svg).resize(180, 180).png().toFile(path.join(web, 'src/app/apple-icon.png'))
await sharp(svg).resize(32, 32).png().toFile(path.join(web, 'src/app/icon.png'))

const icoBuf = await pngToIco([
  path.join(tmp, 'icon-16.png'),
  path.join(tmp, 'icon-32.png'),
  path.join(tmp, 'icon-48.png'),
])
fs.writeFileSync(path.join(web, 'src/app/favicon.ico'), icoBuf)
fs.writeFileSync(path.join(web, 'public/favicon.ico'), icoBuf)
console.log('favicon.ico bytes', icoBuf.length)

fs.rmSync(tmp, { recursive: true, force: true })
console.log('done')
