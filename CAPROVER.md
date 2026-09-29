# CapRover - UMD

**Preferred deploy source (AGPL / public):**  
`https://github.com/skullboypl/universal-mouse-drivers.git` (`main`)

Private mirror (optional): `https://github.com/skullboypl/udm-universal-mouse-drivers.git`

## App creation

1. CapRover → **Apps** → **One-Click** / **New App** → name e.g. `umd`
2. **Deployment** → Method: **GitHub** (lub webhook) → podłącz **public** `universal-mouse-drivers`, branch `main`
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
| `GITHUB_ACTIONS_TOKEN` | *(fine-grained PAT, `Actions: write`)* | Pozwala aplikacji samodzielnie odpalać `openmouse-daily-sync.yml` co ~24h (patrz niżej). Puste = wyłączony auto-sync, workflow wciąż można odpalić ręcznie z GitHuba. |
| `GITHUB_SYNC_REPO` | `skullboypl/universal-mouse-drivers` | Repo, w którym żyje workflow. |
| `GITHUB_SYNC_REF` | `main` | Branch do dispatchu. |

### OpenMouse daily sync bez crona

Ciężka robota (npm install, generowanie katalogu, build, `git push`) zostaje na
runnerze GitHuba - **nie** w kontenerze produkcyjnym, bo obraz `runner` z
`Dockerfile` celowo nie ma npm/git/curl/wget (patrz komentarz w Dockerfile o
incydencie 2026-08-18). Zamiast `schedule:` w YAML-u, żywa aplikacja Next.js
(`web/instrumentation.ts`) sama woła co ~24h GitHub API
(`workflows/openmouse-daily-sync.yml/dispatches`), więc nie trzeba nigdzie
konfigurować crona. Stan ostatniego wywołania: `/app/data/openmouse-sync-state.json`.

### Google Indexing API (opcjonalnie)

Krok `notify-openmouse-indexing.mjs` w workflow woła Indexing API dla
zmienionych/nowych stron modeli OpenMouse. Dodaj sekret **repo** (nie app env)
`GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON` = cała treść pliku JSON klucza konta
serwisowego (Google Cloud Console → Service Accounts → klucz JSON, z dostępem
"Owner" do właściwości w Search Console jako Indexing API). Bez tego sekretu
krok jest pomijany (exit 0), nic się nie psuje. Google dokumentuje, że ten
API gwarantuje przetworzenie tylko dla stron `JobPosting`/`BroadcastEvent` -
dla zwykłych stron modeli myszy wywołanie jest niegroźne, ale może zostać
zignorowane. Realny mechanizm indeksacji dla katalogu to sitemap +
Search Console URL Inspection - patrz `OPENMOUSE_SEO_ROADMAP.md`.

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

## CapRover deploy source

Prefer **public** `https://github.com/skullboypl/universal-mouse-drivers` as Git deploy source of truth (AGPL). Keep `ADMIN_*` and other secrets only in CapRover **Environmental Variables** — never in the repo.

**Do not** force-push the private product history onto public without filtering — keep out of the public tree and history: `Decompile/`, `docs/`, `.cursor/`, `tools/`, `old/`. Sync forward from cleaned public / commits that already omit those paths.

## Security / incident (2026-08-18)

Objawy w CapRover logs (to **nie** jest crash od WebHID):

- `Error: x` z `digest` = base64 **całego `process.env`** (w tym `ADMIN_*`)
- `sh: curl: not found` → potem `wget` z IP (np. `77.90.13.20`) do `/tmp/dashboard`
- masa `[umd:webhid]` / `[umd:driver]` = tylko client log sink (hałas, nie RCE)

**Przyczyna:** Next.js **15.5.2** podatny na **React2Shell** (CVE-2025-55182 / CVE-2025-66478) — RCE przez React Server Components. Publiczny `/api/umd-log` tylko zaśmiecał logi.

**Naprawa w repo (od tego commit):**

- Next.js ≥ **15.5.23**
- `/api/umd-log` → **404 w production**
- runner image bez `wget`/`curl`

### Co zrób natychmiast na CapRover

1. **Force rebuild** tej apki z `main` (czysty kontener — stary jest podejrzany).
2. **Zmień** `ADMIN_PASSWORD` + `ADMIN_SECRET` (stare wyciekły w logach).
3. Sprawdź host: `docker ps`, CPU, procesy w `/tmp` na VPS; jeśli miner na hoście — czyść CapRover/VPS.
4. Upewnij się, że CapRover dashboard **nie** jest publiczny bez hasła.
5. Po deployu: `curl -sS -o /dev/null -w "%{http_code}\n" -X POST https://umdrivers.com/api/umd-log` → oczekuj **404**.
