interface HIDDeviceFilter {
  vendorId?: number
  productId?: number
  usagePage?: number
  usage?: number
}

interface HIDDeviceRequestOptions {
  filters: HIDDeviceFilter[]
}

interface HIDInputReportEvent extends Event {
  readonly device: HIDDevice
  readonly reportId: number
  readonly data: DataView
}

interface HIDConnectionEvent extends Event {
  readonly device: HIDDevice
}

interface HIDDevice extends EventTarget {
  readonly opened: boolean
  readonly vendorId: number
  readonly productId: number
  readonly productName: string
  readonly collections: HIDCollectionInfo[]
  open(): Promise<void>
  close(): Promise<void>
  sendFeatureReport(reportId: number, data: BufferSource): Promise<void>
  receiveFeatureReport(reportId: number): Promise<DataView>
  sendReport(reportId: number, data: BufferSource): Promise<void>
  addEventListener(
    type: 'inputreport',
    listener: (ev: HIDInputReportEvent) => void,
  ): void
  removeEventListener(
    type: 'inputreport',
    listener: (ev: HIDInputReportEvent) => void,
  ): void
}

interface HIDCollectionInfo {
  usagePage: number
  usage: number
  type: number
  children: HIDCollectionInfo[]
  inputReports: HIDReportInfo[]
  outputReports: HIDReportInfo[]
  featureReports: HIDReportInfo[]
}

interface HIDReportInfo {
  reportId: number
  items: Array<{
    reportSize?: number
    reportCount?: number
    isConstant?: boolean
  }>
}

interface HID extends EventTarget {
  getDevices(): Promise<HIDDevice[]>
  requestDevice(options: HIDDeviceRequestOptions): Promise<HIDDevice[]>
  addEventListener(
    type: 'connect' | 'disconnect',
    listener: (ev: HIDConnectionEvent) => void,
  ): void
}

interface Navigator {
  readonly hid?: HID
}
