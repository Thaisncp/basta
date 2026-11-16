"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase, supabaseConfigurado } from "@/lib/supabase";
import * as acciones from "@/lib/acciones";
import { guardarNombre, guardarSlot, leerNombre, leerSlot } from "@/lib/local";
import { buscarRespuesta } from "@/lib/puntaje";
import type { Jugador, Partida, Respuesta, Slot } from "@/lib/tipos";
import Espera from "./Espera";
import Tablero from "./Tablero";
import Revision from "./Revision";
import Final from "./Final";

type Borrador = { ronda: number; valores: Record<string, string> } | null;

function mezclarRespuesta(lista: Respuesta[], r: Respuesta): Respuesta[] {
  const resto = lista.filter((x) => !(x.ronda === r.ronda && x.slot === r.slot));
  return [...resto, r];
}

export default function Sala({ codigo }: { codigo: string }) {
  const [partida, setPartida] = useState<Partida | null>(null);
  const [jugadores, setJugadores] = useState<Jugador[]>([]);
  const [respuestas, setRespuestas] = useState<Respuesta[]>([]);
  // Sala solo se pinta tras cargar en el cliente, así que leer localStorage aquí no causa desajustes de hidratación.
  const [miSlot, setMiSlot] = useState<Slot | null>(() => (typeof window === "undefined" ? null : leerSlot(codigo)));
  const [estadoCarga, setEstadoCarga] = useState<"cargando" | "listo" | "no-existe" | "error">(
    supabaseConfigurado ? "cargando" : "error",
  );
  const [aviso, setAviso] = useState<string | null>(null);
  const borrador = useRef<Borrador>(null);

  const mostrarError = useCallback((e: unknown) => {
    console.error(e);
    setAviso("Hubo un problema de conexión. Inténtalo otra vez.");
  }, []);

  const recargar = useCallback(async () => {
    try {
      const sala = await acciones.cargarSala(codigo);
      if (!sala) return setEstadoCarga("no-existe");
      setPartida(sala.partida);
      setJugadores(sala.jugadores);
      setRespuestas(sala.respuestas);
      setEstadoCarga("listo");
    } catch (e) {
      console.error(e);
      setEstadoCarga("error");
    }
  }, [codigo]);

  // Carga inicial
  useEffect(() => {
    // recargar() es asíncrona: el estado se actualiza cuando llega la respuesta del servidor.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (supabaseConfigurado) recargar();
  }, [recargar]);

  // Tiempo real
  const partidaId = partida?.id;
  useEffect(() => {
    if (!partidaId) return;
    const canal = supabase
      .channel(`sala-${partidaId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "partidas", filter: `id=eq.${partidaId}` },
        (pl) => setPartida(pl.new as Partida))
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "jugadores", filter: `partida_id=eq.${partidaId}` },
        (pl) => setJugadores((js) => [...js.filter((j) => j.slot !== (pl.new as Jugador).slot), pl.new as Jugador]))
      .on("postgres_changes", { event: "*", schema: "public", table: "respuestas", filter: `partida_id=eq.${partidaId}` },
        (pl) => { if (pl.new && "ronda" in pl.new) setRespuestas((rs) => mezclarRespuesta(rs, pl.new as Respuesta)); })
      .subscribe((estado) => {
        // Al (re)conectar, sincroniza por si se perdió algún cambio.
        if (estado === "SUBSCRIBED") recargar();
      });

    const alVolver = () => { if (document.visibilityState === "visible") recargar(); };
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      document.removeEventListener("visibilitychange", alVolver);
      supabase.removeChannel(canal);
    };
  }, [partidaId, recargar]);

  const guardarBorrador = useCallback(async () => {
    const b = borrador.current;
    if (!partida || !miSlot || !b) return;
    try {
      const r = await acciones.guardarValores(partida.id, b.ronda, miSlot, b.valores);
      setRespuestas((rs) => mezclarRespuesta(rs, r));
    } catch (e) {
      mostrarError(e);
    }
  }, [partida, miSlot, mostrarError]);

  // Si el rival paró la mano, guardo lo que alcancé a escribir.
  const estado = partida?.estado;
  const ronda = partida?.ronda;
  useEffect(() => {
    if (estado === "revision" && borrador.current?.ronda === ronda) {
      guardarBorrador().then(() => { borrador.current = null; });
    }
  }, [estado, ronda, guardarBorrador]);

  // ---------- Acciones ----------
  async function entrar(nombre: string, slotPedido?: Slot) {
    if (!partida) return;
    guardarNombre(nombre);
    const libre: Slot = slotPedido ?? (jugadores.some((j) => j.slot === 1) ? 2 : 1);
    try {
      const j = await acciones.unirse(partida.id, libre, nombre);
      setJugadores((js) => [...js.filter((x) => x.slot !== j.slot), j]);
      guardarSlot(codigo, j.slot);
      setMiSlot(j.slot);
    } catch (e) {
      const ocupado = (e as { code?: string }).code === "23505";
      setAviso(ocupado ? "Alguien acaba de entrar en ese lugar." : "No se pudo entrar a la sala.");
      recargar();
    }
  }

  function soyYo(slot: Slot) {
    guardarSlot(codigo, slot);
    setMiSlot(slot);
  }

  async function ejecutar(fn: () => Promise<Partida | null>) {
    try {
      const p = await fn();
      if (p) setPartida(p);
      else recargar(); // otro jugador se adelantó
    } catch (e) {
      mostrarError(e);
    }
  }

  async function parar() {
    if (!partida || !miSlot) return;
    await guardarBorrador();
    borrador.current = null;
    await ejecutar(() => acciones.pararMano(partida, miSlot));
  }

  async function corregir(slot: Slot, categoria: string, valor: number | null) {
    if (!partida) return;
    try {
      const r = await acciones.corregir(partida.id, partida.ronda, slot, categoria, valor);
      setRespuestas((rs) => mezclarRespuesta(rs, r));
    } catch (e) {
      mostrarError(e);
    }
  }

  // ---------- Render ----------
  if (estadoCarga === "cargando") return <Centro>Cargando sala…</Centro>;
  if (estadoCarga === "no-existe")
    return (
      <Centro>
        <p className="text-lg">No existe la sala <b>{codigo}</b>.</p>
        <Link href="/" className="boton-secundario mt-4">Volver al inicio</Link>
      </Centro>
    );
  if (estadoCarga === "error" || !partida)
    return (
      <Centro>
        <p className="text-lg">No se pudo conectar con el servidor.</p>
        <button onClick={recargar} className="boton-secundario mt-4">Reintentar</button>
      </Centro>
    );

  const yo = jugadores.find((j) => j.slot === miSlot);
  const rivalSlot: Slot = miSlot === 2 ? 1 : 2;
  const rival = jugadores.find((j) => j.slot === rivalSlot);
  const nombres: Record<Slot, string> = {
    1: jugadores.find((j) => j.slot === 1)?.nombre ?? "Jugador 1",
    2: jugadores.find((j) => j.slot === 2)?.nombre ?? "Jugador 2",
  };

  let contenido: React.ReactNode;
  if (!yo) {
    contenido = (
      <Espera.Entrar
        jugadores={jugadores}
        nombreInicial={leerNombre()}
        enCurso={partida.estado !== "esperando"}
        onEntrar={entrar}
        onSoyYo={soyYo}
      />
    );
  } else if (partida.estado === "esperando") {
    contenido = (
      <Espera
        codigo={codigo}
        jugadores={jugadores}
        onEmpezar={() => ejecutar(() => acciones.nuevaRonda(partida))}
      />
    );
  } else if (partida.estado === "jugando") {
    contenido = (
      <Tablero
        key={partida.ronda}
        partida={partida}
        inicial={buscarRespuesta(respuestas, partida.ronda, yo.slot)?.valores ?? {}}
        rival={buscarRespuesta(respuestas, partida.ronda, rivalSlot)}
        nombreRival={rival?.nombre ?? "Rival"}
        onCambio={(valores) => { borrador.current = { ronda: partida.ronda, valores }; }}
        onGuardar={guardarBorrador}
        onParar={parar}
      />
    );
  } else if (partida.estado === "revision") {
    contenido = (
      <Revision
        partida={partida}
        respuestas={respuestas}
        miSlot={yo.slot}
        nombres={nombres}
        onCorregir={corregir}
        onContinuar={() => ejecutar(() => acciones.nuevaRonda(partida))}
        onFinalizar={() => {
          if (confirm("¿Terminar la partida? Se mostrará el marcador final.")) ejecutar(() => acciones.finalizarPartida(partida));
        }}
      />
    );
  } else {
    contenido = <Final partida={partida} respuestas={respuestas} miSlot={yo.slot} nombres={nombres} />;
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <header className="mb-6 flex items-center justify-between gap-3">
        <Link href="/" className="text-2xl font-black tracking-tight text-rojo">¡Basta!</Link>
        <div className="text-right text-sm text-tinta-suave">
          Sala <span className="font-mono font-bold text-tinta">{codigo}</span>
          {yo && <div>Juegas como <b className="text-tinta">{yo.nombre}</b></div>}
        </div>
      </header>
      {aviso && (
        <div className="mb-4 flex items-start justify-between gap-3 rounded-xl bg-rojo/10 px-4 py-3 text-sm text-rojo">
          <span>{aviso}</span>
          <button onClick={() => setAviso(null)} aria-label="Cerrar aviso" className="font-bold">✕</button>
        </div>
      )}
      {contenido}
    </main>
  );
}

function Centro({ children }: { children: React.ReactNode }) {
  return <main className="flex flex-1 flex-col items-center justify-center p-6 text-center">{children}</main>;
}
