"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { MapPin, Navigation, Clock, Car, Bike, Users, TreePine, DollarSign, Timer, Leaf } from "lucide-react"
import { LiveMap } from "@/components/LiveMap"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/AuthProvider"
import { useRouter } from "next/navigation"

// Haversine distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

function calculatePrice(distanceKm: number, mode: string): number {
  const baseRates = { EV_SHUTTLE: 0.8, E_BIKE: 0.3, RIDE_SHARE: 0.6, WALK: 0 }
  const rate = (baseRates as any)[mode] ?? 0.5
  const basePrice = Math.max(2, distanceKm * rate)
  return Math.round(basePrice * 100) / 100
}

function calculateCO2Saved(distanceKm: number, mode: string): number {
  const perKm = { EV_SHUTTLE: 0.4, E_BIKE: 0.3, RIDE_SHARE: 0.35, WALK: 0.2 }
  const rate = (perKm as any)[mode] ?? 0.3
  return Math.round(distanceKm * rate * 10) / 10
}

function calculateEstimatedTime(distanceKm: number, mode: string): number {
  const speeds = { EV_SHUTTLE: 25, E_BIKE: 15, RIDE_SHARE: 20, WALK: 5 }
  const speed = (speeds as any)[mode] ?? 15
  return Math.round((distanceKm / speed) * 60)
}

