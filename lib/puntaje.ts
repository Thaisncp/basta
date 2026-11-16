import { CATEGORIAS, LETRAS, PUNTOS, type CategoriaId } from "./config";
import type { Respuesta, Slot } from "./tipos";

/** Minúsculas, sin tildes (pero conservando la ñ) y sin espacios de sobra. */
export function normalizar(texto: string | undefined | null): string {
  return (texto ?? "")
    .toLowerCase()
    .replace(/ñ/g, "\u0000")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/\u0000/g, "ñ")
    .replace(/\s+/g, " ")
    .trim();
}

export function empiezaCon(texto: string | undefined, letra: string | null): boolean {
  const t = normalizar(texto);
  return Boolean(letra) && t.length > 0 && t.startsWith(normalizar(letra));
}

export interface DetalleCategoria {
  categoria: CategoriaId;
  valor: string;
  automatico: number;
  correccion: number | null;
  puntos: number;
}

/** Puntaje automático de una categoría, comparando con la respuesta del rival. */
export function puntajeAutomatico(
  mio: string | undefined,
  rival: string | undefined,
  letra: string | null,
): number {
  if (!empiezaCon(mio, letra)) return PUNTOS.invalida;
  if (empiezaCon(rival, letra) && normalizar(mio) === normalizar(rival)) return PUNTOS.repetida;
  return PUNTOS.unica;
}

export function detalleRonda(
  mia: Respuesta | undefined,
  rival: Respuesta | undefined,
  letra: string | null,
): { detalle: DetalleCategoria[]; total: number } {
  const detalle = CATEGORIAS.map(({ id }) => {
    const valor = mia?.valores?.[id] ?? "";
    const automatico = puntajeAutomatico(valor, rival?.valores?.[id], letra);
    const c = mia?.correcciones?.[id];
    const correccion = typeof c === "number" ? c : null;
    return { categoria: id, valor, automatico, correccion, puntos: correccion ?? automatico };
  });
  return { detalle, total: detalle.reduce((s, d) => s + d.puntos, 0) };
}

export function buscarRespuesta(
  respuestas: Respuesta[],
  ronda: number,
  slot: Slot,
): Respuesta | undefined {
  return respuestas.find((r) => r.ronda === ronda && r.slot === slot);
}

export interface FilaHistorial {
  ronda: number;
  letra: string | null;
  puntos: Record<Slot, number>;
}

/** Totales por ronda ya cerrada (hasta `hastaRonda` inclusive). */
export function historial(
  respuestas: Respuesta[],
  letras: string[],
  hastaRonda: number,
): { filas: FilaHistorial[]; totales: Record<Slot, number> } {
  const filas: FilaHistorial[] = [];
  const totales: Record<Slot, number> = { 1: 0, 2: 0 };
  for (let ronda = 1; ronda <= hastaRonda; ronda++) {
    const letra = letras[ronda - 1] ?? null;
    const r1 = buscarRespuesta(respuestas, ronda, 1);
    const r2 = buscarRespuesta(respuestas, ronda, 2);
    const puntos = {
      1: detalleRonda(r1, r2, letra).total,
      2: detalleRonda(r2, r1, letra).total,
    };
    totales[1] += puntos[1];
    totales[2] += puntos[2];
    filas.push({ ronda, letra, puntos });
  }
  return { filas, totales };
}

/** Sortea una letra que no haya salido en el ciclo actual. */
export function sortearLetra(letras: string[], azar: () => number = Math.random): string {
  const enCiclo = letras.slice(letras.length - (letras.length % LETRAS.length));
  const disponibles = LETRAS.filter((l) => !enCiclo.includes(l));
  return disponibles[Math.floor(azar() * disponibles.length)];
}
