import { useEffect } from 'react'
import { useLocalStorage } from './useLocalStorage'

export const THEMES = ['original', 'matrix', 'sonic'] as const
export type Theme = (typeof THEMES)[number]

export const THEME_LABELS: Record<Theme, string> = {
  original: 'Original',
  matrix: 'Matrix',
  sonic: 'Sonic',
}

export function useTheme() {
  const [theme, setTheme] = useLocalStorage<Theme>('pf_theme', 'matrix')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  return { theme, setTheme }
}
