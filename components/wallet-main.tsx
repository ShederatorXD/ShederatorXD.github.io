"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wallet, Plus, CreditCard, ArrowUpRight, ArrowDownLeft, Gift, Star, Calendar, MapPin, AlertCircle, CheckCircle } from "lucide-react"
import { useState, useEffect } from "react"
import { useAuth } from "@/components/AuthProvider"
import { GooglePayButton } from "@/components/google-pay-button"
import { UPIPaymentButton } from "@/components/upi-payment-button"
import { PAYMENT_METHODS, PAYMENT_CONFIG } from "@/lib/payment-config"
import { useToast } from "@/components/ui/use-toast"

const recentTransactions = [
  {
    id: "TXN001",
    type: "ride",
    description: "EV Shuttle - Bandra to Andheri",
    amount: -85,
    date: "2024-01-15",
    time: "09:30 AM",
    status: "completed",
    ecoPointsEarned: 12,
    paymentMethod: "Wallet",
  },
  {
    id: "TXN002",
    type: "topup",
    description: "Wallet Top-up",
    amount: 500,
    date: "2024-01-14",
    time: "02:15 PM",
    status: "completed",
    paymentMethod: "UPI",
  },
  {
    id: "TXN003",
    type: "ride",
    description: "E-Bike - Powai to BKC",
    amount: -45,
    date: "2024-01-14",
    time: "06:45 PM",
    status: "completed",
    ecoPointsEarned: 8,
    paymentMethod: "EcoPoints",
    ecoPointsUsed: 90,
  },
  {
    id: "TXN004",
    type: "cashback",
    description: "EcoPoints Cashback (5%)",
    amount: 4,
    date: "2024-01-13",
    time: "11:20 AM",
    status: "completed",
    paymentMethod: "EcoPerks",
  },
  {
    id: "TXN005",
    type: "ride",
    description: "Ride Share - Malad to Goregaon",
    amount: -65,
    date: "2024-01-12",
    time: "08:15 AM",
    status: "completed",
    ecoPointsEarned: 10,
    paymentMethod: "Card",
  },
]

const paymentMethods = [
  {
    id: 1,
    type: "card",
    name: "HDFC Debit Card",
    last4: "4532",
    isDefault: true,
    icon: CreditCard,
  },
  {
    id: 2,
    type: "upi",
    name: "UPI - alex@paytm",
    last4: "paytm",
    isDefault: false,
    icon: CreditCard,
  },
  {
    id: 3,
    type: "wallet",
    name: "Paytm Wallet",
    last4: "8765",
    isDefault: false,
    icon: Wallet,
  },
]

