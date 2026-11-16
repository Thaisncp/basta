"use client";

import { useState } from "react";
import { CATEGORIAS, OPCIONES_CORRECCION } from "@/lib/config";
import { buscarRespuesta, detalleRonda, type DetalleCategoria } from "@/lib/puntaje";
import type { Partida, Respuesta, Slot } from "@/lib/tipos";
import Historial from "./Historial";
import Puntos from "./Puntos";

/** Fin de ronda: las dos hojas una sobre otra, puntaje automático y corrección manual. */
export default function Revision({
  partida,
  respuestas,
  miSlot,
  nombres,
  onCorregir,
  onContinuar,
  onFinalizar,
}: {
  partida: Partida;
  respuestas: Respuesta[];
  miSlot: Slot;
  nombres: Record<Slot, string>;
  onCorregir: (slot: Slot, categoria: string, valor: number | null) => void;
  onContinuar: () => void;
  onFinalizar: () => void;
}) {
  const [avanzando, setAvanzando] = useState(false);
  const rivalSlot: Slot = miSlot === 1 ? 2 : 1;
  const orden: Slot[] = [miSlot, rivalSlot];
  const r: Record<Slot, Respuesta | undefined> = {
    1: buscarRespuesta(respuestas, partida.ronda, 1),
    2: buscarRespuesta(respuestas, partida.ronda, 2),
  };
  const res: Record<Slot, ReturnType<typeof detalleRonda>> = {
    1: detalleRonda(r[1], r[2], partida.letra),
    2: detalleRonda(r[2], r[1], partida.letra),
  };
  const quien = partida.parado_por === miSlot ? "Tú paraste la mano" : `${nombres[rivalSlot]} paró la mano`;

  return (
    <section className="space-y-4">
      <div className="tarjeta flex flex-wrap items-center gap-4 p-4!">
        <div className="grid size-16 shrink-0 place-items-center rounded-xl bg-alto text-4xl font-black text-white">{partida.letra}</div>
        <div className="min-w-0 flex-1">
          <p className="font-bold">🛑 {quien} · Ronda {partida.ronda}</p>
          <p className="text-sm text-tinta-suave">Revisen las respuestas. Si algo no vale, corrígelo en su casilla (Auto = cálculo automático).</p>
        </div>
      </div>

      <div className="hoja">
        <table className="min-w-[900px]">
          <thead>
            <tr>
              <th className="fija w-32">Jugador</th>
              {CATEGORIAS.map((c) => <th key={c.id}>{c.nombre}</th>)}
              <th className="w-20 text-right!">Total</th>
            </tr>
          </thead>
          <tbody>
            {orden.map((s) => (
              <tr key={s}>
                <td className={`fija align-middle! font-semibold ${s === miSlot ? "bg-primario-suave text-primario" : "bg-superficie"}`}>
                  <span className="block max-w-28 truncate">{s === miSlot ? "Tú" : nombres[s]}</span>
                </td>
                {res[s].detalle.map((d) => (
                  <Celda key={d.categoria} d={d} onCorregir={(v) => onCorregir(s, d.categoria, v)} />
                ))}
                <td className="text-right align-middle!"><Puntos valor={res[s].total} grande /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button disabled={avanzando} onClick={() => { setAvanzando(true); onContinuar(); }} className="boton-principal">
          Continuar ronda
        </button>
        <button onClick={onFinalizar} className="boton-secundario">Finalizar partida</button>
      </div>

      <h2 className="pt-2 text-sm font-semibold uppercase tracking-wide text-tinta-suave">Marcador</h2>
      <Historial respuestas={respuestas} letras={partida.letras} hastaRonda={partida.ronda} nombres={nombres} miSlot={miSlot} />
    </section>
  );
}

function Celda({ d, onCorregir }: { d: DetalleCategoria; onCorregir: (v: number | null) => void }) {
  const corregido = d.correccion !== null;
  return (
    <td className={corregido ? "bg-amarillo/8" : ""}>
      <p className={`mb-1.5 truncate font-medium ${d.valor.trim() ? "" : "italic text-tinta-suave"}`} title={d.valor}>
        {d.valor.trim() || "—"}
      </p>
      <div className="flex items-center gap-1.5">
        <Puntos valor={d.puntos} />
        <select
          aria-label="Corregir puntaje"
          value={corregido ? String(d.correccion) : ""}
          onChange={(e) => onCorregir(e.target.value === "" ? null : Number(e.target.value))}
          title={`Automático: ${d.automatico}`}
          className={`w-16 shrink-0 cursor-pointer rounded border bg-superficie px-1 py-0.5 text-xs outline-none ${
            corregido ? "border-amarillo font-semibold text-amber-700" : "border-borde text-tinta-suave"
          }`}
        >
          <option value="">Auto</option>
          {OPCIONES_CORRECCION.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    </td>
  );
}
