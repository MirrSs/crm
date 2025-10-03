"use client"  
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'

type Product = { id: number; sku?: string; name?: string; description?: string; price?: number; currency?: string }


export default function ProductCardPage() {
  const [notice, setNotice] = useState<string | null>(null)
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)
  const [draft, setDraft] = useState<Product | null>(null)
  const [dirty, setDirty] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [historyItems, setHistoryItems] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  useEffect(() => {
    ;(async () => {
      const { data } = await api.get(`/api/v1/products/${id}/`)
      setProduct(data as any)
      setDraft(data as any)
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
  }, [dirty, draft, product])

  function updateDraft(patch: Partial<Product>) {
    if (!draft) return
    const next = { ...(draft as any), ...patch }
    setDraft(next)
    const orig = product || {}
    const keys = new Set([...Object.keys(next), ...Object.keys(orig as any)])
    let changed = false
    for (const k of keys) { if ((next as any)[k] !== (orig as any)[k]) { changed = true; break } }
    setDirty(changed)
  }

  function buildPatch(): Partial<Product> {
    const patch: any = {}
    if (!product || !draft) return patch
    const keys = new Set([...Object.keys(draft), ...Object.keys(product)])
    keys.forEach(k => { if ((draft as any)[k] !== (product as any)[k]) patch[k] = (draft as any)[k] })
    return patch
  }

  async function saveChanges() {
    if (!dirty) return
    const patch = buildPatch()
    const { data } = await api.patch(`/api/v1/products/${id}/`, patch)
    setProduct(data as any)
    setDraft(data as any)
    setDirty(false)
    setNotice('Сохранено')
    setTimeout(()=>setNotice(null), 2000)
  }

  function cancelChanges() { setDraft(product); setDirty(false); setNotice('Изменения отменены'); setTimeout(()=>setNotice(null), 2000) }

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
        <button
          className="text-blue-700 underline flex items-center gap-1"
          onClick={async () => {
            setShowHistory(true)
            if (historyItems.length === 0) {
              try {
                setHistoryLoading(true)
                const { data } = await api.get('/api/v1/history/', { params: { entity_type: 'products', entity_id: Number(id), page: 1, limit: 100 } })
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
          <label className="text-xs text-gray-500">Артикул (SKU)</label>
          <input className="w-full cloud p-2" value={draft?.sku || ''} onChange={e=>updateDraft({ sku: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-gray-500">Название</label>
          <input className="w-full cloud p-2" value={draft?.name || ''} onChange={e=>updateDraft({ name: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs text-gray-500">Описание</label>
          <textarea className="w-full cloud p-2" rows={4} value={draft?.description || ''} onChange={e=>updateDraft({ description: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-gray-500">Цена</label>
          <input className="w-full cloud p-2" type="number" step="0.01" value={draft?.price ?? ''} onChange={e=>updateDraft({ price: e.target.value ? Number(e.target.value) : undefined })} />
        </div>
        <div>
          <label className="text-xs text-gray-500">Валюта</label>
          <input className="w-full cloud p-2" value={draft?.currency || ''} onChange={e=>updateDraft({ currency: e.target.value })} />
        </div>
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
    </div>
  )
}



