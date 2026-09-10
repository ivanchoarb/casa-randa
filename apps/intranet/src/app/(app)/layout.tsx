"use client";

import { Authenticated } from "@refinedev/core";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return (
    <Authenticated
      key="app"
      redirectOnFail="/login"
      loading={
        <div className="flex min-h-screen items-center justify-center text-ink-2">
          Cargando…
        </div>
      }
    >
      <AppShell>{children}</AppShell>
    </Authenticated>
  );
}
