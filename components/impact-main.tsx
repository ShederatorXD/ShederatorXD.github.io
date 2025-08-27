"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Leaf, TreePine, TrendingUp, Users, Award, BarChart3, Car, Bike } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/AuthProvider"

type MonthRow = { label: string; co2: number; shared: number; solo: number }

export function ImpactMain() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [userCO2Kg, setUserCO2Kg] = useState(0)
  const [userPoints, setUserPoints] = useState(0)
  const [communityCO2Tons, setCommunityCO2Tons] = useState(0)
  const [communityUsers, setCommunityUsers] = useState(0)
  const [sharedCount, setSharedCount] = useState(0)
  const [soloCount, setSoloCount] = useState(0)
  const [monthly, setMonthly] = useState<MonthRow[]>([])
  const [userRank, setUserRank] = useState<number | null>(null)
  const [totalUsers, setTotalUsers] = useState(0)

  useEffect(() => {
    const run = async () => {
      if (!user) { setLoading(false); return }
      // 1) User totals
      const { data: logs } = await supabase
        .from('impact_logs')
        .select('co2_saved_kg, created_at')
        .eq('user_id', user.id)
      const totalCO2 = (logs || []).reduce((s, r: any) => s + Number(r.co2_saved_kg || 0), 0)
      setUserCO2Kg(Math.round(totalCO2 * 10) / 10)

      // 2) Points from profile
      setUserPoints(user.ecoPoints || 0)

      // 3) Community totals (basic)
      const { data: allLogs } = await supabase
        .from('impact_logs')
        .select('co2_saved_kg')
      const commCO2 = (allLogs || []).reduce((s, r: any) => s + Number(r.co2_saved_kg || 0), 0)
      setCommunityCO2Tons(Math.round(commCO2) / 1000) // kg -> tons
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
      setCommunityUsers(usersCount || 0)
      setTotalUsers(usersCount || 0)

      // 6) Calculate user's community rank
      if (usersCount && usersCount > 0) {
        const { data: allProfiles } = await supabase
          .from('profiles')
          .select('id, eco_points')
          .order('eco_points', { ascending: false })
        
        if (allProfiles) {
          const userRankIndex = allProfiles.findIndex(profile => profile.id === user.id)
          if (userRankIndex !== -1) {
            setUserRank(userRankIndex + 1)
          }
        }
      }

      // 4) Shared vs Solo from rides
      const { data: myRides } = await supabase
        .from('rides')
        .select('mode, created_at')
        .eq('user_id', user.id)
      const shared = (myRides || []).filter((r: any) => r.mode === 'RIDE_SHARE').length
      const solo = (myRides || []).length - shared
      setSharedCount(shared)
      setSoloCount(solo)

      // 5) Monthly buckets
      const buckets = new Map<string, { co2: number; shared: number; solo: number }>()
      ;(myRides || []).forEach((r: any) => {
        const d = new Date(r.created_at)
        const key = d.toLocaleString('en-US', { month: 'short' })
        const s = buckets.get(key) || { co2: 0, shared: 0, solo: 0 }
        const m = r.mode === 'RIDE_SHARE'
        s[m ? 'shared' : 'solo'] += 1
        buckets.set(key, s)
      })
      ;(logs || []).forEach((r: any) => {
        const d = new Date(r.created_at)
        const key = d.toLocaleString('en-US', { month: 'short' })
        const s = buckets.get(key) || { co2: 0, shared: 0, solo: 0 }
        s.co2 += Number(r.co2_saved_kg || 0)
        buckets.set(key, s)
      })
      const order = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
      const rows: MonthRow[] = order.map(m => ({ label: m, co2: Math.round((buckets.get(m)?.co2 || 0)*10)/10, shared: buckets.get(m)?.shared || 0, solo: buckets.get(m)?.solo || 0 }))
      setMonthly(rows)

      setLoading(false)
    }
    run()
  }, [user])

  const treesEquivalent = useMemo(() => Math.round((userCO2Kg / 21.8) * 10) / 10, [userCO2Kg])

  if (loading) {
    return (
      <div className="flex-1 p-6 overflow-auto">
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="w-full max-w-lg eco-anim">
            <div className="relative h-36">
              {/* Track */}
              <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-2 bg-muted rounded-full" />

              {/* CO₂ bubbles and leaves along the path */}
              <div className="absolute left-2 right-2 top-0 bottom-0">
                {[10,25,40,55,70,85].map((pct, i) => (
                  <div key={`node-${i}`} className="absolute" style={{ left: `${pct}%`, top: '44%' } as any}>
                    {/* CO2 bubble (fades out as car passes) */}
                    <div className="relative -translate-x-1/2 -translate-y-1/2 animate-[bubbleOut_3.2s_cubic-bezier(0.22,0.61,0.36,1)_infinite]" style={{ animationDelay: `${i*0.3}s` } as any}>
                      <svg width="22" height="22" viewBox="0 0 22 22" className="drop-shadow-sm">
                        <circle cx="11" cy="11" r="10" fill="rgba(107,114,128,0.55)" />
                        <text x="11" y="13" textAnchor="middle" fontSize="8" fill="#f3f4f6">CO₂</text>
                      </svg>
                    </div>
                    {/* Leaf sprout (fades in after car) */}
                    <div className="relative -translate-x-1/2 -translate-y-1/2 opacity-0 animate-[leafIn_3.2s_cubic-bezier(0.22,0.61,0.36,1)_infinite]" style={{ animationDelay: `${0.6 + i*0.3}s` } as any}>
                      <Leaf className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Vehicle moving across full path */}
              <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2">
                <div className="relative h-0">
                  <div className="absolute -translate-y-1/2 -translate-x-1/2 animate-[driveX_3.2s_cubic-bezier(0.22,0.61,0.36,1)_infinite] will-change-transform">
                    <Car className="w-10 h-10 text-primary drop-shadow-md" />
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-5 text-center text-sm text-muted-foreground">Calculating your eco impact…</div>
          </div>
        </div>

        {/* Local styles for the loading animation */}
        <style jsx>{`
          /* Car travels end-to-end inside the padded track */
          @keyframes driveX {
            0% { transform: translateX(0%) translateY(-50%); left: 0%; }
            50% { transform: translateX(100%) translateY(-50%); left: 100%; }
            100% { transform: translateX(0%) translateY(-50%); left: 0%; }
          }
          /* Bubble fades/shrinks as if absorbed */
          @keyframes bubbleOut {
            0% { opacity: 1; transform: translate(-50%, -50%) scale(1); filter: grayscale(0.2); }
            55% { opacity: 0.7; transform: translate(-50%, -50%) scale(0.9); }
            65% { opacity: 0.3; transform: translate(-50%, -50%) scale(0.6); filter: grayscale(1); }
            100% { opacity: 0; transform: translate(-50%, -50%) scale(0.4); }
          }
          /* Leaf sprouts after bubble fades */
          @keyframes leafIn {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.6); }
            60% { opacity: 0; transform: translate(-50%, -50%) scale(0.6); }
            75% { opacity: 0.8; transform: translate(-50%, -50%) scale(1); }
            100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 overflow-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Community Impact Dashboard</h1>
        <p className="text-muted-foreground">See how your sustainable choices are making a difference globally</p>
      </div>

      <Card className="border-0 shadow-md mb-8 bg-gradient-to-r from-primary/10 to-accent/10">
        <CardContent className="p-6">
          <div className="text-center">
            <TreePine className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-primary mb-2">
              Together, EcoRide has saved the equivalent of {Math.max(1, Math.round((communityCO2Tons*1000)/21.8))} trees 🌳
            </h2>
            <p className="text-muted-foreground">
              Our community of {communityUsers.toLocaleString()} eco-riders has prevented {communityCO2Tons.toFixed(1)} tons of CO₂ emissions
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Impact Overview */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Your CO₂ Saved</CardTitle>
            <Leaf className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{userCO2Kg.toFixed(1)} kg</div>
            <p className="text-xs text-muted-foreground">Synced from your rides</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trees Equivalent</CardTitle>
            <TreePine className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{treesEquivalent}</div>
            <p className="text-xs text-muted-foreground">Approx. trees equivalent</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Community Rank</CardTitle>
            <Award className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">
              {userRank ? `#${userRank}` : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              {userRank && totalUsers ? 
                `Top ${Math.round(((totalUsers - userRank + 1) / totalUsers) * 100)}% of ${totalUsers} riders` : 
                'Calculating rank...'
              }
            </p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shared vs Solo</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{(sharedCount + soloCount) ? Math.round((sharedCount/(sharedCount+soloCount))*100) : 0}%</div>
            <p className="text-xs text-muted-foreground">Shared rides ratio</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              CO₂ Savings Over Time
            </CardTitle>
            <CardDescription>Your monthly environmental impact</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthly.map((data) => (
                <div key={data.label} className="flex items-center gap-4">
                  <div className="w-12 text-sm font-medium">{data.label}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-muted-foreground">CO₂ Saved</span>
                      <span className="text-sm font-medium text-primary">{data.co2.toFixed(1)} kg</span>
                    </div>
                    <Progress value={Math.min(100, (data.co2 / Math.max(1, userCO2Kg)) * 100)} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-accent" />
              Shared vs Solo Rides
            </CardTitle>
            <CardDescription>Your ride sharing patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {monthly.map((data) => (
                <div key={data.label} className="flex items-center gap-4">
                  <div className="w-12 text-sm font-medium">{data.label}</div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-primary">Shared: {data.shared}</span>
                      <span className="text-sm text-muted-foreground">Solo: {data.solo}</span>
                    </div>
                    <div className="flex gap-1">
                      <div
                        className="bg-primary h-2 rounded-l"
                        style={{ width: `${(data.shared + data.solo ? (data.shared / (data.shared + data.solo)) * 100 : 0)}%` }}
                      />
                      <div
                        className="bg-muted h-2 rounded-r"
                        style={{ width: `${(data.shared + data.solo ? (data.solo / (data.shared + data.solo)) * 100 : 0)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-accent" />
            Your Snapshot
          </CardTitle>
          <CardDescription>Points and savings synced from your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-primary/5">
              <div className="text-xs text-muted-foreground">Total CO₂ Saved</div>
              <div className="text-xl font-bold text-primary">{userCO2Kg.toFixed(1)} kg</div>
            </div>
            <div className="p-4 rounded-lg bg-accent/5">
              <div className="text-xs text-muted-foreground">EcoPoints</div>
              <div className="text-xl font-bold text-accent">{userPoints.toLocaleString()}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Impact Comparison */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Your Impact vs Average User
            </CardTitle>
            <CardDescription>See how you compare to other EcoRide users</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>CO₂ Saved</span>
                <span className="text-primary font-medium">+23% above average</span>
              </div>
              <Progress value={75} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Rides Taken</span>
                <span className="text-primary font-medium">+15% above average</span>
              </div>
              <Progress value={65} />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Points Earned</span>
                <span className="text-primary font-medium">+31% above average</span>
              </div>
              <Progress value={80} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Global Community Impact</CardTitle>
            <CardDescription>Our collective environmental contribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center p-4 bg-primary/5 rounded-lg">
              <div className="text-3xl font-bold text-primary mb-2">Top 15%</div>
              <p className="text-sm text-muted-foreground">Most sustainable users this month</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Global CO₂ saved</span>
                <span className="text-sm font-medium">{communityCO2Tons.toFixed(1)} tons</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Active eco-riders</span>
                <span className="text-sm font-medium">{communityUsers.toLocaleString()} users</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Cities covered</span>
                <span className="text-sm font-medium">—</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
