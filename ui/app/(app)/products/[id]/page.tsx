"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'

type Product = { id: number; sku?: string; name?: string; description?: string; price?: number; currency?: string }

export default function ProductCardPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)

  useEffect(() => {
    ;(async () => {
      const { data } = await api.get(`/api/v1/products/${id}/`)
      setProduct(data as any)
    })()
  }, [id])

  async function updateProductPatch(patch: Partial<Product>) {
    if (!product) return
    const { data } = await api.patch(`/api/v1/products/${id}/`, patch)
    setProduct(data as any)
  }

  async function onDelete() {
    if (!confirm('Удалить товар?')) return
    setLoading(true)
    try {
      await api.delete(`/api/v1/products/${id}/`)
      router.replace('/products')
    } finally { setLoading(false) }
  }

  if (!product) return <div className="cloud p-4">Загрузка...</div>

  return (
    <div className="space-y-3">
      <div className="cloud p-3 flex items-center gap-2">
        <div className="font-medium">{product.name || 'Товар'}</div>
        <div className="ml-auto" />
        <button className="btn-primary" onClick={onDelete} disabled={loading}>{loading ? '...' : 'Удалить'}</button>
      </div>

      <div className="cloud p-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-gray-500">Артикул (SKU)</label>
          <input className="w-full cloud p-2" value={product.sku || ''} onChange={e=>updateProductPatch({ sku: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-gray-500">Название</label>
          <input className="w-full cloud p-2" value={product.name || ''} onChange={e=>updateProductPatch({ name: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs text-gray-500">Описание</label>
          <textarea className="w-full cloud p-2" rows={4} value={product.description || ''} onChange={e=>updateProductPatch({ description: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-gray-500">Цена</label>
          <input className="w-full cloud p-2" type="number" step="0.01" value={product.price ?? ''} onChange={e=>updateProductPatch({ price: e.target.value ? Number(e.target.value) : undefined })} />
        </div>
        <div>
          <label className="text-xs text-gray-500">Валюта</label>
          <input className="w-full cloud p-2" value={product.currency || ''} onChange={e=>updateProductPatch({ currency: e.target.value })} />
        </div>
      </div>
    </div>
  )
}


