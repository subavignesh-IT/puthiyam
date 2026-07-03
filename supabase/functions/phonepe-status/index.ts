import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const MERCHANT_ID = Deno.env.get('PHONEPE_MERCHANT_ID') || ''
const SALT_KEY = Deno.env.get('PHONEPE_SALT_KEY') || ''
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
    if (!MERCHANT_ID || !SALT_KEY) {
      return new Response(JSON.stringify({ error: 'Payment gateway not configured.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const { merchantTransactionId } = await req.json()
    if (!merchantTransactionId) {
      return new Response(JSON.stringify({ error: 'merchantTransactionId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const path = `/pg/v1/status/${MERCHANT_ID}/${merchantTransactionId}`
    const xVerify = (await sha256Hex(path + SALT_KEY)) + '###' + SALT_INDEX

    let resp: Response
    try {
      resp = await fetch(`${HOST}${path}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': xVerify,
          'X-MERCHANT-ID': MERCHANT_ID,
          'accept': 'application/json',
        },
      })
    } catch (netErr) {
      console.error('phonepe-status: network error', netErr)
      return new Response(JSON.stringify({ status: 'PENDING', transient: true, error: 'network' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const raw = await resp.text()
    let data: any = {}
    try { data = JSON.parse(raw) } catch {}
    // data.code: PAYMENT_SUCCESS | PAYMENT_PENDING | PAYMENT_ERROR | PAYMENT_DECLINED | etc.
    let status: 'PAID' | 'PENDING' | 'FAILED' = 'PENDING'
    if (data?.code === 'PAYMENT_SUCCESS') status = 'PAID'
    else if (data?.code && data.code !== 'PAYMENT_PENDING') status = 'FAILED'
    return new Response(JSON.stringify({ status, code: data?.code, message: data?.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (e) {
    console.error('phonepe-status: unexpected', e)
    return new Response(JSON.stringify({ status: 'PENDING', transient: true }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})