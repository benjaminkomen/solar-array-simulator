import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { generateText } from "ai";

const bedrock = createAmazonBedrock({
  fetch: async (input, init) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60_000);

    try {
      return await fetch(input, {
        ...init,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  },
});

interface CropInput {
  base64: string;
  mimeType: string;
  index: number;
}

interface ExtractSerialsRequest {
  crops: CropInput[];
}

interface SerialResult {
  index: number;
  serial: string;
}

const SYSTEM_PROMPT = `You are a solar panel serial number reader. You receive cropped close-up images of individual solar panels and extract any visible serial numbers, model numbers, or identifying text.

Return a JSON object with this exact structure:
{
  "serial": "<string>"
}

Rules:
- Extract the most prominent serial number, model number, or barcode text visible on the panel or its label.
- Serial numbers are typically 8-16 alphanumeric characters, often on stickers or engraved plates.
- If multiple numbers are visible, prefer the one that looks like a serial number (not wattage ratings or voltage specs).
- Return "" if no serial number is legible.
- Return ONLY valid JSON, no markdown fences, no explanation.`;

export async function POST(request: Request) {
  try {
    const { crops } = (await request.json()) as ExtractSerialsRequest;

    if (!crops || !Array.isArray(crops) || crops.length === 0) {
      return Response.json(
        { error: "Missing required field: crops (non-empty array)" },
        { status: 400 },
      );
    }

    console.log(
      `[Bedrock] Starting serial extraction for ${crops.length} panel crops`,
    );
    const startTime = Date.now();

    // Process crops in parallel (each is a separate Claude call)
    const results: SerialResult[] = await Promise.all(
      crops.map(async (crop) => {
        try {
          const { text } = await generateText({
            model: bedrock("us.anthropic.claude-sonnet-4-5-20250929-v1:0"),
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Extract the serial number from this solar panel close-up image. Look for stickers, labels, engravings, or barcodes with serial/model numbers.",
                  },
                  {
                    type: "image",
                    image: crop.base64,
                    mediaType: crop.mimeType,
                  },
                ],
              },
            ],
            system: SYSTEM_PROMPT,
            maxOutputTokens: 256,
            temperature: 0.1,
          });

          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            return { index: crop.index, serial: "" };
          }

          const parsed = JSON.parse(jsonMatch[0]);
          return { index: crop.index, serial: parsed.serial ?? "" };
        } catch (err) {
          console.error(
            `[Bedrock] Serial extraction failed for crop ${crop.index}:`,
            err,
          );
          return { index: crop.index, serial: "" };
        }
      }),
    );

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Bedrock] Serial extraction completed in ${elapsed}s`);
    console.log(
      "[Bedrock] Serial results:",
      results.map((r) => `panel ${r.index}: "${r.serial}"`).join(", "),
    );

    return Response.json({ results });
  } catch (error) {
    console.error("[Bedrock] Serial extraction error:", error);
    return Response.json(
      { error: "Failed to extract serial numbers" },
      { status: 500 },
    );
  }
}
