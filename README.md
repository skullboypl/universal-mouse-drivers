# UMD - Universal Mouse Drivers

WebHID configurator (Next.js) + Windows battery tray for OEM gaming mice when factory tools fall short.

**Repo:** https://github.com/skullboypl/udm-universal-mouse-drivers

## Stack

| Piece | Path |
|--------|------|
| Next.js app (SEO `/pl` `/en`, WebHID UI, `/admin`) | [`web/`](web/) |
| CapRover | [`captain-definition`](captain-definition) + [`Dockerfile`](Dockerfile) → see [`CAPROVER.md`](CAPROVER.md) |
| JSON store (persistent) | `/app/data/umd-store.json` |
| Tray download | `/app/data/downloads/UmdBatteryTray.exe` |
| Battery tray (WinForms) | [`tray-battery/`](tray-battery/) |

Legacy Vite prototype: local only under `old/web-app/` (gitignored, not deployed).

## Dev

```bash
cd web
npm install
npm run dev
```

Open http://127.0.0.1:3000 → redirects to `/pl` or `/en`.  
Admin: http://127.0.0.1:3000/admin (default `admin` / `umd-change-me` unless env set).

## Tray (Windows)

```powershell
cd tray-battery
.\build.ps1
# EV code signing (Fenrir-style signtool):
$env:UMD_SIGN_THUMBPRINT = '<your-ev-cert-sha1>'
.\sign.ps1
# Upload signed exe → CapRover Persistent Directory /app/data/downloads/
```

## Hardware whitelist (King Ultra)

- `3554:F54D` mouse
- `3554:F54F` / `3554:F510` dongle

Do not target Fenrir (`33E4`) or Wooting (`31E3`) during sniff/testing.

## CapRover

Full checklist: **[CAPROVER.md](CAPROVER.md)**

Persistent directory: **`/app/data`**  
Env: `ADMIN_USER`, `ADMIN_PASSWORD`, `ADMIN_SECRET`, `DATA_DIR=/app/data`, `NEXT_PUBLIC_SITE_URL`
