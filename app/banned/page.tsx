export default function BannedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="max-w-md text-center p-8">
        <div className="text-6xl mb-4">🚫</div>
        <h1 className="text-3xl font-bold mb-2">Account Suspended</h1>
        <p className="text-muted-foreground mb-6">Our eco-sensors detected some not-so-eco behavior.</p>
        <div className="bg-white/10 rounded-lg p-4 mb-6">
          <p>
            While your rides cool down, plant a tree, do 10 squats, and think about
            how to be an eco-legend. We'll be here when you're ready to ride green again 🌿
          </p>
        </div>
        <p className="text-sm text-muted-foreground">If this was a mistake, contact support.</p>
      </div>
    </div>
  )
}


