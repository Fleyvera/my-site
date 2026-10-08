-- Career / Resume admin. Everything lives in the isolated "career" schema.
create schema if not exists career;

-- ---------------------------------------------------------------------------
-- Access control
-- ---------------------------------------------------------------------------
create table career.admins (
  email text primary key check (email = lower(email))
);

create or replace function career.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users u
    join career.admins a on a.email = lower(u.email)
    where u.id = auth.uid()
      and u.email_confirmed_at is not null
  );
$$;

revoke all on function career.is_admin() from public, anon;
grant execute on function career.is_admin() to authenticated;

create or replace function career.normalize_slug(input text)
returns text
language sql
immutable
set search_path = ''
as $$
  select regexp_replace(lower(coalesce(input, '')), '[^a-z0-9+#]', '', 'g');
$$;

create or replace function career.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table career.settings (
  id int primary key default 1 check (id = 1),
  full_name text not null,
  short_name text,
  location_en text,
  location_pt text,
  email text,
  phone text,
  linkedin_url text,
  portfolio_url text,
  github_url text,
  default_paper text not null default 'A4' check (default_paper in ('A4', 'Letter')),
  languages jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

create table career.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_pt text,
  category text not null default 'other'
    check (category in ('design', 'dev', 'art', 'tool', 'edu', 'ux', 'soft', 'domain', 'other')),
  aliases text[] not null default '{}',
  review_status text not null default 'ok' check (review_status in ('ok', 'needs_review', 'needs_content')),
  created_at timestamptz not null default now()
);

create or replace function career.tags_normalize()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.name_en = btrim(new.name_en);
  new.slug = career.normalize_slug(new.name_en);
  new.aliases = coalesce(
    (select array_agg(distinct career.normalize_slug(a)) from unnest(new.aliases) a where btrim(a) <> ''),
    '{}'
  );
  if exists (
    select 1 from career.tags t
    where t.id <> new.id and (new.slug = any (t.aliases) or t.slug = any (new.aliases))
  ) then
    raise exception 'Tag "%" duplicates an existing tag or alias', new.name_en using errcode = '23505';
  end if;
  return new;
end;
$$;

create trigger tags_normalize before insert or update on career.tags
for each row execute function career.tags_normalize();

create table career.experiences (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  group_key text,
  role_en text not null,
  role_pt text,
  employment_type text,
  start_date date not null,
  end_date date,
  is_current boolean not null default false,
  location text,
  company_url text,
  description_en text,
  description_pt text,
  focus_descriptions jsonb not null default '{}'::jsonb,
  technologies text[] not null default '{}',
  priority int not null default 3 check (priority between 1 and 5),
  visibility text not null default 'default' check (visibility in ('default', 'manual_only', 'hidden')),
  notes text,
  source text,
  review_status text not null default 'needs_review' check (review_status in ('ok', 'needs_review', 'needs_content')),
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date)
);

