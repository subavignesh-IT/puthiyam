
CREATE TABLE public.seller_loyalty_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id uuid NOT NULL UNIQUE,
  enabled boolean NOT NULL DEFAULT true,
  stamps_required integer NOT NULL DEFAULT 10 CHECK (stamps_required > 0 AND stamps_required <= 50),
  reward_amount numeric NOT NULL DEFAULT 50 CHECK (reward_amount >= 0),
  min_order_value numeric NOT NULL DEFAULT 0 CHECK (min_order_value >= 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_loyalty_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view loyalty settings"
  ON public.seller_loyalty_settings FOR SELECT
  USING (true);

CREATE POLICY "Sellers can insert their own loyalty settings"
  ON public.seller_loyalty_settings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id AND (has_role(auth.uid(), 'seller'::app_role) OR has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "Sellers can update their own loyalty settings"
  ON public.seller_loyalty_settings FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id);

CREATE POLICY "Admins can manage all loyalty settings"
  ON public.seller_loyalty_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_seller_loyalty_settings_updated_at
  BEFORE UPDATE ON public.seller_loyalty_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
