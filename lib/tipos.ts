export type Slot = 1 | 2;
export type Estado = "esperando" | "jugando" | "revision" | "finalizada";

export interface Partida {
  id: string;
  codigo: string;
  estado: Estado;
  ronda: number;
  letra: string | null;
  letras: string[];
  parado_por: Slot | null;
}

export interface Jugador {
  id: string;
  partida_id: string;
  slot: Slot;
  nombre: string;
}

export interface Respuesta {
  partida_id: string;
  ronda: number;
  slot: Slot;
  valores: Record<string, string>;
  correcciones: Record<string, number>;
}
