# Android Material 3 audit (SDK 57)

Source-only review of the Android variant on current `main`. This Linux VM cannot drive `emulator-5554`. Findings come from `*.android.tsx`, Jetpack Compose `Host`s, universal routes that fork with `Platform.OS === "android"`, `@expo/ui@57.0.18`, Expo Router `Stack.Toolbar`, and current Material 3 (Material You) guidance.

This document does **not** implement a visual redesign.

Out of scope (do not change for this audit): Hermes V1 (`app.json` `useHermesV1: true`), Skia canvases (`SolarPanelCanvas`, `ProductionCanvas`, `AnalysisPreview`, `ProcessingOverlay` shader), WebGPU `SimulationView`.

## How to read this audit

Each screen uses four columns:

| Column | Meaning |
| --- | --- |
| **Today** | What the Android build actually renders |
| **M3 would use** | The Material 3 / Compose primitive, even if Expo UI does not expose it |
| **Expo UI now?** | What `@expo/ui/jetpack-compose` or `Stack.Toolbar` expose on SDK 57 |
| **Suggestion** | `keep` / `swap` / `wrap native` / `wait for Expo UI` |

**Suggestion verbs**

- **keep** — already the right M3 pattern, or a documented product split that should stay.
- **swap** — replace an RN or iOS-shaped control with a Compose / Expo UI component that already exists.
- **wrap native** — keep RN for hit-testing / a11y, or host a Compose view that Expo UI already wraps.
- **wait for Expo UI** — name the Compose API anyway; do not fake it in RN.

Known Android product facts this audit does not paper over:

- Overflow a11y is `Configuration options`, not `More options`.
- Production `⋮` stays next to Simulate in the header-right slot.
- Dev Client Tools must stay hidden (Tools button toggle / `hideDevClientToolsButton`).
- Custom Add, Analyze Skip, Upload Skip, Config Continue, and Custom Finish use RN `Pressable` in `Stack.Toolbar.View` because `Stack.Toolbar.Button` text is a dead a11y node and icon `accessibilityLabel` lands on a non-clickable Compose `Icon`.
- `Stack.Toolbar.Badge` exists only on Custom header-right unlinked count.
- Simulation season is Material `SingleChoiceSegmentedButtonRow` (good).
- Config roof is the same platform segmented pattern; inverter swipe-delete is `SwipeToDismissBox`.
- Finish → Production and first-tap toolbar hits have been flaky. Touch-target and overlay issues are first-class, not footnotes.

## Capability map (SDK 57)

### `@expo/ui/jetpack-compose` (57.0.18)

Present and usable today (from `node_modules/@expo/ui/src/jetpack-compose/index.ts`):

| M3 / Compose API | Expo UI export |
| --- | --- |
| `AlertDialog` | `AlertDialog`, `BasicAlertDialog` |
| `Badge` / `BadgedBox` | `Badge`, `BadgedBox` |
| `Button` / tonal / outlined / elevated / text | `Button`, `FilledTonalButton`, `OutlinedButton`, `ElevatedButton`, `TextButton` |
| `Card` / `OutlinedCard` / `ElevatedCard` | `Card` (+ outlined / elevated variants) |
| `AssistChip` / `FilterChip` / `InputChip` / `SuggestionChip` | `Chip` family |
| `FloatingActionButton` / small / large / extended | `FloatingActionButton`, `SmallFloatingActionButton`, `LargeFloatingActionButton`, `ExtendedFloatingActionButton` |
| `HorizontalFloatingToolbar` | `HorizontalFloatingToolbar` (+ FAB slot) |
| `IconButton` | `IconButton` |
| `ListItem` | `ListItem` |
| `ModalBottomSheet` | `ModalBottomSheet` |
| `NavigationBar` / `NavigationBarItem` | `NavigationBar`, `NavigationBarItem` |
| `SearchBar` / docked | `SearchBar`, `DockedSearchBar` |
| `SingleChoiceSegmentedButtonRow` | `SegmentedButton`, `SingleChoiceSegmentedButtonRow`, `MultiChoiceSegmentedButtonRow` |
| `Slider` / `VerticalSlider` | `Slider`, `VerticalSlider` |
| `Snackbar` / `SnackbarHost` | `Snackbar`, `SnackbarHost` |
| `LinearProgressIndicator` / `CircularProgressIndicator` | `Progress` family |
| `RadioButton` | `RadioButton` |
| `Switch` | `Switch`, `SyncSwitch` |
| `TextField` / `OutlinedTextField` | `TextField`, `OutlinedTextField`, `BasicTextField` |
| `ExposedDropdownMenuBox` | `ExposedDropdownMenuBox` (universal `Picker` on Android) |
| `DropdownMenu` | `DropdownMenu` |
| `DatePicker` / `TimePickerDialog` | `DatePicker`, `DateTimePicker`, `TimePickerDialog` |
| `Surface` | `Surface` |
| `Tooltip` | `Tooltip` |
| Material You palette | `useMaterialColors` / `getMaterialColors` |

