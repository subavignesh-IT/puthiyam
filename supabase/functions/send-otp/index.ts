import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/twilio'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone } = await req.json()
    if (!phone || !/^\d{10}$/.test(String(phone))) {
      return new Response(JSON.stringify({ error: 'Invalid phone number' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const lovableKey = Deno.env.get('LOVABLE_API_KEY')
    const twilioKey = Deno.env.get('TWILIO_API_KEY')
    const fromNumber = Deno.env.get('TWILIO_FROM_NUMBER')
    if (!lovableKey || !twilioKey || !fromNumber) {
      return new Response(JSON.stringify({ error: 'Twilio not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const otp = String(Math.floor(1000 + Math.random() * 9000))
    const to = `+91${phone}`
    const body = `Your PUTHIYAM PRODUCTS verification code is ${otp}. It expires in 5 minutes.`

    const resp = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        'X-Connection-Api-Key': twilioKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, From: fromNumber, Body: body }),
    })

    const data = await resp.json()
    console.log('Twilio response', resp.status, JSON.stringify(data))

    if (!resp.ok) {
      return new Response(JSON.stringify({ error: 'Failed to send OTP', details: data }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true, request_id: data?.sid, otp }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})