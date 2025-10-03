"use client"
import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, format, isSameMonth } from 'date-fns'
import { ru } from 'date-fns/locale'
import { useRouter } from 'next/navigation'

type Activity = {
  id: number
  type: string
  subject?: string
  description?: string
  due_at?: string
  completed?: boolean
  owner_user_id?: number
}

type Deal = {
  id: number
  name: string
  expected_close_date?: string
  owner_user_id?: number
}

type User = { id: number; name?: string; email?: string; account_id?: number }
type Pipeline = { id: number; name: string }
type Stage = { id: number; name: string; pipeline_id: number }

const typeRu: Record<string, string> = {
  task: 'Задача',
  call: 'Звонок',
  meeting: 'Встреча',
  email: 'Письмо',
  note: 'Заметка',
}

export default function CalendarPage() {
  const [viewDate, setViewDate] = useState<Date>(() => new Date())
  const [mineOnly, setMineOnly] = useState<boolean>(false)
  const [showCompleted, setShowCompleted] = useState<boolean>(false)
  const [role, setRole] = useState<'owner'|'manager'|'worker'>('worker')
  const [me, setMe] = useState<{ id: number; name?: string; account_id?: number } | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [stages, setStages] = useState<Stage[]>([])
  const [createDay, setCreateDay] = useState<Date | null>(null)
  const [chooserOpen, setChooserOpen] = useState<{ dayKey: string } | null>(null)
  const [modal, setModal] = useState<{ kind: 'deal' | 'activity'; day: Date } | null>(null)
  const [creating, setCreating] = useState(false)
  // form state
  const [newDeal, setNewDeal] = useState<{ name: string; pipeline_id: number | ''; stage_id: number | ''; expected_close_date: string }>({ name: '', pipeline_id: '', stage_id: '', expected_close_date: '' })
  const [newActivity, setNewActivity] = useState<{ type: string; subject: string; due_at: string }>({ type: 'task', subject: '', due_at: '' })
  const router = useRouter()

  const monthStart = useMemo(() => startOfMonth(viewDate), [viewDate])
  const monthEnd = useMemo(() => endOfMonth(viewDate), [viewDate])
  const gridStart = useMemo(() => startOfWeek(monthStart, { weekStartsOn: 1 }), [monthStart])
  const gridEnd = useMemo(() => endOfWeek(monthEnd, { weekStartsOn: 1 }), [monthEnd])

  useEffect(() => {
    ;(async () => {
      const { data } = await api.get('/api/v1/users/mine/')
      setMe(data as any)
      const r = ((data as any)?.role || '').toLowerCase()
      if (r === 'owner' || r === 'manager' || r === 'worker') setRole(r as any)
    })()
  }, [])

  useEffect(() => {
    ;(async () => {
      const isoNoMs = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm:ss'Z'")
      const params: any = { start: isoNoMs(gridStart), end: isoNoMs(gridEnd) }
      const acts = await api.get('/api/v1/activities/calendar/', { params })
      setActivities(((acts.data as any).activities || []) as Activity[])
      const paramsDeals: any = { start: format(gridStart, 'yyyy-MM-dd'), end: format(gridEnd, 'yyyy-MM-dd') }
      const deals = await api.get('/api/v1/deals/upcoming/', { params: paramsDeals })
      setDeals(((deals.data as any).deals || []) as Deal[])
    })()
  }, [gridStart, gridEnd])

  useEffect(() => {
    ;(async () => {
      const { data } = await api.get('/api/v1/users/', { params: { page: 1, limit: 100 } })
      setUsers((data as any).users || [])
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

  const items = useMemo(() => {
    const meId = me?.id
    const canToggle = role === 'owner' || role === 'manager'
    const filterMine = (role === 'worker' && true) || (canToggle && mineOnly)
    const baseActs = filterMine ? activities.filter(a => a.owner_user_id === meId) : activities
    const acts = showCompleted ? baseActs : baseActs.filter(a => !a.completed)
    const dls = filterMine ? deals.filter(d => d.owner_user_id === meId) : deals
    return [
      ...acts.map(a => ({
        id: `act-${a.id}`,
        date: a.due_at || '',
        title: a.subject || a.type,
        meta: a,
        kind: 'activity' as const,
      })),
      ...dls.map(d => ({
        id: `deal-${d.id}`,
        date: (d.expected_close_date ? (d.expected_close_date + 'T10:00:00Z') : new Date().toISOString()),
        title: d.name,
        meta: d,
        kind: 'deal' as const,
      }))
    ]
  }, [activities, deals, mineOnly, role, me, showCompleted])

  function toDateString(d: Date) { return format(d, 'yyyy-MM-dd') }

  async function rescheduleTo(itemId: string, targetDay: Date) {
    if (itemId.startsWith('act-')) {
      const id = Number(itemId.replace('act-', ''))
      const a = activities.find(x => x.id === id)
      const time = a?.due_at ? a.due_at.split('T')[1] || '09:00:00Z' : '09:00:00Z'
      const newDue = `${toDateString(targetDay)}T${time}`
      setActivities(prev => prev.map(x => x.id === id ? { ...x, due_at: newDue } : x))
      await api.patch(`/api/v1/activities/${id}/`, { due_at: newDue })
    } else if (itemId.startsWith('deal-')) {
      const id = Number(itemId.replace('deal-', ''))
      const newDateOnly = toDateString(targetDay)
      setDeals(prev => prev.map(x => x.id === id ? { ...x, expected_close_date: newDateOnly } : x))
      await api.patch(`/api/v1/deals/${id}/`, { expected_close_date: newDateOnly })
    }
  }

  function onDragStart(e: React.DragEvent, id: string) {
    setDraggingId(id)
    e.dataTransfer.effectAllowed = 'move'
  }
  function onDragOverDay(e: React.DragEvent) { e.preventDefault() }
  function onDropToDay(e: React.DragEvent, day: Date) {
    e.preventDefault()
    if (draggingId) rescheduleTo(draggingId, day)
    setDraggingId(null)
  }

  function openChooser(day: Date) {
    setChooserOpen({ dayKey: format(day, 'yyyy-MM-dd') })
  }
  function openCreate(kind: 'deal' | 'activity', day: Date) {
    setModal({ kind, day })
    setChooserOpen(null)
    const dateStr = format(day, kind === 'deal' ? 'yyyy-MM-dd' : "yyyy-MM-dd'T'09:00")
    if (kind === 'deal') {
      setNewDeal({ name: '', pipeline_id: pipelines[0]?.id || '', stage_id: stages.filter(s => s.pipeline_id === (pipelines[0]?.id || 0))[0]?.id || '', expected_close_date: dateStr })
    } else {
      setNewActivity({ type: 'task', subject: '', due_at: dateStr })
    }
  }
  function closeModal() { setModal(null) }

  async function submitDeal() {
    if (!modal) return
    const payload: any = { name: newDeal.name || 'Сделка', pipeline_id: Number(newDeal.pipeline_id), stage_id: Number(newDeal.stage_id), expected_close_date: newDeal.expected_close_date, account_id: me?.account_id, owner_user_id: me?.id }
    setCreating(true)
    try {
      const { data } = await api.post('/api/v1/deals/', payload)
      // refresh list
      const paramsDeals: any = { start: format(gridStart, 'yyyy-MM-dd'), end: format(gridEnd, 'yyyy-MM-dd') }
      const dealsRes = await api.get('/api/v1/deals/upcoming/', { params: paramsDeals })
      setDeals(((dealsRes.data as any).deals || []) as Deal[])
      setModal(null)
    } finally { setCreating(false) }
  }
  async function submitActivity() {
    if (!modal) return
    const payload: any = { type: newActivity.type, subject: newActivity.subject || undefined, due_at: newActivity.due_at, account_id: me?.account_id, owner_user_id: me?.id }
    setCreating(true)
    try {
      const { data } = await api.post('/api/v1/activities/', payload)
      const isoNoMs = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm:ss'Z'")
      const params: any = { start: isoNoMs(gridStart), end: isoNoMs(gridEnd) }
      const acts = await api.get('/api/v1/activities/calendar/', { params })
      setActivities(((acts.data as any).activities || []) as Activity[])
      setModal(null)
    } finally { setCreating(false) }
  }

  function openItem(id: string) {
    if (id.startsWith('act-')) {
      const num = Number(id.replace('act-',''))
      router.push(`/activities/${num}`)
    } else if (id.startsWith('deal-')) {
      const num = Number(id.replace('deal-',''))
      router.push(`/deals/${num}`)
    }
  }

  async function deleteItem(id: string) {
    if (!confirm('Удалить запись?')) return
    if (id.startsWith('act-')) {
      const num = Number(id.replace('act-',''))
      await api.delete(`/api/v1/activities/${num}/`)
      setActivities(prev => prev.filter(a => a.id !== num))
    } else if (id.startsWith('deal-')) {
      const num = Number(id.replace('deal-',''))
      await api.delete(`/api/v1/deals/${num}/`)
      setDeals(prev => prev.filter(d => d.id !== num))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-3 cloud p-3">
        <div className="font-medium">Календарь</div>
        <div className="flex items-center gap-2">
        {(role === 'owner' || role === 'manager') && (
          <label className="ml-auto flex items-center gap-2 text-sm">
            <input className="accent-peach-500" style={{ accentColor: '#f4a261' }} type="checkbox" checked={mineOnly} onChange={e=>setMineOnly(e.target.checked)} />
            Показывать только мои
          </label>
        )}
        <label className="flex items-center gap-2 text-sm ml-auto">
          <input className="accent-peach-500" style={{ accentColor: '#f4a261' }} type="checkbox" checked={showCompleted} onChange={e=>setShowCompleted(e.target.checked)} />
          Показывать выполненные
        </label>
        </div>
      </div>
      <div className="">
        <div className="flex items-center justify-between mb-3">
          <button className="btn-primary" onClick={()=>setViewDate(addDays(monthStart, -1))}>Пред. месяц</button>
          <div className="text-sm text-gray-600 dark:text-gray-300">{format(viewDate, 'LLLL yyyy', { locale: ru })}</div>
          <button className="btn-primary" onClick={()=>setViewDate(addDays(monthEnd, 1))}>След. месяц</button>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="text-xs text-gray-500 text-center py-1">{format(addDays(gridStart, i), 'EE', { locale: ru })}</div>
          ))}
          {Array.from({ length: Math.ceil((+gridEnd - +gridStart) / (24*3600*1000)) + 1 }).map((_, idx) => {
            const day = addDays(gridStart, idx)
            const dayStr = format(day, 'yyyy-MM-dd')
            const dayItems = items.filter(i => i.date.startsWith(dayStr))
            return (
              <div key={idx} className={`min-h-[140px] p-2 rounded-2xl relative ${isSameMonth(day, monthStart) ? 'bg-white/70 dark:bg-white/5' : 'bg-white/30 dark:bg-white/5 opacity-70'}`}
                   onDragOver={onDragOverDay}
                   onDrop={(e)=>onDropToDay(e, day)}>
                <div className="text-xs text-gray-500 mb-1 flex items-center justify-between">
                  <span>{format(day, 'd')}</span>
                  <button className="text-gray-400 hover:text-gray-600" title="Добавить" onClick={(e)=>{ e.stopPropagation(); openChooser(day) }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M11 11V5h2v6h6v2h-6v6h-2v-6H5v-2z"/></svg>
                  </button>
                </div>
                {chooserOpen?.dayKey === format(day, 'yyyy-MM-dd') && (
                  <div className="absolute right-2 top-6 z-10 cloud p-2 text-xs space-y-1">
                    <button className="btn-primary w-full" onClick={()=>openCreate('deal', day)}>Новая сделка</button>
                    <button className="btn-primary w-full" onClick={()=>openCreate('activity', day)}>Новая активность</button>
                  </div>
                )}
                <div className="space-y-1">
                  {dayItems.map(i => (
                    <div key={i.id}
                         className="card p-2 text-xs flex items-center justify-between cursor-grab"
                         draggable
                         onDragStart={(e)=>onDragStart(e, i.id)}>
                      <div>
                        <div className="font-medium truncate max-w-[140px] cursor-pointer hover:underline" onClick={(e)=>{ e.stopPropagation(); openItem(i.id) }}>{i.title}</div>
                        <div className="text-[10px] text-gray-500">{i.kind === 'activity' ? (typeRu[(i.meta as any).type] || (i.meta as any).type) : 'Сделка'} • отв. {userName((i.meta as any).owner_user_id)}</div>
                      </div>
                      <button className="text-red-500 hover:text-red-700" title="Удалить" onClick={(e)=>{ e.stopPropagation(); deleteItem(i.id) }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 3v1H4v2h16V4h-5V3H9zm1 6v9h2V9h-2zm-4 0v9h2V9H6zm8 0v9h2V9h-2z"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-20" onClick={closeModal}>
          <div className="cloud p-4 w-[520px]" onClick={e=>e.stopPropagation()}>
            {modal.kind === 'deal' ? (
              <>
                <div className="font-medium mb-3">Создать сделку</div>
                <div className="space-y-2 text-sm">
                  <input className="cloud p-2 w-full" placeholder="Название" value={newDeal.name} onChange={e=>setNewDeal(v=>({ ...v, name: e.target.value }))} />
                  <div className="flex items-center gap-2">
                    <select className="cloud p-2" value={newDeal.pipeline_id} onChange={e=>{ const v = e.target.value ? Number(e.target.value) : ''; setNewDeal(nd=>({ ...nd, pipeline_id: v, stage_id: '' })) }}>
                      <option value="">Выбрать пайплайн</option>
                      {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select className="cloud p-2" value={newDeal.stage_id} onChange={e=>setNewDeal(nd=>({ ...nd, stage_id: e.target.value ? Number(e.target.value) : '' }))} disabled={!newDeal.pipeline_id}>
                      <option value="">Выбрать стадию</option>
                      {stages.filter(s => (newDeal.pipeline_id ? s.pipeline_id === newDeal.pipeline_id : true)).map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <input className="cloud p-2" type="date" value={newDeal.expected_close_date} onChange={e=>setNewDeal(v=>({ ...v, expected_close_date: e.target.value }))} />
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <button className="btn-primary" disabled={creating || !newDeal.pipeline_id || !newDeal.stage_id} onClick={submitDeal}>Создать</button>
                  <button className="cloud p-2" onClick={closeModal}>Отмена</button>
                </div>
              </>
            ) : (
              <>
                <div className="font-medium mb-3">Создать активность</div>
                <div className="space-y-2 text-sm">
                  <select className="cloud p-2" value={newActivity.type} onChange={e=>setNewActivity(v=>({ ...v, type: e.target.value }))}>
                    {Object.keys(typeRu).map(k => <option key={k} value={k}>{typeRu[k]}</option>)}
                  </select>
                  <input className="cloud p-2 w-full" placeholder="Тема" value={newActivity.subject} onChange={e=>setNewActivity(v=>({ ...v, subject: e.target.value }))} />
                  <input className="cloud p-2 w-full" type="datetime-local" value={newActivity.due_at} onChange={e=>setNewActivity(v=>({ ...v, due_at: e.target.value }))} />
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <button className="btn-primary" disabled={creating} onClick={submitActivity}>Создать</button>
                  <button className="cloud p-2" onClick={closeModal}>Отмена</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

