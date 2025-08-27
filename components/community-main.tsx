"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Leaf, Trophy, Users, TrendingUp, Heart, MessageCircle, Share2, Bike, Car, MoreHorizontal, Trash2, Send } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/components/AuthProvider"

type CommunityPost = {
  id: string
  user_id: string | null
  user_name: string
  avatar_url: string | null
  content: string
  image_url?: string | null
  created_at: string
  likes: number | null
  comments_count: number | null
  type: string | null
  liked_by?: string[]
}

type Comment = {
  id: string
  post_id: string
  user_id: string
  user_name: string
  avatar_url: string | null
  content: string
  created_at: string
}

const demoSeed: CommunityPost[] = [
  {
    id: "seed-1",
    user_id: null,
    user_name: "EcoRide Team",
    avatar_url: "/placeholder.svg?height=40&width=40",
    content: "🚴 Bike to Work Day Challenge is live! Earn 2x EcoPoints today!",
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    likes: 12,
    comments_count: 2,
    type: "challenge",
  },
]



const activeChallenges = [
  {
    title: "Bike to Work Week",
    description: "Use bike rides for your commute",
    reward: "500 EcoPoints",
    participants: 1247,
    timeLeft: "3 days left",
    icon: Bike,
  },
  {
    title: "Carpool Champion",
    description: "Share 10 rides with others",
    reward: "300 EcoPoints",
    participants: 856,
    timeLeft: "1 week left",
    icon: Car,
  },
]

