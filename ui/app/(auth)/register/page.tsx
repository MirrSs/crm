"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      // 1) Create account
      const { data: account } = await api.post('/api/v1/accounts/', { name })

      // 2) Create owner user
      await api.post('/api/v1/users/', { name, email, password, account_id: (account as any).id, role: 'Owner' })

      // 3) Login
      const form = new URLSearchParams()
      form.set('username', email)
      form.set('password', password)
      const { data: tokens } = await api.post('/api/v1/tokens/', form, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
      sessionStorage.setItem('access_token', (tokens as any).access_token)
      router.replace('/kanban')
    } catch (e: any) {
      setError(e.message || 'Ошибка')
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h1 className="text-xl font-semibold">Регистрация</h1>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <input className="w-full cloud p-2" placeholder="Название компании" value={name} onChange={e=>setName(e.target.value)} />
      <input className="w-full cloud p-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="w-full cloud p-2" placeholder="Пароль" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button disabled={loading} className="w-full btn-primary">{loading ? '...' : 'Создать аккаунт'}</button>
      <p className="text-sm text-gray-500">Уже есть аккаунт? <a className="underline" href="/auth/login">Войти</a></p>
    </form>
  )
}

