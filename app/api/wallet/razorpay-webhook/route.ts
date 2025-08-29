import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { TRANSACTION_STATUS } from '@/lib/payment-config'

// Helper: verify Razorpay webhook signature
function verifySignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature) return false
  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex')
  // Razorpay sends signature in hex for webhooks
  return expected === signature
}

export async function POST(request: NextRequest) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!webhookSecret) {
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    // Read raw body and signature
    const rawBody = await request.text()
    const signature = request.headers.get('x-razorpay-signature') || request.headers.get('X-Razorpay-Signature')

    // Verify signature
    const valid = verifySignature(rawBody, signature, webhookSecret)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Parse JSON after verifying signature
    const payload = JSON.parse(rawBody)
    const event = payload?.event as string | undefined

    // Initialize Supabase service client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Try to find our transactionId
    // Prefer payment notes.transactionId, else order notes/receipt (we set receipt: `txn_<id>`)
    const paymentEntity = payload?.payload?.payment?.entity
    const orderEntity = payload?.payload?.order?.entity
    let transactionId: string | null = null

    const noteTxn = paymentEntity?.notes?.transactionId || orderEntity?.notes?.transactionId
    if (noteTxn) transactionId = String(noteTxn)
    if (!transactionId) {
      const receipt: string | undefined = orderEntity?.receipt
      if (receipt && receipt.startsWith('txn_')) transactionId = receipt.replace('txn_', '')
    }

    if (!transactionId) {
      // Nothing to reconcile; acknowledge to prevent retries
      return NextResponse.json({ ok: true })
    }

    // Fetch transaction
    const { data: txn, error: txnErr } = await supabase
      .from('wallet_transactions')
      .select('*')
      .eq('id', transactionId)
      .single()

    if (txnErr || !txn) {
      // Acknowledge but log
      console.error('Webhook: transaction not found', transactionId, txnErr)
      return NextResponse.json({ ok: true })
    }

    // Map events → statuses
    let newStatus = txn.status
    if (event === 'payment.authorized' || event === 'order.paid' || event === 'payment.captured') {
      newStatus = TRANSACTION_STATUS.COMPLETED
    } else if (event === 'payment.failed') {
      newStatus = TRANSACTION_STATUS.FAILED
    }

    // Update transaction
    await supabase
      .from('wallet_transactions')
      .update({
        status: newStatus,
        payment_id: paymentEntity?.id || txn.payment_id,
        completed_at: newStatus === TRANSACTION_STATUS.COMPLETED ? new Date().toISOString() : txn.completed_at,
        metadata: {
          ...(txn.metadata || {}),
          webhookEvent: event,
          webhookPayloadId: paymentEntity?.id || orderEntity?.id,
          updatedAt: new Date().toISOString(),
        },
      })
      .eq('id', transactionId)

    // Credit wallet when completed
    if (newStatus === TRANSACTION_STATUS.COMPLETED) {
      // Read current balance then add txn.amount
      const { data: profile } = await supabase
        .from('profiles')
        .select('wallet_balance')
        .eq('id', txn.user_id)
        .single()

      const current = Number(profile?.wallet_balance || 0)
      const nextBalance = current + Number(txn.amount || 0)

      await supabase
        .from('profiles')
        .update({ wallet_balance: nextBalance })
        .eq('id', txn.user_id)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Razorpay webhook error:', err)
    // Always 200 to avoid repeated retries; log for investigation
    return NextResponse.json({ ok: true })
  }
}


