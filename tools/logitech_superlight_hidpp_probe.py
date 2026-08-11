#!/usr/bin/env python3
"""
Live HID++ 2.0 probe for Logitech PRO X SUPERLIGHT gen1 (LIGHTSPEED receiver).

Target: VID 046D / PID C547 (receiver). Device index for paired mouse is usually 0x01.
Close G HUB / Onboard Memory Manager before running (exclusive open).

Usage:
  python tools/logitech_superlight_hidpp_probe.py
  python tools/logitech_superlight_hidpp_probe.py --list
  python tools/logitech_superlight_hidpp_probe.py --device-index 1
"""

from __future__ import annotations

import argparse
import os
import sys
import time
from typing import Optional

os.environ.setdefault("PYTHONIOENCODING", "utf-8")

try:
    import hid
except ImportError:
    print("pip install hidapi", file=sys.stderr)
    raise

VID = 0x046D
# Gen1 Superlight wireless = LIGHTSPEED receiver C547 (NOT Superlight 2)
PID_RECEIVER = 0xC547
# Wired Superlight v1 sometimes appears as C08C / C091 depending on SKU — probe lists all 046D.

# HID++ short / long report IDs (USB)
REPORT_SHORT = 0x10  # 7 bytes payload after report id → total write 7
REPORT_LONG = 0x11  # 20 bytes payload after report id → total write 20

# Root feature 0x0000 is always at feature index 0
FEAT_ROOT = 0x0000
FEAT_FEATURE_SET = 0x0001
FEAT_DEVICE_INFO = 0x0003
FEAT_BATTERY_UNIFIED = 0x1000
FEAT_BATTERY_VOLTAGE = 0x1001
FEAT_BATTERY_LEVEL_STATUS = 0x1004
FEAT_DPI = 0x2201
FEAT_EXTENDED_DPI = 0x2202
FEAT_REPORT_RATE = 0x8061
FEAT_ONBOARD_PROFILES = 0x8100
FEAT_ONBOARD_BUTTONS = 0x8110

# Features seen in OnboardMemoryManager 2.6.1749 symbols
OMM_FEATURES = [
    0x0000,
    0x0003,
    0x0005,
    0x0101,
    0x0104,
    0x0600,
    0x0620,
    0x0635,
    0x1000,
    0x1001,
    0x1004,
    0x1895,
    0x1B0C,
    0x2110,
    0x2121,
    0x2201,
    0x2202,
    0x4540,
    0x8061,
    0x8070,
    0x8071,
    0x8081,
    0x80E0,
    0x8100,
    0x8110,
]


def hexb(data: bytes) -> str:
    return " ".join(f"{b:02X}" for b in data)


def list_logitech() -> None:
    print("=== Logitech HID devices (046D) ===")
    for d in hid.enumerate(VID, 0):
        print(
            f"  PID=0x{d['product_id']:04X} iface={d.get('interface_number')} "
            f"up=0x{d.get('usage_page', 0):04X} u=0x{d.get('usage', 0):04X} "
            f"in/out={d.get('max_input_report_length')}/{d.get('max_output_report_length')} "
            f"{d.get('product_string')!r}"
        )


def pick_receiver_paths(pid: int = PID_RECEIVER) -> dict[str, bytes]:
    """
    C547 exposes two vendor collections on MI_02:
      usage 0x01 → short HID++ (report 0x10, 7 B)
      usage 0x02 → long  HID++ (report 0x11, 20 B)  ← mouse HID++ 2.0
    """
    out: dict[str, bytes] = {}
    for d in hid.enumerate(VID, pid):
        if d.get("usage_page") != 0xFF00:
            continue
        u = d.get("usage")
        if u == 0x01:
            out["short"] = d["path"]
        elif u == 0x02:
            out["long"] = d["path"]
    return out


