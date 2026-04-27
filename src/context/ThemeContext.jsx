import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const STORAGE_KEY = 'theme'

const Ctx = createContext(null)

function applyTheme(theme) {
  if (typeof document === 'undefined') return
  const effective = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme
  document.documentElement.classList.toggle('dark', effective === 'dark')
}

function readInitial() {
  if (typeof localStorage === 'undefined') return 'system'
  return localStorage.getItem(STORAGE_KEY) || 'system'
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readInitial)

  // theme 변경 시 적용 + 저장
  useEffect(() => {
    applyTheme(theme)
    try { localStorage.setItem(STORAGE_KEY, theme) } catch { /* private mode */ }
  }, [theme])

  // system 모드일 때 OS 테마 변경 감지
  useEffect(() => {
    if (theme !== 'system') return
    const m = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => applyTheme('system')
    m.addEventListener('change', handler)
    return () => m.removeEventListener('change', handler)
  }, [theme])

  const setTheme = useCallback((t) => setThemeState(t), [])

  return <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>
}

export function useTheme() {
  return useContext(Ctx)
}
