"use client"
import { useEffect, useMemo, useState } from 'react'
import { api } from '@/lib/api'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, format, isSameMonth } from 'date-fns'
import { ru } from 'date-fns/locale'

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

type User = { id: number; name?: string; email?: string }

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
  const [role, setRole] = useState<'owner'|'manager'|'worker'>('worker')
  const [me, setMe] = useState<{ id: number; name?: string } | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])

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
    const acts = filterMine ? activities.filter(a => a.owner_user_id === meId) : activities
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
  }, [activities, deals, mineOnly, role, me])

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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 cloud p-3">
        <div className="font-medium">Календарь</div>
        {(role === 'owner' || role === 'manager') && (
          <label className="ml-auto flex items-center gap-2 text-sm">
            <input type="checkbox" checked={mineOnly} onChange={e=>setMineOnly(e.target.checked)} />
            Показывать только мои
          </label>
        )}
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
              <div key={idx} className={`min-h-[120px] p-2 rounded-2xl ${isSameMonth(day, monthStart) ? 'bg-white/70 dark:bg-white/5' : 'bg-white/30 dark:bg-white/5 opacity-70'}`}
                   onDragOver={onDragOverDay}
                   onDrop={(e)=>onDropToDay(e, day)}>
                <div className="text-xs text-gray-500 mb-1">{format(day, 'd')}</div>
                <div className="space-y-1">
                  {dayItems.map(i => (
                    <div key={i.id}
                         className="card p-2 text-xs flex items-center justify-between cursor-grab"
                         draggable
                         onDragStart={(e)=>onDragStart(e, i.id)}>
                      <div>
                        <div className="font-medium truncate max-w-[140px]">{i.title}</div>
                        <div className="text-[10px] text-gray-500">{i.kind === 'activity' ? (typeRu[(i.meta as any).type] || (i.meta as any).type) : 'Сделка'} • отв. {userName((i.meta as any).owner_user_id)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

