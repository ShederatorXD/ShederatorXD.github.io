"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { PAYMENT_CONFIG } from '@/lib/payment-config'

interface GooglePayButtonProps {
  amount: number
  transactionId: string
  onSuccess: (result: any) => void
  onError: (error: any) => void
  disabled?: boolean
}

declare global {
  interface Window {
    google: {
      payments: {
        api: {
          PaymentsClient: any
          Button: any
          ReadyToPayRequest: any
          PaymentDataRequest: any
          PaymentData: any
        }
      }
    }
  }
}

export function GooglePayButton({ 
  amount, 
  transactionId, 
  onSuccess, 
  onError, 
  disabled = false 
}: GooglePayButtonProps) {
  const [isGooglePayReady, setIsGooglePayReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Load Google Pay script
    const script = document.createElement('script')
    script.src = 'https://pay.google.com/gp/p/js/pay.js'
    script.onload = () => {
      initializeGooglePay()
    }
    script.onerror = () => {
      console.error('Failed to load Google Pay script')
      onError(new Error('Google Pay not available'))
    }
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [])

  const initializeGooglePay = () => {
    try {
      if (!window.google?.payments?.api) {
        throw new Error('Google Pay API not available')
      }

      const { PaymentsClient, ReadyToPayRequest, PaymentDataRequest } = window.google.payments.api

      const paymentsClient = new PaymentsClient({
        environment: PAYMENT_CONFIG.googlePay.environment as 'TEST' | 'PRODUCTION'
      })

      const readyToPayRequest: any = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: PAYMENT_CONFIG.googlePay.allowedPaymentMethods,
        transactionInfo: {
          ...PAYMENT_CONFIG.googlePay.transactionInfo,
          totalPrice: amount.toString(),
          totalPriceStatus: 'FINAL',
        },
        merchantInfo: {
          merchantId: PAYMENT_CONFIG.googlePay.merchantId,
          merchantName: PAYMENT_CONFIG.googlePay.merchantName,
        },
      }

      paymentsClient.isReadyToPay(readyToPayRequest)
        .then((response: any) => {
          if (response.result) {
            setIsGooglePayReady(true)
          } else {
            console.log('Google Pay not ready:', response)
            onError(new Error('Google Pay not available on this device'))
          }
        })
        .catch((error: any) => {
          console.error('Google Pay ready check failed:', error)
          onError(error)
        })

    } catch (error) {
      console.error('Google Pay initialization failed:', error)
      onError(error)
    }
  }

  const handleGooglePayClick = async () => {
    if (!isGooglePayReady || disabled) return

    setIsLoading(true)

    try {
      const { PaymentsClient, PaymentDataRequest } = window.google.payments.api

      const paymentsClient = new PaymentsClient({
        environment: PAYMENT_CONFIG.googlePay.environment as 'TEST' | 'PRODUCTION'
      })

      const paymentDataRequest: any = {
        apiVersion: 2,
        apiVersionMinor: 0,
        allowedPaymentMethods: PAYMENT_CONFIG.googlePay.allowedPaymentMethods,
        transactionInfo: {
          totalPriceStatus: 'FINAL',
          totalPriceLabel: 'Total',
          totalPrice: amount.toString(),
          currencyCode: 'INR',
          countryCode: 'IN',
        },
        merchantInfo: {
          merchantId: PAYMENT_CONFIG.googlePay.merchantId,
          merchantName: PAYMENT_CONFIG.googlePay.merchantName,
        },
        paymentDataCallbacks: {
          onPaymentAuthorized: async (paymentData: any) => {
            try {
              const result = await processGooglePayPayment(paymentData)
              onSuccess(result)
              return { transactionState: 'SUCCESS' }
            } catch (e: any) {
              onError(e)
              return {
                transactionState: 'ERROR',
                error: { intent: 'PAYMENT_AUTHORIZATION', message: e?.message || 'Authorization failed' }
              }
            }
          }
        }
      }

      await paymentsClient.loadPaymentData(paymentDataRequest)

    } catch (error: any) {
      console.error('Google Pay payment failed:', error)
      if (error.statusCode === 'CANCELED') {
        onError(new Error('Payment cancelled by user'))
      } else {
        onError(error)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const processGooglePayPayment = async (paymentData: any) => {
    // Send payment data to your backend for processing
    const response = await fetch('/api/wallet/process-google-pay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transactionId,
        paymentData,
        amount,
      }),
    })

    if (!response.ok) {
      throw new Error('Payment processing failed')
    }

    return await response.json()
  }

  if (!isGooglePayReady) {
    return (
      <Button 
        variant="outline" 
        disabled 
        className="w-full"
      >
        Google Pay Not Available
      </Button>
    )
  }

  return (
    <Button
      onClick={handleGooglePayClick}
      disabled={disabled || isLoading}
      className="w-full bg-black text-white hover:bg-gray-800"
    >
      {isLoading ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          Processing...
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Pay ₹{amount}
        </div>
      )}
    </Button>
  )
}
