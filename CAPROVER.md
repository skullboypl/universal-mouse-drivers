# CapRover - UMD

Repo: `https://github.com/skullboypl/udm-universal-mouse-drivers.git`

## App creation

1. CapRover → **Apps** → **One-Click** / **New App** → name e.g. `umd`
2. **Deployment** → Method: **GitHub** (lub webhook) → podłącz to repo, branch `main`
3. Root ma `captain-definition` → CapRover zbuduje z `Dockerfile`

## Persistent Directories (ważne)

W **App Configs** → **Persistent Directories**:

| Path in App | Host volume label (dowolny) |
|-------------|-----------------------------|
| `/app/data` | `umd-data` |

Tu ląduje **jeden plik DB/config**:

- `/app/data/umd-store.json` - pozycje badge 1–6, meta downloadów
- `/app/data/downloads/UmdBatteryTray.exe` - signed tray do pobrania

## Environment Variables

Gotowy zestaw: **`.env.caprover`** (lokalnie, w `.gitignore`) albo szablon **`.env.caprover.example`**.

CapRover → App → **App Configs** → **Environmental Variables** → wklej wartości.

| Key | Example | Opis |
|-----|---------|------|
| `DATA_DIR` | `/app/data` | Persistent dir |
| `ADMIN_USER` | `admin` | Login `/admin` |
| `ADMIN_PASSWORD` | *(silne hasło)* | Hasło admin |
| `ADMIN_SECRET` | *(losowy długi string)* | HMAC sesji cookie |
| `NEXT_PUBLIC_SITE_URL` | `https://umdrivers.com` | SEO / metadataBase |
| `PORT` | `3000` | CapRover HTTP |
| `NODE_ENV` | `production` | Next production |
| `HOSTNAME` | `0.0.0.0` | listen all interfaces |

Container HTTP Port: **3000**

## HTTP / HTTPS

- Enable HTTPS (Let's Encrypt) na domenie apki
- Force HTTPS on

## Po deployu

1. Wejdź `https://…/admin` → login (`ADMIN_USER` / `ADMIN_PASSWORD`)
2. Przeciągnij badge 1–6 → **Zapisz pozycje** (pisze `umd-store.json`)
3. Zbuduj tray lokalnie + podpisz EV:

```powershell
cd tray-battery
.\build.ps1
.\sign.ps1   # wymaga SIGNTOOL + EV cert thumbprint
```

4. Wrzuć `UmdBatteryTray.exe` do persistent:

```bash
# CapRover → App → **Upload** do volume, albo docker cp:
docker cp UmdBatteryTray.exe <container>:/app/data/downloads/UmdBatteryTray.exe
```

5. Public download: `https://…/api/downloads/UmdBatteryTray.exe`

## SEO / i18n

- `/` → redirect `/{locale}` (cookie → CF country → IP → Accept-Language)
- Locales: `/pl` `/en` `/de` `/fr` `/es` `/pt` `/it` `/zh` `/ja` `/ko` `/ru`
- Canonical: `NEXT_PUBLIC_SITE_URL=https://umdrivers.com`

## Legacy domain `mouse.vxh.pl` (old tray auto-update)

Old UmdBatteryTray builds hardcode / save `https://mouse.vxh.pl` and **cannot** be patched in the field. They must keep reaching this Next app.

### CapRover (required)

1. **Remove** any separate “redirect app” that sends `mouse.vxh.pl` → `http://umdrivers.com` (HTTPS→HTTP 302 breaks .NET `HttpClient`).
2. On the **same UMD app** as umdrivers.com: **HTTP Settings** → **Add Domain** → `mouse.vxh.pl` (+ Enable HTTPS / Let’s Encrypt).
3. Deploy this repo so middleware is live.

Then:

| Request | Behavior |
|---------|----------|
| `https://mouse.vxh.pl/api/tray/latest` | **200 JSON** (legacy tray) |
| `https://mouse.vxh.pl/api/downloads/UmdBatteryTray.exe` | **200 file** |
| `https://mouse.vxh.pl/…` (pages) | **301** → `https://umdrivers.com/…` (SEO) |

Manifest `url` always points at **`https://umdrivers.com/api/downloads/...`** (canonical).

Verify:

```bash
curl -sS https://mouse.vxh.pl/api/tray/latest
curl -sSIL https://mouse.vxh.pl/pl | head
# API → 200 JSON; HTML → 301 to umdrivers.com
```

### Alternative (worse)

Nginx-only redirect app with **HTTPS + path**:

```nginx
return 301 https://umdrivers.com$request_uri;
```

Never `http://umdrivers.com`.

## Git deploy key (opcjonalnie)

Jeśli CapRover łączy się po SSH do GitHuba, wklej **publiczny** klucz (`deploykey-caprover.pub`) jako Deploy Key w repo. **Nie** commituj prywatnego `deploykey-caprover`.