export function BookRideMain() {
  const [step, setStep] = useState<"form" | "suggestions" | "confirmation">("form")
  const [selectedMode, setSelectedMode] = useState<string>("")
  const [selectedRide, setSelectedRide] = useState<any>(null)
  const [coords, setCoords] = useState<{ pickup?: { lat: number; lng: number } | null; dropoff?: { lat: number; lng: number } | null }>({})
  const [formData, setFormData] = useState({
    pickup: "",
    dropoff: "",
    time: "",
  })
  const [calculatedRides, setCalculatedRides] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)
  const { user, refreshUserData } = useAuth()
  const router = useRouter()

  // Handle location input changes
  const handleLocationChange = (field: 'pickup' | 'dropoff', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // If coordinates exist, clear them when user types manually
    if (field === 'pickup' && coords.pickup) {
      setCoords(prev => ({ ...prev, pickup: null }))
    }
    if (field === 'dropoff' && coords.dropoff) {
      setCoords(prev => ({ ...prev, dropoff: null }))
    }
  }

  // Handle map coordinate changes
  const handleMapChange = (newCoords: any) => {
    setCoords(prev => ({ ...prev, ...newCoords }))
    console.log('Map coordinates updated:', newCoords)
  }

  // Handle location data from map
  const handleLocationData = (data: any) => {
    if (data.pickup) {
      setFormData(prev => ({ ...prev, pickup: data.pickup }))
    }
    if (data.dropoff) {
      setFormData(prev => ({ ...prev, dropoff: data.dropoff }))
    }
  }

  // Debug function to check database schema
  const debugDatabaseSchema = async () => {
    console.log('=== DATABASE SCHEMA DEBUG ===')
    
    try {
      // Check rides table structure
      const { data: ridesSample, error: ridesError } = await supabase
        .from('rides')
        .select('*')
        .limit(1)
      
      if (ridesError) {
        console.error('Rides table error:', ridesError)
      } else {
        console.log('Rides table accessible, sample data:', ridesSample)
      }

      // Check profiles table structure
      const { data: profilesSample, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)
      
      if (profilesError) {
        console.error('Profiles table error:', profilesError)
      } else {
        console.log('Profiles table accessible, sample data:', profilesSample)
      }

      // Check impact_logs table structure
      try {
        const { data: impactSample, error: impactError } = await supabase
          .from('impact_logs')
          .select('*')
          .limit(1)
        
        if (impactError) {
          console.error('Impact logs table error:', impactError)
        } else {
          console.log('Impact logs table accessible, sample data:', impactSample)
        }
      } catch (e) {
        console.log('Impact logs table not available')
      }
      
    } catch (error) {
      console.error('Database schema check failed:', error)
    }
    
    console.log('=== END DATABASE SCHEMA DEBUG ===')
  }

  const aiSuggestions = [
    {
      id: 1,
      type: "EV Shuttle",
      icon: Car,
      price: "$8.50",
      time: "12 min",
      co2Saved: "4.2 kg",
      points: 85,
      description: "Shared electric vehicle",
      estimatedArrival: "2:45 PM",
      color: "primary",
    },
    {
      id: 2,
      type: "E-Bike",
      icon: Bike,
      price: "$3.00",
      time: "18 min",
      co2Saved: "2.8 kg",
      points: 60,
      description: "Electric bike rental",
      estimatedArrival: "2:51 PM",
      color: "accent",
    },
    {
      id: 3,
      type: "Ride Share",
      icon: Users,
      price: "$6.75",
      time: "15 min",
      co2Saved: "3.5 kg",
      points: 70,
      description: "Shared with 2 others",
      estimatedArrival: "2:48 PM",
      color: "secondary",
    },
  ]

  const transportModes = [
    { id: "EV_SHUTTLE", label: "EV Shuttle", icon: Car },
    { id: "E_BIKE", label: "E-Bike", icon: Bike },
    { id: "RIDE_SHARE", label: "Ride Share", icon: Users },
    { id: "WALK", label: "Walk Suggestion", icon: TreePine },
  ]

  // derive route-based suggestions
  useEffect(() => {
    if (coords.pickup && coords.dropoff) {
      const distanceKm = calculateDistance(coords.pickup.lat, coords.pickup.lng, coords.dropoff.lat, coords.dropoff.lng)
      const rides = transportModes.map((mode) => {
        const price = calculatePrice(distanceKm, mode.id)
        const co2 = calculateCO2Saved(distanceKm, mode.id)
        const minutes = calculateEstimatedTime(distanceKm, mode.id)
        const points = Math.round(co2 * 20)
        return {
          id: mode.id,
          type: mode.label,
          icon: mode.icon,
          price: `$${price.toFixed(2)}`,
          time: `${minutes} min`,
          co2Saved: `${co2} kg`,
          points,
          description: mode.id === 'EV_SHUTTLE' ? 'Shared electric vehicle' : mode.id === 'E_BIKE' ? 'Electric bike rental' : mode.id === 'RIDE_SHARE' ? 'Shared with 2 others' : 'Walk recommendation',
          color: mode.id === 'EV_SHUTTLE' ? 'primary' : mode.id === 'E_BIKE' ? 'accent' : mode.id === 'RIDE_SHARE' ? 'secondary' : 'default',
          distanceKm,
        }
      })
      setCalculatedRides(rides)
    } else {
      setCalculatedRides([])
    }
  }, [coords])

  const handleFindRides = () => {
    if (!formData.pickup || !formData.dropoff) {
      alert("Please enter both pickup and dropoff locations.")
      return
    }
    
    if (!coords.pickup || !coords.dropoff) {
      alert("Please drop pins on the map for both pickup and dropoff locations.")
      return
    }
    
    console.log('Finding rides with coordinates:', coords)
    setStep("suggestions")
  }

  const handleSelectRide = (ride: any) => {
    setSelectedRide(ride)
    setStep("confirmation")
  }

  const handleConfirmBooking = async () => {
    if (!selectedRide || !coords.pickup || !coords.dropoff) {
      alert("Please select a ride and ensure pickup/drop-off are set.")
      return
    }
    if (!user) {
      alert("Please sign in to book a ride.")
      router.push('/login')
      return
    }

    setBookingLoading(true)
    try {
      const distanceKm = typeof selectedRide.distanceKm === 'number' ? selectedRide.distanceKm : 0
      const co2SavedKg = typeof selectedRide.co2Saved === 'string' ? parseFloat(String(selectedRide.co2Saved).replace(/[^0-9.]/g, '')) : (selectedRide.co2Saved || 0)
      const price = typeof selectedRide.price === 'string' ? parseFloat(String(selectedRide.price).replace(/[^0-9]/g, ''), 10) : (selectedRide.price || 0)
      const durationMin = typeof selectedRide.time === 'string' ? parseInt(String(selectedRide.time).replace(/[^0-9]/g, ''), 10) : (selectedRide.time || 0)
      const transportType = selectedRide.id || selectedMode

      console.log('Booking ride with data:', {
        user_id: user.id,
        pickup_address: formData.pickup,
        dropoff_address: formData.dropoff,
        pickup_lat: coords.pickup.lat,
        pickup_lng: coords.pickup.lng,
        dropoff_lat: coords.dropoff.lat,
        dropoff_lng: coords.dropoff.lng,
        distance_km: distanceKm,
        price,
        duration_min: durationMin,
        co2_saved_kg: co2SavedKg,
        mode: transportType
      })

      // 1) Save ride record to rides table
      const { data: rideData, error: rideErr } = await supabase.from('rides').insert({
        user_id: user.id,
        pickup_address: formData.pickup,
        dropoff_address: formData.dropoff,
        pickup_lat: coords.pickup.lat,
        pickup_lng: coords.pickup.lng,
        dropoff_lat: coords.dropoff.lat,
        dropoff_lng: coords.dropoff.lng,
        distance_km: distanceKm,
        price,
        duration_min: durationMin,
        co2_saved_kg: co2SavedKg,
        mode: transportType
      }).select()

      if (rideErr) {
        console.error('Ride insert error:', rideErr)
        alert("Could not save ride. Please try again.")
        return
      }

      console.log('Ride saved successfully:', rideData)

      // 2) Log impact and points (20 points per kg saved)
      const points = Math.round(co2SavedKg * 20)
      
      try {
        const { error: impactErr } = await supabase.from('impact_logs').insert({
          user_id: user.id,
          co2_saved_kg: co2SavedKg,
          points_earned: points,
          mode: transportType,
          distance_km: distanceKm
        })
        
        if (impactErr) {
          console.error('Impact insert error:', impactErr)
          // Not fatal to booking; continue
        } else {
          console.log('Impact logged successfully')
        }
      } catch (impactError) {
        console.error('Impact logging failed:', impactError)
        // Continue with booking even if impact logging fails
      }

      // 3) Update user's EcoPoints in profiles table
      try {
        const { error: profileErr } = await supabase
          .from('profiles')
          .update({ 
            eco_points: (user.ecoPoints || 0) + points
          })
          .eq('id', user.id)

        if (profileErr) {
          console.error('Profile update error:', profileErr)
          // Try alternative method
          try {
            const { error: rpcError } = await supabase.rpc('increment_ecopoints', { 
              uid: user.id, 
              amount: points 
            })
            if (rpcError) {
              console.error('RPC increment error:', rpcError)
            }
          } catch (rpcErr) {
            console.error('RPC call failed:', rpcErr)
          }
        } else {
          console.log('Profile updated successfully')
        }
      } catch (profileError) {
        console.error('Profile update failed:', profileError)
      }

      // 4) Refresh user data to get updated EcoPoints
      await refreshUserData()

      // 5) Show success message and redirect
      alert(`Ride booked successfully! You earned ${points} EcoPoints.`)
      setStep("form")
      setFormData({ pickup: "", dropoff: "", time: "" })
      setSelectedMode("")
      setSelectedRide(null)
      
      // Redirect to my-rides page
      router.push('/dashboard/my-rides')
      
    } catch (error) {
      console.error('Booking failed:', error)
      alert("An error occurred while booking your ride. Please try again.")
    } finally {
      setBookingLoading(false)
    }
  }

  // Check if required database tables exist
  const validateDatabase = async () => {
    try {
      // Check rides table
      const { error: ridesError } = await supabase.from('rides').select('id').limit(1)
      if (ridesError) {
        console.error('Rides table not accessible:', ridesError)
        return false
      }

      // Check profiles table
      const { error: profilesError } = await supabase.from('profiles').select('id').limit(1)
      if (profilesError) {
        console.error('Profiles table not accessible:', profilesError)
        return false
      }

      // Check impact_logs table (optional)
      try {
        const { error: impactError } = await supabase.from('impact_logs').select('id').limit(1)
        if (impactError) {
          console.log('Impact logs table not accessible (optional):', impactError)
        }
      } catch (e) {
        console.log('Impact logs table not available (optional)')
      }

      return true
    } catch (error) {
      console.error('Database validation failed:', error)
      return false
    }
  }

  // Validate database on component mount
  useEffect(() => {
    if (user?.id) {
      validateDatabase()
    }
  }, [user?.id])

  if (step === "confirmation" && selectedRide) {
    return (
      <div className="flex-1 p-6 overflow-auto animate-page-enter">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl font-bold text-foreground mb-2">Booking Confirmation</h1>
          <p className="text-muted-foreground">Review your ride details and confirm</p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <selectedRide.icon className="w-5 h-5 animate-icon-bounce" />
                {selectedRide.type} Booking
              </CardTitle>
              <CardDescription>Estimated arrival: {selectedRide.estimatedArrival}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg animate-slide-in-left">
                  <MapPin className="w-4 h-4 text-muted-foreground animate-pulse-subtle" />
                  <div>
                    <div className="text-sm text-muted-foreground">From</div>
                    <div className="font-medium">{formData.pickup}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg animate-slide-in-right">
                  <Navigation className="w-4 h-4 text-muted-foreground animate-pulse-subtle" />
                  <div>
                    <div className="text-sm text-muted-foreground">To</div>
                    <div className="font-medium">{formData.dropoff}</div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 p-4 bg-primary/5 rounded-lg animate-fade-in-up">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-lg font-bold animate-counter-up">
                    <DollarSign className="w-4 h-4" />
                    {selectedRide.price.replace("$", "")}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Cost</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-lg font-bold animate-counter-up">
                    <Timer className="w-4 h-4" />
                    {selectedRide.time}
                  </div>
                  <div className="text-sm text-muted-foreground">Duration</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-lg font-bold text-primary animate-counter-up">
                    <Leaf className="w-4 h-4 animate-pulse-subtle" />
                    {selectedRide.co2Saved}
                  </div>
                  <div className="text-sm text-muted-foreground">CO₂ Saved</div>
                </div>
              </div>

              <div className="flex gap-3 animate-fade-in-up">
                <Button
                  variant="outline"
                  onClick={() => setStep("suggestions")}
                  className="flex-1 animate-button-hover"
                >
                  Back to Options
                </Button>
                <Button onClick={handleConfirmBooking} className="flex-1 animate-button-hover animate-glow" disabled={bookingLoading}>
                  {bookingLoading ? 'Booking...' : 'Confirm Booking'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (step === "suggestions") {
    return (
      <div className="flex-1 p-6 overflow-auto animate-page-enter">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl font-bold text-foreground mb-2">AI Ride Suggestions</h1>
          <p className="text-muted-foreground">Best sustainable options for your journey</p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="border-0 shadow-md mb-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <CardHeader>
              <CardTitle>Your Journey</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm">
                <span className="font-medium">{formData.pickup}</span>
                <Navigation className="w-4 h-4 text-muted-foreground animate-pulse-subtle" />
                <span className="font-medium">{formData.dropoff}</span>
                {formData.time && (
                  <>
                    <Clock className="w-4 h-4 text-muted-foreground ml-4 animate-pulse-subtle" />
                    <span>{new Date(formData.time).toLocaleString()}</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            {(calculatedRides.length > 0 ? calculatedRides : aiSuggestions).map((suggestion, index) => (
              <Card
                key={suggestion.id}
                className="border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-card-lift animate-slide-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 bg-${suggestion.color}/10 rounded-full flex items-center justify-center animate-icon-bounce`}
                        style={{ animationDelay: `${index * 150}ms` }}
                      >
                        <suggestion.icon className={`w-6 h-6 text-${suggestion.color}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-lg">{suggestion.type}</span>
                          {index === 0 && (
                            <Badge className="bg-primary text-primary-foreground animate-badge-pop">Best Match</Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground text-sm">{suggestion.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center animate-fade-in-up" style={{ animationDelay: `${index * 50}ms` }}>
                        <div className="font-bold text-lg animate-counter-up">{suggestion.price}</div>
                        <div className="text-xs text-muted-foreground">Price</div>
                      </div>
                      <div className="text-center animate-fade-in-up" style={{ animationDelay: `${index * 75}ms` }}>
                        <div className="font-bold text-lg animate-counter-up">{suggestion.time}</div>
                        <div className="text-xs text-muted-foreground">Time</div>
                      </div>
                      <div className="text-center animate-fade-in-up" style={{ animationDelay: `${index * 100}ms` }}>
                        <div className="font-bold text-lg text-primary animate-counter-up">{suggestion.co2Saved}</div>
                        <div className="text-xs text-muted-foreground">CO₂ Saved</div>
                      </div>
                      <div className="text-center animate-fade-in-up" style={{ animationDelay: `${index * 125}ms` }}>
                        <div className="font-bold text-lg text-accent animate-counter-up">+{suggestion.points}</div>
                        <div className="text-xs text-muted-foreground">Points</div>
                      </div>
                      <Button
                        onClick={() => handleSelectRide(suggestion)}
                        className="animate-button-hover animate-glow"
                      >
                        Select Ride
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-6 text-center animate-fade-in-up">
            <Button variant="outline" onClick={() => setStep("form")} className="animate-button-hover">
              Back to Search
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6 overflow-auto animate-page-enter">
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Book a Ride</h1>
            <p className="text-muted-foreground">Find and book sustainable transport options near you</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={debugDatabaseSchema}
            className="btn-hover"
          >
            Debug DB
          </Button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* Map */}
        <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader>
            <CardTitle>Map</CardTitle>
            <CardDescription>Drop pins for pickup and dropoff</CardDescription>
          </CardHeader>
          <CardContent>
            <LiveMap
              height={320}
              pickup={coords.pickup || null}
              dropoff={coords.dropoff || null}
              onChange={handleMapChange}
              onLocationData={handleLocationData}
              showRoute={true}
            />
          </CardContent>
        </Card>

        {/* Booking Form */}
        <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader>
            <CardTitle>Where would you like to go?</CardTitle>
            <CardDescription>Enter your pickup and destination locations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2 animate-slide-in-left">
              <Label htmlFor="pickup">Pickup Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground animate-pulse-subtle" />
                <Input
                  id="pickup"
                  placeholder="Enter pickup address or drop pin on map"
                  className="pl-10 transition-all duration-200 focus:scale-[1.02]"
                  value={formData.pickup}
                  onChange={(e) => handleLocationChange('pickup', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2 animate-slide-in-right">
              <Label htmlFor="destination">Drop-off Location</Label>
              <div className="relative">
                <Navigation className="absolute left-3 top-3 h-4 w-4 text-muted-foreground animate-pulse-subtle" />
                <Input
                  id="destination"
                  placeholder="Enter destination address or drop pin on map"
                  className="pl-10 transition-all duration-200 focus:scale-[1.02]"
                  value={formData.dropoff}
                  onChange={(e) => handleLocationChange('dropoff', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3 animate-fade-in-up">
              <Label>Preferred Mode</Label>
              <div className="grid grid-cols-2 gap-3">
                {transportModes.map((mode, index) => (
                  <button
                    key={mode.id}
                    onClick={() => setSelectedMode(mode.id)}
                    className={`flex items-center gap-2 p-3 border rounded-lg transition-all duration-200 hover:scale-105 animate-slide-in-up ${
                      selectedMode === mode.id
                        ? "border-primary bg-primary/5 text-primary animate-glow"
                        : "border-border hover:bg-muted/50"
                    }`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <mode.icon className="w-4 h-4 animate-icon-bounce" />
                    <span className="text-sm font-medium">{mode.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 animate-slide-in-left">
              <Label htmlFor="time">Departure Time (Optional)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground animate-pulse-subtle" />
                <Input
                  id="time"
                  type="datetime-local"
                  className="pl-10 transition-all duration-200 focus:scale-[1.02]"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>

            {coords.pickup && coords.dropoff && calculatedRides.length > 0 && (
              <div className="p-4 bg-muted/30 rounded-lg animate-fade-in-up">
                <div className="text-sm text-muted-foreground mb-2">Route Preview:</div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="font-bold text-lg">{calculatedRides[0]?.distanceKm?.toFixed(1)} km</div>
                    <div className="text-xs text-muted-foreground">Distance</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg text-primary">{calculatedRides[0]?.price}</div>
                    <div className="text-xs text-muted-foreground">Est. Price</div>
                  </div>
                  <div>
                    <div className="font-bold text-lg">{calculatedRides[0]?.time}</div>
                    <div className="text-xs text-muted-foreground">Est. Time</div>
                  </div>
                </div>
              </div>
            )}

            <Button
              className="w-full animate-button-hover animate-glow"
              size="lg"
              onClick={handleFindRides}
              disabled={!(coords.pickup && coords.dropoff)}
            >
              Find Best Rides
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
