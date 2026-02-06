import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

const MAX_LONG_EDGE = 1568; // Claude auto-downscales beyond this
const JPEG_QUALITY = 0.8;

interface ResizedImage {
  base64: string;
  mimeType: "image/jpeg";
  width: number;
  height: number;
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
