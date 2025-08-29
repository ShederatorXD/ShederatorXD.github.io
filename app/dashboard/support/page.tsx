import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { SupportMain } from "@/components/support-main"

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <SupportMain />
    </div>
  )
}