**Not in Expo UI yet** (name the Compose / Android API anyway):

| Missing pattern | Native API to wait for / wrap |
| --- | --- |
| Top app bars | `TopAppBar`, `CenterAlignedTopAppBar`, `MediumTopAppBar`, `LargeTopAppBar` — today the stack header is Expo Router `Stack.Screen` + `Stack.Toolbar` left/right |
| Scaffold | `Scaffold` + `FabPosition` |
| Navigation rail / drawer | `NavigationRail`, `ModalNavigationDrawer` |
| FAB menu | `FloatingActionButtonMenu`, `ToggleFloatingActionButton` |
| Vertical floating toolbar | `VerticalFloatingToolbar` |
| Predictive back | `PredictiveBackHandler` (`androidx.activity`) + component-level predictive-back on sheets |
| Edge-to-edge system bars | `enableEdgeToEdge` / `SystemBarStyle` (`androidx.activity`) |
| Expressive / connected lists beyond FieldGroup | newer M3 list styles — FieldGroup already does the 20/4 connected-list clip |

Universal `@expo/ui` (`FieldGroup`, `Host`, `Picker`, `Slider`, `Button`, `TextInput`, `ListItem`) is the right default for shared forms. Universal `Picker` only supports `appearance: 'menu' | 'wheel'`. Segmented and swipe-delete stay platform files — that is correct, not a fork to undo.

### `Stack.Toolbar` (Expo Router SDK 57)

What Android actually gets:

| API | Android behavior |
| --- | --- |
| `placement="left" \| "right"` | Native header actions (AppBar) |
| `placement="bottom"` | Bottom toolbar; `disableImePadding` exists |
| `Button` | Compose `IconButton`. Icon = image source only. Text children are **not** in the TalkBack / Maestro tree. `accessibilityLabel` on an icon is applied as `contentDescription` on a **non-clickable** `Icon` |
| `View` | Escape hatch for RN `Pressable` (the current Android workaround) |
| `Menu` / `MenuAction` | Overflow menu. Product a11y is `Configuration options` |
| `Badge` | Left/right only. Used once: Custom unlinked count |
| `tintColor` / `backgroundColor` | Android-only toolbar theming |
| FAB / `NavigationBar` / labeled icon+text | **Not exposed** |

Until Expo Router puts the a11y label on the clickable `IconButton` (and exposes text buttons as real `TextButton`s), Android must keep the `Toolbar.View` + `Pressable` wrap. Do not "fix" this by switching back to `Toolbar.Button`.

## Cross-cutting findings

### Color roles vs hardcoded colors

`src/utils/theme.android.ts` already resolves Material You via `Color.android.dynamic.*` (`expo-router` `Color.android.dynamic`) and refreshes on foreground + scheme change. That is the right source for chrome.

Mapped today:

| App token | Dynamic role |
| --- | --- |
| `primary` | `primary` |
| `primaryLight` | `primaryContainer` |
| `text.primary` | `onSurface` |
| `text.secondary` / `text.tertiary` | **both** `onSurfaceVariant` |
| `text.inverse` | `onPrimary` |
| `background.primary` | `surface` |
| `background.secondary` | `surfaceContainerLow` |
| `background.tertiary` | `surfaceContainerHigh` |
| `border.light` / `medium` | `outlineVariant` / `outline` |
| `system.red` / error containers | `error` / `errorContainer` / `onError` / `onErrorContainer` |

Roles that exist on `Color.android.dynamic` / `useMaterialColors` but are unused: `secondary`, `onSecondary`, `secondaryContainer`, `tertiary`, `onPrimaryContainer`, `inversePrimary`, `inverseSurface`, `scrim`, `surfaceContainer`, `surfaceContainerLowest` / `Highest`, `background` vs `surface`.

Hardcoded leftovers (not dynamic):

- Welcome / Upload / Production `boxShadow` rgba blues and blacks.
- Simulation controls `rgba(0,0,0,0.85)` / `rgba(255,255,255,0.95)`.
- `ProcessingOverlay` `#000`, `rgba(0,0,0,0.6)`, shimmer `#9ca3af` / `#ffffff`.
- `PermissionModal` scrim `rgba(0,0,0,0.5)` and SF Symbol assets on Android.
- `ZoomControls` `shadowColor: "#000"`.
- `panel.*` hex in `theme.base.ts` — **keep**. Skia worklets cannot resolve `PlatformColor`.

