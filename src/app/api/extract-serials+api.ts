import {
  RekognitionClient,
  DetectTextCommand,
  type TextDetection,
} from "@aws-sdk/client-rekognition";

const rekognition = new RekognitionClient({
  region: process.env.AWS_REGION ?? "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface ExtractSerialsRequest {
  image: string; // base64-encoded full-res image
  mimeType: string;
}

/**
 * Filters Rekognition text detections to find likely serial numbers.
 * Serial numbers are typically 8-16 alphanumeric characters,
 * often starting with a letter followed by digits (e.g. "G25309101383").
 */
function extractSerialNumbers(detections: TextDetection[]): string[] {
  const serials: string[] = [];
  const seen = new Set<string>();

  for (const detection of detections) {
    // Only use LINE-level detections to avoid duplicate fragments from WORD-level
    if (detection.Type !== "LINE") continue;
    if (!detection.DetectedText) continue;
    if ((detection.Confidence ?? 0) < 70) continue;

    const text = detection.DetectedText.trim();

    // Serial number patterns:
    // - 8-16 alphanumeric characters (e.g. "G25309101383")
    // - May contain hyphens or dots (e.g. "SN-12345678", "AP.1234.5678")
    // - Skip pure numbers under 8 digits (likely wattage/voltage specs)
    // - Skip common non-serial labels
    const cleaned = text.replace(/[\s-_.]/g, "");

    // Must be at least 8 chars alphanumeric
    if (cleaned.length < 8 || cleaned.length > 20) continue;
    if (!/^[A-Za-z0-9]+$/.test(cleaned)) continue;

    // Skip common non-serial patterns (wattage, voltage, etc.)
    if (/^\d{1,4}[wW]$/.test(text)) continue; // e.g. "400W"
    if (/^\d{1,3}[vV]$/.test(text)) continue; // e.g. "240V"

    // Prefer entries with at least one letter (pure digit strings of 8+ are less likely serials)
    const hasLetter = /[A-Za-z]/.test(cleaned);
    const isLongEnoughDigits = /^\d{10,}$/.test(cleaned); // 10+ digit barcodes could be serials

    if (!hasLetter && !isLongEnoughDigits) continue;

    if (!seen.has(cleaned)) {
      seen.add(cleaned);
      serials.push(text);
    }
  }

  return serials;
}

export async function POST(request: Request) {
  try {
    const { image, mimeType } =
      (await request.json()) as ExtractSerialsRequest;

    if (!image || !mimeType) {
      return Response.json(
        { error: "Missing required fields: image, mimeType" },
        { status: 400 },
      );
    }

    const imageBytes = Buffer.from(image, "base64");
    const imageSizeKB = Math.round(imageBytes.length / 1024);
    console.log(
      `[Rekognition] Starting serial extraction - image: ${imageSizeKB} KB`,
    );
    const startTime = Date.now();

    const command = new DetectTextCommand({
      Image: { Bytes: imageBytes },
    });

    const response = await rekognition.send(command);
    const detections = response.TextDetections ?? [];

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(
      `[Rekognition] DetectText completed in ${elapsed}s - ${detections.length} text regions found`,
    );

    // Log all detected text for debugging
    for (const d of detections) {
      if (d.Type === "LINE") {
        console.log(
          `[Rekognition]   LINE: "${d.DetectedText}" (${d.Confidence?.toFixed(1)}%)`,
        );
      }
    }

    const serials = extractSerialNumbers(detections);
    console.log("[Rekognition] Extracted serials:", serials);

    return Response.json({ serials });
  } catch (error) {
    console.error("[Rekognition] Serial extraction error:", error);
    return Response.json(
      { error: "Failed to extract serial numbers" },
      { status: 500 },
    );
  }
}
