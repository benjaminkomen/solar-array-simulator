# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Commands

```bash
bun install                        # Install dependencies
bun start                          # Start Expo dev server
bun ios                            # iOS simulator (dev build)
bun android                        # Android emulator (dev build)
bun test                           # Unit tests
bun run lint                       # Lint
./node_modules/.bin/tsc --noEmit   # Type check
bun run test:maestro               # Maestro E2E tests
npx react-doctor --verbose         # React Compiler health check
```

## Critical Rules

**Before committing:** Always run `bun test` and ensure all unit tests pass.

**React Compiler:** Run `npx react-doctor --verbose` after modifying React components. Fix all errors before committing. Common patterns to avoid:
- Mutating shared values from hooks directly — extract mutations into module-level functions that accept `SharedValue` parameters
- Conditional expressions (ternary, `??`, `?.`) inside try/catch — compute conditional values before the try block
- Mismatched `useCallback`/`useMemo` dependency arrays — include all values the compiler infers as dependencies

**E2E Tests:** When modifying screens, navigation, or interactive elements, run `bun run test:maestro`. If your changes alter navigation flow, button text, or screen structure, update the affected Maestro test files in `.maestro/` accordingly.

**Development builds only:** This project uses Expo dev client builds. Start dev server with `bun start`, then open the development build on the simulator. **DO NOT run** `npx expo run:ios`, `npx expo run:android`, or `eas build --local` for local development.

**Prefer Expo UI components:** For any screen with forms, selections, or structured input, use `@expo/ui/swift-ui` components (`Host`, `Form`, `Section`, `TextField`, `Picker`, `Slider`, `LabeledContent`, `List.ForEach`, `Button`) instead of custom React Native primitives. Wrap SwiftUI content in `<Host><Form>...</Form></Host>`. See `src/app/config.tsx` and `src/app/inverter-details.tsx` for reference patterns.

## Architecture

Expo Router v55 preview app for creating solar panel array layouts. React Native New Architecture with React Compiler enabled.

**Key technologies:** Expo Router v55 (`Stack.Screen`, `Stack.Toolbar`), `@expo/ui/swift-ui` (native forms), `@shopify/react-native-skia` (2D canvas), React Native Reanimated + Gesture Handler (animations/gestures), `@ai-sdk/amazon-bedrock` (image analysis API route), `react-native-wgpu` + `three` + `@react-three/fiber` (3D simulation), `expo-sqlite/kv-store` (persistent config).

**Path alias:** `@/*` maps to `./src/*`

### Project Structure

```
src/
├── app/                    # Expo Router file-based routes
│   ├── _layout.tsx         # Root layout with PanelsProvider
│   ├── index.tsx           # Welcome screen
│   ├── config.tsx          # Step 1: Configuration (SwiftUI Form)
│   ├── upload.tsx          # Step 2: Upload photo
│   ├── analyze.tsx         # AI model selection + analysis
│   ├── custom.tsx          # Step 3: Canvas editor
│   ├── production.tsx      # Production monitor
│   ├── simulation.tsx      # 3D solar simulation
│   ├── panel-details.tsx   # Form sheet: panel-inverter link
│   ├── inverter-details.tsx # Form sheet: add/edit inverters
│   ├── compass-help.tsx    # Form sheet: compass help
│   └── api/
│       └── analyze+api.ts  # Bedrock API route (Claude vision)
├── components/             # Reusable UI components
├── hooks/                  # React hooks (useConfigStore, usePanelsManager, useImagePicker)
├── lib/                    # WebGPU/R3F setup for 3D rendering
└── utils/                  # Pure utilities (config store, collision, grid snap, etc.)
```

### Environment Variables

Required for the API route (`.env` for local dev, EAS Secrets for production):

- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION`

### Canvas System

The Skia canvas (`SolarPanelCanvas` / `ProductionCanvas`) uses Reanimated SharedValues and worklet functions running on the UI thread. Panels snap to grid or neighbor edges on drag release. Collision detection uses AABB with 8px gap.

## Maestro E2E Tests

Tests in `.maestro/` validate user-facing flows on a real simulator. Shared sub-flows in `.maestro/shared/` handle app launch and wizard navigation.

Key selector notes:
- Use `tapOn: "text"` for visible text, `tapOn: { id: "testID" }` for testID props
- Toolbar SF Symbol icons are accessible by name (e.g., `icon="plus"` → `tapOn: "add"`)
- Skia canvas elements are not accessible to Maestro — test via toolbar side effects
- SwiftUI section headers may not be visible to Maestro
- `extendedWaitUntil` with `id:` must nest under `visible:` — use `visible: { id: "myId" }`

## Infrastructure

Terraform config in `terraform/` creates an IAM user with minimal `bedrock:InvokeModel` permissions.
