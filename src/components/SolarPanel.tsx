import { Group, RoundedRect, Line } from "@shopify/react-native-skia";
import {
  useDerivedValue,
  type SharedValue,
} from "react-native-reanimated";

const PANEL_WIDTH = 60;
const PANEL_HEIGHT = 120;
const BORDER_RADIUS = 8;
const STROKE_WIDTH = 2;

const FILL_COLOR = "#3b82f6"; // blue-500
const STROKE_COLOR = "#1d4ed8"; // blue-800
const GRID_COLOR = "#60a5fa"; // blue-400

interface SolarPanelProps {
  x: SharedValue<number>;
  y: SharedValue<number>;
}

export function SolarPanel({ x, y }: SolarPanelProps) {
  const transform = useDerivedValue(() => {
    return [{ translateX: x.value }, { translateY: y.value }];
  });

  return (
    <Group transform={transform}>
      {/* Panel fill */}
      <RoundedRect
        x={0}
        y={0}
        width={PANEL_WIDTH}
        height={PANEL_HEIGHT}
        r={BORDER_RADIUS}
        color={FILL_COLOR}
      />
      {/* Panel border */}
      <RoundedRect
        x={0}
        y={0}
        width={PANEL_WIDTH}
        height={PANEL_HEIGHT}
        r={BORDER_RADIUS}
        color={STROKE_COLOR}
        style="stroke"
        strokeWidth={STROKE_WIDTH}
      />
      {/* Vertical center line */}
      <Line
        p1={{ x: PANEL_WIDTH / 2, y: BORDER_RADIUS }}
        p2={{ x: PANEL_WIDTH / 2, y: PANEL_HEIGHT - BORDER_RADIUS }}
        color={GRID_COLOR}
        strokeWidth={1}
      />
      {/* Horizontal lines (3 evenly spaced) */}
      <Line
        p1={{ x: BORDER_RADIUS, y: PANEL_HEIGHT * 0.25 }}
        p2={{ x: PANEL_WIDTH - BORDER_RADIUS, y: PANEL_HEIGHT * 0.25 }}
        color={GRID_COLOR}
        strokeWidth={1}
      />
      <Line
        p1={{ x: BORDER_RADIUS, y: PANEL_HEIGHT * 0.5 }}
        p2={{ x: PANEL_WIDTH - BORDER_RADIUS, y: PANEL_HEIGHT * 0.5 }}
        color={GRID_COLOR}
        strokeWidth={1}
      />
      <Line
        p1={{ x: BORDER_RADIUS, y: PANEL_HEIGHT * 0.75 }}
        p2={{ x: PANEL_WIDTH - BORDER_RADIUS, y: PANEL_HEIGHT * 0.75 }}
        color={GRID_COLOR}
        strokeWidth={1}
      />
    </Group>
  );
}

export { PANEL_WIDTH, PANEL_HEIGHT };
