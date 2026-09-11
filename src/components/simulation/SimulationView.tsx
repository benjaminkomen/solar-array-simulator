import { lazy, Suspense, useMemo, useState } from "react";
import { View } from "react-native";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { tryEnableWebGPU } from "@/lib/webgpuAvailability";
import { SimulationScene, type Panel3DInfo } from "./SimulationScene";
import { WebGPUUnavailable } from "./WebGPUUnavailable";

// Loaded only after tryEnableWebGPU() succeeds. A static import of FiberCanvas
// pulls in react-native-webgpu / 0.4.x wgpu, which throws in Hermes when
// RNWebGPU is missing.
const FiberCanvas = lazy(() =>
  import("@/lib/fiber-canvas").then((mod) => ({ default: mod.FiberCanvas })),
);

interface SimulationViewProps {
  panels: Panel3DInfo[];
  tiltAngle: number;
}

export default function SimulationView({ panels, tiltAngle }: SimulationViewProps) {
  const [webgpuReady] = useState(() => {
    const ready = tryEnableWebGPU();
    if (!ready) {
      console.warn(
        "[simulation] WebGPU is unavailable (WebGPUModule/RNWebGPU). Showing fallback instead of importing react-native-webgpu.",
      );
    }
    return ready;
  });

  if (!webgpuReady) {
    return <WebGPUUnavailable />;
  }

  return <WebGPUSimulationCanvas panels={panels} tiltAngle={tiltAngle} />;
}

function WebGPUSimulationCanvas({ panels, tiltAngle }: SimulationViewProps) {
  // Memoize the scene element so the FiberCanvas children reference is stable.
  // currentHour is no longer a prop — it flows through sceneState.
  const scene = useMemo(
    () => <SimulationScene panels={panels} tiltAngle={tiltAngle} />,
    [panels, tiltAngle],
  );

  return (
    <View style={{ flex: 1 }}>
      <ErrorBoundary fallback={<WebGPUUnavailable />}>
        <Suspense fallback={null}>
          <FiberCanvas style={{ flex: 1 }}>{scene}</FiberCanvas>
        </Suspense>
      </ErrorBoundary>
    </View>
  );
}
