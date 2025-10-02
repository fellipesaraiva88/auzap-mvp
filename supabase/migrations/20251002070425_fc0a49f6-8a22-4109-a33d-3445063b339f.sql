-- ============================================
-- AUZAP MULTI-TENANT SYSTEM - 15 TABLES
-- Zero Trust Architecture with Complete RLS
-- ============================================

-- ============================================
-- PHASE 1: ENUM TYPES
-- ============================================

create type public.app_role as enum ('owner', 'admin', 'manager', 'employee');
create type public.instance_status as enum ('disconnected', 'connecting', 'connected', 'error');
create type public.service_category as enum ('banho_tosa', 'veterinaria', 'hotel', 'creche', 'produtos', 'outros');
create type public.contact_status as enum ('new', 'active', 'inactive', 'blocked');
create type public.contact_source as enum ('whatsapp_ai', 'whatsapp_manual', 'website', 'phone', 'referral');
create type public.pet_species as enum ('dog', 'cat', 'bird', 'rabbit', 'other');
create type public.pet_size as enum ('pequeno', 'medio', 'grande', 'gigante');
create type public.booking_status as enum ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
create type public.booking_created_by as enum ('ai', 'human', 'customer');
create type public.conversation_status as enum ('active', 'waiting_human', 'resolved', 'archived');
create type public.conversation_priority as enum ('low', 'normal', 'high', 'urgent');
create type public.message_type as enum ('text', 'image', 'audio', 'video', 'document', 'location');
create type public.message_direction as enum ('inbound', 'outbound');
create type public.message_sender as enum ('customer', 'ai', 'human');
create type public.ai_action_type as enum (
  'create_contact', 'update_contact', 'create_pet', 'update_pet',
  'create_booking', 'update_booking', 'cancel_booking',
  'create_sale', 'schedule_followup', 'escalate_to_human'
);
create type public.ai_action_status as enum ('pending', 'completed', 'failed', 'cancelled');
create type public.followup_type as enum (
  'appointment_reminder', 'feedback_request', 'vaccine_reminder',
  'birthday_greeting', 'reactivation', 'checkout_reminder',
  'payment_reminder', 'review_request'
);
create type public.followup_status as enum ('pending', 'sent', 'delivered', 'read', 'cancelled', 'failed');
create type public.aurora_trigger_type as enum (
  'weather_alert', 'seasonal_campaign', 'capacity_optimization',
  'customer_lifecycle', 'inventory_alert', 'health_reminder'
);
create type public.aurora_message_status as enum ('draft', 'scheduled', 'sent', 'delivered', 'cancelled');
create type public.automation_trigger as enum (
  'time_based', 'event_based', 'condition_based', 'ai_detected'
);
create type public.automation_status as enum ('active', 'paused', 'completed', 'error');

-- ============================================
-- PHASE 2: CORE TABLES (6)
-- ============================================

-- 1. Organizations (Principal)
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  business_type text[] not null default '{}',
  plan_type text not null default 'free',
  status text not null default 'active',
  settings jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. User Roles (Segurança)
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  organization_id uuid references public.organizations(id) on delete cascade not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique(user_id, organization_id)
);

-- 3. Organization Settings
create table public.organization_settings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null unique,
  business_info jsonb default '{}',
  operating_hours jsonb default '{}',
  pricing jsonb default '{}',
  notifications jsonb default '{}',
  ai_config jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. WhatsApp Instances
create table public.whatsapp_instances (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null unique,
  instance_name text not null,
  instance_key text unique not null,
  status instance_status not null default 'disconnected',
  phone_number text,
  qr_code text,
  session_data jsonb,
  webhook_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Services
create table public.services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  category service_category not null,
  description text,
  duration_minutes integer,
  price_cents integer not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. Authorized Owner Numbers
create table public.authorized_owner_numbers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  phone_number text not null,
  name text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  unique(organization_id, phone_number)
);

-- ============================================
-- PHASE 3: CLIENTES & PETS (3)
-- ============================================

-- 7. Contacts
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  phone_number text not null,
  name text,
  email text,
  address text,
  notes text,
  status contact_status not null default 'new',
  source contact_source not null,
  tags text[] default '{}',
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id, phone_number)
);

-- 8. Pets
create table public.pets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  contact_id uuid references public.contacts(id) on delete cascade not null,
  name text not null,
  species pet_species not null,
  breed text,
  size pet_size,
  age_years integer,
  weight_kg decimal(5,2),
  color text,
  gender text,
  is_neutered boolean,
  birth_date date,
  medical_notes text,
  behavioral_notes text,
  vaccination_record jsonb default '{}',
  photos text[] default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 9. Bookings
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  contact_id uuid references public.contacts(id) on delete cascade not null,
  pet_id uuid references public.pets(id) on delete cascade not null,
  service_id uuid references public.services(id) on delete cascade not null,
  booking_date date not null,
  booking_time time not null,
  duration_minutes integer not null,
  status booking_status not null default 'scheduled',
  price_cents integer not null,
  notes text,
  internal_notes text,
  created_by booking_created_by not null,
  created_by_user_id uuid references auth.users(id),
  confirmed_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- PHASE 4: IA CLIENTE (4)
