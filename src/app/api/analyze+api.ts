import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { generateText } from "ai";
import { fetch as nativeFetch } from "undici";

// Create provider with native fetch (undici) instead of fetch-nodeshim
// fetch-nodeshim has a hardcoded 5s timeout that's too short for vision requests
const bedrock = createAmazonBedrock({
  fetch: nativeFetch as unknown as typeof globalThis.fetch,
});

interface AnalyzeRequest {
  image: string; // base64-encoded image
  mimeType: string; // e.g. "image/jpeg"
}

interface PanelResult {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: 0 | 90;
  label: string;
}

interface AnalyzeResponse {
  reasoning?: string;
  panels: PanelResult[];
}

const SYSTEM_PROMPT = `You are a solar panel array analyzer. You receive photos of solar panel installations and identify each individual panel.

Return a JSON object with this exact structure:
{
  "reasoning": "<brief explanation of what you see and any challenges>",
  "panels": [
    {
      "x": <number>,
      "y": <number>,
      "width": <number>,
      "height": <number>,
      "rotation": <0 or 90>,
      "label": "<string>"
    }
  ]
}

Rules:
- reasoning: Briefly describe what you see in the image and any challenges identifying panels or labels
- x, y: position of the panel's top-left corner in pixel coordinates relative to the image
- width, height: panel dimensions in pixels
- rotation: 0 for portrait (taller than wide), 90 for landscape (wider than tall)
- label: Look for serial numbers on micro-inverter labels attached to each panel. Serial numbers are typically alphanumeric codes like "G25309101383" (letter(s) followed by digits). If you see a label but can only read part of the serial number, include what you can read. Use "" only if no label or serial number is visible at all.
- Return ONLY valid JSON, no markdown fences, no explanation outside the JSON.`;

export async function POST(request: Request) {
  let startTime: number | undefined;

  try {
    const { image, mimeType } = (await request.json()) as AnalyzeRequest;

    if (!image || !mimeType) {
      return Response.json(
        { error: "Missing required fields: image, mimeType" },
        { status: 400 },
      );
    }

    // Log payload size for debugging
    const payloadSizeKB = Math.round(image.length / 1024);
    console.log(`[Bedrock] Starting request - payload: ${payloadSizeKB} KB`);
    startTime = Date.now();

    const { text } = await generateText({
      model: bedrock("us.anthropic.claude-sonnet-4-5-20250929-v1:0"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this solar panel array photo. Identify each solar panel visible in the image.",
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
      maxOutputTokens: 4096,
      temperature: 0.2,
      maxRetries: 1, // Don't retry on timeout - it wastes API calls
      timeout: 120_000, // 120 seconds total timeout
    });

    // Log timing and response
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`[Bedrock] Response received in ${elapsed}s`);
    console.log("[Bedrock] Raw response:", text);

    // Extract JSON from the response — the model may wrap it in markdown
    // fences or include explanatory text before/after the JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in model response:", text);
      return Response.json(
        { error: "Model did not return valid JSON" },
        { status: 502 },
      );
    }

    const result: AnalyzeResponse = JSON.parse(jsonMatch[0]);

    if (!result.panels || !Array.isArray(result.panels)) {
      return Response.json(
        { error: "Invalid response format from model" },
        { status: 502 },
      );
    }

    // Log reasoning for debugging
    if (result.reasoning) {
      console.log("[Bedrock] Reasoning:", result.reasoning);
    }
    console.log(`[Bedrock] Found ${result.panels.length} panels`);

    // Return raw panels - overlap resolution happens after coordinate transformation
    return Response.json({ panels: result.panels });
  } catch (error) {
    const elapsed = startTime
      ? ((Date.now() - startTime) / 1000).toFixed(1) + "s"
      : "N/A";
    console.error(`[Bedrock] Failed after ${elapsed}:`, error);
    return Response.json(
      { error: "Failed to analyze image" },
      { status: 500 },
    );
  }
}
