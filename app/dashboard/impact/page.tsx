import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { ImpactMain } from "@/components/impact-main"

export default function ImpactPage() {
  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <ImpactMain />
    </div>
  )
}
