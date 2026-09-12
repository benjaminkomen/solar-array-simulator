# Expo Router + Expo UI audit

Audit of `solar-array-simulator` at `main` (`158061e`, 2026-09-12) against Expo Router and `@expo/ui` best practices.

This PR **does not implement a redesign**. It records what already matches current APIs, what should change, and ranked follow-ups with file pointers.

## Scope and sources

**App:** personal Expo SDK 57 app (`expo@^57.0.22`, `expo-router@~57.0.21`, `@expo/ui@~57.0.18`, RN 0.86.3, `com.bkomen.solararraysimulator`). React Compiler and typed routes are on. Hermes V1 is already the SDK default (`useHermesV1: true` in `app.json`). **Do not flip Hermes V1.** Do not rewrite Skia canvas or WebGPU `SimulationView`.

**Skills read (expo/skills, current main):**

- `expo-overview` — SDK-pinned docs, component selection, shared setup
- `expo-router` + `references/route-structure.md`, `toolbar-and-headers.md`, `form-sheet.md`
- `expo-ui` + `references/universal.md`, `swift-ui.md`
- `expo-native-ui` — semantic `Color`, Host-first controls, stack titles
- `expo-upgrade` — SDK 57 / Hermes V1 / `@react-navigation/*` import rule
- `expo-project-structure` — routes-only `src/app/` (guidance for *new* apps; do not restructure this one to match)

**Docs / types (not invented):**