class HidppDevice:
    def __init__(
        self,
        paths: dict[str, bytes],
        device_index: int = 0x01,
        timeout_ms: int = 800,
    ):
        self.device_index = device_index & 0xFF
        self.timeout_ms = timeout_ms
        self.feature_map: dict[int, int] = {FEAT_ROOT: 0}  # featureId -> featureIndex
        self.dev_long: Optional[hid.device] = None
        self.dev_short: Optional[hid.device] = None

        if "long" in paths:
            self.dev_long = hid.device()
            self.dev_long.open_path(paths["long"])
            self.dev_long.set_nonblocking(False)
        if "short" in paths:
            self.dev_short = hid.device()
            self.dev_short.open_path(paths["short"])
            self.dev_short.set_nonblocking(False)

        if self.dev_long is None and self.dev_short is None:
            raise OSError("No HID++ collection opened")

    def close(self) -> None:
        if self.dev_long:
            self.dev_long.close()
        if self.dev_short:
            self.dev_short.close()

    def _dev_for(self, report_id: int) -> hid.device:
        if report_id == REPORT_LONG:
            if self.dev_long is None:
                raise OSError("No long (usage 0x02) collection")
            return self.dev_long
        if self.dev_short is None:
            raise OSError("No short (usage 0x01) collection")
        return self.dev_short

    def _write(self, report_id: int, body: bytes) -> None:
        pkt = bytes([report_id]) + body
        if report_id == REPORT_SHORT:
            pkt = pkt.ljust(7, b"\x00")
        elif report_id == REPORT_LONG:
            pkt = pkt.ljust(20, b"\x00")
        n = self._dev_for(report_id).write(pkt)
        print(f"TX ({n:2d}): {hexb(pkt)}")
        if n is not None and n < 0:
            raise OSError(f"hid write failed for report 0x{report_id:02X}")

    def _read(self, report_id: int) -> Optional[bytes]:
        dev = self._dev_for(report_id)
        deadline = time.time() + self.timeout_ms / 1000.0
        while time.time() < deadline:
            data = dev.read(64, timeout_ms=50)
            if data:
                raw = bytes(data)
                print(f"RX ({len(raw):2d}): {hexb(raw)}")
                return raw
        print("RX: (timeout)")
        return None

    def request(
        self,
        feature_index: int,
        function_id: int,
        params: bytes = b"",
        *,
        long_report: bool = True,
        sw_id: int = 0x0D,
    ) -> Optional[bytes]:
        """
        HID++ 2.0 request:
          reportId | deviceIndex | featureIndex | (functionId<<4)|swId | params...
        """
        report_id = REPORT_LONG if long_report else REPORT_SHORT
        header = bytes(
            [
                self.device_index,
                feature_index & 0xFF,
                ((function_id & 0x0F) << 4) | (sw_id & 0x0F),
            ]
        )
        body = header + params
        try:
            self._write(report_id, body)
        except OSError as e:
            print(f"  !! {e}")
            return None

        deadline = time.time() + self.timeout_ms / 1000.0
        while time.time() < deadline:
            raw = self._read(report_id)
            if raw is None:
                return None
            if raw[0] in (REPORT_SHORT, REPORT_LONG):
                rid, rest = raw[0], raw[1:]
            else:
                rid, rest = None, raw
            if len(rest) < 3:
                continue
            # Error: 0x8F (HID++1) or 0xFF (HID++2)
            if rest[1] in (0x8F, 0xFF):
                print(f"  !! HID++ error rid={rid} {hexb(rest)}")
                return rest
            if rest[0] == self.device_index and rest[1] == (feature_index & 0xFF):
                # Match software id nibble when present
                if (rest[2] & 0x0F) == (sw_id & 0x0F) or True:
                    return rest
            print("  .. ignore unmatched")
        return None

    def get_feature(self, feature_id: int) -> Optional[tuple[int, int, int]]:
        """
        Root.GetFeature(featureId) -> featureIndex, featureType, featureVersion
        Prefer long reports on C547 (Col02).
        """
        params = bytes([(feature_id >> 8) & 0xFF, feature_id & 0xFF])
        for long_report in (True, False):
            print(f"\n-- GetFeature(0x{feature_id:04X}) long={long_report}")
            resp = self.request(0, 0, params, long_report=long_report)
            if resp is None:
                continue
            if len(resp) < 6:
                continue
            # HID++2 error packet
            if resp[1] == 0xFF:
                continue
            feat_idx = resp[3]
            feat_type = resp[4]
            feat_ver = resp[5]
            if feat_idx == 0 and feature_id != FEAT_ROOT:
                print(f"  feature 0x{feature_id:04X} NOT PRESENT")
                return None
            self.feature_map[feature_id] = feat_idx
            print(
                f"  -> index={feat_idx} type=0x{feat_type:02X} version={feat_ver}"
            )
            return feat_idx, feat_type, feat_ver
        return None

    def call(
        self,
        feature_id: int,
        function_id: int,
        params: bytes = b"",
        *,
        long_report: bool = True,
    ) -> Optional[bytes]:
        if feature_id not in self.feature_map:
            got = self.get_feature(feature_id)
            if got is None:
                return None
        idx = self.feature_map[feature_id]
        print(f"\n-- Call feature 0x{feature_id:04X} idx={idx} fn={function_id}")
        return self.request(idx, function_id, params, long_report=long_report)


def decode_battery_1004(resp: bytes) -> None:
    """OMM Feature1004.GetStatus (fn 1): state_of_charge, level flags, charging_status."""
    if len(resp) < 6:
        return
    soc = resp[3]
    level = resp[4]
    status = resp[5]
    print(
        f"  battery SoC={soc}% levelFlags=0x{level:02X} "
        f"charging_status={status} ({'charging' if status else 'discharging'})"
    )


def decode_battery_1000(resp: bytes) -> None:
    if len(resp) < 6:
        return
    discharge = resp[3]
    next_level = resp[4]
    status = resp[5]
    names = {0: "discharging", 1: "charging", 2: "almost full", 3: "charged", 4: "slow charge"}
    print(
        f"  battery: {discharge}% next={next_level}% status={status} ({names.get(status, '?')})"
    )


def decode_dpi_2201(resp: bytes) -> None:
    if len(resp) < 6:
        return
    sensor = resp[3]
    dpi = (resp[4] << 8) | resp[5]
    default = (resp[6] << 8) | resp[7] if len(resp) >= 8 else None
    print(f"  sensor={sensor} dpi={dpi}" + (f" default={default}" if default else ""))


