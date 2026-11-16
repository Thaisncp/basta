"use client";

import { useEffect, useRef, useState } from "react";
import { CATEGORIAS, EXIGIR_TODO_LLENO, MAX_CARACTERES } from "@/lib/config";
import { empiezaCon } from "@/lib/puntaje";
import type { Partida, Respuesta } from "@/lib/tipos";

/** Ronda en juego: cada uno llena sus categorías sin ver las del otro. */
export default function Tablero({
  partida,
  inicial,
  rival,
  nombreRival,
  onCambio,
  onGuardar,
  onParar,
}: {
  partida: Partida;
  inicial: Record<string, string>;
  rival: Respuesta | undefined;
  nombreRival: string;
  onCambio: (valores: Record<string, string>) => void;
  onGuardar: () => void;
  onParar: () => void;
}) {
  const [valores, setValores] = useState<Record<string, string>>(inicial);
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
  const llenasRival = CATEGORIAS.filter(({ id }) => (rival?.valores?.[id] ?? "").trim()).length;
  const puedeParar = !EXIGIR_TODO_LLENO || llenas === CATEGORIAS.length;

  return (
    <section className="space-y-5">
      <div className="tarjeta flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-widest text-tinta-suave">Ronda {partida.ronda}</p>
          <p className="text-tinta-suave">
            {nombreRival}: <b className="text-tinta">{llenasRival}/{CATEGORIAS.length}</b> llenas
          </p>
        </div>
        <div className="grid size-24 shrink-0 place-items-center rounded-2xl bg-rojo text-6xl font-black text-white shadow-lg" aria-label={`Letra ${letra}`}>
          {letra}
        </div>
      </div>

      <form
        className="tarjeta grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => e.preventDefault()}
        autoComplete="off"
      >
        {CATEGORIAS.map(({ id, nombre }) => {
          const v = valores[id] ?? "";
          const mal = v.trim() !== "" && !empiezaCon(v, letra);
          return (
            <label key={id} className="block space-y-1">
              <span className="text-sm font-semibold">{nombre}</span>
              <input
                value={v}
                maxLength={MAX_CARACTERES}
                onChange={(e) => cambiar(id, e.target.value)}
                placeholder={`${letra}…`}
                autoCapitalize="words"
                autoCorrect="off"
                spellCheck={false}
                className={`campo w-full ${mal ? "border-rojo! bg-rojo/5" : ""}`}
              />
              {mal && <span className="text-xs text-rojo">Debe empezar con {letra}</span>}
            </label>
          );
        })}
      </form>

      <button
        disabled={!puedeParar || parando}
        onClick={() => { setParando(true); onParar(); }}
        className="boton-principal w-full py-5 text-xl"
      >
        🛑 ¡Párame la mano!
      </button>
      {!puedeParar && (
        <p className="text-center text-sm text-tinta-suave">
          Llena las {CATEGORIAS.length} categorías con la letra {letra} para poder parar ({llenas}/{CATEGORIAS.length}).
        </p>
      )}
    </section>
  );
}
