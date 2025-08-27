import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { AdminMain } from "@/components/admin-main"

export default function AdminPage() {
  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      <AdminMain />
    </div>
  )
}
