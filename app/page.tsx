"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Car, Leaf, Coins, Zap } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/components/AuthProvider"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { AuthModal } from "@/components/AuthModal"

export default function LandingPage() {
  const { user, loading, logout } = useAuth()
  const router = useRouter()
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup')
  const handleLogout = async () => {
    await logout()
    router.push('/')
  }
  return (
    <div className="min-h-screen bg-background page-enter">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center map-pulse">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">EcoRide</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link href="#contact" className="text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </Link>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : user ? (
              <div className="flex items-center gap-3">
                <div className="text-sm text-muted-foreground hidden lg:block">{user.name}</div>
                <Button variant="outline" size="sm" className="btn-hover bg-transparent" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="btn-hover bg-transparent" onClick={() => { setAuthMode('signin'); setAuthOpen(true) }}>Sign in</Button>
                <Button size="sm" className="btn-hover" onClick={() => { setAuthMode('signup'); setAuthOpen(true) }}>Sign up</Button>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} defaultMode={authMode} />

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight fade-in">
            EcoRide – Smarter, Greener, <span className="text-primary">Healthier Rides</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed slide-up">
            Join the sustainable transport revolution. AI-powered ride optimization that saves money, reduces emissions,
            and builds healthier communities.
          </p>

          {/* Hero Illustration Placeholder */}
          <div className="mb-10">
            <img
              src="/sustainable-transport-illustration-with-electric-v.png"
              alt="EcoRide sustainable transport illustration"
              className="mx-auto rounded-2xl shadow-lg card-lift"
              style={{
                filter: "drop-shadow(0 0 20px rgba(46, 204, 113, 0.3))",
                border: "2px solid rgba(46, 204, 113, 0.2)",
                boxShadow: "0 0 30px rgba(46, 204, 113, 0.15), inset 0 0 20px rgba(46, 204, 113, 0.1)",
              }}
            />
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="text-lg px-8 py-6 w-full sm:w-auto btn-hover slide-up">
                <Car className="w-5 h-5 mr-2" />
                Book a Ride
              </Button>
            </Link>
            <Link href="/dashboard/impact">
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8 py-6 bg-transparent w-full sm:w-auto btn-hover slide-up"
              >
                <Leaf className="w-5 h-5 mr-2" />
                See Impact
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 fade-in">Why Choose EcoRide?</h2>
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto slide-up">
            Experience the future of sustainable transportation with our AI-powered platform
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* AI Ride Optimization */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 card-lift">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 map-pulse">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl">AI Ride Optimization</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base leading-relaxed">
                  Smart algorithms match you with the most efficient routes and transport options, reducing wait times
                  and maximizing convenience.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Clean Energy Transport */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 card-lift">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 map-pulse">
                  <Leaf className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Clean Energy Transport</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base leading-relaxed">
                  Access to electric vehicles, e-bikes, and shared transport options that significantly reduce your
                  carbon footprint.
                </CardDescription>
              </CardContent>
            </Card>

            {/* EcoPoints & Rewards */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 card-lift">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 map-pulse">
                  <Coins className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Earn EcoPoints & Rewards</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-base leading-relaxed">
                  Get rewarded for sustainable choices. Earn points for eco-friendly rides and redeem them for discounts
                  and perks.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-12 fade-in">Making a Real Impact</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="space-y-2 slide-up">
              <div className="text-4xl font-bold text-primary counter-up">50K+</div>
              <div className="text-muted-foreground">Sustainable Rides</div>
            </div>
            <div className="space-y-2 slide-up">
              <div className="text-4xl font-bold text-primary counter-up">25T</div>
              <div className="text-muted-foreground">CO₂ Saved (tons)</div>
            </div>
            <div className="space-y-2 slide-up">
              <div className="text-4xl font-bold text-primary counter-up">15K+</div>
              <div className="text-muted-foreground">Happy Users</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center map-pulse">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">EcoRide</span>
              </div>
              <p className="text-muted-foreground">Building a sustainable future, one ride at a time.</p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Company</h3>
              <div className="space-y-2">
                <Link href="#about" className="block text-muted-foreground hover:text-foreground transition-colors">
                  About
                </Link>
                <Link href="#contact" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
                <Link href="#careers" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Careers
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Support</h3>
              <div className="space-y-2">
                <Link href="#help" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Help Center
                </Link>
                <Link href="#safety" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Safety
                </Link>
                <Link href="#terms" className="block text-muted-foreground hover:text-foreground transition-colors">
                  Terms
                </Link>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Connect</h3>
              <div className="flex gap-4">
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors btn-hover">
                  Twitter
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors btn-hover">
                  LinkedIn
                </Link>
                <Link href="#" className="text-muted-foreground hover:text-foreground transition-colors btn-hover">
                  Instagram
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 EcoRide. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
