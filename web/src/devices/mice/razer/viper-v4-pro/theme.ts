import { VIPER_V4_PRO_IDENTITY } from './identity'

export function viperV4ProDeviceAsset() {
  return {
    imageUrl: VIPER_V4_PRO_IDENTITY.imageUrl,
    artWidth: VIPER_V4_PRO_IDENTITY.artWidth ?? 1200,
    artHeight: VIPER_V4_PRO_IDENTITY.artHeight ?? 1200,
  }
}
