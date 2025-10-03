"use client"
import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'

type Company = { id: number; name?: string; website?: string; email?: string; phone?: string; country?: string; city?: string; address?: string; owner_user_id?: number }
type User = { id: number; name?: string; email?: string }
type Deal = { id: number; name?: string; amount?: number; currency?: string; pipeline_id?: number; stage_id?: number; owner_user_id?: number }
type Pipeline = { id: number; name: string }
type Stage = { id: number; name: string; pipeline_id: number }
type Activity = { id: number; type?: string; subject?: string; due_at?: string; completed?: boolean; owner_user_id?: number }

export default function CompanyCardPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [company, setCompany] = useState<Company | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [stages, setStages] = useState<Stage[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    ;(async () => {
      const [{ data: c }, { data: u }] = await Promise.all([
        api.get(`/api/v1/companies/${id}/`),
        api.get('/api/v1/users/', { params: { page: 1, limit: 100 } }),
      ])
      setCompany(c as any)
      setUsers((u as any).users || [])
    })()
  }, [id])

  useEffect(() => {
    ;(async () => {
      // load pipelines and stages for displaying names in related deals
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

  useEffect(() => {
    ;(async () => {
      const [{ data: d }, { data: a }] = await Promise.all([
        api.get('/api/v1/deals/', { params: { company_id: id, page: 1, limit: 100 } }),
        api.get('/api/v1/activities/', { params: { company_id: id, page: 1, limit: 100 } }),
      ])
      setDeals(((d as any).deals || []).slice().sort((x: any, y: any) => y.id - x.id))
      setActivities(((a as any).activities || []).slice().sort((x: any, y: any) => y.id - x.id))
    })()
  }, [id])

  async function updateCompanyPatch(patch: Partial<Company>) {
    if (!company) return
    const { data } = await api.patch(`/api/v1/companies/${id}/`, patch)
    setCompany(data as any)
  }

  async function onDelete() {
    if (!confirm('Удалить компанию?')) return
    setLoading(true)
    try {
      await api.delete(`/api/v1/companies/${id}/`)
      router.replace('/companies')
    } finally { setLoading(false) }
  }

  const userName = (uid?: number) => {
    if (!uid) return '-'
    const u = users.find(u => u.id === uid)
    return u?.name || u?.email || '-'
  }
  const pipelineName = (pid?: number) => {
    if (!pid) return '-'
    return pipelines.find(p => p.id === pid)?.name || '-'
  }
  const stageName = (sid?: number) => {
    if (!sid) return '-'
    return stages.find(s => s.id === sid)?.name || '-'
  }
  const t = (k?: string) => {
    const map: Record<string, string> = { task: 'Задача', call: 'Звонок', meeting: 'Встреча', email: 'Email', note: 'Заметка' }
    return k ? (map[k] || k) : '-'
  }

  if (!company) return <div className="cloud p-4">Загрузка...</div>

  return (
    <div className="space-y-3">
      <div className="cloud p-3 flex items-center gap-2">
        <div className="font-medium">{company.name || 'Компания'}</div>
        <div className="ml-auto" />
        <button className="btn-primary" onClick={onDelete} disabled={loading}>{loading ? '...' : 'Удалить'}</button>
      </div>

      <div className="cloud p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500">Название</label>
          <input className="w-full cloud p-2" value={company.name || ''} onChange={e=>updateCompanyPatch({ name: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-gray-500">Владелец</label>
          <select className="w-full cloud p-2" value={company.owner_user_id || ''} onChange={e=>updateCompanyPatch({ owner_user_id: e.target.value ? Number(e.target.value) : undefined })}>
            <option value="">Не указан</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">Сайт</label>
          <input className="w-full cloud p-2" value={company.website || ''} onChange={e=>updateCompanyPatch({ website: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-gray-500">Email</label>
          <input className="w-full cloud p-2" value={company.email || ''} onChange={e=>updateCompanyPatch({ email: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-gray-500">Телефон</label>
          <input className="w-full cloud p-2" value={company.phone || ''} onChange={e=>updateCompanyPatch({ phone: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-gray-500">Страна</label>
          <input className="w-full cloud p-2" value={company.country || ''} onChange={e=>updateCompanyPatch({ country: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-gray-500">Город</label>
          <input className="w-full cloud p-2" value={company.city || ''} onChange={e=>updateCompanyPatch({ city: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs text-gray-500">Адрес</label>
          <input className="w-full cloud p-2" value={company.address || ''} onChange={e=>updateCompanyPatch({ address: e.target.value })} />
        </div>
      </div>

      <div className="cloud p-0 overflow-hidden">
        <div className="p-3 font-medium">Связанные сделки</div>
        <table className="w-full text-sm">
          <thead className="bg-white/50">
            <tr>
              <th className="text-left p-3">Название</th>
              <th className="text-left p-3">Сумма</th>
              <th className="text-left p-3">Пайплайн</th>
              <th className="text-left p-3">Стадия</th>
              <th className="text-left p-3">Ответственный</th>
            </tr>
          </thead>
          <tbody>
            {deals.map(d => (
              <tr key={d.id} className="border-t border-white/40 cursor-pointer hover:bg-peach-100" onClick={()=>router.push(`/deals/${d.id}`)}>
                <td className="p-3">{d.name}</td>
                <td className="p-3">{d.amount} {d.currency}</td>
                <td className="p-3">{pipelineName(d.pipeline_id)}</td>
                <td className="p-3">{stageName(d.stage_id)}</td>
                <td className="p-3">{userName(d.owner_user_id)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="cloud p-0 overflow-hidden">
        <div className="p-3 font-medium">Связанные активности</div>
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
            {activities.map(a => (
              <tr key={a.id} className="border-t border-white/40 cursor-pointer hover:bg-peach-100" onClick={()=>router.push(`/activities/${a.id}`)}>
                <td className="p-3">{t(a.type)}</td>
                <td className="p-3">{a.subject}</td>
                <td className="p-3">{a.due_at ? new Date(a.due_at).toLocaleString() : '-'}</td>
                <td className="p-3">{a.completed ? 'Выполнено' : 'Открыта'}</td>
                <td className="p-3">{userName(a.owner_user_id)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}


