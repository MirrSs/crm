"use client"
import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'

type Deal = {
  id: number
  name?: string
  amount?: number
  currency?: string
  stage_id?: number
  pipeline_id?: number
  owner_user_id?: number
  created_at?: string
  expected_close_date?: string
}

type User = { id: number; name?: string; email?: string }
type Pipeline = { id: number; name: string }
type Stage = { id: number; name: string; pipeline_id: number }
type Me = { id: number; account_id: number }

export default function DealsPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [q, setQ] = useState('')
  const [owner, setOwner] = useState<number | ''>('')
  const [pipeline, setPipeline] = useState<number | ''>('')
  const [stage, setStage] = useState<number | ''>('')
  const [data, setData] = useState<Deal[]>([])
  const [total, setTotal] = useState(0)
  const [users, setUsers] = useState<User[]>([])
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [stages, setStages] = useState<Stage[]>([])
  const router = useRouter()
  const [me, setMe] = useState<Me | null>(null)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [bulkAction, setBulkAction] = useState<'delete'>('delete')
  const [showCreate, setShowCreate] = useState(false)
  const [newDeal, setNewDeal] = useState<{ name: string; pipeline_id: number | ''; stage_id: number | '' }>({ name: '', pipeline_id: '', stage_id: '' })

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
      if (pipeline) params.pipeline_id = pipeline
      if (stage) params.stage_id = stage
      const { data } = await api.get('/api/v1/deals/', { params })
      const items: Deal[] = ((data as any).deals || [])
      // show newest first if no explicit sort provided by backend
      setData(items.slice().sort((a, b) => b.id - a.id))
      setTotal(((data as any).pagination?.total) || 0)
    })()
  }, [page, limit, q, owner, pipeline, stage])

  useEffect(() => {
    ;(async () => {
      const { data } = await api.get('/api/v1/users/', { params: { page: 1, limit: 100 } })
      setUsers((data as any).users || [])
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      // load pipelines and all stages for mapping/filtering
      const { data: p } = await api.get('/api/v1/pipelines/', { params: { page: 1, limit: 100 } })
      const listP: Pipeline[] = (p as any).pipelines || []
      setPipelines(listP)
      const fetchedStages: Stage[] = []
      for (const pl of listP) {
        const { data: s } = await api.get('/api/v1/stages/', { params: { pipeline_id: pl.id, page: 1, limit: 100 } })
        const st: Stage[] = ((s as any).stages || []).map((x: any) => ({ ...x, pipeline_id: pl.id }))
        fetchedStages.push(...st)
      }
      setStages(fetchedStages)
    })()
  }, [])

  const userName = (id?: number) => {
    if (!id) return '-'
    const u = users.find(u => u.id === id)
    return u?.name || u?.email || '-'
  }

  const pipelineName = (id?: number) => {
    if (!id) return '-'
    const p = pipelines.find(p => p.id === id)
    return p?.name || '-'
  }

  const stageName = (id?: number) => {
    if (!id) return '-'
    const s = stages.find(s => s.id === id)
    return s?.name || '-'
  }

  const pages = Math.max(1, Math.ceil(total / limit))
  const allChecked = data.length > 0 && selected.size === data.length

  function toggleSelected(id: number, checked: boolean) {
    setSelected(prev => {
      const next = new Set(prev)
      if (checked) next.add(id); else next.delete(id)
      return next
    })
  }

  async function performBulkDelete() {
    const ids = Array.from(selected)
    await Promise.all(ids.map(id => api.delete(`/api/v1/deals/${id}/`).catch(()=>null)))
    setSelected(new Set())
    const { data } = await api.get('/api/v1/deals/', { params: { page, limit, name: q || undefined, owner_user_id: owner || undefined, pipeline_id: pipeline || undefined, stage_id: stage || undefined } })
    const items: Deal[] = ((data as any).deals || [])
    setData(items.slice().sort((a, b) => b.id - a.id))
    setTotal(((data as any).pagination?.total) || 0)
  }

  async function createDeal() {
    if (!newDeal.name || !newDeal.pipeline_id || !newDeal.stage_id) return
    const payload: any = {
      name: newDeal.name,
      pipeline_id: Number(newDeal.pipeline_id),
      stage_id: Number(newDeal.stage_id),
      owner_user_id: me?.id,
    }
    const { data: created } = await api.post('/api/v1/deals/', payload)
    setShowCreate(false)
    setNewDeal({ name: '', pipeline_id: '', stage_id: '' })
    setData(prev => [created as any, ...prev])
  }

  return (
    <div className="space-y-3">
      <div className="cloud p-3 flex items-center gap-2">
        <div className="font-medium">Сделки</div>
        <input className="cloud p-2" placeholder="Поиск по названию" value={q} onChange={e=>{ setPage(1); setQ(e.target.value) }} />
        <select className="cloud p-2" value={owner} onChange={e=>{ setPage(1); setOwner(e.target.value ? Number(e.target.value) : '') }}>
          <option value="">Все ответственные</option>
          {users.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
        </select>
        <select className="cloud p-2" value={pipeline} onChange={e=>{ const v = e.target.value; setPage(1); setPipeline(v ? Number(v) : ''); setStage('') }}>
          <option value="">Все пайплайны</option>
          {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select className="cloud p-2" value={stage} onChange={e=>{ const v = e.target.value; setPage(1); setStage(v ? Number(v) : '') }} disabled={!pipeline}>
          <option value="">Все стадии</option>
          {stages.filter(s => (pipeline ? s.pipeline_id === pipeline : true)).map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <div className="ml-auto" />
        <button className="btn-primary" onClick={()=>setShowCreate(true)}>Создать</button>
      </div>
      <div className="cloud p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/50">
            <tr>
              <th className="text-left p-3 w-8">
                <input className="accent-peach-500" style={{ accentColor: '#f4a261' }} type="checkbox" checked={allChecked} onChange={e=>{
                  const c = e.target.checked
                  if (c) setSelected(new Set(data.map(d => d.id)))
                  else setSelected(new Set())
                }} />
              </th>
              <th className="text-left p-3">Название</th>
              <th className="text-left p-3">Сумма</th>
              <th className="text-left p-3">Пайплайн</th>
              <th className="text-left p-3">Стадия</th>
              <th className="text-left p-3">Ответственный</th>
              <th className="text-left p-3">Дата создания</th>
              <th className="text-left p-3">Дата закрытия</th>
            </tr>
          </thead>
          <tbody>
            {data.map(d => (
              <tr key={d.id} className="border-t border-white/40 cursor-pointer hover:bg-peach-100" onClick={()=>router.push(`/deals/${d.id}`)}>
                <td className="p-3" onClick={e=>e.stopPropagation()}>
                  <input className="accent-peach-500" style={{ accentColor: '#f4a261' }} type="checkbox" checked={selected.has(d.id)} onChange={e=>toggleSelected(d.id, e.target.checked)} />
                </td>
                <td className="p-3">{d.name}</td>
                <td className="p-3">{d.amount} {d.currency}</td>
                <td className="p-3">{pipelineName(d.pipeline_id)}</td>
                <td className="p-3">{stageName(d.stage_id)}</td>
                <td className="p-3">{userName(d.owner_user_id)}</td>
                <td className="p-3">{d.created_at ? new Date(d.created_at).toLocaleString() : '-'}</td>
                <td className="p-3">{d.expected_close_date ? new Date(d.expected_close_date).toLocaleString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showCreate && (
        <div className="fixed inset-0 z-[60] bg-black/30 flex items-center justify-center" onClick={()=>setShowCreate(false)}>
          <div className="cloud p-4 w-full max-w-md" onClick={e=>e.stopPropagation()}>
            <div className="font-medium mb-2">Новая сделка</div>
            <input className="w-full cloud p-2 mb-2" placeholder="Название" value={newDeal.name} onChange={e=>setNewDeal({...newDeal, name: e.target.value})} />
            <select className="w-full cloud p-2 mb-2" value={newDeal.pipeline_id} onChange={e=>{ const v = e.target.value ? Number(e.target.value) : ''; setNewDeal({ ...newDeal, pipeline_id: v, stage_id: '' }) }}>
              <option value="">Выбрать пайплайн</option>
              {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select className="w-full cloud p-2 mb-2" value={newDeal.stage_id} onChange={e=>setNewDeal({ ...newDeal, stage_id: e.target.value ? Number(e.target.value) : '' })} disabled={!newDeal.pipeline_id}>
              <option value="">Выбрать стадию</option>
              {stages.filter(s=> newDeal.pipeline_id ? s.pipeline_id === newDeal.pipeline_id : true).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div className="flex gap-2 justify-end mt-2">
              <button className="cloud p-2" onClick={()=>setShowCreate(false)}>Отмена</button>
              <button className="btn-primary" onClick={createDeal}>Создать</button>
            </div>
          </div>
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
      {selected.size > 0 && (
        <div className="cloud p-3 fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 z-50">
          <div>Выбрано: {selected.size}</div>
          <select className="cloud p-2" value={bulkAction} onChange={e=>setBulkAction(e.target.value as any)}>
            <option value="delete">Удаление</option>
          </select>
          <button className="btn-primary" onClick={()=>{ if (bulkAction==='delete') performBulkDelete() }}>Выполнить</button>
        </div>
      )}
    </div>
  )
}

