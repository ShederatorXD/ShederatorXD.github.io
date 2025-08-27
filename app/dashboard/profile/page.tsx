import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { ProfileMain } from "@/components/profile-main"

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <ProfileMain />
    </div>
  )
}
