"use client";

import { useEffect, useRef, useState } from "react";
import { CATEGORIAS, EXIGIR_TODO_LLENO, MAX_CARACTERES } from "@/lib/config";
import { buscarRespuesta, detalleRonda, empiezaCon } from "@/lib/puntaje";
import type { Partida, Respuesta, Slot } from "@/lib/tipos";
import Puntos from "./Puntos";

/** Ronda en juego, en formato de hoja: una fila por ronda, la actual se escribe aquí. */
export default function Tablero({
  partida,
  respuestas,
  miSlot,
  nombreRival,
  onCambio,
  onGuardar,
  onParar,
}: {
  partida: Partida;
  respuestas: Respuesta[];
  miSlot: Slot;
  nombreRival: string;
  onCambio: (valores: Record<string, string>) => void;
  onGuardar: () => void;
  onParar: () => void;
}) {
  const rivalSlot: Slot = miSlot === 1 ? 2 : 1;
  const [valores, setValores] = useState<Record<string, string>>(
    () => buscarRespuesta(respuestas, partida.ronda, miSlot)?.valores ?? {},
  );
  const [parando, setParando] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const letra = partida.letra;

  // Registra el borrador al montar (para guardarlo aunque no escriba nada).
  useEffect(() => {
    onCambio(valores);
    return () => { if (temporizador.current) clearTimeout(temporizador.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function cambiar(id: string, texto: string) {
    const nuevos = { ...valores, [id]: texto };
    setValores(nuevos);
    onCambio(nuevos);
    if (temporizador.current) clearTimeout(temporizador.current);
    temporizador.current = setTimeout(onGuardar, 700);
  }

  const llenas = CATEGORIAS.filter(({ id }) => empiezaCon(valores[id], letra)).length;
  const rival = buscarRespuesta(respuestas, partida.ronda, rivalSlot);
  const llenasRival = CATEGORIAS.filter(({ id }) => (rival?.valores?.[id] ?? "").trim()).length;
  const puedeParar = !EXIGIR_TODO_LLENO || llenas === CATEGORIAS.length;

  const anteriores = Array.from({ length: partida.ronda - 1 }, (_, i) => i + 1);
  let acumulado = 0;

  return (
    <section className="space-y-4">
      {/* Barra de la ronda */}
      <div className="tarjeta flex flex-wrap items-center gap-4 p-4!">
        <div className="grid size-16 shrink-0 place-items-center rounded-xl bg-primario text-4xl font-black text-white" aria-label={`Letra ${letra}`}>
          {letra}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold">Ronda {partida.ronda}</p>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-tinta-suave">
            <span>Tú: <b className="text-tinta tabular-nums">{llenas}/{CATEGORIAS.length}</b></span>
            <span>{nombreRival}: <b className="text-tinta tabular-nums">{llenasRival}/{CATEGORIAS.length}</b></span>
          </div>
        </div>
        <button
          disabled={!puedeParar || parando}
          onClick={() => { setParando(true); onParar(); }}
          className="boton-alto w-full text-lg sm:w-auto"
          title={puedeParar ? "" : `Llena las ${CATEGORIAS.length} categorías con la ${letra}`}
        >
          🛑 ¡Párame la mano!
        </button>
      </div>

      {/* Hoja */}
      <div className="hoja">
        <table className="min-w-[960px]">
          <thead>
            <tr>
              <th className="fija w-14 text-center!">Letra</th>
              {CATEGORIAS.map((c) => <th key={c.id}>{c.nombre}</th>)}
              <th className="w-20 text-right!">Total</th>
            </tr>
          </thead>
          <tbody>
            {anteriores.map((ronda) => {
              const l = partida.letras[ronda - 1] ?? null;
              const res = detalleRonda(
                buscarRespuesta(respuestas, ronda, miSlot),
                buscarRespuesta(respuestas, ronda, rivalSlot),
                l,
              );
              acumulado += res.total;
              return (
                <tr key={ronda} className="text-tinta-suave">
                  <td className="fija bg-superficie text-center font-bold text-tinta">{l}</td>
                  {res.detalle.map((d) => (
                    <td key={d.categoria}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate">{d.valor || "—"}</span>
                        <Puntos valor={d.puntos} />
                      </div>
                    </td>
                  ))}
                  <td className="text-right font-semibold text-tinta tabular-nums">{acumulado}</td>
                </tr>
              );
            })}

            {/* Ronda actual */}
            <tr className="bg-primario-suave">
              <td className="fija bg-primario-suave text-center align-middle! text-2xl font-black text-primario">{letra}</td>
              {CATEGORIAS.map(({ id, nombre }, i) => {
                const v = valores[id] ?? "";
                const mal = v.trim() !== "" && !empiezaCon(v, letra);
                const bien = empiezaCon(v, letra);
                return (
                  <td key={id} className="p-1.5!">
                    <input
                      aria-label={nombre}
                      autoFocus={i === 0}
                      value={v}
                      maxLength={MAX_CARACTERES}
                      onChange={(e) => cambiar(id, e.target.value)}
                      placeholder={`${letra}…`}
                      autoCapitalize="words"
                      autoCorrect="off"
                      autoComplete="off"
                      spellCheck={false}
                      className={`w-full rounded-md border bg-superficie px-2 py-2 outline-none transition focus:ring-2 ${
                        mal
                          ? "border-alto text-alto focus:ring-alto/20"
                          : bien
                            ? "border-verde/50 focus:border-primario focus:ring-primario/20"
                            : "border-borde focus:border-primario focus:ring-primario/20"
                      }`}
                    />
                  </td>
                );
              })}
              <td className="text-right align-middle! font-semibold tabular-nums">{acumulado}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {!puedeParar && (
        <p className="text-center text-sm text-tinta-suave">
          Para parar la mano llena las {CATEGORIAS.length} categorías con la letra <b>{letra}</b>. Lo que esté en rojo no empieza con esa letra.
        </p>
      )}
    </section>
  );
}