`@expo/ui` `Host` theming (`useMaterialColors`) and `Color.android.dynamic` are two live palettes. Forms inside `Host` already follow Host. RN chrome should keep using `useColors()` but the token map should grow to the missing roles instead of inventing hex.

### Typography

Compose `Text` supports the full M3 scale (`displayLarge` … `labelSmall`). Sheets already use `titleMedium`. Roof picker uses `bodyLarge`. Almost every other Android surface is RN `Text` with ad-hoc sizes (`32` / `28` / `17` / `15` / `13` / `11`) and iOS-ish weights.

M3 would use `displaySmall` / `headlineSmall` for Welcome and Upload titles, `titleLarge` for Production wattage, `labelLarge` for toolbar text, `bodyLarge` / `bodyMedium` for supporting copy.

Expo UI can do this **inside a `Host`**. RN `Text` cannot consume `typography:` tokens. Suggestion: swap titles/labels that already sit near a Host; wrap or wait for the rest.

### Shape

M3 shape tokens: extra-small 4, small 8, medium 12, large 16, extra-large 28. `FieldGroup.Section` on Android already clips connected lists to 20 / 4 — keep.

RN chrome uses `borderRadius` 12–32 plus `borderCurve: "continuous"` (iOS continuous-corner language). Upload buttons, Permission card, Production card, and the custom `Button` should move to M3 container shapes (`Shape` in Expo UI, or 12/16/28 without continuous curve).

### Motion

Welcome uses Reanimated `FadeIn` (400 ms). Sheets use native dismiss. Predictive back is **off** (`app.json` `predictiveBackGestureEnabled: false`). Expo UI does not export `PredictiveBackHandler`. `ModalBottomSheet` already has `shouldDismissOnBackPress` and swipe-to-dismiss.

M3 wants emphasized easing and predictive-back previews on sheets. Enabling the manifest flag without a `PredictiveBackHandler` story will surprise wizard + Dev Client overlays. **wait for Expo UI** / Expo Router before flipping the flag.

### Navigation

This is a linear wizard, then a Production hub with one Simulation child. It is **not** a 3–5 destination information architecture. M3 `NavigationBar` / `NavigationRail` would be the wrong pattern. Keep the stack.

Header is `headerTransparent: true` + themed `ThemeProvider`. Config / Simulation force `headerTitleAlign: "center"` on Android (closer to `CenterAlignedTopAppBar`). Expo UI has no `TopAppBar`. **keep** `Stack.Screen` until Expo UI wraps app bars.

### FAB vs bottom toolbar

M3: one high-emphasis primary action is a FAB (or extended FAB). A docked toolbar holds the rest. Do not show a `NavigationBar` and a docked toolbar together. A FAB may sit beside a `HorizontalFloatingToolbar`.

Today every primary create / continue action is a `Stack.Toolbar` item (or a full-width RN button on Welcome / Upload). Expo UI already has `FloatingActionButton` and `HorizontalFloatingToolbar`. `Stack.Toolbar` cannot host a FAB.

### Lists, sheets, dialogs

- **Lists:** Config `FieldGroup` + Android `ListItem` connected clip is correct. Location results are tappable `Column`s, not `ListItem`s. Panel-details available inverters are `Button variant="text"` rows, not `ListItem`.
- **Sheets:** Inverter + Panel details already use `ModalBottomSheet`. Compass help does **not** — it is a full-screen `transparentModal`.
- **Dialogs:** Permission is a custom RN `Modal`. Delete Configuration has **no** confirm. Image-picker errors use `Alert.alert`. M3: dialogs for decisions that block the flow; sheets for scoped editing; snackbars for completed actions.

### Segmented buttons, sliders, badges

- Season + roof `SingleChoiceSegmentedButtonRow`: **keep**.
- Tilt / efficiency / hour: universal `Slider` → Compose `Slider`. **keep**. Hour slider is a better fit than `TimePicker` (continuous sun path, not a clock dialog).
- Custom unlinked `Stack.Toolbar.Badge`: **keep** the slot. Android omits `accessibilityLabel` on that button. Analyze result "N panels detected" chips are RN views, not `Badge` / `AssistChip`.

### 48 dp touch targets

M3 / Android a11y: 48×48 dp minimum, 8 dp separation. Compose `minimumInteractiveComponentSize` enforces this on real Material components.

