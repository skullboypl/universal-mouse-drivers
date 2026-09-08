# Devices layout

```
devices/
  mice/
    <brand>/
      <model>/          # identity, protocol, buttons, defaults, driver, …
    demo/               # UMD mock mouse
  keyboards/            # (future)
  registry.ts           # catalog → driver factory
  types.ts
  DeviceDriver.ts
```

Examples:
- `mice/redragon/king-ultra`
- `mice/rampage/blitz-ultimate`
- `mice/gwolves/fenrir-max`
- `mice/logitech/pro-x-superlight`

**Isolation rule:** each model owns its protocol, action catalog, flash addresses, and defaults. Do not import those from another model.

Catalog `id` strings (e.g. `redragon-king-ultra`) and public art URLs under `/devices/...` stay stable — only the TypeScript folder path uses `mice/<brand>/<model>`.

**Live locks:** see [`LOCK.md`](./LOCK.md) — locked SKUs must not have protocol/address/HID edits.
