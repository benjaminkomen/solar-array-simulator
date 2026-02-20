import { View } from "react-native";
import { FiberCanvas } from "@/lib/fiber-canvas";
import { SimulationScene } from "./SimulationScene";
import type { Season } from "@/utils/solarCalculations";

interface SimulationViewProps {
  latitude: number;
  longitude: number;
  season: Season;
  currentHour: number;
}

export default function SimulationView(props: SimulationViewProps) {
  return (
    <View style={{ flex: 1 }}>
      <FiberCanvas style={{ flex: 1 }}>
        <SimulationScene {...props} />
      </FiberCanvas>
    </View>
  );
}
