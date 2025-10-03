"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const form = new URLSearchParams()
      form.set('username', email)
      form.set('password', password)
      const { data } = await api.post('/api/v1/tokens/', form, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      })
      sessionStorage.setItem('access_token', (data as any).access_token)
      router.replace('/kanban')
    } catch (e: any) {
      setError(e.message || 'Ошибка')
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h1 className="text-xl font-semibold">Вход</h1>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <input className="w-full cloud p-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
      <input className="w-full cloud p-2" placeholder="Пароль" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
      <button disabled={loading} className="w-full btn-primary">{loading ? '...' : 'Войти'}</button>
      <p className="text-sm text-gray-500">Нет аккаунта? <a className="underline" href="/sign-up">Зарегистрироваться</a></p>
    </form>
  )
}


