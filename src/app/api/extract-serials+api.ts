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

interface ExtractSerialsRequest {
  image: string; // base64-encoded full-res image
  mimeType: string;
  panelCount: number; // number of panels detected in pass 1
}

const SYSTEM_PROMPT = `You are a solar panel serial number reader. You receive a photo of a solar panel installation and extract all visible serial numbers, model numbers, or identifying text from the micro-inverters or panels.

Return a JSON object with this exact structure:
{
  "serials": ["<serial1>", "<serial2>", ...]
}

Rules:
- Look for serial numbers on micro-inverter stickers, panel labels, barcodes, or engraved plates.
- Serial numbers are typically 8-16 alphanumeric characters.
- Do NOT include wattage ratings, voltage specs, or brand names — only serial/model numbers.
- List each unique serial number found, in the order they appear (left-to-right, top-to-bottom).
- If no serial numbers are legible, return {"serials": []}.
- Return ONLY valid JSON, no markdown fences, no explanation.`;

export async function POST(request: Request) {
  try {
    const { image, mimeType, panelCount } =
      (await request.json()) as ExtractSerialsRequest;

    if (!image || !mimeType) {
      return Response.json(
        { error: "Missing required fields: image, mimeType" },
        { status: 400 },
      );
    }

    console.log(
      `[Bedrock] Starting serial extraction (${panelCount} panels detected)`,
    );
    const startTime = Date.now();

    const { text } = await generateText({
      model: bedrock("us.anthropic.claude-sonnet-4-5-20250929-v1:0"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `This solar panel array has ${panelCount} panels. Extract all visible serial numbers from the micro-inverters and panels in this image. Look carefully at stickers, labels, and barcodes.`,
            },
            {
              type: "image",
              image,
              mediaType: mimeType,
            },
          ],
        },
      ],
      system: SYSTEM_PROMPT,
      maxOutputTokens: 1024,
      temperature: 0.1,
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Bedrock] Serial extraction completed in ${elapsed}s`);
    console.log("[Bedrock] Raw serial response:", text);

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return Response.json({ serials: [] });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    const serials: string[] = Array.isArray(parsed.serials)
      ? parsed.serials.filter((s: unknown) => typeof s === "string" && s.length > 0)
      : [];

    console.log("[Bedrock] Extracted serials:", serials);
    return Response.json({ serials });
  } catch (error) {
    console.error("[Bedrock] Serial extraction error:", error);
    return Response.json(
      { error: "Failed to extract serial numbers" },
      { status: 500 },
    );
  }
}
