import type { NextConfig } from "next";

// Fotos de producto de la tienda, subidas desde la intranet al bucket
// público "imagenes-tienda" (mismo proyecto de Supabase que usa
// apps/intranet) — ver 0025_catalogo_tienda_admin.sql. Se deriva de la
// misma variable de entorno que usa el cliente de Supabase, no un
// hostname copiado a mano, para no desincronizarse si el proyecto cambia.
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  transpilePackages: ["@casa-randa/data", "@casa-randa/pricing"],
  images: {
    remotePatterns: supabaseHostname
      ? [{ protocol: "https", hostname: supabaseHostname, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
};

export default nextConfig;
