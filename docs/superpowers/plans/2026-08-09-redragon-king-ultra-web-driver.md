# Redragon King Ultra Web Driver Implementation Plan

> **For agentic workers:** Implement task-by-task. Steps use checkbox syntax.

**Goal:** Ship a Wooting-like React web configurator for Redragon King Ultra with Mock + WebHID transport and full OEM feature surfaces.

**Architecture:** UI → DeviceSession → KingUltraDriver → Transport (Mock | WebHID | Bridge stub). Whitelist VID 0x3554 / PIDs F54D, F54F, F510 only.

**Tech Stack:** Vite, React 19, TypeScript, React Router, CSS modules/variables (no heavy UI kit)

---

## File map

```
package.json
vite.config.ts
index.html
src/main.tsx
src/App.tsx
src/styles/tokens.css
src/styles/global.css
src/devices/registry.ts
src/devices/types.ts
src/devices/mice/redragon/king-ultra/identity.ts
src/devices/mice/redragon/king-ultra/defaults.ts
src/devices/mice/redragon/king-ultra/driver.ts
src/devices/mice/redragon/king-ultra/protocol.ts
src/transport/types.ts
src/transport/mock.ts
src/transport/webhid.ts
src/transport/bridge.ts
src/session/DeviceSessionContext.tsx
src/components/Shell.tsx
src/components/TopNav.tsx
src/components/DeviceCard.tsx
src/components/Toggle.tsx
src/components/Select.tsx
src/components/Slider.tsx
src/components/Button.tsx
src/pages/ConnectPage.tsx
src/pages/ButtonsPage.tsx
src/pages/SensorPage.tsx
src/pages/MacroPage.tsx
src/pages/SettingsPage.tsx
public/mouse-king-ultra.svg
```

### Task 1: Scaffold

- [ ] Vite React-TS project + router + base styles

### Task 2: Transport + device layer

- [ ] types, identity, defaults, mock, webhid whitelist, driver stub

### Task 3: Session + shell

- [ ] DeviceSessionContext, Shell, TopNav

### Task 4: Pages

- [ ] Connect, Buttons, Sensor, Macro, Settings wired to session/mock

### Task 5: Verify

- [ ] `npm run build` succeeds; app runs with mock
