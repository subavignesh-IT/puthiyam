-- Add loyalty_enabled column to profiles for per-customer loyalty toggle
ALTER TABLE public.profiles ADD COLUMN loyalty_enabled boolean NOT NULL DEFAULT true;
