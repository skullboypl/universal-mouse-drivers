# Redragon King Ultra — Web Driver

Wooting-style React configurator for **Redragon King Ultra (M916OB-ULT)**.

## Run

```bash
cd web-app
npm install
npm run dev
```

Open http://localhost:5173

- **Mock** — full UI without HID writes (safe while another mouse is your daily driver).
- **WebHID** — Chrome/Edge only; filters `VID 0x3554` + `PID F54D | F54F | F510`.

## Safety

Never opens Fenrir (`33E4:*`) or Wooting (`31E3:*`). Protocol feature reports are stubs until USB sniff fills `src/devices/redragon-king-ultra/protocol.ts`.

## Docs

- Spec: `../docs/superpowers/specs/2026-08-09-redragon-king-ultra-web-driver-design.md`
- Plan: `../docs/superpowers/plans/2026-08-09-redragon-king-ultra-web-driver.md`
