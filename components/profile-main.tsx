"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  User, Mail, Phone, MapPin, Settings, Shield, Bell, LogOut, Activity, 
  Car, Bike, Users, Upload, Trash2, Calendar, Leaf, Trophy, Zap, 
  TrendingUp, Heart, Star, Edit3, Camera, HelpCircle
} from "lucide-react"
import { useAuth } from "@/components/AuthProvider"
import { supabase } from "@/lib/supabase"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

export function ProfileMain() {
  const router = useRouter()
  const { user, logout, refreshUserData } = useAuth()
  
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [origFirstName, setOrigFirstName] = useState("")
  const [origLastName, setOrigLastName] = useState("")
  const [origPhone, setOrigPhone] = useState("")
  const [homeAddress, setHomeAddress] = useState("")
  const [origHomeAddress, setOrigHomeAddress] = useState("")
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveOk, setSaveOk] = useState(false)

  // Dynamic states
  const [preferences, setPreferences] = useState({
    preferred_transport: 'ev-shuttle',
    ride_reminders: true,
    ecopoints_updates: true,
    weekly_impact_report: true,
    community_challenges: false,
    marketing_communications: false
  })
  const [healthData, setHealthData] = useState({
    calories_walking: 0,
    calories_biking: 0,
    monthly_goal: 2500,
    goal_progress: 0
  })
  const [accountStats, setAccountStats] = useState({
    member_since: '',
    current_level: 'Eco Warrior',
    total_rides: 0,
    total_co2_saved: 0,
    total_points_earned: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      if (!user) {
        setLoading(false)
        return
      }
      
      setLoading(true)
      try {
        // Load basic profile data
        const nameParts = (user.name || "").split(" ")
        setFirstName(nameParts[0] || "")
        setLastName(nameParts.slice(1).join(" ") || "")
        setEmail(user.email || "")
        
        const { data, error: profileError } = await supabase
          .from("profiles")
          .select("phone,avatar_url,home_address,created_at,eco_points")
          .eq("id", user.id)
          .maybeSingle()
        if (profileError) {
          console.error('Profile fetch error:', profileError)
        }
        const initialPhone = (data as any)?.phone || ""
        const initialHome = (data as any)?.home_address || ""
        setPhone(initialPhone)
        setAvatarUrl((data as any)?.avatar_url || null)
        setHomeAddress(initialHome)
        setOrigFirstName(nameParts[0] || "")
        setOrigLastName(nameParts.slice(1).join(" ") || "")
        setOrigPhone(initialPhone)
        setOrigHomeAddress(initialHome)

        // Load user preferences
        await loadUserPreferences()
        
        // Load health data
        await loadHealthData()
        
        // Load account statistics
        await loadAccountStats()

        // Auto-set home address once on first login if empty
        try {
          if (!initialHome && typeof window !== 'undefined' && !sessionStorage.getItem('homeAddressSet')) {
            if ('geolocation' in navigator) {
              navigator.geolocation.getCurrentPosition(async (pos) => {
                try {
                  const lat = pos.coords.latitude
                  const lon = pos.coords.longitude
                  const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`, {
                    headers: { 'accept': 'application/json' }
                  })
                  const j = await resp.json().catch(() => null as any)
                  const addr: string = j?.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`
                  setHomeAddress(addr)
                  setOrigHomeAddress(addr)
                  sessionStorage.setItem('homeAddressSet', '1')
                  await supabase.from('profiles').upsert({ id: user.id, home_address: addr })
                  await refreshUserData()
                } catch {
                  // ignore failures
                }
              }, () => {}, { enableHighAccuracy: true, maximumAge: 60000, timeout: 10000 })
            }
          }
        } catch {}
      } catch (error) {
        console.error('Error loading profile data:', error)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [user])

  const loadUserPreferences = async () => {
    if (!user?.id) return
    
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error loading preferences:', error)
        return
      }
      
      if (data) {
        setPreferences({
          preferred_transport: data.preferred_transport || 'ev-shuttle',
          ride_reminders: data.ride_reminders ?? true,
          ecopoints_updates: data.ecopoints_updates ?? true,
          weekly_impact_report: data.weekly_impact_report ?? true,
          community_challenges: data.community_challenges ?? false,
          marketing_communications: data.marketing_communications ?? false
        })
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    }
  }

  const loadHealthData = async () => {
    if (!user?.id) return
    
    try {
      // Calculate calories from rides (walking = 100 cal/km, biking = 50 cal/km)
      const { data: rides } = await supabase
        .from('rides')
        .select('distance_km, mode, created_at')
        .eq('user_id', user.id)
        .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      
      if (rides) {
        let walkingCalories = 0
        let bikingCalories = 0
        
        rides.forEach(ride => {
          const distance = Number(ride.distance_km || 0)
          if (ride.mode === 'WALK') {
            walkingCalories += distance * 100
          } else if (ride.mode === 'BIKE' || ride.mode === 'E_BIKE') {
            bikingCalories += distance * 50
          }
        })
        
        const totalCalories = walkingCalories + bikingCalories
        const goal = 2500
        const progress = Math.min((totalCalories / goal) * 100, 100)
        
        setHealthData({
          calories_walking: Math.round(walkingCalories),
          calories_biking: Math.round(bikingCalories),
          monthly_goal: goal,
          goal_progress: Math.round(progress)
        })
      }
    } catch (error) {
      console.error('Error loading health data:', error)
    }
  }

  const loadAccountStats = async () => {
    if (!user?.id) return
    
    try {
      // Get total rides
      const { count: totalRides } = await supabase
        .from('rides')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
      
      // Get total CO2 saved
      const { data: impactLogs } = await supabase
        .from('impact_logs')
        .select('co2_saved_kg')
        .eq('user_id', user.id)
      
      const totalCO2 = (impactLogs || []).reduce((sum, log) => sum + Number(log.co2_saved_kg || 0), 0)
      
      // Get total points earned
      const { data: profile } = await supabase
        .from('profiles')
        .select('eco_points, created_at')
        .eq('id', user.id)
        .maybeSingle()
      
      const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown'
      const totalPoints = profile?.eco_points || 0
      
      // Calculate level based on points
      let level = 'Eco Warrior'
      if (totalPoints >= 10000) level = 'Eco Master'
      else if (totalPoints >= 5000) level = 'Eco Champion'
      else if (totalPoints >= 1000) level = 'Eco Warrior'
      else if (totalPoints >= 100) level = 'Eco Explorer'
      else level = 'Eco Beginner'
      
      setAccountStats({
        member_since: memberSince,
        current_level: level,
        total_rides: totalRides || 0,
        total_co2_saved: Math.round(totalCO2 * 10) / 10,
        total_points_earned: totalPoints
      })
    } catch (error) {
      console.error('Error loading account stats:', error)
    }
  }

  const saveUserPreferences = async () => {
    if (!user?.id) return
    
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          preferred_transport: preferences.preferred_transport,
          ride_reminders: preferences.ride_reminders,
          ecopoints_updates: preferences.ecopoints_updates,
          weekly_impact_report: preferences.weekly_impact_report,
          community_challenges: preferences.community_challenges,
          marketing_communications: preferences.marketing_communications
        })
      
      if (error) {
        console.error('Error saving preferences:', error)
      }
    } catch (error) {
      console.error('Error saving preferences:', error)
    }
  }

  const handlePreferenceChange = (key: string, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
    // Auto-save preferences
    setTimeout(() => saveUserPreferences(), 500)
  }

  const onSave = async () => {
    if (!user) return
    setSaving(true)
    setSaveError(null)
    setSaveOk(false)
    try {
      const fullName = [firstName, lastName].filter(Boolean).join(" ")
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, name: fullName, phone, avatar_url: avatarUrl, home_address: homeAddress })
      if (error) throw new Error(error.message)
      
      // Save preferences
      await saveUserPreferences()
      
      // Refresh in background (don't block UI)
      refreshUserData().catch(() => {})
      // reset originals after successful save
      setOrigFirstName(firstName)
      setOrigLastName(lastName)
      setOrigPhone(phone)
      setOrigHomeAddress(homeAddress)
      setSaveOk(true)
    } catch (e: any) {
      setSaveError(e?.message || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const isDirty = (firstName !== origFirstName) || (lastName !== origLastName) || (phone !== origPhone) || (homeAddress !== origHomeAddress)

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const goSupport = () => router.push("/dashboard/support")

  if (loading) {
    return (
      <div className="flex-1 p-6 overflow-auto bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="p-6 pb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">Profile & Settings</h1>
        <p className="text-lg text-muted-foreground">Manage your account and customize your experience</p>
      </div>

      <div className="px-6 pb-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card & Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card className="border-0 shadow-md rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6">
                <div className="flex flex-col items-center text-center">
                  {/* Avatar Section */}
                  <div className="relative group mb-4">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-white shadow-lg ring-4 ring-white">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" onError={(e)=>{(e.currentTarget as HTMLImageElement).src='/placeholder-user.jpg'}} />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                          <User className="w-12 h-12 text-white" />
                        </div>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file || !user) return
                      
                      if (file.size > 50 * 1024 * 1024) {
                        alert('File too large. Please use an image under 50MB.')
                        return
                      }
                      
                      setUploading(true)
                      const localUrl = URL.createObjectURL(file)
                      setAvatarUrl(localUrl)
                      
                      try {
                        const ext = file.name.split('.').pop()
                        const path = `avatars/${user.id}-${Date.now()}.${ext}`
                        
                        const { data: upload, error } = await supabase.storage
                          .from('avatars')
                          .upload(path, file, { 
                            upsert: true,
                            cacheControl: '3600'
                          })
                        
                        if (error) {
                          alert(`Upload failed: ${error.message}`)
                          throw error
                        }
                        
                        const { data: urlData } = await supabase.storage.from('avatars').getPublicUrl(upload.path)
                        const publicUrl = urlData.publicUrl
                        setAvatarUrl(publicUrl)
                        
                        try {
                          const { error: upsertError } = await supabase.from('profiles').upsert({ id: user.id, avatar_url: publicUrl })
                          if (upsertError) {
                            console.error('Upsert profile avatar error:', upsertError)
                          }
                          await refreshUserData()
                        } catch (err) {
                          console.error('Profile update error:', err)
                        }
                         
                      } catch (err) {
                        console.error('Upload failed:', err)
                      } finally {
                        setUploading(false)
                        if (fileInputRef.current) fileInputRef.current.value = ''
                        try { URL.revokeObjectURL(localUrl) } catch {}
                      }
                    }} />
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="absolute -bottom-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      <Camera className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  {/* User Info */}
                  <h2 className="text-2xl font-bold text-foreground mb-1">
                    {[firstName, lastName].filter(Boolean).join(" ") || "User"}
                  </h2>
                  <p className="text-muted-foreground mb-3">{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ""}</p>
                  
                  {/* Badges */}
                  <div className="flex gap-2 mb-4">
                    <Badge className="bg-green-100 text-green-700 border-green-200 px-3 py-1">
                      <Shield className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 px-3 py-1">
                      <Leaf className="w-3 h-3 mr-1" />
                      {accountStats.current_level}
                    </Badge>
                  </div>
                  
                  {/* Membership Info */}
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Member since {accountStats.member_since}
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      {accountStats.total_points_earned.toLocaleString()} EcoPoints
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Ride Stats Card */}
            <Card className="border-0 shadow-md rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Ride Statistics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-primary/5 rounded-xl">
                    <Car className="w-6 h-6 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold text-primary">{accountStats.total_rides}</div>
                    <div className="text-xs text-muted-foreground">Total Rides</div>
                  </div>
                  <div className="text-center p-3 bg-green-500/5 rounded-xl">
                    <Leaf className="w-6 h-6 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">{accountStats.total_co2_saved}</div>
                    <div className="text-xs text-muted-foreground">CO₂ Saved (kg)</div>
                  </div>
                </div>
                
                {/* CO₂ Progress Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">CO₂ Reduction Goal</span>
                    <span className="font-medium">{Math.round((accountStats.total_co2_saved / 100) * 100)}%</span>
                  </div>
                  <Progress value={Math.min((accountStats.total_co2_saved / 100) * 100, 100)} className="h-2" />
                  <p className="text-xs text-muted-foreground text-center">
                    {100 - accountStats.total_co2_saved} kg to next milestone
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-md rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start gap-3 h-11 bg-white hover:bg-primary/5 hover:border-primary/30" onClick={goSupport}>
                  <Bell className="w-4 h-4" />
                  Support Center
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3 h-11 bg-white hover:bg-primary/5 hover:border-primary/30">
                  <Shield className="w-4 h-4" />
                  Privacy Settings
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3 h-11 bg-white hover:bg-primary/5 hover:border-primary/30">
                  <Settings className="w-4 h-4" />
                  Account Settings
                </Button>
                <Separator />
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-11 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                  onClick={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>

            {/* Account Management */}
            <Card className="border-0 shadow-md rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="w-5 h-5 text-primary" />
                  Account Management
                </CardTitle>
                <CardDescription>Manage your account settings and data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start gap-3 h-11 bg-white hover:bg-primary/5 hover:border-primary/30" onClick={goSupport}>
                  <HelpCircle className="w-4 h-4" />
                  Help Center
                </Button>
                <Button variant="outline" className="w-full justify-start gap-3 h-11 bg-white hover:bg-primary/5 hover:border-primary/30" onClick={goSupport}>
                  <Mail className="w-4 h-4" />
                  Contact Support
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full justify-start gap-3 h-11 bg-white hover:bg-red-50 hover:border-red-200 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={async () => {
                        try {
                          if (!user?.id) {
                            alert('User ID not found')
                            return
                          }
                          
                          let avatarPath: string | null = null
                          if (user.avatarUrl && user.avatarUrl.includes('/storage/v1/object/public/avatars/')) {
                            avatarPath = user.avatarUrl.split('/storage/v1/object/public/avatars/')[1] || null
                          }
                          
                          const { data } = await supabase.auth.getSession()
                          const accessToken = data.session?.access_token || ''
                          if (!accessToken) {
                            alert('Missing access token')
                            return
                          }
                          
                          const resp = await fetch('/api/delete-account', {
                            method: 'POST',
                            headers: { 'content-type': 'application/json' },
                            body: JSON.stringify({ userId: user.id, accessToken, avatarPath })
                          })
                          const result = await resp.json().catch(() => ({}))
                          
                          if (!resp.ok || !result?.ok) {
                            const errorMessage = result?.error || result?.details || 'Unknown error'
                            alert(`Failed to delete account: ${errorMessage}`)
                            return
                          }
                          
                          try {
                            await supabase.auth.signOut({ scope: 'global' })
                          } catch (e) {
                            console.log('Sign out error:', e)
                          }
                          
                          localStorage.clear()
                          sessionStorage.clear()
                          
                          try {
                            document.cookie.split(";").forEach(function(c) { 
                              document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                            });
                          } catch (e) {
                            console.log('Cookie clearing error:', e)
                          }
                          
                          window.location.href = '/'
                        } catch (e) {
                          console.error('Error deleting account:', e)
                          alert('Failed to delete account. Please try again.')
                        }
                      }}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Editable Sections */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card className="border-0 shadow-md rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <User className="w-6 h-6 text-primary" />
                  Personal Information
                </CardTitle>
                <CardDescription>Update your personal details and contact information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium">First Name</Label>
                    <Input 
                      id="firstName" 
                      value={firstName} 
                      onChange={(e) => setFirstName(e.target.value)}
                      className="h-11 border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium">Last Name</Label>
                    <Input 
                      id="lastName" 
                      value={lastName} 
                      onChange={(e) => setLastName(e.target.value)}
                      className="h-11 border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      value={email} 
                      className="pl-10 h-11 border-gray-200 bg-gray-50" 
                      readOnly 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="phone" 
                      type="tel" 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)}
                      className="pl-10 h-11 border-gray-200 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium">Home Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="address" 
                      placeholder="Enter your home address" 
                      className="pl-10 h-11 border-gray-200 focus:border-primary focus:ring-primary/20"
                      value={homeAddress} 
                      onChange={(e)=>setHomeAddress(e.target.value)} 
                    />
                  </div>
                </div>

                {isDirty && (
                  <div className="pt-4 border-t border-gray-100">
                    <Button className="w-full h-11 bg-primary hover:bg-primary/90" onClick={onSave} disabled={saving}>
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                    <div className="text-sm mt-2 min-h-[1rem] text-center">
                      {saveError && <span className="text-red-600">{saveError}</span>}
                      {saveOk && !saveError && <span className="text-green-600">✓ Changes saved successfully</span>}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Preferences & Settings */}
            <Card className="border-0 shadow-md rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Settings className="w-6 h-6 text-primary" />
                  Preferences & Settings
                </CardTitle>
                <CardDescription>Customize your EcoRide experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Preferred Transport Type</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Choose your default sustainable transport preference
                    </p>
                    <Select value={preferences.preferred_transport} onValueChange={(value) => handlePreferenceChange('preferred_transport', value)}>
                      <SelectTrigger className="h-11 border-gray-200 focus:border-primary focus:ring-primary/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ev-shuttle">
                          <div className="flex items-center gap-2">
                            <Car className="w-4 h-4" />
                            EV Shuttle
                          </div>
                        </SelectItem>
                        <SelectItem value="e-bike">
                          <div className="flex items-center gap-2">
                            <Bike className="w-4 h-4" />
                            E-Bike
                          </div>
                        </SelectItem>
                        <SelectItem value="ride-share">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Ride Share
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <Label className="text-base font-medium">Notification Settings</Label>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">Ride Reminders</div>
                          <div className="text-sm text-muted-foreground">Get notified about upcoming rides</div>
                        </div>
                        <Switch 
                          checked={preferences.ride_reminders} 
                          onCheckedChange={(checked) => handlePreferenceChange('ride_reminders', checked)} 
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">EcoPoints Updates</div>
                          <div className="text-sm text-muted-foreground">Notifications about points and rewards</div>
                        </div>
                        <Switch 
                          checked={preferences.ecopoints_updates} 
                          onCheckedChange={(checked) => handlePreferenceChange('ecopoints_updates', checked)} 
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">Weekly Impact Report</div>
                          <div className="text-sm text-muted-foreground">Summary of your environmental impact</div>
                        </div>
                        <Switch 
                          checked={preferences.weekly_impact_report} 
                          onCheckedChange={(checked) => handlePreferenceChange('weekly_impact_report', checked)} 
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">Community Challenges</div>
                          <div className="text-sm text-muted-foreground">New challenges and competitions</div>
                        </div>
                        <Switch 
                          checked={preferences.community_challenges} 
                          onCheckedChange={(checked) => handlePreferenceChange('community_challenges', checked)} 
                        />
                      </div>

                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium">Marketing Communications</div>
                          <div className="text-sm text-muted-foreground">Promotional offers and updates</div>
                        </div>
                        <Switch 
                          checked={preferences.marketing_communications} 
                          onCheckedChange={(checked) => handlePreferenceChange('marketing_communications', checked)} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Health Integration */}
            <Card className="border-0 shadow-md rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="pb-6">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Heart className="w-6 h-6 text-primary" />
                  Health Integration
                </CardTitle>
                <CardDescription>Track your fitness achievements from sustainable transport</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <div className="text-center p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20">
                    <Activity className="w-8 h-8 text-primary mx-auto mb-3" />
                    <div className="text-3xl font-bold text-primary">{healthData.calories_walking.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Calories Burned Walking</div>
                    <div className="text-xs text-muted-foreground mt-1">This month</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-green-500/5 to-green-500/10 rounded-xl border border-green-500/20">
                    <Bike className="w-8 h-8 text-green-600 mx-auto mb-3" />
                    <div className="text-3xl font-bold text-green-600">{healthData.calories_biking.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Calories Burned Biking</div>
                    <div className="text-xs text-muted-foreground mt-1">This month</div>
                  </div>
                </div>
                <div className="p-4 bg-gradient-to-r from-primary/5 to-green-500/5 rounded-xl border border-primary/20">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Monthly Fitness Goal</span>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(healthData.calories_walking + healthData.calories_biking).toLocaleString()}/{healthData.monthly_goal.toLocaleString()} calories
                    </span>
                  </div>
                  <Progress value={healthData.goal_progress} className="h-3 mb-2" />
                  <p className="text-xs text-muted-foreground text-center">{healthData.goal_progress}% of monthly goal achieved</p>
                </div>
              </CardContent>
            </Card>



          </div>
        </div>
      </div>
    </div>
  )
}
