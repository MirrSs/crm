"use client"
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
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
  const [draft, setDraft] = useState<Activity | null>(null)
  const [dirty, setDirty] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [historyItems, setHistoryItems] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const id = Number(params.id)

  useEffect(() => {
    ;(async () => {
      const { data } = await api.get(`/api/v1/activities/${id}/`)
      setActivity(data as any)
      setDraft(data as any)
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

  function updateDraft(patch: Partial<Activity>) {
    if (!draft) return
    const next = { ...(draft as any), ...patch }
    setDraft(next)
    const orig = activity || {}
    const keys = new Set([...Object.keys(next), ...Object.keys(orig as any)])
    let changed = false
    for (const k of keys) { if ((next as any)[k] !== (orig as any)[k]) { changed = true; break } }
    setDirty(changed)
  }

  function buildPatch(): Partial<Activity> {
    const patch: any = {}
    if (!activity || !draft) return patch
    const keys = new Set([...Object.keys(draft), ...Object.keys(activity)])
    keys.forEach(k => { if ((draft as any)[k] !== (activity as any)[k]) patch[k] = (draft as any)[k] })
    return patch
  }

  async function saveChanges() {
    if (!dirty || !activity) return
    const patch = buildPatch()
    const { data } = await api.patch(`/api/v1/activities/${activity.id}/`, patch)
    setActivity(data as any)
    setDraft(data as any)
    setDirty(false)
    setNotice('Сохранено')
    setTimeout(()=>setNotice(null), 2000)
  }

  function cancelChanges() {
    setDraft(activity)
    setDirty(false)
    setNotice('Изменения отменены')
    setTimeout(()=>setNotice(null), 2000)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault()
        if (dirty) saveChanges()
      }
      if (e.key === 'Escape' && dirty) {
        e.preventDefault()
        cancelChanges()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dirty, draft, activity])

  if (!activity) return <div className="cloud p-4">Загрузка...</div>

  return (
    <div className="space-y-3">
      <div className="cloud p-4 flex items-center justify-between">
        <div className="text-lg font-semibold">{activity.subject || (activity.type && (typeRu[activity.type] || activity.type))}</div>
        <div className="flex items-center gap-3">
          <button
            className="text-blue-700 underline flex items-center gap-1"
            onClick={async () => {
              setShowHistory(true)
              if (historyItems.length === 0) {
                try {
                  setHistoryLoading(true)
                  const { data } = await api.get('/api/v1/history/', { params: { entity_type: 'activities', entity_id: id, page: 1, limit: 100 } })
                  setHistoryItems((data as any).items || [])
                } finally {
                  setHistoryLoading(false)
                }
              }
            }}
            title="История изменений"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7v3l5-4-5-4v3z"/></svg>
            История
          </button>
          <button className="btn-primary" disabled={loading} onClick={onDelete}>Удалить</button>
        </div>
      </div>
      <div className="cloud p-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-500">Тип</div>
          <select className="cloud p-2 w-full" value={draft?.type || ''} onChange={e=>updateDraft({ type: e.target.value })}>
            <option value="call">Звонок</option>
            <option value="meeting">Встреча</option>
            <option value="task">Задача</option>
            <option value="email">Письмо</option>
            <option value="demo">Демо</option>
          </select>
        </div>
        <div>
          <div className="text-gray-500">Срок</div>
          <input className="cloud p-2 w-full" type="datetime-local" value={draft?.due_at ? new Date(draft.due_at).toISOString().slice(0,16) : ''} onChange={e=>updateDraft({ due_at: new Date(e.target.value).toISOString() })} />
        </div>
        <div>
          <div className="text-gray-500">Статус</div>
          <select className="cloud p-2 w-full" value={draft?.completed ? '1':'0'} onChange={e=>updateDraft({ completed: e.target.value === '1' })}>
            <option value="0">Открыта</option>
            <option value="1">Выполнено</option>
          </select>
        </div>
        <div>
          <div className="text-gray-500">Ответственный</div>
          <div className="flex items-center gap-2">
            <select className="cloud p-1" value={draft?.owner_user_id || ''} onChange={e=>updateDraft({ owner_user_id: Number(e.target.value) })}>
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
            <select className="cloud p-2 w-full" value={draft?.company_id || ''} onChange={e=>updateDraft({ company_id: e.target.value ? Number(e.target.value) : undefined })}>
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
            <select className="cloud p-2 w-full" value={draft?.contact_id || ''} onChange={e=>updateDraft({ contact_id: e.target.value ? Number(e.target.value) : undefined })}>
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
            <select className="cloud p-2 w-full" value={draft?.deal_id || ''} onChange={e=>updateDraft({ deal_id: e.target.value ? Number(e.target.value) : undefined })}>
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
          <input className="cloud p-2 w-full" value={draft?.subject || ''} onChange={e=>updateDraft({ subject: e.target.value })} />
        </div>
        <div className="col-span-2">
          <div className="text-gray-500">Описание</div>
          <textarea className="cloud p-2 w-full" rows={4} value={draft?.description || ''} onChange={e=>updateDraft({ description: e.target.value })} />
      {dirty ? (
        (typeof window !== 'undefined' ? createPortal(
          <div className="fixed bottom-6 right-6 cloud p-3 flex items-center gap-2 z-50">
            <button className="cloud px-3 py-1" onClick={cancelChanges}>Отменить</button>
            <button className="btn-primary" onClick={saveChanges}>Сохранить (Ctrl+S)</button>
          </div>,
          document.body
        ) : null)
      ) : null}
      {notice ? (
        (typeof window !== 'undefined' ? createPortal(
          <div className="fixed top-6 left-1/2 -translate-x-1/2 cloud px-3 py-2 z-50">{notice}</div>,
          document.body
        ) : null)
      ) : null}
        </div>
      </div>
      {showHistory ? (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowHistory(false)}>
          <div className="cloud p-4 w-full max-w-2xl max-h-[80vh] overflow-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <div className="font-medium">История изменений</div>
              <div className="ml-auto" />
              <button className="text-gray-600" onClick={()=>setShowHistory(false)}>✕</button>
            </div>
            {historyLoading ? (
              <div className="p-2 text-sm">Загрузка...</div>
            ) : (
              <div className="space-y-3">
                {historyItems.length === 0 ? (
                  <div className="text-sm text-gray-500">Нет записей</div>
                ) : (
                  historyItems.map((h: any) => (
                    <div key={h.id} className="border border-white/40 rounded p-2">
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <span>{h.created_at ? new Date(h.created_at).toLocaleString() : ''}</span>
                        <span>·</span>
                        <span>{h.action === 'create' ? 'Создание' : h.action === 'update' ? 'Изменение' : h.action === 'delete' ? 'Удаление' : h.action}</span>
                        {h.user_id ? (<><span>·</span><span>{userName(h.user_id)}</span></>) : null}
                      </div>
                      {Array.isArray(h.changes) && h.changes.length > 0 ? (
                        <table className="w-full text-xs mt-2">
                          <thead>
                            <tr className="text-gray-500">
                              <th className="text-left py-1 pr-2">Поле</th>
                              <th className="text-left py-1 pr-2">Было</th>
                              <th className="text-left py-1">Стало</th>
                            </tr>
                          </thead>
                          <tbody>
                            {h.changes.map((c: any, idx: number) => (
                              <tr key={idx} className="border-t border-white/30">
                                <td className="py-1 pr-2 align-top">{c.field}</td>
                                <td className="py-1 pr-2 align-top">{String(c.old ?? '')}</td>
                                <td className="py-1 align-top">{String(c.new ?? '')}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : null}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

