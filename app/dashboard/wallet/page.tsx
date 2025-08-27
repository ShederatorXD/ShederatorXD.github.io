import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { WalletMain } from "@/components/wallet-main"

export default function WalletPage() {
  return (
    <div className="flex h-screen bg-background">
      <DashboardSidebar />
      <WalletMain />
    </div>
  )
}