-- ============================================

-- 10. Conversations
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  contact_id uuid references public.contacts(id) on delete cascade not null,
  whatsapp_chat_id text not null,
  status conversation_status not null default 'active',
  priority conversation_priority not null default 'normal',
  assigned_to_user_id uuid references auth.users(id),
  last_message_at timestamptz not null default now(),
  last_human_message_at timestamptz,
  tags text[] default '{}',
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(organization_id, whatsapp_chat_id)
);

-- 11. Messages
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  whatsapp_message_id text unique not null,
  type message_type not null,
  direction message_direction not null,
  sender message_sender not null,
  content text not null,
  media_url text,
  metadata jsonb default '{}',
  is_read boolean not null default false,
  sent_by_user_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

-- 12. AI Interactions
create table public.ai_interactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  message_id uuid references public.messages(id) on delete cascade not null,
  action_type ai_action_type not null,
  status ai_action_status not null default 'pending',
  input_data jsonb not null,
  output_data jsonb,
  confidence_score decimal(3,2),
  error_message text,
  executed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 13. Scheduled Followups
create table public.scheduled_followups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  contact_id uuid references public.contacts(id) on delete cascade not null,
  pet_id uuid references public.pets(id),
  booking_id uuid references public.bookings(id),
  type followup_type not null,
  status followup_status not null default 'pending',
  scheduled_for timestamptz not null,
  message_template text not null,
  personalized_message text,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  response_received boolean not null default false,
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- PHASE 5: AURORA (2)
-- ============================================

-- 14. Aurora Proactive Messages
create table public.aurora_proactive_messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  trigger_type aurora_trigger_type not null,
  target_audience jsonb not null,
  message_content text not null,
  scheduled_for timestamptz not null,
  status aurora_message_status not null default 'draft',
  sent_count integer not null default 0,
  delivered_count integer not null default 0,
  response_count integer not null default 0,
  conversion_count integer not null default 0,
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 15. Aurora Automations
create table public.aurora_automations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  description text,
  trigger_type automation_trigger not null,
  trigger_config jsonb not null,
  conditions jsonb default '{}',
  actions jsonb not null,
  status automation_status not null default 'active',
  execution_count integer not null default 0,
  success_count integer not null default 0,
  error_count integer not null default 0,
  last_executed_at timestamptz,
  next_execution_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================
-- PHASE 6: SECURITY DEFINER FUNCTIONS
-- ============================================

-- Function to get user's organization ID
create or replace function public.user_organization_id(_user_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id
  from public.user_roles
  where user_id = _user_id
  limit 1;
$$;

-- Function to check if user has specific role
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id and role = _role
  );
$$;

-- ============================================
-- PHASE 7: ENABLE RLS ON ALL TABLES
-- ============================================

alter table public.organizations enable row level security;
alter table public.user_roles enable row level security;
alter table public.organization_settings enable row level security;
alter table public.whatsapp_instances enable row level security;
alter table public.services enable row level security;
alter table public.authorized_owner_numbers enable row level security;
alter table public.contacts enable row level security;
alter table public.pets enable row level security;
alter table public.bookings enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.ai_interactions enable row level security;
alter table public.scheduled_followups enable row level security;
alter table public.aurora_proactive_messages enable row level security;
alter table public.aurora_automations enable row level security;

-- ============================================
-- PHASE 8: RLS POLICIES - ORGANIZATIONS
-- ============================================

create policy "Users can select their organization"
on public.organizations for select to authenticated
using (id = public.user_organization_id(auth.uid()));

create policy "Users can update their organization"
on public.organizations for update to authenticated
using (id = public.user_organization_id(auth.uid()) and public.has_role(auth.uid(), 'admin'));

-- ============================================
-- PHASE 9: RLS POLICIES - USER ROLES
-- ============================================

create policy "Users can view roles in their org"
on public.user_roles for select to authenticated
using (organization_id = public.user_organization_id(auth.uid()));

create policy "Admins can insert roles"
on public.user_roles for insert to authenticated
with check (organization_id = public.user_organization_id(auth.uid()) and public.has_role(auth.uid(), 'admin'));

create policy "Admins can delete roles"
on public.user_roles for delete to authenticated
using (organization_id = public.user_organization_id(auth.uid()) and public.has_role(auth.uid(), 'admin'));

-- ============================================
-- PHASE 10: RLS POLICIES - ALL OTHER TABLES
-- ============================================

