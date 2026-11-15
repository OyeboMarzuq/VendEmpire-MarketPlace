CREATE TABLE public.customer_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 100),
  email TEXT NOT NULL CHECK (char_length(email) BETWEEN 5 AND 255),
  phone TEXT CHECK (phone IS NULL OR char_length(phone) <= 30),
  city TEXT CHECK (city IS NULL OR char_length(city) <= 80),
  country TEXT NOT NULL CHECK (char_length(country) BETWEEN 2 AND 80),
  persona TEXT NOT NULL CHECK (persona IN ('homemaker','student','professional','everyday')),
  interests TEXT[] NOT NULL DEFAULT '{}' CHECK (array_length(interests,1) BETWEEN 1 AND 10),
  note TEXT CHECK (note IS NULL OR char_length(note) <= 300),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX customer_waitlist_email_key ON public.customer_waitlist (lower(email));
CREATE INDEX customer_waitlist_created_idx ON public.customer_waitlist (created_at DESC);
GRANT INSERT ON public.customer_waitlist TO anon, authenticated;
GRANT ALL ON public.customer_waitlist TO service_role;
ALTER TABLE public.customer_waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can join waitlist" ON public.customer_waitlist FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE OR REPLACE FUNCTION public.customer_waitlist_count()
RETURNS BIGINT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*) FROM public.customer_waitlist
$$;
GRANT EXECUTE ON FUNCTION public.customer_waitlist_count() TO anon, authenticated;

CREATE TABLE public.vendor_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL CHECK (char_length(business_name) BETWEEN 2 AND 120),
  full_name TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 2 AND 100),
  email TEXT NOT NULL CHECK (char_length(email) BETWEEN 5 AND 255),
  phone TEXT CHECK (phone IS NULL OR char_length(phone) <= 30),
  city TEXT CHECK (city IS NULL OR char_length(city) <= 80),
  country TEXT NOT NULL CHECK (char_length(country) BETWEEN 2 AND 80),
  persona TEXT NOT NULL CHECK (persona IN ('market','shop','home','farmer')),
  interests TEXT[] NOT NULL DEFAULT '{}' CHECK (array_length(interests,1) BETWEEN 1 AND 10),
  note TEXT CHECK (note IS NULL OR char_length(note) <= 300),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX vendor_waitlist_email_key ON public.vendor_waitlist (lower(email));
CREATE INDEX vendor_waitlist_created_idx ON public.vendor_waitlist (created_at DESC);
GRANT INSERT ON public.vendor_waitlist TO anon, authenticated;
GRANT ALL ON public.vendor_waitlist TO service_role;
ALTER TABLE public.vendor_waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can join vendor waitlist" ON public.vendor_waitlist FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE OR REPLACE FUNCTION public.vendor_waitlist_count()
RETURNS BIGINT LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT count(*) FROM public.vendor_waitlist
$$;
GRANT EXECUTE ON FUNCTION public.vendor_waitlist_count() TO anon, authenticated;