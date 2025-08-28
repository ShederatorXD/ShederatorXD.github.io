import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { AdminMain } from "@/components/admin-main"
import { AdminSupportTickets } from "@/components/admin-support-tickets"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminPage() {
  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      <div className="flex-1 overflow-auto">
        <Tabs defaultValue="dashboard" className="h-full">
          <div className="border-b px-6 py-4">
            <TabsList>
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="support">Support Tickets</TabsTrigger>
            </TabsList>
          </div>
          <div className="p-6">
            <TabsContent value="dashboard">
              <AdminMain />
            </TabsContent>
            <TabsContent value="support">
              <AdminSupportTickets />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
