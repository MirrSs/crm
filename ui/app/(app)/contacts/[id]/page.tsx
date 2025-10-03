"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'

type Contact = { id: number; first_name?: string; last_name?: string; email?: string; phone?: string; position?: string; company_id?: number; owner_user_id?: number }
type Company = { id: number; name?: string }
type User = { id: number; name?: string; email?: string }
type Deal = { id: number; name?: string; amount?: number; currency?: string; pipeline_id?: number; stage_id?: number; owner_user_id?: number }
type Pipeline = { id: number; name: string }
type Stage = { id: number; name: string; pipeline_id: number }
type Activity = { id: number; type?: string; subject?: string; due_at?: string; completed?: boolean; owner_user_id?: number }

export default function ContactCardPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [contact, setContact] = useState<Contact | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [stages, setStages] = useState<Stage[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [activities, setActivities] = useState<Activity[]>([])

  useEffect(() => {
    ;(async () => {
      const [{ data: c }, { data: u }, { data: comps }] = await Promise.all([
        api.get(`/api/v1/contacts/${id}/`),
        api.get('/api/v1/users/', { params: { page: 1, limit: 100 } }),
        api.get('/api/v1/companies/', { params: { page: 1, limit: 100 } }),
      ])
      setContact(c as any)
      setUsers((u as any).users || [])
      setCompanies((comps as any).companies || [])
    })()
  }, [id])

  useEffect(() => {
    ;(async () => {
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
        api.get('/api/v1/deals/', { params: { contact_id: id, page: 1, limit: 100 } }),
        api.get('/api/v1/activities/', { params: { contact_id: id, page: 1, limit: 100 } }),
      ])
      setDeals(((d as any).deals || []).slice().sort((x: any, y: any) => y.id - x.id))
      setActivities(((a as any).activities || []).slice().sort((x: any, y: any) => y.id - x.id))
    })()
  }, [id])

  async function updateContactPatch(patch: Partial<Contact>) {
    if (!contact) return
    const { data } = await api.patch(`/api/v1/contacts/${id}/`, patch)
    setContact(data as any)
  }

  async function onDelete() {
    if (!confirm('Удалить контакт?')) return
    setLoading(true)
    try {
      await api.delete(`/api/v1/contacts/${id}/`)
      router.replace('/contacts')
    } finally { setLoading(false) }
  }

  const userName = (uid?: number) => {
    if (!uid) return '-'
    const u = users.find(u => u.id === uid)
    return u?.name || u?.email || '-'
  }
  const pipelineName = (pid?: number) => pipelines.find(p => p.id === pid)?.name || '-'
  const stageName = (sid?: number) => stages.find(s => s.id === sid)?.name || '-'
  const t = (k?: string) => {
    const map: Record<string, string> = { task: 'Задача', call: 'Звонок', meeting: 'Встреча', email: 'Email', note: 'Заметка' }
    return k ? (map[k] || k) : '-'
  }

  if (!contact) return <div className="cloud p-4">Загрузка...</div>

  return (
    <div className="space-y-3">
      <div className="cloud p-3 flex items-center gap-2">
        <div className="font-medium">{`${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Контакт'}</div>
        <div className="ml-auto" />
        <button className="btn-primary" onClick={onDelete} disabled={loading}>{loading ? '...' : 'Удалить'}</button>
      </div>

      <div className="cloud p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500">Имя</label>
          <input className="w-full cloud p-2" value={contact.first_name || ''} onChange={e=>updateContactPatch({ first_name: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-gray-500">Фамилия</label>
          <input className="w-full cloud p-2" value={contact.last_name || ''} onChange={e=>updateContactPatch({ last_name: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-gray-500">Компания</label>
          <select className="w-full cloud p-2" value={contact.company_id || ''} onChange={e=>updateContactPatch({ company_id: e.target.value ? Number(e.target.value) : undefined })}>
            <option value="">Не указана</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">Владелец</label>
          <select className="w-full cloud p-2" value={contact.owner_user_id || ''} onChange={e=>updateContactPatch({ owner_user_id: e.target.value ? Number(e.target.value) : undefined })}>
            <option value="">Не указан</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">Должность</label>
          <input className="w-full cloud p-2" value={contact.position || ''} onChange={e=>updateContactPatch({ position: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-gray-500">Email</label>
          <input className="w-full cloud p-2" value={contact.email || ''} onChange={e=>updateContactPatch({ email: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-gray-500">Телефон</label>
          <input className="w-full cloud p-2" value={contact.phone || ''} onChange={e=>updateContactPatch({ phone: e.target.value })} />
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


