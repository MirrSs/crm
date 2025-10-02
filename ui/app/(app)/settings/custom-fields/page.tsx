"use client"
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

 type FieldDef = { id: number; object_type?: string; code?: string; name?: string; field_type?: string; is_required?: boolean; created_at?: string }
 type Pagination = { page: number; limit: number; total: number }

 export default function CustomFieldsSettingsPage() {
   const [page, setPage] = useState(1)
   const [limit, setLimit] = useState(20)
   const [objectType, setObjectType] = useState('')
   const [code, setCode] = useState('')
   const [data, setData] = useState<FieldDef[]>([])
   const [total, setTotal] = useState(0)

   useEffect(() => {
     ;(async () => {
       const params: any = { page, limit }
       if (objectType) params.object_type = objectType
       if (code) params.code = code
       const { data } = await api.get('/api/v1/custom-fields/definitions/', { params })
       setData(((data as any).fields || []) as FieldDef[])
       setTotal(((data as any).pagination?.total) || 0)
     })()
   }, [page, limit, objectType, code])

   const pages = Math.max(1, Math.ceil(total / limit))

   return (
     <div className="space-y-3">
       <div className="cloud p-3 flex items-center gap-2">
         <div className="font-medium">Пользовательские поля</div>
         <input className="cloud p-2 ml-auto" placeholder="Объект (deal, lead, ...)" value={objectType} onChange={e=>{ setPage(1); setObjectType(e.target.value) }} />
         <input className="cloud p-2" placeholder="Код поля" value={code} onChange={e=>{ setPage(1); setCode(e.target.value) }} />
       </div>
       <div className="cloud p-0 overflow-hidden">
         <table className="w-full text-sm">
           <thead className="bg-white/50">
             <tr>
               <th className="text-left p-3">Объект</th>
               <th className="text-left p-3">Код</th>
               <th className="text-left p-3">Название</th>
               <th className="text-left p-3">Тип</th>
               <th className="text-left p-3">Обязательное</th>
               <th className="text-left p-3">Создано</th>
             </tr>
           </thead>
           <tbody>
             {data.map(f => (
               <tr key={f.id} className="border-t border-white/40">
                 <td className="p-3">{f.object_type}</td>
                 <td className="p-3">{f.code}</td>
                 <td className="p-3">{f.name}</td>
                 <td className="p-3">{f.field_type}</td>
                 <td className="p-3">{f.is_required ? 'Да' : 'Нет'}</td>
                 <td className="p-3">{f.created_at ? new Date(f.created_at).toLocaleString() : '-'}</td>
               </tr>
             ))}
           </tbody>
         </table>
       </div>
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
