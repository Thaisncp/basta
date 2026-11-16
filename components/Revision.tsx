"use client";

import { useState } from "react";
import { CATEGORIAS, OPCIONES_CORRECCION } from "@/lib/config";
import { buscarRespuesta, detalleRonda, type DetalleCategoria } from "@/lib/puntaje";
import type { Partida, Respuesta, Slot } from "@/lib/tipos";
import Historial from "./Historial";

/** Fin de ronda: respuestas lado a lado, puntaje automático y corrección manual. */
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
  const r = { [miSlot]: buscarRespuesta(respuestas, partida.ronda, miSlot), [rivalSlot]: buscarRespuesta(respuestas, partida.ronda, rivalSlot) } as Record<Slot, Respuesta | undefined>;
  const res = {
    [miSlot]: detalleRonda(r[miSlot], r[rivalSlot], partida.letra),
    [rivalSlot]: detalleRonda(r[rivalSlot], r[miSlot], partida.letra),
  } as Record<Slot, ReturnType<typeof detalleRonda>>;

  const quien = partida.parado_por === miSlot ? "Tú paraste" : `${nombres[rivalSlot]} paró`;

  return (
    <section className="space-y-5">
      <div className="rounded-2xl bg-rojo px-5 py-4 text-white shadow-lg">
        <p className="text-lg font-bold">🛑 ¡Párame la mano! {quien} la ronda {partida.ronda}.</p>
        <p className="text-white/85">Letra <b>{partida.letra}</b>. Revisen las respuestas y corrijan si algo no vale.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 text-center">
        {orden.map((s) => (
          <div key={s} className="tarjeta py-3!">
            <p className="truncate text-sm text-tinta-suave">{s === miSlot ? "Tú" : nombres[s]}</p>
            <p className="text-3xl font-black tabular-nums">{res[s].total}</p>
          </div>
        ))}
      </div>

      <ul className="space-y-3">
        {CATEGORIAS.map(({ id, nombre }, i) => (
          <li key={id} className="tarjeta py-3!">
            <p className="mb-2 text-sm font-semibold text-tinta-suave">{nombre}</p>
            <div className="grid grid-cols-2 gap-3">
              {orden.map((s) => (
                <Celda
                  key={s}
                  d={res[s].detalle[i]}
                  onCorregir={(v) => onCorregir(s, id, v)}
                />
              ))}
            </div>
          </li>
        ))}
      </ul>

      <div className="grid gap-3 sm:grid-cols-2">
        <button disabled={avanzando} onClick={() => { setAvanzando(true); onContinuar(); }} className="boton-principal">
          Continuar ronda
        </button>
        <button onClick={onFinalizar} className="boton-secundario">Finalizar partida</button>
      </div>

      <h2 className="pt-2 text-lg font-bold">Marcador</h2>
      <Historial respuestas={respuestas} letras={partida.letras} hastaRonda={partida.ronda} nombres={nombres} miSlot={miSlot} />
    </section>
  );
}

function Celda({ d, onCorregir }: { d: DetalleCategoria; onCorregir: (v: number | null) => void }) {
  const corregido = d.correccion !== null;
  const color = d.puntos === 100 ? "bg-verde text-white" : d.puntos === 50 ? "bg-amarillo text-tinta" : "bg-borde text-tinta-suave";
  return (
    <div className="min-w-0 space-y-1">
      <p className={`truncate font-medium ${d.valor.trim() ? "" : "italic text-tinta-suave"}`} title={d.valor}>
        {d.valor.trim() || "—"}
      </p>
      <div className="flex items-center gap-2">
        <span className={`rounded-md px-2 py-0.5 text-sm font-bold tabular-nums ${color}`}>{d.puntos}</span>
        <select
          aria-label="Corregir puntaje"
          value={corregido ? String(d.correccion) : ""}
          onChange={(e) => onCorregir(e.target.value === "" ? null : Number(e.target.value))}
          className={`min-w-0 flex-1 rounded-md border px-1 py-0.5 text-xs ${corregido ? "border-rojo text-rojo" : "border-borde text-tinta-suave"}`}
        >
          <option value="">Auto ({d.automatico})</option>
          {OPCIONES_CORRECCION.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    </div>
  );
}