def main() -> int:
    ap = argparse.ArgumentParser(description="HID++ probe for Superlight v1 (C547)")
    ap.add_argument("--list", action="store_true", help="List Logitech HID devices")
    ap.add_argument("--pid", type=lambda s: int(s, 0), default=PID_RECEIVER)
    ap.add_argument("--device-index", type=lambda s: int(s, 0), default=0x01)
    ap.add_argument("--timeout", type=int, default=800)
    ap.add_argument(
        "--features",
        default="discover",
        help="discover | battery | dpi | all-omm",
    )
    args = ap.parse_args()

    if args.list:
        list_logitech()
        return 0

    list_logitech()
    paths = pick_receiver_paths(args.pid)
    if not paths:
        print(f"\nNo HID++ collections on 046D:{args.pid:04X}. Receiver plugged in?")
        return 1

    print(
        f"\nOpening short={paths.get('short')!r}\n"
        f"        long ={paths.get('long')!r}\n"
        f"deviceIndex=0x{args.device_index:02X}"
    )
    try:
        dev = HidppDevice(paths, device_index=args.device_index, timeout_ms=args.timeout)
    except OSError as e:
        print(f"Open failed: {e}")
        print("Close G HUB / Onboard Memory Manager / another exclusive opener.")
        return 2

    try:
        # C547 mouse answers HID++ 2.0 on LONG collection (usage 0x02)
        print("\n=== Root / protocol ===")
        for long_report in (True, False):
            print(f"\n-- GetProtocolVersion long={long_report}")
            resp = dev.request(0, 1, b"\x00\x00\x88", long_report=long_report, sw_id=0x8)
            if resp and len(resp) >= 6 and resp[1] not in (0x8F, 0xFF):
                print(f"  protocol major={resp[3]} minor={resp[4]} ping=0x{resp[5]:02X}")
                break

        # Discover common features
        targets: list[int]
        if args.features == "battery":
            targets = [FEAT_BATTERY_UNIFIED, FEAT_BATTERY_VOLTAGE, FEAT_BATTERY_LEVEL_STATUS]
        elif args.features == "dpi":
            targets = [FEAT_DPI, FEAT_EXTENDED_DPI]
        elif args.features == "all-omm":
            targets = OMM_FEATURES
        else:
            targets = [
                FEAT_FEATURE_SET,
                FEAT_DEVICE_INFO,
                FEAT_BATTERY_UNIFIED,
                FEAT_BATTERY_VOLTAGE,
                FEAT_BATTERY_LEVEL_STATUS,
                FEAT_DPI,
                FEAT_EXTENDED_DPI,
                FEAT_REPORT_RATE,
                FEAT_ONBOARD_PROFILES,
                FEAT_ONBOARD_BUTTONS,
            ]

        print("\n=== Feature discovery ===")
        present: list[int] = []
        for fid in targets:
            if fid == FEAT_ROOT:
                continue
            got = dev.get_feature(fid)
            if got:
                present.append(fid)

        print("\n=== Present features ===")
        for fid in present:
            print(f"  0x{fid:04X} -> index {dev.feature_map[fid]}")

        if FEAT_BATTERY_UNIFIED in present:
            resp = dev.call(FEAT_BATTERY_UNIFIED, 0)  # getBatteryLevelStatus
            if resp:
                decode_battery_1000(resp)

        if FEAT_BATTERY_VOLTAGE in present:
            resp = dev.call(FEAT_BATTERY_VOLTAGE, 0)
            if resp and len(resp) >= 5:
                mv = (resp[3] << 8) | resp[4]
                print(f"  voltage: {mv} mV")

        if FEAT_BATTERY_LEVEL_STATUS in present:
            # OMM: GetCapabilities=fn0, GetStatus=fn1 (state_of_charge)
            resp = dev.call(FEAT_BATTERY_LEVEL_STATUS, 1)
            if resp:
                decode_battery_1004(resp)
            caps = dev.call(FEAT_BATTERY_LEVEL_STATUS, 0)
            if caps:
                print(f"  1004 capabilities: {hexb(caps[3:])}")

        if FEAT_DPI in present:
            resp = dev.call(FEAT_DPI, 2, b"\x00")  # getSensorDpi(0)
            if resp:
                decode_dpi_2201(resp)
            resp = dev.call(FEAT_DPI, 1, b"\x00")  # getSensorDpiList(0)
            if resp and len(resp) >= 4:
                print(f"  dpi list raw: {hexb(resp[3:])}")

        if FEAT_REPORT_RATE in present:
            resp = dev.call(FEAT_REPORT_RATE, 0)
            if resp:
                print(f"  report rate raw: {hexb(resp[3:])}")

        if FEAT_ONBOARD_PROFILES in present:
            resp = dev.call(FEAT_ONBOARD_PROFILES, 0)
            if resp:
                print(f"  onboard profiles raw: {hexb(resp[3:])}")

    finally:
        dev.close()

    return 0


if __name__ == "__main__":
    sys.exit(main())
