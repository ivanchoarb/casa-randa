import type { Metadata } from "next";
import { PqrsWizard } from "./PqrsWizard";

export const metadata: Metadata = {
  title: "PQRS",
  description: "Envía una petición, queja, reclamo o sugerencia a Casa Randa.",
};

export default function PqrsPage() {
  return <PqrsWizard />;
}
