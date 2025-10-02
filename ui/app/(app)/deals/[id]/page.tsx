"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { api } from '@/lib/api'

type Deal = { id: number; name?: string; amount?: number; currency?: string; pipeline_id?: number; stage_id?: number; owner_user_id?: number; company_id?: number; contact_id?: number; expected_close_date?: string }
type DealProduct = { id: number; product_id: number; quantity: number; unit_price?: number; currency?: string }
type DealService = { id: number; service_id: number; quantity: number; unit_price?: number; currency?: string }
type Product = { id: number; name?: string }
type Service = { id: number; name?: string }
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
  const id = Number(params.id)

  useEffect(() => {
    ;(async () => {
      const { data } = await api.get(`/api/v1/deals/${id}/`)
      setDeal(data as any)
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
    const { data } = await api.post(`/api/v1/deals/${id}/products/`, { product_id, quantity: 1 })
    setProducts(prev => [...prev, data as any])
  }
  async function addService(service_id: number) {
    const { data } = await api.post(`/api/v1/deals/${id}/services/`, { service_id, quantity: 1 })
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
  async function updateDealPatch(patch: Partial<Deal>) {
    if (!deal) return
    const { data } = await api.patch(`/api/v1/deals/${deal.id}/`, patch)
    setDeal(data as any)
  }

  if (!deal) return <div className="cloud p-4">Загрузка...</div>

  return (
    <div className="space-y-3">
      <div className="cloud p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-lg font-semibold">{deal.name}</div>
          <input className="cloud p-1" type="date" value={deal.expected_close_date || ''} onChange={e=>updateDealPatch({ expected_close_date: e.target.value })} />
          <select className="cloud p-1" value={deal.stage_id || ''} onChange={e=>updateDealPatch({ stage_id: Number(e.target.value) })}>
            {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <button className="btn-primary" disabled={loading} onClick={onDelete}>Удалить</button>
      </div>
      <div className="cloud p-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-500">Сумма</div>
          <div>{deal.amount} {deal.currency}</div>
        </div>
        <div>
          <div className="text-gray-500">Ответственный</div>
          <div className="flex items-center gap-2">
            <select className="cloud p-1" value={deal.owner_user_id || ''} onChange={e=>updateDealPatch({ owner_user_id: Number(e.target.value) })}>
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
            <select className="cloud p-1" value={deal.company_id || ''} onChange={async e=>{ const v = e.target.value ? Number(e.target.value) : undefined; await updateDealPatch({ company_id: v }); if (v) { const c = await api.get(`/api/v1/companies/${v}/`); setCompany(c.data as any) } else { setCompany(null) } }}>
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
            <select className="cloud p-1" value={deal.contact_id || ''} onChange={async e=>{ const v = e.target.value ? Number(e.target.value) : undefined; await updateDealPatch({ contact_id: v }); if (v) { const c = await api.get(`/api/v1/contacts/${v}/`); setContact(c.data as any) } else { setContact(null) } }}>
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
            {catalogProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="space-y-2 text-sm">
          {products.map(item => (
            <div key={item.id} className="flex items-center gap-2">
              <div className="w-48">#{item.product_id}</div>
              <input className="cloud p-1 w-20" type="number" value={item.quantity} onChange={e=>updateProduct(item.id, { quantity: Number(e.target.value) })} />
              <input className="cloud p-1 w-24" type="number" value={item.unit_price || 0} onChange={e=>updateProduct(item.id, { unit_price: Number(e.target.value) })} />
              <button className="text-red-500" onClick={()=>removeProduct(item.id)}>Удалить</button>
            </div>
          ))}
        </div>
      </div>
      <div className="cloud p-4">
        <div className="font-medium mb-2">Услуги</div>
        <div className="flex items-center gap-2 mb-3">
          <select className="cloud p-2" defaultValue="" onChange={e=>{ const v = Number(e.target.value); if (v) addService(v) }}>
            <option value="">Добавить услугу...</option>
            {catalogServices.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div className="space-y-2 text-sm">
          {services.map(item => (
            <div key={item.id} className="flex items-center gap-2">
              <div className="w-48">#{item.service_id}</div>
              <input className="cloud p-1 w-20" type="number" value={item.quantity} onChange={e=>updateService(item.id, { quantity: Number(e.target.value) })} />
              <input className="cloud p-1 w-24" type="number" value={item.unit_price || 0} onChange={e=>updateService(item.id, { unit_price: Number(e.target.value) })} />
              <button className="text-red-500" onClick={()=>removeService(item.id)}>Удалить</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

