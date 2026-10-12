'use client'

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import type { ViperV4DynModeId } from '../../devices/mice/razer/viper-v4-pro/protocol'
import {
  sampleDynSensCurve,
  VIPER_V4_DYN_SENS_CURVES,
  type DynSensPoint,
} from '../../devices/mice/razer/viper-v4-pro/dynSensCurves'
import css from './ViperV4Workspace.module.css'

const W = 520
const H = 220
const PAD = { l: 44, r: 16, t: 18, b: 36 }

/**
 * Cursor px/ms that maps to chart speed 100.
 * Lower = more sensitive live marker (flicks fill the axis sooner).
 * Chart is a preview of the curve vs on-screen cursor speed — real DynSens
 * scaling runs on-device from sensor velocity when mode is written (0b/10·11).
 */
const SPEED_REF_PX_MS = 2.4
const Y_MIN_EDIT = 0.5
const Y_MAX_EDIT = 2.0

function xToPx(x: number) {
  return PAD.l + (x / 100) * (W - PAD.l - PAD.r)
}

function yToPx(y: number, yMin: number, yMax: number) {
  const t = (y - yMin) / Math.max(1e-6, yMax - yMin)
  return PAD.t + (1 - t) * (H - PAD.t - PAD.b)
}

function pxToX(px: number) {
  return Math.max(0, Math.min(100, ((px - PAD.l) / (W - PAD.l - PAD.r)) * 100))
}

function pxToY(py: number, yMin: number, yMax: number) {
  const t = 1 - (py - PAD.t) / (H - PAD.t - PAD.b)
  return Math.max(yMin, Math.min(yMax, yMin + t * (yMax - yMin)))
}

function buildPath(points: DynSensPoint[], yMin: number, yMax: number) {
  if (points.length === 0) return ''
  const samples: string[] = []
  for (let x = 0; x <= 100; x += 1) {
    const y = sampleDynSensCurve(points, x)
    const cmd = x === 0 ? 'M' : 'L'
    samples.push(`${cmd}${xToPx(x).toFixed(1)} ${yToPx(y, yMin, yMax).toFixed(1)}`)
  }
  return samples.join(' ')
}

function clonePoints(points: DynSensPoint[]): DynSensPoint[] {
  return points.map((p) => ({ x: p.x, y: p.y }))
}

function movePoint(
  points: DynSensPoint[],
  index: number,
  next: DynSensPoint,
): DynSensPoint[] {
  const out = clonePoints(points)
  const first = 0
  const last = out.length - 1
  if (index <= first) {
    out[first] = { x: 0, y: next.y }
    return out
  }
  if (index >= last) {
    out[last] = { x: 100, y: next.y }
    return out
  }
  const minX = (out[index - 1]?.x ?? 0) + 1
  const maxX = (out[index + 1]?.x ?? 100) - 1
  out[index] = {
    x: Math.max(minX, Math.min(maxX, next.x)),
    y: next.y,
  }
  return out
}

