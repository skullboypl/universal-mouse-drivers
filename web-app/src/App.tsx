import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Shell } from './components/Shell'
import {
  LangHomeRedirect,
  LocaleRedirect,
  LocaleRoute,
} from './i18n/LocaleContext'
import { ButtonsPage } from './pages/ButtonsPage'
import { ConnectPage } from './pages/ConnectPage'
import { MacroPage } from './pages/MacroPage'
import { SensorPage } from './pages/SensorPage'
import { SettingsPage } from './pages/SettingsPage'
import { DeviceSessionProvider } from './session/DeviceSessionContext'

export default function App() {
  return (
    <DeviceSessionProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LocaleRedirect />} />
          <Route path="/:lang" element={<LocaleRoute />}>
            <Route element={<Shell />}>
              <Route index element={<ConnectPage />} />
              <Route path="device/buttons" element={<ButtonsPage />} />
              <Route path="device/sensor" element={<SensorPage />} />
              <Route path="device/macro" element={<MacroPage />} />
              <Route path="device/settings" element={<SettingsPage />} />
              <Route path="*" element={<LangHomeRedirect />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </DeviceSessionProvider>
  )
}
