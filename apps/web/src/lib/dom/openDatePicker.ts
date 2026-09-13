import type { KeyboardEvent, MouseEvent } from "react";

/**
 * Exported (not just used internally) so callers can also open a picker
 * programmatically — e.g. the "Salida" field auto-opening its calendar
 * right after "Entrada" is picked, once React has painted its new value.
 */
export function tryOpenPicker(input: HTMLInputElement | null) {
  if (!input || typeof input.showPicker !== "function") return;
  try {
    input.showPicker();
  } catch {
    // Some browsers (e.g. Safari) can refuse outside a direct user
    // gesture — harmless, the field still works as a plain input.
  }
}

/**
 * Clicking anywhere in a native date input opens its calendar picker, not
 * just the small calendar-icon affordance — ported from the prototype's
 * showPicker() click handler (see legacy-static/js/casa-randa.js).
 */
export function openDatePickerOnClick(event: MouseEvent<HTMLInputElement>) {
  tryOpenPicker(event.currentTarget);
}

/** Same behaviour for keyboard users: Enter/Space opens the picker. */
export function openDatePickerOnKey(event: KeyboardEvent<HTMLInputElement>) {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    tryOpenPicker(event.currentTarget);
  }
}
