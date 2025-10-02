"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'

type Activity = { id: number; type?: string; subject?: string; description?: string; due_at?: string; completed?: boolean; owner_user_id?: number; company_id?: number; contact_id?: number; deal_id?: number }
type User = { id: number; name?: string; email?: string }
type Company = { id: number; name?: string }
type Contact = { id: number; first_name?: string; last_name?: string }
type Deal = { id: number; name?: string }
const typeRu: Record<string,string> = { call: 'Звонок', meeting: 'Встреча', task: 'Задача', email: 'Письмо', demo: 'Демо' }

export default function ActivityCardPage() {
  const params = useParams() as { id: string }
  const router = useRouter()
  const [activity, setActivity] = useState<Activity | null>(null)
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const id = Number(params.id)

  useEffect(() => {
    ;(async () => {
      const { data } = await api.get(`/api/v1/activities/${id}/`)
      setActivity(data as any)
      const [u, c, ct, d] = await Promise.all([
        api.get('/api/v1/users/', { params: { page: 1, limit: 100 } }),
        api.get('/api/v1/companies/', { params: { page: 1, limit: 100 } }),
        api.get('/api/v1/contacts/', { params: { page: 1, limit: 100 } }),
        api.get('/api/v1/deals/', { params: { page: 1, limit: 100 } }),
      ])
      setUsers((u.data as any).users || [])
      setCompanies((c.data as any).companies || [])
      setContacts((ct.data as any).contacts || [])
      setDeals((d.data as any).deals || [])
    })()
  }, [id])

  async function onDelete() {
    if (!confirm('Удалить активность?')) return
    setLoading(true)
    try {
      await api.delete(`/api/v1/activities/${id}/`)
      router.replace('/activities')
    } finally { setLoading(false) }
  }

  function userName(id?: number) {
    if (!id) return '-'
    const u = users.find(u => u.id === id)
    return u?.name || u?.email || '-'
  }

  async function updateActivityPatch(patch: Partial<Activity>) {
    if (!activity) return
    const { data } = await api.patch(`/api/v1/activities/${activity.id}/`, patch)
    setActivity(data as any)
  }

  if (!activity) return <div className="cloud p-4">Загрузка...</div>

  return (
    <div className="space-y-3">
      <div className="cloud p-4 flex items-center justify-between">
        <div className="text-lg font-semibold">{activity.subject || (activity.type && (typeRu[activity.type] || activity.type))}</div>
        <button className="btn-primary" disabled={loading} onClick={onDelete}>Удалить</button>
      </div>
      <div className="cloud p-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-500">Тип</div>
          <select className="cloud p-2 w-full" value={activity.type || ''} onChange={e=>updateActivityPatch({ type: e.target.value })}>
            <option value="call">Звонок</option>
            <option value="meeting">Встреча</option>
            <option value="task">Задача</option>
            <option value="email">Письмо</option>
            <option value="demo">Демо</option>
          </select>
        </div>
        <div>
          <div className="text-gray-500">Срок</div>
          <input className="cloud p-2 w-full" type="datetime-local" value={activity.due_at ? new Date(activity.due_at).toISOString().slice(0,16) : ''} onChange={e=>updateActivityPatch({ due_at: new Date(e.target.value).toISOString() })} />
        </div>
        <div>
          <div className="text-gray-500">Статус</div>
          <select className="cloud p-2 w-full" value={activity.completed ? '1':'0'} onChange={e=>updateActivityPatch({ completed: e.target.value === '1' })}>
            <option value="0">Открыта</option>
            <option value="1">Выполнено</option>
          </select>
        </div>
        <div>
          <div className="text-gray-500">Ответственный</div>
          <div className="flex items-center gap-2">
            <select className="cloud p-1" value={activity.owner_user_id || ''} onChange={e=>updateActivityPatch({ owner_user_id: Number(e.target.value) })}>
              {users.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
            </select>
            {activity.owner_user_id ? (
              <a className="text-blue-600 hover:text-blue-800" href={`/users/${activity.owner_user_id}`} title="Открыть пользователя">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14 3h7v7h-2V6.414l-9.293 9.293-1.414-1.414L17.586 5H14V3z"/><path d="M5 5h7v2H7v10h10v-5h2v7H5z"/></svg>
              </a>
            ) : null}
          </div>
        </div>
        <div>
          <div className="text-gray-500">Компания</div>
          <div className="flex items-center gap-2">
            <select className="cloud p-2 w-full" value={activity.company_id || ''} onChange={e=>updateActivityPatch({ company_id: e.target.value ? Number(e.target.value) : undefined })}>
              <option value="">—</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {activity.company_id ? (
              <a className="text-blue-600 hover:text-blue-800" href={`/companies/${activity.company_id}`} title="Открыть компанию">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14 3h7v7h-2V6.414l-9.293 9.293-1.414-1.414L17.586 5H14V3z"/><path d="M5 5h7v2H7v10h10v-5h2v7H5z"/></svg>
              </a>
            ) : null}
          </div>
        </div>
        <div>
          <div className="text-gray-500">Контакт</div>
          <div className="flex items-center gap-2">
            <select className="cloud p-2 w-full" value={activity.contact_id || ''} onChange={e=>updateActivityPatch({ contact_id: e.target.value ? Number(e.target.value) : undefined })}>
              <option value="">—</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
            </select>
            {activity.contact_id ? (
              <a className="text-blue-600 hover:text-blue-800" href={`/contacts/${activity.contact_id}`} title="Открыть контакт">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14 3h7v7h-2V6.414l-9.293 9.293-1.414-1.414L17.586 5H14V3z"/><path d="M5 5h7v2H7v10h10v-5h2v7H5z"/></svg>
              </a>
            ) : null}
          </div>
        </div>
        <div>
          <div className="text-gray-500">Сделка</div>
          <div className="flex items-center gap-2">
            <select className="cloud p-2 w-full" value={activity.deal_id || ''} onChange={e=>updateActivityPatch({ deal_id: e.target.value ? Number(e.target.value) : undefined })}>
              <option value="">—</option>
              {deals.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            {activity.deal_id ? (
              <a className="text-blue-600 hover:text-blue-800" href={`/deals/${activity.deal_id}`} title="Открыть сделку">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14 3h7v7h-2V6.414l-9.293 9.293-1.414-1.414L17.586 5H14V3z"/><path d="M5 5h7v2H7v10h10v-5h2v7H5z"/></svg>
              </a>
            ) : null}
          </div>
        </div>
        <div className="col-span-2">
          <div className="text-gray-500">Тема</div>
          <input className="cloud p-2 w-full" value={activity.subject || ''} onChange={e=>setActivity({ ...activity, subject: e.target.value })} onBlur={()=>updateActivityPatch({ subject: activity.subject })} />
        </div>
        <div className="col-span-2">
          <div className="text-gray-500">Описание</div>
          <textarea className="cloud p-2 w-full" rows={4} value={activity.description || ''} onChange={e=>setActivity({ ...activity, description: e.target.value })} onBlur={()=>updateActivityPatch({ description: activity.description })} />
        </div>
      </div>
    </div>
  )
}

