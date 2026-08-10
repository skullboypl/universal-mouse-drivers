/** CRC used for 16-byte output reports on report ID 8 */
export function dongleReportCrc(buffer: Uint8Array, length = buffer.length - 1): number {
  let sum = 0;
  for (let i = 0; i < length; i++) sum += buffer[i];
  return (85 - (sum & 0xff)) & 0xff;
}
