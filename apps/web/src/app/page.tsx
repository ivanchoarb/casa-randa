import { HomeContent } from "./HomeContent";

// La página de inicio se sigue generando estática (ISR), a diferencia de
// /tienda (force-dynamic ahí porque hay compra real en juego) — acá solo
// es una vitrina de 3 productos, no vale la pena perder el cacheo/SEO de
// una página estática por eso. Se refresca sola cada 5 minutos.
export const revalidate = 300;

export default function Home() {
  return <HomeContent />;
}
