-- วิปอายโฟน: รันใน Supabase SQL Editor ก่อนเปิดใช้ API จริง
create type public.user_role as enum ('customer', 'admin');
create type public.order_payment_type as enum ('full', 'installment');
create type public.payment_status as enum ('pending_review', 'approved', 'rejected');

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text, line_user_id text unique,
  role public.user_role not null default 'customer', created_at timestamptz not null default now()
);
-- ข้อมูล login (username/password) แยกออกมาต่างหาก ไม่ปนกับ profile —ดูตาราง
-- public.auth_accounts ด้านล่าง (เชื่อมกับ profiles ผ่าน profile_id)
create table public.auth_accounts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  username text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);
create table public.products (
  id uuid primary key default gen_random_uuid(), name text not null, price numeric(12,2) not null, stock integer not null default 1,
  condition_note text, battery_health integer, images text[] not null default '{}', is_active boolean not null default true, created_at timestamptz not null default now()
);
create table public.installment_plans (
  id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id), deposit numeric(12,2) not null default 0,
  total_installments integer not null check (total_installments > 0), interval_days integer not null default 14, installment_amount numeric(12,2) not null, is_active boolean not null default true
);
create table public.orders (
  id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.profiles(id), product_id uuid not null references public.products(id),
  payment_type public.order_payment_type not null, total_amount numeric(12,2) not null, plan_id uuid references public.installment_plans(id), created_at timestamptz not null default now()
);
create table public.installments (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade, sequence integer not null,
  due_date date not null, amount numeric(12,2) not null, status public.payment_status not null default 'pending_review', unique(order_id, sequence)
);
create table public.payment_slips (
  id uuid primary key default gen_random_uuid(), installment_id uuid references public.installments(id), order_id uuid references public.orders(id),
  image_path text not null, transferred_amount numeric(12,2) not null, transferred_at timestamptz not null, status public.payment_status not null default 'pending_review', reviewed_by uuid references public.profiles(id), reviewed_at timestamptz, created_at timestamptz not null default now(), check (installment_id is not null or order_id is not null)
);

alter table public.profiles enable row level security; alter table public.orders enable row level security; alter table public.installments enable row level security; alter table public.payment_slips enable row level security;
create policy "customers read own orders" on public.orders for select using (auth.uid() = customer_id);
create policy "customers read own installments" on public.installments for select using (exists(select 1 from public.orders where orders.id = installments.order_id and orders.customer_id = auth.uid()));
create policy "customers read own slips" on public.payment_slips for select using (exists(select 1 from public.orders where orders.id = payment_slips.order_id and orders.customer_id = auth.uid()));

-- ต่อไปนี้คือส่วนที่เพิ่มสำหรับ auth + admin ให้ใช้งานได้จริง
-- ปลอดภัยที่จะรันซ้ำ (ใช้ if not exists / drop-then-create ทุกจุด)
--
-- ระบบ login ใช้ NextAuth (Auth.js) + ตาราง auth_accounts เก็บ username/password_hash เอง
-- ไม่ได้พึ่ง Supabase Auth (auth.users) แล้ว — บล็อกด้านล่างย้าย username ออกจาก profiles
-- (ถ้าเคยมี) ไปตาราง auth_accounts และแก้ profiles.id ให้เป็นตารางอิสระจาก auth.users

alter table public.profiles drop constraint if exists profiles_id_fkey;
alter table public.profiles alter column id set default gen_random_uuid();
alter table public.profiles drop column if exists username;
alter table public.profiles drop column if exists password_hash;
alter table public.profiles add column if not exists email text;
alter table public.orders add column if not exists shipping_name text;
alter table public.orders add column if not exists shipping_phone text;
alter table public.orders add column if not exists shipping_address text;

-- เดิมมี trigger ผูก profiles กับ auth.users ตอนสมัคร ตอนนี้ไม่ใช้ Supabase Auth แล้วจึงถอดออก
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- auth_accounts: ปิด RLS แบบ deny-all (ไม่มี policy เลย) เข้าถึงได้เฉพาะผ่าน
-- service-role client จากโค้ดฝั่งเซิร์ฟเวอร์เท่านั้น ไม่มีทางเข้าถึงผ่าน publishable key
alter table public.auth_accounts enable row level security;

-- security definer function เลี่ยง infinite recursion ตอนใช้ role เช็คใน policy ของ profiles เอง
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- เปิด RLS ให้ products / installment_plans (เดิมไม่มีเลย เขียนผ่าน API ตรงๆ ได้โดยไม่ต้อง login)
alter table public.products enable row level security;
alter table public.installment_plans enable row level security;

