// Reglas del juego (tomadas del prototipo en Google Sheets).

export const CATEGORIAS = [
  { id: "nombre", nombre: "Nombre" },
  { id: "apellido", nombre: "Apellido" },
  { id: "ciudad", nombre: "Ciudad o país" },
  { id: "color", nombre: "Color" },
  { id: "fruta", nombre: "Fruta" },
  { id: "animal", nombre: "Animal" },
  { id: "cosa", nombre: "Cosa" },
] as const;

export type CategoriaId = (typeof CATEGORIAS)[number]["id"];

// Letras que pueden salir (sin K, Ñ, Q, W, X, Y, Z por difíciles).
// No se repite ninguna hasta que salgan todas.
export const LETRAS = "ABCDEFGHIJLMNOPRSTUV".split("");

export const PUNTOS = {
  unica: 100, // respuesta válida distinta a la del rival
  repetida: 50, // misma respuesta que el rival
  invalida: 0, // vacía o no empieza con la letra
} as const;

// Valores que se pueden elegir al corregir (igual que en la hoja).
export const OPCIONES_CORRECCION = [0, 50, 100] as const;

// true = solo se puede decir "¡Párame la mano!" con todas las categorías llenas.
export const EXIGIR_TODO_LLENO = true;

export const MAX_CARACTERES = 40;
