-- =====================================================================
-- Basta en línea — esquema para Supabase
-- Pegar completo en: Supabase > SQL Editor > New query > Run
-- =====================================================================

create extension if not exists pgcrypto;

-- Una partida = una sala con su código para compartir.
create table if not exists partidas (
  id             uuid primary key default gen_random_uuid(),
  codigo         text not null unique,
  estado         text not null default 'esperando'
                 check (estado in ('esperando', 'jugando', 'revision', 'finalizada')),
  ronda          int  not null default 0,
  letra          text,                       -- letra de la ronda actual
  letras         text[] not null default '{}', -- letra de cada ronda (posición = ronda - 1)
  parado_por     smallint check (parado_por in (1, 2)), -- quién dijo "¡Párame la mano!"
  creada_en      timestamptz not null default now(),
  actualizada_en timestamptz not null default now()
);

-- Los dos jugadores de cada partida (slot 1 = quien crea, slot 2 = quien se une).
create table if not exists jugadores (
  id         uuid primary key default gen_random_uuid(),
  partida_id uuid not null references partidas (id) on delete cascade,
  slot       smallint not null check (slot in (1, 2)),
  nombre     text not null check (char_length(nombre) between 1 and 30),
  creado_en  timestamptz not null default now(),
  unique (partida_id, slot)
);

-- Lo que escribió cada jugador en cada ronda + las correcciones manuales (0/50/100).
create table if not exists respuestas (
  partida_id     uuid not null references partidas (id) on delete cascade,
  ronda          int not null,
  slot           smallint not null check (slot in (1, 2)),
  valores        jsonb not null default '{}',  -- {"nombre": "Ulises", "color": "Uva"...}
  correcciones   jsonb not null default '{}',  -- {"color": 0}  (vacío = automático)
  actualizada_en timestamptz not null default now(),
  primary key (partida_id, ronda, slot)
);

-- Corrección atómica de una categoría (null = volver a automático).
create or replace function corregir(
  p_partida uuid, p_ronda int, p_slot int, p_categoria text, p_valor int
) returns respuestas
language sql
as $$
  insert into respuestas (partida_id, ronda, slot, correcciones)
  values (
    p_partida, p_ronda, p_slot::smallint,
    case when p_valor is null then '{}'::jsonb
         else jsonb_build_object(p_categoria, p_valor) end
  )
  on conflict (partida_id, ronda, slot) do update
    set correcciones = case
          when p_valor is null then respuestas.correcciones - p_categoria
          else respuestas.correcciones || jsonb_build_object(p_categoria, p_valor)
        end,
        actualizada_en = now()
  returning *;
$$;

-- ---------------------------------------------------------------------
-- Permisos: juego casual sin login, cualquiera con el código puede jugar.
-- No se permite borrar nada desde el navegador.
-- ---------------------------------------------------------------------
alter table partidas   enable row level security;
alter table jugadores  enable row level security;
alter table respuestas enable row level security;

drop policy if exists "leer partidas" on partidas;
drop policy if exists "crear partidas" on partidas;
drop policy if exists "actualizar partidas" on partidas;
create policy "leer partidas"       on partidas for select using (true);
create policy "crear partidas"      on partidas for insert with check (true);
create policy "actualizar partidas" on partidas for update using (true) with check (true);

drop policy if exists "leer jugadores" on jugadores;
drop policy if exists "crear jugadores" on jugadores;
create policy "leer jugadores"  on jugadores for select using (true);
create policy "crear jugadores" on jugadores for insert with check (true);

drop policy if exists "leer respuestas" on respuestas;
drop policy if exists "crear respuestas" on respuestas;
drop policy if exists "actualizar respuestas" on respuestas;
create policy "leer respuestas"       on respuestas for select using (true);
create policy "crear respuestas"      on respuestas for insert with check (true);
create policy "actualizar respuestas" on respuestas for update using (true) with check (true);

grant execute on function corregir(uuid, int, int, text, int) to anon, authenticated;

-- ---------------------------------------------------------------------
-- Tiempo real: avisar a los dos navegadores de cada cambio.
-- ---------------------------------------------------------------------
alter table respuestas replica identity full;

do $$
begin
  begin alter publication supabase_realtime add table partidas;   exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table jugadores;  exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table respuestas; exception when duplicate_object then null; end;
end $$;
