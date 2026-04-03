/*
 * -------------------------------------------------------
 * Section: Accounts
 * We create the schema for the accounts. Accounts are the top level entity in the application. They can be team or personal accounts.
 * -------------------------------------------------------
 */

-- Accounts table
create table if not exists
  public.accounts (
    id uuid unique not null default extensions.uuid_generate_v4 (),
    primary_owner_user_id uuid references auth.users on delete cascade not null default auth.uid (),
    name varchar(255) not null,
    slug text unique,
    email varchar(320) unique,
    is_personal_account boolean default false not null,
    updated_at timestamp with time zone,
    created_at timestamp with time zone,
    created_by uuid references auth.users,
    updated_by uuid references auth.users,
    picture_url varchar(1000),
    public_data jsonb default '{}'::jsonb not null,
    primary key (id)
  );

comment on table public.accounts is 'Accounts are the top level entity in the application. They can be team or personal accounts.';

comment on column public.accounts.is_personal_account is 'Whether the account is a personal account or not';

comment on column public.accounts.name is 'The name of the account';

comment on column public.accounts.slug is 'The slug of the account';

comment on column public.accounts.primary_owner_user_id is 'The primary owner of the account';

comment on column public.accounts.email is 'The email of the account. For teams, this is the email of the team (if any)';

-- Enable RLS on the accounts table
alter table "public"."accounts" enable row level security;

-- Revoke all on accounts table from authenticated and service_role
revoke all on public.accounts
from
  authenticated,
  service_role;

-- Open up access to accounts
grant
select
,
  insert,
update,
delete on table public.accounts to authenticated,
service_role;

-- constraint that conditionally allows nulls on the slug ONLY if
--  personal_account is true
alter table public.accounts
add constraint accounts_slug_null_if_personal_account_true check (
  (
    is_personal_account = true
    and slug is null
  )
  or (
    is_personal_account = false
    and slug is not null
  )
);

-- Indexes
create index if not exists ix_accounts_primary_owner_user_id on public.accounts (primary_owner_user_id);

create index if not exists ix_accounts_is_personal_account on public.accounts (is_personal_account);

-- constraint to ensure that the primary_owner_user_id is unique for personal accounts
create unique index unique_personal_account on public.accounts (primary_owner_user_id)
where
  is_personal_account = true;

-- RLS on the accounts table
-- UPDATE(accounts):
-- Team owners can update their accounts
create policy accounts_self_update on public.accounts
for update
  to authenticated using (
    (
      select
        auth.uid ()
    ) = primary_owner_user_id
  )
with
  check (
    (
      select
        auth.uid ()
    ) = primary_owner_user_id
  );

-- Function "public.is_account_owner"
-- Function to check if a user is the primary owner of an account
create
or replace function public.is_account_owner (account_id uuid) returns boolean
set
  search_path = '' as $$
    select
        exists(
            select
                1
            from
                public.accounts
            where
                id = is_account_owner.account_id
                and primary_owner_user_id = auth.uid());
$$ language sql;

grant
execute on function public.is_account_owner (uuid) to authenticated,
service_role;

-- Function "kit.protect_account_fields"
-- Function to protect account fields from being updated
create
or replace function kit.protect_account_fields () returns trigger as $$
begin
    if current_user in('authenticated', 'anon') then
	if new.id <> old.id or new.is_personal_account <>
	    old.is_personal_account or new.primary_owner_user_id <>
	    old.primary_owner_user_id or new.email <> old.email then
            raise exception 'You do not have permission to update this field';

        end if;

    end if;

    return NEW;

end
$$ language plpgsql
set
  search_path = '';

-- trigger to protect account fields
create trigger protect_account_fields before
update on public.accounts for each row
execute function kit.protect_account_fields ();

-- TODO: simplify — add_current_user_to_new_account trigger removed;
-- the template used accounts_memberships + roles (deleted). If team account
-- membership tracking is needed, wire it to hr_employee instead.

-- create a trigger to update the account email when the primary owner email is updated
create
or replace function kit.handle_update_user_email () returns trigger language plpgsql security definer
set
  search_path = '' as $$
begin
    update
        public.accounts
    set
        email = new.email
    where
        primary_owner_user_id = new.id
        and is_personal_account = true;

    return new;

end;

$$;

-- trigger the function every time a user email is updated only if the user is the primary owner of the account and
-- the account is personal account
create trigger "on_auth_user_updated"
after
update of email on auth.users for each row
execute procedure kit.handle_update_user_email ();


/**
 * -------------------------------------------------------
 * Section: Slugify
 * We create the schema for the slugify functions. Slugify functions are used to create slugs from strings.
 * We use this for ensure unique slugs for accounts.
 * -------------------------------------------------------
 */
