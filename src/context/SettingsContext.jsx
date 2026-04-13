import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { fetchSettings, saveSettings, DEFAULT_SETTINGS } from '../github'

const Ctx = createContext(null)

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading,  setLoading]  = useState(true)
  const shaRef = useRef(null)

  useEffect(() => {
    fetchSettings().then(({ settings: data, sha }) => {
      setSettings({ ...DEFAULT_SETTINGS, ...data })
      shaRef.current = sha
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const updateSetting = useCallback(async (key, value) => {
    const next = { ...settings, [key]: value }
    setSettings(next)
    try {
      const newSha = await saveSettings(next, shaRef.current)
      shaRef.current = newSha
    } catch (e) {
      console.error('settings save failed', e)
    }
  }, [settings])

  return (
    <Ctx.Provider value={{ settings, loading, updateSetting }}>
      {children}
    </Ctx.Provider>
  )
}

export function useSettings() { return useContext(Ctx) }
