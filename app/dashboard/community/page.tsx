import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { CommunityMain } from "@/components/community-main"

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <CommunityMain />
    </div>
  )
}
