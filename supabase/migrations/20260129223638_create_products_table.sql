create table products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  category text not null,
  price numeric not null,
  unit text,
  image_url text,
  bestseller boolean default false,
  rating numeric default 0,
  stock integer default 0,
  club_price numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS (Row Level Security)
alter table products enable row level security;

-- Create Policy: Allow public read access
create policy "Allow public read access" on products
  for select using (true);

-- Create Policy: Allow public write access (for development)
create policy "Allow public write access" on products
  for insert with check (true);

create policy "Allow public update access" on products
  for update using (true);

create policy "Allow public delete access" on products
  for delete using (true);
