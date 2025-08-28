/**
 * Payment Configuration for EcoRide Wallet
 * Google Pay and UPI integration settings
 */

export const PAYMENT_CONFIG = {
  // Google Pay Configuration
  googlePay: {
    environment: 'TEST', // 'TEST' or 'PRODUCTION'
    merchantId: '12345678901234567890', // Your Google Pay merchant ID
    merchantName: 'EcoRide',
    allowedPaymentMethods: [
      {
        type: 'CARD',
        parameters: {
          allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
          allowedCardNetworks: ['MASTERCARD', 'VISA'],
        },
        tokenizationSpecification: {
          type: 'PAYMENT_GATEWAY',
          parameters: {
            gateway: 'example',
            gatewayMerchantId: 'exampleGatewayMerchantId',
          },
        },
      },
    ],
    transactionInfo: {
      totalPriceStatus: 'FINAL',
      totalPriceLabel: 'Total',
      totalPrice: '0.00',
      currencyCode: 'INR',
      countryCode: 'IN',
    },
  },

  // UPI Configuration
  upi: {
    merchantId: 'paradoxx8000@oksbi',
    merchantName: 'EcoRide',
    supportedApps: [
      'google_pay',
      'phonepe',
      'paytm',
      'amazon_pay',
      'bhim',
      'sbi_pay',
      'hdfc_payzapp',
      'icici_pockets',
    ],
  },

  // Payment Gateway Configuration
  gateway: {
    name: 'razorpay', // or 'stripe', 'paypal', etc.
    apiKey: process.env.RAZORPAY_KEY_ID,
    secretKey: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  },

  // Transaction Limits
  limits: {
    minAmount: 10, // Minimum ₹10
    maxAmount: 10000, // Maximum ₹10,000
    dailyLimit: 50000, // Daily limit ₹50,000
    monthlyLimit: 500000, // Monthly limit ₹5,00,000
  },

  // Fee Structure
  fees: {
    processingFee: 0.02, // 2% processing fee
    gst: 0.18, // 18% GST
    convenienceFee: 0.01, // 1% convenience fee
  },
}

export const PAYMENT_METHODS = [
  {
    id: 'google_pay',
    name: 'Google Pay',
    icon: 'google-pay',
    description: 'Fast and secure payments',
    isAvailable: true,
  },
  {
    id: 'upi',
    name: 'UPI',
    icon: 'upi',
    description: 'Unified Payments Interface',
    isAvailable: true,
  },
  {
    id: 'card',
    name: 'Credit/Debit Card',
    icon: 'card',
    description: 'Visa, Mastercard, RuPay',
    isAvailable: true,
  },
  {
    id: 'netbanking',
    name: 'Net Banking',
    icon: 'netbanking',
    description: 'Direct bank transfer',
    isAvailable: true,
  },
]

export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
}

export const TRANSACTION_TYPES = {
  TOPUP: 'topup',
  RIDE_PAYMENT: 'ride_payment',
  REFUND: 'refund',
  CASHBACK: 'cashback',
  POINTS_REDEMPTION: 'points_redemption',
}
