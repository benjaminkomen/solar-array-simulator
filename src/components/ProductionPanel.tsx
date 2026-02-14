import { Group, RoundedRect, Text as SkiaText, matchFont } from "@shopify/react-native-skia";
import {
  useDerivedValue,
  type SharedValue,
} from "react-native-reanimated";
import { PANEL_WIDTH, PANEL_HEIGHT } from "@/utils/panelUtils";
import { BasePanelShape, type PanelColors } from "./BasePanelShape";

interface ProductionPanelProps {
  x: SharedValue<number>;
  y: SharedValue<number>;
  rotation?: SharedValue<0 | 90>;
  wattage: number;
  inverterId?: SharedValue<string | null>;
  colors: PanelColors;
}

export function ProductionPanel({ x, y, rotation, wattage, inverterId, colors }: ProductionPanelProps) {
  const font = matchFont({
    fontFamily: "System",
    fontSize: 11,
    fontWeight: "bold",
  });

  // Calculate center point in world coordinates (accounting for rotation)
  const textCenterX = useDerivedValue(() => {
    if (rotation && rotation.value === 90) {
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

  const text = `${wattage}W`;
  const textWidth = font ? font.measureText(text).width : 25;

  // Derived values for text positioning
  const textBackgroundX = useDerivedValue(() => textCenterX.value - (textWidth / 2 + 4));
  const textBackgroundY = useDerivedValue(() => textCenterY.value - 10);
  const textX = useDerivedValue(() => textCenterX.value - textWidth / 2);
  const textY = useDerivedValue(() => textCenterY.value + 3);

  return (
    <>
      <BasePanelShape x={x} y={y} rotation={rotation} inverterId={inverterId} colors={colors} />

      {/* Wattage text overlay (not rotated) */}
      {font && (
        <Group>
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
