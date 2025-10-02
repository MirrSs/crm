"use client"
import { useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
  closestCorners,
  DragStartEvent,
  DragOverEvent,
  DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { api } from '@/lib/api'
import { useRouter } from 'next/navigation'

type Pipeline = { id: number; name: string }
type Stage = { id: number; name: string; pipeline_id: number; order_index?: number }
type Deal = { id: number; name: string; pipeline_id: number; stage_id: number; amount?: number; expected_close_date?: string; order_index?: number }

function CreateDealModal({ open, onClose, onSubmit }: { open: boolean; onClose: ()=>void; onSubmit: (values: { name: string; amount?: number })=>Promise<void> }) {
  const [name, setName] = useState('')
  const [amount, setAmount] = useState<string>('')
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div className="cloud p-4 w-[360px]" onClick={e=>e.stopPropagation()}>
        <div className="text-lg font-semibold mb-3">Новая сделка</div>
        <div className="space-y-3">
          <div>
            <div className="text-sm text-gray-500 mb-1">Название</div>
            <input className="cloud p-2 w-full" value={name} onChange={e=>setName(e.target.value)} />
          </div>
          <div>
            <div className="text-sm text-gray-500 mb-1">Сумма (опц.)</div>
            <input className="cloud p-2 w-full" type="number" value={amount} onChange={e=>setAmount(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <button className="px-3 py-1" onClick={onClose}>Отмена</button>
            <button className="btn-primary" onClick={async ()=>{ await onSubmit({ name, amount: amount ? Number(amount) : undefined }); setName(''); setAmount(''); onClose() }}>Создать</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Card({ deal, onOpen, onDelete }: { deal: Deal; onOpen: (id: number)=>void; onDelete: (id: number)=>void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: `deal-${deal.id}` })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as React.CSSProperties
  return (
    <div ref={setNodeRef} style={style} className="card p-3" {...attributes} {...listeners}>
      <div className="flex items-center justify-between mb-1">
        <div className="font-medium cursor-pointer hover:underline" onClick={(e)=>{ e.stopPropagation(); onOpen(deal.id) }}>{deal.name}</div>
        <button className="text-red-500 hover:text-red-700" title="Удалить" onClick={(e)=>{ e.stopPropagation(); onDelete(deal.id) }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M9 3v1H4v2h16V4h-5V3H9zm1 6v9h2V9h-2zm-4 0v9h2V9H6zm8 0v9h2V9h-2z"/></svg>
        </button>
      </div>
      {deal.amount != null && (
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded-full bg-peach-100 text-gray-700 dark:bg-white/10 dark:text-gray-200">Сумма: {deal.amount}</span>
          <span className="px-2 py-0.5 rounded-full bg-peach-100 text-gray-700 dark:bg-white/10 dark:text-gray-200">Срок: —</span>
        </div>
      )}
    </div>
  )
}

function StageColumn({ pipelineId, id, name, items, onOpen, onDelete, onCreateClick }: { pipelineId: number; id: number; name: string; items: Deal[]; onOpen: (id: number)=>void; onDelete: (id: number)=>void; onCreateClick: ()=>void }) {
  const droppableId = `stage-${pipelineId}-${id}`
  const { setNodeRef } = useDroppable({ id: droppableId })
  return (
    <div className="cloud p-3 min-h-[300px]">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">{name}</div>
        <button className="btn-primary px-2 py-1 text-xs" onClick={onCreateClick}>+ Сделка</button>
      </div>
      <SortableContext items={items.map(i => `deal-${i.id}`)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="space-y-2">
          {items.map(card => <Card key={card.id} deal={card} onOpen={onOpen} onDelete={onDelete} />)}
        </div>
      </SortableContext>
    </div>
  )
}

export default function KanbanPage() {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [stagesByPipeline, setStagesByPipeline] = useState<Record<number, Stage[]>>({})
  const [deals, setDeals] = useState<Deal[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [createCtx, setCreateCtx] = useState<{ pipelineId: number; stageId: number } | null>(null)
  const router = useRouter()
  const activeDeal = useMemo(() => {
    if (!activeId?.startsWith('deal-')) return undefined
    const id = Number(activeId.replace('deal-', ''))
    return deals.find(d => d.id === id)
  }, [activeId, deals])

  useEffect(() => {
    ;(async () => {
      const { data } = await api.get('/api/v1/pipelines/')
      const list: Pipeline[] = (data as any).pipelines || []
      setPipelines(list)
      const stagesEntries: [number, Stage[]][] = await Promise.all(
        list.map(async (p) => {
          const [stRes, dlRes] = await Promise.all([
            api.get('/api/v1/stages/', { params: { pipeline_id: p.id } }),
            api.get('/api/v1/deals/', { params: { pipeline_id: p.id, limit: 100 } }),
          ])
          const stages: Stage[] = ((stRes.data as any).stages || []).map((s: any) => ({ ...s, pipeline_id: p.id }))
          const listDeals: Deal[] = (dlRes.data as any).deals || []
          setDeals(prev => {
            const map = new Map<number, Deal>(prev.map(d => [d.id, d]))
            for (const d of listDeals) map.set(d.id, d)
            return Array.from(map.values())
          })
          return [p.id, stages] as [number, Stage[]]
        })
      )
      setStagesByPipeline(Object.fromEntries(stagesEntries))
    })()
  }, [])

  const boards = useMemo(() => {
    return pipelines.map(p => ({
      pipeline: p,
      columns: (stagesByPipeline[p.id] || [])
        .slice()
        .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
        .map(s => ({
          ...s,
          items: deals
            .filter(d => d.pipeline_id === p.id && d.stage_id === s.id)
            .slice()
            .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
        }))
    }))
  }, [pipelines, stagesByPipeline, deals])

  async function updateDealPosition(id: number, pipeline_id: number, stage_id: number, order_index: number) {
    await api.patch(`/api/v1/deals/${id}/`, { pipeline_id, stage_id, order_index })
  }
  async function saveOrderChanges(changes: { id: number; pipeline_id: number; stage_id: number; order_index: number }[]) {
    if (!changes.length) return
    await Promise.all(changes.map(c => api.patch(`/api/v1/deals/${c.id}/`, {
      pipeline_id: c.pipeline_id,
      stage_id: c.stage_id,
      order_index: c.order_index,
    })))
  }

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  function onDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  function onDragOver(event: DragOverEvent) {
    const { active, over } = event
    if (!over) return
    const activeId = String(active.id)
    if (!activeId.startsWith('deal-')) return
    const dealId = Number(activeId.replace('deal-', ''))
    let targetStageId: number | null = null
    let targetPipelineId: number | null = null
    const overId = String(over.id)
    if (overId.startsWith('stage-')) {
      const [, pid, sid] = overId.split('-')
      targetPipelineId = Number(pid)
      targetStageId = Number(sid)
    } else if (overId.startsWith('deal-')) {
      const targetDealId = Number(overId.replace('deal-', ''))
      const targetDeal = deals.find(d => d.id === targetDealId)
      targetStageId = targetDeal ? targetDeal.stage_id : null
      targetPipelineId = targetDeal ? targetDeal.pipeline_id : null
    }
    if (!targetStageId || !targetPipelineId) return
    // Live update so карточка не “обрывается” при выходе из зоны
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, pipeline_id: targetPipelineId!, stage_id: targetStageId! } : d))
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    const activeId = active.id as string // e.g., deal-123
    if (!activeId.startsWith('deal-')) return
    const dealId = Number(activeId.replace('deal-', ''))

    // Find current deal and its source/target columns
    const deal = deals.find(d => d.id === dealId)
    if (!deal) return

    const targetElId = over.id as string // could be deal-xxx or stage-xxx
    let targetStageId: number | null = null
    let targetPipelineId: number | null = null
    if (targetElId.startsWith('stage-')) {
      const [, pid, sid] = targetElId.split('-')
      targetPipelineId = Number(pid)
      targetStageId = Number(sid)
    } else if (targetElId.startsWith('deal-')) {
      const targetDealId = Number(targetElId.replace('deal-', ''))
      const targetDeal = deals.find(d => d.id === targetDealId)
      targetStageId = targetDeal ? targetDeal.stage_id : null
      targetPipelineId = targetDeal ? targetDeal.pipeline_id : null
    }
    if (!targetStageId || !targetPipelineId) return

    // Build source/target without moving card
    const sourcePipelineId = deal.pipeline_id
    const sourceStageId = deal.stage_id
    const sourceList = deals
      .filter(d => d.pipeline_id === sourcePipelineId && d.stage_id === sourceStageId && d.id !== dealId)
      .slice().sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    const targetList = deals
      .filter(d => d.pipeline_id === targetPipelineId && d.stage_id === targetStageId && d.id !== dealId)
      .slice().sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))

    // insertion index in target
    let insertIndex = targetList.length
    if ((over.id as string).startsWith('deal-')) {
      const overDealId = Number((over.id as string).replace('deal-', ''))
      const idx = targetList.findIndex(d => d.id === overDealId)
      if (idx >= 0) insertIndex = idx
    }

    const moved = { ...deal, pipeline_id: targetPipelineId, stage_id: targetStageId }
    const newTarget = targetList.slice(0, insertIndex).concat([moved], targetList.slice(insertIndex))

    const sourceChanges = sourceList.map((d, i) => ({ id: d.id, pipeline_id: d.pipeline_id, stage_id: d.stage_id, order_index: i }))
    const targetChanges = newTarget.map((d, i) => ({ id: d.id, pipeline_id: targetPipelineId!, stage_id: targetStageId!, order_index: i }))

    setDeals(prev => prev.map(d => {
      const found = [...sourceChanges, ...targetChanges].find(c => c.id === d.id)
      return found ? { ...d, pipeline_id: found.pipeline_id, stage_id: found.stage_id, order_index: found.order_index } as any : d
    }))

    saveOrderChanges([...sourceChanges, ...targetChanges])
    setActiveId(null)
  }

  function onOpenDeal(id: number) {
    router.push(`/deals/${id}`)
  }

  async function onDeleteDeal(id: number) {
    if (!confirm('Удалить сделку?')) return
    await api.delete(`/api/v1/deals/${id}/`)
    setDeals(prev => prev.filter(d => d.id !== id))
  }

  async function createDealViaModal(values: { name: string; amount?: number }) {
    if (!createCtx) return
    const { pipelineId, stageId } = createCtx
    const payload: any = { name: values.name, pipeline_id: pipelineId, stage_id: stageId }
    if (values.amount != null) payload.amount = values.amount
    const { data } = await api.post('/api/v1/deals/', payload)
    const created: Deal = data as any
    setDeals(prev => [...prev, created])
    router.push(`/deals/${created.id}`)
  }

  return (
    <div>
      {pipelines.length === 0 ? <div>Загрузка...</div> : (
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 gap-6">
            {pipelines.map(p => (
              <div key={p.id} className="">
                <div className="font-semibold mb-3">{p.name}</div>
                <div className="grid grid-cols-4 gap-4">
                  {(stagesByPipeline[p.id] || [])
                    .slice()
                    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
                    .map(col => (
                      <StageColumn key={`${p.id}-${col.id}`} pipelineId={p.id} id={col.id} name={col.name} items={deals
                        .filter(d => d.pipeline_id === p.id && d.stage_id === col.id)
                        .sort((a, b) => ((a.order_index ?? 0) - (b.order_index ?? 0)))} onOpen={onOpenDeal} onDelete={onDeleteDeal} onCreateClick={()=>setCreateCtx({ pipelineId: p.id, stageId: col.id })} />
                    ))}
                </div>
              </div>
            ))}
          </div>
          {/* Drag overlay to keep card under pointer for smooth cross-column drag */}
          {/* dnd-kit DragOverlay is provided via @dnd-kit/core; render a simple preview */}
          {/* @ts-ignore */}
          <DragOverlay>
            {activeDeal ? (
              <div className="card p-3 opacity-90">
                <div className="font-medium mb-1">{activeDeal.name}</div>
                {activeDeal.amount != null && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-peach-100 text-gray-700 dark:bg-white/10 dark:text-gray-200">Сумма: {activeDeal.amount}</span>
                    <span className="px-2 py-0.5 rounded-full bg-peach-100 text-gray-700 dark:bg-white/10 dark:text-gray-200">Срок: —</span>
                  </div>
                )}
              </div>
            ) : null}
          </DragOverlay>
          <CreateDealModal open={!!createCtx} onClose={()=>setCreateCtx(null)} onSubmit={createDealViaModal} />
        </DndContext>
      )}
    </div>
  )
}