export function CommunityMain() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [newPost, setNewPost] = useState<string>("")
  const [topRiders, setTopRiders] = useState<any[]>([])
  const [userRank, setUserRank] = useState<number | null>(null)
  const [totalUsers, setTotalUsers] = useState(0)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
  const [comments, setComments] = useState<Record<string, Comment[]>>({})
  const [commentText, setCommentText] = useState<Record<string, string>>({})
  const [showComments, setShowComments] = useState<Set<string>>(new Set())
  const [deletingPost, setDeletingPost] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [userRoles, setUserRoles] = useState<Record<string, string>>({})
  const [currentCity, setCurrentCity] = useState<string>('Mumbai')
  const [selectedProfile, setSelectedProfile] = useState<{ name: string; avatar: string | null; role: string } | null>(null)
  const [profileModalOpen, setProfileModalOpen] = useState(false)

  const initialsFor = (name: string) => name.split(" ").map((n) => n[0]).join("")

  const openProfileModal = (userName: string, avatarUrl: string | null, userId: string | null) => {
    const role = userId ? userRoles[userId] || 'rider' : 'rider'
    setSelectedProfile({ name: userName, avatar: avatarUrl, role })
    setProfileModalOpen(true)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image size should be less than 5MB')
        return
      }
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onload = (e) => setImagePreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
  }

  const handleLike = async (postId: string) => {
    if (!user?.id) return

    try {
      const isLiked = likedPosts.has(postId)
      const newLikedPosts = new Set(likedPosts)
      
      if (isLiked) {
        newLikedPosts.delete(postId)
      } else {
        newLikedPosts.add(postId)
      }
      
      setLikedPosts(newLikedPosts)

      // Update posts optimistically
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          const currentLikes = post.likes || 0
          return {
            ...post,
            likes: isLiked ? currentLikes - 1 : currentLikes + 1,
            liked_by: isLiked 
              ? (post.liked_by || []).filter(id => id !== user.id)
              : [...(post.liked_by || []), user.id]
          }
        }
        return post
      }))

      // Update in database
      const { error } = await supabase
        .from('community_posts')
        .update({ 
          likes: isLiked ? (posts.find(p => p.id === postId)?.likes || 1) - 1 : (posts.find(p => p.id === postId)?.likes || 0) + 1
        })
        .eq('id', postId)

      if (error) {
        console.error('Error updating like:', error)
        // Revert optimistic update on error
        setLikedPosts(likedPosts)
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            const currentLikes = post.likes || 0
            return {
              ...post,
              likes: isLiked ? currentLikes + 1 : currentLikes - 1,
              liked_by: isLiked 
                ? [...(post.liked_by || []), user.id]
                : (post.liked_by || []).filter(id => id !== user.id)
            }
          }
          return post
        }))
      }
    } catch (error) {
      console.error('Error handling like:', error)
    }
  }

  const loadComments = async (postId: string) => {
    try {
      console.log('Loading comments for post:', postId)
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
      
      if (error) {
        console.error('Error loading comments:', error)
        throw error
      }
      
      console.log('Comments loaded:', data)
      setComments(prev => ({ ...prev, [postId]: data || [] }))
    } catch (error) {
      console.error('Error loading comments:', error)
    }
  }

  const handleComment = async (postId: string) => {
    if (!user?.id || !commentText[postId]?.trim()) return

    const commentContent = commentText[postId].trim()

    try {
      // Save to database first
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          user_name: user.name || 'Anonymous',
          avatar_url: user.avatarUrl || null,
          content: commentContent
        })
        .select()

      if (error) {
        console.error('Error posting comment:', error)
        alert('Failed to post comment. Please try again.')
        return
      }

      if (data && data[0]) {
        const newComment: Comment = {
          id: data[0].id,
          post_id: postId,
          user_id: user.id,
          user_name: user.name || 'Anonymous',
          avatar_url: user.avatarUrl || null,
          content: commentContent,
          created_at: data[0].created_at
        }

        // Update UI with the actual comment from database
        setComments(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), newComment]
        }))

        // Update comment count in database first
        const currentPost = posts.find(p => p.id === postId)
        const newCommentCount = (currentPost?.comments_count || 0) + 1
        
        const { error: updateError } = await supabase
          .from('community_posts')
          .update({ comments_count: newCommentCount })
          .eq('id', postId)

        if (updateError) {
          console.error('Error updating comment count:', updateError)
        }

        // Update comment count in UI
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, comments_count: newCommentCount }
            : post
        ))

        // Clear input
        setCommentText(prev => ({ ...prev, [postId]: '' }))

        console.log('Comment posted successfully:', newComment)
      }
    } catch (error) {
      console.error('Error posting comment:', error)
      alert('Failed to post comment. Please try again.')
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!user?.id) return

    try {
      setDeletingPost(postId)
      setShowDeleteConfirm(null) // Close confirmation dialog
      
      // Delete from database first
      const { error, count } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error deleting post:', error)
        alert('Failed to delete post. Please try again.')
        return
      }

      if (count === 0) {
        console.error('No post found to delete or unauthorized')
        alert('Post not found or you are not authorized to delete it.')
        return
      }

      // Only remove from UI if database deletion was successful
      setPosts(prev => prev.filter(post => post.id !== postId))
      
      // Also remove from comments state if any
      setComments(prev => {
        const newComments = { ...prev }
        delete newComments[postId]
        return newComments
      })

      console.log('Post deleted successfully')
    } catch (error) {
      console.error('Error deleting post:', error)
      alert('Failed to delete post. Please try again.')
    } finally {
      setDeletingPost(null)
    }
  }

  const toggleComments = (postId: string) => {
    const newShowComments = new Set(showComments)
    if (newShowComments.has(postId)) {
      newShowComments.delete(postId)
    } else {
      newShowComments.add(postId)
      if (!comments[postId]) {
        loadComments(postId)
      }
    }
    setShowComments(newShowComments)
  }

  const extractCityFromAddress = (address: string): string => {
    const parts = address.split(',').map(p => p.trim()).filter(Boolean)
    if (parts.length === 0) return 'Mumbai'
    // Prefer the last meaningful segment as city
    return parts[parts.length - 1]
  }

  const loadCurrentCity = async () => {
    try {
      if (!user?.id) return
      const { data, error } = await supabase
        .from('profiles')
        .select('home_address')
        .eq('id', user.id)
        .single()
      if (error) return
      if (data?.home_address) {
        setCurrentCity(extractCityFromAddress(data.home_address))
      }
    } catch {}
  }

  const loadLeaderboard = async () => {
    try {
      // Get total users count
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
      
      setTotalUsers(usersCount || 0)

      // Get top 5 riders by eco_points, filtered by current city if available
      let query = supabase
        .from('profiles')
        .select('id, name, eco_points, avatar_url, home_address')
        .order('eco_points', { ascending: false })
        .limit(5)

      if (currentCity) {
        query = query.ilike('home_address', `%${currentCity}%`)
      }

      let { data: topRidersData, error: ridersError } = await query
      
      // Fallback: if city-filtered returns empty, use global top 5
      if (!ridersError && (!topRidersData || topRidersData.length === 0)) {
        const fallback = await supabase
          .from('profiles')
          .select('id, name, eco_points, avatar_url, home_address')
          .order('eco_points', { ascending: false })
          .limit(5)
        if (!fallback.error) {
          topRidersData = fallback.data || []
        }
      }
      
      if (ridersError) throw ridersError

      // Get CO2 saved and ride counts for top riders
      const enrichedRiders = await Promise.all(
        (topRidersData || []).map(async (rider) => {
          // Get CO2 saved
          const { data: impactData } = await supabase
            .from('impact_logs')
            .select('co2_saved_kg')
            .eq('user_id', rider.id)
          
          const totalCO2 = (impactData || []).reduce((sum, log) => sum + Number(log.co2_saved_kg || 0), 0)
          
          // Get ride count
          const { count: rideCount } = await supabase
            .from('rides')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', rider.id)
          
          return {
            ...rider,
            co2Saved: `${Math.round(totalCO2 * 10) / 10}kg`,
            rides: rideCount || 0,
            points: rider.eco_points || 0
          }
        })
      )

      setTopRiders(enrichedRiders)

      // Calculate user's rank if logged in
      if (user?.id && usersCount) {
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
    } catch (error) {
      console.error('Error loading leaderboard:', error)
    }
  }

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("community_posts")
        .select("id,user_id,user_name,avatar_url,content,image_url,created_at,likes,comments_count,type,liked_by")
        .order("created_at", { ascending: false })
        .limit(50)
      if (error) throw error
      if (data && data.length > 0) {
        // Sync comment counts with actual comment counts from database
        const postsWithCorrectCounts = await Promise.all(
          data.map(async (post) => {
            const { count: actualCommentCount } = await supabase
              .from('comments')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id)
            
            return {
              ...post,
              comments_count: actualCommentCount || 0
            }
          })
        )
        
        setPosts(postsWithCorrectCounts as CommunityPost[])
        // Load roles for authors
        await loadRolesForPosts(postsWithCorrectCounts as CommunityPost[])
        
        // Initialize liked posts
        const userLikedPosts = new Set<string>()
        postsWithCorrectCounts.forEach(post => {
          if (post.liked_by && post.liked_by.includes(user?.id || '')) {
            userLikedPosts.add(post.id)
          }
        })
        setLikedPosts(userLikedPosts)
      } else {
        setPosts(demoSeed)
      }
    } catch {
      setPosts(demoSeed)
    } finally {
      setLoading(false)
    }
  }

  const loadRolesForPosts = async (postList: CommunityPost[]) => {
    try {
      const ids = Array.from(new Set(postList.map(p => p.user_id).filter((x): x is string => !!x)))
      if (ids.length === 0) return
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role')
        .in('id', ids)
      if (error) return
      const next: Record<string, string> = {}
      ;(data || []).forEach((row: any) => { if (row?.id) next[row.id] = row.role || 'rider' })
      setUserRoles(prev => ({ ...prev, ...next }))
    } catch {}
  }

  useEffect(() => {
    loadPosts()
    ;(async () => {
      await loadCurrentCity()
      await loadLeaderboard()
    })()
    // Broadcast channel for realtime without DB replication
    const broadcastChannel = supabase
      .channel("community-feed")
      .on("broadcast", { event: "new_post" }, (payload: any) => {
        const p = payload?.payload as CommunityPost | undefined
        if (!p) return
        setPosts((prev) => {
          const exists = prev.some((x) => x.id === p.id && x.created_at === p.created_at && x.content === p.content)
          if (exists) return prev
          return [p, ...prev]
        })
      })
      .subscribe()

    // Light polling to reconcile persisted posts
    const interval = setInterval(() => {
      loadPosts()
    }, 30000)

    return () => {
      clearInterval(interval)
      supabase.removeChannel(broadcastChannel)
    }
  }, [])

  useEffect(() => {
    // Reload leaderboard when city changes
    loadLeaderboard()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCity])

  const handlePost = async () => {
    const content = newPost.trim()
    if (!content && !selectedImage) return
    if (!user?.id) {
      alert('Please log in to post to the community.')
      return
    }

    let imageUrl: string | null = null
    const now = Date.now()
    const localId = `local-${now}`
    let localPost: CommunityPost

    try {
      // Upload image if selected
      if (selectedImage) {
        setUploadingImage(true)
        const ext = selectedImage.name.includes('.') ? selectedImage.name.split('.').pop() : 'jpg'
        const path = `community-images/${user.id}-${now}.${ext}`

        const { data: upload, error: uploadError } = await supabase.storage
          .from('avatars') // Using existing public bucket
          .upload(path, selectedImage, {
            upsert: true,
            cacheControl: '3600'
          })

        if (uploadError) {
          alert('Image upload failed. Please try a smaller image or different format.')
          throw uploadError
        }

        const { data: urlData } = await supabase.storage
          .from('avatars')
          .getPublicUrl(upload.path)

        imageUrl = urlData.publicUrl
      }

      const created_at = new Date(now).toISOString()
      const insert = {
        user_id: user.id,
        user_name: user.name || 'Anonymous EcoRider',
        avatar_url: (user as any).avatarUrl || null,
        content,
        image_url: imageUrl,
        likes: 0,
        comments_count: 0,
        type: null,
        liked_by: [] as string[],
        created_at,
      }

      // Optimistic local add
      localPost = {
        id: localId,
        user_id: insert.user_id,
        user_name: insert.user_name,
        avatar_url: insert.avatar_url,
        content: insert.content,
        image_url: imageUrl,
        created_at,
        likes: 0,
        comments_count: 0,
        type: null,
        liked_by: [],
      }

      setPosts((p) => [localPost, ...p])
      setNewPost("")
      setSelectedImage(null)
      setImagePreview(null)

      // Persist to DB and replace optimistic post with real row
      const { data: inserted, error: insertError } = await supabase
        .from('community_posts')
        .insert(insert)
        .select()
        .single()

      if (insertError) {
        alert('Posting failed. Please try again in a moment.')
        throw insertError
      }

      if (inserted) {
        const realPost: CommunityPost = {
          id: inserted.id,
          user_id: inserted.user_id,
          user_name: inserted.user_name,
          avatar_url: inserted.avatar_url,
          content: inserted.content,
          image_url: inserted.image_url,
          created_at: inserted.created_at,
          likes: inserted.likes,
          comments_count: inserted.comments_count,
          type: inserted.type,
          liked_by: inserted.liked_by || [],
        }
        setPosts((prev) => prev.map(p => (p.id === localId ? realPost : p)))

        // Broadcast to other clients
        supabase.channel('community-feed').send({
          type: 'broadcast',
          event: 'new_post',
          payload: realPost,
        })
      }
    } catch (error) {
      console.error('Error posting:', error)
      // Remove optimistic post on error
      setPosts((p) => p.filter(post => post.id !== localId))
      alert('Failed to post. Please try again.')
    } finally {
      setUploadingImage(false)
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Community</h1>
          <p className="text-muted-foreground">Connect with fellow eco-riders and celebrate sustainable choices</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-4">
                         {/* Composer */}
             <Card className="border-0 shadow-md bg-gradient-to-r from-primary/5 to-accent/5">
               <CardHeader className="pb-3">
                 <CardTitle className="flex items-center gap-2 text-lg">
                   <Users className="w-5 h-5 text-primary" />
                   Share with the community
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                 <Textarea
                   placeholder="Share your eco-ride, tips, or progress..."
                   value={newPost}
                   onChange={(e) => setNewPost(e.target.value)}
                   className="min-h-[100px] resize-none"
                 />
                 
                 {/* Image Upload */}
                 <div className="flex items-center gap-3">
                   <input
                     type="file"
                     accept="image/*"
                     onChange={handleImageSelect}
                     className="hidden"
                     id="image-upload"
                   />
                   <label
                     htmlFor="image-upload"
                     className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-primary cursor-pointer border border-dashed border-muted-foreground/30 rounded-lg hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
                   >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                     </svg>
                     Add Image
                   </label>
                   
                   {selectedImage && (
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={removeImage}
                       className="text-destructive hover:text-destructive"
                     >
                       Remove
                     </Button>
                   )}
                 </div>
                 
                 {/* Image Preview */}
                 {imagePreview && (
                   <div className="relative">
                     <img
                       src={imagePreview}
                       alt="Preview"
                       className="max-h-64 rounded-lg object-cover w-full"
                     />
                   </div>
                 )}
                 
                 <div className="flex items-center justify-between">
                   <div className="text-xs text-muted-foreground">
                     {selectedImage && `${selectedImage.name} (${(selectedImage.size / 1024 / 1024).toFixed(1)}MB)`}
                   </div>
                   <Button 
                     size="sm" 
                     onClick={handlePost} 
                     disabled={(!newPost.trim() && !selectedImage) || uploadingImage}
                     className="min-w-[80px] shadow-sm hover:shadow-md transition-all duration-200"
                   >
                     {uploadingImage ? (
                       <div className="flex items-center gap-2">
                         <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                         Posting...
                       </div>
                     ) : (
                       'Post'
                     )}
                   </Button>
                 </div>
               </CardContent>
             </Card>

            {/* Community Feed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Community Feed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="border-b border-border last:border-b-0 pb-4 last:pb-0 animate-pulse">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 bg-muted rounded-full"></div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <div className="h-4 bg-muted rounded w-24"></div>
                              <div className="h-3 bg-muted rounded w-20"></div>
                            </div>
                            <div className="h-4 bg-muted rounded w-full"></div>
                            <div className="h-4 bg-muted rounded w-3/4"></div>
                            <div className="flex gap-4">
                              <div className="h-3 bg-muted rounded w-12"></div>
                              <div className="h-3 bg-muted rounded w-12"></div>
                              <div className="h-3 bg-muted rounded w-12"></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No posts yet</p>
                    <p className="text-sm">Be the first to share something with the community!</p>
                  </div>
                ) : (
                  posts.map((post) => (
                                         <div key={post.id} className="border-b border-border last:border-b-0 pb-4 last:pb-0 hover:bg-muted/30 transition-colors rounded-lg p-2 -m-2">
                                                <div className="flex items-start gap-3">
                           <Avatar className="w-10 h-10 ring-2 ring-primary/10 hover:ring-primary/20 transition-all cursor-pointer hover:scale-105" onClick={() => openProfileModal(post.user_name, post.avatar_url, post.user_id)}>
                             <AvatarImage 
                               src={post.avatar_url || undefined} 
                               onError={(e)=>{(e.currentTarget as HTMLImageElement).src='/placeholder-user.jpg'}} 
                             />
                             <AvatarFallback className="text-xs font-medium">
                               {initialsFor(post.user_name || "E R")}
                             </AvatarFallback>
                           </Avatar>
                         <div className="flex-1">
                           <div className="flex items-center justify-between mb-2">
                             <div className="flex items-center gap-2">
                               <span className="font-semibold text-sm flex items-center gap-1">
                                 {post.user_name}
                                 {userRoles[post.user_id || ''] === 'admin' && (
                                   <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-blue-500 text-white animate-pulse" title="Verified admin">✓</span>
                                 )}
                               </span>
                               <span className="text-xs text-muted-foreground">
                                 {new Date(post.created_at).toLocaleString()}
                               </span>
                               {post.type === "challenge" && (
                                 <Badge variant="secondary" className="text-xs">
                                   Challenge
                                 </Badge>
                               )}
                               {post.type === "achievement" && (
                                 <Badge variant="default" className="text-xs bg-primary">
                                   Achievement
                                 </Badge>
                               )}
                             </div>
                             
                                                           {/* Three-dot menu for post owner */}
                              {post.user_id === user?.id && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem 
                                      onClick={() => setShowDeleteConfirm(post.id)}
                                      className="text-destructive focus:text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete Post
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                           </div>
                          
                          {post.content && (
                            <p className="text-sm mb-3 text-foreground leading-relaxed">{post.content}</p>
                          )}
                          
                          {/* Post Image */}
                          {post.image_url && (
                            <div className="mb-3">
                                                             <img
                                 src={post.image_url}
                                 alt="Post content"
                                 className="max-h-96 rounded-lg object-cover w-full cursor-pointer hover:opacity-95 transition-opacity shadow-sm"
                                 onClick={() => post.image_url && window.open(post.image_url, '_blank')}
                               />
                            </div>
                          )}
                          
                          {/* CO2 Saved Badge */}
                          {(post as any).co2Saved && (
                            <div className="flex items-center gap-2 mb-3">
                              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                <Leaf className="w-3 h-3" />
                                {(post as any).co2Saved} CO₂ saved
                              </div>
                            </div>
                          )}
                          
                                                     {/* Action Buttons */}
                           <div className="flex items-center gap-4 text-muted-foreground">
                             <button 
                               className={`flex items-center gap-1 text-xs transition-all duration-200 hover:scale-105 ${
                                 likedPosts.has(post.id) 
                                   ? 'text-red-500 hover:text-red-600' 
                                   : 'hover:text-primary'
                               }`}
                               onClick={() => handleLike(post.id)}
                             >
                               <Heart 
                                 className={`w-4 h-4 transition-all ${
                                   likedPosts.has(post.id) ? 'fill-current scale-110' : ''
                                 }`} 
                               />
                               <span>{post.likes ?? 0}</span>
                             </button>
                                                           <button 
                                className="flex items-center gap-1 text-xs hover:text-primary transition-all duration-200 hover:scale-105"
                                onClick={() => toggleComments(post.id)}
                              >
                                <MessageCircle className="w-4 h-4" />
                                <span>{post.comments_count || 0}</span>
                              </button>
                             <button className="flex items-center gap-1 text-xs hover:text-primary transition-all duration-200 hover:scale-105">
                               <Share2 className="w-4 h-4" />
                               <span>Share</span>
                             </button>
                           </div>

                           {/* Comments Section */}
                           {showComments.has(post.id) && (
                             <div className="mt-4 border-t border-border pt-4">
                               {/* Comments List */}
                               <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                                 {comments[post.id]?.length > 0 ? (
                                   comments[post.id].map((comment) => (
                                                                            <div key={comment.id} className="flex items-start gap-2">
                                         <Avatar className="w-6 h-6 cursor-pointer hover:scale-110 transition-transform" onClick={() => openProfileModal(comment.user_name, comment.avatar_url, comment.user_id)}>
                                           <AvatarImage src={comment.avatar_url || undefined} />
                                           <AvatarFallback className="text-xs">
                                             {initialsFor(comment.user_name)}
                                           </AvatarFallback>
                                         </Avatar>
                                       <div className="flex-1 bg-muted/30 rounded-lg p-2">
                                         <div className="flex items-center gap-2 mb-1">
                                           <span className="font-medium text-xs">{comment.user_name}</span>
                                           <span className="text-xs text-muted-foreground">
                                             {new Date(comment.created_at).toLocaleString()}
                                           </span>
                                         </div>
                                         <p className="text-sm">{comment.content}</p>
                                       </div>
                                     </div>
                                   ))
                                 ) : (
                                   <p className="text-sm text-muted-foreground text-center py-2">
                                     No comments yet. Be the first to comment!
                                   </p>
                                 )}
                               </div>

                               {/* Comment Input */}
                               <div className="flex items-center gap-2">
                                 <Input
                                   placeholder="Add a comment..."
                                   value={commentText[post.id] || ''}
                                   onChange={(e) => setCommentText(prev => ({ 
                                     ...prev, 
                                     [post.id]: e.target.value 
                                   }))}
                                   onKeyPress={(e) => {
                                     if (e.key === 'Enter' && !e.shiftKey) {
                                       e.preventDefault()
                                       handleComment(post.id)
                                     }
                                   }}
                                   className="flex-1 text-sm"
                                 />
                                 <Button
                                   size="sm"
                                   onClick={() => handleComment(post.id)}
                                   disabled={!commentText[post.id]?.trim()}
                                   className="px-3"
                                 >
                                   <Send className="w-4 h-4" />
                                 </Button>
                               </div>
                             </div>
                           )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Active Challenges (moved below feed) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-primary" />
                  Active Challenges
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeChallenges.map((challenge, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <challenge.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{challenge.title}</h4>
                        <p className="text-sm text-muted-foreground">{challenge.description}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-primary font-medium">{challenge.reward}</span>
                          <span className="text-xs text-muted-foreground">{challenge.participants} participants</span>
                          <span className="text-xs text-orange-600">{challenge.timeLeft}</span>
                        </div>
                      </div>
                    </div>
                    <Button size="sm">Join</Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* City Leaderboard */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Top EcoRiders - {currentCity}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topRiders.length > 0 ? (
                    topRiders.map((rider, index) => (
                      <div
                        key={rider.id}
                        className={`flex items-center gap-3 p-2 rounded-lg ${
                          rider.id === user?.id ? "bg-primary/10 border border-primary/20" : ""
                        }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            index === 0
                            ? "bg-yellow-500 text-white"
                              : index === 1
                              ? "bg-gray-400 text-white"
                                : index === 2
                                ? "bg-orange-500 text-white"
                                : "bg-muted text-muted-foreground"
                        }`}
                      >
                          {index + 1}
                      </div>
                        <div className="flex items-center gap-2 flex-1">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={rider.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {rider.name ? initialsFor(rider.name) : 'U'}
                            </AvatarFallback>
                          </Avatar>
                      <div className="flex-1">
                            <div className="font-medium text-sm">
                              {rider.id === user?.id ? 'You' : rider.name || 'Anonymous'}
                            </div>
                        <div className="text-xs text-muted-foreground">
                              {rider.points.toLocaleString()} pts • {rider.co2Saved} saved
                            </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">{rider.rides} rides</div>
                    </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <div className="text-sm">Loading leaderboard...</div>
                    </div>
                  )}
                  
                  {/* Show user's rank if not in top 5 */}
                  {userRank && userRank > 5 && (
                    <div className="pt-3 border-t border-muted">
                      <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-muted text-muted-foreground">
                          {userRank}
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={user?.avatarUrl || undefined} />
                            <AvatarFallback className="text-xs">
                              {user?.name ? initialsFor(user.name) : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium text-sm">You</div>
                            <div className="text-xs text-muted-foreground">
                              {user?.ecoPoints?.toLocaleString() || 0} pts
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          #{userRank} of {totalUsers}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Community Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Community Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{totalUsers.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Active EcoRiders</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {topRiders.length > 0 ? 
                        topRiders.reduce((sum, rider) => {
                          const co2 = parseFloat(rider.co2Saved.replace('kg', ''))
                          return sum + (isNaN(co2) ? 0 : co2)
                        }, 0).toFixed(1) + 'kg' : 
                        '--'
                      }
                    </div>
                    <div className="text-sm text-muted-foreground">CO₂ saved by top riders</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-sm font-medium text-green-800">
                      {userRank ? 
                        `You're ranked #${userRank} of ${totalUsers} riders! 🏆` : 
                        'Join the community and start earning points! 🌱'
                      }
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Profile Picture Modal */}
      <Dialog open={profileModalOpen} onOpenChange={setProfileModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Profile Picture</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-center">
            {selectedProfile && (
              <>
                <div className="flex justify-center">
                  <Avatar className="w-32 h-32 ring-4 ring-primary/20">
                    <AvatarImage 
                      src={selectedProfile.avatar || undefined} 
                      onError={(e)=>{(e.currentTarget as HTMLImageElement).src='/placeholder-user.jpg'}} 
                    />
                    <AvatarFallback className="text-3xl font-medium">
                      {initialsFor(selectedProfile.name)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{selectedProfile.name}</h3>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Badge variant="secondary" className="capitalize">
                      {selectedProfile.role}
                    </Badge>
                    {selectedProfile.role === 'admin' && (
                      <Badge variant="default" className="bg-blue-500">
                        Verified ✓
                      </Badge>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

       {/* Delete Confirmation Dialog */}
       <Dialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Delete Post</DialogTitle>
           </DialogHeader>
           <div className="space-y-4">
             <p className="text-muted-foreground">
               Are you sure you want to delete this post? This action cannot be undone.
             </p>
             <div className="flex justify-end gap-2">
               <Button 
                 variant="outline" 
                 onClick={() => setShowDeleteConfirm(null)}
                 disabled={!!deletingPost}
               >
                 Cancel
               </Button>
               <Button 
                 variant="destructive" 
                 onClick={() => showDeleteConfirm && handleDeletePost(showDeleteConfirm)}
                 disabled={!!deletingPost}
               >
                 {deletingPost ? (
                   <div className="flex items-center gap-2">
                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                     Deleting...
                   </div>
                 ) : (
                   'Delete'
                 )}
               </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>
    </div>
  )
}
