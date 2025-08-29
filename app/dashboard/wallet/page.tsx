import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { WalletMain } from "@/components/wallet-main"

export default function WalletPage() {
  return (
    <div className="min-h-screen bg-background flex">
      <DashboardSidebar />
      <WalletMain />
    </div>
  )
}
