"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Coins, Gift, Star, Trophy, Leaf, Car, Coffee, ShoppingBag, Zap, Target, BarChart3, HelpCircle } from "lucide-react"
import { useAuth } from "@/components/AuthProvider"
import { supabase } from "@/lib/supabase"

type HistoryItem = { id: string; action: string; points: number; date: string; type: "ride" | "bonus" | "challenge"; co2Saved: string }

type RewardRow = { id: string; title: string; description: string | null; points: number; category: string | null }
const ICON_META: Record<string, any> = {
  "Food & Beverage": Coffee,
  Transport: Car,
  Shopping: ShoppingBag,
  Premium: Star,
  Recognition: Trophy,
  Insights: BarChart3,
  Environment: Leaf,
  Support: HelpCircle,
}

export function EcoPointsMain() {
  const { user, refreshUserData } = useAuth()
  const [currentPoints, setCurrentPoints] = useState(0)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [redeemingId, setRedeemingId] = useState<number | null>(null)
  const rewardsRef = useRef<HTMLDivElement>(null)
  const [rewards, setRewards] = useState<RewardRow[]>([])

  useEffect(() => {
    const load = async () => {
      if (!user) return
      setCurrentPoints(user.ecoPoints || 0)
      const { data } = await supabase
        .from('impact_logs')
        .select('id, co2_saved_kg, points_earned, mode, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)
      const mapped: HistoryItem[] = (data || []).map((r: any) => ({
        id: r.id,
        action: r.mode ? `${r.mode.replace('_',' ')} ride` : 'Ride',
        points: Number(r.points_earned || 0),
        date: new Date(r.created_at).toLocaleString(),
        type: 'ride',
        co2Saved: `${Number(r.co2_saved_kg || 0).toFixed(1)} kg`,
      }))
      setHistory(mapped)

      // load rewards from DB (fallback to defaults if table empty or error)
      try {
        const { data: rw, error: rewardsError } = await supabase
          .from('rewards')
          .select('id, title, description, points, category')
          .order('points', { ascending: true })
        
        if (rewardsError) {
          console.error('Error loading rewards:', rewardsError)
          // Fall back to default rewards
        } else if (rw && rw.length > 0) {
          setRewards(rw as any)
        } else {
          // Table is empty, use default rewards
          console.log('No rewards found in database, using defaults')
        }
      } catch (error) {
        console.error('Failed to load rewards:', error)
      }
      
      // Always set default rewards as fallback
      if (rewards.length === 0) {
        setRewards([
          { id: '1', title: 'Free Coffee at CCD', description: 'Enjoy a free coffee at any CCD outlet', points: 200, category: 'Food & Beverage' },
          { id: '2', title: '₹50 Ride Discount', description: 'Get ₹50 off your next ride', points: 500, category: 'Transport' },
          { id: '3', title: 'Eco Shopping Voucher', description: '₹100 voucher for sustainable products', points: 800, category: 'Shopping' },
          { id: '4', title: 'Premium Features Access', description: '1 month access to premium features', points: 1200, category: 'Premium' },
          { id: '5', title: 'Community Badge', description: 'Special badge for your profile', points: 300, category: 'Recognition' },
          { id: '6', title: 'Weekly Impact Report', description: 'Detailed weekly environmental impact report', points: 400, category: 'Insights' },
        ])
      }
    }
    load()
  }, [user])

  const tierCosts = useMemo(() => rewards.map(r => r.points).sort((a,b) => a-b), [rewards])
  const nextRewardThreshold = useMemo(() => tierCosts.find(t => t > currentPoints) || tierCosts[tierCosts.length-1] || 0, [tierCosts, currentPoints])
  const nextLevelPoints = useMemo(() => Math.ceil((currentPoints+1)/1000)*1000, [currentPoints])
  const currentLevel = useMemo(() => currentPoints >= 3000 ? 'Eco Champion' : currentPoints >= 1500 ? 'Eco Warrior' : 'Eco Starter', [currentPoints])
  const progress = (currentPoints / Math.max(1, nextLevelPoints)) * 100
  const pointsToNextReward = Math.max(0, nextRewardThreshold - currentPoints)

  const handleBrowseRewards = () => {
    rewardsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleRedeem = async (reward: RewardRow) => {
    if (!user) return
    if (currentPoints < reward.points) return
    setRedeemingId(Number(reward.id))
    try {
      const newPoints = currentPoints - reward.points
      const { error: updErr } = await supabase.from('profiles').update({ eco_points: newPoints }).eq('id', user.id)
      if (updErr) throw updErr
      
      // Insert redemption record (without title since it's not in the current schema)
      const { error: redemptionErr } = await supabase.from('reward_redemptions').insert({ 
        user_id: user.id, 
        reward_id: reward.id, 
        points_spent: reward.points 
      })
      
      if (redemptionErr) {
        console.error('Redemption insert error:', redemptionErr)
        // Continue with points update even if redemption logging fails
      }
      
      setCurrentPoints(newPoints)
      await refreshUserData()
      alert(`Redeemed ${reward.title}!`)
    } catch (e) {
      console.error('Redemption error:', e)
      alert('Could not redeem at this time.')
    } finally {
      setRedeemingId(null)
    }
  }

  return (
    <div className="flex-1 p-6 overflow-auto bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">EcoPoints & Rewards</h1>
        <p className="text-muted-foreground">Earn points for sustainable choices and redeem them for amazing rewards</p>
      </div>

      {/* Points Overview */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card className="border-0 shadow-md bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="w-5 h-5 text-primary" />
              Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary mb-2">{currentPoints.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground mb-4">EcoPoints available to spend</p>
            <Button className="w-full" onClick={handleBrowseRewards}>
              <Gift className="w-4 h-4 mr-2" />
              Browse Rewards
            </Button>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-accent" />
              Next Reward
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent mb-2">{pointsToNextReward}</div>
            <p className="text-sm text-muted-foreground mb-4">points away from your next reward</p>
            <Progress value={(currentPoints / nextRewardThreshold) * 100} className="mb-2" />
            <p className="text-xs text-muted-foreground">Free Coffee at {nextRewardThreshold} points</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-accent" />
              Level Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-2">
              <Badge variant="secondary" className="bg-accent/10 text-accent">
                {currentLevel}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {currentPoints}/{nextLevelPoints}
              </span>
            </div>
            <Progress value={progress} className="mb-4" />
            <p className="text-sm text-muted-foreground">
              {nextLevelPoints - currentPoints} points to next level: Eco Champion
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Available Rewards */}
      <Card className="border-0 shadow-md mb-6 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Rewards Store
          </CardTitle>
          <CardDescription>Redeem your points for these amazing rewards</CardDescription>
        </CardHeader>
        <CardContent>
          <div ref={rewardsRef} />
          <div className="grid md:grid-cols-2 gap-4">
            {rewards.map((reward) => {
              const Icon = ICON_META[reward.category || ""] || Gift
              const canRedeem = currentPoints >= reward.points
              const isBusy = redeemingId === Number(reward.id)
              return (
              <div
                key={reward.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow bg-background"
              >
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{reward.title}</div>
                  <div className="text-sm text-muted-foreground">{reward.description || ''}</div>
                  <Badge variant="outline" className="text-xs mt-1">
                    {reward.category || 'Reward'}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-primary mb-1">{reward.points} pts</div>
                  <Button
                    size="sm"
                    disabled={!canRedeem || isBusy}
                    variant={canRedeem ? "default" : "outline"}
                    className={canRedeem ? "bg-primary hover:bg-accent" : ""}
                    onClick={() => handleRedeem(reward)}
                  >
                    {canRedeem ? (isBusy ? 'Redeeming…' : 'Redeem') : 'Need more'}
                  </Button>
                </div>
              </div>
            )})}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Points History */}
        <Card className="border-0 shadow-md rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader>
            <CardTitle>Recent Earnings</CardTitle>
            <CardDescription>Your latest point-earning activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {history.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    {item.type === "ride" && <Car className="w-5 h-5 text-primary" />}
                    {item.type === "bonus" && <Zap className="w-5 h-5 text-accent" />}
                    {item.type === "challenge" && <Trophy className="w-5 h-5 text-primary" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{item.action}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.date} • {item.co2Saved} CO₂ saved
                    </div>
                  </div>
                  <div className="text-sm font-medium text-primary">+{item.points}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* How to Earn More */}
        <Card className="border-0 shadow-md rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-primary" />
              How to Earn More Points
            </CardTitle>
            <CardDescription>Maximize your EcoPoints with these sustainable actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <Car className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="font-medium text-sm mb-1">Electric Rides</div>
                <div className="text-xs text-muted-foreground">30-50 points per ride</div>
              </div>
              <div className="text-center p-4 bg-accent/5 rounded-lg">
                <Zap className="w-8 h-8 text-accent mx-auto mb-2" />
                <div className="font-medium text-sm mb-1">Shared Rides</div>
                <div className="text-xs text-muted-foreground">+25 bonus points</div>
              </div>
              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
                <div className="font-medium text-sm mb-1">Weekly Challenges</div>
                <div className="text-xs text-muted-foreground">100+ points</div>
              </div>
              <div className="text-center p-4 bg-accent/5 rounded-lg">
                <Star className="w-8 h-8 text-accent mx-auto mb-2" />
                <div className="font-medium text-sm mb-1">Referrals</div>
                <div className="text-xs text-muted-foreground">200 points each</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Challenges */}
      <Card className="border-0 shadow-md mt-6 rounded-2xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
        <CardHeader>
          <CardTitle>Active Challenges</CardTitle>
          <CardDescription>Complete these challenges to earn bonus points</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Leaf className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="font-medium mb-1">Green Week Challenge</div>
                <div className="text-sm text-muted-foreground mb-2">Take 5 sustainable rides this week</div>
                <div className="flex items-center gap-2">
                  <Progress value={60} className="flex-1" />
                  <span className="text-sm text-muted-foreground">3/5</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-primary">150 pts</div>
                <div className="text-xs text-muted-foreground">2 days left</div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1">
                <div className="font-medium mb-1">Share & Save</div>
                <div className="text-sm text-muted-foreground mb-2">Share 3 rides with other users</div>
                <div className="flex items-center gap-2">
                  <Progress value={33} className="flex-1" />
                  <span className="text-sm text-muted-foreground">1/3</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-accent">100 pts</div>
                <div className="text-xs text-muted-foreground">5 days left</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
