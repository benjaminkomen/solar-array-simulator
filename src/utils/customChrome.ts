/**
 * Custom canvas chrome constants. iOS and Android share one Stack.Toolbar
 * tree (`CustomChrome`); only icons differ (SF Symbol vs Material).
 *
 * Badge stays on the header-right link button when unlinkedCount > 0.
 * iOS header-right compass / link / snap must be direct Toolbar.Button
 * children — wrappers are dropped by Expo Router's iOS header-item filter.
 */
export const CUSTOM_ADD_PANEL_A11Y = "Add panel";
export const CUSTOM_HEADER_LINK_A11Y = "Unlinked panels";

const ADD_CANVAS_FALLBACK = { width: 400, height: 800 };

/** Prefer the measured canvas; never return 0×0 so Add cannot silently no-op. */
export function resolveCanvasSizeForAdd(
  measuredWidth: number,
  measuredHeight: number,
  fallbackWidth: number,
  fallbackHeight: number
): { width: number; height: number } {
  if (measuredWidth > 0 && measuredHeight > 0) {
    return { width: measuredWidth, height: measuredHeight };
  }
  if (fallbackWidth > 0 && fallbackHeight > 0) {
    return { width: fallbackWidth, height: fallbackHeight };
  }
  return ADD_CANVAS_FALLBACK;
}
