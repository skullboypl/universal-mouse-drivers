import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/** Mirror browser [webhid]/[driver] logs into the Vite terminal + file. */
function umdLogBridge(): Plugin {
  const logFile = path.resolve(__dirname, '.umd-debug.log')
  return {
    name: 'umd-log-bridge',
    configureServer(server) {
      server.middlewares.use('/__umd_log', (req, res, next) => {
        if (req.method !== 'POST') return next()
        const chunks: Buffer[] = []
        req.on('data', (c) => chunks.push(c))
        req.on('end', () => {
          try {
            const raw = Buffer.concat(chunks).toString('utf8')
            const msg = JSON.parse(raw) as {
              t?: number
              tag?: string
              level?: string
              args?: unknown[]
            }
            const ts = new Date(msg.t ?? Date.now()).toISOString().slice(11, 23)
            const tag = msg.tag ?? '?'
            const level = msg.level ?? 'info'
            const args = msg.args ?? []
            const line = `[umd ${ts}] [${tag}] ${args
              .map((a) =>
                typeof a === 'string' ? a : JSON.stringify(a, null, 0),
              )
              .join(' ')}`
            if (level === 'error') console.error(line)
            else if (level === 'warn') console.warn(line)
            else console.info(line)
            fs.appendFileSync(logFile, line + '\n', 'utf8')
          } catch (e) {
            console.error('[umd-log] bad payload', e)
          }
          res.statusCode = 204
          res.end()
        })
      })
      console.info(`[umd-log] writing → ${logFile}`)
      fs.writeFileSync(
        logFile,
        `# umd debug log started ${new Date().toISOString()}\n`,
        'utf8',
      )
    },
  }
}

export default defineConfig({
  plugins: [
    react({
      // Disable Fast Refresh — broken when WS/HMR cannot connect in this environment
      fastRefresh: false,
    }),
    umdLogBridge(),
  ],
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    hmr: false,
    headers: {
      'Cache-Control': 'no-store',
    },
  },
  clearScreen: false,
})
