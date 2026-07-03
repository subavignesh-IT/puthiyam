import { defineTool } from "@lovable.dev/mcp-js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

export default defineTool({
  name: "search_products",
  title: "Search products",
  description:
    "Search Puthiyam Products catalog by name/description with optional category filter. Returns active in-stock products.",
  inputSchema: {
    query: z.string().trim().default("").describe("Text to match in product name or description. Empty returns latest."),
    category: z.string().optional().describe("Optional category filter (exact match)."),
    limit: z.number().int().min(1).max(50).default(20),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, category, limit }) => {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
    let q = supabase
      .from("products")
      .select("id,name,description,category,base_price,measurement_unit,is_on_sale,discount_amount,discount_type")
      .eq("is_active", true)
      .limit(limit);
    if (category) q = q.eq("category", category);
    if (query) q = q.or(`name.ilike.%${query}%,description.ilike.%${query}%`);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { products: data ?? [] },
    };
  },
});