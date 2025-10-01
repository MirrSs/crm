"use client"
import { useEffect, useState } from 'react'
import { api } from '../lib/api'

type UserMe = { id: number; name?: string; email?: string }

export default function SidebarFooter() {
  const [user, setUser] = useState<UserMe | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let ignore = false
    ;(async () => {
      setLoading(true)
      try {
        const { data } = await api.get('/api/v1/users/mine/')
        if (!ignore) setUser(data as any)
      } catch {}
      finally { if (!ignore) setLoading(false) }
    })()
    return () => { ignore = true }
  }, [])

  async function logout() {
    // Очистить access токен, удалить refresh cookie невозможно с клиента, но можно переписать/попросить бэкенд
    if (typeof window !== 'undefined') sessionStorage.removeItem('access_token')
    // Мягкий редирект на логин
    window.location.href = '/auth/login'
  }

  const displayName = user?.name || user?.email || 'Пользователь'

  return (
    <div className="cloud p-3 flex items-center justify-between">
      <div className="text-sm">
        <div className="font-medium">{displayName}</div>
      </div>
      <button onClick={logout} className="btn-primary px-3 py-1 text-sm">Выйти</button>
    </div>
  )
}

