import type { KeyboardEvent, MouseEvent } from "react";

function tryOpenPicker(input: HTMLInputElement) {
  if (typeof input.showPicker === "function") {
    try {
      input.showPicker();
    } catch {
      // Some browsers (e.g. Safari) can refuse outside a direct user
      // gesture — harmless, the field still works as a plain input.
    }
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
