import { Group, RoundedRect, Line } from "@shopify/react-native-skia";
import {
  useDerivedValue,
  type SharedValue,
} from "react-native-reanimated";
import { PANEL_WIDTH, PANEL_HEIGHT } from "@/utils/panelUtils";

const BORDER_RADIUS = 8;
const STROKE_WIDTH = 2;

export interface PanelColors {
  linked: { fill: string; stroke: string; grid: string };
  unlinked: { fill: string; stroke: string; grid: string };
  selection: string;
}

interface BasePanelShapeProps {
  x: SharedValue<number>;
  y: SharedValue<number>;
  rotation?: SharedValue<0 | 90>;
  inverterId?: SharedValue<string | null>;
  colors: PanelColors;
  children?: React.ReactNode;
}

export function BasePanelShape({ x, y, rotation, inverterId, colors, children }: BasePanelShapeProps) {
  const transform = useDerivedValue(() => {
    if (rotation && rotation.value === 90) {
      return [
        { translateX: x.value + PANEL_HEIGHT },
        { translateY: y.value },
        { rotate: Math.PI / 2 },
      ];
    }
    return [{ translateX: x.value }, { translateY: y.value }];
  });

  const fillColor = useDerivedValue(() =>
    !inverterId || inverterId.value === null ? colors.unlinked.fill : colors.linked.fill
  );
  const strokeColor = useDerivedValue(() =>
    !inverterId || inverterId.value === null ? colors.unlinked.stroke : colors.linked.stroke
  );
  const gridColor = useDerivedValue(() =>
    !inverterId || inverterId.value === null ? colors.unlinked.grid : colors.linked.grid
  );

  return (
    <Group transform={transform}>
      {children}
      {/* Panel fill */}
      <RoundedRect
        x={0}
        y={0}
        width={PANEL_WIDTH}
        height={PANEL_HEIGHT}
        r={BORDER_RADIUS}
        color={fillColor}
      />
      {/* Panel border */}
      <RoundedRect
        x={0}
        y={0}
        width={PANEL_WIDTH}
        height={PANEL_HEIGHT}
        r={BORDER_RADIUS}
        color={strokeColor}
        style="stroke"
        strokeWidth={STROKE_WIDTH}
      />
      {/* Vertical center line */}
      <Line
        p1={{ x: PANEL_WIDTH / 2, y: BORDER_RADIUS }}
        p2={{ x: PANEL_WIDTH / 2, y: PANEL_HEIGHT - BORDER_RADIUS }}
        color={gridColor}
        strokeWidth={2}
      />
      {/* Horizontal lines (3 evenly spaced) */}
      <Line
        p1={{ x: BORDER_RADIUS, y: PANEL_HEIGHT * 0.25 }}
        p2={{ x: PANEL_WIDTH - BORDER_RADIUS, y: PANEL_HEIGHT * 0.25 }}
        color={gridColor}
        strokeWidth={2}
      />
      <Line
        p1={{ x: BORDER_RADIUS, y: PANEL_HEIGHT * 0.5 }}
        p2={{ x: PANEL_WIDTH - BORDER_RADIUS, y: PANEL_HEIGHT * 0.5 }}
        color={gridColor}
        strokeWidth={2}
      />
      <Line
        p1={{ x: BORDER_RADIUS, y: PANEL_HEIGHT * 0.75 }}
        p2={{ x: PANEL_WIDTH - BORDER_RADIUS, y: PANEL_HEIGHT * 0.75 }}
        color={gridColor}
        strokeWidth={2}
      />
    </Group>
  );
}
