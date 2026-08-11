#!/usr/bin/env python3
"""
CLI probe for Redragon King Ultra (3554:F54F / F54D) - no browser.

Opens OEM vendor channel (usagePage 0xFF02, report id 8, 16-byte payload),
runs encryption / PC-driver / online / flash read-write sequences, prints
every TX/RX so we can see what actually sticks in mouse flash.

Usage (close Chrome WebHID / OEM app first):
  python tools/king_ultra_hid_probe.py
  python tools/king_ultra_hid_probe.py --dpi 3200 --stage 0
"""

from __future__ import annotations

import argparse
import os
import random
import sys
import time
from typing import Iterable, Optional

# Windows console often cp1250 - keep ASCII in prints
os.environ.setdefault("PYTHONIOENCODING", "utf-8")

try:
    import hid
except ImportError:
    print("pip install hidapi", file=sys.stderr)
    raise

VID = 0x3554
PIDS = (0xF54F, 0xF510, 0xF54D)  # 8K dongle, alt dongle, corded
USAGE_PAGE_OEM = 0xFF02


def cksum(frame17: bytes) -> int:
    """Checksum over wire[0..15] (reportId..byte15), stored at wire[16]."""
    s = sum(frame17[i] for i in range(16)) & 0xFF
    return (0x55 - s) & 0xFF


def pair_ck(v: int) -> int:
    return (0x55 - (v & 0xFF)) & 0xFF


def encode_dpi_3950(dpi: int) -> tuple[int, int, int]:
    raw = max(0, round(dpi / 50) - 1)
    hi = (raw >> 8) & 0xFF
    dpi_ex = ((hi << 2) | (hi << 6)) & 0xFF
    x = raw & 0xFF
    return x, x, dpi_ex


def build_wire(
    cmd: int,
    *,
    addr: int = 0,
    data_len: int = 0,
    payload: Iterable[int] = (),
    online_bit: bool = True,
    status: int = 0,
) -> bytes:
    """17-byte OEM WriteFile buffer: [reportId=8, cmd, status, addrHi, addrLo, flags, data…, ck]."""
    flags = (data_len & 0x7F) | (0x80 if online_bit else 0)
    buf = bytearray(17)
    buf[0] = 0x08
    buf[1] = cmd & 0xFF
    buf[2] = status & 0xFF
    buf[3] = (addr >> 8) & 0xFF
    buf[4] = addr & 0xFF
    buf[5] = flags
    for i, b in enumerate(payload):
        if 6 + i >= 16:
            break
        buf[6 + i] = b & 0xFF
    buf[16] = cksum(bytes(buf))
    return bytes(buf)


def hx(b: bytes | bytearray) -> str:
    return " ".join(f"{x:02x}" for x in b)


def pick_device(pid: Optional[int] = None) -> dict:
    cands = []
    for p in PIDS if pid is None else (pid,):
        for d in hid.enumerate(VID, p):
            if d.get("usage_page") == USAGE_PAGE_OEM:
                cands.append(d)
    if not cands:
        # fallback: any King Ultra interface
        for p in PIDS if pid is None else (pid,):
            cands.extend(hid.enumerate(VID, p))
    if not cands:
        raise SystemExit("No 3554:F54F/F510/F54D device found - plug dongle/cable")
    # Prefer FF02
    cands.sort(
        key=lambda d: (
            0 if d.get("usage_page") == USAGE_PAGE_OEM else 1,
            d.get("interface_number") or 0,
        )
    )
    return cands[0]


def open_dev(info: dict) -> "hid.device":
    dev = hid.device()
    path = info["path"]
    print(
        f"open VID={info['vendor_id']:04X} PID={info['product_id']:04X} "
        f"up={info.get('usage_page', 0):04X} if={info.get('interface_number')} "
        f"{info.get('product_string')!r}"
    )
    try:
        dev.open_path(path)
    except OSError as e:
        raise SystemExit(
            f"open failed: {e}\n"
            "Close Chrome tab with WebHID + official Redragon software, then retry."
        ) from e
    dev.set_nonblocking(True)
    return dev


