"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  HelpCircle,
  MessageCircle,
  Mail,
  Phone,
  ChevronDown,
  ChevronRight,
  Send,
  Bot,
  User,
  Clock,
  CheckCircle,
  Ticket,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from "lucide-react"
import { useAuth } from "@/components/AuthProvider"

const faqData = [
  {
    id: 1,
    question: "How do EcoPoints work?",
    answer:
      "EcoPoints are earned every time you choose sustainable transport options. You get 10-15 points for EV rides, 8-12 for e-bikes, 15-20 for ride sharing, and 5-8 for walking suggestions. Points can be redeemed for ride discounts, rewards, or even donated to environmental causes.",
  },
  {
    id: 2,
    question: "What if no ride is available?",
    answer:
      "If no rides are available in your area, our AI will suggest alternative options like nearby public transport, walking routes with EcoPoints rewards, or notify you when rides become available. You can also pre-book rides up to 24 hours in advance.",
  },
  {
    id: 3,
    question: "How is CO₂ savings calculated?",
    answer:
      "We calculate CO₂ savings by comparing your chosen transport method with the equivalent car journey. Our algorithm considers factors like distance, vehicle efficiency, occupancy rates, and energy sources to provide accurate environmental impact measurements.",
  },
  {
    id: 4,
    question: "Can I cancel or modify my booking?",
    answer:
      "Yes, you can cancel or modify bookings up to 10 minutes before the scheduled pickup time without any charges. Cancellations within 10 minutes may incur a small fee, but you'll still earn partial EcoPoints for the booking attempt.",
  },
  {
    id: 5,
    question: "How do I add money to my wallet?",
    answer:
      "You can add money through UPI, debit/credit cards, net banking, or digital wallets. Go to Wallet & Payments section and click 'Add Money'. Minimum top-up is ₹100 and maximum is ₹10,000 per transaction.",
  },
  {
    id: 6,
    question: "What are EcoPerks and how do I earn them?",
    answer:
      "EcoPerks are cashback rewards you earn by using EcoPoints for payments. You get 5% cashback when paying with EcoPoints, which is credited to your wallet within 24 hours. It's our way of rewarding sustainable choices!",
  },
  {
    id: 7,
    question: "Is my personal data safe?",
    answer:
      "We use end-to-end encryption for all data transmission and store your information securely. We never share personal data with third parties without your consent and comply with all data protection regulations.",
  },
  {
    id: 8,
    question: "How do I report an issue with my ride?",
    answer:
      "You can report issues through the 'My Rides' section by clicking on the specific ride and selecting 'Report Issue'. You can also use the contact form below or reach out via our 24/7 support chat.",
  },
]

type ChatMsg = { id: number; type: "user" | "bot"; message: string; time: string }

type SupportTicket = {
  id: number
  name: string
  email: string
  subject: string
  message: string
  status: 'new' | 'in_progress' | 'resolved' | 'closed'
  created_at: string
  updated_at: string
  messages: Array<{
    id: string
    sender_type: 'user' | 'admin'
    message: string
    created_at: string
    sender_id?: string
  }>
}

