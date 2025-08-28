# EcoRide Wallet Payment System

## Overview

The EcoRide wallet system provides a comprehensive payment solution for users to add money to their wallet using multiple payment methods including Google Pay, UPI, and credit/debit cards.

## Features

### Payment Methods
- **Google Pay**: Direct integration with Google Pay API
- **UPI**: Unified Payments Interface with QR codes and deep links
- **Credit/Debit Cards**: Integration with Razorpay payment gateway
- **Net Banking**: Direct bank transfers

### Key Features
- Real-time payment processing
- Transaction history and tracking
- Fee calculation (processing fee, GST, convenience fee)
- Secure payment callbacks
- Admin transaction management
- Auto wallet balance updates

## Architecture

### Database Schema

#### `wallet_transactions` Table
```sql
CREATE TABLE wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    amount DECIMAL(10,2) NOT NULL,           -- Base amount before fees
    total_amount DECIMAL(10,2) NOT NULL,     -- Total amount including fees
    payment_method TEXT NOT NULL,            -- 'google_pay', 'upi', 'card', etc.
    status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'processing', 'completed', 'failed'
    type TEXT NOT NULL,                      -- 'topup', 'ride_payment', 'refund', etc.
    currency TEXT NOT NULL DEFAULT 'INR',
    description TEXT,
    payment_id TEXT,                         -- Payment gateway transaction ID
    payment_order JSONB,                     -- Payment gateway order details
    fees JSONB,                              -- Fee breakdown
    metadata JSONB DEFAULT '{}',             -- Additional transaction data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);
```

#### `profiles` Table Extension
```sql
ALTER TABLE profiles ADD COLUMN wallet_balance DECIMAL(10,2) NOT NULL DEFAULT 0;
```

### API Endpoints

#### 1. Create Payment Order
```
POST /api/wallet/create-payment
```
Creates a new payment order and transaction record.

**Request Body:**
```json
{
  "amount": 500,
  "paymentMethod": "upi",
  "userId": "user-uuid"
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "id": "transaction-uuid",
    "amount": 500,
    "totalAmount": 545.50,
    "paymentOrder": {...},
    "fees": {
      "processingFee": 10.00,
      "gst": 18.00,
      "convenienceFee": 5.00
    }
  }
}
```

#### 2. Payment Callback
```
POST /api/wallet/payment-callback
```
Handles payment confirmations from payment gateways.

**Request Body:**
```json
{
  "transactionId": "transaction-uuid",
  "status": "success",
  "paymentId": "payment-gateway-id",
  "signature": "payment-signature"
}
```

#### 3. Google Pay Processing
```
POST /api/wallet/process-google-pay
```
Processes Google Pay payment data.

#### 4. UPI Payment Creation
```
POST /api/wallet/create-upi-payment
```
Creates UPI payment intent with QR codes and deep links.

#### 5. Card Payment
```
GET /api/wallet/card-payment?txn=transaction-id
```
Opens card payment interface (Razorpay or demo).

## Configuration

### Payment Configuration (`lib/payment-config.ts`)

```typescript
export const PAYMENT_CONFIG = {
  // Google Pay Configuration
  googlePay: {
    environment: 'TEST', // 'TEST' or 'PRODUCTION'
    merchantId: 'your-google-pay-merchant-id',
    merchantName: 'EcoRide',
    allowedPaymentMethods: [...],
    transactionInfo: {...}
  },

  // UPI Configuration
  upi: {
    merchantId: 'paradoxx8000@oksbi',
    merchantName: 'EcoRide',
    supportedApps: ['google_pay', 'phonepe', 'paytm', ...]
  },

  // Payment Gateway Configuration
  gateway: {
    name: 'razorpay',
    apiKey: process.env.RAZORPAY_KEY_ID,
    secretKey: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET
  },

  // Transaction Limits
  limits: {
    minAmount: 10,      // Minimum ₹10
    maxAmount: 10000,   // Maximum ₹10,000
    dailyLimit: 50000,  // Daily limit ₹50,000
    monthlyLimit: 500000 // Monthly limit ₹5,00,000
  },

  // Fee Structure
  fees: {
    processingFee: 0.02,  // 2% processing fee
    gst: 0.18,           // 18% GST
    convenienceFee: 0.01 // 1% convenience fee
  }
}
```

## Environment Variables

