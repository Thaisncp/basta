"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { crearPartida } from "@/lib/acciones";
import { guardarNombre, guardarSlot, leerNombre } from "@/lib/local";
import { supabaseConfigurado } from "@/lib/supabase";
import { CATEGORIAS } from "@/lib/config";

export default function Inicio() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [codigo, setCodigo] = useState("");
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Se lee después de hidratar para que el HTML del servidor y del cliente coincidan.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setNombre(leerNombre()), []);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    setCreando(true);
    setError(null);
    try {
      guardarNombre(nombre.trim());
      const c = await crearPartida(nombre.trim());
      guardarSlot(c, 1);
      router.push(`/sala/${c}`);
    } catch (err) {
      console.error(err);
      setError("No se pudo crear la partida. Revisa tu conexión.");
      setCreando(false);
    }
  }

  function unirse(e: React.FormEvent) {
    e.preventDefault();
    const c = codigo.trim().toUpperCase();
    if (c) router.push(`/sala/${c}`);
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-10">
      <div className="text-center">
        <h1 className="text-6xl font-black tracking-tight text-primario">¡Basta!</h1>
        <p className="mt-2 text-tinta-suave">Párame la mano · 2 jugadores en línea</p>
        <p className="mt-3 text-sm text-tinta-suave">{CATEGORIAS.map((c) => c.nombre).join(" · ")}</p>
      </div>

      {!supabaseConfigurado && (
        <p className="rounded-xl bg-amarillo/30 px-4 py-3 text-sm">
          Falta configurar Supabase (<code>NEXT_PUBLIC_SUPABASE_URL</code> y <code>NEXT_PUBLIC_SUPABASE_KEY</code>).
        </p>
      )}

      <form onSubmit={crear} className="tarjeta space-y-4">
        <h2 className="text-lg font-bold">Nueva partida</h2>
        <label className="block space-y-1">
          <span className="text-sm text-tinta-suave">Tu nombre</span>
          <input maxLength={30} value={nombre} onChange={(e) => setNombre(e.target.value)} className="campo w-full" />
        </label>
        <button disabled={!nombre.trim() || creando || !supabaseConfigurado} className="boton-principal w-full">
          {creando ? "Creando…" : "Crear partida"}
        </button>
        {error && <p className="text-sm text-primario">{error}</p>}
      </form>

      <form onSubmit={unirse} className="tarjeta space-y-4">
        <h2 className="text-lg font-bold">Tengo un código</h2>
        <div className="flex gap-2">
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            maxLength={8}
            placeholder="ABC23"
            className="campo min-w-0 flex-1 font-mono uppercase tracking-widest"
          />
          <button disabled={!codigo.trim()} className="boton-secundario">Unirme</button>
        </div>
      </form>
    </main>
  );
}
