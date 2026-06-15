
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS delivery_charge numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS free_delivery_quantity integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.product_wholesale_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  min_quantity integer NOT NULL CHECK (min_quantity > 0),
  price numeric NOT NULL CHECK (price >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, min_quantity)
);

GRANT SELECT ON public.product_wholesale_tiers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_wholesale_tiers TO authenticated;
GRANT ALL ON public.product_wholesale_tiers TO service_role;

ALTER TABLE public.product_wholesale_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Wholesale tiers are viewable by everyone"
  ON public.product_wholesale_tiers FOR SELECT
  USING (true);

CREATE POLICY "Sellers manage their own wholesale tiers"
  ON public.product_wholesale_tiers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_wholesale_tiers.product_id
        AND (p.seller_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_wholesale_tiers.product_id
        AND (p.seller_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

CREATE INDEX IF NOT EXISTS idx_wholesale_tiers_product ON public.product_wholesale_tiers(product_id);
