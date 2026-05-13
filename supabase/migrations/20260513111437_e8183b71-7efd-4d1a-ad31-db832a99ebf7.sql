CREATE POLICY "Sellers can view all orders"
ON public.orders
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'seller'::app_role));

CREATE POLICY "Sellers can view all loyalty claims"
ON public.loyalty_claims
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'seller'::app_role));