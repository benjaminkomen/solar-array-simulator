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
export const PRODUCTION_ROUTE_NAME = "production";

export type WizardFinishResetState = {
  index: number;
  routes: { name: string }[];
};

export type WizardFinishNavigation = {
  reset: (state: never) => void;
};

export function wizardFinishResetState(): WizardFinishResetState {
  return {
    index: 0,
    routes: [{ name: PRODUCTION_ROUTE_NAME }],
  };
}

export type WizardFinishPressRefs = {
  visible: { current: boolean };
  onFinish: { current: () => void };
};

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
 * Android Toolbar.View / RNHostView can keep the first Pressable onPress.
 * A closed-over `visible` from the empty canvas stays false, so the first
 * Finish tap after Add is a silent no-op (Custom stays; a later tap works
 * once the native callback is rebound). Always read the current refs.
 */
export function syncWizardFinishPressRefs(
  refs: WizardFinishPressRefs,
  visible: boolean,
  onFinish: () => void,
): void {
  refs.visible.current = visible;
  refs.onFinish.current = onFinish;
}

export function pressWizardFinish(refs: WizardFinishPressRefs): void {
  if (refs.visible.current) {
    refs.onFinish.current();
  }
}

/**
 * Finish must make Production the only stack route. `navigate` can leave
 * Custom focused with Production mounted underneath (screenshot after one
 * tap: wizard step 3 + FINISH, no Total Array Output). `router.push` /
 * Redirect.replace go through routingQueue. reset is a sync stack replace.
 * Persist wizardCompleted when Production mounts.
 */
export function runWizardFinish(openProduction: (href: string) => void): void {
  openProduction(PRODUCTION_PATH);
}

export function dispatchWizardFinish(navigation: WizardFinishNavigation): void {
  navigation.reset(wizardFinishResetState() as never);
}

export function persistWizardCompletedOnProduction(actions: {
  getWizardCompleted: () => boolean;
  setWizardCompleted: (completed: boolean) => void;
}): void {
  if (!actions.getWizardCompleted()) {
    actions.setWizardCompleted(true);
  }
}
