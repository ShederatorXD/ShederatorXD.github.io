import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { TRANSACTION_STATUS } from '@/lib/payment-config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transactionId, status, paymentId, signature } = body

    if (!transactionId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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

    // Verify payment signature if provided (for security)
    if (signature) {
      // Add signature verification logic here
      // This would verify the payment gateway signature
    }

    let newStatus = TRANSACTION_STATUS.FAILED
    let walletUpdate = 0

    if (status === 'success' || status === 'completed') {
      newStatus = TRANSACTION_STATUS.COMPLETED
      walletUpdate = transaction.amount
    } else if (status === 'pending') {
      newStatus = TRANSACTION_STATUS.PROCESSING
    }

    // Update transaction status
    const { error: updateError } = await supabase
      .from('wallet_transactions')
      .update({
        status: newStatus,
        payment_id: paymentId,
        completed_at: newStatus === TRANSACTION_STATUS.COMPLETED ? new Date().toISOString() : null,
        metadata: {
          ...transaction.metadata,
          callbackData: body,
          updatedAt: new Date().toISOString(),
        }
      })
      .eq('id', transactionId)

    if (updateError) {
      console.error('Error updating transaction:', updateError)
      return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
    }

    // Update wallet balance if payment successful
    if (newStatus === TRANSACTION_STATUS.COMPLETED && walletUpdate > 0) {
      const { error: walletError } = await supabase
        .from('profiles')
        .update({
          wallet_balance: supabase.rpc('increment_wallet_balance', { 
            user_id: transaction.user_id, 
            amount: walletUpdate 
          })
        })
        .eq('id', transaction.user_id)

      if (walletError) {
        console.error('Error updating wallet balance:', walletError)
        // Don't fail the callback, just log the error
      }
    }

    return NextResponse.json({ 
      success: true, 
      status: newStatus,
      transactionId 
    })

  } catch (error) {
    console.error('Payment callback error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Also handle GET requests for redirects
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('txn')
    const status = searchParams.get('status')
    const paymentId = searchParams.get('payment_id')

    if (!transactionId || !status) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet?error=invalid_callback`)
    }

    // Process the redirect callback
    const response = await POST(new Request(request.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId, status, paymentId })
    }))

    if (response.ok) {
      const result = await response.json()
      if (result.status === 'completed') {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet?success=true&txn=${transactionId}`)
      } else {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet?error=payment_failed&txn=${transactionId}`)
      }
    } else {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet?error=callback_failed&txn=${transactionId}`)
    }

  } catch (error) {
    console.error('GET callback error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/wallet?error=callback_error`)
  }
}
