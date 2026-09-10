"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'

type Deal = { id: number; name?: string; amount?: number; currency?: string; pipeline_id?: number; stage_id?: number; owner_user_id?: number; company_id?: number; contact_id?: number; expected_close_date?: string; discount_type?: 'percent' | 'amount' | null; discount_value?: number | null }
type DealProduct = { id: number; product_id: number; quantity: number; unit_price?: number; currency?: string; discount_type?: 'percent' | 'amount' | null; discount_value?: number | null }
type DealService = { id: number; service_id: number; quantity: number; unit_price?: number; currency?: string; discount_type?: 'percent' | 'amount' | null; discount_value?: number | null }
type Product = { id: number; name?: string; price?: number; currency?: string }
type Service = { id: number; name?: string; price?: number; currency?: string }
type Company = { id: number; name?: string }
type Contact = { id: number; first_name?: string; last_name?: string }
type CompanyListItem = { id: number; name?: string }
type ContactListItem = { id: number; first_name?: string; last_name?: string }
type CompanyListResponse = { companies: CompanyListItem[] }
type ContactListResponse = { contacts: ContactListItem[] }
type User = { id: number; name?: string; email?: string }
type Pipeline = { id: number; name: string }
type Stage = { id: number; name: string; pipeline_id: number }

export default function DealCardPage() {
  const params = useParams() as { id: string }
  const router = useRouter()
  const [deal, setDeal] = useState<Deal | null>(null)
  const [draftDeal, setDraftDeal] = useState<Deal | null>(null)
  const [dealDirty, setDealDirty] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<DealProduct[]>([])
  const [services, setServices] = useState<DealService[]>([])
  const [catalogProducts, setCatalogProducts] = useState<Product[]>([])
  const [catalogServices, setCatalogServices] = useState<Service[]>([])
  const [company, setCompany] = useState<Company | null>(null)
  const [contact, setContact] = useState<Contact | null>(null)
  const [companyOptions, setCompanyOptions] = useState<CompanyListItem[]>([])
  const [contactOptions, setContactOptions] = useState<ContactListItem[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [stages, setStages] = useState<Stage[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [historyItems, setHistoryItems] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const id = Number(params.id)

  useEffect(() => {
    ;(async () => {
      const { data } = await api.get(`/api/v1/deals/${id}/`)
      setDeal(data as any)
      setDraftDeal(data as any)
      if ((data as any).company_id) {
        const c = await api.get(`/api/v1/companies/${(data as any).company_id}/`)
        setCompany(c.data as any)
      }
      if ((data as any).contact_id) {
        const c = await api.get(`/api/v1/contacts/${((data as any).contact_id)}/`)
        setContact(c.data as any)
      }
      const [dp, ds, cp, cs] = await Promise.all([
        api.get(`/api/v1/deals/${id}/products/`),
        api.get(`/api/v1/deals/${id}/services/`),
        api.get(`/api/v1/products/`, { params: { page: 1, limit: 100 } }),
        api.get(`/api/v1/services/`, { params: { page: 1, limit: 100 } }),
      ])
      setProducts(((dp.data as any).items || []) as DealProduct[])
      setServices(((ds.data as any).items || []) as DealService[])
      setCatalogProducts(((cp.data as any).products || []) as Product[])
      setCatalogServices(((cs.data as any).services || []) as Service[])
      const [{ data: u }, { data: p }, companiesList, contactsList] = await Promise.all([
        api.get('/api/v1/users/', { params: { page: 1, limit: 100 } }),
        api.get('/api/v1/pipelines/', { params: { page: 1, limit: 100 } }),
        api.get('/api/v1/companies/', { params: { page: 1, limit: 100 } }),
        api.get('/api/v1/contacts/', { params: { page: 1, limit: 100 } }),
      ])
      setUsers((u as any).users || [])
      setPipelines((p as any).pipelines || [])
      setCompanyOptions(((companiesList.data as CompanyListResponse).companies) || [])
      setContactOptions(((contactsList.data as ContactListResponse).contacts) || [])
      const st = await api.get('/api/v1/stages/', { params: { pipeline_id: (data as any).pipeline_id, page: 1, limit: 100 } })
      setStages(((st.data as any).stages || []).map((s: any)=>({ ...s, pipeline_id: (data as any).pipeline_id })))
    })()
  }, [id])

  async function onDelete() {
    if (!confirm('Удалить сделку?')) return
    setLoading(true)
    try {
      await api.delete(`/api/v1/deals/${id}/`)
      router.replace('/deals')
    } finally { setLoading(false) }
  }

  async function addProduct(product_id: number) {
    const p = catalogProducts.find(x => x.id === product_id)
    const payload: any = { deal_id: id, product_id, quantity: 1 }
    if (p?.price != null) payload.unit_price = p.price
    if (p?.currency) payload.currency = p.currency
    const { data } = await api.post(`/api/v1/deals/${id}/products/`, payload)
    setProducts(prev => [...prev, data as any])
  }
  async function addService(service_id: number) {
    const s = catalogServices.find(x => x.id === service_id)
    const payload: any = { deal_id: id, service_id, quantity: 1 }
    if (s?.price != null) payload.unit_price = s.price
    if (s?.currency) payload.currency = s.currency
    const { data } = await api.post(`/api/v1/deals/${id}/services/`, payload)
    setServices(prev => [...prev, data as any])
  }
  async function updateProduct(item_id: number, patch: Partial<DealProduct>) {
    const { data } = await api.patch(`/api/v1/deals/${id}/products/${item_id}/`, patch)
    setProducts(prev => prev.map(i => i.id === item_id ? (data as any) : i))
  }
  async function updateService(item_id: number, patch: Partial<DealService>) {
    const { data } = await api.patch(`/api/v1/deals/${id}/services/${item_id}/`, patch)
    setServices(prev => prev.map(i => i.id === item_id ? (data as any) : i))
  }
  async function removeProduct(item_id: number) {
    await api.delete(`/api/v1/deals/${id}/products/${item_id}/`)
    setProducts(prev => prev.filter(i => i.id !== item_id))
  }
  async function removeService(item_id: number) {
    await api.delete(`/api/v1/deals/${id}/services/${item_id}/`)
    setServices(prev => prev.filter(i => i.id !== item_id))
  }
  function userName(id?: number) {
    if (!id) return '-'
    const u = users.find(u => u.id === id)
    return u?.name || u?.email || '-'
  }
  function updateDealDraft(patch: Partial<Deal>) {
    if (!draftDeal) return
    const next = { ...(draftDeal as any), ...patch }
    setDraftDeal(next)
    const orig = deal || {}
    const keys = new Set([...Object.keys(next), ...Object.keys(orig as any)])
    let changed = false
    for (const k of keys) { if ((next as any)[k] !== (orig as any)[k]) { changed = true; break } }
    setDealDirty(changed)
  }

  function buildDealPatch(): Partial<Deal> {
    const patch: any = {}
    if (!deal || !draftDeal) return patch
    const keys = new Set([...Object.keys(draftDeal), ...Object.keys(deal)])
    keys.forEach(k => { if ((draftDeal as any)[k] !== (deal as any)[k]) patch[k] = (draftDeal as any)[k] })
    return patch
  }

  async function saveDealChanges() {
    if (!dealDirty || !deal) return
    const patch = buildDealPatch()
    const { data } = await api.patch(`/api/v1/deals/${deal.id}/`, patch)
    setDeal(data as any)
    setDraftDeal(data as any)
    setDealDirty(false)
    setNotice('Сохранено')
    setTimeout(()=>setNotice(null), 2000)
  }

  function cancelDealChanges() {
    setDraftDeal(deal)
    setDealDirty(false)
    setNotice('Изменения отменены')
    setTimeout(()=>setNotice(null), 2000)
  }

  function getProductName(id: number) {
    return catalogProducts.find(p => p.id === id)?.name || `#${id}`
  }
  function getProductPrice(id: number) {
    return catalogProducts.find(p => p.id === id)?.price
  }
  function getServiceName(id: number) {
    return catalogServices.find(s => s.id === id)?.name || `#${id}`
  }
  function getServicePrice(id: number) {
    return catalogServices.find(s => s.id === id)?.price
  }

  function round2(n: number) { return Math.round(n * 100) / 100 }

  function calcProductLineTotal(item: DealProduct) {
    const unit = item.unit_price ?? getProductPrice(item.product_id) ?? 0
    const subtotal = (item.quantity || 0) * unit
    const dType = item.discount_type
    const dVal = item.discount_value || 0
    if (!dType || !dVal) return round2(subtotal)
    const dval = dType === 'percent' ? subtotal * (dVal / 100) : dVal
    return round2(Math.max(0, subtotal - dval))
  }
  function calcServiceLineTotal(item: DealService) {
    const unit = item.unit_price ?? getServicePrice(item.service_id) ?? 0
    const subtotal = (item.quantity || 0) * unit
    const dType = item.discount_type
    const dVal = item.discount_value || 0
    if (!dType || !dVal) return round2(subtotal)
    const dval = dType === 'percent' ? subtotal * (dVal / 100) : dVal
    return round2(Math.max(0, subtotal - dval))
  }

  const summary = (() => {
    const productsSum = products.reduce((acc, it) => acc + calcProductLineTotal(it), 0)
    const servicesSum = services.reduce((acc, it) => acc + calcServiceLineTotal(it), 0)
    const itemsTotal = round2(productsSum + servicesSum)
    const orderType = draftDeal?.discount_type
    const orderValue = draftDeal?.discount_value || 0
    const orderDiscVal = orderType && orderValue ? (orderType === 'percent' ? itemsTotal * (orderValue / 100) : orderValue) : 0
    const grand = round2(Math.max(0, itemsTotal - orderDiscVal))
    return { productsSum, servicesSum, itemsTotal, orderDiscVal, grand }
  })()

  const amountsMatch = draftDeal?.amount != null && Math.abs((draftDeal.amount || 0) - summary.grand) < 0.01

  async function recalcDealAmount() {
    if (!draftDeal) return
    // try to keep existing currency, otherwise take from first item
    let currency = draftDeal.currency
    if (!currency) {
      currency = products[0]?.currency || services[0]?.currency || catalogProducts[0]?.currency || catalogServices[0]?.currency || 'RUB'
    }
    updateDealDraft({ amount: summary.grand, currency })
  }

  if (!deal) return <div className="cloud p-4">Загрузка...</div>

  return (
    <div className="space-y-3">
      <div className="cloud p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-lg font-semibold">{draftDeal?.name ?? deal.name}</div>
          <input className="cloud p-1" type="date" value={draftDeal?.expected_close_date || ''} onChange={e=>updateDealDraft({ expected_close_date: e.target.value })} />
          <select className="cloud p-1" value={draftDeal?.stage_id || ''} onChange={e=>updateDealDraft({ stage_id: Number(e.target.value) })}>
            {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="text-blue-700 underline flex items-center gap-1"
            onClick={async () => {
              setShowHistory(true)
              if (historyItems.length === 0) {
                try {
                  setHistoryLoading(true)
                  const { data } = await api.get('/api/v1/history/', { params: { entity_type: 'deals', entity_id: id, page: 1, limit: 100 } })
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
          <div className="text-gray-500">Сумма</div>
          <div className="flex items-center gap-2">
            <input className="cloud p-1 w-28" type="number" step="0.01" value={draftDeal?.amount ?? 0}
              onChange={e=>updateDealDraft({ amount: Number(e.target.value) })} />
            <input className="cloud p-1 w-20" placeholder="валюта" value={draftDeal?.currency || ''}
              onChange={e=>updateDealDraft({ currency: e.target.value || undefined })} />
            {amountsMatch ? (
              <span className="text-green-600" title="Сумма совпадает">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.2l-3.5-3.5-1.4 1.4L9 19 20.3 7.7l-1.4-1.4z"/></svg>
              </span>
            ) : (
              <button className="btn-primary" onClick={recalcDealAmount}>Рассчитать цену</button>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-1">Итого по позициям: {summary.itemsTotal.toFixed(2)} {draftDeal?.currency || ''}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-gray-500">Скидка на заказ:</span>
            <input className="cloud p-1 w-20" type="number" value={draftDeal?.discount_value ?? 0}
              onChange={e=>updateDealDraft({ discount_value: Number(e.target.value) })} />
            <select className="cloud p-1" value={draftDeal?.discount_type || 'amount'} onChange={e=>updateDealDraft({ discount_type: e.target.value as any })}>
              <option value="amount">сумма</option>
              <option value="percent">%</option>
            </select>
            <span className="text-xs text-gray-500">Итого: {summary.grand.toFixed(2)} {draftDeal?.currency || ''}</span>
          </div>
        </div>
        <div>
          <div className="text-gray-500">Ответственный</div>
          <div className="flex items-center gap-2">
            <select className="cloud p-1" value={draftDeal?.owner_user_id || ''} onChange={e=>updateDealDraft({ owner_user_id: Number(e.target.value) })}>
              {users.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
            </select>
            {deal.owner_user_id ? (
              <a className="text-blue-600 hover:text-blue-800" href={`/users/${deal.owner_user_id}`} title="Открыть пользователя">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14 3h7v7h-2V6.414l-9.293 9.293-1.414-1.414L17.586 5H14V3z"/><path d="M5 5h7v2H7v10h10v-5h2v7H5z"/></svg>
              </a>
            ) : null}
          </div>
        </div>
        <div>
          <div className="text-gray-500">Компания</div>
          <div className="flex items-center gap-2">
            <select className="cloud p-1" value={draftDeal?.company_id || ''} onChange={async e=>{ const v = e.target.value ? Number(e.target.value) : undefined; updateDealDraft({ company_id: v }); if (v) { const c = await api.get(`/api/v1/companies/${v}/`); setCompany(c.data as any) } else { setCompany(null) } }}>
              <option value="">—</option>
              {companyOptions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            {deal.company_id ? (
              <a className="text-blue-600 hover:text-blue-800" href={`/companies/${deal.company_id}`} title="Открыть компанию">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14 3h7v7h-2V6.414l-9.293 9.293-1.414-1.414L17.586 5H14V3z"/><path d="M5 5h7v2H7v10h10v-5h2v7H5z"/></svg>
              </a>
            ) : null}
          </div>
        </div>
        <div>
          <div className="text-gray-500">Контакт</div>
          <div className="flex items-center gap-2">
            <select className="cloud p-1" value={draftDeal?.contact_id || ''} onChange={async e=>{ const v = e.target.value ? Number(e.target.value) : undefined; updateDealDraft({ contact_id: v }); if (v) { const c = await api.get(`/api/v1/contacts/${v}/`); setContact(c.data as any) } else { setContact(null) } }}>
              <option value="">—</option>
              {contactOptions.map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
            </select>
            {deal.contact_id ? (
              <a className="text-blue-600 hover:text-blue-800" href={`/contacts/${deal.contact_id}`} title="Открыть контакт">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M14 3h7v7h-2V6.414l-9.293 9.293-1.414-1.414L17.586 5H14V3z"/><path d="M5 5h7v2H7v10h10v-5h2v7H5z"/></svg>
              </a>
            ) : null}
          </div>
        </div>
      </div>
      <div className="cloud p-4">
        <div className="font-medium mb-2">Товары</div>
        <div className="flex items-center gap-2 mb-3">
          <select className="cloud p-2" defaultValue="" onChange={e=>{ const v = Number(e.target.value); if (v) addProduct(v) }}>
            <option value="">Добавить продукт...</option>
            {catalogProducts.map(p => (
              <option key={p.id} value={p.id}>{p.name}{p.price!=null ? ` — ${p.price} ${p.currency||''}` : ''}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/50">
              <tr>
                <th className="text-left p-2">Наименование</th>
                <th className="text-left p-2">Кол-во</th>
                <th className="text-left p-2">Цена</th>
                <th className="text-left p-2">Скидка</th>
                <th className="text-left p-2">Итого</th>
                <th className="text-left p-2">Действия</th>
              </tr>
            </thead>
            <tbody>
              {products.map(item => (
                <tr key={item.id} className="border-t border-white/40">
                  <td className="p-2">{getProductName(item.product_id)}</td>
                  <td className="p-2"><input className="cloud p-1 w-20" type="number" value={item.quantity} onChange={e=>updateProduct(item.id, { quantity: Number(e.target.value) })} /></td>
                  <td className="p-2"><input className="cloud p-1 w-24" type="number" value={item.unit_price ?? getProductPrice(item.product_id) ?? 0} onChange={e=>updateProduct(item.id, { unit_price: Number(e.target.value) })} /></td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <input className="cloud p-1 w-20" type="number" value={item.discount_value ?? 0} onChange={e=>updateProduct(item.id, { discount_value: Number(e.target.value) })} />
                      <select className="cloud p-1" value={item.discount_type || 'amount'} onChange={e=>updateProduct(item.id, { discount_type: e.target.value as any })}>
                        <option value="amount">сумма</option>
                        <option value="percent">%</option>
                      </select>
                    </div>
                  </td>
                  <td className="p-2">{calcProductLineTotal(item).toFixed(2)} {deal.currency || ''}</td>
                  <td className="p-2"><button className="text-red-500" onClick={()=>removeProduct(item.id)}>Удалить</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="cloud p-4">
        <div className="font-medium mb-2">Услуги</div>
        <div className="flex items-center gap-2 mb-3">
          <select className="cloud p-2" defaultValue="" onChange={e=>{ const v = Number(e.target.value); if (v) addService(v) }}>
            <option value="">Добавить услугу...</option>
            {catalogServices.map(s => (
              <option key={s.id} value={s.id}>{s.name}{s.price!=null ? ` — ${s.price} ${s.currency||''}` : ''}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/50">
              <tr>
                <th className="text-left p-2">Наименование</th>
                <th className="text-left p-2">Кол-во</th>
                <th className="text-left p-2">Цена</th>
                <th className="text-left p-2">Скидка</th>
                <th className="text-left p-2">Итого</th>
                <th className="text-left p-2">Действия</th>
              </tr>
            </thead>
            <tbody>
              {services.map(item => (
                <tr key={item.id} className="border-t border-white/40">
                  <td className="p-2">{getServiceName(item.service_id)}</td>
                  <td className="p-2"><input className="cloud p-1 w-20" type="number" value={item.quantity} onChange={e=>updateService(item.id, { quantity: Number(e.target.value) })} /></td>
                  <td className="p-2"><input className="cloud p-1 w-24" type="number" value={item.unit_price ?? getServicePrice(item.service_id) ?? 0} onChange={e=>updateService(item.id, { unit_price: Number(e.target.value) })} /></td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <input className="cloud p-1 w-20" type="number" value={item.discount_value ?? 0} onChange={e=>updateService(item.id, { discount_value: Number(e.target.value) })} />
                      <select className="cloud p-1" value={item.discount_type || 'amount'} onChange={e=>updateService(item.id, { discount_type: e.target.value as any })}>
                        <option value="amount">сумма</option>
                        <option value="percent">%</option>
                      </select>
                    </div>
                  </td>
                  <td className="p-2">{calcServiceLineTotal(item).toFixed(2)} {deal.currency || ''}</td>
                  <td className="p-2"><button className="text-red-500" onClick={()=>removeService(item.id)}>Удалить</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {dealDirty ? (
        <div className="fixed bottom-6 right-6 cloud p-3 flex items-center gap-2 z-50">
          <button className="cloud px-3 py-1" onClick={cancelDealChanges}>Отменить</button>
          <button className="btn-primary" onClick={saveDealChanges}>Сохранить (Ctrl+S)</button>
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