create table career.experience_bullets (
  id uuid primary key default gen_random_uuid(),
  experience_id uuid not null references career.experiences (id) on delete cascade,
  text_en text,
  text_pt text,
  focus text[] not null default '{}',
  sort int not null default 0,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table career.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role_en text,
  role_pt text,
  description_en text,
  description_pt text,
  resume_description_en text,
  resume_description_pt text,
  portfolio_description text,
  platforms text[] not null default '{}',
  company text,
  year int,
  links jsonb not null default '{}'::jsonb,
  technologies text[] not null default '{}',
  priority int not null default 3 check (priority between 1 and 5),
  visibility text not null default 'default' check (visibility in ('default', 'manual_only', 'hidden')),
  thumbnail_url text,
  notes text,
  review_status text not null default 'needs_review' check (review_status in ('ok', 'needs_review', 'needs_content')),
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table career.education (
  id uuid primary key default gen_random_uuid(),
  institution text not null,
  degree_en text not null,
  degree_pt text,
  field_en text,
  field_pt text,
  start_year int,
  end_year int,
  location text,
  notes text,
  priority int not null default 3 check (priority between 1 and 5),
  visibility text not null default 'default' check (visibility in ('default', 'manual_only', 'hidden')),
  review_status text not null default 'needs_review' check (review_status in ('ok', 'needs_review', 'needs_content')),
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table career.experience_tags (
  experience_id uuid not null references career.experiences (id) on delete cascade,
  tag_id uuid not null references career.tags (id) on delete cascade,
  primary key (experience_id, tag_id)
);

create table career.project_tags (
  project_id uuid not null references career.projects (id) on delete cascade,
  tag_id uuid not null references career.tags (id) on delete cascade,
  primary key (project_id, tag_id)
);

create table career.experience_projects (
  experience_id uuid not null references career.experiences (id) on delete cascade,
  project_id uuid not null references career.projects (id) on delete cascade,
  primary key (experience_id, project_id)
);

create table career.profiles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_en text not null,
  name_pt text,
  focus text,
  headline_en text,
  headline_pt text,
  summary_en text,
  summary_pt text,
  default_template text not null default 'ats' check (default_template in ('ats', 'creative', 'academic')),
  default_language text not null default 'en' check (default_language in ('en', 'pt')),
  visibility_rules jsonb not null default '{}'::jsonb,
  review_status text not null default 'needs_review' check (review_status in ('ok', 'needs_review', 'needs_content')),
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table career.profile_tag_weights (
  profile_id uuid not null references career.profiles (id) on delete cascade,
  tag_id uuid not null references career.tags (id) on delete cascade,
  weight int not null check (weight between 0 and 5),
  primary key (profile_id, tag_id)
);

create table career.profile_experiences (
  profile_id uuid not null references career.profiles (id) on delete cascade,
  experience_id uuid not null references career.experiences (id) on delete cascade,
  include text not null default 'include' check (include in ('include', 'exclude')),
  rank int not null default 0,
  description_en text,
  description_pt text,
  primary key (profile_id, experience_id)
);

create table career.profile_projects (
  profile_id uuid not null references career.profiles (id) on delete cascade,
  project_id uuid not null references career.projects (id) on delete cascade,
  include text not null default 'include' check (include in ('include', 'exclude')),
  rank int not null default 0,
  description_en text,
  description_pt text,
  primary key (profile_id, project_id)
);

create table career.resume_presets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  config jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table career.resume_history (
  id uuid primary key default gen_random_uuid(),
  title text,
  profile_id uuid references career.profiles (id) on delete set null,
  profile_name text,
  language text not null check (language in ('en', 'pt')),
  template text not null,
  paper text not null,
  filename text not null,
  config jsonb not null,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create index experience_bullets_experience_idx on career.experience_bullets (experience_id);
create index resume_history_created_idx on career.resume_history (created_at desc);

create trigger touch before update on career.settings for each row execute function career.touch_updated_at();
create trigger touch before update on career.experiences for each row execute function career.touch_updated_at();
create trigger touch before update on career.projects for each row execute function career.touch_updated_at();
create trigger touch before update on career.education for each row execute function career.touch_updated_at();
create trigger touch before update on career.profiles for each row execute function career.touch_updated_at();
create trigger touch before update on career.resume_presets for each row execute function career.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row level security: only allowlisted, email-confirmed users
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'settings', 'tags', 'experiences', 'experience_bullets', 'projects', 'education',
    'experience_tags', 'project_tags', 'experience_projects', 'profiles',
    'profile_tag_weights', 'profile_experiences', 'profile_projects',
    'resume_presets', 'resume_history'
  ] loop
    execute format('alter table career.%I enable row level security', t);
    execute format(
      'create policy admin_all on career.%I for all to authenticated using (career.is_admin()) with check (career.is_admin())',
      t
    );
  end loop;
end;
$$;

alter table career.admins enable row level security;
create policy admin_read on career.admins for select to authenticated using (career.is_admin());

revoke all on schema career from public, anon;
grant usage on schema career to authenticated;
revoke all on all tables in schema career from public, anon;
grant select, insert, update, delete on all tables in schema career to authenticated;
revoke insert, update, delete on career.admins from authenticated;
grant usage, select on all sequences in schema career to authenticated;
