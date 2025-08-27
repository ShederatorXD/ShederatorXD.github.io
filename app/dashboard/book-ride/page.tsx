import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { BookRideMain } from "@/components/book-ride-main"

export default function BookRidePage() {
  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <BookRideMain />
    </div>
  )
}
