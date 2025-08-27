import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { MyRidesMain } from "@/components/my-rides-main"

export default function MyRidesPage() {
  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <MyRidesMain />
    </div>
  )
}