def drain(dev: "hid.device", ms: int = 80) -> list[bytes]:
    out: list[bytes] = []
    deadline = time.time() + ms / 1000
    while time.time() < deadline:
        data = dev.read(64, timeout_ms=10)
        if data:
            out.append(bytes(data))
        else:
            time.sleep(0.005)
    return out


def xfer(
    dev: "hid.device",
    wire17: bytes,
    *,
    label: str,
    wait_ms: int = 400,
) -> list[bytes]:
    # hidapi write: include report id as first byte
    n = dev.write(wire17)
    print(f"TX {label:22s} ({n:2d}B) {hx(wire17)}")
    time.sleep(0.01)
    rs = drain(dev, wait_ms)
    if not rs:
        print(f"RX {label:22s} (none)")
    for i, r in enumerate(rs):
        print(f"RX {label:22s} #{i} {hx(r[:17])}{' …' if len(r) > 17 else ''}")
    return rs


def payload_nonzero(r: bytes) -> bool:
    # after report id strip? hidapi often returns [reportId, ...payload]
    # Our TX includes report id; RX may too.
    body = r[1:] if r and r[0] == 0x08 else r
    data = body[5:15] if len(body) >= 15 else body[5:]
    return any(b != 0 for b in data)


def main() -> None:
    ap = argparse.ArgumentParser(description="King Ultra HID DPI probe (no browser)")
    ap.add_argument("--dpi", type=int, default=3200)
    ap.add_argument("--stage", type=int, default=0)
    ap.add_argument("--pid", type=lambda s: int(s, 0), default=None)
    ap.add_argument(
        "--online-bit",
        action="store_true",
        help="OR 0x80 into dataLen (usually WRONG on F54F - empty echoes)",
    )
    ap.add_argument("--listen", type=int, default=0, help="extra listen ms after seq")
    args = ap.parse_args()
    online = bool(args.online_bit)

    info = pick_device(args.pid)
    # list all interfaces for context
    print("=== interfaces ===")
    for p in PIDS:
        for d in hid.enumerate(VID, p):
            mark = "*" if d["path"] == info["path"] else " "
            print(
                f"{mark} PID={d['product_id']:04X} if={d.get('interface_number')} "
                f"up={d.get('usage_page',0):04X} u={d.get('usage')} "
                f"{d.get('product_string')!r}"
            )

    dev = open_dev(info)
    try:
        print("\n=== drain noise ===")
        for r in drain(dev, 100):
            print("RX noise", hx(r[:17]))

        print("\n=== handshake (OEM ReadEncryption = cmd1, len=8, 4x rand) ===")
        # FUN_18000f160: reportId=8, cmd=1, dataLen=8|0x80, payload[0..3]=rand&0xff
        challenge = [random.randint(0, 255) for _ in range(4)]
        enc = xfer(
            dev,
            build_wire(
                1,
                data_len=8,
                payload=challenge,
                online_bit=online,
            ),
            label="encryption",
            wait_ms=800,
        )
        print(f"  challenge={challenge}")
        xfer(
            dev,
            build_wire(2, data_len=1, payload=[1], online_bit=online),
            label="pc_driver_on",
        )
        xfer(dev, build_wire(3, online_bit=online), label="online", wait_ms=800)
        bat = xfer(dev, build_wire(4, online_bit=online), label="battery", wait_ms=800)
        ver = xfer(dev, build_wire(0x12, online_bit=online), label="version", wait_ms=600)
        slave = xfer(
            dev, build_wire(0x0B, online_bit=online), label="slave_version", wait_ms=600
        )
        for label, rs in (("receiver", ver), ("mouse", slave)):
            for r in rs:
                body = r[1:] if r and r[0] == 0x08 else r
                if len(body) >= 8 and body[0] in (0x12, 0x0B):
                    maj, minor = body[5], body[6]
                    # payload starts at body[5]; maj/min = data[0], data[1]
                    if body[5] or body[6]:
                        print(f"  {label} FW guess v{body[5]}.{body[6]} (data0/1)")
                    if len(body) > 7 and (body[6] or body[7]):
                        print(f"  {label} FW alt   v{body[6]}.{body[7]} (idx6/7)")
        xfer(dev, build_wire(6, online_bit=online), label="pair_state", wait_ms=600)

        print("\n=== listen 3s - MOVE THE MOUSE NOW ===")
        for r in drain(dev, 3000):
            print("RX listen", hx(r[:20]))
            body = r[1:] if r and r[0] == 0x08 else r
            if body and body[0] == 10:
                print("  StatusChanged bits:", bin(body[5] if len(body) > 5 else 0))

        print("\n=== flash READ before ===")
        # report rate @0 len2, current dpi @4 len2, stage @0x0C len4
        xfer(
            dev,
            build_wire(8, addr=0x00, data_len=2, online_bit=online),
            label="rd_rate",
            wait_ms=500,
        )
        xfer(
            dev,
            build_wire(8, addr=0x04, data_len=2, online_bit=online),
            label="rd_cur_dpi",
            wait_ms=500,
        )
        before = xfer(
            dev,
            build_wire(8, addr=0x0C + args.stage * 4, data_len=4, online_bit=online),
            label="rd_stage",
            wait_ms=600,
        )

        x, y, ex = encode_dpi_3950(args.dpi)
        body = [x, y, ex]
        body_ck = (0x55 - sum(body)) & 0xFF
        stage_bytes = body + [body_ck]
        print(
            f"\n=== WRITE dpi={args.dpi} stage={args.stage} "
            f"bytes={stage_bytes} online_bit={online} ==="
        )
        xfer(
            dev,
            build_wire(
                7,
                addr=0x0C + args.stage * 4,
                data_len=4,
                payload=stage_bytes,
                online_bit=online,
            ),
            label="wr_stage",
            wait_ms=600,
        )
        xfer(
            dev,
            build_wire(
                7,
                addr=0x04,
                data_len=2,
                payload=[args.stage & 0xFF, pair_ck(args.stage)],
                online_bit=online,
            ),
            label="wr_cur_idx",
            wait_ms=600,
        )

        print("\n=== flash READ after (retries) ===")
        ok = False
        for attempt in range(6):
            time.sleep(0.15)
            rs = xfer(
                dev,
                build_wire(
                    8,
                    addr=0x0C + args.stage * 4,
                    data_len=4,
                    online_bit=online,
                ),
                label=f"rd_stage#{attempt}",
                wait_ms=500,
            )
            for r in rs:
                body = r[1:] if r and r[0] == 0x08 else r
                data = list(body[5:9]) if len(body) >= 9 else []
                print(f"  parse data[0:4]={data} expect={stage_bytes}")
                if data[:4] == stage_bytes:
                    ok = True
                    print("  >>> FLASH MATCH - write reached mouse")
            if ok:
                break

        # also try without online bit if failed
        if not ok and online:
            print("\n=== RETRY write WITHOUT 0x80 online bit ===")
            xfer(
                dev,
                build_wire(
                    7,
                    addr=0x0C + args.stage * 4,
                    data_len=4,
                    payload=stage_bytes,
                    online_bit=False,
                ),
                label="wr_stage_no80",
                wait_ms=600,
            )
            for attempt in range(4):
                time.sleep(0.15)
                rs = xfer(
                    dev,
                    build_wire(
                        8,
                        addr=0x0C + args.stage * 4,
                        data_len=4,
                        online_bit=False,
                    ),
                    label=f"rd_no80#{attempt}",
                    wait_ms=500,
                )
                for r in rs:
                    body = r[1:] if r and r[0] == 0x08 else r
                    data = list(body[5:9]) if len(body) >= 9 else []
                    print(f"  parse data[0:4]={data}")
                    if data[:4] == stage_bytes:
                        ok = True
                        print("  >>> FLASH MATCH without 0x80")
                if ok:
                    break

        if args.listen:
            print(f"\n=== listen {args.listen}ms ===")
            for r in drain(dev, args.listen):
                print("RX listen", hx(r[:20]))

        print("\n=== RESULT ===")
        live_bat = any(payload_nonzero(r) for r in bat)
        live_before = any(payload_nonzero(r) for r in before)
        print(f"battery payload live: {live_bat}")
        print(f"flash read-before live: {live_before}")
        print(f"dpi flash verified: {ok}")
        if not ok:
            print(
                "Dongle ACKs but flash stays empty - mouse RF config path dead "
                "(wake mouse, close OEM, try cable F54D)."
            )
            sys.exit(2)
    finally:
        dev.close()


if __name__ == "__main__":
    main()
