"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
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
} from "lucide-react"

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

export function SupportMain() {
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
    name: "",
    email: "",
    subject: "",
    message: "",
  })

  const handleFaqToggle = (id: number) => {
    setOpenFaq(openFaq === id ? null : id)
  }

  useEffect(() => {
    if (chatViewportRef.current) {
      chatViewportRef.current.scrollTop = chatViewportRef.current.scrollHeight
    }
  }, [messages])

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

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle contact form submission
    console.log("Contact form submitted:", contactForm)
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Support & Help Center</h1>
          <p className="text-muted-foreground">Get help, find answers, and connect with our support team</p>
        </div>

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
                  <Button type="submit" className="w-full">
                    Send Message
                  </Button>
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
      </div>
    </div>
  )
}
