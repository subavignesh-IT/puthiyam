
-- 1. seller_requests
CREATE TABLE public.seller_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  shop_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.seller_requests TO authenticated;
GRANT ALL ON public.seller_requests TO service_role;

ALTER TABLE public.seller_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own seller requests"
  ON public.seller_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users create own seller request"
  ON public.seller_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins update seller requests"
  ON public.seller_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete seller requests"
  ON public.seller_requests FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_seller_requests_updated_at
  BEFORE UPDATE ON public.seller_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. profiles.upi_id
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS upi_id TEXT;

-- 3. orders.sale_channel
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS sale_channel TEXT NOT NULL DEFAULT 'online';
