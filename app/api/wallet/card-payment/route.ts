import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { PAYMENT_CONFIG } from '@/lib/payment-config'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('txn')

    if (!transactionId) {
      return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 })
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

    // Create Razorpay order if API key is available
    if (PAYMENT_CONFIG.gateway.apiKey) {
      try {
        const razorpay = require('razorpay')
        const rzp = new razorpay({
          key_id: PAYMENT_CONFIG.gateway.apiKey,
          key_secret: PAYMENT_CONFIG.gateway.secretKey,
        })

        const order = await rzp.orders.create({
          amount: Math.round(transaction.total_amount * 100), // Convert to paise
          currency: 'INR',
          receipt: `txn_${transaction.id}`,
          notes: {
            transactionId: transaction.id,
            userId: transaction.user_id,
            type: 'wallet_topup',
          },
        })

        // Return Razorpay checkout page
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <title>EcoRide - Card Payment</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
          </head>
          <body>
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
              <div style="text-align: center;">
                <h2>EcoRide Wallet Top-up</h2>
                <p>Amount: ₹${transaction.total_amount}</p>
                <p>Processing payment...</p>
              </div>
            </div>
            <script>
              var options = {
                "key": "${PAYMENT_CONFIG.gateway.apiKey}",
                "amount": "${Math.round(transaction.total_amount * 100)}",
                "currency": "INR",
                "name": "EcoRide",
                "description": "Wallet Top-up - ₹${transaction.amount}",
                "order_id": "${order.id}",
                "handler": function (response) {
                  // Send success callback
                  fetch('/api/wallet/payment-callback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      transactionId: '${transaction.id}',
                      status: 'success',
                      paymentId: response.razorpay_payment_id,
                      orderId: response.razorpay_order_id,
                      signature: response.razorpay_signature
                    })
                  }).then(() => {
                    window.location.href = '/dashboard/wallet?success=true&txn=${transaction.id}';
                  });
                },
                "prefill": {
                  "name": "User",
                  "email": "user@example.com"
                },
                "theme": {
                  "color": "#10b981"
                }
              };
              var rzp1 = new Razorpay(options);
              rzp1.open();
            </script>
          </body>
          </html>
        `

        return new NextResponse(html, {
          headers: { 'Content-Type': 'text/html' },
        })

      } catch (error) {
        console.error('Razorpay error:', error)
        return NextResponse.json({ error: 'Payment gateway error' }, { status: 500 })
      }
    } else {
      // Fallback for demo
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>EcoRide - Card Payment</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
            .container { max-width: 400px; margin: 50px auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .success { color: #10b981; }
            .error { color: #ef4444; }
            button { background: #10b981; color: white; border: none; padding: 12px 24px; border-radius: 6px; cursor: pointer; margin: 10px 5px; }
            button:hover { background: #059669; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>EcoRide Wallet Top-up</h2>
            <p><strong>Amount:</strong> ₹${transaction.total_amount}</p>
            <p><strong>Transaction ID:</strong> ${transaction.id}</p>
            <hr>
            <p>This is a demo payment system. In production, this would integrate with a real payment gateway.</p>
            <div style="text-align: center;">
              <button onclick="simulateSuccess()" class="success">Simulate Success</button>
              <button onclick="simulateFailure()" class="error">Simulate Failure</button>
            </div>
          </div>
          <script>
            function simulateSuccess() {
              fetch('/api/wallet/payment-callback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  transactionId: '${transaction.id}',
                  status: 'success',
                  paymentId: 'demo_payment_${Date.now()}'
                })
              }).then(() => {
                window.location.href = '/dashboard/wallet?success=true&txn=${transaction.id}';
              });
            }
            function simulateFailure() {
              fetch('/api/wallet/payment-callback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  transactionId: '${transaction.id}',
                  status: 'failed',
                  paymentId: 'demo_failed_${Date.now()}'
                })
              }).then(() => {
                window.location.href = '/dashboard/wallet?error=payment_failed&txn=${transaction.id}';
              });
            }
          </script>
        </body>
        </html>
      `

      return new NextResponse(html, {
        headers: { 'Content-Type': 'text/html' },
      })
    }

  } catch (error) {
    console.error('Card payment error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
