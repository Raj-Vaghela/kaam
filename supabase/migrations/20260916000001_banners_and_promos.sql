-- Banners: announcement bar + promotional popup
CREATE TABLE IF NOT EXISTS public.banners (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  type       text        NOT NULL CHECK (type IN ('bar', 'popup')),
  message    text,
  link_url   text,
  bg_color   text        DEFAULT '#c66b3d',
  image_url  text,
  is_active  boolean     NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.banners ADD CONSTRAINT banners_type_unique UNIQUE (type);
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active banners"
  ON public.banners FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage banners"
  ON public.banners FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'staff')
    )
  );

-- Seed one row per type so the admin always has something to edit
INSERT INTO public.banners (type, message, is_active)
  VALUES ('bar', 'Free delivery on orders over £40 🎉', false)
  ON CONFLICT (type) DO NOTHING;

INSERT INTO public.banners (type, is_active)
  VALUES ('popup', false)
  ON CONFLICT (type) DO NOTHING;

-- Admin policy for promo_codes (public SELECT already exists)
CREATE POLICY "Admins can manage promo codes"
  ON public.promo_codes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'staff')
    )
  );

-- Storage bucket for banner images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES ('banners', 'banners', true, 5242880,
          ARRAY['image/jpeg','image/png','image/webp','image/gif'])
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view banner images"
  ON storage.objects FOR SELECT USING (bucket_id = 'banners');

CREATE POLICY "Admins can upload banner images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'banners' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can delete banner images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'banners' AND auth.role() = 'authenticated');
