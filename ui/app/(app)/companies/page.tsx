"use client"
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'

type Company = { id: number; name?: string; email?: string; phone?: string; owner_user_id?: number; city?: string }
type User = { id: number; name?: string; email?: string }
type Me = { id: number; account_id: number }

export default function CompaniesPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [q, setQ] = useState('')
  const [owner, setOwner] = useState<number | ''>('')
  const [data, setData] = useState<Company[]>([])
  const [total, setTotal] = useState(0)
  const [users, setUsers] = useState<User[]>([])
  const [me, setMe] = useState<Me | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [bulkAction, setBulkAction] = useState<'delete'>('delete')
  const [showCreate, setShowCreate] = useState(false)
  const [newCompany, setNewCompany] = useState<{ name: string; email?: string; phone?: string }>({ name: '' })
  const router = useRouter()

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await api.get('/api/v1/users/mine/')
        setMe(data as any)
      } catch {}
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      const params: any = { page, limit }
      if (q) params.name = q
      if (owner) params.owner_user_id = owner
      const { data } = await api.get('/api/v1/companies/', { params })
      const items: Company[] = ((data as any).companies || [])
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
  const allChecked = data.length > 0 && selected.size === data.length

  function toggleSelected(id: number, checked: boolean) {
    setSelected(prev => { const next = new Set(prev); if (checked) next.add(id); else next.delete(id); return next })
  }

  async function performBulkDelete() {
    const ids = Array.from(selected)
    await Promise.all(ids.map(id => api.delete(`/api/v1/companies/${id}/`).catch(()=>null)))
    setSelected(new Set())
    const { data } = await api.get('/api/v1/companies/', { params: { page, limit, name: q || undefined, owner_user_id: owner || undefined } })
    const items: Company[] = ((data as any).companies || [])
    setData(items.slice().sort((a, b) => b.id - a.id))
    setTotal(((data as any).pagination?.total) || 0)
  }

  async function createCompany() {
    if (!newCompany.name) return
    const payload: any = { name: newCompany.name, email: newCompany.email || undefined, phone: newCompany.phone || undefined, owner_user_id: me?.id }
    const { data: created } = await api.post('/api/v1/companies/', payload)
    setShowCreate(false)
    setNewCompany({ name: '' })
    setData(prev => [created as any, ...prev])
  }

  return (
    <div className="space-y-3">
      <div className="cloud p-3 flex items-center gap-2">
        <div className="font-medium">Компании</div>
        <input className="cloud p-2" placeholder="Поиск по названию" value={q} onChange={e=>{ setPage(1); setQ(e.target.value) }} />
        <select className="cloud p-2" value={owner} onChange={e=>{ setPage(1); setOwner(e.target.value ? Number(e.target.value) : '') }}>
          <option value="">Все ответственные</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
        </select>
        <div className="ml-auto" />
        <button className="btn-primary" onClick={()=>setShowCreate(true)}>Создать</button>
      </div>
      <div className="cloud p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/50">
            <tr>
              <th className="text-left p-3 w-8">
                <input className="accent-peach-500" style={{ accentColor: '#f4a261' }} type="checkbox" checked={allChecked} onChange={e=>{ const c = e.target.checked; if (c) setSelected(new Set(data.map(d => d.id))); else setSelected(new Set()) }} />
              </th>
              <th className="text-left p-3">Название</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Телефон</th>
              <th className="text-left p-3">Город</th>
              <th className="text-left p-3">Ответственный</th>
            </tr>
          </thead>
          <tbody>
            {data.map(d => (
              <tr key={d.id} className="border-t border-white/40 cursor-pointer hover:bg-peach-100" onClick={()=>router.push(`/companies/${d.id}`)}>
                <td className="p-3" onClick={e=>e.stopPropagation()}>
                  <input className="accent-peach-500" style={{ accentColor: '#f4a261' }} type="checkbox" checked={selected.has(d.id)} onChange={e=>toggleSelected(d.id, e.target.checked)} />
                </td>
                <td className="p-3">{d.name}</td>
                <td className="p-3">{d.email}</td>
                <td className="p-3">{d.phone}</td>
                <td className="p-3">{d.city}</td>
                <td className="p-3">{userName(d.owner_user_id)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showCreate && (
        <div className="fixed inset-0 z-[60] bg-black/30 flex items-center justify-center" onClick={()=>setShowCreate(false)}>
          <div className="cloud p-4 w-full max-w-md" onClick={e=>e.stopPropagation()}>
            <div className="font-medium mb-2">Новая компания</div>
            <input className="w-full cloud p-2 mb-2" placeholder="Название" value={newCompany.name} onChange={e=>setNewCompany({ ...newCompany, name: e.target.value })} />
            <input className="w-full cloud p-2 mb-2" placeholder="Email" value={newCompany.email || ''} onChange={e=>setNewCompany({ ...newCompany, email: e.target.value })} />
            <input className="w-full cloud p-2 mb-2" placeholder="Телефон" value={newCompany.phone || ''} onChange={e=>setNewCompany({ ...newCompany, phone: e.target.value })} />
            <div className="flex gap-2 justify-end mt-2">
              <button className="cloud p-2" onClick={()=>setShowCreate(false)}>Отмена</button>
              <button className="btn-primary" onClick={createCompany}>Создать</button>
            </div>
          </div>
        </div>
      )}
      {selected.size > 0 && (
        <div className="cloud p-3 fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 z-50">
          <div>Выбрано: {selected.size}</div>
          <select className="cloud p-2" value={bulkAction} onChange={e=>setBulkAction(e.target.value as any)}>
            <option value="delete">Удаление</option>
          </select>
          <button className="btn-primary" onClick={()=>{ if (bulkAction==='delete') performBulkDelete() }}>Выполнить</button>
        </div>
      )}
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

