
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Car, Leaf, Coins, MapPin, Navigation, Clock, TrendingUp } from "lucide-react"
import { LiveMap } from "@/components/LiveMap"
import { useAuth } from "@/components/AuthProvider"
import { useUserValidation } from "@/hooks/use-user-validation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from "recharts"

interface UserStats {
  ridesTaken: number
  ridesLastWeek: number
  co2Saved: number
  co2ThisWeek: number
  ecoPoints: number
  pointsEarned: number
}

interface RecentRide {
  id: string
  pickup_location: string
  destination: string
  created_at: string
  co2_saved_kg: number
  points_earned: number
  mode: string
}

export function DashboardMain() {
  const { user } = useAuth()
  const firstName = (user?.name || '').split(' ')[0] || 'there'
  
  const [userStats, setUserStats] = useState<UserStats>({
    ridesTaken: 0,
    ridesLastWeek: 0,
    co2Saved: 0,
    co2ThisWeek: 0,
    ecoPoints: 0,
    pointsEarned: 0
  })
  
  const [recentRides, setRecentRides] = useState<RecentRide[]>([])
  const [loading, setLoading] = useState(true)
  const [rides7d, setRides7d] = useState<{ day: string; count: number }[]>([])
  const tips = [
    'Combine trips to reduce overall travel emissions.',
    'Prefer public transport or carpool for longer distances.',
    'Keep tires properly inflated to improve EV efficiency.',
    'Use e-bikes for short city commutes to cut CO₂.',
    'Avoid peak traffic hours to reduce idling emissions.',
  ]
  const [tipIndex, setTipIndex] = useState(0)

  // Fetch user statistics and recent rides
  useEffect(() => {
    if (user?.id) {
      fetchDashboardData()
    }
  }, [user?.id])

  useEffect(() => {
    const id = setInterval(() => {
      setTipIndex((i) => (i + 1) % tips.length)
    }, 5000)
    return () => clearInterval(id)
  }, [])

  const fetchDashboardData = async () => {
    if (!user?.id) return
    
    setLoading(true)
    try {
      // Fetch recent rides for list
      const { data: rides, error: ridesError } = await supabase
        .from('rides')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
      
      if (ridesError) {
        console.error('Error fetching rides:', ridesError)
      }

      // Calculate statistics
      const totalRides = rides?.length || 0
      
      // Calculate rides from last week
      const oneWeekAgo = new Date()
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
      const ridesLastWeek = rides?.filter(ride => 
        new Date(ride.created_at) >= oneWeekAgo
      ).length || 0

      // Calculate CO₂ saved (assuming average 2.5kg CO₂ saved per ride)
      const co2PerRide = 2.5
      const totalCo2Saved = totalRides * co2PerRide
      const co2ThisWeek = ridesLastWeek * co2PerRide

      // Get EcoPoints from user profile
      const ecoPoints = user.ecoPoints || 0
      
      // Calculate points earned (assuming 50 points per ride)
      const pointsPerRide = 50
      const pointsEarned = totalRides * pointsPerRide

      setUserStats({
        ridesTaken: totalRides,
        ridesLastWeek,
        co2Saved: Math.round(totalCo2Saved * 10) / 10,
        co2ThisWeek: Math.round(co2ThisWeek * 10) / 10,
        ecoPoints,
        pointsEarned
      })

      // Set recent rides
      if (rides) {
        setRecentRides(rides.map(ride => ({
          id: ride.id,
          pickup_location: ride.pickup_address || 'Unknown location',
          destination: ride.dropoff_address || 'Unknown destination',
          created_at: ride.created_at,
          co2_saved_kg: ride.co2_saved_kg || co2PerRide,
          points_earned: ride.points_earned || pointsPerRide,
          mode: ride.mode || 'Electric Vehicle'
        })))
      }

      // Fetch last 7 days rides counts (local date buckets to avoid TZ drift)
      const since = new Date()
      since.setDate(since.getDate() - 6)
      since.setHours(0, 0, 0, 0)

      const { data: ridesWindow } = await supabase
        .from('rides')
        .select('id, created_at')
        .eq('user_id', user.id)
        .gte('created_at', since.toISOString())

      // Precompute local-date keys for the last 7 days
      const days: string[] = [] // 'YYYY-MM-DD' in local time
      const buckets = new Map<string, number>()
      for (let i = 0; i < 7; i++) {
        const d = new Date(since)
        d.setDate(since.getDate() + i)
        const key = d.toLocaleDateString('en-CA') // YYYY-MM-DD
        days.push(key)
        buckets.set(key, 0)
      }
      ;(ridesWindow || []).forEach((r) => {
        const rideKey = new Date(r.created_at).toLocaleDateString('en-CA')
        if (buckets.has(rideKey)) {
          buckets.set(rideKey, (buckets.get(rideKey) || 0) + 1)
        }
      })
      const series = days.map((k) => ({ day: k.slice(5), count: buckets.get(k) || 0 }))
      setRides7d(series)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Format time ago
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    
    const diffInWeeks = Math.floor(diffInDays / 7)
    return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`
  }

  // Get transport icon
  const getTransportIcon = (transportType: string) => {
    switch (transportType.toLowerCase()) {
      case 'e-bike':
      case 'bike':
        return <Leaf className="w-5 h-5 text-accent" />
      case 'ev':
      case 'electric':
        return <Car className="w-5 h-5 text-primary" />
      default:
        return <Car className="w-5 h-5 text-primary" />
    }
  }

  // Truncate long locations nicely using comma segments, then length limit
  const shortenLocation = (text: string, maxLen: number = 60) => {
    if (!text) return 'Unknown'
    const parts = text.split(',').map(p => p.trim()).filter(Boolean)
    const primary = parts.slice(0, 2).join(', ')
    const candidate = primary || parts[0] || text
    if (candidate.length <= maxLen) return candidate
    return candidate.slice(0, maxLen - 1) + '…'
  }

  return (
    <div className="flex-1 p-6 overflow-auto page-enter">
      {/* Welcome Section */}
      <div className="mb-8 fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{`Hi ${firstName}, ready to ride sustainably?`}</h1>
            <p className="text-muted-foreground">
              Welcome back to your EcoRide dashboard. Let's make today's journey count!
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchDashboardData}
            disabled={loading}
            className="btn-hover"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="border-0 shadow-md card-lift slide-up">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rides Taken</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground map-pulse" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold text-foreground">...</div>
            ) : (
              <>
                <div className="text-2xl font-bold text-foreground counter-up">
                  {userStats.ridesTaken}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  +{userStats.ridesLastWeek} from last week
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md card-lift slide-up">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CO₂ Saved</CardTitle>
            <Leaf className="h-4 w-4 text-primary map-pulse" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold text-primary">...</div>
            ) : (
              <>
                <div className="text-2xl font-bold text-primary counter-up">
                  {userStats.co2Saved} kg
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  +{userStats.co2ThisWeek} kg this week
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md card-lift slide-up">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">EcoPoints Balance</CardTitle>
            <Coins className="h-4 w-4 text-accent map-pulse" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold text-accent">...</div>
            ) : (
              <>
                <div className="text-2xl font-bold text-accent counter-up">
                  {userStats.ecoPoints.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-green-600" />
                  +{userStats.pointsEarned} points earned
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Map Widget */}
        <Card className="border-0 shadow-md card-lift fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 map-pulse" />
              Nearby Transport
            </CardTitle>
            <CardDescription>Available rides and vehicles near your location</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg overflow-hidden mb-4">
              <LiveMap height={300} enableLocate={true} showRoute={false} autoLocateOnMount={true} showLocationInfo={false} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg card-lift">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full map-pulse"></div>
                  <div>
                    <div className="font-medium text-sm">Electric Car</div>
                    <div className="text-xs text-muted-foreground">2 min away</div>
                  </div>
                </div>
                <Button size="sm" className="btn-hover">
                  Book
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg card-lift">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-accent rounded-full map-pulse"></div>
                  <div>
                    <div className="font-medium text-sm">E-Bike</div>
                    <div className="text-xs text-muted-foreground">5 min walk</div>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="btn-hover bg-transparent">
                  Reserve
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions and Sidebar Widgets */}
        <Card className="border-0 shadow-md card-lift fade-in">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Get started with your next sustainable journey</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link href="/dashboard/book-ride">
                <Button className="w-full justify-start gap-3 h-12 btn-hover">
                  <Car className="w-5 h-5" />
                  Book Ride
                </Button>
              </Link>
              <Link href="/dashboard/book-ride">
                <Button variant="outline" className="w-full justify-start gap-3 h-12 bg-transparent btn-hover">
                  <Clock className="w-5 h-5" />
                  Schedule Ride
                </Button>
              </Link>
              <Link href="/dashboard/ecopoints">
                <Button variant="outline" className="w-full justify-start gap-3 h-12 bg-transparent btn-hover">
                  <Coins className="w-5 h-5" />
                  Redeem Points
                </Button>
              </Link>
              <Link href="/dashboard/impact">
                <Button variant="outline" className="w-full justify-start gap-3 h-12 bg-transparent btn-hover">
                  <Leaf className="w-5 h-5" />
                  Impact Report
                </Button>
              </Link>
            </div>

            {/* 7-Day Rides Chart */}
            <div>
              <div className="text-sm font-medium mb-2">Rides in the last 7 days</div>
              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={rides7d}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={24} />
                    <Tooltip contentStyle={{ fontSize: 12, padding: '6px 8px' }} labelStyle={{ fontSize: 12 }} itemStyle={{ fontSize: 12 }} cursor={{ fill: 'transparent' }} />
                    <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4,4,0,0]} barSize={18} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Tips Section */}
            <div className="p-3 bg-muted/40 rounded-lg">
              <div className="text-sm font-medium mb-1">Tips for Greener Travel</div>
              <div className="text-sm text-muted-foreground min-h-[2rem] transition-all">{tips[tipIndex]}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-0 shadow-md mt-6 card-lift slide-up">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest rides and achievements</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                  <div className="w-10 h-10 bg-muted rounded-full animate-pulse"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded animate-pulse"></div>
                    <div className="h-3 bg-muted rounded animate-pulse w-2/3"></div>
                  </div>
                  <div className="h-4 bg-muted rounded animate-pulse w-16"></div>
                </div>
              ))}
            </div>
          ) : recentRides.length > 0 ? (
            <div className="space-y-4">
              {recentRides.map((ride) => (
                <div key={ride.id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg card-lift">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    {getTransportIcon(ride.mode)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {ride.mode} ride from {shortenLocation(ride.pickup_location)} to {shortenLocation(ride.destination)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {getTimeAgo(ride.created_at)} • Saved {ride.co2_saved_kg} kg CO₂
                    </div>
                  </div>
                  <div className="text-sm font-medium text-primary badge-pop">
                    +{ride.points_earned} points
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Car className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No rides yet. Start your sustainable journey!</p>
              <Link href="/dashboard/book-ride">
                <Button className="mt-3 btn-hover">
                  Book Your First Ride
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
