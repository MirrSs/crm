"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'

type Lead = { id: number; first_name?: string; last_name?: string; email?: string; phone?: string; owner_user_id?: number; company_name?: string; source?: string; status?: string; notes?: string }
type User = { id: number; name?: string; email?: string }

export default function LeadCardPage() {
  const params = useParams() as { id: string }
  const router = useRouter()
  const [lead, setLead] = useState<Lead | null>(null)
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const id = Number(params.id)

  useEffect(() => {
    ;(async () => {
      const { data } = await api.get(`/api/v1/leads/${id}/`)
      setLead(data as any)
      const u = await api.get('/api/v1/users/', { params: { page: 1, limit: 100 } })
      setUsers((u.data as any).users || [])
    })()
  }, [id])

  async function onDelete() {
    if (!confirm('Удалить лид?')) return
    setLoading(true)
    try {
      await api.delete(`/api/v1/leads/${id}/`)
      router.replace('/leads')
    } finally { setLoading(false) }
  }

  function userName(id?: number) {
    if (!id) return '-'
    const u = users.find(u => u.id === id)
    return u?.name || u?.email || '-'
  }

  async function updateLeadPatch(patch: Partial<Lead>) {
    if (!lead) return
    const { data } = await api.patch(`/api/v1/leads/${lead.id}/`, patch)
    setLead(data as any)
  }

  if (!lead) return <div className="cloud p-4">Загрузка...</div>

  return (
    <div className="space-y-3">
      <div className="cloud p-4 flex items-center justify-between">
        <div className="text-lg font-semibold">{lead.first_name} {lead.last_name}</div>
        <button className="btn-primary" disabled={loading} onClick={onDelete}>Удалить</button>
      </div>
      <div className="cloud p-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-500">Email</div>
          <input className="cloud p-2 w-full" value={lead.email || ''} onChange={e=>setLead({ ...lead, email: e.target.value })} onBlur={()=>updateLeadPatch({ email: lead.email })} />
        </div>
        <div>
          <div className="text-gray-500">Телефон</div>
          <input className="cloud p-2 w-full" value={lead.phone || ''} onChange={e=>setLead({ ...lead, phone: e.target.value })} onBlur={()=>updateLeadPatch({ phone: lead.phone })} />
        </div>
        <div>
          <div className="text-gray-500">Компания</div>
          <input className="cloud p-2 w-full" value={lead.company_name || ''} onChange={e=>setLead({ ...lead, company_name: e.target.value })} onBlur={()=>updateLeadPatch({ company_name: lead.company_name })} />
        </div>
        <div>
          <div className="text-gray-500">Источник</div>
          <input className="cloud p-2 w-full" value={lead.source || ''} onChange={e=>setLead({ ...lead, source: e.target.value })} onBlur={()=>updateLeadPatch({ source: lead.source })} />
        </div>
        <div>
          <div className="text-gray-500">Статус</div>
          <input className="cloud p-2 w-full" value={lead.status || ''} onChange={e=>setLead({ ...lead, status: e.target.value })} onBlur={()=>updateLeadPatch({ status: lead.status })} />
        </div>
        <div className="col-span-2">
          <div className="text-gray-500">Заметки</div>
          <textarea className="cloud p-2 w-full" rows={3} value={lead.notes || ''} onChange={e=>setLead({ ...lead, notes: e.target.value })} onBlur={()=>updateLeadPatch({ notes: lead.notes })} />
        </div>
        <div>
          <div className="text-gray-500">Ответственный</div>
          <div className="flex items-center gap-2">
            <select className="cloud p-1" value={lead.owner_user_id || ''} onChange={e=>updateLeadPatch({ owner_user_id: Number(e.target.value) })}>
              {users.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
            </select>
            {lead.owner_user_id ? (
              <a className="text-blue-600 hover:text-blue-800" href={`/users/${lead.owner_user_id}`} title="Открыть пользователя">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14 3h7v7h-2V6.414l-9.293 9.293-1.414-1.414L17.586 5H14V3z"/><path d="M5 5h7v2H7v10h10v-5h2v7H5z"/></svg>
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

