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
      {panels.map((panel, index) => (
        <Rect
          key={index}
          x={panel.x * scale}
          y={panel.y * scale}
          width={panel.width * scale}
          height={panel.height * scale}
          color="red"
          style="stroke"
          strokeWidth={2}
        />
      ))}
    </Canvas>
  );
}
