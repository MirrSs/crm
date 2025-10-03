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
  const [draft, setDraft] = useState<Contact | null>(null)
  const [dirty, setDirty] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [stages, setStages] = useState<Stage[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [notice, setNotice] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [historyItems, setHistoryItems] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    ;(async () => {
      const [{ data: c }, { data: u }, { data: comps }] = await Promise.all([
        api.get(`/api/v1/contacts/${id}/`),
        api.get('/api/v1/users/', { params: { page: 1, limit: 100 } }),
        api.get('/api/v1/companies/', { params: { page: 1, limit: 100 } }),
      ])
      setContact(c as any)
      setDraft(c as any)
      setUsers((u as any).users || [])
      setCompanies((comps as any).companies || [])
    })()
  }, [id])

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
  }, [dirty, draft, contact])

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

  function updateDraft(patch: Partial<Contact>) {
    if (!draft) return
    const next = { ...(draft as any), ...patch }
    setDraft(next)
    const orig = contact || {}
    const keys = new Set([...Object.keys(next), ...Object.keys(orig as any)])
    let changed = false
    for (const k of keys) { if ((next as any)[k] !== (orig as any)[k]) { changed = true; break } }
    setDirty(changed)
  }

  function buildPatch(): Partial<Contact> {
    const patch: any = {}
    if (!contact || !draft) return patch
    const keys = new Set([...Object.keys(draft), ...Object.keys(contact)])
    keys.forEach(k => { if ((draft as any)[k] !== (contact as any)[k]) patch[k] = (draft as any)[k] })
    return patch
  }

  async function saveChanges() {
    if (!dirty) return
    const patch = buildPatch()
    const { data } = await api.patch(`/api/v1/contacts/${id}/`, patch)
    setContact(data as any)
    setDraft(data as any)
    setDirty(false)
    setNotice('Сохранено')
    setTimeout(()=>setNotice(null), 2000)
  }

  function cancelChanges() { setDraft(contact); setDirty(false); setNotice('Изменения отменены'); setTimeout(()=>setNotice(null), 2000) }

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
        <button
          className="text-blue-700 underline flex items-center gap-1"
          onClick={async () => {
            setShowHistory(true)
            if (historyItems.length === 0) {
              try {
                setHistoryLoading(true)
                const { data } = await api.get('/api/v1/history/', { params: { entity_type: 'contacts', entity_id: Number(id), page: 1, limit: 100 } })
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
        <button className="btn-primary" onClick={onDelete} disabled={loading}>{loading ? '...' : 'Удалить'}</button>
      </div>

      <div className="cloud p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500">Имя</label>
          <input className="w-full cloud p-2" value={draft?.first_name || ''} onChange={e=>updateDraft({ first_name: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-gray-500">Фамилия</label>
          <input className="w-full cloud p-2" value={draft?.last_name || ''} onChange={e=>updateDraft({ last_name: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-gray-500">Компания</label>
          <select className="w-full cloud p-2" value={draft?.company_id || ''} onChange={e=>updateDraft({ company_id: e.target.value ? Number(e.target.value) : undefined })}>
            <option value="">Не указана</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">Владелец</label>
          <select className="w-full cloud p-2" value={draft?.owner_user_id || ''} onChange={e=>updateDraft({ owner_user_id: e.target.value ? Number(e.target.value) : undefined })}>
            <option value="">Не указан</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">Должность</label>
          <input className="w-full cloud p-2" value={draft?.position || ''} onChange={e=>updateDraft({ position: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-gray-500">Email</label>
          <input className="w-full cloud p-2" value={draft?.email || ''} onChange={e=>updateDraft({ email: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-gray-500">Телефон</label>
          <input className="w-full cloud p-2" value={draft?.phone || ''} onChange={e=>updateDraft({ phone: e.target.value })} />
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
      {dirty ? (
        <div className="fixed bottom-6 right-6 cloud p-3 flex items-center gap-2 z-50">
          <button className="cloud px-3 py-1" onClick={cancelChanges}>Отменить</button>
          <button className="btn-primary" onClick={saveChanges}>Сохранить (Ctrl+S)</button>
        </div>
      ) : null}
      {notice ? (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 cloud px-3 py-2 z-50">{notice}</div>
      ) : null}
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