- [Stack](https://docs.expo.dev/router/advanced/stack/)
- [Stack Toolbar](https://docs.expo.dev/router/advanced/stack-toolbar/) (alpha; Android SDK 56+, iOS SDK 55+)
- [Redirects](https://docs.expo.dev/router/reference/redirects/)
- [URL parameters](https://docs.expo.dev/router/reference/url-parameters/)
- [Linking into your app](https://docs.expo.dev/linking/into-your-app/)
- [Color](https://docs.expo.dev/router/reference/color/)
- SDK 57: [Expo UI](https://docs.expo.dev/versions/v57.0.0/sdk/ui/), [Host](https://docs.expo.dev/versions/v57.0.0/sdk/ui/universal/host/), [FieldGroup](https://docs.expo.dev/versions/v57.0.0/sdk/ui/universal/fieldgroup/), [Picker](https://docs.expo.dev/versions/v57.0.0/sdk/ui/universal/picker/)
- Installed `.d.ts` / `node_modules/@expo/ui/src/universal/Picker/types.ts` (`appearance: 'wheel' | 'menu'` only)

**Skill vs official docs (toolbar):** `expo-router/references/toolbar-and-headers.md` still says `Stack.Toolbar` is “iOS only.” Official [Stack Toolbar](https://docs.expo.dev/router/advanced/stack-toolbar/) documents Android (SDK 56+) and iOS (SDK 55+). This app correctly uses toolbar on both. Trust the official page + installed types, not that skill limitation line.

**Honesty:** this Linux VM cannot drive a simulator or Maestro. Proof here is source + unit tests that lock the current map. Device verification stays on a Mac via `.cursor/skills/verify-solar-array/`.

**Open product bugs (already filed, not re-filed):**

- [#68](https://github.com/benjaminkomen/solar-array-simulator/issues/68) — iOS Config inverter row tap does not open inverter-details
- [#69](https://github.com/benjaminkomen/solar-array-simulator/issues/69) — Android Finish does not reliably land on Production

---

## 1. Routing

### Current map

Single root stack. No tabs. No route groups. File-based routes in `src/app/`:

| Route | Role | Presentation |
| --- | --- | --- |
| `/` (`index.tsx`) | Welcome, or `<Redirect href="/production" />` when `wizardCompleted` | card |
| `/config` | Step 1 form | card |
| `/upload` | Step 2 photo | card |
| `/analyze` | Model pick + vision | card |
| `/custom` | Canvas editor | card |
| `/production` | Monitor | card, `headerBackVisible: false` |
| `/simulation` | 3D sim | card |
| `/panel-details` | Link / view inverter | iOS `formSheet`, Android `transparentModal` + Compose sheet |
| `/inverter-details` | Add / edit inverter | same |
| `/compass-help` | Compass copy | iOS `formSheet` (0.3 detent), Android `transparentModal` |
| `/api/analyze` | Bedrock vision | API + `+middleware.ts` matcher `/api/[...path]` |

`config.web.tsx` is the only platform route file in `src/app/`. `custom.tsx`, `panel-details.tsx`, and `inverter-details.tsx` are thin re-exports into `src/components/screens/` (locked by `leftoverPlatformFiles.test.ts`). Expo Router does **not** support `.ios.tsx` / `.android.tsx` *route* files; leftover chrome already lives outside `src/app/`.

### Layouts and `Stack.Screen`

[`src/app/_layout.tsx`](../../src/app/_layout.tsx) is the only layout: `GestureHandlerRootView` → `ErrorBoundary` → `PanelsProvider` → `ThemeProvider` (from `expo-router`, current; `expo-router/react-navigation` `ThemeProvider` is deprecated in installed types) → `Stack` → `ObserveRoot.wrap`.

Shared `screenOptions`: `headerTransparent: true`, themed `headerTintColor`, `statusBarStyle` from `useColorScheme()`.

Per-screen options in the layout (titles, back-button mode, sheet presentation) match the Expo Router pattern of declaring static options on the navigator. Route files add dynamic chrome (`Stack.Toolbar`, `Stack.Screen.BackButton`, detent overrides). That split is valid.

What the skill prefers that this app does not use:

- `Stack` from `expo-router/stack` — official toolbar docs import `Stack` from `expo-router`. Either is fine; do not churn imports.
- `Stack.Title` / `Stack.Screen.Title` — unused. Titles are `options.title` strings. Fine for this app; composition titles are optional polish.
- `+not-found.tsx` — missing. Unmatched paths fall through Expo Router’s default unmatched UI.
- `(group)` folders / `unstable_settings.anchor` — not needed for a linear wizard + one post-wizard stack.
- `NativeTabs` — wrong product. This is a 3-step wizard, not a tab app.

### Redirects

[`src/app/index.tsx`](../../src/app/index.tsx) uses `<Redirect href="/production" />` when `getWizardCompleted()` is true. That matches [Redirects](https://docs.expo.dev/router/reference/redirects/). Delete Configuration uses `router.replace("/")` after `resetAllData()` so Welcome shows again.

No other redirects. Mid-wizard back is the native stack. Production hides the back button so returning users do not walk back into the wizard.

### Wizard query params

Search params (not dynamic segments), read with `useLocalSearchParams` and typed optionals — matches [URL parameters](https://docs.expo.dev/router/reference/url-parameters/).

| Param | Where | Meaning |
| --- | --- | --- |
| `wizard=true` | config, upload, analyze, custom | Show `WizardProgress` + Skip / Continue / Finish |
| `imageUri` | analyze | Picked photo (URI-encoded) |
| `initialPanels=true` | custom (from analyze skip/continue) | Seed canvas from analysis / mock grid |
| `mode`, `inverterId` | inverter-details | `add` \| `edit` |
| `panelId`, `mode` | panel-details | Target panel; `view` from Production |

Forwarding is string-concatenated (`?wizard=true` / `&wizard=true`). That is correct for Expo Router search params.

**Product choice, not a bug:** Production → Edit Configuration pushes `/config?wizard=true` ([`useProductionMonitor.ts`](../../src/hooks/useProductionMonitor.ts)). Maestro `wizard-resume-to-production.yaml` then taps Continue → Skip → Finish. Re-entering wizard chrome from Production is intentional. A later settings-only `/config` (no `wizard`) would be a product change, not a Router fix.

`imageUri` as a query string is the weakest param: file URIs are long and show up in history. Analyze already has `analysisStore` for results; moving the pick off the URL is a later cleanup.

Reserved names (`screen`, `params`, `initial`, `state`) are unused. Good.

### Sheets vs screens

iOS sheet options in `_layout.tsx` match `expo-router` form-sheet guidance: `presentation: "formSheet"`, `sheetGrabberVisible`, `contentStyle: { backgroundColor: "transparent" }`, optional `sheetAllowedDetents`. Panel / inverter iOS screens then set detents from mode (`0.3` view, `[0.6, 1.0]` edit).

Android details are **not** Expo Router `formSheet`. They use `transparentModal` + `@expo/ui/jetpack-compose` `ModalBottomSheet` ([`PanelDetailsScreen.android.tsx`](../../src/components/screens/PanelDetailsScreen.android.tsx), [`InverterDetailsScreen.android.tsx`](../../src/components/screens/InverterDetailsScreen.android.tsx)). Official Stack docs *do* list `formSheet` on Android, but Compose `ModalBottomSheet` is the Material 3 sheet this app already shipped. Keep it unless a later PR proves Router `formSheet` on Android matches the current chrome and Maestro map.

Compass help on Android is a full `transparentModal` RN view, not a Compose sheet. The verify skill already records that Maestro cannot assert it the same way as iOS. That is a known platform gap, not a new bug to file.

Do **not** replace these routes with in-tree `@expo/ui` `BottomSheet` (`isPresented` / `onDismiss`). Route-level sheets stay on the stack, take query params (`panelId`, `mode`), and are how Maestro opens details (`/panel-details?panelId=seed-panel`).

Permission copy on Upload is a custom RN `Modal` ([`PermissionModal.tsx`](../../src/components/PermissionModal.tsx)), not a route. Fine: it is a system-permission prompt, not a navigable screen.

### Deep links

- Custom scheme: `solararraysimulator` in `app.json`.
- Expo Router plugin `origin`: `https://react-native-array-layout-2.expo.app` (web / EAS Hosting for `/api/analyze`).
- Bundle / package: `com.bkomen.solararraysimulator` (also a default scheme via Prebuild).
- No `associatedDomains`, no Android `intentFilters`, no `+native-intent`. Universal Links / App Links are unset. Dev Client + Maestro use `http://10.0.2.2:8081` / scheme URLs, not https App Links.

Expo Router will open any file route (`solararraysimulator://config?wizard=true`, `...://panel-details?panelId=seed-panel`). There is no guard that mid-wizard or sheet URLs have store state. `usePanelDetails` seeds only `seed-panel`. A cold `panel-details` / `inverter-details` deep link with a missing id renders an empty form. Acceptable for a personal app; add guards if the scheme is ever shared.

---

## 2. Expo UI / `@expo/ui`

### Host placement

Official rule: every `@expo/ui` tree (universal or platform) is wrapped in `Host`. Universal docs: `import { Host } from '@expo/ui'`. The `expo-ui` skill says Host always comes from the package root, even next to SwiftUI / Compose children.

| Surface | Host | Import | Notes |
| --- | --- | --- | --- |
| Config | Yes, `flex: 1` + `colorScheme` | `@expo/ui` | Correct FieldGroup host |
| Analyze picker | Yes, `matchContents` | `@expo/ui` | Correct compact host |
| Simulation slider + season | Yes, two hosts | `@expo/ui` | Correct; GPU canvas stays outside |
| Details forms | Host in *platform chrome*, not in `*DetailsForm.tsx` | iOS `@expo/ui/swift-ui`; Android `@expo/ui/jetpack-compose` | Body is universal FieldGroup; chrome owns Host |
| Upload | **None** | — | Intentional. Locked by `uploadRoute.test.ts`. No Reanimated `entering` on first paint. |
| Welcome | None | — | RN + Reanimated `FadeIn` only. No `@expo/ui`. |
| Production | None | — | Canvas + `Stack.Toolbar`. Locked by `productionChrome.test.ts`. |
| Custom | Android icon glyph only | `@expo/ui/jetpack-compose` inside `CustomToolbarAndroidIcon` | `pointerEvents="none"` so the Pressable above gets the tap |
| Compass help | None | — | RN copy |

Config / Analyze / Simulation Host usage matches SDK 57 Host docs (`style={{ flex: 1 }}`, `matchContents`, `colorScheme`).

iOS details importing `Host` from `@expo/ui/swift-ui` still works (SDK 57 still exports that Host). The skill’s “Host from `@expo/ui` only” rule is the cleanup to do when those screens are next touched — not a reason to rewrite them now.

Do **not** put `Host` on Upload first paint. That regression is already unit-tested.

### FieldGroup

Universal `FieldGroup` + `FieldGroup.Section` + `FieldGroup.SectionFooter` is the right API for settings-style forms (SDK 57 FieldGroup page). Used in:

- [`src/app/config.tsx`](../../src/app/config.tsx) — one FieldGroup for wattage, location, roof, inverters
- [`src/components/InverterDetailsForm.tsx`](../../src/components/InverterDetailsForm.tsx)
- [`src/components/PanelDetailsForm.tsx`](../../src/components/PanelDetailsForm.tsx)
- [`src/components/config/InverterSection*.tsx`](../../src/components/config/InverterSection.tsx) — section lives *inside* Config’s FieldGroup

`useNativeState` on Config / inverter `TextInput` matches the universal TextInput contract (ObservableState, not a plain string). `react-native-worklets` is installed.

Android details set `style={{ height: 420 }}` on FieldGroup so the Compose sheet has a bounded height. That is a sheet-sizing workaround, not a FieldGroup API requirement.

Universal `List` is **not** virtualized (skill + docs). Config inverter rows correctly drop to platform lists for swipe-to-delete (`List.ForEach` / `onDelete` on iOS, `SwipeToDismissBox` on Android). Do not collapse those back to universal `ListItem` only.

### Picker vs platform segmented

Installed universal `Picker` appearances are `'menu' | 'wheel'` only. There is no `segmented`. The app already documents this and splits:

| Control | iOS | Android | Web fallback |
| --- | --- | --- | --- |
| Roof type | `@expo/ui/swift-ui` `Picker` + `pickerStyle('segmented')` | `SingleChoiceSegmentedButtonRow` / `SegmentedButton` | universal `Picker` menu |
| Season | same SwiftUI segmented | same Compose segmented | universal `Picker` menu |
| Analyze model | universal `Picker` (menu) — correct for a long allowlist | same | n/a |

Do **not** force roof / season onto universal `Picker`. Menu/wheel is the wrong control. Platform files in `components/` (not `src/app/`) is exactly what `expo-ui` + Expo Router require.

### `Stack.Toolbar` vs Compose / SwiftUI Host

[Stack Toolbar](https://docs.expo.dev/router/advanced/stack-toolbar/) is the navigation chrome API. `@expo/ui` `Host` is for in-content native trees. Mixing them (Host *as* the header) is the wrong layer.

This app already keeps them apart:

- **Toolbar:** Config Continue / Add, Upload Skip, Analyze Skip / Analyze, Custom header + bottom, Production Simulate + overflow, inverter-details Cancel / Save (iOS).
- **Host:** forms, pickers, sliders, Android details sheets, Android toolbar *glyph only*.

Official docs: `placement="bottom"` only inside screen components (not `_layout`). Observed. `Stack.Toolbar.Badge` only for `left` / `right`. Observed — Badge is **only** on Custom header-right unlinked count ([`CustomChrome.tsx`](../../src/components/CustomChrome.tsx)), Benjamin’s Expo Router API, locked by `customChrome.test.ts`.

Production ⋮ stays in the same `placement="right"` toolbar as Simulate ([`production.tsx`](../../src/app/production.tsx)). Do not move it onto a card or into a Host `Menu`.

Icons: official docs recommend `process.env.EXPO_OS` so Metro tree-shakes SF Symbols vs `@expo/material-symbols/*.xml`. This app mostly uses `Platform.OS`. Same runtime result; `EXPO_OS` is the documented tree-shake form.

### Accessibility

Documented Android toolbar gap (not invented): `Stack.Toolbar.Button` **text** children land on a dead a11y node; **icon** `accessibilityLabel` lands on a non-clickable Compose `Icon`. The app’s workaround matches the official `Stack.Toolbar.View` + `Pressable` example:

- Android text actions (Continue, Skip, Analyze, Finish) → `Stack.Toolbar.View` + RN `Pressable` + `accessibilityLabel`
- Android Custom icon actions → Pressable *above* a `pointerEvents="none"` Host/Icon
- iOS keeps `Stack.Toolbar.Button` (text or SF Symbol)

Production overflow labels stay split on purpose: iOS `More options`, Android `Configuration options` (avoid Dev Client’s `More options`). Dev Client Tools is hidden via `hideDevClientToolsButton()` + Maestro Tools toggle — not by moving the menu.

Do not “fix” Android toolbar a11y by putting labels on Compose `Icon` or by replacing `Stack.Toolbar` with a Host toolbar.

Welcome / Upload / Analyze results still use the RN [`Button`](../../src/components/Button.tsx) (`Pressable`). `@expo/ui` `Button` is available; swapping Welcome “Get Started” is optional polish, not a must.

---

## 3. What already matches vs what should change

### Already matches

- Routes-only `src/app/` after #56–#65; no `src/app/*.ios.tsx` / `*.android.tsx` for collapsed screens.
- One root `Stack`; wizard is search params, not a second navigator.
- `<Redirect>` for returning users; `replace("/")` after delete.
- iOS details / compass as Router `formSheet` + grabber + transparent `contentStyle`.
- Android details as Compose `ModalBottomSheet` (Material 3), not a fake iOS sheet.
- Universal `FieldGroup` + `Host` on Config and details bodies; `useNativeState` on text fields.
- Universal `Picker` only where menu is correct (Analyze). Segmented roof / season stay platform-native.
- `Stack.Toolbar` for chrome; Badge only on Custom header-right unlinked count.
- Android toolbar text/icon a11y via `Toolbar.View` + Pressable (official View embedding).
- Production ⋮ next to Simulate; Dev Client Tools hidden in layout.
- `ThemeProvider` / `DefaultTheme` / `DarkTheme` from `expo-router` (not deprecated `@react-navigation/*`).
- Android chrome colors via `Color.android.dynamic.*` + `useColorScheme()` (required with React Compiler).
- Panel / Skia colors stay hex strings (worklets cannot take `Color` / `PlatformColor`).
- `expo-constants` is a direct dependency (Router peer).
- Upload first paint has no Host / Reanimated entering.
- No Hermes V1 flip; no Skia / WebGPU rewrite.

### Should change (later PRs, not this one)

- Add `src/app/+not-found.tsx` with a `Link` home (skill `route-structure.md`).
- When touching iOS details, import `Host` from `@expo/ui` (skill + universal Host docs). Keep Compose `Host` only where the tree is Compose-only (`ModalBottomSheet`, toolbar glyph).
- Prefer `process.env.EXPO_OS` for toolbar icon branches (official toolbar docs).
- iOS semantic chrome: `Color.ios.*` (`label`, `systemBackground`, …) via `Platform.select`, same as Android dynamic colors. Do not feed `Color` into Skia / Reanimated.
- Analyze / Upload / Custom empty `options.title` — consider `Stack.Title` or a real `title` so the stack header matches on-screen copy (“Select AI Model” is body text today, which Maestro already waits on).
- Optional: `@expo/ui` `Alert` / Compose `AlertDialog` instead of RN `PermissionModal` if you want native permission chrome.
- Optional: `Link` + `Link.Preview` on inverter rows / Get Started. Wizard steps should stay `router.push` (haptics + query building).

### Do not change (product / API constraints)

- Do not recreate `src/app/*.ios.tsx` / `*.android.tsx` for already-universal routes.
- Do not put Host or Reanimated entering on Upload first paint.
- Do not move Production overflow off the header-right slot.
- Do not use `Stack.Toolbar.Badge` on the bottom toolbar.
- Do not replace Router sheets with in-tree `BottomSheet` for panel / inverter / compass.
- Do not force universal `Picker` onto roof / season.
- Do not flip Hermes V1.
- Do not rewrite Skia or `SimulationView`.
- Do not treat [#68](https://github.com/benjaminkomen/solar-array-simulator/issues/68) / [#69](https://github.com/benjaminkomen/solar-array-simulator/issues/69) as “map” problems — they are device bugs.

---

## 4. Ranked recommendations

### Must (before or with the next UI PR that touches that surface)

| # | Recommendation | Why | Files |
| --- | --- | --- | --- |
| M1 | Fix iOS Config inverter row → inverter-details | Existing product bug: row tap does not open the sheet. | `#68`; [`InverterSection.ios.tsx`](../../src/components/config/InverterSection.ios.tsx); [`useConfigForm.ts`](../../src/hooks/useConfigForm.ts) (`/inverter-details?mode=edit&inverterId=`) |
| M2 | Fix Android Custom Finish → Production | Existing product bug: Finish does not reliably land on Production. | `#69`; [`CustomChrome.tsx`](../../src/components/CustomChrome.tsx) `WizardFinishButton`; [`useCanvasEditor.ts`](../../src/hooks/useCanvasEditor.ts) `router.push('/production')` |
| M3 | Keep the current toolbar / Host / sheet split when editing chrome | Official toolbar + Host docs. Replacing toolbar with Host, or sheets with in-tree BottomSheet, breaks Maestro and a11y workarounds. | [`_layout.tsx`](../../src/app/_layout.tsx), [`CustomChrome.tsx`](../../src/components/CustomChrome.tsx), [`production.tsx`](../../src/app/production.tsx), details screens |

M1/M2 are **bugs to fix in their own PRs**, not this audit. M3 is a constraint for future work.

### Should (next polish PRs)

| # | Recommendation | Why | Files |
| --- | --- | --- | --- |
| S1 | Add `+not-found.tsx` | Expo Router skill: unmatched routes should not be a blank / default sitemap-only experience. | new `src/app/+not-found.tsx`; `Link href="/"` |
| S2 | Import details `Host` from `@expo/ui` on iOS | Skill + universal Host docs. iOS details wrap universal FieldGroup. | [`PanelDetailsScreen.ios.tsx`](../../src/components/screens/PanelDetailsScreen.ios.tsx), [`InverterDetailsScreen.ios.tsx`](../../src/components/screens/InverterDetailsScreen.ios.tsx) |
| S3 | `process.env.EXPO_OS` for toolbar icons | Official Stack Toolbar tree-shaking. | [`CustomChrome.tsx`](../../src/components/CustomChrome.tsx), [`config.tsx`](../../src/app/config.tsx), [`production.tsx`](../../src/app/production.tsx) |
| S4 | `Color.ios.*` for iOS chrome (not canvas) | `expo-native-ui` + [Color](https://docs.expo.dev/router/reference/color/). Android already uses `Color.android.dynamic`. | [`theme.base.ts`](../../src/utils/theme.base.ts), [`theme.ts`](../../src/utils/theme.ts) |
| S5 | Give Analyze a real stack title | Skill: prefer navigation title over a lone body heading. Keep body “Select AI Model” if Maestro still needs it. | [`_layout.tsx`](../../src/app/_layout.tsx) `name="analyze"`; optional `Stack.Title` in [`analyze.tsx`](../../src/app/analyze.tsx) |
| S6 | Bound empty / missing `panelId` / `inverterId` on sheets | Deep link or stale query currently renders an empty FieldGroup. | [`usePanelDetails.ts`](../../src/hooks/usePanelDetails.ts), [`useInverterForm.ts`](../../src/hooks/useInverterForm.ts) |

### Later

| # | Recommendation | Why | Files |
| --- | --- | --- | --- |
| L1 | Settings-only Config (no `wizard=true`) from Production | Today Edit Configuration re-enters the wizard on purpose (Maestro resume). A settings path is a product change. | [`useProductionMonitor.ts`](../../src/hooks/useProductionMonitor.ts); Maestro `wizard-resume-to-production.yaml` |
| L2 | Stop putting `imageUri` in the URL | Long file URIs in history. Use a store (same idea as `analysisStore`). | [`useUpload.ts`](../../src/hooks/useUpload.ts), [`useAnalyzeFlow.ts`](../../src/hooks/useAnalyzeFlow.ts) |
| L3 | Universal Links / App Links | Scheme-only deep links; no `associatedDomains` / `intentFilters`. Only if the https origin should open the app. | `app.json`; optional `+native-intent` |
| L4 | `Link` / `Link.Preview` on list rows | Skill default for iOS navigation chrome. Skip for wizard `router.push` + haptics. | [`InverterSection.ios.tsx`](../../src/components/config/InverterSection.ios.tsx), [`index.tsx`](../../src/app/index.tsx) |
| L5 | Native permission dialogs | `@expo/ui` SwiftUI `Alert` / Compose `AlertDialog` instead of RN `Modal`. | [`PermissionModal.tsx`](../../src/components/PermissionModal.tsx) |
| L6 | Android compass as Compose `ModalBottomSheet` | Align with details sheets; Maestro still may not see the same nodes. | [`compass-help.tsx`](../../src/app/compass-help.tsx), [`_layout.tsx`](../../src/app/_layout.tsx) |
| L7 | `@expo/ui` `Button` on Welcome / Analyze results | Component-selection rule. Low value vs current RN `Button` + testIDs. | [`Button.tsx`](../../src/components/Button.tsx), [`index.tsx`](../../src/app/index.tsx) |
| L8 | Route groups `(wizard)` vs `(app)` | Skill likes groups for distinct layouts. Current single stack + query param is simpler and already tested. | `src/app/` |
| L9 | Web Config | `config.web.tsx` is a stub. Only if web is a real target. | [`config.web.tsx`](../../src/app/config.web.tsx) |

---

## Verification (this PR)

- `bun test` and `./node_modules/.bin/tsc --noEmit` must stay green (doc-only).
- No Maestro / simulator on this Linux VM.
- Next Mac drive: existing verify-solar-array flows; this PR does not change screens.

## Out of scope

Hermes V1, Skia canvas, WebGPU `SimulationView`, filing extra GitHub issues, implementing the recommendations above.
