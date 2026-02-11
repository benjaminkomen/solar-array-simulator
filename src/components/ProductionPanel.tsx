import { Group, RoundedRect, Line, Text as SkiaText, matchFont } from "@shopify/react-native-skia";
import {
  useDerivedValue,
  type SharedValue,
} from "react-native-reanimated";

const PANEL_WIDTH = 60;
const PANEL_HEIGHT = 120;
const BORDER_RADIUS = 8;
const STROKE_WIDTH = 2;

// Linked panel colors (blue)
const FILL_COLOR = "#3b82f6"; // blue-500
const STROKE_COLOR = "#1d4ed8"; // blue-800
const GRID_COLOR = "#60a5fa"; // blue-400

// Unlinked panel colors (gray)
const UNLINKED_FILL_COLOR = "#9ca3af"; // gray-400
const UNLINKED_STROKE_COLOR = "#6b7280"; // gray-500
const UNLINKED_GRID_COLOR = "#d1d5db"; // gray-300

interface ProductionPanelProps {
  x: SharedValue<number>;
  y: SharedValue<number>;
  rotation?: SharedValue<0 | 90>;
  wattage: number;
  inverterId?: SharedValue<string | null>;
}

export function ProductionPanel({ x, y, rotation, wattage, inverterId }: ProductionPanelProps) {
  // Use system font for text rendering
  const font = matchFont({
    fontFamily: "System",
    fontSize: 11,
    fontWeight: "bold",
  });

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

  // Calculate center point in world coordinates (accounting for rotation)
  const textCenterX = useDerivedValue(() => {
    if (rotation && rotation.value === 90) {
      // For 90° rotation, center is at (x + PANEL_HEIGHT/2, y + PANEL_WIDTH/2)
      return x.value + PANEL_HEIGHT / 2;
    }
    return x.value + PANEL_WIDTH / 2;
  });

  const textCenterY = useDerivedValue(() => {
    if (rotation && rotation.value === 90) {
      return y.value + PANEL_WIDTH / 2;
    }
    return y.value + PANEL_HEIGHT / 2;
  });

  // Measure text width for proper centering
  const text = `${wattage}W`;
  const textWidth = font.measureText(text).width;

  // Derive colors based on link state
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
    <>
      {/* Panel shape (rotated) */}
      <Group transform={transform}>
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

      {/* Wattage text overlay (not rotated) */}
      <Group>
        {/* Text background for contrast */}
        <RoundedRect
          x={useDerivedValue(() => textCenterX.value - (textWidth / 2 + 4))}
          y={useDerivedValue(() => textCenterY.value - 10)}
          width={textWidth + 8}
          height={18}
          r={4}
          color="rgba(0, 0, 0, 0.6)"
        />
        <SkiaText
          x={useDerivedValue(() => textCenterX.value - textWidth / 2)}
          y={useDerivedValue(() => textCenterY.value + 3)}
          text={text}
          font={font}
          color="white"
        />
      </Group>
    </>
  );
}

export { PANEL_WIDTH, PANEL_HEIGHT };
