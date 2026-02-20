import { useWindowDimensions } from "react-native";
import {
  Canvas,
  Image as SkiaImage,
  Rect,
  useImage,
} from "@shopify/react-native-skia";

interface PanelResult {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: 0 | 90;
  label: string;
}

interface AnalysisPreviewProps {
  imageUri: string;
  imageWidth: number;
  imageHeight: number;
  panels: PanelResult[];
}

const MAX_HEIGHT = 200;
const HORIZONTAL_PADDING = 48;

export function AnalysisPreview({
  imageUri,
  imageWidth,
  imageHeight,
  panels,
}: AnalysisPreviewProps) {
  const { width: screenWidth } = useWindowDimensions();
  const image = useImage(imageUri);

  const maxWidth = screenWidth - HORIZONTAL_PADDING;
  const scaleX = maxWidth / imageWidth;
  const scaleY = MAX_HEIGHT / imageHeight;
  const scale = Math.min(scaleX, scaleY);

  const displayWidth = imageWidth * scale;
  const displayHeight = imageHeight * scale;

  // Use uniform (median) panel size so all boxes look consistent,
  // even when the AI returns inaccurate per-panel dimensions.
  const portraitWidths = panels
    .map((p) => (p.rotation === 90 ? p.height : p.width))
    .sort((a, b) => a - b);
  const portraitHeights = panels
    .map((p) => (p.rotation === 90 ? p.width : p.height))
    .sort((a, b) => a - b);
  const medianW =
    panels.length > 0 ? portraitWidths[Math.floor(portraitWidths.length / 2)] : 0;
  const medianH =
    panels.length > 0 ? portraitHeights[Math.floor(portraitHeights.length / 2)] : 0;

  return (
    <Canvas style={{ width: displayWidth, height: displayHeight, alignSelf: "center" }}>
      {image && (
        <SkiaImage
          image={image}
          x={0}
          y={0}
          width={displayWidth}
          height={displayHeight}
          fit="fill"
        />
      )}
      {panels.map((panel, index) => {
        // AI returns center point directly
        const cx = panel.x * scale;
        const cy = panel.y * scale;
        // Apply uniform size, swapping for rotated panels
        const w = (panel.rotation === 90 ? medianH : medianW) * scale;
        const h = (panel.rotation === 90 ? medianW : medianH) * scale;
        return (
          <Rect
            key={`${panel.x}-${panel.y}-${panel.label}`}
            x={cx - w / 2}
            y={cy - h / 2}
            width={w}
            height={h}
            color="red"
            style="stroke"
            strokeWidth={2}
          />
        );
      })}
    </Canvas>
  );
}
