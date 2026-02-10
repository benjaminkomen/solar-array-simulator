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

// Linked panel colors (blue)
const FILL_COLOR = "#3b82f6"; // blue-500
const STROKE_COLOR = "#1d4ed8"; // blue-800
const GRID_COLOR = "#60a5fa"; // blue-400

// Unlinked panel colors (gray)
const UNLINKED_FILL_COLOR = "#9ca3af"; // gray-400
const UNLINKED_STROKE_COLOR = "#6b7280"; // gray-500
const UNLINKED_GRID_COLOR = "#d1d5db"; // gray-300

const SELECTION_COLOR = "#fbbf24"; // amber-400

interface SolarPanelProps {
  x: SharedValue<number>;
  y: SharedValue<number>;
  rotation?: SharedValue<0 | 90>;
  isSelected?: boolean;
  inverterId?: SharedValue<string | null>;
}

export function SolarPanel({ x, y, rotation, isSelected = false, inverterId }: SolarPanelProps) {
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
    inverterId?.value === null ? UNLINKED_FILL_COLOR : FILL_COLOR
  );
  const strokeColor = useDerivedValue(() =>
    inverterId?.value === null ? UNLINKED_STROKE_COLOR : STROKE_COLOR
  );
  const gridColor = useDerivedValue(() =>
    inverterId?.value === null ? UNLINKED_GRID_COLOR : GRID_COLOR
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
          color={SELECTION_COLOR}
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
