import { ReactNode } from 'react'
import ThemeToggle from '../theme-toggle'
import SidebarFooter from '../sidebar-footer'

const nav = [
  { href: '/kanban', label: 'Канбан' },
  { href: '/deals', label: 'Сделки' },
  { href: '/leads', label: 'Лиды' },
  { href: '/activities', label: 'Активности' },
  { href: '/companies', label: 'Компании' },
  { href: '/contacts', label: 'Контакты' },
  { href: '/products', label: 'Продукты' },
  { href: '/services', label: 'Услуги' },
  { href: '/settings/users', label: 'Пользователи' },
  { href: '/settings/custom-fields', label: 'Пользовательские поля' },
  { href: '/reports/users', label: 'Отчёты' },
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
            <a key={i.href} className="block px-3 py-2 rounded-xl hover:bg-peach-100" href={i.href}>{i.label}</a>
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


