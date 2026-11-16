import { Suspense } from "react";
import Sala from "@/components/Sala";

async function SalaConCodigo({ params }: { params: PageProps<"/sala/[codigo]">["params"] }) {
  const { codigo } = await params;
  return <Sala key={codigo} codigo={codigo.toUpperCase()} />;
}

export default function PaginaSala({ params }: PageProps<"/sala/[codigo]">) {
  return (
    <Suspense fallback={<main className="flex flex-1 items-center justify-center p-6">Cargando sala…</main>}>
      <SalaConCodigo params={params} />
    </Suspense>
  );
}
