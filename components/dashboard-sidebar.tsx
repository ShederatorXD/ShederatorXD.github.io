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
    <div className="w-64 bg-card border-r border-border flex flex-col slide-in-left">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center map-pulse">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-foreground">EcoRide</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-12 nav-icon-bounce btn-hover transition-all duration-200 relative",
                  isActive && "bg-primary text-primary-foreground shadow-md z-10",
                  !isActive && "hover:bg-accent hover:text-accent-foreground hover:shadow-sm hover:z-20",
                )}
              >
                <item.icon className={cn("w-5 h-5", isActive && "map-pulse")} />
                <span className={cn("font-medium", isActive && "text-primary-foreground font-semibold")}>
                  {item.title}
                </span>
              </Button>
            </Link>
          )
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 mb-4 fade-in">
          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="font-medium text-sm">{user?.name || 'User'}</div>
            <div className="text-xs text-muted-foreground">{user?.email || ''}</div>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 btn-hover" onClick={handleLogout}>
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}
