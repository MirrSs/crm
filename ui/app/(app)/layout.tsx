import { ReactNode } from 'react'
import ThemeToggle from '../theme-toggle'
import SidebarFooter from '../sidebar-footer'

const nav = [
  { href: '/kanban', label: 'Канбан', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3h8v8H3V3zm10 0h8v8h-8V3zM3 13h8v8H3v-8zm10 0h8v8h-8v-8z"/></svg>
  ) },
  { href: '/calendar', label: 'Календарь', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7 2h2v3h6V2h2v3h3v17H4V5h3V2zm-1 7v11h12V9H6z"/></svg>
  ) },
  { href: '/chats', label: 'Чаты', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16v12H7l-3 3V4z"/></svg>
  ) },
  // { href: '/ai', label: 'ИИ-Помощник', icon: (
  //   <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4 4h16v12H7l-3 3V4z"/></svg>
  // ) },
  { href: '/deals', label: 'Сделки', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M9 3h6v3h5v14H4V6h5V3zm2 0v3h2V3h-2z"/>
    </svg>
  ) },
  { href: '/leads', label: 'Лиды', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 4h18l-6 7v7l-6 2v-9L3 4z"/></svg>
  ) },
  { href: '/activities', label: 'Активности', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 11H3V9h6v2zm0 4H3v-2h6v2zm2-6 2 2 5-5 1.4 1.4L13 13l-3.4-3.4L11 9z"/></svg>
  ) },
  { href: '/companies', label: 'Компании', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 4h16v16H4V4zm3 3h3v3H7V7zm0 5h3v3H7v-3zm7-5h3v3h-3V7zm0 5h3v3h-3v-3z"/>
    </svg>
  ) },
  { href: '/contacts', label: 'Контакты', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 11c1.66 0 3-1.34 3-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zM8 11c1.66 0 3-1.34 3-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.67 0-8 1.34-8 4v2h10v-2c0-1.1.9-2 2-2h2.09c-.06-.33-.09-.66-.09-1 0-1.05.27-2.03.74-2.89C13.46 12.41 10.94 13 8 13zm8 0c-2.21 0-4 1.79-4 4v2h8v-2c0-2.21-1.79-4-4-4z"/></svg>
  ) },
  { href: '/products', label: 'Продукты', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21 8l-9-5-9 5 9 5 9-5zm-9 7L3 10v6l9 5 9-5v-6l-9 5z"/></svg>
  ) },
  { href: '/services', label: 'Услуги', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8zm0-6h2l.5 2 2 .9 1.6-1.2 1.4 1.4-1.2 1.6.9 2 2 .5v2l-2 .5-.9 2 1.2 1.6-1.4 1.4-1.6-1.2-2 .9-.5 2h-2l-.5-2-2-.9-1.6 1.2-1.4-1.4 1.2-1.6-.9-2-2-.5v-2l2-.5.9-2-1.2-1.6 1.4-1.4 1.6 1.2 2-.9.5-2z"/>
    </svg>
  ) },
  { href: '/settings/users', label: 'Пользователи', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.7 0 8 1.3 8 4v4H4v-4c0-2.7 5.3-4 8-4zm0-2a4 4 0 1 1 .001-8.001A4 4 0 0 1 12 10z"/></svg>
  ) },
  { href: '/settings/custom-fields', label: 'Пользовательские поля', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M3 7h14v2H3V7zm0 4h18v2H3v-2zm0 4h10v2H3v-2z"/></svg>
  ) },
  { href: '/reports/users', label: 'Отчёты', icon: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5 9h3v10H5V9zm5-4h3v14h-3V5zm5 7h3v7h-3v-7z"/></svg>
  ) },
]

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-[260px_1fr] gap-4 p-4">
      <aside className="cloud p-4 h-[calc(100vh-2rem)] sticky top-4 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold">CRM</div>
          <ThemeToggle />
        </div>
        <nav className="space-y-1">
          {nav.map(i => (
            <a key={i.href} className="block px-3 py-2 rounded-xl hover:bg-peach-100 flex items-center gap-2" href={i.href}>
              <span className="text-gray-600 dark:text-gray-300">{i.icon}</span>
              <span>{i.label}</span>
            </a>
          ))}
        </nav>
        <div className="mt-auto pt-4">
          <SidebarFooter />
        </div>
      </aside>
      <main className="pr-4">
        {children}
      </main>
    </div>
  )}