```bash
# Google Pay
GOOGLE_PAY_MERCHANT_ID=your-google-pay-merchant-id

# Razorpay
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-secret-key
RAZORPAY_WEBHOOK_SECRET=your-razorpay-webhook-secret

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Components

### 1. GooglePayButton (`components/google-pay-button.tsx`)
- Loads Google Pay script dynamically
- Checks device compatibility
- Handles payment flow
- Processes payment data

### 2. UPIPaymentButton (`components/upi-payment-button.tsx`)
- Displays UPI QR code
- Provides deep links to UPI apps
- Shows payment instructions
- Handles manual UPI ID entry

### 3. WalletMain (`components/wallet-main.tsx`)
- Main wallet interface
- Payment method selection
- Transaction history
- Balance display

## Payment Flow

### 1. User Initiates Payment
1. User clicks "Add Money" button
2. Enters amount (₹10 - ₹10,000)
3. System validates amount and limits
4. Creates transaction record in database

### 2. Payment Method Selection
1. User chooses payment method:
   - Google Pay
   - UPI
   - Credit/Debit Card
2. System shows payment interface
3. User completes payment

### 3. Payment Processing
1. Payment gateway processes payment
2. Sends callback to `/api/wallet/payment-callback`
3. System verifies payment
4. Updates transaction status
5. Credits wallet balance

### 4. Completion
1. User receives success notification
2. Transaction appears in history
3. Wallet balance updated
4. Receipt generated

## Security Features

### Row Level Security (RLS)
- Users can only view their own transactions
- Admins can view all transactions
- Secure wallet balance updates

### Payment Verification
- Signature verification for payment gateways
- Transaction ID validation
- Amount verification
- User authentication checks

### Data Protection
- Encrypted payment data
- Secure API endpoints
- Audit logging
- PCI compliance considerations

## Database Functions

### `increment_wallet_balance(user_id, amount)`
Safely increments user's wallet balance.

### `decrement_wallet_balance(user_id, amount)`
Safely decrements user's wallet balance with insufficient balance check.

## Error Handling

### Common Error Scenarios
1. **Insufficient Balance**: When user tries to spend more than available
2. **Payment Failed**: When payment gateway returns error
3. **Invalid Amount**: When amount is outside allowed limits
4. **Network Errors**: When API calls fail
5. **Authentication Errors**: When user session is invalid

### Error Responses
```json
{
  "error": "Payment failed",
  "details": "Insufficient funds",
  "transactionId": "transaction-uuid",
  "status": "failed"
}
```

## Testing

### Demo Mode
When payment gateway keys are not configured, the system runs in demo mode:
- Simulated payment processing
- Demo transaction IDs
- Test payment flows
- No real money transactions

### Test Cards (Razorpay)
- Success: 4111 1111 1111 1111
- Failure: 4000 0000 0000 0002
- Expiry: Any future date
- CVV: Any 3 digits

## Deployment

### Prerequisites
1. Supabase database with RLS enabled
2. Payment gateway accounts (Google Pay, Razorpay)
3. SSL certificate for production
4. Environment variables configured

### Production Checklist
- [ ] Set `GOOGLE_PAY_ENVIRONMENT=PRODUCTION`
- [ ] Configure real payment gateway keys
- [ ] Set up webhook endpoints
- [ ] Enable SSL/TLS
- [ ] Configure monitoring and logging
- [ ] Test all payment flows
- [ ] Set up backup and recovery

## Monitoring

### Key Metrics
- Payment success rate
- Transaction volume
- Average transaction amount
- Payment method distribution
- Error rates by payment method

### Logging
- All payment attempts logged
- Error details captured
- User actions tracked
- Security events monitored

## Support

### Common Issues
1. **Google Pay not available**: Check device compatibility
2. **UPI payment pending**: Verify UPI ID and amount
3. **Card payment failed**: Check card details and limits
4. **Balance not updated**: Check transaction status

### Debugging
- Check browser console for errors
- Verify network connectivity
- Confirm payment gateway status
- Review transaction logs

## Future Enhancements

### Planned Features
- Recurring payments
- Payment scheduling
- Split payments
- International payments
- Cryptocurrency support
- Advanced analytics
- Fraud detection
- Automated reconciliation

### Integration Opportunities
- Multiple payment gateways
- Banking APIs
- Digital wallets
- QR code payments
- NFC payments
- Voice payments
