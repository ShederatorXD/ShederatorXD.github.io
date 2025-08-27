import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { CommunityMain } from "@/components/community-main"

export default function CommunityPage() {
  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      <CommunityMain />
    </div>
  )
}
