import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { SupportMain } from "@/components/support-main"

export default function SupportPage() {
  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      <SupportMain />
    </div>
  )
}
