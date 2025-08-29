"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Home,
  Car,
  Clock,
  Coins,
  BarChart3,
  User,
  Leaf,
  LogOut,
  Users,
  Wallet,
  HelpCircle,
  Settings,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/components/AuthProvider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const sidebarItems = [
  {
    title: "Home",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Book Ride",
    href: "/dashboard/book-ride",
    icon: Car,
  },
  {
    title: "My Rides",
    href: "/dashboard/my-rides",
    icon: Clock,
  },
  {
    title: "EcoPoints",
    href: "/dashboard/ecopoints",
    icon: Coins,
  },
  {
    title: "Impact",
    href: "/dashboard/impact",
    icon: BarChart3,
  },
  {
    title: "Community",
    href: "/dashboard/community",
    icon: Users,
  },
  {
    title: "Wallet",
    href: "/dashboard/wallet",
    icon: Wallet,
  },
  {
    title: "Support",
    href: "/dashboard/support",
    icon: HelpCircle,
  },
  {
    title: "Admin",
    href: "/dashboard/admin",
    icon: Settings,
  },
  {
    title: "Profile",
    href: "/dashboard/profile",
    icon: User,
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const items = user?.role === 'admin' 
    ? sidebarItems 
    : sidebarItems.filter((i) => i.title !== 'Admin')

  return (
    <div className="w-72 bg-white border-r border-gray-100 flex flex-col shadow-sm">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center shadow-lg">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">EcoRide</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {items.map((item) => {
          const isActive = pathname === item.href
          return (
            <div key={item.href}>
              <Link href={item.href}>
                <Button
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3 h-12 transition-all duration-200 relative group",
                    isActive && "bg-primary text-white shadow-lg shadow-primary/25",
                    !isActive && "hover:bg-gray-50 hover:text-foreground hover:shadow",
                  )}
                >
                  <item.icon className={cn(
                    "w-5 h-5 transition-transform duration-200",
                    isActive && "scale-110",
                    !isActive && "group-hover:scale-110"
                  )} />
                  <span className={cn(
                    "font-medium transition-all duration-200",
                    isActive && "text-white font-semibold",
                    !isActive && "text-gray-700 group-hover:text-foreground"
                  )}>
                    {item.title}
                  </span>
                  {isActive && (
                    <div className="absolute right-2 w-2 h-2 bg-white rounded-full" />
                  )}
                </Button>
              </Link>

              {item.title === 'Profile' && (
                <div className="mt-2 p-4 border rounded-lg bg-gray-50/50">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-12 h-12 ring-2 ring-white shadow-sm">
                      <AvatarImage src={user?.avatarUrl || undefined} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white font-semibold">
                        {(user?.name || user?.email || 'U').slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm text-gray-900 truncate">
                        {user?.name || 'User'}
                      </div>
                      <div className="text-xs text-gray-500 truncate">{user?.email || ''}</div>
                      {user?.email?.endsWith('@kiit.ac.in') && (
                        <div className="mt-1">
                          <span className="text-[10px] px-2 py-1 rounded-full bg-blue-500/15 text-blue-600 font-medium">KIIT ADMIN</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start gap-2 h-10 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-200" 
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Removed bottom user section; profile moved under Profile nav item */}
    </div>
  )
}
