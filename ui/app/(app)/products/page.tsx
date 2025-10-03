"use client"
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'

type Product = { id: number; sku?: string; name?: string; price?: number; currency?: string }

export default function ProductsPage() {
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [q, setQ] = useState('')
  const [data, setData] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const router = useRouter()
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [bulkAction, setBulkAction] = useState<'delete'>('delete')
  const [showCreate, setShowCreate] = useState(false)
  const [newProduct, setNewProduct] = useState<{ sku?: string; name?: string; price?: number | ''; currency?: string }>({})

  useEffect(() => {
    ;(async () => {
      const params: any = { page, limit }
      if (q) params.name = q
      const { data } = await api.get('/api/v1/products/', { params })
      const items: Product[] = ((data as any).products || [])
      setData(items.slice().sort((a, b) => b.id - a.id))
      setTotal(((data as any).pagination?.total) || 0)
    })()
  }, [page, limit, q])

  const pages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="space-y-3">
      <div className="cloud p-3 flex items-center gap-2">
        <div className="font-medium">Продукты</div>
        <input className="cloud p-2" placeholder="Поиск по названию" value={q} onChange={e=>{ setPage(1); setQ(e.target.value) }} />
        <div className="ml-auto" />
        <button className="btn-primary" onClick={()=>setShowCreate(true)}>Создать</button>
      </div>
      <div className="cloud p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-white/50">
            <tr>
              <th className="text-left p-3 w-8">
                <input className="accent-peach-500" style={{ accentColor: '#f4a261' }} type="checkbox" checked={data.length>0 && selected.size===data.length} onChange={e=>{ const c = e.target.checked; if (c) setSelected(new Set(data.map(d => d.id))); else setSelected(new Set()) }} />
              </th>
              <th className="text-left p-3">SKU</th>
              <th className="text-left p-3">Название</th>
              <th className="text-left p-3">Цена</th>
            </tr>
          </thead>
          <tbody>
            {data.map(d => (
              <tr key={d.id} className="border-t border-white/40 cursor-pointer hover:bg-peach-100" onClick={()=>router.push(`/products/${d.id}`)}>
                <td className="p-3" onClick={e=>e.stopPropagation()}>
                  <input className="accent-peach-500" style={{ accentColor: '#f4a261' }} type="checkbox" checked={selected.has(d.id)} onChange={e=>{ const c = e.target.checked; setSelected(prev => { const next = new Set(prev); if (c) next.add(d.id); else next.delete(d.id); return next }) }} />
                </td>
                <td className="p-3">{d.sku}</td>
                <td className="p-3">{d.name}</td>
                <td className="p-3">{d.price} {d.currency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {showCreate && (
        <div className="fixed inset-0 z-[60] bg-black/30 flex items-center justify-center" onClick={()=>setShowCreate(false)}>
          <div className="cloud p-4 w-full max-w-md" onClick={e=>e.stopPropagation()}>
            <div className="font-medium mb-2">Новый продукт</div>
            <input className="w-full cloud p-2 mb-2" placeholder="SKU" value={newProduct.sku || ''} onChange={e=>setNewProduct({ ...newProduct, sku: e.target.value })} />
            <input className="w-full cloud p-2 mb-2" placeholder="Название" value={newProduct.name || ''} onChange={e=>setNewProduct({ ...newProduct, name: e.target.value })} />
            <div className="flex gap-2">
              <input className="w-full cloud p-2 mb-2" placeholder="Цена" type="number" step="0.01" value={newProduct.price ?? ''} onChange={e=>setNewProduct({ ...newProduct, price: e.target.value ? Number(e.target.value) : '' })} />
              <input className="w-full cloud p-2 mb-2" placeholder="Валюта" value={newProduct.currency || ''} onChange={e=>setNewProduct({ ...newProduct, currency: e.target.value })} />
            </div>
            <div className="flex gap-2 justify-end mt-2">
              <button className="cloud p-2" onClick={()=>setShowCreate(false)}>Отмена</button>
              <button className="btn-primary" onClick={async ()=>{ const { data: created } = await api.post('/api/v1/products/', newProduct); setShowCreate(false); setNewProduct({}); setData(prev => [created as any, ...prev]) }}>Создать</button>
            </div>
          </div>
        </div>
      )}
      {selected.size > 0 && (
        <div className="cloud p-3 fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 z-50">
          <div>Выбрано: {selected.size}</div>
          <select className="cloud p-2" value={bulkAction} onChange={e=>setBulkAction(e.target.value as any)}>
            <option value="delete">Удаление</option>
          </select>
          <button className="btn-primary" onClick={async ()=>{ if (bulkAction!=='delete') return; const ids = Array.from(selected); await Promise.all(ids.map(id => api.delete(`/api/v1/products/${id}/`).catch(()=>null))); setSelected(new Set()); const { data } = await api.get('/api/v1/products/', { params: { page, limit, name: q || undefined } }); const items: Product[] = ((data as any).products || []); setData(items.slice().sort((a, b) => b.id - a.id)); setTotal(((data as any).pagination?.total) || 0) }}>Выполнить</button>
        </div>
      )}
      <div className="flex items-center gap-2 cloud p-2">
        <button className="btn-primary" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Назад</button>
        <div className="text-xs text-gray-500">Стр. {page} из {pages}</div>
        <button className="btn-primary" disabled={page>=pages} onClick={()=>setPage(p=>p+1)}>Вперёд</button>
        <div className="ml-auto" />
        <select className="cloud p-2" value={limit} onChange={e=>{ setPage(1); setLimit(Number(e.target.value)) }}>
          {[10,20,50,100].map(n => <option key={n} value={n}>{n}/стр</option>)}
        </select>
      </div>
    </div>
  )
}

