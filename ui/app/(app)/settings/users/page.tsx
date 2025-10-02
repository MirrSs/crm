"use client"
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'

type User = { id: number; name?: string; email?: string; role?: string; created_at?: string }

export default function UsersSettingsPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [data, setData] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const router = useRouter()

  useEffect(() => {
    ;(async () => {
      const params: any = { page, limit }
      if (name) params.name = name
      if (email) params.email = email
      if (role) params.role = role
      const { data } = await api.get('/api/v1/users/', { params })
      const items: User[] = (data as any).users || []
      setData(items)
      setTotal(((data as any).pagination?.total) || 0)
    })()
  }, [page, limit, name, email, role])

  const pages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="space-y-3">
      <div className="cloud p-3 flex items-center gap-2">
        <div className="font-medium">Пользователи</div>
        <input className="cloud p-2 ml-auto" placeholder="Имя" value={name} onChange={e=>{ setPage(1); setName(e.target.value) }} />
        <input className="cloud p-2" placeholder="Email" value={email} onChange={e=>{ setPage(1); setEmail(e.target.value) }} />
        <select className="cloud p-2" value={role} onChange={e=>{ setPage(1); setRole(e.target.value) }}>
          <option value="">Все роли</option>
          <option value="owner">Owner</option>
          <option value="manager">Manager</option>
          <option value="worker">Worker</option>
        </select>
      </div>
      <div className="cloud p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/50">
            <tr>
              <th className="text-left p-3">Имя</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Роль</th>
              <th className="text-left p-3">Создан</th>
            </tr>
          </thead>
          <tbody>
            {data.map(u => (
              <tr key={u.id} className="border-t border-white/40 cursor-pointer hover:bg-peach-100" onClick={()=>router.push(`/users/${u.id}`)}>
                <td className="p-3">{u.name || '-'}</td>
                <td className="p-3">{u.email || '-'}</td>
                <td className="p-3">{u.role || '-'}</td>
                <td className="p-3">{u.created_at ? new Date(u.created_at).toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2 cloud p-2">
        <button className="btn-primary" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Назад</button>
        <div className="text-xs text-gray-500">Стр. {page} из {pages}</div>
        <button className="btn-primary" disabled={page>=pages} onClick={()=>setPage(p=>p+1)}>Вперёд</button>
        <div className="ml-auto" />
        <select className="cloud p-2" value={limit} onChange={e=>{ setPage(1); setLimit(Number(e.target.value)) }}>
          {[10,20,50,100].map(n => <option key={n} value={n}>{n}/стр</option>)}
        </select>
      </div>
    </div>
  )
}


