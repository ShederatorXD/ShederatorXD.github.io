import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { TRANSACTION_STATUS } from '@/lib/payment-config'

export async function POST(request: NextRequest) {
  try {
    const { transactionId, paymentData, amount } = await request.json()

    if (!transactionId || !paymentData || !amount) {
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

    // Verify payment data
    if (!paymentData.paymentMethodData || !paymentData.paymentMethodData.tokenizationData) {
      return NextResponse.json({ error: 'Invalid payment data' }, { status: 400 })
    }

    // In a real implementation, you would:
    // 1. Verify the payment token with Google Pay
    // 2. Process the payment through your payment gateway
    // 3. Verify the payment was successful
    // 4. Update the transaction status

    // For demo purposes, we'll simulate a successful payment
    const paymentId = `gp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Update transaction status
    const { error: updateError } = await supabase
      .from('wallet_transactions')
      .update({
        status: TRANSACTION_STATUS.COMPLETED,
        payment_id: paymentId,
        completed_at: new Date().toISOString(),
        metadata: {
          ...transaction.metadata,
          googlePayData: paymentData,
          processedAt: new Date().toISOString(),
        }
      })
      .eq('id', transactionId)

    if (updateError) {
      console.error('Error updating transaction:', updateError)
      return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
    }

    // Update wallet balance
    const { error: walletError } = await supabase
      .from('profiles')
      .update({
        wallet_balance: supabase.rpc('increment_wallet_balance', { 
          user_id: transaction.user_id, 
          amount: transaction.amount 
        })
      })
      .eq('id', transaction.user_id)

    if (walletError) {
      console.error('Error updating wallet balance:', walletError)
      // Don't fail the payment, just log the error
    }

    return NextResponse.json({
      success: true,
      transactionId,
      paymentId,
      amount: transaction.amount,
      status: TRANSACTION_STATUS.COMPLETED,
    })

  } catch (error) {
    console.error('Google Pay processing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
