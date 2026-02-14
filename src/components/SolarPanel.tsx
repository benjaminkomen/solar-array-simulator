import { RoundedRect } from "@shopify/react-native-skia";
import { type SharedValue } from "react-native-reanimated";
import { PANEL_WIDTH, PANEL_HEIGHT } from "@/utils/panelUtils";
import { BasePanelShape, type PanelColors } from "./BasePanelShape";

const BORDER_RADIUS = 8;
const SELECTION_STROKE_WIDTH = 3;

export type { PanelColors };

interface SolarPanelProps {
  x: SharedValue<number>;
  y: SharedValue<number>;
  rotation?: SharedValue<0 | 90>;
  isSelected?: boolean;
  inverterId?: SharedValue<string | null>;
  colors: PanelColors;
}

export function SolarPanel({ x, y, rotation, isSelected = false, inverterId, colors }: SolarPanelProps) {
  return (
    <BasePanelShape x={x} y={y} rotation={rotation} inverterId={inverterId} colors={colors}>
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
    </BasePanelShape>
  );
}