-- Organization Settings
create policy "Users can select org settings" on public.organization_settings for select to authenticated
using (organization_id = public.user_organization_id(auth.uid()));
create policy "Admins can update org settings" on public.organization_settings for update to authenticated
using (organization_id = public.user_organization_id(auth.uid()) and public.has_role(auth.uid(), 'admin'));
create policy "Admins can insert org settings" on public.organization_settings for insert to authenticated
with check (organization_id = public.user_organization_id(auth.uid()) and public.has_role(auth.uid(), 'admin'));

-- WhatsApp Instances
create policy "Users can select whatsapp" on public.whatsapp_instances for select to authenticated
using (organization_id = public.user_organization_id(auth.uid()));
create policy "Admins can manage whatsapp" on public.whatsapp_instances for all to authenticated
using (organization_id = public.user_organization_id(auth.uid()) and public.has_role(auth.uid(), 'admin'));

-- Services
create policy "Users can select services" on public.services for select to authenticated
using (organization_id = public.user_organization_id(auth.uid()));
create policy "Users can insert services" on public.services for insert to authenticated
with check (organization_id = public.user_organization_id(auth.uid()));
create policy "Users can update services" on public.services for update to authenticated
using (organization_id = public.user_organization_id(auth.uid()));
create policy "Admins can delete services" on public.services for delete to authenticated
using (organization_id = public.user_organization_id(auth.uid()) and public.has_role(auth.uid(), 'admin'));

-- Authorized Owner Numbers
create policy "Users can select authorized numbers" on public.authorized_owner_numbers for select to authenticated
using (organization_id = public.user_organization_id(auth.uid()));
create policy "Admins can manage authorized numbers" on public.authorized_owner_numbers for all to authenticated
using (organization_id = public.user_organization_id(auth.uid()) and public.has_role(auth.uid(), 'admin'));

-- Contacts
create policy "Users can select contacts" on public.contacts for select to authenticated
using (organization_id = public.user_organization_id(auth.uid()));
create policy "Users can insert contacts" on public.contacts for insert to authenticated
with check (organization_id = public.user_organization_id(auth.uid()));
create policy "Users can update contacts" on public.contacts for update to authenticated
using (organization_id = public.user_organization_id(auth.uid()));
create policy "Admins can delete contacts" on public.contacts for delete to authenticated
using (organization_id = public.user_organization_id(auth.uid()) and public.has_role(auth.uid(), 'admin'));

-- Pets
create policy "Users can select pets" on public.pets for select to authenticated
using (organization_id = public.user_organization_id(auth.uid()));
create policy "Users can insert pets" on public.pets for insert to authenticated
with check (organization_id = public.user_organization_id(auth.uid()));
create policy "Users can update pets" on public.pets for update to authenticated
using (organization_id = public.user_organization_id(auth.uid()));
create policy "Admins can delete pets" on public.pets for delete to authenticated
using (organization_id = public.user_organization_id(auth.uid()) and public.has_role(auth.uid(), 'admin'));

-- Bookings
create policy "Users can select bookings" on public.bookings for select to authenticated
using (organization_id = public.user_organization_id(auth.uid()));
create policy "Users can insert bookings" on public.bookings for insert to authenticated
with check (organization_id = public.user_organization_id(auth.uid()));
create policy "Users can update bookings" on public.bookings for update to authenticated
using (organization_id = public.user_organization_id(auth.uid()));
create policy "Admins can delete bookings" on public.bookings for delete to authenticated
using (organization_id = public.user_organization_id(auth.uid()) and public.has_role(auth.uid(), 'admin'));

-- Conversations
create policy "Users can select conversations" on public.conversations for select to authenticated
using (organization_id = public.user_organization_id(auth.uid()));
create policy "Users can insert conversations" on public.conversations for insert to authenticated
with check (organization_id = public.user_organization_id(auth.uid()));
create policy "Users can update conversations" on public.conversations for update to authenticated
using (organization_id = public.user_organization_id(auth.uid()));

-- Messages
create policy "Users can select messages" on public.messages for select to authenticated
using (organization_id = public.user_organization_id(auth.uid()));
create policy "Users can insert messages" on public.messages for insert to authenticated
with check (organization_id = public.user_organization_id(auth.uid()));
create policy "Users can update messages" on public.messages for update to authenticated
using (organization_id = public.user_organization_id(auth.uid()));

-- AI Interactions
create policy "Users can select ai_interactions" on public.ai_interactions for select to authenticated
using (organization_id = public.user_organization_id(auth.uid()));
create policy "Users can insert ai_interactions" on public.ai_interactions for insert to authenticated
with check (organization_id = public.user_organization_id(auth.uid()));

