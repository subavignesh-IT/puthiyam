import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();
    if (!phone || !/^\d{10}$/.test(String(phone))) {
      return new Response(JSON.stringify({ error: 'Valid 10-digit phone required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const AUTH_KEY = Deno.env.get('MSG91_AUTH_KEY');
    const SENDER_ID = Deno.env.get('MSG91_SENDER_ID');
    const TEMPLATE_ID = Deno.env.get('MSG91_TEMPLATE_ID');
    if (!AUTH_KEY || !TEMPLATE_ID) {
      return new Response(JSON.stringify({ error: 'MSG91 not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const mobile = `91${phone}`;

    const url = new URL('https://control.msg91.com/api/v5/otp');
    url.searchParams.set('template_id', TEMPLATE_ID);
    url.searchParams.set('mobile', mobile);
    url.searchParams.set('otp', otp);
    url.searchParams.set('otp_length', '4');
    url.searchParams.set('otp_expiry', '5');

    const resp = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'authkey': AUTH_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });
    const data = await resp.json();
    console.log('MSG91 response', resp.status, JSON.stringify(data));

    if (!resp.ok || data?.type === 'error') {
      return new Response(JSON.stringify({ error: data?.message || 'Failed to send OTP', details: data }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, otp, requestId: data?.request_id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});