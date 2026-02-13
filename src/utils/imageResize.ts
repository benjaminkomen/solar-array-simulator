import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

const MAX_LONG_EDGE = 1568; // Claude auto-downscales beyond this
const JPEG_QUALITY = 0.8;
const CROP_PADDING = 0.2; // 20% padding around detected panel for context

interface ResizedImage {
  base64: string;
  mimeType: "image/jpeg";
  width: number;
  height: number;
}

interface CropRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CroppedPanel {
  base64: string;
  mimeType: "image/jpeg";
  index: number;
}

/**
 * Resize an image so its longest edge is at most MAX_LONG_EDGE pixels,
 * compress to JPEG, and return as base64.
 *
 * This keeps uploads well under the 3.75MB Bedrock wire-size limit
 * and avoids Claude's automatic downscaling latency.
 */
export async function resizeForAnalysis(uri: string): Promise<ResizedImage> {
  // First, get the original dimensions by manipulating with no actions
  const original = await manipulateAsync(uri, [], {
    format: SaveFormat.JPEG,
  });

  const { width: origW, height: origH } = original;
  const longEdge = Math.max(origW, origH);

  // Only resize if the image exceeds the max
  const actions =
    longEdge > MAX_LONG_EDGE
      ? [
          {
            resize:
              origW >= origH
                ? { width: MAX_LONG_EDGE }
                : { height: MAX_LONG_EDGE },
          } as const,
        ]
      : [];

  const result = await manipulateAsync(uri, actions, {
    format: SaveFormat.JPEG,
    compress: JPEG_QUALITY,
    base64: true,
  });

  return {
    base64: result.base64!,
    mimeType: "image/jpeg",
    width: result.width,
    height: result.height,
  };
}

/**
 * Crop panel regions from the original (unresized) image for serial number
 * extraction. Each crop gets padding around the detected panel area so the
 * model has context to read labels/serial numbers at full resolution.
 *
 * @param uri          Original image URI (before resize)
 * @param panels       Panel regions detected in the *resized* image
 * @param resizedWidth Width of the resized image that was analyzed
 * @param resizedHeight Height of the resized image that was analyzed
 */
export async function cropPanelRegions(
  uri: string,
  panels: CropRegion[],
  resizedWidth: number,
  resizedHeight: number,
): Promise<CroppedPanel[]> {
  // Get original image dimensions
  const original = await manipulateAsync(uri, [], {
    format: SaveFormat.JPEG,
  });
  const { width: origW, height: origH } = original;

  // Scale factor from resized → original coordinates
  const scaleX = origW / resizedWidth;
  const scaleY = origH / resizedHeight;

  const crops: CroppedPanel[] = [];

  for (let i = 0; i < panels.length; i++) {
    const panel = panels[i];

    // Map panel coordinates back to original image space
    const rawX = panel.x * scaleX;
    const rawY = panel.y * scaleY;
    const rawW = panel.width * scaleX;
    const rawH = panel.height * scaleY;

    // Add padding for context (serial numbers may be near edges)
    const padX = rawW * CROP_PADDING;
    const padY = rawH * CROP_PADDING;

    // Clamp to image bounds
    const cropX = Math.max(0, Math.round(rawX - padX));
    const cropY = Math.max(0, Math.round(rawY - padY));
    const cropW = Math.min(
      Math.round(rawW + padX * 2),
      origW - cropX,
    );
    const cropH = Math.min(
      Math.round(rawH + padY * 2),
      origH - cropY,
    );

    const cropped = await manipulateAsync(
      uri,
      [{ crop: { originX: cropX, originY: cropY, width: cropW, height: cropH } }],
      { format: SaveFormat.JPEG, compress: 0.9, base64: true },
    );

    crops.push({
      base64: cropped.base64!,
      mimeType: "image/jpeg",
      index: i,
    });
  }

  return crops;
}
