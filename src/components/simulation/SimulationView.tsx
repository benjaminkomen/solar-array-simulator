import { useMemo } from "react";
import { View } from "react-native";
import { FiberCanvas } from "@/lib/fiber-canvas";
import { SimulationScene, type Panel3DInfo } from "./SimulationScene";

interface SimulationViewProps {
  panels: Panel3DInfo[];
  tiltAngle: number;
}

export default function SimulationView({ panels, tiltAngle }: SimulationViewProps) {
  // Memoize the scene element so the FiberCanvas children reference is stable.
  // currentHour is no longer a prop — it flows through sceneState.
  const scene = useMemo(
    () => <SimulationScene panels={panels} tiltAngle={tiltAngle} />,
    [panels, tiltAngle],
  );

  return (
    <View style={{ flex: 1 }}>
      <FiberCanvas style={{ flex: 1 }}>
        {scene}
      </FiberCanvas>
    </View>
  );
}