export function WalletMain() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [balance, setBalance] = useState(1247)
  const [ecoPoints, setEcoPoints] = useState(1950)
  const [ecoPerksEarned, setEcoPerksEarned] = useState(97)
  const [showAddMoney, setShowAddMoney] = useState(false)
  const [showRedeemPoints, setShowRedeemPoints] = useState(false)
  const [addMoneyAmount, setAddMoneyAmount] = useState("")
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("")
  const [redeemAmount, setRedeemAmount] = useState("")
  const [processing, setProcessing] = useState(false)
  const [currentTransaction, setCurrentTransaction] = useState<any>(null)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [paymentError, setPaymentError] = useState<string | null>(null)

  const handleAddMoney = async () => {
    if (!user?.id) {
      toast({
        title: "Sign in required",
        description: "Please log in to add money to your wallet.",
        variant: "destructive",
      })
      return
    }

    if (!addMoneyAmount) {
      toast({
        title: "Error",
        description: "Please enter amount",
        variant: "destructive",
      })
      return
    }

    const amount = parseFloat(addMoneyAmount)
    if (amount < PAYMENT_CONFIG.limits.minAmount || amount > PAYMENT_CONFIG.limits.maxAmount) {
      toast({
        title: "Invalid Amount",
        description: `Amount must be between ₹${PAYMENT_CONFIG.limits.minAmount} and ₹${PAYMENT_CONFIG.limits.maxAmount}`,
        variant: "destructive",
      })
      return
    }

    setProcessing(true)

    try {
      // Create payment order
      const response = await fetch('/api/wallet/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          paymentMethod: selectedPaymentMethod || 'card',
          userId: user?.id,
        }),
      })

      if (!response.ok) {
        let message = 'Failed to create payment'
        try {
          const error = await response.json()
          message = error?.error || message
        } catch {}
        throw new Error(message)
      }

      const result = await response.json()
      setCurrentTransaction(result.transaction)
      setShowAddMoney(false)

      toast({
        title: "Payment Created",
        description: "Choose your payment method to complete the transaction",
      })

    } catch (error: any) {
      console.error('Payment creation failed:', error)
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to create payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const handlePaymentSuccess = (result: any) => {
    setPaymentSuccess(true)
    setCurrentTransaction(null)
    
    // Update wallet balance
    if (result.amount) {
      setBalance(prev => prev + result.amount)
    }

    toast({
      title: "Payment Successful!",
      description: `₹${result.amount} added to your wallet`,
    })

    // Add transaction to list
    const newTransaction = {
      id: result.transactionId || `TXN-${Date.now()}`,
      type: "topup",
      description: "Wallet Top-up",
      amount: result.amount,
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "completed",
      paymentMethod: selectedPaymentMethod,
    }

    recentTransactions.unshift(newTransaction)
  }

  const handlePaymentError = (error: any) => {
    setPaymentError(error.message || 'Payment failed')
    setCurrentTransaction(null)
    
    toast({
      title: "Payment Failed",
      description: error.message || "Payment failed. Please try again.",
      variant: "destructive",
    })
  }

  const handleRedeemPoints = async () => {
    if (!redeemAmount) {
      alert("Please enter amount to redeem")
      return
    }

    const amount = parseFloat(redeemAmount)
    const pointsNeeded = amount * 20 // 20 points = ₹1

    if (amount <= 0 || amount > balance) {
      alert("Amount must be between ₹1 and your wallet balance")
      return
    }

    if (pointsNeeded > ecoPoints) {
      alert(`You need ${pointsNeeded} points to redeem ₹${amount}`)
      return
    }

    setProcessing(true)

    try {
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Update balances
      setBalance(prev => prev + amount)
      setEcoPoints(prev => prev - pointsNeeded)

      // Add transaction
      const newTransaction = {
        id: `TXN-${Date.now()}`,
        type: "reward",
        description: "EcoPoints Redemption",
        amount: amount,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: "completed",
        paymentMethod: "EcoPoints",
        ecoPointsEarned: 0,
        ecoPointsUsed: pointsNeeded,
      }

      recentTransactions.unshift(newTransaction)

      alert(`₹${amount} added to wallet from ${pointsNeeded} EcoPoints!`)
      setShowRedeemPoints(false)
      setRedeemAmount("")
    } catch (error) {
      alert("Redemption failed. Please try again.")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Wallet & Payments</h1>
          <p className="text-muted-foreground">Manage your balance, payments, and earn EcoPerks</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Wallet Balance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-primary" />
                  Wallet Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-3xl font-bold text-foreground">₹{balance.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Available Balance</div>
                  </div>
                  <Button className="gap-2" onClick={() => setShowAddMoney(true)}>
                    <Plus className="w-4 h-4" />
                    Add Money
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="text-lg font-semibold text-primary">{ecoPoints.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">EcoPoints Balance</div>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="text-lg font-semibold text-green-600">₹{ecoPerksEarned.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">EcoPerks Earned</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Add Money Modal */}
            <Dialog open={showAddMoney} onOpenChange={setShowAddMoney}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Money to Wallet</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Amount (₹)</label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={addMoneyAmount}
                      onChange={(e) => setAddMoneyAmount(e.target.value)}
                      min={PAYMENT_CONFIG.limits.minAmount}
                      max={PAYMENT_CONFIG.limits.maxAmount}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Min: ₹{PAYMENT_CONFIG.limits.minAmount} • Max: ₹{PAYMENT_CONFIG.limits.maxAmount}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleAddMoney} 
                      disabled={processing || !addMoneyAmount}
                      className="flex-1"
                    >
                      {processing ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Creating Payment...
                        </div>
                      ) : (
                        "Continue to Payment"
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddMoney(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Payment Method Selection Modal */}
            <Dialog open={!!currentTransaction} onOpenChange={() => setCurrentTransaction(null)}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Choose Payment Method</DialogTitle>
                </DialogHeader>
                {currentTransaction && (
                  <div className="space-y-4">
                    {/* Amount Display */}
                    <div className="text-center p-4 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">₹{currentTransaction.amount}</div>
                      <div className="text-sm text-muted-foreground">EcoRide Wallet Top-up</div>
                      {currentTransaction.fees && (
                        <div className="text-xs text-muted-foreground mt-2">
                          <div>Base Amount: ₹{currentTransaction.amount}</div>
                          <div>Processing Fee: ₹{currentTransaction.fees.processingFee.toFixed(2)}</div>
                          <div>GST: ₹{currentTransaction.fees.gst.toFixed(2)}</div>
                          <div>Convenience Fee: ₹{currentTransaction.fees.convenienceFee.toFixed(2)}</div>
                          <div className="font-semibold mt-1">Total: ₹{currentTransaction.totalAmount.toFixed(2)}</div>
                        </div>
                      )}
                    </div>

                    {/* Payment Methods */}
                    <div className="space-y-3">
                      <GooglePayButton
                        amount={currentTransaction.totalAmount}
                        transactionId={currentTransaction.id}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                      />
                      
                      <UPIPaymentButton
                        amount={currentTransaction.totalAmount}
                        transactionId={currentTransaction.id}
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                      />

                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          // Handle card payment in same tab (avoids popup blockers)
                          window.location.href = `/api/wallet/card-payment?txn=${currentTransaction.id}`
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-5 h-5" />
                          Pay with Card
                        </div>
                      </Button>
                    </div>

                    <div className="text-xs text-muted-foreground text-center">
                      Secure payments powered by industry-standard encryption
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* EcoPerks Banner */}
            <Card className="bg-gradient-to-r from-primary/10 to-green-500/10 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <Gift className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">EcoPerks Active!</h3>
                    <p className="text-sm text-muted-foreground">
                      Get 5% cashback when paying with EcoPoints. Save the planet and your wallet!
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    5% Cashback
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Recent Transactions
                  </span>
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentTransactions.map((transaction, index) => (
                    <div key={transaction.id}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              transaction.type === "ride"
                                ? "bg-blue-100 text-blue-600"
                                : transaction.type === "topup"
                                  ? "bg-green-100 text-green-600"
                                  : "bg-orange-100 text-orange-600"
                            }`}
                          >
                            {transaction.type === "ride" ? (
                              <MapPin className="w-5 h-5" />
                            ) : transaction.type === "topup" ? (
                              <ArrowDownLeft className="w-5 h-5" />
                            ) : (
                              <Gift className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{transaction.description}</div>
                            <div className="text-xs text-muted-foreground">
                              {transaction.date} • {transaction.time} • {transaction.paymentMethod}
                            </div>
                            {transaction.ecoPointsEarned && (
                              <div className="flex items-center gap-1 mt-1">
                                <Star className="w-3 h-3 text-primary" />
                                <span className="text-xs text-primary">+{transaction.ecoPointsEarned} EcoPoints</span>
                              </div>
                            )}
                            {transaction.ecoPointsUsed && (
                              <div className="flex items-center gap-1 mt-1">
                                <Star className="w-3 h-3 text-orange-500" />
                                <span className="text-xs text-orange-600">-{transaction.ecoPointsUsed} EcoPoints</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div
                            className={`font-semibold ${transaction.amount > 0 ? "text-green-600" : "text-foreground"}`}
                          >
                            {transaction.amount > 0 ? "+" : ""}₹{Math.abs(transaction.amount)}
                          </div>
                          <Badge
                            variant={transaction.status === "completed" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                      {index < recentTransactions.length - 1 && <Separator className="mt-4" />}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start gap-2 bg-transparent" variant="outline" onClick={() => setShowAddMoney(true)}>
                  <Plus className="w-4 h-4" />
                  Add Money
                </Button>
                <Button className="w-full justify-start gap-2 bg-transparent" variant="outline">
                  <ArrowUpRight className="w-4 h-4" />
                  Send Money
                </Button>
                <Button className="w-full justify-start gap-2 bg-transparent" variant="outline" onClick={() => setShowRedeemPoints(true)}>
                  <Gift className="w-4 h-4" />
                  Redeem EcoPoints
                </Button>
              </CardContent>
            </Card>

            {/* Redeem Points Modal */}
            <Dialog open={showRedeemPoints} onOpenChange={setShowRedeemPoints}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Redeem EcoPoints</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Amount to Redeem (₹)</label>
                    <Input
                      type="number"
                      placeholder="Enter amount"
                      value={redeemAmount}
                      onChange={(e) => setRedeemAmount(e.target.value)}
                      min="1"
                      max={balance}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Points needed: {redeemAmount ? Math.round(parseFloat(redeemAmount) * 20) : 0} 
                      (20 points = ₹1)
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleRedeemPoints} 
                      disabled={processing || !redeemAmount}
                      className="flex-1"
                    >
                      {processing ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Processing...
                        </div>
                      ) : (
                        "Redeem Points"
                      )}
                    </Button>
                    <Button variant="outline" onClick={() => setShowRedeemPoints(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Payment Methods</span>
                  <Button variant="outline" size="sm">
                    Add New
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        method.isDefault ? "border-primary bg-primary/5" : "border-border"
                      }`}
                    >
                      <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                        <method.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{method.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {method.type === "card" ? `****${method.last4}` : method.last4}
                        </div>
                      </div>
                      {method.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          Default
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">This Month</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Spent</span>
                    <span className="font-semibold">₹1,240</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">EcoPoints Earned</span>
                    <span className="font-semibold text-primary">156 pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Cashback Earned</span>
                    <span className="font-semibold text-green-600">₹62</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Net Savings</span>
                    <span className="font-semibold text-green-600">₹62</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
