"use client"
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'

type Activity = { id: number; type?: string; subject?: string; due_at?: string; completed?: boolean; owner_user_id?: number }
type User = { id: number; name?: string; email?: string }

const typeRu: Record<string,string> = {
  task: 'Задача',
  call: 'Звонок',
  meeting: 'Встреча',
  email: 'Письмо',
  note: 'Заметка',
}
const typeList = ['task','call','meeting','email','note']

export default function ActivitiesPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [type, setType] = useState('')
  const [owner, setOwner] = useState<number | ''>('')
  const [data, setData] = useState<Activity[]>([])
  const [total, setTotal] = useState(0)
  const [users, setUsers] = useState<User[]>([])
  const router = useRouter()

  useEffect(() => {
    ;(async () => {
      const params: any = { page, limit }
      if (type) params.type = type
      if (owner) params.owner_user_id = owner
      const { data } = await api.get('/api/v1/activities/', { params })
      const items: Activity[] = ((data as any).activities || [])
      setData(items.slice().sort((a, b) => b.id - a.id))
      setTotal(((data as any).pagination?.total) || 0)
    })()
  }, [page, limit, type, owner])

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
        <div className="font-medium">Активности</div>
        <div className="ml-auto" />
        <select className="cloud p-2" value={type} onChange={e=>{ setPage(1); setType(e.target.value) }}>
          <option value="">Все типы</option>
          {typeList.map(t => <option key={t} value={t}>{typeRu[t]}</option>)}
        </select>
        <select className="cloud p-2" value={owner} onChange={e=>{ setPage(1); setOwner(e.target.value ? Number(e.target.value) : '') }}>
          <option value="">Все ответственные</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
        </select>
      </div>
      <div className="cloud p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/50">
            <tr>
              <th className="text-left p-3">Тип</th>
              <th className="text-left p-3">Тема</th>
              <th className="text-left p-3">Срок</th>
              <th className="text-left p-3">Статус</th>
              <th className="text-left p-3">Ответственный</th>
            </tr>
          </thead>
          <tbody>
            {data.map(d => (
              <tr key={d.id} className="border-t border-white/40 cursor-pointer hover:bg-peach-100" onClick={()=>router.push(`/activities/${d.id}`)}>
                <td className="p-3">{(d.type && typeRu[d.type]) || d.type || '-'}</td>
                <td className="p-3">{d.subject}</td>
                <td className="p-3">{d.due_at ? new Date(d.due_at).toLocaleString() : '-'}</td>
                <td className="p-3">{d.completed ? 'Выполнено' : 'Открыта'}</td>
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
  )}
