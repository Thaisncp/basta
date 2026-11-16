/** Insignia de puntos: verde 100, ámbar 50, gris 0. */
export default function Puntos({ valor, grande = false }: { valor: number; grande?: boolean }) {
  const color =
    valor >= 100 ? "bg-verde/12 text-verde" : valor >= 50 ? "bg-amarillo/15 text-amber-700" : "bg-tinta/5 text-tinta-suave";
  return (
    <span className={`inline-block rounded-md font-bold tabular-nums ${color} ${grande ? "px-2.5 py-1 text-base" : "px-1.5 py-0.5 text-xs"}`}>
      {valor}
    </span>
  );
}
