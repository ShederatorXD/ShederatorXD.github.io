import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PAYMENT_CONFIG, TRANSACTION_STATUS, TRANSACTION_TYPES } from '@/lib/payment-config'

export async function POST(request: NextRequest) {
  try {
    const { amount, paymentMethod, userId } = await request.json()

    if (!amount || !paymentMethod || !userId) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 })
    }

    const numAmount = parseFloat(amount)
    if (numAmount < PAYMENT_CONFIG.limits.minAmount || numAmount > PAYMENT_CONFIG.limits.maxAmount) {
      return NextResponse.json({ 
        error: `Amount must be between ₹${PAYMENT_CONFIG.limits.minAmount} and ₹${PAYMENT_CONFIG.limits.maxAmount}` 
      }, { status: 400 })
    }

    // Validate required env vars
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
      return NextResponse.json({ error: 'Server configuration error. Please set Supabase environment variables.' }, { status: 500 })
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Calculate fees BEFORE insert (total_amount is NOT NULL in schema)
    const processingFee = numAmount * PAYMENT_CONFIG.fees.processingFee
    const gst = (numAmount + processingFee) * PAYMENT_CONFIG.fees.gst
    const convenienceFee = numAmount * PAYMENT_CONFIG.fees.convenienceFee
    const totalAmount = numAmount + processingFee + gst + convenienceFee

    // Create transaction record with total_amount
    const { data: transaction, error: transactionError } = await supabase
      .from('wallet_transactions')
      .insert({
        user_id: userId,
        amount: numAmount,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        status: TRANSACTION_STATUS.PENDING,
        type: TRANSACTION_TYPES.TOPUP,
        currency: 'INR',
        description: `Wallet top-up of ₹${numAmount}`,
        metadata: {
          paymentMethod,
          timestamp: new Date().toISOString(),
        }
      })
      .select()
      .single()

    if (transactionError || !transaction) {
      console.error('Error creating transaction:', transactionError)
      return NextResponse.json({ error: transactionError?.message || 'Failed to create transaction' }, { status: 500 })
    }

    // Create payment order based on method
    let paymentOrder = null

    if (paymentMethod === 'google_pay') {
      paymentOrder = {
        transactionId: transaction.id,
        amount: totalAmount,
        currency: 'INR',
        description: `EcoRide Wallet Top-up - ₹${numAmount}`,
        merchantId: PAYMENT_CONFIG.googlePay.merchantId,
        merchantName: PAYMENT_CONFIG.googlePay.merchantName,
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/wallet/payment-callback`,
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet?success=true&txn=${transaction.id}`,
        failureUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet?error=true&txn=${transaction.id}`,
      }
    } else if (paymentMethod === 'upi') {
      paymentOrder = {
        transactionId: transaction.id,
        amount: totalAmount,
        currency: 'INR',
        upiId: PAYMENT_CONFIG.upi.merchantId,
        merchantName: PAYMENT_CONFIG.upi.merchantName,
        description: `EcoRide Wallet Top-up - ₹${numAmount}`,
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/wallet/payment-callback`,
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet?success=true&txn=${transaction.id}`,
        failureUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet?error=true&txn=${transaction.id}`,
      }
    } else {
      // For other payment methods, use Razorpay
      if (PAYMENT_CONFIG.gateway.apiKey) {
        const razorpay = require('razorpay')
        const rzp = new razorpay({
          key_id: PAYMENT_CONFIG.gateway.apiKey,
          key_secret: PAYMENT_CONFIG.gateway.secretKey,
        })

        const order = await rzp.orders.create({
          amount: Math.round(totalAmount * 100), // Razorpay expects amount in paise
          currency: 'INR',
          receipt: `txn_${transaction.id}`,
          notes: {
            transactionId: transaction.id,
            userId: userId,
            type: 'wallet_topup',
          },
        })

        paymentOrder = {
          orderId: order.id,
          transactionId: transaction.id,
          amount: totalAmount,
          currency: 'INR',
          key: PAYMENT_CONFIG.gateway.apiKey,
          description: `EcoRide Wallet Top-up - ₹${numAmount}`,
          callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/wallet/payment-callback`,
          successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet?success=true&txn=${transaction.id}`,
          failureUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet?error=true&txn=${transaction.id}`,
        }
      }
    }

    // Update transaction with payment order details
    await supabase
      .from('wallet_transactions')
      .update({
        payment_order: paymentOrder,
        total_amount: totalAmount,
        fees: {
          processingFee,
          gst,
          convenienceFee,
        }
      })
      .eq('id', transaction.id)

    return NextResponse.json({
      success: true,
      transaction: {
        id: transaction.id,
        amount: numAmount,
        totalAmount,
        paymentOrder,
        fees: {
          processingFee,
          gst,
          convenienceFee,
        }
      }
    })

  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