| Control | Today | Verdict |
| --- | --- | --- |
| Custom toolbar icons (`toolbarIconButton`) | 48×48 | Meet target. Keep the Pressable-above-Host stack |
| Config Continue / Upload Skip / Analyze Skip+Analyze / Custom Finish | `minHeight: 36`, `paddingVertical: 8` | **Below 48.** First-tap / Finish flakiness lives here |
| `ZoomControls` | 44×44 | Below 48 |
| Welcome / Upload / `Button` | `paddingVertical` 16–18 | Likely ≥48 tall; not tokenized |
| Wizard step circles | 32×32 | Not interactive — OK |
| Compass | 80×80 | OK |
| Compose `IconButton` / `ListItem` / segmented / slider | Native M3 | OK if not wrapped in a smaller RN hit box |

### Edge-to-edge

`_layout` paints `GestureHandlerRootView` with `surface` so the area behind Android system bars matches Material You. `headerTransparent: true`. WizardProgress adds `insets.top + 60`. Production card uses `insets.top + 56 + 16` (`ANDROID_APPBAR_HEIGHT`). Simulation / zoom add `insets.bottom`.

There is no `enableEdgeToEdge` / `SystemBarStyle` call in app code. Expo SDK 57 / RN 0.86 typically draw edge-to-edge on Android 15 already. The risk is **overlap**: transparent header + wizard stepper + bottom toolbar + zoom (`bottom: insets.bottom + 80`) + Dev Client Tools. That is the same family as first-tap toolbar misses. **keep** the themed root; **swap** magic offsets for a real app-bar + FAB/toolbar inset once those components own the edges.

---

## Screen walk

### 1. Welcome (`src/app/index.tsx`)

First-run landing. Returning users `Redirect` to Production.

| | |
| --- | --- |
| **Today** | RN `ScrollView` + Reanimated hero (140², radius 32, hardcoded blue shadow) + 32/700 title + 17/400 subtitle + custom RN `Button` ("Get Started", `paddingVertical: 18`, radius 14). No `Host`. Empty header title. |
| **M3 would use** | `displaySmall` / `headlineSmall` title, `bodyLarge` supporting text, `Button` (filled) or `ExtendedFloatingActionButton` for the single primary action. Surface = `background`. Hero on `primaryContainer`. |
| **Expo UI now?** | Compose `Button`, `Text` + `typography`, `Surface`. No `TopAppBar` (empty header is fine). |
| **Suggestion** | **swap** Get Started to `@expo/ui` `Button` (`filled` → Compose `Button`) inside a small `Host`, or keep the RN `Button` but drive it from dynamic `primary` / `onPrimary` only. **swap** title/subtitle to a Host `Text` with `displaySmall` + `bodyLarge` if Welcome is opened for polish. **keep** the redirect. Do not add a `NavigationBar`. |

### 2. Config (`src/app/config.tsx` + Android pickers / inverter list)

Wizard step 1 and Production → Edit Configuration. `FieldGroup` in one `Host`.

| | |
| --- | --- |
| **Today** | Universal `FieldGroup` / `TextInput` / `Slider`. Roof = `SingleChoiceSegmentedButtonRow` (`RoofTypePicker.android.tsx`). Inverters = `SwipeToDismissBox` + `ListItem` + error-container swipe background. Location hits are `Column onPress`. Wizard Continue is `Toolbar.View` + `Pressable` (`minHeight: 36`, uppercase). Add inverter is `Toolbar.Button` + Material `add.xml`. `WizardProgress` is a custom RN stepper (SF icons on steps 1–3; Android check is a `✓` glyph). |
| **M3 would use** | Settings `LazyColumn` + connected `ListItem`s (already). `SingleChoiceSegmentedButtonRow` for ≤5 exclusive roof types (already). `Slider` for tilt (already). `SearchBar` / `DockedSearchBar` for city. Location rows as `ListItem`. Primary create = `FloatingActionButton` (add inverter). Continue = toolbar `TextButton` or filled button in the form footer — **48 dp**. Destructive swipe already matches `SwipeToDismissBox`. Stepper is not an M3 component; a `LinearProgressIndicator` plus a title is the usual Material wizard. |
| **Expo UI now?** | Yes for FieldGroup, segmented, slider, list, swipe (via `expo-ui-swipe-to-dismiss-box`), FAB, SearchBar, Progress. `Stack.Toolbar.Button` text is unusable; FAB is **not** a toolbar child. |
| **Suggestion** | **keep** FieldGroup, roof segmented, tilt slider, swipe-delete. **swap** Continue hit box to 48 dp (keep Pressable wrap). **swap** Add inverter to `FloatingActionButton` over the list (`wrap native` in a `Host`) and leave the bottom toolbar for Continue only — or wait if mixing FAB + `Stack.Toolbar` bottom fights IME padding. **swap** location results to `ListItem`. **later** SearchBar + wizard `LinearProgressIndicator`. |

