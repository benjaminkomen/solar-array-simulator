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

/**
 * Welcome → Production is a launch-time check only. A live subscription that
 * mounts Redirect when Finish writes wizardCompleted remounts buried Welcome
 * and Android drops the first routingQueue action (Custom stays; a second
 * Finish tap then works).
 */
export function shouldRedirectWelcomeToProduction(
  wizardCompletedAtLaunch: boolean,
): boolean {
  return wizardCompletedAtLaunch;
}

/**
 * Finish only opens Production. Persist wizardCompleted when Production
 * mounts (`persistWizardCompletedOnProduction`) so a sync store notify cannot
 * re-render Custom/Welcome in the same turn as the first navigation.
 */
export function runWizardFinish(openProduction: (href: string) => void): void {
  openProduction(PRODUCTION_PATH);
}

export function persistWizardCompletedOnProduction(actions: {
  getWizardCompleted: () => boolean;
  setWizardCompleted: (completed: boolean) => void;
}): void {
  if (!actions.getWizardCompleted()) {
    actions.setWizardCompleted(true);
  }
}
