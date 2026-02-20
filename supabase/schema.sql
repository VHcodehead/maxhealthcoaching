-- MaxHealth Coaching Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table
create table public.profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  email text not null,
  full_name text not null default '',
  role text not null default 'client' check (role in ('client', 'coach', 'admin')),
  avatar_url text,
  subscription_status text not null default 'none' check (subscription_status in ('none', 'active', 'past_due', 'canceled', 'trialing')),
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  referral_code text unique,
  referred_by text,
  onboarding_completed boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Onboarding responses
create table public.onboarding_responses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  version integer not null default 1,
  age integer not null,
  sex text not null check (sex in ('male', 'female')),
  height_cm numeric not null,
  weight_kg numeric not null,
  goal text not null check (goal in ('bulk', 'cut', 'recomp')),
  goal_weight_kg numeric not null,
  activity_level text not null,
  body_fat_percentage numeric,
  body_fat_unsure boolean not null default false,
  diet_type text not null default 'no_restrictions',
  disliked_foods text[] default '{}',
  allergies text[] default '{}',
  meals_per_day integer not null default 3,
  meal_timing_window text default '',
  cooking_skill text not null default 'medium',
  budget text not null default 'medium',
  restaurant_frequency text default '',
  injuries text[] default '{}',
  injury_notes text default '',
  workout_frequency integer not null default 3,
  workout_location text not null default 'gym',
  experience_level text not null default 'beginner',
  home_equipment text[] default '{}',
  split_preference text not null default 'full_body',
  time_per_session integer not null default 60,
  cardio_preference text not null default 'moderate',
  plan_duration_weeks integer not null default 4,
  average_steps integer default 8000,
  sleep_hours numeric default 7,
  stress_level text default 'medium',
  job_type text default 'desk',
  created_at timestamptz default now()
);

-- Macro targets
create table public.macro_targets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  version integer not null default 1,
  bmr numeric not null,
  tdee numeric not null,
  calorie_target numeric not null,
  protein_g numeric not null,
  fat_g numeric not null,
  carbs_g numeric not null,
  formula_used text not null,
  explanation text default '',
  created_at timestamptz default now()
);

-- Meal plans
create table public.meal_plans (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  version integer not null default 1,
  plan_data jsonb not null,
  grocery_list jsonb not null default '[]',
  created_at timestamptz default now()
);

-- Training plans
create table public.training_plans (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  version integer not null default 1,
  duration_weeks integer not null default 4,
  plan_data jsonb not null,
  created_at timestamptz default now()
);

-- Check-ins
create table public.check_ins (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  week_number integer not null,
  weight_kg numeric not null,
  waist_cm numeric,
  adherence_rating integer not null check (adherence_rating between 1 and 10),
  steps_avg integer default 0,
  sleep_avg numeric default 7,
  notes text default '',
  created_at timestamptz default now()
);

-- Progress photos
create table public.progress_photos (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  check_in_id uuid references public.check_ins(id) on delete cascade not null,
  photo_type text not null check (photo_type in ('front', 'side', 'back')),
  storage_path text not null,
  created_at timestamptz default now()
);

-- Leads
create table public.leads (
  id uuid default uuid_generate_v4() primary key,
  email text not null,
  source text not null default 'website',
  quiz_answers jsonb,
  converted boolean not null default false,
  created_at timestamptz default now()
);

-- Referrals
create table public.referrals (
  id uuid default uuid_generate_v4() primary key,
  referrer_id uuid references auth.users(id) on delete cascade not null,
  referred_id uuid references auth.users(id) on delete set null,
  code text not null unique,
  discount_percent integer not null default 10,
  status text not null default 'pending' check (status in ('pending', 'completed', 'expired')),
  created_at timestamptz default now()
);

