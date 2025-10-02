"use client"
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'

type Lead = { id: number; first_name?: string; last_name?: string; email?: string; owner_user_id?: number }
type User = { id: number; name?: string; email?: string }

export default function LeadsPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [q, setQ] = useState('')
  const [data, setData] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [users, setUsers] = useState<User[]>([])
  const [owner, setOwner] = useState<number | ''>('')
  const router = useRouter()

  useEffect(() => {
    ;(async () => {
      const params: any = { page, limit }
      if (q) params.email = q
      if (owner) params.owner_user_id = owner
      const { data } = await api.get('/api/v1/leads/', { params })
      const items: Lead[] = ((data as any).leads || [])
      setData(items.slice().sort((a, b) => b.id - a.id))
      setTotal(((data as any).pagination?.total) || 0)
    })()
  }, [page, limit, q, owner])

  useEffect(() => {
    ;(async () => {
      const { data } = await api.get('/api/v1/users/', { params: { page: 1, limit: 100 } })
      setUsers((data as any).users || [])
    })()
  }, [])

  const userName = (id?: number) => {
    if (!id) return '-'
    const u = users.find(u => u.id === id)
    return u?.name || u?.email || '-'
  }

  const pages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="space-y-3">
      <div className="cloud p-3 flex items-center gap-2">
        <div className="font-medium">Лиды</div>
        <input className="cloud p-2 ml-auto" placeholder="Поиск по email" value={q} onChange={e=>{ setPage(1); setQ(e.target.value) }} />
        <select className="cloud p-2" value={owner} onChange={e=>{ setPage(1); setOwner(e.target.value ? Number(e.target.value) : '') }}>
          <option value="">Все ответственные</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
        </select>
      </div>
      <div className="cloud p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/50">
            <tr>
              <th className="text-left p-3">Имя</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Ответственный</th>
            </tr>
          </thead>
          <tbody>
            {data.map(d => (
              <tr key={d.id} className="border-t border-white/40 cursor-pointer hover:bg-peach-100" onClick={()=>router.push(`/leads/${d.id}`)}>
                <td className="p-3">{d.first_name} {d.last_name}</td>
                <td className="p-3">{d.email}</td>
                <td className="p-3">{userName(d.owner_user_id)}</td>
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

