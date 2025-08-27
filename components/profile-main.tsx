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
import { User, Mail, Phone, MapPin, Settings, Shield, Bell, LogOut, Activity, Car, Bike, Users, Upload, Trash2 } from "lucide-react"
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
  const goSettings = () => router.push("/dashboard/profile")

  if (loading) {
    return (
      <div className="flex-1 p-6 overflow-auto">
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
    <div className="flex-1 p-6 overflow-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Profile & Settings</h1>
        <p className="text-muted-foreground">Manage your account information and preferences</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details and contact information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" onError={(e)=>{(e.currentTarget as HTMLImageElement).src='/placeholder-user.jpg'}} />
                  ) : (
                    <User className="w-10 h-10 text-primary" />
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const file = e.target.files?.[0]
                  if (!file || !user) return
                  
                  // Check file size (Supabase usually has 50MB limit)
                  if (file.size > 50 * 1024 * 1024) {
                    alert('File too large. Please use an image under 50MB.')
                    return
                  }
                  
                  console.log('Starting upload for file:', file.name, 'size:', file.size, 'type:', file.type)
                  setUploading(true)
                  
                  // Show local preview immediately
                  const localUrl = URL.createObjectURL(file)
                  setAvatarUrl(localUrl)
                  
                  try {
                    const ext = file.name.split('.').pop()
                    const path = `avatars/${user.id}-${Date.now()}.${ext}`
                    console.log('Uploading to path:', path)
                    
                    const { data: upload, error } = await supabase.storage
                      .from('avatars')
                      .upload(path, file, { 
                        upsert: true,
                        cacheControl: '3600'
                      })
                    
                    if (error) {
                      console.error('Upload error details:', error)
                      alert(`Upload failed: ${error.message}`)
                      throw error
                    }
                    
                    console.log('Upload successful:', upload)
                    const { data: urlData } = await supabase.storage.from('avatars').getPublicUrl(upload.path)
                    console.log('Public URL data:', urlData)
                    
                    const publicUrl = urlData.publicUrl
                    setAvatarUrl(publicUrl)
                    
                    // Update profile
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
                    // Keep existing preview; don't clear avatar
                  } finally {
                    setUploading(false)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                    try { URL.revokeObjectURL(localUrl) } catch {}
                  }
                }} />
                <div>
                  <h3 className="text-lg font-semibold">{[firstName, lastName].filter(Boolean).join(" ") || "User"}</h3>
                  <p className="text-muted-foreground">{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ""}</p>
                  <Button variant="outline" size="sm" className="mt-2 bg-transparent" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                    <Upload className="w-4 h-4 mr-2" /> {uploading ? 'Uploading...' : 'Change Photo'}
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" readOnly />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-10" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Home Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="address" placeholder="Add your address" className="pl-10" value={homeAddress} onChange={(e)=>setHomeAddress(e.target.value)} />
                </div>
              </div>

              {isDirty && (
                <>
                  <Button className="w-full" onClick={onSave} disabled={saving}>{saving ? "Saving..." : "Save Changes"}</Button>
                  <div className="text-xs mt-2 min-h-[1rem]">
                    {saveError && <span className="text-red-600">{saveError}</span>}
                    {saveOk && !saveError && <span className="text-red-600">Saved</span>}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Preferences & Settings
              </CardTitle>
              <CardDescription>Customize your EcoRide experience</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Preferred Transport Type</Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Choose your default sustainable transport preference
                  </p>
                  <Select value={preferences.preferred_transport} onValueChange={(value) => handlePreferenceChange('preferred_transport', value)}>
                    <SelectTrigger>
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

                <div className="space-y-4">
                  <Label className="text-base font-medium">Notification Settings</Label>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Ride Reminders</div>
                      <div className="text-sm text-muted-foreground">Get notified about upcoming rides</div>
                    </div>
                    <Switch 
                      checked={preferences.ride_reminders} 
                      onCheckedChange={(checked) => handlePreferenceChange('ride_reminders', checked)} 
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">EcoPoints Updates</div>
                      <div className="text-sm text-muted-foreground">Notifications about points and rewards</div>
                    </div>
                    <Switch 
                      checked={preferences.ecopoints_updates} 
                      onCheckedChange={(checked) => handlePreferenceChange('ecopoints_updates', checked)} 
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Weekly Impact Report</div>
                      <div className="text-sm text-muted-foreground">Summary of your environmental impact</div>
                    </div>
                    <Switch 
                      checked={preferences.weekly_impact_report} 
                      onCheckedChange={(checked) => handlePreferenceChange('weekly_impact_report', checked)} 
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Community Challenges</div>
                      <div className="text-sm text-muted-foreground">New challenges and competitions</div>
                    </div>
                    <Switch 
                      checked={preferences.community_challenges} 
                      onCheckedChange={(checked) => handlePreferenceChange('community_challenges', checked)} 
                    />
                  </div>

                  <div className="flex items-center justify-between">
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
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Health Integration
              </CardTitle>
              <CardDescription>Track your fitness achievements from sustainable transport</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="text-center p-4 bg-primary/5 rounded-lg">
                  <Activity className="w-8 h-8 text-primary mx-auto mb-2" />
                  <div className="text-2xl font-bold text-primary">{healthData.calories_walking.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Calories Burned Walking</div>
                  <div className="text-xs text-muted-foreground mt-1">This month</div>
                </div>
                <div className="text-center p-4 bg-accent/5 rounded-lg">
                  <Bike className="w-8 h-8 text-accent mx-auto mb-2" />
                  <div className="text-2xl font-bold text-accent">{healthData.calories_biking.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Calories Burned Biking</div>
                  <div className="text-xs text-muted-foreground mt-1">This month</div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Monthly Fitness Goal</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(healthData.calories_walking + healthData.calories_biking).toLocaleString()}/{healthData.monthly_goal.toLocaleString()} calories
                  </span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${healthData.goal_progress}%` }}></div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{healthData.goal_progress}% of monthly goal achieved</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-primary/10 text-primary">Verified</Badge>
                <Shield className="w-4 h-4 text-primary" />
              </div>

              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-muted-foreground">Member since:</span>
                  <span className="ml-2 font-medium">{accountStats.member_since}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Current Level:</span>
                  <span className="ml-2 font-medium text-primary">{accountStats.current_level}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Total Rides:</span>
                  <span className="ml-2 font-medium">{accountStats.total_rides}</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">CO₂ Saved:</span>
                  <span className="ml-2 font-medium">{accountStats.total_co2_saved} kg</span>
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Total Points:</span>
                  <span className="ml-2 font-medium">{accountStats.total_points_earned.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-2 bg-transparent" onClick={goSupport}>
                <Bell className="w-4 h-4" />
                Notification Settings
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2 bg-transparent" onClick={goSettings}>
                <Shield className="w-4 h-4" />
                Privacy & Security
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2 bg-transparent" onClick={goSettings}>
                <Settings className="w-4 h-4" />
                Account Settings
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start gap-2 bg-transparent text-destructive hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full bg-transparent" onClick={goSupport}>
                Help Center
              </Button>
              <Button variant="outline" className="w-full bg-transparent" onClick={goSupport}>
                Contact Support
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full text-destructive bg-transparent">
                    <Trash2 className="w-4 h-4 mr-2" />
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
                    <AlertDialogCancel onClick={() => {}}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={async () => {
                      try {
                        if (!user?.id) {
                          alert('User ID not found')
                          return
                        }
                        
                        // Extract avatar path from public URL
                        let avatarPath: string | null = null
                        if (user.avatarUrl && user.avatarUrl.includes('/storage/v1/object/public/avatars/')) {
                          avatarPath = user.avatarUrl.split('/storage/v1/object/public/avatars/')[1] || null
                        }
                        
                        // Get current session access token
                        const { data } = await supabase.auth.getSession()
                        const accessToken = data.session?.access_token || ''
                        if (!accessToken) {
                          alert('Missing access token')
                          return
                        }
                        
                        // Call server route to delete everything including auth user
                        const resp = await fetch('/api/delete-account', {
                          method: 'POST',
                          headers: { 'content-type': 'application/json' },
                          body: JSON.stringify({ userId: user.id, accessToken, avatarPath })
                        })
                        const result = await resp.json().catch(() => ({}))
                        console.log('Delete API response:', { status: resp.status, result })
                        
                        if (!resp.ok || !result?.ok) {
                          console.error('Delete API error:', result)
                          const errorMessage = result?.error || result?.details || 'Unknown error'
                          alert(`Failed to delete account: ${errorMessage}`)
                          return
                        }
                        
                        console.log('Account deleted successfully, logging out...')
                        
                        // Force complete logout and clear all data
                        try {
                          await supabase.auth.signOut({ scope: 'global' })
                        } catch (e) {
                          console.log('Sign out error:', e)
                        }
                        
                        // Clear all client-side data aggressively
                        localStorage.clear()
                        sessionStorage.clear()
                        
                        // Clear all cookies
                        try {
                          document.cookie.split(";").forEach(function(c) { 
                            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
                          });
                        } catch (e) {
                          console.log('Cookie clearing error:', e)
                        }
                        
                        // Clear any remaining Supabase session data
                        try {
                          // Force clear any cached session data
                          if (typeof window !== 'undefined') {
                            // Clear any indexedDB data
                            if ('indexedDB' in window) {
                              indexedDB.databases().then(databases => {
                                databases.forEach(db => {
                                  if (db.name && db.name.includes('supabase')) {
                                    indexedDB.deleteDatabase(db.name)
                                  }
                                })
                              }).catch(() => {})
                            }
                            
                            // Clear any service worker registrations
                            if ('serviceWorker' in navigator) {
                              navigator.serviceWorker.getRegistrations().then(registrations => {
                                registrations.forEach(registration => {
                                  registration.unregister()
                                })
                              }).catch(() => {})
                            }
                          }
                        } catch (e) {
                          console.log('Advanced cleanup error:', e)
                        }
                        
                        console.log('All data cleared, redirecting...')
                        
                        // Force the AuthProvider to clear user state
                        window.dispatchEvent(new CustomEvent('forceLogout'))
                        
                        // Force immediate redirect and page reload
                        window.location.href = '/'
                        
                        // Backup: force reload after a short delay
                        setTimeout(() => {
                          window.location.reload()
                        }, 100)
                        
                        // Additional aggressive cleanup
                        setTimeout(() => {
                          // Try to clear any remaining Supabase session
                          try {
                            supabase.auth.signOut({ scope: 'global' })
                          } catch (e) {
                            console.log('Final cleanup error:', e)
                          }
                          // Force a hard refresh
                          window.location.href = '/'
                          window.location.reload()
                        }, 500)
                        
                        // Final nuclear option - clear everything and redirect
                        setTimeout(() => {
                          try {
                            // Clear everything again
                            localStorage.clear()
                            sessionStorage.clear()
                            // Force a complete page refresh
                            window.location.replace('/')
                          } catch (e) {
                            console.log('Nuclear cleanup error:', e)
                          }
                        }, 1000)
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
      </div>
    </div>
  )
}
