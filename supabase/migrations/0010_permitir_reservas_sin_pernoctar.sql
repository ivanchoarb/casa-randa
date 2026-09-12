-- Las 6 reservas "Ambar Sanchez" de junio/julio 2026 no eran defectuosas:
-- Ambar alquiló el patio de la casa para ver partidos del Mundial, sin
-- pernoctar — un uso real y legítimo (alquiler por el día), no un error
-- de captura. `salida_despues_de_entrada` (0002_reservas.sql) asumía que
-- toda reserva es una estadía con al menos una noche, así que al
-- importarlas el 2026-09-11 se les sumó un día a `salida` para poder
-- guardarlas — un parche sobre el dato real, no el dato real. Se corrige
-- de raíz: la restricción ahora permite `salida = entrada` (evento de un
-- día, 0 noches vía la columna generada `noches`), no solo `salida > entrada`.

alter table public.reservas drop constraint salida_despues_de_entrada;
alter table public.reservas add constraint salida_no_antes_de_entrada check (salida >= entrada);

-- Devuelve las 6 reservas de Ambar Sanchez a sus fechas reales.
update public.reservas
set salida = entrada
where codigo_externo in (
  'CR-DIRECT-AMBAR-20260613',
  'CR-DIRECT-AMBAR-20260617',
  'CR-DIRECT-AMBAR-20260623',
  'CR-DIRECT-AMBAR-20260627',
  'CR-DIRECT-AMBAR-20260718',
  'CR-DIRECT-AMBAR-20260719'
);

-- tarifa_noche no tiene sentido para un evento de 0 noches (bruto/noches
-- se indefine); se deja en 0 para esas 6 filas, igual que ya hace
-- src/lib/importar-reservas.ts para cualquier reserva de 0 noches.
update public.reservas
set tarifa_noche = 0
where codigo_externo in (
  'CR-DIRECT-AMBAR-20260613',
  'CR-DIRECT-AMBAR-20260617',
  'CR-DIRECT-AMBAR-20260623',
  'CR-DIRECT-AMBAR-20260627',
  'CR-DIRECT-AMBAR-20260718',
  'CR-DIRECT-AMBAR-20260719'
);
