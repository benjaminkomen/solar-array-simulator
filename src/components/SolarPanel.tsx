import { Group, RoundedRect, Line } from "@shopify/react-native-skia";
import {
  useDerivedValue,
  type SharedValue,
} from "react-native-reanimated";

const PANEL_WIDTH = 60;
const PANEL_HEIGHT = 120;
const BORDER_RADIUS = 8;
const STROKE_WIDTH = 2;
const SELECTION_STROKE_WIDTH = 3;

export interface PanelColors {
  linked: { fill: string; stroke: string; grid: string };
  unlinked: { fill: string; stroke: string; grid: string };
  selection: string;
}

interface SolarPanelProps {
  x: SharedValue<number>;
  y: SharedValue<number>;
  rotation?: SharedValue<0 | 90>;
  isSelected?: boolean;
  inverterId?: SharedValue<string | null>;
  colors: PanelColors;
}

export function SolarPanel({ x, y, rotation, isSelected = false, inverterId, colors }: SolarPanelProps) {
  const transform = useDerivedValue(() => {
    if (rotation && rotation.value === 90) {
      // For 90° rotation:
      // 1. Move origin to (x + PANEL_HEIGHT, y) - the right edge of where the rotated panel will be
      // 2. Rotate 90° CW (on screen) - this makes the panel appear landscape
      // Result: panel bounding box is (x, y) to (x + PANEL_HEIGHT, y + PANEL_WIDTH) = (x, y) to (x + 120, y + 60)
      return [
        { translateX: x.value + PANEL_HEIGHT },
        { translateY: y.value },
        { rotate: Math.PI / 2 },
      ];
    }
    return [{ translateX: x.value }, { translateY: y.value }];
  });

  // Derive colors based on link state - gray when unlinked, blue when linked
  const fillColor = useDerivedValue(() =>
    inverterId?.value === null ? colors.unlinked.fill : colors.linked.fill
  );
  const strokeColor = useDerivedValue(() =>
    inverterId?.value === null ? colors.unlinked.stroke : colors.linked.stroke
  );
  const gridColor = useDerivedValue(() =>
    inverterId?.value === null ? colors.unlinked.grid : colors.linked.grid
  );

  return (
    <Group transform={transform}>
      {/* Selection highlight (rendered behind panel) */}
      {isSelected && (
        <RoundedRect
          x={-SELECTION_STROKE_WIDTH}
          y={-SELECTION_STROKE_WIDTH}
          width={PANEL_WIDTH + SELECTION_STROKE_WIDTH * 2}
          height={PANEL_HEIGHT + SELECTION_STROKE_WIDTH * 2}
          r={BORDER_RADIUS + SELECTION_STROKE_WIDTH}
          color={colors.selection}
          style="stroke"
          strokeWidth={SELECTION_STROKE_WIDTH}
        />
      )}
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

export { PANEL_WIDTH, PANEL_HEIGHT };
