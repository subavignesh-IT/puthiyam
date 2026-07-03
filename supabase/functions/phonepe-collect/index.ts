import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const MERCHANT_ID = Deno.env.get('PHONEPE_MERCHANT_ID') || ''
const SALT_KEY = Deno.env.get('PHONEPE_SALT_KEY') || ''
const SALT_INDEX = Deno.env.get('PHONEPE_SALT_INDEX') || '1'
const ENV = (Deno.env.get('PHONEPE_ENV') || 'SANDBOX').toUpperCase()
const HOST = ENV === 'PROD'
  ? 'https://api.phonepe.com/apis/hermes'
  : 'https://api-preprod.phonepe.com/apis/pg-sandbox'

// Standard UPI VPA format: 2–256 chars local part, @, 2–64 chars handle
const VPA_REGEX = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,63}$/

function friendlyError(code: string | undefined, message: string | undefined): string {
  const c = (code || '').toUpperCase()
  if (c.includes('VPA')) return "That UPI ID doesn't look valid or isn't reachable. Double-check and try again."
  if (c.includes('AUTH')) return 'Payment gateway configuration issue. Please contact support.'
  if (c.includes('KEY_NOT_CONFIGURED')) return 'Payment gateway is not configured. Please contact support.'
  if (c.includes('BAD_REQUEST')) return 'Payment request was rejected. Please verify the UPI ID and amount.'
  if (c.includes('TIMEOUT')) return 'Payment gateway timed out. Please try again.'
  if (c.includes('TRANSACTION_NOT_FOUND')) return 'Transaction not found on gateway. Please retry.'
  return message || 'Could not send payment request. Please try again.'
}

async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    if (!MERCHANT_ID || !SALT_KEY) {
      console.error('phonepe-collect: missing PHONEPE_MERCHANT_ID or PHONEPE_SALT_KEY')
      return new Response(
        JSON.stringify({ error: 'Payment gateway is not configured. Please contact support.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    const { amount, orderId, userId, payerVpa } = await req.json()
    if (!amount || !orderId || !userId || !payerVpa) {
      return new Response(
        JSON.stringify({ error: 'amount, orderId, userId, payerVpa required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    const vpa = String(payerVpa).trim().toLowerCase()
    if (!VPA_REGEX.test(vpa)) {
      return new Response(
        JSON.stringify({ error: 'Please enter a valid UPI ID in the format name@bank (e.g. yourname@okhdfcbank).' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const merchantTransactionId = `MT${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(0, 34)
    // UPI Collect: pushes payment request to the payer's default UPI app
    const payload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId,
      merchantUserId: String(userId).replace(/-/g, '').slice(0, 32),
      amount: Math.round(amt * 100), // paise
      paymentInstrument: {
        type: 'UPI_COLLECT',
        vpa,
      },
    }
    const base64 = btoa(JSON.stringify(payload))
    const stringToSign = base64 + '/pg/v1/pay' + SALT_KEY
    const xVerify = (await sha256Hex(stringToSign)) + '###' + SALT_INDEX

    let resp: Response
    try {
      resp = await fetch(`${HOST}/pg/v1/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': xVerify,
          'X-MERCHANT-ID': MERCHANT_ID,
          accept: 'application/json',
        },
        body: JSON.stringify({ request: base64 }),
      })
    } catch (netErr) {
      console.error('phonepe-collect: network error', netErr)
      return new Response(
        JSON.stringify({ error: 'Could not reach payment gateway. Check your internet and try again.' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    const raw = await resp.text()
    let data: any = {}
    try { data = JSON.parse(raw) } catch { /* keep raw */ }
    console.log('phonepe-collect response', { status: resp.status, code: data?.code, message: data?.message })
    if (!data?.success) {
      const msg = friendlyError(data?.code, data?.message)
      return new Response(
        JSON.stringify({ error: msg, code: data?.code || null }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }
    return new Response(
      JSON.stringify({ merchantTransactionId, code: data?.code || 'PAYMENT_INITIATED' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (e) {
    console.error('phonepe-collect: unexpected', e)
    return new Response(
      JSON.stringify({ error: 'Something went wrong sending the payment request. Please try again.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})