-- Blog posts
create table public.blog_posts (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  slug text not null unique,
  content text not null default '',
  excerpt text not null default '',
  published boolean not null default false,
  author_id uuid references auth.users(id) on delete cascade not null,
  featured_image text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Transformations / Case Studies
create table public.transformations (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references auth.users(id) on delete cascade,
  client_name text not null default '',
  before_photo text,
  after_photo text,
  weight_lost text default '',
  duration text default '',
  quote text default '',
  featured boolean not null default false,
  approved boolean not null default false,
  created_at timestamptz default now()
);

-- Coach settings
create table public.coach_settings (
  id uuid default uuid_generate_v4() primary key,
  coach_id uuid references auth.users(id) on delete cascade not null unique,
  max_clients integer not null default 20,
  spots_remaining integer not null default 20,
  promo_active boolean not null default false,
  promo_end timestamptz,
  promo_discount_percent integer not null default 0,
  welcome_message text default 'Welcome to MaxHealth Coaching! I''m excited to work with you on your fitness journey.',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Notifications
create table public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null,
  title text not null,
  message text not null default '',
  read boolean not null default false,
  created_at timestamptz default now()
);

-- Row Level Security Policies
alter table public.profiles enable row level security;
alter table public.onboarding_responses enable row level security;
alter table public.macro_targets enable row level security;
alter table public.meal_plans enable row level security;
alter table public.training_plans enable row level security;
alter table public.check_ins enable row level security;
alter table public.progress_photos enable row level security;
alter table public.leads enable row level security;
alter table public.referrals enable row level security;
alter table public.blog_posts enable row level security;
alter table public.transformations enable row level security;
alter table public.coach_settings enable row level security;
alter table public.notifications enable row level security;

-- Profiles: users can read their own, coaches can read all
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = user_id);
create policy "Coaches can read all profiles" on public.profiles for select using (
  exists (select 1 from public.profiles where user_id = auth.uid() and role in ('coach', 'admin'))
);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = user_id);
create policy "Service can insert profiles" on public.profiles for insert with check (true);

-- Onboarding: users own, coaches read all
create policy "Users can manage own onboarding" on public.onboarding_responses for all using (auth.uid() = user_id);
create policy "Coaches can read all onboarding" on public.onboarding_responses for select using (
  exists (select 1 from public.profiles where user_id = auth.uid() and role in ('coach', 'admin'))
);

-- Macro targets
create policy "Users can read own macros" on public.macro_targets for select using (auth.uid() = user_id);
create policy "Coaches can read all macros" on public.macro_targets for select using (
  exists (select 1 from public.profiles where user_id = auth.uid() and role in ('coach', 'admin'))
);
create policy "Service can insert macros" on public.macro_targets for insert with check (true);

-- Meal plans
create policy "Users can read own meal plans" on public.meal_plans for select using (auth.uid() = user_id);
create policy "Coaches can manage all meal plans" on public.meal_plans for all using (
  exists (select 1 from public.profiles where user_id = auth.uid() and role in ('coach', 'admin'))
);
create policy "Service can insert meal plans" on public.meal_plans for insert with check (true);

-- Training plans
create policy "Users can read own training plans" on public.training_plans for select using (auth.uid() = user_id);
create policy "Coaches can manage all training plans" on public.training_plans for all using (
  exists (select 1 from public.profiles where user_id = auth.uid() and role in ('coach', 'admin'))
);
create policy "Service can insert training plans" on public.training_plans for insert with check (true);

-- Check-ins
create policy "Users can manage own check-ins" on public.check_ins for all using (auth.uid() = user_id);
create policy "Coaches can read all check-ins" on public.check_ins for select using (
  exists (select 1 from public.profiles where user_id = auth.uid() and role in ('coach', 'admin'))
);

-- Progress photos: private - only user and coaches
create policy "Users can manage own photos" on public.progress_photos for all using (auth.uid() = user_id);
create policy "Coaches can read all photos" on public.progress_photos for select using (
  exists (select 1 from public.profiles where user_id = auth.uid() and role in ('coach', 'admin'))
);

-- Leads: only service/coaches can access
create policy "Anyone can insert leads" on public.leads for insert with check (true);
create policy "Coaches can read leads" on public.leads for select using (
  exists (select 1 from public.profiles where user_id = auth.uid() and role in ('coach', 'admin'))
);

-- Referrals
create policy "Users can read own referrals" on public.referrals for select using (auth.uid() = referrer_id);
create policy "Service can manage referrals" on public.referrals for all with check (true);

-- Blog posts: published are public, all for coaches
create policy "Anyone can read published posts" on public.blog_posts for select using (published = true);
create policy "Coaches can manage posts" on public.blog_posts for all using (
  exists (select 1 from public.profiles where user_id = auth.uid() and role in ('coach', 'admin'))
);

-- Transformations: featured are public
create policy "Anyone can read featured transformations" on public.transformations for select using (featured = true and approved = true);
create policy "Coaches can manage transformations" on public.transformations for all using (
  exists (select 1 from public.profiles where user_id = auth.uid() and role in ('coach', 'admin'))
);

-- Coach settings
create policy "Coaches can manage own settings" on public.coach_settings for all using (auth.uid() = coach_id);
create policy "Anyone can read coach settings" on public.coach_settings for select using (true);

-- Notifications
create policy "Users can manage own notifications" on public.notifications for all using (auth.uid() = user_id);

-- Function to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, email, full_name, role, referral_code)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'client'),
    encode(gen_random_bytes(6), 'hex')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user signup
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Storage bucket for progress photos (create via Supabase dashboard or API)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('progress-photos', 'progress-photos', false);