-- Scheduled Followups
create policy "Users can select followups" on public.scheduled_followups for select to authenticated
using (organization_id = public.user_organization_id(auth.uid()));
create policy "Users can insert followups" on public.scheduled_followups for insert to authenticated
with check (organization_id = public.user_organization_id(auth.uid()));
create policy "Users can update followups" on public.scheduled_followups for update to authenticated
using (organization_id = public.user_organization_id(auth.uid()));

-- Aurora Proactive Messages
create policy "Users can select aurora_messages" on public.aurora_proactive_messages for select to authenticated
using (organization_id = public.user_organization_id(auth.uid()));
create policy "Managers can manage aurora_messages" on public.aurora_proactive_messages for all to authenticated
using (organization_id = public.user_organization_id(auth.uid()) and (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'manager')));

-- Aurora Automations
create policy "Users can select aurora_automations" on public.aurora_automations for select to authenticated
using (organization_id = public.user_organization_id(auth.uid()));
create policy "Managers can manage aurora_automations" on public.aurora_automations for all to authenticated
using (organization_id = public.user_organization_id(auth.uid()) and (public.has_role(auth.uid(), 'admin') or public.has_role(auth.uid(), 'manager')));

-- ============================================
-- PHASE 11: PERFORMANCE INDEXES
-- ============================================

create index idx_organizations_slug on public.organizations(slug);
create index idx_organizations_status on public.organizations(status);
create index idx_user_roles_user_id on public.user_roles(user_id);
create index idx_user_roles_org_id on public.user_roles(organization_id);
create index idx_org_settings_org_id on public.organization_settings(organization_id);
create index idx_whatsapp_org_id on public.whatsapp_instances(organization_id);
create index idx_whatsapp_status on public.whatsapp_instances(status);
create index idx_services_org_id on public.services(organization_id);
create index idx_services_category on public.services(category);
create index idx_services_active on public.services(is_active);
create index idx_contacts_org_phone on public.contacts(organization_id, phone_number);
create index idx_contacts_org_status on public.contacts(organization_id, status);
create index idx_pets_contact_id on public.pets(contact_id);
create index idx_pets_org_species on public.pets(organization_id, species);
create index idx_pets_org_active on public.pets(organization_id, is_active);
create index idx_bookings_org_date on public.bookings(organization_id, booking_date);
create index idx_bookings_pet_id on public.bookings(pet_id);
create index idx_bookings_service_id on public.bookings(service_id);
create index idx_bookings_status on public.bookings(organization_id, status);
create index idx_conversations_org_status on public.conversations(organization_id, status);
create index idx_conversations_contact_id on public.conversations(contact_id);
create index idx_conversations_whatsapp_chat on public.conversations(whatsapp_chat_id);
create index idx_messages_conversation_id on public.messages(conversation_id);
create index idx_messages_created_at on public.messages(created_at desc);
create index idx_ai_interactions_org_status on public.ai_interactions(organization_id, status);
create index idx_ai_interactions_conversation on public.ai_interactions(conversation_id);
create index idx_followups_org_scheduled on public.scheduled_followups(organization_id, scheduled_for);
create index idx_followups_status_scheduled on public.scheduled_followups(status, scheduled_for);
create index idx_aurora_messages_org_status on public.aurora_proactive_messages(organization_id, status);
create index idx_aurora_messages_scheduled on public.aurora_proactive_messages(scheduled_for);
create index idx_aurora_automations_org_status on public.aurora_automations(organization_id, status);
create index idx_aurora_automations_next_exec on public.aurora_automations(next_execution_at);

-- ============================================
-- PHASE 12: UPDATED_AT TRIGGER FUNCTION
-- ============================================

create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply trigger to all tables with updated_at
create trigger update_organizations_updated_at before update on public.organizations
  for each row execute function public.update_updated_at_column();

create trigger update_organization_settings_updated_at before update on public.organization_settings
  for each row execute function public.update_updated_at_column();

create trigger update_whatsapp_instances_updated_at before update on public.whatsapp_instances
  for each row execute function public.update_updated_at_column();

create trigger update_services_updated_at before update on public.services
  for each row execute function public.update_updated_at_column();

create trigger update_contacts_updated_at before update on public.contacts
  for each row execute function public.update_updated_at_column();

create trigger update_pets_updated_at before update on public.pets
  for each row execute function public.update_updated_at_column();

create trigger update_bookings_updated_at before update on public.bookings
  for each row execute function public.update_updated_at_column();

create trigger update_conversations_updated_at before update on public.conversations
  for each row execute function public.update_updated_at_column();

create trigger update_scheduled_followups_updated_at before update on public.scheduled_followups
  for each row execute function public.update_updated_at_column();

create trigger update_aurora_proactive_messages_updated_at before update on public.aurora_proactive_messages
  for each row execute function public.update_updated_at_column();

create trigger update_aurora_automations_updated_at before update on public.aurora_automations
  for each row execute function public.update_updated_at_column();