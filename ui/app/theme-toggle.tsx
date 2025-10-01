"use client"
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('theme') : null
    const isDark = saved ? saved === 'dark' : false
    setDark(isDark)
    if (typeof document !== 'undefined') document.documentElement.classList.toggle('dark', isDark)
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    if (typeof document !== 'undefined') document.documentElement.classList.toggle('dark', next)
    if (typeof window !== 'undefined') localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <button
      onClick={toggle}
      aria-label={dark ? 'Включить светлую тему' : 'Включить тёмную тему'}
      className="relative inline-flex items-center w-12 h-6 rounded-full transition bg-peach-200 dark:bg-white/10 shadow-soft"
    >
      {/* Sun icon */}
      <svg className="absolute left-1 w-4 h-4 text-yellow-500 opacity-100 dark:opacity-0 transition" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.8 1.42-1.42zM1 13h3v-2H1v2zm10 10h2v-3h-2v3zm9-10v-2h-3v2h3zm-3.95 7.76l1.79 1.79 1.41-1.41-1.79-1.79-1.41 1.41zM13 1h-2v3h2V1zm-7.76 14.95l-1.79 1.79 1.41 1.41 1.79-1.79-1.41-1.41zM12 6a6 6 0 100 12A6 6 0 0012 6z"/>
      </svg>
      {/* Moon icon */}
      <svg className="absolute right-1 w-4 h-4 text-gray-200 opacity-0 dark:opacity-100 transition" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M21.752 15.002A9 9 0 1112.998 2.248a7 7 0 108.754 12.754z"/>
      </svg>
      {/* thumb */}
      <span
        className={
          'absolute top-1 w-4 h-4 rounded-full bg-white dark:bg-gray-200 transition-transform ' +
          (dark ? 'translate-x-7' : 'translate-x-1')
        }
      />
    </button>
  )
}