export function DynSensChart({
  mode,
  pl,
}: {
  mode: ViperV4DynModeId
  pl: boolean
}) {
  const gradId = useId().replace(/:/g, '')
  const svgRef = useRef<SVGSVGElement | null>(null)
  const lastPtr = useRef<{ t: number } | null>(null)
  const speedRef = useRef(0)
  const dragRef = useRef<{ index: number; pointerId: number } | null>(null)
  const [speed, setSpeed] = useState(0)
  const [customPoints, setCustomPoints] = useState<DynSensPoint[]>(() =>
    clonePoints(VIPER_V4_DYN_SENS_CURVES.custom.pointList),
  )
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  const editable = mode === 'custom'

  // Idle decay of live speed (keeps marker honest when you stop moving).
  useEffect(() => {
    if (mode === 'off') return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.max(1, now - last)
      last = now
      if (!dragRef.current) {
        const idle = !lastPtr.current || now - lastPtr.current.t > 40
        if (idle && speedRef.current > 0.05) {
          speedRef.current *= Math.exp(-dt / 160)
          if (speedRef.current < 0.05) speedRef.current = 0
          setSpeed(speedRef.current)
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [mode])

  const ingestDelta = useCallback((movementX: number, movementY: number, dtMs: number) => {
    const dist = Math.hypot(movementX, movementY)
    if (dist < 0.35) return
    const dt = Math.max(4, Math.min(dtMs, 48))
    const pxPerMs = dist / dt
    const mapped = Math.min(100, (pxPerMs / SPEED_REF_PX_MS) * 100)
    const next =
      mapped >= speedRef.current
        ? speedRef.current * 0.2 + mapped * 0.8
        : speedRef.current * 0.5 + mapped * 0.5
    speedRef.current = next
    setSpeed(next)
  }, [])

  // Page-wide live speed — any mouse move on the window (not a tiny pad).
  useEffect(() => {
    if (mode === 'off') return
    const onMove = (e: PointerEvent) => {
      if (dragRef.current) return
      if (e.pointerType && e.pointerType !== 'mouse') return
      const now = performance.now()
      const prev = lastPtr.current
      lastPtr.current = { t: now }
      const dt = prev ? now - prev.t : 16
      ingestDelta(e.movementX, e.movementY, dt)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [mode, ingestDelta])

  const clientToSvg = (clientX: number, clientY: number) => {
    const svg = svgRef.current
    if (!svg) return null
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    const ctm = svg.getScreenCTM()
    if (!ctm) return null
    const local = pt.matrixTransform(ctm.inverse())
    return { x: local.x, y: local.y }
  }

  const onPointPointerDown = (
    e: ReactPointerEvent<SVGCircleElement>,
    index: number,
  ) => {
    if (!editable) return
    e.preventDefault()
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture(e.pointerId)
    dragRef.current = { index, pointerId: e.pointerId }
    setDragIndex(index)
  }

  const onPointPointerMove = (e: ReactPointerEvent<SVGCircleElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    const local = clientToSvg(e.clientX, e.clientY)
    if (!local) return
    const yMin = Y_MIN_EDIT
    const yMax = Y_MAX_EDIT
    setCustomPoints((prev) =>
      movePoint(prev, drag.index, {
        x: pxToX(local.x),
        y: pxToY(local.y, yMin, yMax),
      }),
    )
  }

  const onPointPointerUp = (e: ReactPointerEvent<SVGCircleElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== e.pointerId) return
    dragRef.current = null
    setDragIndex(null)
    try {
      ;(e.target as Element).releasePointerCapture(e.pointerId)
    } catch {
      /* already released */
    }
  }

  if (mode === 'off') {
    return (
      <div className={css.dynOff}>
        <p className={css.dynOffTitle}>
          {pl ? 'Dynamic Sensitivity wyłączone' : 'Dynamic Sensitivity off'}
        </p>
        <p className={css.dynOffBody}>
          {pl
            ? 'Wybierz Classic, Natural, Jump albo Custom. Na urządzeniu sens rośnie/maleje z prędkością ruchu sensora.'
            : 'Pick Classic, Natural, Jump, or Custom. On-device sensitivity scales with sensor velocity.'}
        </p>
      </div>
    )
  }

  const preset = VIPER_V4_DYN_SENS_CURVES[mode]
  const points = editable ? customPoints : preset.pointList
  const yMin = Math.min(Y_MIN_EDIT, ...points.map((p) => p.y)) - 0.05
  const yMax = Math.max(Y_MAX_EDIT, ...points.map((p) => p.y)) + 0.05
  const path = buildPath(points, yMin, yMax)
  const mult = sampleDynSensCurve(points, speed)
  const markerX = xToPx(speed)
  const markerY = yToPx(mult, yMin, yMax)

  return (
    <div className={css.dynPanel}>
      <div className={css.dynMeta}>
        <strong>{pl ? preset.labelPl : preset.label}</strong>
        <span>
          {editable
            ? pl
              ? 'Przeciągnij zielone punkty. Marker śledzi prędkość kursora na całej stronie (podgląd krzywej).'
              : 'Drag the green points. The marker tracks cursor speed page-wide (curve preview).'
            : pl
              ? preset.blurbPl
              : preset.blurb}
        </span>
      </div>

      <div
        className={css.dynLiveBanner}
        aria-live="polite"
        style={{
          ['--dyn-speed' as string]: String(Math.min(1, speed / 100)),
        }}
      >
        <span className={css.dynLivePulse} />
        <span>
          {pl
            ? 'Ruszaj myszą gdziekolwiek na stronie — podgląd prędkości na żywo'
            : 'Move the mouse anywhere on the page — live speed preview'}
        </span>
        <span className={css.dynLiveStats}>
          {Math.round(speed)} · ×{mult.toFixed(2)}
        </span>
      </div>

      <div className={css.dynChartWrap}>
        <svg
          ref={svgRef}
          className={css.dynChart}
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={
            pl
              ? `Wykres ${preset.labelPl}: czułość względem prędkości`
              : `${preset.label} curve: sensitivity vs mouse speed`
          }
        >
          <defs>
            <linearGradient id={`fill-${gradId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#44d62c" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#44d62c" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {[0, 25, 50, 75, 100].map((gx) => (
            <line
              key={`vx-${gx}`}
              x1={xToPx(gx)}
              x2={xToPx(gx)}
              y1={PAD.t}
              y2={H - PAD.b}
              className={css.dynGrid}
            />
          ))}
          {[1, 1.25, 1.5].map((gy) => (
            <line
              key={`hy-${gy}`}
              x1={PAD.l}
              x2={W - PAD.r}
              y1={yToPx(gy, yMin, yMax)}
              y2={yToPx(gy, yMin, yMax)}
              className={css.dynGrid}
            />
          ))}

          <path
            d={`${path} L${xToPx(100)} ${H - PAD.b} L${xToPx(0)} ${H - PAD.b} Z`}
            fill={`url(#fill-${gradId})`}
          />
          <path d={path} className={css.dynCurve} />

          {points.map((p, index) => (
            <circle
              key={`pt-${index}`}
              cx={xToPx(p.x)}
              cy={yToPx(p.y, yMin, yMax)}
              r={editable ? 7 : 3.5}
              className={
                editable
                  ? dragIndex === index
                    ? `${css.dynPoint} ${css.dynPointEdit} ${css.dynPointActive}`
                    : `${css.dynPoint} ${css.dynPointEdit}`
                  : css.dynPoint
              }
              style={editable ? { cursor: 'grab', touchAction: 'none' } : undefined}
              onPointerDown={(e) => onPointPointerDown(e, index)}
              onPointerMove={onPointPointerMove}
              onPointerUp={onPointPointerUp}
              onPointerCancel={onPointPointerUp}
            />
          ))}

          <line
            x1={markerX}
            x2={markerX}
            y1={PAD.t}
            y2={H - PAD.b}
            className={css.dynScan}
          />
          <circle cx={markerX} cy={markerY} r={6} className={css.dynMarker} />

          <text x={PAD.l} y={H - 10} className={css.dynAxis}>
            {pl ? 'prędkość →' : 'speed →'}
          </text>
          <text
            x={12}
            y={PAD.t + 8}
            className={css.dynAxis}
            transform={`rotate(-90 12 ${PAD.t + 8})`}
          >
            sens ×
          </text>
          <text x={xToPx(0) - 4} y={H - PAD.b + 14} className={css.dynTick}>
            0
          </text>
          <text x={xToPx(100) - 10} y={H - PAD.b + 14} className={css.dynTick}>
            100
          </text>
          <text x={PAD.l - 28} y={yToPx(1, yMin, yMax) + 3} className={css.dynTick}>
            1.0
          </text>
          <text x={PAD.l - 28} y={yToPx(1.5, yMin, yMax) + 3} className={css.dynTick}>
            1.5
          </text>
        </svg>

        <div className={css.dynReadout} aria-live="polite">
          <span>
            {pl ? 'Prędkość (podgląd)' : 'Speed (preview)'}{' '}
            <strong>{Math.round(speed)}</strong>
          </span>
          <span>
            {pl ? 'Mnożnik krzywej' : 'Curve multiplier'}{' '}
            <strong>×{mult.toFixed(2)}</strong>
          </span>
        </div>
      </div>

      <p className={css.dynDemoLabel}>
        {pl
          ? 'Wykres = podgląd względem kursora na ekranie. Prawdziwy Dynamic Sensitivity działa na sensorze myszy (szybszy ruch → inny mnożnik DPI według krzywej).'
          : 'Chart = on-screen cursor preview. Real Dynamic Sensitivity runs on the mouse sensor (faster motion → different DPI multiplier per curve).'}
      </p>

      {editable ? (
        <div className={css.dynCustomActions}>
          <button
            type="button"
            className={css.chip}
            onClick={() =>
              setCustomPoints(clonePoints(VIPER_V4_DYN_SENS_CURVES.custom.pointList))
            }
          >
            {pl ? 'Reset krzywej' : 'Reset curve'}
          </button>
          <span className={css.dynDemoLabel}>
            {pl
              ? 'Edycja lokalna (podgląd). Zapis 250 punktów na urządzenie (0b/13) — osobna passa.'
              : 'Local edit (preview). On-device 250-point write (0b/13) is a follow-up.'}
          </span>
        </div>
      ) : null}
    </div>
  )
}
