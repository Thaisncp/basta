# ¡Basta! en línea

Basta / "Párame la mano" para **2 jugadores en línea**, basado en el prototipo de Google Sheets.

- **Front:** Next.js 16 + Tailwind (Vercel)
- **Tiempo real y datos:** Supabase (Postgres + Realtime)

## Cómo se juega

1. Un jugador crea la partida y comparte el enlace (o el código de 5 letras).
2. Al entrar el segundo, cualquiera pulsa **Empezar partida**: sale una letra al azar.
3. Cada uno llena *Nombre, Apellido, Ciudad o país, Color, Fruta, Animal y Cosa* sin ver lo del otro.
4. Quien termina pulsa **🛑 ¡Párame la mano!** y la ronda se cierra para los dos.
5. Revisión: **100** si la respuesta es única, **50** si coincide con la del rival, **0** si está vacía o no empieza con la letra. Cualquiera puede **corregir** una casilla a 0/50/100 ("Auto" vuelve al cálculo automático).
6. **Continuar ronda** (otra letra, sin repetir hasta agotarlas) o **Finalizar partida** (marcador final).

Las reglas se ajustan en [`lib/config.ts`](lib/config.ts): categorías, letras, puntos y si se exige llenar todo para parar.

## Puesta en marcha

### 1. Supabase
1. Crear un proyecto en <https://supabase.com> (plan gratuito).
2. **SQL Editor → New query**, pegar [`supabase/schema.sql`](supabase/schema.sql) y **Run**.
3. En **Project Settings → API** copiar la *Project URL* y la *publishable key* (o *anon key*).

### 2. Local
```bash
cp .env.example .env.local   # y poner la URL y la key
npm install
npm run dev                  # http://localhost:3000
```
Para probar los dos jugadores abre el enlace de la sala en una ventana normal y otra en incógnito.

### 3. Vercel
Importar el repositorio y agregar en **Settings → Environment Variables**:
`NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_KEY`.

## Estructura

| Archivo | Qué hace |
|---|---|
| `app/page.tsx` | Inicio: crear partida o unirse con código |
| `components/Sala.tsx` | Carga la sala, suscripción en tiempo real y acciones |
| `components/Tablero.tsx` | Ronda en juego (inputs + Párame la mano) |
| `components/Revision.tsx` | Respuestas lado a lado, puntajes y corrección |
| `components/Historial.tsx` / `Final.tsx` | Marcador por ronda y resultado |
| `lib/puntaje.ts` | Reglas de puntaje y sorteo de letras |
| `lib/acciones.ts` | Lecturas/escrituras en Supabase |
| `supabase/schema.sql` | Tablas, permisos y Realtime |

## Nota de seguridad
Es un juego casual sin login: cualquiera con el código de sala puede leer y jugar esa partida. No se puede borrar nada desde el navegador.
