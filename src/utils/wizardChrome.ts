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

export type WizardFinishNavigation = {
  navigate: (name: string) => void;
  getState?: () =>
    | {
        index?: number;
        routes?: { name: string }[];
      }
    | undefined;
};

export function focusedRouteName(
  navigation: Pick<WizardFinishNavigation, "getState">,
): string | undefined {
  const state = navigation.getState?.();
  if (!state?.routes?.length) {
    return undefined;
  }
  return state.routes[state.index ?? state.routes.length - 1]?.name;
}

export function isWizardProductionRoute(routeName: string | undefined): boolean {
  return routeName === PRODUCTION_ROUTE_NAME;
}

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
 * Finish opens Production on the focused navigator. Do not use
 * expo-router `router.push` here: that enqueues a ROUTER_LINK and
 * `useImperativeApiEmitter` flushes it in a `useEffect`. After Add,
 * Android can flush that queue with a null container ref (or a
 * same-snapshot `useSyncExternalStore` miss) and drop the first action.
 * A later Finish tap then works. `navigation.navigate` dispatches now.
 * Persist wizardCompleted when Production mounts.
 */
export function runWizardFinish(openProduction: (href: string) => void): void {
  openProduction(PRODUCTION_PATH);
}

export function dispatchWizardFinish(navigation: WizardFinishNavigation): void {
  navigation.navigate(PRODUCTION_ROUTE_NAME);
}

export function retryWizardFinishIfNeeded(navigation: WizardFinishNavigation): void {
  if (!isWizardProductionRoute(focusedRouteName(navigation))) {
    dispatchWizardFinish(navigation);
  }
}

export function persistWizardCompletedOnProduction(actions: {
  getWizardCompleted: () => boolean;
  setWizardCompleted: (completed: boolean) => void;
}): void {
  if (!actions.getWizardCompleted()) {
    actions.setWizardCompleted(true);
  }
}
