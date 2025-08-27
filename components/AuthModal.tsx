"use client"

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/components/AuthProvider'

export function AuthModal({ open, onOpenChange, defaultMode = 'signup' }: { open: boolean; onOpenChange: (v: boolean) => void; defaultMode?: 'signin' | 'signup' }) {
  const { login, signup } = useAuth()
  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // shared fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // signup-only
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')

  // Sync mode with caller when defaultMode changes
  // Ensures opening with signup/signin shows the correct view
  useEffect(() => {
    setMode(defaultMode)
    setError(null)
  }, [defaultMode, open])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (mode === 'signin') {
        await login(email, password)
      } else {
        await signup(name, email, phone || undefined, password)
      }
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
        <div className="p-5 border-b bg-muted/20">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {mode === 'signin' ? 'Welcome back' : 'Create your EcoRide account'}
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {mode === 'signin' ? 'Sign in to continue riding sustainably.' : 'Join EcoRide and start earning EcoPoints.'}
            </p>
          </DialogHeader>
        </div>
        <div className="px-6 pt-3 pb-6 space-y-3">
          {error && <div className="text-sm text-red-500 mb-2">{error}</div>}
          <form onSubmit={onSubmit} className="space-y-3">
            {mode === 'signup' && (
              <div className="grid grid-cols-1 gap-3">
                <Input placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} required />
                <Input placeholder="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            )}
            <div className="grid grid-cols-1 gap-3">
              <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? (mode === 'signin' ? 'Signing in...' : 'Creating...') : (mode === 'signin' ? 'Sign in' : 'Sign up')}
            </Button>
          </form>
          {mode === 'signin' ? (
            <div className="text-sm text-muted-foreground text-center">
              Don&apos;t have an account? <button type="button" className="underline" onClick={() => setMode('signup')}>Sign up</button>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground text-center">
              Already have an account? <button type="button" className="underline" onClick={() => setMode('signin')}>Sign in</button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}


