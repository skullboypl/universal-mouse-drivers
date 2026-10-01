import { OpenMouseProductMark } from './OpenMouseProductMark'
import { useT } from '../i18n/useT'
import type { MessageKey } from '../i18n/messages'
import type { ConnectionMode } from '../devices/types'
import styles from './OpenMouseDeviceShowcase.module.css'

type Props = {
  brand: string
  model: string
  brandSlug: string
  connection: ConnectionMode
  batteryPercent: number | null
}

/**
 * Device identity sidebar for an OpenMouse-protocol session - ported from
 * OpenMouse's own `.showcase-sidebar` (.ref/app/src/control.css, AGPL-3.0,
 * same license as this repo): big product art, name/brand, then a single
 * connected-status pill. No banner, no capability chip list, no CTA link -
 * their own UI doesn't have those on the device dashboard, so neither do we.
 */
export function OpenMouseDeviceShowcase({
  brand,
  model,
  brandSlug,
  connection,
  batteryPercent,
}: Props) {
  const tr = useT()
  const connectionKey: MessageKey =
    connection === 'wireless'
      ? 'sensor.omConnWireless'
      : connection === 'bluetooth'
        ? 'sensor.omConnBluetooth'
        : connection === 'corded'
          ? 'sensor.omConnCorded'
          : 'sensor.omConnUnknown'
  return (
    <div className={styles.showcase}>
      <div className={styles.visual}>
        <OpenMouseProductMark
          brandSlug={brandSlug}
          brand={brand}
          model={model}
          size="lg"
          className={styles.art}
        />
      </div>
      <div className={styles.info}>
        <h2 className={styles.name}>{model}</h2>
        <p className={styles.brand}>{brand}</p>
      </div>
      <div className={styles.status}>
        <span className={styles.dot} aria-hidden />
        {tr('sensor.omConnected')}
        <span className={styles.detail}>{' · '}{tr(connectionKey)}</span>
        {batteryPercent != null ? (
          <span className={styles.detail}>{' · '}{batteryPercent}%</span>
        ) : null}
      </div>
    </div>
  )
}