drop policy if exists "anyone can view active products" on public.products;
create policy "anyone can view active products" on public.products for select using (is_active = true or public.is_admin());
drop policy if exists "admins manage products" on public.products;
create policy "admins manage products" on public.products for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "anyone can view active plans" on public.installment_plans;
create policy "anyone can view active plans" on public.installment_plans for select using (is_active = true or public.is_admin());
drop policy if exists "admins manage plans" on public.installment_plans;
create policy "admins manage plans" on public.installment_plans for all using (public.is_admin()) with check (public.is_admin());

-- profiles: ผู้ใช้อ่านโปรไฟล์ตัวเอง + admin อ่าน/แก้ทุกคนได้
drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "admins manage profiles" on public.profiles;
create policy "admins manage profiles" on public.profiles for all using (public.is_admin()) with check (public.is_admin());

-- admin ต้องอ่าน/แก้ orders, installments, payment_slips ได้ทุกแถว (เดิมมีแต่ policy ฝั่งลูกค้า)
drop policy if exists "admins manage orders" on public.orders;
create policy "admins manage orders" on public.orders for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage installments" on public.installments;
create policy "admins manage installments" on public.installments for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admins manage slips" on public.payment_slips;
create policy "admins manage slips" on public.payment_slips for all using (public.is_admin()) with check (public.is_admin());

-- หมายเหตุ: policy ที่เช็ค auth.uid()/is_admin() ด้านบนใช้ได้กับ Supabase Auth session
-- เท่านั้น เพราะ NextAuth ไม่ได้ออก Supabase JWT ให้ ดังนั้นโค้ดฝั่งเซิร์ฟเวอร์ (Server
-- Actions / Server Components) จะเรียกผ่าน service-role client (createSupabaseAdminClient)
-- เสมอ แล้วเช็คสิทธิ์ผ่าน NextAuth session เอาเอง — policy พวกนี้ยังมีประโยชน์เป็นเซฟตี้เน็ต
-- เผื่อ publishable key หลุดไปใช้ตรงๆ (จะโดนบล็อกหมดยกเว้นดูสินค้าที่ is_active = true)

-- รายละเอียดสินค้าแบบยาว + วิดีโอสินค้า (เดิมมีแค่ images กับ condition_note สั้นๆ)
alter table public.products add column if not exists description text;
alter table public.products add column if not exists videos text[] not null default '{}';

-- storage bucket เก็บรูป/วิดีโอสินค้า อัปโหลดผ่าน service-role เท่านั้น
-- (เปิด public read เพื่อให้หน้าร้านโชว์รูปได้ตรงๆ ผ่าน public URL)
insert into storage.buckets (id, name, public)
values ('product-media', 'product-media', true)
on conflict (id) do nothing;

drop policy if exists "public read product media" on storage.objects;
create policy "public read product media" on storage.objects for select using (bucket_id = 'product-media');

-- storage bucket เก็บสลิปการโอนเงิน — เป็นข้อมูลอ่อนไหว ไม่เปิด public read เหมือน
-- product-media เขียน/อ่านผ่าน service-role เท่านั้น (Server Action ฝั่งลูกค้า/แอดมิน
-- ใช้ createSupabaseAdminClient ซึ่ง bypass RLS อยู่แล้ว จึงไม่ต้องเพิ่ม policy ให้ bucket นี้)
insert into storage.buckets (id, name, public)
values ('payment-slips', 'payment-slips', false)
on conflict (id) do nothing;

-- รูปหน้าปกที่แอดมินเลือกเองจากรูปที่อัปโหลด (ต้องเป็นค่าใดค่าหนึ่งใน images[])
-- ถ้าไม่ได้เลือก (null) หน้าร้านจะสุ่มโชว์รูปจาก images[] เหมือนเดิม
alter table public.products add column if not exists cover_image text;

-- แพทเทิร์นข้อความสำหรับแอดมิน ใช้คัดลอกไปวางส่งลูกค้าทาง LINE OA เอง (manual —
-- ยังไม่ได้ต่อ LINE Messaging API ให้กดส่งจากในระบบได้ตรงๆ)
create table public.message_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  body text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.message_templates enable row level security;
-- ไม่มี policy สาธารณะเลย เข้าถึงได้เฉพาะผ่าน service-role client (แอดมิน) เท่านั้น