### 3. Upload (`src/app/upload.tsx`)

Wizard step 2. Intentionally **no** `Host` on first paint (avoids a remount / LogBox when coming from Config).

| | |
| --- | --- |
| **Today** | RN hero + `MaterialIcons` + two stacked `Pressable`s (filled Take Photo, outlined gallery) + optional "Continue without photo". Skip is toolbar Pressable, `minHeight: 36`. Permission is custom RN `Modal` with **SF Symbol** assets (`sf:camera`) even on Android. |
| **M3 would use** | `FilledButton` + `OutlinedButton` (or `ElevatedButton`) in a column. Empty / hero on `surfaceContainer`. Permission = `AlertDialog` (icon + title + text + confirm/dismiss). Skip = toolbar text button at 48 dp, or a text button under the stack. |
| **Expo UI now?** | `Button` / `OutlinedButton` / `TextButton`, `AlertDialog`, `Icon` (Material Symbols). No Host on first paint is a **product constraint** — do not remount Compose on this screen's first frame. |
| **Suggestion** | **keep** no-Host first paint. **swap** permission to `AlertDialog` **after** first paint (conditional Host is OK; the modal is not first paint). **swap** camera/gallery icons to Material Symbols (`photo_camera`, `photo_library`) — SF on Android is a platform bug. **swap** Skip to 48 dp. **later** wrap the two primary actions in Compose buttons once a Host can mount after the first frame without regressing Config → Upload. |

### 4. Analyze (`src/app/analyze.tsx`)

Model pick, processing, results. One bottom toolbar (Skip + Analyze).

| | |
| --- | --- |
| **Today** | Universal `Picker` → Android `ExposedDropdownMenuBox` + read-only `TextField` (correct M3 menu). Empty preview is an RN box. Skip / Analyze are Pressable toolbar text (`minHeight: 36`). Results: Skia `AnalysisPreview` (out of scope) + RN "info badges" + RN `Button` Retry / Continue. Processing is a custom Skia overlay (out of scope). |
| **M3 would use** | `ExposedDropdownMenuBox` (already). Optional `RadioButton` list if the catalog should stay visible. Analyze = filled toolbar button or FAB. Results metadata = `AssistChip` / `Badge`. Retry = `OutlinedButton`, Continue = `Button`. Processing = `CircularProgressIndicator` on `scrim` — **do not** replace the existing shader in this audit's follow-ups unless product asks. |
| **Expo UI now?** | Picker/menu, Chip, Badge, Button variants, Progress, AlertDialog. Toolbar text still needs Pressable. |
| **Suggestion** | **keep** ExposedDropdownMenuBox (do not invent a segmented control for 6+ models). **swap** Skip/Analyze to 48 dp. **swap** result chips to `AssistChip` / `Badge` in a Host. **swap** Retry/Continue to universal `@expo/ui` `Button` (Android already maps to Compose). **keep** Skia processing. |

### 5. Custom (`CustomScreen.android.tsx` + `CustomChrome.tsx`)

Canvas editor. Header: compass, unlinked badge, snap. Bottom: Add, then link/rotate/delete when selected, Finish when wizard + ≥1 panel.

| | |
| --- | --- |
| **Today** | `Stack.Toolbar` right + bottom. Android icons are Compose `Icon` in a `pointerEvents="none"` Host **under** a 48×48 RN Pressable (documented dead-node workaround). Badge only on header-right unlinked count; that `Toolbar.Button` has **no** Android `accessibilityLabel`. Finish is 36 dp uppercase Pressable. Zoom is 44×44 Ionicons. Compass is 80 dp Skia. Wizard stepper above a transparent header. |
| **M3 would use** | `FloatingActionButton` for Add panel (the single high-emphasis create). Contextual link/rotate/delete on a `HorizontalFloatingToolbar` beside the FAB, or a docked toolbar **without** also putting Add on that toolbar. Unlinked count = `BadgedBox` on the link action. Finish = filled `TextButton` / `Button` at 48 dp. Zoom = stacked `FilledIconButton` at 48 dp (`surfaceContainer`). |
| **Expo UI now?** | FAB, `HorizontalFloatingToolbar` + FAB slot, `BadgedBox`, `IconButton`, `Tooltip`. `Stack.Toolbar` cannot be those components. Mixing a Compose FAB with `placement="bottom"` will collide unless the docked toolbar goes away. |
| **Suggestion** | **keep** the Pressable-above-Host icon wrap until `Stack.Toolbar.Button` a11y is fixed. **keep** Badge on header-right only. **swap** Finish (and any remaining 36 dp text) to 48 dp — this is the Finish → Production flake surface. **swap** Add to `FloatingActionButton` and move contextual actions to `HorizontalFloatingToolbar` **or** keep the docked toolbar and make Add the FAB only (**wrap native**). Do not do both a docked `Stack.Toolbar` and a FAB without measuring overlap with zoom (`bottom: insets.bottom + 80`). **swap** zoom to 48 dp. **wait** for Toolbar.Button a11y before removing Pressables. |

