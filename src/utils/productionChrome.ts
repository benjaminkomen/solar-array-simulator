/**
 * Production overflow a11y, header slot, and card inset.
 *
 * iOS keeps "More options" on Stack.Toolbar.Menu in the right header.
 * Android uses "Configuration options" on the same header-right slot
 * (sibling of Simulate) — not the Dev Client AppBar string "More options".
 *
 * Expo Dev Client can paint a Tools overlay on that corner. Hide it with
 * the Dev Menu "Tools button" toggle (Maestro launch-fresh) or
 * hideDevClientToolsButton() — do not move Edit/Delete onto the card.
 *
 * Helpers stay RN-import-free so unit tests can call them without loading
 * react-native. Pass `Platform.OS` from the route.
 */
export const PRODUCTION_MENU_A11Y_IOS = "More options";
export const PRODUCTION_MENU_A11Y_ANDROID = "Configuration options";

/** Android Production menu is the header-right sibling of Simulate. */
export const PRODUCTION_MENU_ANDROID_SLOT = "header" as const;

/** Material AppBar height used for the Android output-card inset. */
export const ANDROID_APPBAR_HEIGHT = 56;
export const IOS_CARD_INSET_EXTRA = 30;
export const ANDROID_CARD_INSET_EXTRA = 16;

export function productionMenuA11y(platform: string): string {
  return platform === "android"
    ? PRODUCTION_MENU_A11Y_ANDROID
    : PRODUCTION_MENU_A11Y_IOS;
}

export function productionCardMarginTop(
  insetsTop: number,
  platform: string,
): number {
  if (platform === "android") {
    return insetsTop + ANDROID_APPBAR_HEIGHT + ANDROID_CARD_INSET_EXTRA;
  }
  return insetsTop + IOS_CARD_INSET_EXTRA;
}
