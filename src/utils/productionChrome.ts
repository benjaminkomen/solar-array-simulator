/**
 * Production overflow a11y and Android slot.
 *
 * iOS keeps "More options" on Stack.Toolbar.Menu in the right header — the
 * iOS Dev Client does not steal that tap.
 *
 * Android Expo Dev Client paints a Tools overlay on the same headerRight /
 * Stack.Toolbar placement="right" corner as Simulate's sibling. A distinct
 * a11y string is necessary (Dev Client overflow is also "More options") but
 * not sufficient: the in-app menu must not live in that header slot or the
 * tap opens Reload / Go home / Tools. Mount it in content instead.
 */
export const PRODUCTION_MENU_A11Y_IOS = "More options";
export const PRODUCTION_MENU_A11Y_ANDROID = "Configuration options";

/** Android Production menu lives in the output card, not headerRight. */
export const PRODUCTION_MENU_ANDROID_SLOT = "content" as const;
