"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PAYMENT_CONFIG } from '@/lib/payment-config'
import { QrCode, Copy, ExternalLink } from 'lucide-react'

interface UPIPaymentButtonProps {
  amount: number
  transactionId: string
  onSuccess: (result: any) => void
  onError: (error: any) => void
  disabled?: boolean
}

export function UPIPaymentButton({ 
  amount, 
  transactionId, 
  onSuccess, 
  onError, 
  disabled = false 
}: UPIPaymentButtonProps) {
  const [showUPIDialog, setShowUPIDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [upiId, setUpiId] = useState('')
  const [copied, setCopied] = useState(false)

  const handleUPIClick = () => {
    setShowUPIDialog(true)
  }

  const handleUPIPayment = async () => {
    if (!upiId.trim()) {
      onError(new Error('Please enter UPI ID'))
      return
    }

    setIsLoading(true)

    try {
      // If Razorpay is configured, use Checkout (supports UPI Collect) and prefill user's UPI ID
      if (typeof window !== 'undefined' && (PAYMENT_CONFIG as any)?.gateway?.apiKey) {
        const encoded = encodeURIComponent(upiId.trim())
        window.location.href = `/api/wallet/card-payment?txn=${transactionId}&upiId=${encoded}`
        return
      }

      // Create UPI payment intent (fallback demo flow)
      const response = await fetch('/api/wallet/create-upi-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          amount,
          upiId: upiId.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create UPI payment')
      }

      const result = await response.json()
      
      // Open UPI app or redirect
      if (result.paymentUrl) {
        window.open(result.paymentUrl, '_blank')
      }

      onSuccess(result)
      setShowUPIDialog(false)

    } catch (error) {
      console.error('UPI payment failed:', error)
      onError(error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyUPIId = async () => {
    try {
      await navigator.clipboard.writeText(PAYMENT_CONFIG.upi.merchantId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy UPI ID:', error)
    }
  }

  const openUPIApp = (app: string) => {
    const upiUrl = `upi://pay?pa=${PAYMENT_CONFIG.upi.merchantId}&pn=${PAYMENT_CONFIG.upi.merchantName}&am=${amount}&tn=EcoRide Wallet Top-up`
    
    switch (app) {
      case 'google_pay':
        window.open(`googleplay://upi?pa=${PAYMENT_CONFIG.upi.merchantId}&pn=${PAYMENT_CONFIG.upi.merchantName}&am=${amount}&tn=EcoRide Wallet Top-up`, '_blank')
        break
      case 'phonepe':
        window.open(`phonepe://pay?pa=${PAYMENT_CONFIG.upi.merchantId}&pn=${PAYMENT_CONFIG.upi.merchantName}&am=${amount}&tn=EcoRide Wallet Top-up`, '_blank')
        break
      case 'paytm':
        window.open(`paytmmp://pay?pa=${PAYMENT_CONFIG.upi.merchantId}&pn=${PAYMENT_CONFIG.upi.merchantName}&am=${amount}&tn=EcoRide Wallet Top-up`, '_blank')
        break
      default:
        window.open(upiUrl, '_blank')
    }
  }

  return (
    <>
      <Button
        onClick={handleUPIClick}
        disabled={disabled}
        variant="outline"
        className="w-full"
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          Pay with UPI
        </div>
      </Button>

      <Dialog open={showUPIDialog} onOpenChange={setShowUPIDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Pay with UPI</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Amount Display */}
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">₹{amount}</div>
              <div className="text-sm text-muted-foreground">EcoRide Wallet Top-up</div>
            </div>

            {/* UPI ID Display */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Pay to UPI ID:</label>
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <span className="font-mono text-sm">{PAYMENT_CONFIG.upi.merchantId}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyUPIId}
                  className="h-8 w-8 p-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              {copied && (
                <div className="text-xs text-green-600">UPI ID copied!</div>
              )}
            </div>

            {/* QR Code */}
            <div className="text-center">
              <div className="inline-block p-4 bg-white rounded-lg border">
                <QrCode className="w-32 h-32" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Scan QR code with any UPI app
              </p>
            </div>

            {/* UPI Apps */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Open UPI App:</label>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_CONFIG.upi.supportedApps.map((app) => (
                  <Button
                    key={app}
                    variant="outline"
                    size="sm"
                    onClick={() => openUPIApp(app)}
                    className="justify-start gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    {app.replace('_', ' ').toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>

            {/* Manual UPI ID Entry */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Or enter your UPI ID:</label>
              <Input
                placeholder="yourname@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={handleUPIPayment}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : (
                  'Pay ₹' + amount
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowUPIDialog(false)}
              >
                Cancel
              </Button>
            </div>

            {/* Instructions */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Send ₹{amount} to {PAYMENT_CONFIG.upi.merchantId}</p>
              <p>• Add transaction ID: {transactionId} in remarks</p>
              <p>• Payment will be credited automatically</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
