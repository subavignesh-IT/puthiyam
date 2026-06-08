import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const MERCHANT_ID = Deno.env.get('PHONEPE_MERCHANT_ID')!
const SALT_KEY = Deno.env.get('PHONEPE_SALT_KEY')!
const SALT_INDEX = Deno.env.get('PHONEPE_SALT_INDEX') || '1'
const ENV = (Deno.env.get('PHONEPE_ENV') || 'SANDBOX').toUpperCase()
const HOST = ENV === 'PROD'
  ? 'https://api.phonepe.com/apis/hermes'
  : 'https://api-preprod.phonepe.com/apis/pg-sandbox'

async function sha256Hex(input: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const { amount, orderId, userId, phone, redirectUrl } = await req.json()
    if (!amount || !orderId || !userId) {
      return new Response(JSON.stringify({ error: 'amount, orderId, userId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const merchantTransactionId = `MT${Date.now()}${Math.floor(Math.random() * 1000)}`.slice(0, 34)
    const payload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId,
      merchantUserId: String(userId).replace(/-/g, '').slice(0, 32),
      amount: Math.round(Number(amount) * 100), // paise
      redirectUrl: redirectUrl || 'https://puthiyam-products.lovable.app/checkout',
      redirectMode: 'REDIRECT',
      mobileNumber: phone || undefined,
      paymentInstrument: { type: 'PAY_PAGE' },
    }
    const base64 = btoa(JSON.stringify(payload))
    const stringToSign = base64 + '/pg/v1/pay' + SALT_KEY
    const xVerify = (await sha256Hex(stringToSign)) + '###' + SALT_INDEX

    const resp = await fetch(`${HOST}/pg/v1/pay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': xVerify,
        'accept': 'application/json',
      },
      body: JSON.stringify({ request: base64 }),
    })
    const data = await resp.json()
    if (!data?.success) {
      return new Response(JSON.stringify({ error: data?.message || 'PhonePe init failed', data }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const url = data?.data?.instrumentResponse?.redirectInfo?.url
    return new Response(JSON.stringify({ merchantTransactionId, redirectUrl: url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})