import { historial } from "@/lib/puntaje";
import type { Respuesta, Slot } from "@/lib/tipos";

/** Marcador por ronda con el total acumulado. */
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
    <div className="hoja max-w-xl">
      <table>
        <thead>
          <tr>
            <th className="w-20 text-center!">Ronda</th>
            <th className="w-20 text-center!">Letra</th>
            {orden.map((s) => <th key={s} className="text-right!">{s === miSlot ? "Tú" : nombres[s]}</th>)}
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => {
            const gana: Slot | null = f.puntos[1] === f.puntos[2] ? null : f.puntos[1] > f.puntos[2] ? 1 : 2;
            return (
              <tr key={f.ronda}>
                <td className="text-center text-tinta-suave tabular-nums">{f.ronda}</td>
                <td className="text-center font-bold">{f.letra}</td>
                {orden.map((s) => (
                  <td key={s} className={`text-right tabular-nums ${gana === s ? "font-bold text-verde" : ""}`}>{f.puntos[s]}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="bg-cabecera">
            <td colSpan={2} className="border-t border-borde px-3 py-2.5 font-bold">Total</td>
            {orden.map((s) => (
              <td key={s} className="border-t border-l border-borde px-3 py-2.5 text-right text-lg font-black tabular-nums">{totales[s]}</td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
