'use client'

import { useState, useEffect, useRef, Fragment } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { format, formatDistanceToNow } from 'date-fns'
import { useAuth } from './AuthProvider'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Search, RefreshCw, MessageSquare, User, Mail, Calendar, ChevronDown, ChevronUp, Send } from 'lucide-react'
import { cn } from '@/lib/utils'

type TicketStatus = 'new' | 'in_progress' | 'resolved' | 'closed'

interface Message {
  id: string
  sender_type: 'user' | 'admin'
  sender_id?: string
  message: string
  created_at: string
}

interface SupportTicket {
  id: number
  name: string
  email: string
  subject: string
  message: string
  status: TicketStatus
  created_at: string
  updated_at: string
  messages?: Message[]
}

const statusVariant = {
  new: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
}

export function AdminSupportTickets() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'all'>('all')
  const [expandedTicket, setExpandedTicket] = useState<number | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user, loading: userLoading } = useAuth()
  const supabase = createClientComponentClient()



  const fetchTickets = async () => {
    setLoading(true)
    setError(null)
    
    console.log('🔍 Fetching tickets...')
    
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.set('status', statusFilter)
      }
      if (searchTerm) {
        params.set('search', searchTerm)
      }

      const response = await fetch(`/api/admin/support-tickets?${params.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      console.log('📡 Response status:', response.status)
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()))
      
      if (!response.ok) {
        let errorData = {}
        try {
          const responseText = await response.text()
          console.log('📡 Response text:', responseText)
          errorData = responseText ? JSON.parse(responseText) : {}
        } catch (parseError) {
          console.error('❌ Failed to parse response:', parseError)
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
        }
        console.error('❌ API Error:', errorData)
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('✅ Tickets fetched:', data.tickets?.length || 0)
      setTickets(data.tickets || [])
    } catch (error) {
      console.error('Error fetching tickets:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch tickets')
    } finally {
      setLoading(false)
    }
  }

  const updateTicketStatus = async (ticketId: number, newStatus: TicketStatus) => {
    try {
      const response = await fetch(`/api/admin/support-tickets/${ticketId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to update ticket status')
      }

      // Refresh the tickets list
      await fetchTickets()
    } catch (error) {
      console.error('Error updating ticket status:', error)
      // You might want to show an error toast here
    }
  }

  const toggleExpandTicket = async (ticketId: number) => {
    if (expandedTicket === ticketId) {
      setExpandedTicket(null)
    } else {
      // Fetch the full ticket with messages when expanding
      try {
        const response = await fetch(`/api/admin/support-tickets/${ticketId}`)
        if (response.ok) {
          const { ticket } = await response.json()
          setTickets(prev => 
            prev.map(t => t.id === ticketId ? { ...t, ...ticket } : t)
          )
        }
      } catch (error) {
        console.error('Error fetching ticket details:', error)
      }
      setExpandedTicket(ticketId)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (expandedTicket) {
      scrollToBottom()
    }
  }, [expandedTicket, tickets])

  useEffect(() => {
    // Fetch tickets whenever status filter changes
    fetchTickets()
  }, [statusFilter])

  const handleSendMessage = async (ticketId: number) => {
    if (!newMessage.trim() || isSending) return;
    
    setIsSending(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/admin/support-tickets/${ticketId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newMessage,
          senderId: user?.id || 'anonymous'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();

      // Update the ticket in the list
      setTickets(prev => 
        prev.map(t => t.id === ticketId ? { ...t, ...data.ticket } : t)
      );
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  }

  // Show loading state
  if ((loading || userLoading) && tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Loading support tickets...</p>
      </div>
    );
  }

  // Show error if any
  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        <p className="font-medium">Error</p>
        <p>{error}</p>
        {error.includes('logged in') && (
          <p className="mt-2 text-sm">Please log in with an admin account to view support tickets.</p>
        )}
        {error.includes('admin') && (
          <p className="mt-2 text-sm">Only users with admin privileges can access this feature.</p>
        )}
      </div>
    );
  }



  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-2xl font-bold">Support Tickets</h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tickets..."
              className="pl-9 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchTickets()}
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as TicketStatus | 'all')}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={fetchTickets} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        {tickets.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <MessageSquare className="mx-auto h-12 w-12 mb-4 opacity-20" />
            <p>No support tickets found</p>
            <Button variant="ghost" className="mt-2" onClick={fetchTickets} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>From</TableHead>
                <TableHead className="w-[150px]">Status</TableHead>
                <TableHead className="w-[180px]">Created</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => (
                <Fragment key={ticket.id}>
                  <TableRow 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => toggleExpandTicket(ticket.id)}
                  >
                    <TableCell className="font-medium">#{ticket.id}</TableCell>
                    <TableCell className="font-medium">
                      <div className="line-clamp-1">{ticket.subject}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate max-w-[150px]">{ticket.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("capitalize", statusVariant[ticket.status])}>
                        {ticket.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          {expandedTicket === ticket.id ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedTicket === ticket.id && (
                    <TableRow className="bg-muted/10">
                      <TableCell colSpan={6} className="p-0">
                        <div className="border-t border-border">
                          <div className="p-4 max-h-[400px] overflow-y-auto space-y-4">
                            {/* Initial message */}
                            <div className="flex flex-col space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="font-medium">{ticket.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {format(new Date(ticket.created_at), 'MMM d, yyyy h:mm a')}
                                </div>
                              </div>
                              <div className="bg-muted/50 p-3 rounded-lg max-w-[80%]">
                                <p className="whitespace-pre-line">{ticket.message}</p>
                              </div>
                            </div>

                            {/* Messages thread */}
                            {ticket.messages?.map((msg) => (
                              <div 
                                key={msg.id} 
                                className={`flex flex-col space-y-1 ${
                                  msg.sender_type === 'admin' ? 'items-end' : 'items-start'
                                }`}
                              >
                                <div 
                                  className={`p-3 rounded-lg max-w-[80%] ${
                                    msg.sender_type === 'admin' 
                                      ? 'bg-primary text-primary-foreground' 
                                      : 'bg-muted/50'
                                  }`}
                                >
                                  <p className="whitespace-pre-line">{msg.message}</p>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                                </div>
                              </div>
                            ))}
                            <div ref={messagesEndRef} />
                          </div>

                          {/* Message input */}
                          <div className="border-t border-border p-4 bg-background">
                            <div className="flex items-center gap-2">
                              <Textarea
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Type your message..."
                                className="min-h-[40px] max-h-[120px] resize-none"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSendMessage(ticket.id)
                                  }
                                }}
                                disabled={isSending}
                              />
                              <Button 
                                onClick={() => handleSendMessage(ticket.id)}
                                disabled={!newMessage.trim() || isSending}
                                size="icon"
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="flex justify-between items-center mt-2">
                              <div className="text-xs text-muted-foreground">
                                Press Enter to send, Shift+Enter for new line
                              </div>
                              <Select 
                                value={ticket.status} 
                                onValueChange={(value) => updateTicketStatus(ticket.id, value as TicketStatus)}
                              >
                                <SelectTrigger className="w-[180px] h-8 text-xs">
                                  <SelectValue placeholder="Update status" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="new">New</SelectItem>
                                  <SelectItem value="in_progress">In Progress</SelectItem>
                                  <SelectItem value="resolved">Resolved</SelectItem>
                                  <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
