-- Allow sellers to add new categories and packing types (but not edit/delete)
CREATE POLICY "Sellers can add categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'seller'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Sellers can add packing types"
ON public.packing_types
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'seller'::app_role) OR has_role(auth.uid(), 'admin'::app_role));