-- Create a function to slugify a string
-- useful for turning an account name into a unique slug
create
or replace function kit.slugify ("value" text) returns text as $$
    -- removes accents (diacritic signs) from a given string --
    with "unaccented" as(
        select
            kit.unaccent("value") as "value"
),
-- lowercases the string
"lowercase" as(
    select
        lower("value") as "value"
    from
        "unaccented"
),
-- remove single and double quotes
"removed_quotes" as(
    select
	regexp_replace("value", '[''"]+', '',
	    'gi') as "value"
    from
        "lowercase"
),
-- replaces anything that's not a letter, number, hyphen('-'), or underscore('_') with a hyphen('-')
"hyphenated" as(
    select
	regexp_replace("value", '[^a-z0-9\\-_]+', '-',
	    'gi') as "value"
    from
        "removed_quotes"
),
-- trims hyphens('-') if they exist on the head or tail of
--   the string
"trimmed" as(
    select
	regexp_replace(regexp_replace("value", '\-+$',
	    ''), '^\-', '') as "value" from "hyphenated"
)
        select
            "value"
        from
            "trimmed";
$$ language SQL strict immutable
set
  search_path to '';

grant
execute on function kit.slugify (text) to service_role,
authenticated;


-- Function "kit.set_slug_from_account_name"
-- Set the slug from the account name and increment if the slug exists
create
or replace function kit.set_slug_from_account_name () returns trigger language plpgsql security definer
set
  search_path = '' as $$
declare
    sql_string varchar;
    tmp_slug varchar;
    increment integer;
    tmp_row record;
    tmp_row_count integer;
begin
    tmp_row_count = 1;

    increment = 0;

    while tmp_row_count > 0 loop
        if increment > 0 then
            tmp_slug = kit.slugify(new.name || ' ' || increment::varchar);

        else
            tmp_slug = kit.slugify(new.name);

        end if;

	sql_string = format('select count(1) cnt from public.accounts where slug = ''' || tmp_slug ||
	    '''; ');

        for tmp_row in execute (sql_string)
            loop
                raise notice 'tmp_row %', tmp_row;

                tmp_row_count = tmp_row.cnt;

            end loop;

        increment = increment +1;

    end loop;

    new.slug := tmp_slug;

    return NEW;

end
$$;

-- Create a trigger to set the slug from the account name
create trigger "set_slug_from_account_name" before insert on public.accounts for each row when (
  NEW.name is not null
  and NEW.slug is null
  and NEW.is_personal_account = false
)
execute procedure kit.set_slug_from_account_name ();

-- Create a trigger when a name is updated to update the slug
create trigger "update_slug_from_account_name" before
update on public.accounts for each row when (
  NEW.name is not null
  and NEW.name <> OLD.name
  and NEW.is_personal_account = false
)
execute procedure kit.set_slug_from_account_name ();

-- Function "kit.setup_new_user"
-- Setup a new user account after user creation
create
or replace function kit.setup_new_user () returns trigger language plpgsql security definer
set
  search_path = '' as $$
declare
    user_name text;
    picture_url text;
begin
    if new.raw_user_meta_data ->> 'name' is not null then
        user_name := new.raw_user_meta_data ->> 'name';

    end if;

    if user_name is null and new.email is not null then
        user_name := split_part(new.email, '@', 1);

    end if;

    if user_name is null then
        user_name := '';

    end if;

    if new.raw_user_meta_data ->> 'avatar_url' is not null then
        picture_url := new.raw_user_meta_data ->> 'avatar_url';
    else
        picture_url := null;
    end if;

    insert into public.accounts(
        id,
        primary_owner_user_id,
        name,
        is_personal_account,
        picture_url,
        email)
    values (
        new.id,
        new.id,
        user_name,
        true,
        picture_url,
        new.email);

    return new;

end;

$$;

-- trigger the function every time a user is created
create trigger on_auth_user_created
after insert on auth.users for each row
execute procedure kit.setup_new_user ();

/**
 * -------------------------------------------------------
 * Section: Functions
 * We create the schema for the functions
 * -------------------------------------------------------
 */
-- Function "public.create_team_account"
-- Create a team account if team accounts are enabled
create
or replace function public.create_team_account (account_name text) returns public.accounts
set
  search_path = '' as $$
declare
    new_account public.accounts;
begin
    if (not public.is_set('enable_team_accounts')) then
        raise exception 'Team accounts are not enabled';
    end if;

    insert into public.accounts(
        name,
        is_personal_account)
    values (
        account_name,
        false)
returning
    * into new_account;

    return new_account;

end;

$$ language plpgsql;

grant
execute on function public.create_team_account (text) to authenticated,
service_role;

-- RLS(public.accounts)
-- Authenticated users can create team accounts
create policy create_org_account on public.accounts for insert to authenticated
with
  check (
    public.is_set ('enable_team_accounts')
    and public.accounts.is_personal_account = false
  );

-- RLS(public.accounts)
-- Authenticated users can delete team accounts
create policy delete_team_account
    on public.accounts
    for delete
    to authenticated
    using (
        auth.uid() = primary_owner_user_id
    );

-- TODO: simplify — get_account_members removed; referenced accounts_memberships
-- and roles tables which were part of the template RBAC (now deleted).
-- Member listing should be implemented via hr_employee queries instead.