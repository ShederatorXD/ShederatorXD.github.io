import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PAYMENT_CONFIG } from '@/lib/payment-config'

export async function POST(request: NextRequest) {
  try {
    const { transactionId, amount, upiId } = await request.json()

    if (!transactionId || !amount) {
      return NextResponse.json({ 
        error: 'Missing required fields' 
      }, { status: 400 })
    }

    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get transaction details
    const { data: transaction, error: transactionError } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('id', transactionId)
      .single()

    if (transactionError || !transaction) {
      console.error('Transaction not found:', transactionId)
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Create UPI payment URL
    const upiUrl = `upi://pay?pa=${PAYMENT_CONFIG.upi.merchantId}&pn=${PAYMENT_CONFIG.upi.merchantName}&am=${amount}&tn=EcoRide Wallet Top-up - ${transactionId}&cu=INR`

    // Update transaction with UPI details
    const { error: updateError } = await supabase
      .from('wallet_transactions')
      .update({
        payment_method: 'upi',
        metadata: {
          ...transaction.metadata,
          upiId: upiId || 'manual',
          upiUrl,
          initiatedAt: new Date().toISOString(),
        }
      })
      .eq('id', transactionId)

    if (updateError) {
      console.error('Error updating transaction:', updateError)
      return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      transactionId,
      amount,
      upiUrl,
      merchantId: PAYMENT_CONFIG.upi.merchantId,
      merchantName: PAYMENT_CONFIG.upi.merchantName,
      instructions: [
        `Send ₹${amount} to ${PAYMENT_CONFIG.upi.merchantId}`,
        `Add transaction ID: ${transactionId} in remarks`,
        'Payment will be credited automatically once received',
      ]
    })

  } catch (error) {
    console.error('UPI payment creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
