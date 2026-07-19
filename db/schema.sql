create table public.plants (
  plant_id text not null,
  name text not null,
  species text null,
  watering_notes text null,
  ideal_moisture_min numeric(5, 2) null,
  ideal_moisture_max numeric(5, 2) null,
  created_at timestamp with time zone not null default now(),
  constraint plants_pkey primary key (plant_id)
);

create table public.readings (
  id bigint generated always as identity not null,
  created_at timestamp with time zone not null default now(),
  plant_id text not null,
  moisture_raw integer not null,
  moisture_pct numeric(5, 2) null,
  ph_level numeric(4, 2) null,
  constraint readings_pkey primary key (id),
  constraint readings_plant_id_fkey foreign key (plant_id) references plants (plant_id)
);
create index if not exists idx_readings_plant_time on public.readings using btree (plant_id, created_at desc);

create table public.decisions (
  id bigint generated always as identity not null,
  created_at timestamp with time zone not null default now(),
  plant_id text not null,
  decision text not null,
  reasoning text not null,
  moisture_trend_summary text null,
  weather_summary text null,
  notified boolean not null default false,
  constraint decisions_pkey primary key (id),
  constraint decisions_plant_id_fkey foreign key (plant_id) references plants (plant_id),
  constraint decisions_decision_check check (decision = any (array['water'::text, 'hold'::text, 'skip'::text]))
);
create index if not exists idx_decisions_plant_time on public.decisions using btree (plant_id, created_at desc);
