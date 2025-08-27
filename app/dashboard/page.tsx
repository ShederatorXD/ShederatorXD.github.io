import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { DashboardMain } from "@/components/dashboard-main"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <DashboardMain />
    </div>
  )
}
