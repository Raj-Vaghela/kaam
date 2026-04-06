-- Create the 'products' storage bucket
insert into storage.buckets (id, name, public)
values ('products', 'products', true);

-- Enable RLS for the objects table (Already enabled by default)
-- alter table storage.objects enable row level security;

-- Policy: Allow Public Read Access
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'products' );

-- Policy: Allow Upload Access (Authenticated & Anon for now)
create policy "Upload Access"
  on storage.objects for insert
  with check ( bucket_id = 'products' );

-- Policy: Allow Update Access
create policy "Update Access"
  on storage.objects for update
  using ( bucket_id = 'products' );

-- Policy: Allow Delete Access
create policy "Delete Access"
  on storage.objects for delete
  using ( bucket_id = 'products' );
