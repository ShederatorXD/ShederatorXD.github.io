"use client"

import Link from 'next/link'
import { useAuth } from '@/components/AuthProvider'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export function AuthTopBar() {
  const { user, logout, loading } = useAuth()

  return (
    <div className="w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between">
        <Link href="/" className="font-semibold">EcoRide</Link>
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : user ? (
            <>
              <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={(user.avatarUrl && user.avatarUrl.startsWith('http')) ? user.avatarUrl : '/placeholder-user.jpg'} onError={(e)=>{(e.currentTarget as HTMLImageElement).src='/placeholder-user.jpg'}} />
                  <AvatarFallback>{(user.name || 'U').split(' ').map(n=>n[0]).join('').slice(0,2)}</AvatarFallback>
                </Avatar>
                <div className="text-sm text-muted-foreground hidden sm:block">{user.name}</div>
              </div>
              <Button size="sm" variant="outline" onClick={logout}>Logout</Button>
            </>
          ) : (
            <>
              <Link href="/login"><Button size="sm" variant="outline">Sign in</Button></Link>
              <Link href="/signup"><Button size="sm">Sign up</Button></Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}


