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
 * mounts Redirect when wizardCompleted flips remounts buried Welcome while
 * Custom is still focused.
 */
export function shouldRedirectWelcomeToProduction(
  wizardCompletedAtLaunch: boolean,
): boolean {
  return wizardCompletedAtLaunch;
}

/**
 * Finish records the Production href. Custom then renders `<Redirect>`, the
 * same Expo-owned path Welcome uses. Imperative `router.push` / `navigate` /
 * `reset` leave the file route at `/custom?wizard=true` on Android (one tap
 * still shows Layout + FINISH). Do not retry the same tap.
 */
export function requestWizardFinish(openProduction: (href: string) => void): void {
  openProduction(PRODUCTION_PATH);
}

export function shouldRedirectCustomToProduction(
  finishHref: string | null,
): finishHref is typeof PRODUCTION_PATH {
  return finishHref === PRODUCTION_PATH;
}

/** Expo `RouterToolbarHost` Compose band on Android (`height(64)`). */
export const ANDROID_BOTTOM_TOOLBAR_HEIGHT = 64;

/**
 * Sit the Android Finish Pressable just above that native Host.
 * Compose Hosts swallow every hit in their 64dp band, so an overlapping
 * label is a dead target even when it looks like the toolbar Finish.
 */
export function androidWizardFinishBottom(safeAreaBottom: number): number {
  return Math.max(0, safeAreaBottom) + ANDROID_BOTTOM_TOOLBAR_HEIGHT + 12;
}

export function persistWizardCompletedOnProduction(actions: {
  getWizardCompleted: () => boolean;
  setWizardCompleted: (completed: boolean) => void;
}): void {
  if (!actions.getWizardCompleted()) {
    actions.setWizardCompleted(true);
  }
}
