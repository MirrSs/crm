"use client"
import { useEffect, useMemo, useState } from 'react'
import { chatsApi, api } from '@/lib/api'

type Channel = { id: string; name: string; type: string; active: boolean }
type Conversation = { id: string; channel_id: string; customer_id: string; last_message_at?: string; unread?: number; title?: string }
type Message = { id: string; conversation_id: string; direction: 'in' | 'out'; text?: string; attachments?: any[]; created_at: string }

export default function ChatsPage() {
  const [channels, setChannels] = useState<Channel[]>([])
  const [selectedChannel, setSelectedChannel] = useState<string>('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<string>('')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const { data } = await chatsApi.get('/api/v1/channels/')
        setChannels((data as any).channels || [])
      } catch {}
    })()
  }, [])

  useEffect(() => {
    if (!selectedChannel) return
    ;(async () => {
      const { data } = await chatsApi.get('/api/v1/conversations/', { params: { channel_id: selectedChannel } })
      setConversations((data as any).conversations || [])
    })()
  }, [selectedChannel])

  useEffect(() => {
    if (!selectedConversation) return
    ;(async () => {
      const { data } = await chatsApi.get(`/api/v1/conversations/${selectedConversation}/messages/`)
      setMessages((data as any).messages || [])
    })()
  }, [selectedConversation])

  async function send() {
    if (!selectedConversation || !input.trim()) return
    const payload = { text: input }
    const { data } = await chatsApi.post(`/api/v1/conversations/${selectedConversation}/messages/`, payload)
    setMessages(prev => [...prev, data as any])
    setInput('')
  }

  const currentConversation = useMemo(() => conversations.find(c => c.id === selectedConversation), [conversations, selectedConversation])

  return (
    <div className="grid grid-cols-[320px_1fr] gap-3 h-[calc(100vh-2rem-32px)]">
      <div className="cloud p-3 overflow-y-auto">
        <div className="font-medium mb-2">Каналы</div>
        <div className="space-y-1 mb-3">
          {channels.map(ch => (
            <button key={ch.id} onClick={()=>{ setSelectedChannel(ch.id); setSelectedConversation(''); setMessages([]) }} className={`w-full text-left px-3 py-2 rounded-xl ${selectedChannel===ch.id?'bg-peach-100':'hover:bg-peach-100'}`}>
              <div className="text-sm font-medium">{ch.name}</div>
              <div className="text-xs text-gray-500">{ch.type} · {ch.active ? 'Вкл' : 'Выкл'}</div>
            </button>
          ))}
        </div>
        {selectedChannel && (
          <>
            <div className="font-medium mb-2">Диалоги</div>
            <div className="space-y-1">
              {conversations.map(cv => (
                <button key={cv.id} onClick={()=>setSelectedConversation(cv.id)} className={`w-full text-left px-3 py-2 rounded-xl ${selectedConversation===cv.id?'bg-peach-100':'hover:bg-peach-100'}`}>
                  <div className="text-sm font-medium">{cv.title || cv.customer_id}</div>
                  <div className="text-xs text-gray-500">{cv.last_message_at ? new Date(cv.last_message_at).toLocaleString() : '-'}</div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="cloud p-3 flex flex-col">
        {currentConversation ? (
          <>
            <div className="font-medium mb-2">Диалог: {currentConversation.title || currentConversation.customer_id}</div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {messages.map(m => (
                <div key={m.id} className={`max-w-[70%] p-2 rounded-xl ${m.direction==='out'?'ml-auto bg-peach-200':'bg-white/70'}`}>
                  <div className="text-sm whitespace-pre-wrap">{m.text}</div>
                  <div className="text-[10px] text-gray-500 mt-1">{new Date(m.created_at).toLocaleTimeString()}</div>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input className="cloud p-2 flex-1" placeholder="Сообщение" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if (e.key==='Enter') send() }} />
              <button className="btn-primary" onClick={send}>Отправить</button>
            </div>
          </>
        ) : (
          <div className="text-gray-500 m-auto">Выберите диалог</div>
        )}
      </div>
    </div>
  )
}


