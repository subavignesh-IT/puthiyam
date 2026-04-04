
-- Allow admins to delete loyalty claims
CREATE POLICY "Admins can delete claims"
ON public.loyalty_claims
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create app_settings table for global settings like loyalty min amount
CREATE TABLE public.app_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view settings"
ON public.app_settings
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage settings"
ON public.app_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default loyalty min amount
INSERT INTO public.app_settings (key, value) VALUES ('loyalty_min_amount', '200');
