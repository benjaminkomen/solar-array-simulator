import { View } from "react-native";
import { FiberCanvas } from "@/lib/fiber-canvas";
import useControls from "@/lib/orbit-controls";
import { SimulationScene } from "./SimulationScene";
import type { RoofType } from "@/utils/configStore";
import type { Season } from "@/utils/solarCalculations";

interface SimulationViewProps {
  panels: {
    id: string;
    x: number;
    y: number;
    rotation: 0 | 90;
    inverterId: string | null;
  }[];
  roofType: RoofType;
  tiltAngle: number;
  compassDirection: number;
  latitude: number;
  longitude: number;
  season: Season;
  currentHour: number;
  wattages: Map<string, number>;
  maxWattage: number;
}

export default function SimulationView(props: SimulationViewProps) {
  const [OrbitControls, events] = useControls();

  return (
    <View style={{ flex: 1 }} {...events}>
      <FiberCanvas style={{ flex: 1 }}>
        <OrbitControls />
        <SimulationScene {...props} />
      </FiberCanvas>
    </View>
  );
}
