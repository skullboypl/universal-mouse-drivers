# Rampage Blitz Ultimate — isolated SKU tree

**Do not import** from `../../redragon/king-ultra/*` for protocol, actions, macros, or defaults.

This folder owns:
- `protocol.ts` — wire encode/decode + flash addresses (forked copy)
- `macroFlash.ts` — macro blob layout
- `actions.ts` — KeyFun / ShortCut catalog + shortcut flash @ `0x100`
- `buttons.ts` / `defaults.ts` / `identity.ts` / `driver.ts`

Changing King Ultra must not require re-testing Blitz, and vice versa.
