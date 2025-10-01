import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'system', content: 'You are ok-e, a helpful Korean AI assistant.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length])

  const canSend = useMemo(() => input.trim().length > 0 && !loading, [input, loading])

  async function handleSend() {
    if (!canSend) return
    const userMsg: ChatMessage = { role: 'user', content: input.trim() }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('http://localhost:8787/api/ok-e', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next, model: 'gpt-4o-mini' })
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const assistant = data.message as ChatMessage | null
      if (assistant) setMessages(curr => [...curr, assistant])
    } catch (e) {
      setMessages(curr => [
        ...curr,
        { role: 'assistant', content: '오류가 발생했어요. 서버가 실행 중인지 확인해주세요.' }
      ])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <h1>ok-e 비서</h1>
      <div
        ref={listRef}
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: 8,
          padding: 12,
          height: 420,
          overflowY: 'auto',
          background: '#fff'
        }}
      >
        {messages.filter(m => m.role !== 'system').map((m, i) => (
          <div key={i} style={{ marginBottom: 10, display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div
              style={{
                maxWidth: '80%',
                padding: '8px 12px',
                borderRadius: 10,
                background: m.role === 'user' ? '#2563eb' : '#f3f4f6',
                color: m.role === 'user' ? '#fff' : '#111827',
                whiteSpace: 'pre-wrap'
              }}
            >
              {m.content}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={loading ? '응답 대기 중…' : '메시지를 입력하세요'}
          style={{ flex: 1, padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: 8 }}
        />
        <button onClick={handleSend} disabled={!canSend}>
          {loading ? '생성 중…' : '보내기'}
        </button>
      </div>
    </div>
  )
}
