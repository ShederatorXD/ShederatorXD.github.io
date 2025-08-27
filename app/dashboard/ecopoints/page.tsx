import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { EcoPointsMain } from "@/components/ecopoints-main"

export default function EcoPointsPage() {
  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <EcoPointsMain />
    </div>
  )
}
