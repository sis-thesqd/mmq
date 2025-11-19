import { useEffect, useState } from 'react'

/**
 * Hook to detect and sync with parent application's theme
 *
 * This hook checks if the parent document (or any ancestor) has the 'dark' class
 * and returns the current theme. It also listens for theme changes via MutationObserver.
 *
 * This allows the MMQ federated module to inherit the theme from its parent application
 * without needing explicit theme props.
 */
export function useParentTheme(): 'light' | 'dark' {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light'

    // Check multiple possible locations for dark mode class
    const isDark =
      document.documentElement.classList.contains('dark') ||
      document.body.classList.contains('dark')

    return isDark ? 'dark' : 'light'
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateTheme = () => {
      const isDark =
        document.documentElement.classList.contains('dark') ||
        document.body.classList.contains('dark')

      setTheme(isDark ? 'dark' : 'light')
    }

    // Watch for class changes on html and body elements
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          updateTheme()
        }
      })
    })

    // Observe both html and body for class changes
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
    })

    // Initial check
    updateTheme()

    return () => {
      observer.disconnect()
    }
  }, [])

  return theme
}
