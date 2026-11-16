import { supabase } from "./supabase";
import { sortearLetra } from "./puntaje";
import type { Jugador, Partida, Respuesta, Slot } from "./tipos";

const ALFABETO_CODIGO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0/O ni 1/I

function generarCodigo(largo = 5) {
  let c = "";
  for (let i = 0; i < largo; i++) c += ALFABETO_CODIGO[Math.floor(Math.random() * ALFABETO_CODIGO.length)];
  return c;
}

export async function crearPartida(nombre: string): Promise<string> {
  for (let intento = 0; intento < 5; intento++) {
    const codigo = generarCodigo();
    const { data, error } = await supabase.from("partidas").insert({ codigo }).select().single();
    if (error?.code === "23505") continue; // código repetido, otro intento
    if (error) throw error;
    await unirse(data.id, 1, nombre);
    return codigo;
  }
  throw new Error("No se pudo generar un código de sala");
}

export async function unirse(partidaId: string, slot: Slot, nombre: string): Promise<Jugador> {
  const { data, error } = await supabase
    .from("jugadores")
    .insert({ partida_id: partidaId, slot, nombre: nombre.trim().slice(0, 30) })
    .select()
    .single();
  if (error) throw error;
  return data as Jugador;
}

export async function cargarSala(codigo: string) {
  const { data: partida, error } = await supabase
    .from("partidas")
    .select("*")
    .eq("codigo", codigo)
    .maybeSingle();
  if (error) throw error;
  if (!partida) return null;
  const [jug, resp] = await Promise.all([
    supabase.from("jugadores").select("*").eq("partida_id", partida.id),
    supabase.from("respuestas").select("*").eq("partida_id", partida.id),
  ]);
  if (jug.error) throw jug.error;
  if (resp.error) throw resp.error;
  return {
    partida: partida as Partida,
    jugadores: (jug.data ?? []) as Jugador[],
    respuestas: (resp.data ?? []) as Respuesta[],
  };
}

/** Empieza la partida o pasa a la siguiente ronda (solo si nadie lo hizo ya). */
export async function nuevaRonda(p: Partida): Promise<Partida | null> {
  const letra = sortearLetra(p.letras);
  const { data, error } = await supabase
    .from("partidas")
    .update({
      estado: "jugando",
      ronda: p.ronda + 1,
      letra,
      letras: [...p.letras, letra],
      parado_por: null,
      actualizada_en: new Date().toISOString(),
    })
    .eq("id", p.id)
    .eq("ronda", p.ronda)
    .in("estado", ["esperando", "revision"])
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as Partida | null;
}

/** "¡Párame la mano!": cierra la ronda para los dos. */
export async function pararMano(p: Partida, slot: Slot): Promise<Partida | null> {
  const { data, error } = await supabase
    .from("partidas")
    .update({ estado: "revision", parado_por: slot, actualizada_en: new Date().toISOString() })
    .eq("id", p.id)
    .eq("ronda", p.ronda)
    .eq("estado", "jugando")
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as Partida | null;
}

export async function finalizarPartida(p: Partida): Promise<Partida | null> {
  const { data, error } = await supabase
    .from("partidas")
    .update({ estado: "finalizada", actualizada_en: new Date().toISOString() })
    .eq("id", p.id)
    .eq("estado", "revision")
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as Partida | null;
}

export async function guardarValores(
  partidaId: string,
  ronda: number,
  slot: Slot,
  valores: Record<string, string>,
): Promise<Respuesta> {
  const { data, error } = await supabase
    .from("respuestas")
    .upsert(
      { partida_id: partidaId, ronda, slot, valores, actualizada_en: new Date().toISOString() },
      { onConflict: "partida_id,ronda,slot" },
    )
    .select()
    .single();
  if (error) throw error;
  return data as Respuesta;
}

export async function corregir(
  partidaId: string,
  ronda: number,
  slot: Slot,
  categoria: string,
  valor: number | null,
): Promise<Respuesta> {
  const { data, error } = await supabase.rpc("corregir", {
    p_partida: partidaId,
    p_ronda: ronda,
    p_slot: slot,
    p_categoria: categoria,
    p_valor: valor,
  });
  if (error) throw error;
  return data as Respuesta;
}
