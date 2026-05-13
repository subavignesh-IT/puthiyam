import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const productId = url.searchParams.get('id');

    if (!productId) {
      return new Response('Product ID required', { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { data: product, error } = await supabase
      .from('products')
      .select('name, description, base_price, category, product_images(image_url, is_primary)')
      .eq('id', productId)
      .eq('is_active', true)
      .single();

    if (error || !product) {
      return new Response('Product not found', { status: 404, headers: corsHeaders });
    }

    const primaryImage = product.product_images?.find((img: any) => img.is_primary)?.image_url
      || product.product_images?.[0]?.image_url
      || '';

    const appUrl = Deno.env.get('APP_URL') || 'https://puthiyam-products.lovable.app';
    const productUrl = `${appUrl}/product/${productId}`;
    const title = `${product.name} | PUTHIYAM PRODUCTS`;
    const description = product.description || `Shop ${product.name} from PUTHIYAM PRODUCTS. Premium quality ${product.category}.`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="product">
  <meta property="og:url" content="${escapeHtml(productUrl)}">
  <meta property="og:image" content="${escapeHtml(primaryImage)}">
  <meta property="og:site_name" content="PUTHIYAM PRODUCTS">
  <meta property="product:price:amount" content="${product.base_price}">
  <meta property="product:price:currency" content="INR">
  
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(primaryImage)}">
  
  <link rel="canonical" href="${escapeHtml(productUrl)}">
  <script>
    window.location.replace('${escapeHtml(productUrl)}');
  </script>
  <style>
    body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0f172a; color: #e2e8f0; }
    .container { text-align: center; padding: 2rem; }
    a { color: #3b82f6; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${escapeHtml(product.name)}</h1>
    <p>${escapeHtml(description)}</p>
    <p>Redirecting to <a href="${escapeHtml(productUrl)}">PUTHIYAM PRODUCTS</a>...</p>
  </div>
</body>
</html>`;

    return new Response(html, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (err) {
    console.error('Edge function error:', err);
    return new Response('Internal server error', { status: 500, headers: corsHeaders });
  }
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
