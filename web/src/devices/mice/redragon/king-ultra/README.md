# Redragon King Ultra - isolated SKU tree

**Do not import** from `../../rampage/blitz-ultimate/*` for protocol, actions, macros, or defaults.

This folder owns King Ultra wire protocol, KeyFun map (`actions.ts`), buttons, defaults, and driver.
Button options come from OEM `Language/0-English.xml` - see `NOTES-buttons-oem.md`.

Demo/mock art stays on this host only (`applyDemoSkin`).

Changing Blitz Ultimate must not require re-testing King Ultra, and vice versa.
