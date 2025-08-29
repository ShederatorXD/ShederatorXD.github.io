"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Car, Leaf, Clock, MapPin, Star, Bike, Users, TreePine, Filter } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/AuthProvider"

const MODE_META: Record<string, { label: string; category: string; icon: any }> = {
  EV_SHUTTLE: { label: "EV Shuttle", category: "ev", icon: Car },
  E_BIKE: { label: "E-Bike", category: "bike", icon: Bike },
  RIDE_SHARE: { label: "Ride Share", category: "shared", icon: Users },
  WALK: { label: "Walk Suggestion", category: "walk", icon: TreePine },
}

export function MyRidesMain() {
  const { user } = useAuth()
  const [activeFilter, setActiveFilter] = useState<string>("all")
  const [rides, setRides] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRides = async () => {
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('rides')
        .select('id, pickup_address, dropoff_address, distance_km, duration_min, price, co2_saved_kg, mode, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setRides(data || [])
      setLoading(false)
    }
    fetchRides()
  }, [user])

  const computed = useMemo(() => {
    const totalRides = rides.length
    const totalCO2 = rides.reduce((s, r) => s + Number(r.co2_saved_kg || 0), 0)
    const totalSpent = rides.reduce((s, r) => s + Number(r.price || 0), 0)
    const points = Math.round(totalCO2 * 20)
    return { totalRides, totalCO2, totalSpent, points }
  }, [rides])

  const filters = [
    { id: "all", label: "All", count: rides.length },
    { id: "ev", label: "EV Rides", count: rides.filter((r) => MODE_META[r.mode]?.category === "ev").length },
    { id: "shared", label: "Shared Rides", count: rides.filter((r) => MODE_META[r.mode]?.category === "shared").length },
    { id: "walk", label: "Walking Trips", count: rides.filter((r) => MODE_META[r.mode]?.category === "walk").length },
  ]

  const filteredRides = useMemo(() => {
    const mapped = rides.map((r) => {
      const meta = MODE_META[r.mode] || { label: r.mode || 'Ride', category: 'other', icon: Car }
      return {
        id: r.id,
        type: meta.label,
        category: meta.category,
        from: r.pickup_address || 'Pickup',
        to: r.dropoff_address || 'Drop-off',
        date: new Date(r.created_at).toLocaleString(),
        cost: `$${Number(r.price || 0).toFixed(2)}`,
        points: Math.round(Number(r.co2_saved_kg || 0) * 20),
        co2Saved: String(Number(r.co2_saved_kg || 0).toFixed(1)),
        status: 'completed',
        rating: 5,
        icon: meta.icon,
        route: `${Number(r.distance_km || 0).toFixed(1)} km`
      }
    })
    return activeFilter === 'all' ? mapped : mapped.filter((ride) => ride.category === activeFilter)
  }, [rides, activeFilter])

  return (
    <div className="flex-1 p-6 overflow-auto bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">My Rides</h1>
        <p className="text-muted-foreground">Your sustainable transportation history and impact</p>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <Card className="border-0 shadow-md rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">{computed.totalRides}</div>
            <div className="text-sm text-muted-foreground">Total Rides</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-primary">{computed.totalCO2.toFixed(1)} kg</div>
            <div className="text-sm text-muted-foreground">CO₂ Saved</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-accent">{computed.points.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Points Earned</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-foreground">${computed.totalSpent.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Total Spent</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md mb-6 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Ride History</CardTitle>
              <CardDescription>Filter and view your sustainable transportation activities</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filter:</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-6">
            {filters.map((filter) => (
              <Button
                key={filter.id}
                variant={activeFilter === filter.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(filter.id)}
                className="flex items-center gap-2"
              >
                {filter.label}
                <Badge variant="secondary" className="ml-1">
                  {filter.count}
                </Badge>
              </Button>
            ))}
          </div>

          <div className="space-y-4">
            {loading && <div className="text-sm text-muted-foreground">Loading rides…</div>}
            {!loading && filteredRides.map((ride) => (
              <div
                key={ride.id}
                className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/20 transition-colors"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <ride.icon className="w-6 h-6 text-primary" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">{ride.type}</span>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {ride.status}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span
                        className="truncate max-w-[240px] sm:max-w-[420px]"
                        title={`${ride.from} → ${ride.to}`}
                      >
                        {ride.from} → {ride.to}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      {ride.date}
                    </div>
                  </div>

                  <div
                    className="text-xs text-muted-foreground mb-2 bg-muted/30 px-2 py-1 rounded line-clamp-1"
                    title={ride.route}
                  >
                    📍 {ride.route}
                  </div>

                  <div className="flex items-center gap-4 text-sm mb-2">
                    <span className="text-foreground font-medium">{ride.cost}</span>
                    <div className="flex items-center gap-1 text-primary">
                      <Leaf className="w-3 h-3" />
                      {ride.co2Saved} kg saved
                    </div>
                    <span className="text-accent">+{ride.points} points</span>
                  </div>

                  <div className="bg-primary/5 text-primary px-3 py-1 rounded-full text-xs font-medium inline-block">
                    You saved {ride.co2Saved}kg CO₂ on this trip
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="flex items-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < ride.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {!loading && filteredRides.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No rides found for the selected filter.</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