### 6. Production (`src/app/production.tsx`)

Post-wizard home. Output card, read-only canvas, Simulate, overflow.

| | |
| --- | --- |
| **Today** | Header-right `Toolbar.Button` (sun / Simulate) + `Toolbar.Menu` (`more_vert.xml`, a11y `Configuration options`) with Edit / Delete. Delete runs `resetAllData` immediately — no dialog. Output is an RN card (radius 16, hardcoded shadow, `surface` + outline). Compass read-only. Zoom 44 dp. No `Host`. Dev Client Tools can steal this corner if the toggle is on. |
| **M3 would use** | `CenterAlignedTopAppBar` or the current AppBar. Simulate as `FloatingActionButton` (`wb_sunny`) **or** keep as a header icon (secondary). Overflow `⋮` stays in the AppBar — **do not** move it onto the card. Delete = `AlertDialog` (error / destructive confirm). Output = `Card` on `surfaceContainerLow` / `surfaceContainer`. Snackbar after delete is too late (route is gone); confirm dialog is the right pattern. |
| **Expo UI now?** | `AlertDialog`, `Card`, `FAB`, `IconButton`. No TopAppBar. `Stack.Toolbar.Menu` is the right overflow. |
| **Suggestion** | **keep** `Configuration options` label and header-right slot next to Simulate. **keep** Tools-button hide path. **swap** Delete to `AlertDialog` (must). **swap** output card to Compose `Card` if a Host is acceptable here (feature map currently says do not wrap this screen in Host — honor that until delete/card work is scheduled; a tiny Host for the dialog only is fine). **later** Simulate FAB. Do not add a `NavigationBar`. |

### 7. Simulation (`src/app/simulation.tsx` + `SimulationControls.tsx` + `SeasonPicker.android.tsx`)

3D scene + time / season chrome. Do not rewrite `SimulationView`.

| | |
| --- | --- |
| **Today** | Centered Android title. iOS-only minimal back. Controls are an RN glass panel (`rgba` overlays, `borderTopColor: outlineVariant`) with RN display type, universal `Slider` (Android height 56), and `SingleChoiceSegmentedButtonRow` (height 48). |
| **M3 would use** | `Surface` (`surfaceContainer` / `surfaceContainerHigh`) docked at the bottom with tonal elevation — not a CSS glass plate. `Slider` for the sun path (already). `SingleChoiceSegmentedButtonRow` for four seasons (already). Wattage / time as `titleLarge` / `displaySmall` tabular. Optional `TimePickerDialog` is a worse fit than the slider. |
| **Expo UI now?** | Surface, Slider, segmented, Text typography. TimePicker exists but should not replace the slider. |
| **Suggestion** | **keep** season segmented and hour slider. **keep** WebGPU view. **swap** the glass `rgba` panel to `surfaceContainer` (via `useColors` role or a Host `Surface`) so dark/light + wallpaper contrast is real. **later** typography tokens on the two numeric displays. |

### 8. Inverter details (`InverterDetailsScreen.android.tsx` + `InverterDetailsForm.tsx`)

Add/edit micro-inverter. `_layout` uses `transparentModal` + `headerShown: false`; the screen owns a `ModalBottomSheet`.

| | |
| --- | --- |
| **Today** | `ModalBottomSheet` with close / title / check `IconButton`s and a `FieldGroup` (serial `TextInput`, efficiency `Slider`). Fixed `height: 420` on Android. Default drag handle on. Back / scrim / swipe dismiss via `onDismissRequest`. |
| **M3 would use** | Exactly this: modal sheet for scoped edit. `IconButton` 48 dp. Confirm in the sheet header is OK; a trailing `TextButton` ("Save") is more common. |
| **Expo UI now?** | `ModalBottomSheet` (drag handle, `shouldDismissOnBackPress`, expand/collapse). `IconButton`, FieldGroup, Slider. No predictive-back preview until the manifest flag + Compose version support it. |
| **Suggestion** | **keep** the sheet (this is the reference Android pattern). **keep** swipe-to-dismiss + back. **later** drop the magic `420` height once FieldGroup measures; consider Save as `TextButton`. |

### 9. Panel details (`PanelDetailsScreen.android.tsx` + `PanelDetailsForm.tsx`)

