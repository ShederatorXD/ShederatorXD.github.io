"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import {
  Settings,
  Users,
  Car,
  TrendingUp,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Leaf,
  Gift,
  UserCheck,
  Calendar,
  RefreshCcw,
  Trash2,
} from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/AuthProvider"
import { ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts'

type AdminStats = {
  totalRides: number
  co2SavedKg: number
  newUsers: number
  totalEcoPoints: number
}

type SparkDataPoint = { day: string; value: number }

const recentRides = [
  {
    id: "R001",
    user: "Priya Singh",
    driver: "Raj Kumar",
    route: "Bandra → Andheri",
    type: "EV Shuttle",
    status: "completed",
    fare: "₹85",
    time: "2 mins ago",
  },
  {
    id: "R002",
    user: "Alex Johnson",
    driver: "Maya Patel",
    route: "Powai → BKC",
    type: "E-Bike",
    status: "in-progress",
    fare: "₹45",
    time: "5 mins ago",
  },
  {
    id: "R003",
    user: "David Kim",
    driver: "Neha Sharma",
    route: "Malad → Goregaon",
    type: "Ride Share",
    status: "completed",
    fare: "₹65",
    time: "8 mins ago",
  },
]

const pendingPartners = [
  {
    id: "P001",
    name: "Green Wheels EV",
    type: "EV Fleet",
    vehicles: 15,
    location: "Mumbai Central",
    rating: 4.8,
    documents: "verified",
    status: "pending",
  },
  {
    id: "P002",
    name: "EcoBike Rentals",
    type: "E-Bike Service",
    vehicles: 25,
    location: "Bandra West",
    rating: 4.6,
    documents: "pending",
    status: "review",
  },
  {
    id: "P003",
    name: "CleanRide Solutions",
    type: "EV Taxi",
    vehicles: 8,
    location: "Andheri East",
    rating: 4.9,
    documents: "verified",
    status: "pending",
  },
]

const activeDrivers = [
  {
    id: "D001",
    name: "Raj Kumar",
    vehicle: "Tata Nexon EV",
    location: "Bandra",
    status: "available",
    rating: 4.9,
    ridesCompleted: 156,
  },
  {
    id: "D002",
    name: "Maya Patel",
    vehicle: "Ather 450X",
    location: "Powai",
    status: "busy",
    rating: 4.8,
    ridesCompleted: 203,
  },
  {
    id: "D003",
    name: "Neha Sharma",
    vehicle: "Mahindra eVerito",
    location: "Malad",
    status: "available",
    rating: 4.7,
    ridesCompleted: 134,
  },
]

const ecoRewards = [
  {
    id: "ER001",
    title: "Free Coffee at CCD",
    pointsCost: 200,
    category: "Food & Beverage",
    claimed: 45,
    available: 155,
    status: "active",
  },
  {
    id: "ER002",
    title: "₹50 Ride Discount",
    pointsCost: 500,
    category: "Transport",
    claimed: 89,
    available: 111,
    status: "active",
  },
  {
    id: "ER003",
    title: "Plant a Tree Donation",
    pointsCost: 1000,
    category: "Environment",
    claimed: 23,
    available: 77,
    status: "active",
  },
]

export function AdminMain() {
  const { user } = useAuth()
  const isAdmin = useMemo(() => (user as any)?.role === 'admin', [user])

  const [stats, setStats] = useState<AdminStats>({ totalRides: 0, co2SavedKg: 0, newUsers: 0, totalEcoPoints: 0 })
  const [recentRidesData, setRecentRidesData] = useState<any[]>([])
  const [rewards, setRewards] = useState<any[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [userSearch, setUserSearch] = useState("")
  const [creatingReward, setCreatingReward] = useState(false)
  const [newReward, setNewReward] = useState<{ title: string; points: number; category: string; description: string }>({ title: "", points: 100, category: "General", description: "" })
  const [editingRewardId, setEditingRewardId] = useState<string | null>(null)
  const [editReward, setEditReward] = useState<{ title: string; points: number; category: string; description: string }>({ title: "", points: 0, category: "", description: "" })
  const [rideModalOpen, setRideModalOpen] = useState(false)
  const [selectedRide, setSelectedRide] = useState<any | null>(null)
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [editUser, setEditUser] = useState<{ name: string; role: string; eco_points: number; badges: string; phone: string; home_address: string; avatar_url: string; banned: boolean; status: 'Active' | 'Suspended' | 'Banned' }>({ name: "", role: "rider", eco_points: 0, badges: "", phone: "", home_address: "", avatar_url: "", banned: false, status: 'Active' })
  const [savingUser, setSavingUser] = useState(false)
  const [selectedUserEmail, setSelectedUserEmail] = useState<string | null>(null)
  const [purging, setPurging] = useState(false)
  const [purgeConfirmOpen, setPurgeConfirmOpen] = useState(false)

  // Sparkline demo data (replace with real 7-day aggregates if desired)
  const [ridesTrend, setRidesTrend] = useState<SparkDataPoint[]>([])
  const [activeTrend, setActiveTrend] = useState<SparkDataPoint[]>([])
  const [co2Trend, setCo2Trend] = useState<SparkDataPoint[]>([])
  const [revenueTrend, setRevenueTrend] = useState<SparkDataPoint[]>([])

  const setDemoTrends = () => {
    const days = ['D1','D2','D3','D4','D5','D6','D7']
    const gen = (base: number, varPct = 0.2) => days.map((d, i) => ({ day: d, value: Math.max(0, Math.round(base * (1 + (Math.sin(i)+Math.random()-0.5)*varPct))) }))
    setRidesTrend(gen(Math.max(10, stats.totalRides || 10)))
    setActiveTrend(gen(Math.max(50, Math.floor(stats.totalEcoPoints/1000) || 50)))
    setCo2Trend(gen(Math.max(5, Math.round(stats.co2SavedKg) || 5)))
    setRevenueTrend(gen(100))
  }

  const fetchHourlyTrends = async () => {
    try {
      const now = new Date()
      const start = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const startISO = start.toISOString()

      const [ridesRes, impactRes] = await Promise.all([
        supabase.from('rides').select('created_at, price, user_id').gte('created_at', startISO),
        supabase.from('impact_logs').select('created_at, co2_saved_kg').gte('created_at', startISO),
      ])

      const initBuckets = () => Array.from({ length: 24 }, (_, i) => {
        const d = new Date(start.getTime() + i * 3600000)
        const hh = d.getHours().toString().padStart(2, '0')
        return { day: hh, value: 0, _ids: new Set<string>() as Set<string> }
      })

      const ridesBuckets = initBuckets()
      const revenueBuckets = initBuckets()
      const activeBuckets = initBuckets()
      const co2Buckets = initBuckets()

      const idxFor = (ts: string) => {
        const t = new Date(ts).getTime()
        const diff = t - start.getTime()
        const idx = Math.floor(diff / 3600000)
        return Math.min(23, Math.max(0, idx))
      }

      ;(ridesRes.data || []).forEach((r: any) => {
        const i = idxFor(r.created_at)
        ridesBuckets[i].value += 1
        revenueBuckets[i].value += Number(r.price || 0)
        if (r.user_id) activeBuckets[i]._ids.add(r.user_id)
      })

      ;(impactRes.data || []).forEach((row: any) => {
        const i = idxFor(row.created_at)
        co2Buckets[i].value += Number(row.co2_saved_kg || 0)
      })

      // finalize active unique counts
      const finalizedActive = activeBuckets.map(b => ({ day: b.day, value: (b._ids as Set<string>).size }))

      setRidesTrend(ridesBuckets.map(({ day, value }) => ({ day, value })))
      setRevenueTrend(revenueBuckets.map(({ day, value }) => ({ day, value })))
      setActiveTrend(finalizedActive)
      setCo2Trend(co2Buckets.map(({ day, value }) => ({ day, value })))
    } catch (e) {
      // fallback to demo if error
      setDemoTrends()
    }
  }
  const formatRelative = (iso?: string) => {
    if (!iso) return '—'
    const d = new Date(iso)
    const diffMs = Date.now() - d.getTime()
    const sec = Math.floor(diffMs / 1000)
    const min = Math.floor(sec / 60)
    const hrs = Math.floor(min / 60)
    const days = Math.floor(hrs / 24)
    if (sec < 60) return 'just now'
    if (min < 60) return `${min} min ago`
    if (hrs < 24) return `${hrs} hr${hrs>1?'s':''} ago`
    return `${days} day${days>1?'s':''} ago`
  }

  const fetchStats = async () => {
    try {
      const startOfDay = new Date(new Date().setHours(0,0,0,0)).toISOString()
      const [ridesToday, impact, newUsers, ecoPoints] = await Promise.all([
        supabase.from('rides').select('*', { count: 'exact', head: true }).gte('created_at', startOfDay),
        supabase.from('impact_logs').select('co2_saved_kg').gte('created_at', startOfDay),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', startOfDay),
        supabase.from('profiles').select('eco_points'),
      ])
      const co2SavedKg = (impact.data || []).reduce((sum: number, row: any) => sum + Number(row.co2_saved_kg || 0), 0)
      const totalEcoPoints = (ecoPoints.data || []).reduce((sum: number, row: any) => sum + Number(row.eco_points || 0), 0)
      setStats({ totalRides: ridesToday.count || 0, co2SavedKg, newUsers: newUsers.count || 0, totalEcoPoints })
    } catch (e) { console.error(e) }
  }

  const fetchRecentRides = async () => {
    const { data } = await supabase
      .from('rides')
      .select('id,pickup_address,dropoff_address,price,mode,created_at')
      .order('created_at', { ascending: false })
      .limit(10)
    setRecentRidesData(data || [])
  }

  const fetchRewards = async () => {
    const { data } = await supabase
      .from('rewards')
      .select('id,title,description,points,category,created_at')
      .order('created_at', { ascending: false })
      .limit(50)
    setRewards(data || [])
  }

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('community_posts')
      .select('id,user_id,user_name,content,created_at')
      .order('created_at', { ascending: false })
      .limit(10)
    setPosts(data || [])
  }

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('id,name,role,eco_points,avatar_url,home_address,badges,banned,created_at,updated_at')
      .order('created_at', { ascending: false })
      .limit(50)
    setUsers(data || [])
  }

  const addReward = async () => {
    if (!isAdmin) return alert('Admin only')
    try {
      setCreatingReward(true)
      const { error } = await supabase.from('rewards').insert({
        title: newReward.title,
        description: newReward.description,
        points: newReward.points,
        category: newReward.category,
      })
      if (error) throw error
      setNewReward({ title: "", points: 100, category: "General", description: "" })
      await fetchRewards()
      alert('Reward created')
    } catch (e) {
      console.error(e)
      alert('Failed to add reward')
    } finally {
      setCreatingReward(false)
    }
  }

  const deletePost = async (postId: string) => {
    if (!isAdmin) return alert('Admin only')
    if (!confirm('Delete this post?')) return
    const { error } = await supabase.from('community_posts').delete().eq('id', postId)
    if (error) return alert('Failed to delete post')
    setPosts(p => p.filter(x => x.id !== postId))
  }

  const startEditReward = (r: any) => {
    setEditingRewardId(r.id)
    setEditReward({ title: r.title || '', points: r.points || 0, category: r.category || '', description: r.description || '' })
  }

  const saveEditReward = async () => {
    if (!isAdmin || !editingRewardId) return
    const { error } = await supabase
      .from('rewards')
      .update({ title: editReward.title, points: editReward.points, category: editReward.category, description: editReward.description })
      .eq('id', editingRewardId)
    if (error) return alert('Failed to update reward')
    setEditingRewardId(null)
    await fetchRewards()
  }

  const deleteReward = async (id: string) => {
    if (!isAdmin) return alert('Admin only')
    if (!confirm('Delete this reward?')) return
    const { error } = await supabase.from('rewards').delete().eq('id', id)
    if (error) return alert('Failed to delete reward')
    setRewards(r => r.filter(x => x.id !== id))
  }

  const toggleBanUser = async (id: string, banned: boolean) => {
    if (!isAdmin) return alert('Admin only')
    const { error } = await supabase.from('profiles').update({ banned: !banned }).eq('id', id)
    if (error) return alert('Failed to update user')
    setUsers(u => u.map(x => x.id === id ? { ...x, banned: !banned } : x))
  }

  const openUserModal = (u: any) => {
    setSelectedUser(u)
    const hasSuspended = Array.isArray(u.badges) && (u.badges as string[]).includes('suspended')
    setEditUser({
      name: u.name || '',
      role: u.role || 'rider',
      eco_points: Number(u.eco_points || 0),
      badges: Array.isArray(u.badges) ? (u.badges as string[]).join(', ') : (u.badges || ''),
      phone: u.phone || '',
      home_address: u.home_address || '',
      avatar_url: u.avatar_url || '',
      banned: !!u.banned,
      status: u.banned ? (hasSuspended ? 'Suspended' : 'Banned') : 'Active',
    })
    setUserModalOpen(true)
    // fetch email via admin route
    ;(async () => {
      try {
        const res = await fetch(`/api/admin/user/${u.id}`)
        if (res.ok) {
          const json = await res.json()
          setSelectedUserEmail(json.email || null)
        } else {
          setSelectedUserEmail(null)
        }
      } catch {
        setSelectedUserEmail(null)
      }
    })()
  }

  const saveUserEdits = async () => {
    if (!isAdmin || !selectedUser?.id) return
    try {
      setSavingUser(true)
      // derive badges array and status mapping
      const badgesArr = editUser.badges.split(',').map(s => s.trim()).filter(Boolean)
      const withoutSusp = badgesArr.filter(b => b.toLowerCase() !== 'suspended')
      const appliedBadges = editUser.status === 'Suspended' ? Array.from(new Set([...withoutSusp, 'suspended'])) : withoutSusp
      const bannedFlag = editUser.status === 'Banned' || editUser.status === 'Suspended'
      const payload: any = {
        name: editUser.name.trim(),
        role: editUser.role,
        eco_points: Number(editUser.eco_points || 0),
        badges: appliedBadges,
        phone: editUser.phone || null,
        home_address: editUser.home_address || null,
        avatar_url: editUser.avatar_url || null,
        banned: bannedFlag,
      }
      const { error } = await supabase.from('profiles').update(payload).eq('id', selectedUser.id)
      if (error) throw error
      // reflect changes locally
      setUsers(us => us.map(u => u.id === selectedUser.id ? { ...u, ...payload } : u))
      setUserModalOpen(false)
    } catch (e) {
      console.error('Failed to save user edits', e)
      alert('Failed to save user. Check permissions and try again.')
    } finally {
      setSavingUser(false)
    }
  }

  const deleteUserAccount = async () => {
    if (!isAdmin || !selectedUser?.id) return
    if (!confirm('Delete this account and all related data? This cannot be undone.')) return
    try {
      setSavingUser(true)
      const res = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: selectedUser.id })
      })
      if (!res.ok) throw new Error(await res.text())
      setUsers(us => us.filter(u => u.id !== selectedUser.id))
      setUserModalOpen(false)
    } catch (e) {
      console.error('Failed to delete user account', e)
      alert('Failed to delete user account. Ensure server key is configured.')
    } finally {
      setSavingUser(false)
    }
  }

  const purgeAllData = async () => {
    if (!isAdmin || !user?.id) return
    
    try {
      setPurging(true)
      setPurgeConfirmOpen(false)
      
      // Get current session for admin verification
      const { data: sessionData } = await supabase.auth.getSession()
      const accessToken = sessionData.session?.access_token
      if (!accessToken) {
        throw new Error('No access token available')
      }
      
      // Call purge API endpoint
      const response = await fetch('/api/admin/purge-all', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          adminId: user.id,
          adminEmail: user.email
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || 'Purge operation failed')
      }
      
      // Clear local state
      setUsers([])
      setPosts([])
      setRewards([])
      setRecentRidesData([])
      setStats({ totalRides: 0, co2SavedKg: 0, newUsers: 0, totalEcoPoints: 0 })
      
      alert('All data has been purged successfully. Only your admin account remains.')
      
    } catch (error) {
      console.error('Purge failed:', error)
      alert(`Purge failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setPurging(false)
    }
  }

  useEffect(() => {
    (async () => {
      await Promise.all([fetchStats(), fetchRecentRides(), fetchRewards(), fetchPosts(), fetchUsers()])
      await fetchHourlyTrends()
    })()
  }, [])

  useEffect(() => {
    fetchHourlyTrends()
  }, [stats])

  const percentChange = (series: SparkDataPoint[]) => {
    if (!series || series.length < 2) return { pct: 0, color: 'text-muted-foreground', sign: '' }
    const a = series[series.length-2].value || 0
    const b = series[series.length-1].value || 0
    const pct = a === 0 ? 0 : Math.round(((b - a) / a) * 100)
    return { pct, color: pct >= 0 ? 'text-green-600' : 'text-red-600', sign: pct >= 0 ? '+' : '' }
  }
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Platform operations and partner management</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Rides Today */}
          <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rides Today</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalRides}</p>
                </div>
                <Car className="w-8 h-8 text-blue-500" />
              </div>
              <div className={`mt-2 flex items-center text-xs ${(() => { const {pct,color,sign}=percentChange(ridesTrend); return color })()}`}>
                {(() => { const {pct,color,sign}=percentChange(ridesTrend); return (<><TrendingUp className="w-3 h-3 mr-1" />{sign}{pct}% from yesterday</>) })()}
              </div>
              <div className="h-16 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={ridesTrend} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="ridesColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} cursor={false} />
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="url(#ridesColor)" strokeWidth={2} isAnimationActive />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Active Drivers (using EcoPoints as proxy) */}
          <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Drivers</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalEcoPoints.toLocaleString()}</p>
                </div>
                <Users className="w-8 h-8 text-teal-500" />
              </div>
              <div className={`mt-2 flex items-center text-xs ${(() => { const {pct,color}=percentChange(activeTrend); return color })()}`}>
                {(() => { const {pct,sign}=percentChange(activeTrend); return (<><TrendingUp className="w-3 h-3 mr-1" />{sign}{pct}% from yesterday</>) })()}
              </div>
              <div className="h-16 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activeTrend} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="activeColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} cursor={false} />
                    <Area type="monotone" dataKey="value" stroke="#14b8a6" fill="url(#activeColor)" strokeWidth={2} isAnimationActive />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* CO2 Saved */}
          <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">CO₂ Saved Today</p>
                  <p className="text-2xl font-bold text-green-600">{(Math.round(stats.co2SavedKg * 10) / 10)} kg</p>
                </div>
                <Leaf className="w-8 h-8 text-green-600" />
              </div>
              <div className={`mt-2 flex items-center text-xs ${(() => { const {pct,color}=percentChange(co2Trend); return color })()}`}>
                {(() => { const {pct,sign}=percentChange(co2Trend); return (<><TrendingUp className="w-3 h-3 mr-1" />{sign}{pct}% from yesterday</>) })()}
              </div>
              <div className="h-16 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={co2Trend} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="co2Color" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16a34a" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} cursor={false} />
                    <Area type="monotone" dataKey="value" stroke="#16a34a" fill="url(#co2Color)" strokeWidth={2} isAnimationActive />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Today (placeholder uses newUsers for demo) */}
          <Card className="rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenue Today</p>
                  <p className="text-2xl font-bold text-foreground">{stats.newUsers}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-orange-500" />
              </div>
              <div className={`mt-2 flex items-center text-xs ${(() => { const {pct,color}=percentChange(revenueTrend); return color })()}`}>
                {(() => { const {pct,sign}=percentChange(revenueTrend); return (<><TrendingUp className="w-3 h-3 mr-1" />{sign}{pct}% from yesterday</>) })()}
              </div>
              <div className="h-16 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrend} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revColor" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.35}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} cursor={false} />
                    <Area type="monotone" dataKey="value" stroke="#f97316" fill="url(#revColor)" strokeWidth={2} isAnimationActive />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            

            {/* Recent Rides */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Recent Rides
                  </span>
                  <Button variant="outline" size="sm" onClick={fetchRecentRides}>
                    Refresh
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentRidesData.map((ride, index) => (
                    <div key={ride.id}>
                      <div
                        className="flex items-center justify-between cursor-pointer rounded-md p-2 transition-all duration-200 hover:bg-muted/40 hover:shadow-sm hover:ring-1 hover:ring-primary/10 hover:-translate-y-0.5"
                        onClick={() => { setSelectedRide(ride); setRideModalOpen(true) }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="font-medium text-sm overflow-hidden">
                              <span className="truncate inline-block align-bottom max-w-[120px] sm:max-w-[160px]">
                                {ride.pickup_address || 'Pickup'}
                              </span>
                              <span> → </span>
                              <span className="truncate inline-block align-bottom max-w-[120px] sm:max-w-[160px]">
                                {ride.dropoff_address || 'Dropoff'}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">{new Date(ride.created_at || '').toLocaleString()}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {ride.mode || 'mode'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{ride.price ? `₹${ride.price}` : ''}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-sm">{ride.price ? `₹${ride.price}` : ''}</div>
                        </div>
                      </div>
                      {index < recentRides.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Ride details modal */}
            <Dialog open={rideModalOpen} onOpenChange={setRideModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ride Details</DialogTitle>
                </DialogHeader>
                {selectedRide && (
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-muted-foreground">Pickup</div>
                      <div className="col-span-2">{selectedRide.pickup_address || '-'}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-muted-foreground">Dropoff</div>
                      <div className="col-span-2">{selectedRide.dropoff_address || '-'}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-muted-foreground">Mode</div>
                      <div className="col-span-2">{selectedRide.mode || '-'}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-muted-foreground">Price</div>
                      <div className="col-span-2">{selectedRide.price ? `₹${selectedRide.price}` : '-'}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-muted-foreground">When</div>
                      <div className="col-span-2">{selectedRide.created_at ? new Date(selectedRide.created_at).toLocaleString() : '-'}</div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Post Moderation (Admin) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-primary" />
                  Recent Community Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {posts.map((p) => (
                    <div key={p.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{p.user_name}</h4>
                          <p className="text-sm text-muted-foreground">{new Date(p.created_at).toLocaleString()}</p>
                        </div>
                        {isAdmin && (
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent" onClick={() => deletePost(p.id)}>
                            Delete
                          </Button>
                        )}
                      </div>
                      <div className="text-sm">{p.content}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* User Management (restored to sidebar) */}
            <Card>
              <CardHeader>
                <CardTitle className="w-full">
                  <div className="w-full flex flex-col gap-2">
                    <div className="w-full flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 min-w-0">
                        <Users className="w-5 h-5 text-primary" />
                        Users
                      </span>
                      <div className="w-full md:w-2/3 flex items-center gap-2 min-w-0">
                        <div className="flex-1 min-w-0">
                          <Input
                            placeholder="Search users..."
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            className="w-full"
                          />
                        </div>
                        <Button variant="ghost" size="icon" onClick={fetchUsers} className="shrink-0 rounded-md shadow-sm">
                          <RefreshCcw className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {(users.filter(u => {
                    const q = userSearch.trim().toLowerCase()
                    if (!q) return true
                    return (
                      (u.name || '').toLowerCase().includes(q) ||
                      (u.role || '').toLowerCase().includes(q) ||
                      (u.home_address || '').toLowerCase().includes(q)
                    )
                  })).map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between cursor-pointer rounded-md p-1.5 transition-all duration-200 hover:bg-muted/40 hover:shadow-sm hover:ring-1 hover:ring-primary/10 hover:-translate-y-0.5"
                      onClick={() => openUserModal(u)}
                    >
                      <div>
                        <div className="font-medium text-sm">{u.name || 'User'}</div>
                        <div className={`text-xs ${u.banned ? 'text-red-600' : 'text-muted-foreground'}`}>{u.role}{u.banned ? ' • BANNED' : ''}</div>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); toggleBanUser(u.id, !!u.banned) }}>
                            {u.banned ? 'Unban' : 'Ban'}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Active Drivers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Active Drivers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activeDrivers.map((driver) => (
                    <div key={driver.id} className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">
                          {driver.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{driver.name}</div>
                        <div className="text-xs text-muted-foreground">{driver.vehicle}</div>
                        <div className="text-xs text-muted-foreground">{driver.location}</div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={driver.status === "available" ? "default" : "secondary"}
                          className={`text-xs ${
                            driver.status === "available"
                              ? "bg-green-100 text-green-800"
                              : "bg-orange-100 text-orange-800"
                          }`}
                        >
                          {driver.status}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">{driver.ridesCompleted} rides</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* EcoRewards Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-primary" />
                    EcoRewards
                  </span>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addReward}
                      disabled={creatingReward || !newReward.title.trim() || !newReward.points || newReward.points <= 0}
                    >
                      {creatingReward ? 'Creating...' : 'Add New'}
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="multiple" className="w-full">
                  {isAdmin && (
                    <AccordionItem value="create">
                      <AccordionTrigger>Create New Reward</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                          <Input placeholder="Title" value={newReward.title} onChange={(e) => setNewReward(r => ({ ...r, title: e.target.value }))} />
                          <Input type="number" placeholder="Points" value={newReward.points} onChange={(e) => setNewReward(r => ({ ...r, points: Number(e.target.value || 0) }))} />
                          <Input placeholder="Category" value={newReward.category} onChange={(e) => setNewReward(r => ({ ...r, category: e.target.value }))} />
                          <Input placeholder="Description" value={newReward.description} onChange={(e) => setNewReward(r => ({ ...r, description: e.target.value }))} />
                        </div>
                        <div className="text-xs text-muted-foreground mb-3">Fill details, then click "Add New" in the header to save.</div>
                      </AccordionContent>
                    </AccordionItem>
                  )}

                  <AccordionItem value="list">
                    <AccordionTrigger>
                      Rewards ({rewards.length})
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-1 gap-3">
                        {rewards.map((reward) => {
                          const isEditing = editingRewardId === reward.id
                          return (
                            <div key={reward.id} className="border border-border rounded-lg p-3 hover:shadow-sm transition-all bg-card/50">
                              <div className="flex items-start justify-between mb-2 gap-2">
                                <div className="flex-1">
                                  {isEditing ? (
                                    <Input value={editReward.title} onChange={(e) => setEditReward(r => ({ ...r, title: e.target.value }))} />
                                  ) : (
                                    <h4 className="font-medium text-sm line-clamp-1">{reward.title}</h4>
                                  )}
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {isEditing ? (
                                      <Input value={editReward.category} onChange={(e) => setEditReward(r => ({ ...r, category: e.target.value }))} />
                                    ) : reward.category}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {isEditing ? (
                                      <Input value={editReward.description} onChange={(e) => setEditReward(r => ({ ...r, description: e.target.value }))} />
                                    ) : reward.description}
                                  </div>
                                </div>
                                <Badge variant="secondary" className="text-xs whitespace-nowrap self-start">
                                  {isEditing ? (
                                    <Input type="number" value={editReward.points} onChange={(e) => setEditReward(r => ({ ...r, points: Number(e.target.value || 0) }))} />
                                  ) : (
                                    `${reward.points} pts`
                                  )}
                                </Badge>
                              </div>
                              {isAdmin && (
                                <div className="flex gap-2 mt-2">
                                  {!isEditing ? (
                                    <>
                                      <Button size="sm" variant="outline" onClick={() => startEditReward(reward)}>Edit</Button>
                                      <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent" onClick={() => deleteReward(reward.id)}>Delete</Button>
                                    </>
                                  ) : (
                                    <>
                                      <Button size="sm" variant="outline" onClick={saveEditReward}>Save</Button>
                                      <Button size="sm" variant="outline" onClick={() => setEditingRewardId(null)}>Cancel</Button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <AlertDialog open={purgeConfirmOpen} onOpenChange={setPurgeConfirmOpen}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="w-full justify-start bg-red-600 hover:bg-red-700 text-white border-red-600">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Purge All Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-5 h-5" />
                        Nuclear Option
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-left">
                        This will permanently delete:
                        <br />• All user accounts and profiles
                        <br />• All rides, posts, and community data
                        <br />• All avatar images (except admin's)
                        <br />• All community post images
                        <br />• All rewards and impact logs
                        <br />• Everything except your admin account
                        <br /><br />
                        <strong>This action cannot be undone.</strong>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={purgeAllData}
                        disabled={purging}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {purging ? 'Purging...' : 'Yes, Purge Everything'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                  <Calendar className="w-4 h-4 mr-2" />
                  Generate Reports
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                  <Settings className="w-4 h-4 mr-2" />
                  Platform Settings
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                  <Users className="w-4 h-4 mr-2" />
                  User Management
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {/* User details modal */}
      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-lg md:max-w-2xl rounded-2xl shadow-xl p-0 overflow-hidden max-h-[90vh] sm:max-h-[90vh] flex flex-col">
          <div className="p-5 border-b sticky top-0 bg-background z-10">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">User Details</DialogTitle>
            </DialogHeader>
            {selectedUser && (
              <div className="mt-1 text-xs text-muted-foreground">
                Last online: {formatRelative(selectedUser.updated_at || selectedUser.created_at)}
                <span className="ml-1">{(selectedUser.updated_at || selectedUser.created_at) ? `(${new Date(selectedUser.updated_at || selectedUser.created_at).toLocaleString()})` : ''}</span>
              </div>
            )}
          </div>
          {selectedUser && (
            <div className="p-5 space-y-5 flex-1 overflow-y-auto">
              {/* Profile Info */}
              <div className="rounded-lg border p-4 bg-card/50">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Profile Info</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Name</label>
                    <Input className="rounded-md focus-visible:ring-1" value={editUser.name} onChange={(e) => setEditUser(s => ({ ...s, name: e.target.value }))} disabled={!isAdmin} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Role</label>
                    <Input className="rounded-md focus-visible:ring-1" value={editUser.role} onChange={(e) => setEditUser(s => ({ ...s, role: e.target.value }))} disabled={!isAdmin} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">Avatar URL</label>
                    <Input className="rounded-md focus-visible:ring-1" value={editUser.avatar_url} onChange={(e) => setEditUser(s => ({ ...s, avatar_url: e.target.value }))} disabled={!isAdmin} />
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="rounded-lg border p-4 bg-card/50">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Contact Info</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Phone</label>
                    <Input className="rounded-md focus-visible:ring-1" value={editUser.phone} onChange={(e) => setEditUser(s => ({ ...s, phone: e.target.value }))} disabled={!isAdmin} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Email (read-only)</label>
                    <Input className="rounded-md" value={selectedUserEmail || 'Unavailable'} disabled />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs text-muted-foreground mb-1 block">Home Address</label>
                    <Input className="rounded-md focus-visible:ring-1" value={editUser.home_address} onChange={(e) => setEditUser(s => ({ ...s, home_address: e.target.value }))} disabled={!isAdmin} />
                  </div>
                </div>
              </div>

              {/* Account Info */}
              <div className="rounded-lg border p-4 bg-card/50">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Account Info</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Eco Points</label>
                    <Input className="rounded-md focus-visible:ring-1" type="number" value={editUser.eco_points} onChange={(e) => setEditUser(s => ({ ...s, eco_points: Number(e.target.value || 0) }))} disabled={!isAdmin} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Badges (comma-separated)</label>
                    <Input className="rounded-md focus-visible:ring-1" value={editUser.badges} onChange={(e) => setEditUser(s => ({ ...s, badges: e.target.value }))} disabled={!isAdmin} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Status</label>
                    <Select disabled={!isAdmin} value={editUser.status} onValueChange={(v: any) => setEditUser(s => ({ ...s, status: v }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Active">
                          <span className="text-green-600">Active</span>
                        </SelectItem>
                        <SelectItem value="Suspended">
                          <span className="text-orange-600">Suspended</span>
                        </SelectItem>
                        <SelectItem value="Banned">
                          <span className="text-red-600">Banned</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Password</label>
                    <div className="flex items-center gap-2">
                      <Input className="rounded-md" type="password" placeholder="••••••••" disabled />
                      {isAdmin && selectedUserEmail && (
                        <Button variant="outline" size="sm" onClick={async () => {
                          try {
                            const { data, error } = await supabase.auth.resetPasswordForEmail(selectedUserEmail!, { redirectTo: window.location.origin + '/login' })
                            if (error) throw error
                            alert('Password reset email sent')
                          } catch (e) {
                            alert('Failed to send reset email')
                          }
                        }}>Send reset email</Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="sticky bottom-0 w-full bg-background border-t p-4 flex items-center justify-between z-10">
            {isAdmin ? (
              <Button variant="destructive" onClick={deleteUserAccount} disabled={savingUser} className="rounded-md">
                {savingUser ? 'Deleting...' : 'Delete Account'}
              </Button>
            ) : <div />}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setUserModalOpen(false)} className="rounded-md">Close</Button>
              {isAdmin && (
                <Button onClick={saveUserEdits} disabled={savingUser || !editUser.name.trim()} className="bg-green-600 hover:bg-green-700 text-white rounded-md">
                  {savingUser ? 'Saving...' : 'Save Changes'}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
