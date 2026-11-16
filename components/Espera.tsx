"use client";

import { useState } from "react";
import type { Jugador, Slot } from "@/lib/tipos";

/** Sala de espera: compartir el enlace y empezar cuando estén los dos. */
function Espera({
  codigo,
  jugadores,
  onEmpezar,
}: {
  codigo: string;
  jugadores: Jugador[];
  onEmpezar: () => void;
}) {
  const [enlace] = useState(() => (typeof window === "undefined" ? "" : window.location.href));
  const [copiado, setCopiado] = useState(false);
  const [empezando, setEmpezando] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(enlace);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* sin portapapeles: el enlace queda visible para copiarlo a mano */
    }
  }

  async function compartir() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "¡Basta!", text: "Juguemos Basta", url: enlace });
        return;
      } catch {
        /* cancelado */
      }
    }
    copiar();
  }

  const listos = jugadores.length === 2;

  return (
    <section className="tarjeta space-y-6 text-center">
      <div>
        <p className="text-sm uppercase tracking-widest text-tinta-suave">Código de sala</p>
        <p className="font-mono text-5xl font-black tracking-[0.2em] text-tinta">{codigo}</p>
      </div>

      <div className="space-y-2">
        <p className="text-tinta-suave">Envía este enlace a tu rival:</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input readOnly value={enlace} className="campo flex-1 text-sm" onFocus={(e) => e.target.select()} />
          <button onClick={compartir} className="boton-secundario">{copiado ? "¡Copiado!" : "Compartir"}</button>
        </div>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {([1, 2] as Slot[]).map((slot) => {
          const j = jugadores.find((x) => x.slot === slot);
          return (
            <li key={slot} className={`rounded-xl border-2 px-4 py-3 ${j ? "border-verde bg-verde/10" : "border-dashed border-borde text-tinta-suave"}`}>
              {j ? <b>{j.nombre}</b> : "Esperando rival…"}
            </li>
          );
        })}
      </ul>

      <button
        disabled={!listos || empezando}
        onClick={() => { setEmpezando(true); onEmpezar(); }}
        className="boton-principal w-full"
      >
        {listos ? "Empezar partida" : "Esperando al segundo jugador"}
      </button>
    </section>
  );
}

/** Formulario para entrar a una sala (o recuperar tu lugar si ya estabas). */
function Entrar({
  jugadores,
  nombreInicial,
  enCurso,
  onEntrar,
  onSoyYo,
}: {
  jugadores: Jugador[];
  nombreInicial: string;
  enCurso: boolean;
  onEntrar: (nombre: string) => void;
  onSoyYo: (slot: Slot) => void;
}) {
  const [nombre, setNombre] = useState(nombreInicial);
  const llena = jugadores.length >= 2;

  if (llena || enCurso) {
    return (
      <section className="tarjeta space-y-4 text-center">
        <p className="text-lg">Esta partida ya tiene a sus dos jugadores.</p>
        <p className="text-tinta-suave">Si eres uno de ellos y cambiaste de navegador, elige quién eres:</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          {jugadores.map((j) => (
            <button key={j.slot} onClick={() => onSoyYo(j.slot)} className="boton-secundario">Soy {j.nombre}</button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <form
      className="tarjeta space-y-4"
      onSubmit={(e) => { e.preventDefault(); if (nombre.trim()) onEntrar(nombre.trim()); }}
    >
      <p className="text-lg">
        {jugadores[0] ? <><b>{jugadores[0].nombre}</b> te invitó a jugar.</> : "Entra a la sala."}
      </p>
      <label className="block space-y-1">
        <span className="text-sm text-tinta-suave">Tu nombre</span>
        <input autoFocus maxLength={30} value={nombre} onChange={(e) => setNombre(e.target.value)} className="campo w-full" />
      </label>
      <button disabled={!nombre.trim()} className="boton-principal w-full">Entrar</button>
    </form>
  );
}

Espera.Entrar = Entrar;
export default Espera;