Link / unlink / empty state. Same sheet chrome.

| | |
| --- | --- |
| **Today** | `ModalBottomSheet` + centered `titleMedium`. Linked / available / empty states in `FieldGroup`. Available rows are text `Button`s with chevron. Unlink is a text button + `error` color. Empty uses `warning` + "Add Inverter". |
| **M3 would use** | Sheet (already). Available inverters as `ListItem` (headline + supporting + trailing). Unlink = `TextButton` with `error` content color, or a confirm `AlertDialog` if unlink is hard to undo. Empty = Compose empty state (no `ContentUnavailableView` on Android; use `Column` + icon + `Button`). |
| **Expo UI now?** | Sheet, ListItem, Button, AlertDialog, Icon. No Android `ContentUnavailableView`. |
| **Suggestion** | **keep** the sheet. **swap** available rows to `ListItem` (Config already does this). **later** unlink confirm if product wants it. |

### 10. Compass help (`src/app/compass-help.tsx` + `_layout`)

Array orientation explainer. iOS is `formSheet` detent 0.3. Android is `transparentModal` + full-screen RN `View` (Material icon, 18/700 title, 15/400 body). Feature map: do not assert presentation style; Maestro cannot treat Android like the iOS sheet.

| | |
| --- | --- |
| **Today** | Full-screen modal that looks like a page. No drag handle, no partial detent, no scrim-over-canvas. Body is not in a `ModalBottomSheet` (unlike inverter/panel). |
| **M3 would use** | `ModalBottomSheet` (short / partially expanded). Help is secondary content; a dialog is too blocking, a full-screen page is the wrong layer. Predictive back should shrink the sheet. |
| **Expo UI now?** | `ModalBottomSheet` with `skipPartiallyExpanded`, `initialFullyExpanded`, drag handle — already used on the other two sheets. |
| **Suggestion** | **swap** Android chrome to the same `ModalBottomSheet` pattern as `InverterDetailsScreen.android.tsx`. That is a presentation change, not a Skia change. Until then, TalkBack / Back will feel like a new route. **keep** the copy and the Custom toggle behavior. |

### 11. Permission modal (Upload) and other overlays

| Surface | Today | M3 | Expo UI | Suggestion |
| --- | --- | --- | --- | --- |
| Camera / gallery permission | RN `Modal`, fade, SF icons, 24 radius continuous, custom filled/tonal buttons | `AlertDialog` | `AlertDialog` | **swap** |
| Image picker errors | `Alert.alert` | `AlertDialog` or keep system alert | `AlertDialog` | **keep** system `Alert` for hard failures, or **swap** later |
| Delete configuration | No prompt | `AlertDialog` (error) | `AlertDialog` | **swap** (must) |
| Analyze processing | Custom Skia | `CircularProgressIndicator` + scrim | `Progress` | **keep** shader (out of scope) |
| Config → Upload Host remount | Avoided by no-Host Upload | n/a | Host is fine **after** first paint | **keep** the constraint |

---

## Ranked follow-ups

No issues were filed. This is the implementation order if/when a redesign PR is scheduled.

### Must

1. **48 dp on every Android toolbar text action.** Config Continue, Upload Skip, Analyze Skip / Analyze, Custom Finish all use `minHeight: 36`. This is the most likely cause of first-tap misses and Finish → Production flakes. Keep `Toolbar.View` + `Pressable`; grow the hit box to 48×48 (or 48 tall × padded width) and keep `collapsable={false}` / `cancelable={false}`. Compose API: `minimumInteractiveComponentSize` — Expo UI does not expose it on `Stack.Toolbar.View`.
2. **Confirm Delete Configuration.** Production overflow deletes the array with no dialog. M3: `AlertDialog` with error-colored confirm. Expo UI: `AlertDialog` (`Title` / `Text` / `ConfirmButton` / `DismissButton`). A one-Host overlay on Production does not violate the "no Host wrapping the canvas" rule.
3. **Compass help is a sheet, not a page.** Android `transparentModal` + `flex: 1` is the wrong layer. Swap to `ModalBottomSheet` like inverter/panel. Compose: `ModalBottomSheet`.
4. **Permission uses `AlertDialog`, not a custom RN card, and not SF Symbols.** Compose: `AlertDialog` + Material `Icon`.
5. **Do not regress the Toolbar.Button a11y workaround.** Until Expo Router attaches labels to the clickable `IconButton` and exposes real text buttons, Android Add / Skip / Continue / Finish stay on `Pressable`. `Stack.Toolbar.Button` text children remain dead nodes.

### Should

