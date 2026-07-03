import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "get_product",
  title: "Get product details",
  description: "Fetch a single product with its variants and images by product id.",
  inputSchema: {
    product_id: z.string().uuid().describe("Product UUID."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ product_id }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    const [{ data: product, error: pErr }, variants, images] = await Promise.all([
      supabase.from("products").select("*").eq("id", product_id).maybeSingle(),
      supabase.from("product_variants").select("*").eq("product_id", product_id),
      supabase.from("product_images").select("*").eq("product_id", product_id),
    ]);
    if (pErr) return { content: [{ type: "text", text: pErr.message }], isError: true };
    if (!product) return { content: [{ type: "text", text: "Product not found" }], isError: true };
    const payload = { product, variants: variants.data ?? [], images: images.data ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(payload) }],
      structuredContent: payload,
    };
  },
});