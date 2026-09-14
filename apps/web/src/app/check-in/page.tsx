import type { Metadata } from "next";
import { CheckInWizard } from "./CheckInWizard";

export const metadata: Metadata = {
  title: "Check-in",
  robots: { index: false, follow: false },
};

// Reemplaza el formulario externo de forms.app (share.forms.app/dianaparrado/
// guest-registration-casa-randa) — a diferencia de /tienda, esta página no
// tiene SiteHeader/SiteFooter: es un flujo de un solo paso a la vez, pensado
// para abrirse directo desde un enlace que se le manda al huésped antes de
// llegar, no para navegarse desde el resto del sitio.
export default function CheckInPage() {
  return <CheckInWizard />;
}
