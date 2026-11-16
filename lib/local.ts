// Recuerda en este navegador qué jugador eres en cada sala.
import type { Slot } from "./tipos";

function leer(clave: string): string | null {
  try {
    return window.localStorage.getItem(clave);
  } catch {
    return null;
  }
}

function escribir(clave: string, valor: string) {
  try {
    window.localStorage.setItem(clave, valor);
  } catch {
    /* modo privado: se juega igual, solo no se recuerda */
  }
}

export const leerSlot = (codigo: string): Slot | null => {
  const v = leer(`basta:slot:${codigo}`);
  return v === "1" ? 1 : v === "2" ? 2 : null;
};
export const guardarSlot = (codigo: string, slot: Slot) => escribir(`basta:slot:${codigo}`, String(slot));
export const leerNombre = () => leer("basta:nombre") ?? "";
export const guardarNombre = (nombre: string) => escribir("basta:nombre", nombre);