export function SupportMain() {
  const { user } = useAuth()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [chatInput, setChatInput] = useState("")
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: 1,
      type: "bot",
      message: "Hi! I'm EcoBot, your sustainable transport assistant. How can I help you today?",
      time: "Just now",
    },
  ])
  const [chatLoading, setChatLoading] = useState(false)
  const chatViewportRef = useRef<HTMLDivElement | null>(null)
  const [contactForm, setContactForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })
  
  // New state for user tickets
  const [userTickets, setUserTickets] = useState<SupportTicket[]>([])
  const [loadingTickets, setLoadingTickets] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [newTicketMessage, setNewTicketMessage] = useState("")
  const [sendingTicketMessage, setSendingTicketMessage] = useState(false)
  const [messageSent, setMessageSent] = useState(false)

  const handleFaqToggle = (id: number) => {
    setOpenFaq(openFaq === id ? null : id)
  }

  useEffect(() => {
    if (chatViewportRef.current) {
      chatViewportRef.current.scrollTop = chatViewportRef.current.scrollHeight
    }
  }, [messages])

  // Fetch user's tickets
  useEffect(() => {
    if (user?.email) {
      fetchUserTickets()
    }
  }, [user?.email])

  // Update contact form when user data changes
  useEffect(() => {
    if (user) {
      setContactForm(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email
      }))
    }
  }, [user])

  const fetchUserTickets = async () => {
    if (!user?.email) return
    
    setLoadingTickets(true)
    try {
      const response = await fetch(`/api/support/user-tickets?email=${encodeURIComponent(user.email)}`)
      if (response.ok) {
        const data = await response.json()
        setUserTickets(data.tickets || [])
      }
    } catch (error) {
      console.error('Error fetching user tickets:', error)
    } finally {
      setLoadingTickets(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return (
          <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-medium border border-blue-200">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            New
          </div>
        )
      case 'in_progress':
        return (
          <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-full text-xs font-medium border border-amber-200">
            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
            In Progress
          </div>
        )
      case 'resolved':
        return (
          <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs font-medium border border-green-200">
            <CheckCircle className="w-3 h-3" />
            Resolved
          </div>
        )
      case 'closed':
        return (
          <div className="flex items-center gap-1 bg-gray-50 text-gray-700 px-2 py-1 rounded-full text-xs font-medium border border-gray-200">
            <XCircle className="w-3 h-3" />
            Closed
          </div>
        )
      default:
        return (
          <div className="flex items-center gap-1 bg-gray-50 text-gray-700 px-2 py-1 rounded-full text-xs font-medium border border-gray-200">
            {status}
          </div>
        )
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleSendTicketMessage = async () => {
    if (!selectedTicket || !newTicketMessage.trim() || sendingTicketMessage) return

    setSendingTicketMessage(true)
    try {
      const response = await fetch(`/api/admin/support-tickets/${selectedTicket.id}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newTicketMessage,
          senderId: user?.id || 'anonymous',
          senderType: 'user'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      
      // Update the selected ticket with new message
      setSelectedTicket(data.ticket)
      
      // Update the ticket in the list
      setUserTickets(prev => 
        prev.map(t => t.id === selectedTicket.id ? data.ticket : t)
      )
      
      // Clear the message input
      setNewTicketMessage('')
      
      // Show success message
      setMessageSent(true)
      setTimeout(() => setMessageSent(false), 3000)
      
    } catch (error) {
      console.error('Error sending ticket message:', error)
      // You could add a toast notification here
    } finally {
      setSendingTicketMessage(false)
    }
  }

  const handleSendMessage = async () => {
    const text = chatInput.trim()
    if (!text || chatLoading) return

    const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    const userMsg: ChatMsg = { id: Date.now(), type: "user", message: text, time: ts }
    setMessages((prev) => [...prev, userMsg])
    setChatInput("")
    setChatLoading(true)

    try {
      // Build history for backend: map our user/bot to user/model
      const history = messages.map((m) => ({ role: m.type === "user" ? "user" : "model", content: m.message }))
      const resp = await fetch("/api/ecobot", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text, history }),
      })
      const data = await resp.json().catch(() => ({} as any))
      const replyText: string = data?.text || data?.error || "Sorry, I couldn't respond."
      const botMsg: ChatMsg = { id: Date.now() + 1, type: "bot", message: replyText, time: "Just now" }
      setMessages((prev) => [...prev, botMsg])
    } catch (e) {
      const botMsg: ChatMsg = { id: Date.now() + 2, type: "bot", message: "Error contacting EcoBot.", time: "Just now" }
      setMessages((prev) => [...prev, botMsg])
    } finally {
      setChatLoading(false)
    }
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setSubmitStatus({ type: null, message: '' })

    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactForm),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit form')
      }

      // Clear form on success
      setContactForm({
        name: user?.name || '',
        email: user?.email || '',
        subject: '',
        message: '',
      })
      
      setSubmitStatus({
        type: 'success',
        message: 'Your support ticket has been submitted successfully! We\'ll get back to you soon.'
      })

      // Refresh tickets list
      if (user?.email) {
        fetchUserTickets()
      }
    } catch (error) {
      console.error('Error submitting support form:', error)
      setSubmitStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to submit form. Please try again.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Support & Help Center</h1>
          <p className="text-muted-foreground">Get help, find answers, and connect with our support team</p>
        </div>

        <Tabs defaultValue="faq" className="w-full">
          <TabsList className={`grid w-full ${userTickets.length > 0 ? 'grid-cols-2' : 'grid-cols-1'} mb-6`}>
            <TabsTrigger value="faq">FAQ & Contact</TabsTrigger>
            {userTickets.length > 0 && (
              <TabsTrigger value="my-tickets">My Tickets ({userTickets.length})</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="faq">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Quick Help */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HelpCircle className="w-5 h-5 text-primary" />
                      Quick Help
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <MessageCircle className="w-8 h-8 text-primary mx-auto mb-2" />
                        <h3 className="font-semibold mb-1">Live Chat</h3>
                        <p className="text-sm text-muted-foreground mb-3">Get instant help from our AI assistant</p>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Available 24/7
                        </Badge>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <Mail className="w-8 h-8 text-primary mx-auto mb-2" />
                        <h3 className="font-semibold mb-1">Email Support</h3>
                        <p className="text-sm text-muted-foreground mb-3">Detailed help via email</p>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          Response in 2-4 hours
                        </Badge>
                      </div>
                      <div className="text-center p-4 bg-muted/50 rounded-lg">
                        <Phone className="w-8 h-8 text-primary mx-auto mb-2" />
                        <h3 className="font-semibold mb-1">Phone Support</h3>
                        <p className="text-sm text-muted-foreground mb-3">Speak directly with our team</p>
                        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                          Mon-Fri 9AM-6PM
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* FAQ Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Frequently Asked Questions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {faqData.map((faq) => (
                        <Collapsible key={faq.id} open={openFaq === faq.id} onOpenChange={() => handleFaqToggle(faq.id)}>
                          <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors">
                            <span className="font-medium">{faq.question}</span>
                            {openFaq === faq.id ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                          </CollapsibleTrigger>
                          <CollapsibleContent className="px-4 pb-4">
                            <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                          </CollapsibleContent>
                        </Collapsible>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Form */}
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Support</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleContactSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-2 block">Name</label>
                          <Input
                            value={contactForm.name}
                            onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                            placeholder="Your full name"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Email</label>
                          <Input
                            type="email"
                            value={contactForm.email}
                            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                            placeholder="your.email@example.com"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Subject</label>
                        <Input
                          value={contactForm.subject}
                          onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                          placeholder="Brief description of your issue"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Message</label>
                        <Textarea
                          value={contactForm.message}
                          onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                          placeholder="Please describe your issue in detail..."
                          rows={4}
                        />
                      </div>
                      <div className="space-y-2">
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? 'Sending...' : 'Send Message'}
                        </Button>
                        {submitStatus.type && (
                          <div 
                            className={`p-3 rounded-md text-sm ${
                              submitStatus.type === 'success' 
                                ? 'bg-green-50 text-green-800' 
                                : 'bg-red-50 text-red-800'
                            }`}
                          >
                            {submitStatus.message}
                          </div>
                        )}
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* AI Chat Assistant */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-primary" />
                      EcoBot Assistant
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Chat Messages */}
                      <div ref={chatViewportRef} className="h-64 bg-muted/20 rounded-lg p-3 overflow-y-auto space-y-3">
                        {messages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex gap-2 ${message.type === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[80%] p-2 rounded-lg text-sm ${
                                message.type === "user"
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-background border border-border"
                              }`}
                            >
                              <p>{message.message}</p>
                              <div className="text-xs opacity-70 mt-1">{message.time}</div>
                            </div>
                          </div>
                        ))}
                        {chatLoading && (
                          <div className="flex gap-2 justify-start">
                            <div className="max-w-[80%] p-2 rounded-lg text-sm bg-background border border-border">
                              <p>Thinking…</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Chat Input */}
                      <div className="flex gap-2">
                        <Input
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Type your message..."
                          onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                        />
                        <Button size="sm" onClick={handleSendMessage} disabled={chatLoading || !chatInput.trim()}>
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Support Status */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Support Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">All systems operational</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        <span className="text-sm">Average response: 2.3 minutes</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        <span className="text-sm">24/7 AI assistance available</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Contact Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contact Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <div className="font-medium text-sm">Email</div>
                        <div className="text-sm text-muted-foreground">support@ecoride.com</div>
                      </div>
                      <div>
                        <div className="font-medium text-sm">Phone</div>
                        <div className="text-sm text-muted-foreground">+91 98765 43210</div>
                      </div>
                      <div>
                        <div className="font-medium text-sm">Office Hours</div>
                        <div className="text-sm text-muted-foreground">Mon-Fri: 9:00 AM - 6:00 PM IST</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="my-tickets">
            <div className="p-6 max-w-6xl mx-auto">
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-foreground mb-2">My Support Tickets</h1>
                <p className="text-muted-foreground">View and manage your support tickets</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                 {/* My Tickets List */}
                 <div className="lg:col-span-1">
                   <Card>
                     <CardHeader className="pb-4">
                       <div className="flex items-center justify-between">
                         <div>
                           <CardTitle className="text-lg">My Tickets</CardTitle>
                           <p className="text-sm text-muted-foreground mt-1">
                             {userTickets.length} ticket{userTickets.length !== 1 ? 's' : ''} • Last updated {loadingTickets ? 'now' : 'recently'}
                           </p>
                         </div>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={fetchUserTickets}
                           disabled={loadingTickets}
                           className="h-8 w-8 p-0"
                         >
                           <RefreshCw className={`w-4 h-4 ${loadingTickets ? 'animate-spin' : ''}`} />
                         </Button>
                       </div>
                     </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                                                 {loadingTickets ? (
                           <div className="text-center py-12">
                             <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                               <RefreshCw className="w-8 h-8 text-muted-foreground animate-spin" />
                             </div>
                             <h3 className="font-semibold text-lg mb-2">Loading tickets</h3>
                             <p className="text-sm text-muted-foreground">
                               Fetching your support tickets...
                             </p>
                           </div>
                                                 ) : userTickets.length === 0 ? (
                           <div className="text-center py-12">
                             <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                               <Ticket className="w-8 h-8 text-muted-foreground" />
                             </div>
                             <h3 className="font-semibold text-lg mb-2">No tickets yet</h3>
                             <p className="text-muted-foreground mb-4">
                               You haven't submitted any support tickets yet.
                             </p>
                             <p className="text-sm text-muted-foreground">
                               Switch to the FAQ & Contact tab to submit your first ticket.
                             </p>
                           </div>
                        ) : (
                          <div className="space-y-3">
                            {userTickets.map((ticket) => (
                                                             <div
                                 key={ticket.id}
                                 className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${
                                   selectedTicket?.id === ticket.id
                                     ? "bg-primary/5 border-primary shadow-md"
                                     : "bg-card border-border hover:border-primary/50 hover:shadow-sm"
                                 }`}
                                 onClick={() => setSelectedTicket(ticket)}
                               >
                                 {/* Status indicator */}
                                 <div className="absolute top-3 right-3">
                                   {getStatusBadge(ticket.status)}
                                 </div>

                                 {/* Ticket header */}
                                 <div className="flex items-start justify-between mb-3">
                                   <div className="flex items-center gap-2">
                                     <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                       <Ticket className="w-4 h-4 text-primary" />
                                     </div>
                                     <div>
                                       <h3 className="font-semibold text-base">#{ticket.id}</h3>
                                       <p className="text-xs text-muted-foreground">Support Ticket</p>
                                     </div>
                                   </div>
                                   
                                   {/* Message count */}
                                   {ticket.messages && ticket.messages.length > 0 && (
                                     <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-medium">
                                       <MessageCircle className="w-3 h-3" />
                                       {ticket.messages.length}
                                     </div>
                                   )}
                                 </div>

                                 {/* Subject */}
                                 <div className="mb-3">
                                   <p className="font-medium text-sm text-foreground line-clamp-2">
                                     {ticket.subject}
                                   </p>
                                 </div>

                                 {/* Timestamps */}
                                 <div className="flex items-center justify-between text-xs text-muted-foreground">
                                   <div className="flex items-center gap-1">
                                     <Clock className="w-3 h-3" />
                                     <span>Created {formatDate(ticket.created_at)}</span>
                                   </div>
                                   <div className="flex items-center gap-1">
                                     <RefreshCw className="w-3 h-3" />
                                     <span>Updated {formatDate(ticket.updated_at)}</span>
                                   </div>
                                 </div>

                                 {/* Hover effect */}
                                 <div className={`absolute inset-0 rounded-xl transition-opacity duration-200 ${
                                   selectedTicket?.id === ticket.id
                                     ? "bg-primary/5 opacity-100"
                                     : "bg-primary/5 opacity-0 group-hover:opacity-100"
                                 }`} />
                               </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                                 {/* Ticket Details */}
                 <div className="lg:col-span-2">
                   <Card>
                     <CardHeader>
                       <CardTitle>Ticket Details</CardTitle>
                     </CardHeader>
                     <CardContent>
                       {selectedTicket ? (
                         <div className="space-y-6">
                           {/* Ticket Header */}
                           <div className="border-b pb-4">
                             <div className="flex items-center gap-2 mb-2">
                               <Ticket className="w-6 h-6 text-primary" />
                               <h2 className="text-2xl font-bold">Ticket #{selectedTicket.id}</h2>
                               <div className="ml-auto">
                                 {getStatusBadge(selectedTicket.status)}
                               </div>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                               <div className="flex items-center gap-2">
                                 <Clock className="w-4 h-4" />
                                 Created: {formatDate(selectedTicket.created_at)}
                               </div>
                               <div className="flex items-center gap-2">
                                 <Clock className="w-4 h-4" />
                                 Updated: {formatDate(selectedTicket.updated_at)}
                               </div>
                               <div className="flex items-center gap-2">
                                 <MessageCircle className="w-4 h-4" />
                                 Subject: {selectedTicket.subject}
                               </div>
                               <div className="flex items-center gap-2">
                                 <Mail className="w-4 h-4" />
                                 Email: {selectedTicket.email}
                               </div>
                             </div>
                           </div>

                           {/* Original Message */}
                           <div className="bg-muted/30 p-4 rounded-lg">
                             <h3 className="font-semibold mb-2 flex items-center gap-2">
                               <User className="w-4 h-4" />
                               Original Message
                             </h3>
                             <p className="text-sm text-muted-foreground">{selectedTicket.message}</p>
                           </div>

                           {/* Conversation Messages */}
                           {selectedTicket.messages && selectedTicket.messages.length > 0 && (
                             <div className="space-y-4">
                               <h3 className="font-semibold flex items-center gap-2">
                                 <MessageCircle className="w-4 h-4" />
                                 Conversation ({selectedTicket.messages.length} messages)
                                 {sendingTicketMessage && (
                                   <Badge variant="secondary" className="text-xs">
                                     <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                     Sending...
                                   </Badge>
                                 )}
                               </h3>
                               <div className="space-y-3 max-h-96 overflow-y-auto">
                                 {selectedTicket.messages.map((msg, index) => (
                                   <div
                                     key={index}
                                     className={`p-3 rounded-lg ${
                                       msg.sender_type === 'admin'
                                         ? 'bg-blue-50 border border-blue-200'
                                         : 'bg-muted/30 border border-border'
                                     }`}
                                   >
                                     <div className="flex items-center justify-between mb-2">
                                       <div className="flex items-center gap-2">
                                         {msg.sender_type === 'admin' ? (
                                           <User className="w-4 h-4 text-blue-600" />
                                         ) : (
                                           <User className="w-4 h-4 text-muted-foreground" />
                                         )}
                                         <span className={`text-sm font-medium ${
                                           msg.sender_type === 'admin' ? 'text-blue-800' : 'text-muted-foreground'
                                         }`}>
                                           {msg.sender_type === 'admin' ? 'Support Team' : 'You'}
                                         </span>
                                       </div>
                                       <span className="text-xs text-muted-foreground">
                                         {formatDate(msg.created_at)}
                                       </span>
                                     </div>
                                     <p className="text-sm">{msg.message}</p>
                                   </div>
                                 ))}
                               </div>
                             </div>
                           )}

                           {/* No Messages */}
                           {(!selectedTicket.messages || selectedTicket.messages.length === 0) && (
                             <div className="text-center py-8 bg-muted/20 rounded-lg">
                               <MessageCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                               <p className="text-sm text-muted-foreground">No messages yet. Support team will respond soon.</p>
                             </div>
                           )}

                           {/* Send Message Form */}
                           <div className="border-t pt-4">
                             <h3 className="font-semibold mb-3 flex items-center gap-2">
                               <Send className="w-4 h-4" />
                               Send Message
                             </h3>
                             {messageSent && (
                               <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
                                 ✓ Message sent successfully!
                               </div>
                             )}
                             <div className="space-y-3">
                               <Textarea
                                 value={newTicketMessage}
                                 onChange={(e) => setNewTicketMessage(e.target.value)}
                                 placeholder="Type your message here... (Press Enter to send)"
                                 rows={3}
                                 disabled={sendingTicketMessage}
                                 onKeyDown={(e) => {
                                   if (e.key === 'Enter' && !e.shiftKey) {
                                     e.preventDefault();
                                     handleSendTicketMessage();
                                   }
                                 }}
                               />
                               <div className="flex justify-end">
                                 <Button
                                   onClick={handleSendTicketMessage}
                                   disabled={!newTicketMessage.trim() || sendingTicketMessage}
                                   size="sm"
                                 >
                                   {sendingTicketMessage ? (
                                     <>
                                       <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                       Sending...
                                     </>
                                   ) : (
                                     <>
                                       <Send className="w-4 h-4 mr-2" />
                                       Send Message
                                     </>
                                   )}
                                 </Button>
                               </div>
                             </div>
                           </div>
                         </div>
                       ) : (
                         <div className="text-center py-8">
                           <Ticket className="w-10 h-10 text-muted-foreground mb-2" />
                           <p>Select a ticket from the list on the left to view details.</p>
                         </div>
                       )}
                     </CardContent>
                   </Card>
                 </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
