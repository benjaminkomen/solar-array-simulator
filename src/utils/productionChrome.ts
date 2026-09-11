/**
 * Production overflow a11y. iOS can keep "More options". Android's Expo Dev
 * Client AppBar overflow uses the system string "More options", so the in-app
 * menu must use a distinct label or Maestro/users hit Reload / Go home / Tools.
 */
export const PRODUCTION_MENU_A11Y_IOS = "More options";
export const PRODUCTION_MENU_A11Y_ANDROID = "Configuration options";
