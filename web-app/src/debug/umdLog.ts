/** Forward client logs to Vite terminal + `.umd-debug.log`. */

type Level = 'info' | 'warn' | 'error'

function serialize(arg: unknown): unknown {
  if (arg instanceof Error) {
    return { name: arg.name, message: arg.message, stack: arg.stack }
  }
  if (arg instanceof Uint8Array) {
    return [...arg]
  }
  return arg
}

export function umdLog(tag: string, level: Level, ...args: unknown[]) {
  const line = [`[${tag}]`, ...args]
  if (level === 'error') console.error(...line)
  else if (level === 'warn') console.warn(...line)
  else console.info(...line)

  const body = JSON.stringify({
    t: Date.now(),
    tag,
    level,
    args: args.map(serialize),
  })
  try {
    void fetch('/__umd_log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => undefined)
  } catch {
    /* ignore */
  }
}
