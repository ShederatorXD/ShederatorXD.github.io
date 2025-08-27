"use client"

import { useEffect, useRef, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { MessageCircle } from 'lucide-react'

type Msg = { role: 'user' | 'model'; content: string }

function EcoBotComponent() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<Msg[]>([])
  const viewportRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight
    }
  }, [history, open])

  const send = async () => {
    const message = input.trim()
    if (!message || loading) return
    setLoading(true)
    setHistory((h) => [...h, { role: 'user', content: message }])
    setInput('')
    try {
      const resp = await fetch('/api/ecobot', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message, history }),
      })
      const data = await resp.json().catch(() => ({} as any))
      const text = data?.text || data?.error || 'Sorry, I could not respond.'
      setHistory((h) => [...h, { role: 'model', content: text }])
    } catch {
      setHistory((h) => [...h, { role: 'model', content: 'Error contacting EcoBot.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
        aria-label="Open EcoBot"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>EcoBot Assistant</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div ref={viewportRef} className="h-72 overflow-auto border rounded p-3 bg-muted/20 space-y-3">
              {history.length === 0 && (
                <div className="text-sm text-muted-foreground">Ask me anything — general knowledge, coding, math, travel, or app help.</div>
              )}
              {history.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
                  <div className={`inline-block px-3 py-2 rounded text-sm ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background border'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Type your question..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') send() }}
              />
              <Button onClick={send} disabled={loading || !input.trim()}>{loading ? 'Sending...' : 'Send'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default EcoBotComponent
export { EcoBotComponent as EcoBot }


