-- Zuntra Blogs Supabase Table Setup & Seed
-- Run this in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query)

-- 1. Create table public.zuntra_blogs
create table if not exists public.zuntra_blogs (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  slug        text not null unique,
  subtitle    text,
  category    text not null
              check (category in ('FEATURES','INDUSTRY INSIGHT','ARTICLES','USE CASES')),
  subtopics   text,                 -- comma-separated, e.g. 'Enterprise Scale, System Architecture, Reliability'
  author      text default 'Zuntra Engineering',
  date        text,                 -- display format: 'Sep 02, 2026'
  time        text,                 -- display format: '8 MIN READ'
  color       text default '#10b981',
  image_url   text,
  tags        text,                 -- comma-separated
  content     text,                 -- markdown
  featured    boolean not null default false,
  published   boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- 2. Create indexes
create index if not exists idx_zuntra_blogs_published_featured on public.zuntra_blogs (published, featured);
create index if not exists idx_zuntra_blogs_category on public.zuntra_blogs (category);

-- 3. Enable RLS
alter table public.zuntra_blogs enable row level security;

-- 4. Policies (Supporting both anon public client and authenticated access)
drop policy if exists "public read published" on public.zuntra_blogs;
drop policy if exists "authenticated full access" on public.zuntra_blogs;
drop policy if exists "anon full access" on public.zuntra_blogs;

create policy "public read published"
  on public.zuntra_blogs for select
  using (true);

create policy "anon full access"
  on public.zuntra_blogs for all
  to anon, authenticated
  using (true) with check (true);

-- 5. Auto-update updated_at timestamp trigger
create or replace function set_updated_at() returns trigger as $$
begin 
  new.updated_at = now(); 
  return new; 
end;
$$ language plpgsql;

drop trigger if exists zuntra_blogs_updated_at on public.zuntra_blogs;

create trigger zuntra_blogs_updated_at
before update on public.zuntra_blogs
for each row execute function set_updated_at();

-- 6. Seed sample row from section 6
insert into public.zuntra_blogs (
  title, slug, subtitle, category, subtopics, author, date, time, color, image_url, tags, content, featured, published
) values (
  'Building enterprise technology systems that survive contact with reality',
  'building-enterprise-tech',
  'Enterprise development is less about code and more about organizational dynamics and scale.',
  'INDUSTRY INSIGHT',
  'Enterprise Scale, System Architecture, Reliability',
  'Zuntra Engineering',
  'Sep 02, 2026',
  '8 MIN READ',
  '#10b981',
  'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  'Enterprise Scale, System Architecture, Reliability',
  '### Overview

Designing scalable distributed architectures for enterprise reliability.

### Core Tenets

- Resilient fallback modes
- Zero single point of failure',
  false,
  false
) on conflict (slug) do nothing;
