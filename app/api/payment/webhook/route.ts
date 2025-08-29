import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { TRANSACTION_STATUS } from '@/lib/payment-config'

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!secret) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    const raw = await request.text()
    const signature = request.headers.get('x-razorpay-signature')
    const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex')
    if (!signature || signature !== expected) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const event = JSON.parse(raw)
    const type = event?.event as string | undefined
    const payment = event?.payload?.payment?.entity
    const order = event?.payload?.order?.entity

    // Init supabase service client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Derive transactionId from notes or receipt
    let transactionId: string | null = payment?.notes?.transactionId || order?.notes?.transactionId || null
    if (!transactionId && order?.receipt?.startsWith?.('txn_')) {
      transactionId = order.receipt.replace('txn_', '')
    }

    if (!transactionId) {
      return NextResponse.json({ ok: true })
    }

    // Fetch transaction
    const { data: txn } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('id', transactionId)
      .single()

    if (!txn) return NextResponse.json({ ok: true })

    let newStatus = txn.status
    if (type === 'payment.captured' || type === 'order.paid') newStatus = TRANSACTION_STATUS.COMPLETED
    if (type === 'payment.failed') newStatus = TRANSACTION_STATUS.FAILED

    await supabase
      .from('wallet_transactions')
      .update({
        status: newStatus,
        payment_id: payment?.id || txn.payment_id,
        completed_at: newStatus === TRANSACTION_STATUS.ComPLETED ? new Date().toISOString() : txn.completed_at,
        metadata: { ...(txn.metadata || {}), webhookEvent: type, updatedAt: new Date().toISOString() },
      })
      .eq('id', transactionId)

    if (newStatus === TRANSACTION_STATUS.COMPLETED) {
      // credit wallet
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('id', txn.user_id)
        .single()
      const current = Number(profile?.wallet_balance || 0)
      const next = current + Number(txn.amount || 0)
      await supabase
        .from('profiles')
        .update({ wallet_balance: next })
        .eq('id', txn.user_id)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('payment webhook error:', e)
    return NextResponse.json({ ok: true })
  }
}