6. **Grow the color-role map; stop hardcoded overlays on chrome.** Add `secondary*`, `scrim`, `surfaceContainer`, `onPrimaryContainer`. Replace Simulation glass rgba, Welcome/Upload/Production shadows, and Permission scrim with roles from `Color.android.dynamic` / `useMaterialColors`. Leave `panel.*` hex for Skia.
7. **FAB for the one create action on Config and Custom.** Compose: `FloatingActionButton`. Do not also keep Add on a docked toolbar. Measure against zoom + IME + wizard Finish.
8. **Custom contextual actions → `HorizontalFloatingToolbar` (optional FAB slot).** Compose: `HorizontalFloatingToolbar`. Alternative: keep `Stack.Toolbar` bottom for Finish + selection actions only.
9. **Zoom controls 48 dp.** Compose: `IconButton` / `FilledIconButton` (Expo UI `IconButton` + container color). Today 44×44 Ionicons.
10. **Analyze result chips → `AssistChip` / `Badge`.** Not `Stack.Toolbar.Badge`.
11. **Config location results → `ListItem`; city field → `DockedSearchBar` or `SearchBar` when it can mount without breaking first-paint rules.**
12. **Upload / Welcome / Analyze result actions → Compose `Button` / `OutlinedButton`** once a Host is legal on that frame.
13. **Production output → `Card`** (`surfaceContainer`). Keep Simulate + `Configuration options` in the header.
14. **Unlinked badge a11y.** Header-right Badge button needs an Android `accessibilityLabel` (iOS already has `Unlinked panels`). Compose: `BadgedBox` if the control leaves `Stack.Toolbar`.
15. **Wizard chrome.** Replace SF step icons on Android with Material Symbols. Consider `LinearProgressIndicator` instead of the 32 dp circle stepper so the transparent header + stepper overlap shrinks.

### Later

16. **Predictive back.** `app.json` `predictiveBackGestureEnabled` is `false`. Compose / Activity: `PredictiveBackHandler`, sheet predictive-back. Expo UI does not export it. Do not enable the flag until wizard, sheets, and Dev Client Tools are tested on a device.
17. **`TopAppBar` / `Scaffold`.** Wait for Expo UI. `Stack.Screen` + `Stack.Toolbar` is the current AppBar.
18. **`NavigationBar` / `NavigationRail` / drawer.** Wrong IA for a wizard + one hub. Wait unless the app grows destinations.
19. **`TimePickerDialog` for Simulation hour.** Worse than `Slider`. Do not swap.
20. **`FloatingActionButtonMenu` / `VerticalFloatingToolbar`.** Not in Expo UI (vertical toolbar missing; FAB menu missing). Custom already has 3–4 contextual actions — a FAB menu is optional.
21. **Processing overlay → `CircularProgressIndicator`.** Wait for a product ask; do not rewrite Skia.
22. **Dynamic color for Skia panels.** Wait — worklets cannot use `PlatformColor`.
23. **Typography tokens on remaining RN text** (Welcome, Upload, Production wattage, Simulation clocks, Wizard labels). Needs Host `Text` or a future universal typography API.
24. **Edge-to-edge `SystemBarStyle`.** Wait for an Expo / `expo-system-ui` API that matches `enableEdgeToEdge`. Keep the themed root.
25. **Snackbar** for "Inverter saved" / "Panel linked". Expo UI: `SnackbarHost`. Only after the must-have dialogs exist so snackbars are not used for destructive confirm.

---

## What this audit could not verify

This VM cannot launch the Dev Client or Maestro against `emulator-5554`. The following stay **unverified on device** and should be driven on a Mac with the verify skill before any of the Must items land:

- Actual TalkBack focus order on the Pressable-above-Host toolbar stack.
- Whether 36 dp toolbar text is the Finish / first-tap flake, or whether a transparent header / wizard stepper / Dev Client Tools overlay is eating the first hit.
- Dynamic-color contrast of `primary` on `surface` for the current wallpaper palettes.
- `ModalBottomSheet` predictive-back and IME padding if a FAB is added next to `Stack.Toolbar`.
- Compass help Back vs sheet dismiss (Android is a full-screen modal today).

Proof for this document: the Android sources listed above, `@expo/ui@57.0.18` exports, Expo Router `Stack.Toolbar` Android types (`native.android.d.ts`: "Renders as an IconButton"), `app.json` `predictiveBackGestureEnabled: false`, and [Material 3 components](https://m3.material.io/components) / [toolbars](https://m3.material.io/components/toolbars/guidelines) / [bottom sheets](https://m3.material.io/components/bottom-sheets/guidelines) / [color roles](https://m3.material.io/styles/color/roles) / [48 dp targets](https://support.google.com/accessibility/android/answer/7101858).
