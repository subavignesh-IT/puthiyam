
CREATE TABLE public.loyalty_claims (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  coupon_code TEXT NOT NULL,
  stamps_completed INTEGER NOT NULL DEFAULT 10,
  claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  order_id UUID REFERENCES public.orders(id),
  is_redeemed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.loyalty_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own claims" ON public.loyalty_claims FOR INSERT TO public WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own claims" ON public.loyalty_claims FOR SELECT TO public USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all claims" ON public.loyalty_claims FOR SELECT TO public USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update claims" ON public.loyalty_claims FOR UPDATE TO public USING (has_role(auth.uid(), 'admin'::app_role));
