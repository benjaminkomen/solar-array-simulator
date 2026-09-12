/**
 * Shared wizard chrome rules. iOS and Android must use the same gates so
 * platform files cannot drift (e.g. Finish visible on an empty canvas).
 */

import {
  ZOOM_COLUMN_RIGHT,
  ZOOM_COLUMN_WIDTH,
} from "./zoomConstants";

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

/**
 * Gap between Finish's right edge and the zoom column's left edge.
 * ZoomControls uses RNGH Pressable + elevation 4. An overlapping RN
 * Pressable is visible but does not receive the tap (af4f41c pixels).
 */
export const ANDROID_WIZARD_FINISH_ZOOM_GAP = 16;

/** Android Finish `right` — left of the zoom pill, not on top of it. */
export function androidWizardFinishRight(): number {
  return ZOOM_COLUMN_RIGHT + ZOOM_COLUMN_WIDTH + ANDROID_WIZARD_FINISH_ZOOM_GAP;
}

/**
 * True when Finish's horizontal band does not intersect the zoom pill.
 * Used to prove Maestro `tapOn: Finish` is not a zoom-column hit.
 */
export function androidFinishClearsZoomColumn(
  finishRight: number,
  finishWidth: number,
): boolean {
  const finishNear = finishRight;
  const finishFar = finishRight + Math.max(0, finishWidth);
  const zoomNear = ZOOM_COLUMN_RIGHT;
  const zoomFar = ZOOM_COLUMN_RIGHT + ZOOM_COLUMN_WIDTH;
  return finishFar <= zoomNear || finishNear >= zoomFar;
}

/** Maestro `tapOn: Finish` until the Pressable's onPress runs. */
export const ANDROID_WIZARD_FINISH_A11Y = "Finish";

/** Visible + a11y flip that does not depend on Redirect. */
export const ANDROID_WIZARD_FINISH_PRESS_PROOF_LABEL = "Tapped";

export function androidWizardFinishPressProofLabel(pressed: boolean): string {
  return pressed
    ? ANDROID_WIZARD_FINISH_PRESS_PROOF_LABEL
    : ANDROID_WIZARD_FINISH_A11Y;
}

export type AndroidFinishA11yNode = {
  id: string;
  accessibilityLabel: string;
  mountedOnAndroid: boolean;
};

/**
 * Every Android a11y node that matches Finish / FINISH before press.
 * Inner visual text is not an a11y node (`accessible={false}`).
 * iOS `WizardFinishButton` is not mounted on Android.
 */
export function listAndroidFinishA11yNodes(): readonly AndroidFinishA11yNode[] {
  return [
    {
      id: "AndroidWizardFinishButton",
      accessibilityLabel: ANDROID_WIZARD_FINISH_A11Y,
      mountedOnAndroid: true,
    },
  ];
}

export function persistWizardCompletedOnProduction(actions: {
  getWizardCompleted: () => boolean;
  setWizardCompleted: (completed: boolean) => void;
}): void {
  if (!actions.getWizardCompleted()) {
    actions.setWizardCompleted(true);
  }
}
