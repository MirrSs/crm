"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'

type Service = { id: number; code?: string; name?: string; description?: string; price?: number; currency?: string }

export default function ServiceCardPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [service, setService] = useState<Service | null>(null)

  useEffect(() => {
    ;(async () => {
      const { data } = await api.get(`/api/v1/services/${id}/`)
      setService(data as any)
    })()
  }, [id])

  async function updateServicePatch(patch: Partial<Service>) {
    if (!service) return
    const { data } = await api.patch(`/api/v1/services/${id}/`, patch)
    setService(data as any)
  }

  async function onDelete() {
    if (!confirm('Удалить услугу?')) return
    setLoading(true)
    try {
      await api.delete(`/api/v1/services/${id}/`)
      router.replace('/services')
    } finally { setLoading(false) }
  }

  if (!service) return <div className="cloud p-4">Загрузка...</div>

  return (
    <div className="space-y-3">
      <div className="cloud p-3 flex items-center gap-2">
        <div className="font-medium">{service.name || 'Услуга'}</div>
        <div className="ml-auto" />
        <button className="btn-primary" onClick={onDelete} disabled={loading}>{loading ? '...' : 'Удалить'}</button>
      </div>

      <div className="cloud p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500">Код</label>
          <input className="w-full cloud p-2" value={service.code || ''} onChange={e=>updateServicePatch({ code: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-gray-500">Название</label>
          <input className="w-full cloud p-2" value={service.name || ''} onChange={e=>updateServicePatch({ name: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs text-gray-500">Описание</label>
          <textarea className="w-full cloud p-2" rows={4} value={service.description || ''} onChange={e=>updateServicePatch({ description: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-gray-500">Цена</label>
          <input className="w-full cloud p-2" type="number" step="0.01" value={service.price ?? ''} onChange={e=>updateServicePatch({ price: e.target.value ? Number(e.target.value) : undefined })} />
        </div>
        <div>
          <label className="text-xs text-gray-500">Валюта</label>
          <input className="w-full cloud p-2" value={service.currency || ''} onChange={e=>updateServicePatch({ currency: e.target.value })} />
        </div>
      </div>
    </div>
  )
}


