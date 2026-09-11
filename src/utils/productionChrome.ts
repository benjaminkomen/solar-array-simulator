/**
 * Production overflow a11y and Android slot.
 *
 * iOS keeps "More options" on Stack.Toolbar.Menu in the right header.
 * Android uses "Configuration options" on the same header-right slot
 * (sibling of Simulate) — not the Dev Client AppBar string "More options".
 *
 * Expo Dev Client can paint a Tools overlay on that corner. Hide it with
 * the Dev Menu "Tools button" toggle (Maestro launch-fresh) or
 * hideDevClientToolsButton() — do not move Edit/Delete onto the card.
 */
export const PRODUCTION_MENU_A11Y_IOS = "More options";
export const PRODUCTION_MENU_A11Y_ANDROID = "Configuration options";

/** Android Production menu is the header-right sibling of Simulate. */
export const PRODUCTION_MENU_ANDROID_SLOT = "header" as const;
