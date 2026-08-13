/**
 * Same HIDUsb V11 wire as King Ultra (ILSpy: identical UsbCommandID / MouseConfig).
 * Keep a Blitz-local entrypoint so imports stay device-scoped; do not mix PIDs.
 */
export * from '../redragon-king-ultra/protocol'
