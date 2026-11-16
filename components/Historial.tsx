import { historial } from "@/lib/puntaje";
import type { Respuesta, Slot } from "@/lib/tipos";

/** Tabla de rondas jugadas con el acumulado, como la columna Total de la hoja. */
export default function Historial({
  respuestas,
  letras,
  hastaRonda,
  nombres,
  miSlot,
}: {
  respuestas: Respuesta[];
  letras: string[];
  hastaRonda: number;
  nombres: Record<Slot, string>;
  miSlot: Slot;
}) {
  const { filas, totales } = historial(respuestas, letras, hastaRonda);
  const orden: Slot[] = miSlot === 1 ? [1, 2] : [2, 1];
  if (filas.length === 0) return null;
  return (
    <div className="tarjeta overflow-x-auto p-0!">
      <table className="w-full text-center text-sm">
        <thead className="bg-crema-oscuro text-tinta-suave">
          <tr>
            <th className="px-3 py-2 font-semibold">Ronda</th>
            <th className="px-3 py-2 font-semibold">Letra</th>
            {orden.map((s) => <th key={s} className="px-3 py-2 font-semibold">{nombres[s]}</th>)}
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.ronda} className="border-t border-borde">
              <td className="px-3 py-2">{f.ronda}</td>
              <td className="px-3 py-2 font-bold">{f.letra}</td>
              {orden.map((s) => <td key={s} className="px-3 py-2 tabular-nums">{f.puntos[s]}</td>)}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-tinta font-black">
            <td className="px-3 py-2" colSpan={2}>Total</td>
            {orden.map((s) => <td key={s} className="px-3 py-2 tabular-nums">{totales[s]}</td>)}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
