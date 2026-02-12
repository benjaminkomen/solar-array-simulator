import { Group, RoundedRect, Line, Text as SkiaText, matchFont } from "@shopify/react-native-skia";
import {
  useDerivedValue,
  type SharedValue,
} from "react-native-reanimated";
import type { PanelColors } from "./SolarPanel";

const PANEL_WIDTH = 60;
const PANEL_HEIGHT = 120;
const BORDER_RADIUS = 8;
const STROKE_WIDTH = 2;

interface ProductionPanelProps {
  x: SharedValue<number>;
  y: SharedValue<number>;
  rotation?: SharedValue<0 | 90>;
  wattage: number;
  inverterId?: SharedValue<string | null>;
  colors: PanelColors;
}

export function ProductionPanel({ x, y, rotation, wattage, inverterId, colors }: ProductionPanelProps) {
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

  // Measure text width for proper centering (with null safety)
  const text = `${wattage}W`;
  const textWidth = font ? font.measureText(text).width : 25; // Fallback width if font unavailable

  // Derive colors based on link state
  const fillColor = useDerivedValue(() =>
    inverterId?.value === null ? colors.unlinked.fill : colors.linked.fill
  );
  const strokeColor = useDerivedValue(() =>
    inverterId?.value === null ? colors.unlinked.stroke : colors.linked.stroke
  );
  const gridColor = useDerivedValue(() =>
    inverterId?.value === null ? colors.unlinked.grid : colors.linked.grid
  );

  // Derived values for text positioning (computed unconditionally to satisfy hooks rules)
  const textBackgroundX = useDerivedValue(() => textCenterX.value - (textWidth / 2 + 4));
  const textBackgroundY = useDerivedValue(() => textCenterY.value - 10);
  const textX = useDerivedValue(() => textCenterX.value - textWidth / 2);
  const textY = useDerivedValue(() => textCenterY.value + 3);

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

      {/* Wattage text overlay (not rotated) - only render if font is available */}
      {font && (
        <Group>
          {/* Text background for contrast */}
          <RoundedRect
            x={textBackgroundX}
            y={textBackgroundY}
            width={textWidth + 8}
            height={18}
            r={4}
            color="rgba(0, 0, 0, 0.6)"
          />
          <SkiaText
            x={textX}
            y={textY}
            text={text}
            font={font}
            color="white"
          />
        </Group>
      )}
    </>
  );
}

export { PANEL_WIDTH, PANEL_HEIGHT };
