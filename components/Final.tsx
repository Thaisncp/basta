import Link from "next/link";
import { historial } from "@/lib/puntaje";
import type { Partida, Respuesta, Slot } from "@/lib/tipos";
import Historial from "./Historial";

export default function Final({
  partida,
  respuestas,
  miSlot,
  nombres,
}: {
  partida: Partida;
  respuestas: Respuesta[];
  miSlot: Slot;
  nombres: Record<Slot, string>;
}) {
  const { totales } = historial(respuestas, partida.letras, partida.ronda);
  const rivalSlot: Slot = miSlot === 1 ? 2 : 1;
  const resultado =
    totales[miSlot] === totales[rivalSlot]
      ? "🤝 ¡Empate!"
      : totales[miSlot] > totales[rivalSlot]
        ? "🏆 ¡Ganaste!"
        : `🏆 Ganó ${nombres[rivalSlot]}`;

  return (
    <section className="space-y-5">
      <div className="tarjeta space-y-2 text-center">
        <p className="text-sm uppercase tracking-widest text-tinta-suave">Partida terminada · {partida.ronda} rondas</p>
        <p className="text-3xl font-black">{resultado}</p>
        <p className="text-lg tabular-nums">
          Tú <b>{totales[miSlot]}</b> · {nombres[rivalSlot]} <b>{totales[rivalSlot]}</b>
        </p>
      </div>
      <Historial respuestas={respuestas} letras={partida.letras} hastaRonda={partida.ronda} nombres={nombres} miSlot={miSlot} />
      <Link href="/" className="boton-principal w-full">Nueva partida</Link>
    </section>
  );
}
