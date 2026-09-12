/**
 * Shared wizard chrome rules. iOS and Android must use the same gates so
 * platform files cannot drift (e.g. Finish visible on an empty canvas).
 */
/**
 * Extra list inset (points) so Config rows sit above the bottom Stack.Toolbar
 * (Continue + add). Add the device safe-area bottom on top of this — 96 alone
 * still leaves inverter-row-1 overlapping Continue on iPhone 17.
 */
export const CONFIG_BOTTOM_TOOLBAR_INSET = 96;

export function configToolbarListInset(safeAreaBottom: number): number {
  return CONFIG_BOTTOM_TOOLBAR_INSET + Math.max(0, safeAreaBottom);
}

export const PRODUCTION_PATH = "/production";

export function shouldShowWizardFinish(
  isWizardMode: boolean,
  panelCount: number
): boolean {
  return isWizardMode && panelCount > 0;
}

/** Welcome is the index route. Query strings are stripped by usePathname(). */
export function isWelcomePath(pathname: string): boolean {
  return pathname === "/" || pathname === "" || pathname === "/index";
}

/**
 * Returning users bounce from Welcome → Production only when Welcome is the
 * visible route. Finish writes wizardCompleted while Custom is still focused;
 * a buried Index must not mount Redirect or Android can replace the root and
 * leave Custom on top (Maestro never sees Total Array Output).
 */
export function shouldRedirectWelcomeToProduction(
  wizardCompleted: boolean,
  pathname: string,
): boolean {
  return wizardCompleted && isWelcomePath(pathname);
}

/**
 * Open Production first, then persist wizardCompleted. Writing the flag first
 * remounts buried Welcome as Redirect and races the stack on Android.
 */
export function runWizardFinish(actions: {
  openProduction: (href: string) => void;
  markWizardCompleted: () => void;
}): void {
  actions.openProduction(PRODUCTION_PATH);
  actions.markWizardCompleted();
}
