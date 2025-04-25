import { streamText, smoothStream } from "ai";
import { SupportedModel, DEFAULT_MODEL, getModelInstance } from "./utils/aiModels";

// Allowed origins for API requests (reuse list from chat.ts)
const ALLOWED_ORIGINS = new Set([
  "https://os.ryo.lu",
  "http://localhost:3000",
]);

// --- Utility Functions ----------------------------------------------------

const isValidOrigin = (origin: string | null): boolean => {
  if (!origin) return false;
  return ALLOWED_ORIGINS.has(origin);
};

// --- Edge Runtime Config --------------------------------------------------

export const maxDuration = 80;
export const runtime = "edge";
export const edge = true;
export const stream = true;
export const config = { runtime: "edge" };

// --- Handler --------------------------------------------------------------

const IE_SYSTEM_PROMPT = `The user is in Internet Explorer asking to time travel with website context and a past or future a year, you are a web designer specialized in turning present websites into past and futuristic coherent versions in story and design.
Generate content for the URL path, the year, original site content, and use provided HTML as template if provided.

For future years (after current year):
- Redesign the website so it feels perfectly at home in the future context provided
- Think boldly and creatively about future outcomes
- Embrace the original brand, language, cultural context, aesthetics
- Consider design trends and breakthroughs that could happen by then

For past years:
- Redesign the website to match the historical era
- Consider how it would have been designed if it existed then
- What technology and design tools would have been available
- What typography, colors, and design elements were common
- What cultural and artistic movements influenced design

If you think the entity may disappear due to changes, show a 404 or memorial page.

DELIVERABLE REQUIREMENTS:
1. Return a single, fully self-contained HTML page with full content, no chat surrounding it.
2. MUST wrap the HTML in a fenced \`\`\`html code block. Do NOT output any prose before or after the code block.
3. Use inline TailwindCSS utility classes; do not include <style> tags.
4. Use Three.js for 3D with script already loaded when needed.
5. Include the generated page title inside an HTML comment at the very beginning: <!-- TITLE: Your Generated Page Title -->
6. Keep the layout responsive. Keep text in Proper Casing (not all lowercase). 中文必須使用繁體中文並保持完整標點符號。
7. For <img> tags, always try to reuse image URLs included in context or wikimedia. Do NOT link to imgur or unknown placeholders.
8. Map fonts: body -> font-geneva, headings -> font-neuebit font-bold, serif -> font-mondwest, monospace -> font-monaco.
9. Ensure hyperlinks/buttons use <a href="..."> with valid destinations.`;

export default async function handler(req: Request) {
  // CORS / Origin validation
  const origin = req.headers.get("origin");
  if (!isValidOrigin(origin)) {
    return new Response("Unauthorized", { status: 403 });
  }

  const validOrigin = origin as string;

  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": validOrigin,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const queryModel = url.searchParams.get("model") as SupportedModel | null;

    const { messages = [], model: bodyModel = DEFAULT_MODEL } = await req.json();

    const model = queryModel || bodyModel;

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid messages format", { status: 400 });
    }

    if (
      model !== null &&
      ![
        "gpt-4o",
        "gpt-4.1",
        "gpt-4.1-mini",
        "claude-3.5",
        "claude-3.7",
        "o3-mini",
        "gemini-2.5-pro-exp-03-25",
      ].includes(model)
    ) {
      return new Response(`Unsupported model: ${model}`, { status: 400 });
    }

    const selectedModel = getModelInstance(model as SupportedModel);

    // Prepend IE system prompt
    const enrichedMessages = [
      { role: "system", content: IE_SYSTEM_PROMPT },
      ...messages,
    ];

    const result = streamText({
      model: selectedModel,
      messages: enrichedMessages,
      // We assume prompt/messages already include necessary system/user details
      temperature: 0.7,
      maxTokens: 6000,
      experimental_transform: smoothStream(),
    });

    const response = result.toDataStreamResponse();

    const headers = new Headers(response.headers);
    headers.set("Access-Control-Allow-Origin", validOrigin);

    return new Response(response.body, {
      status: response.status,
      headers,
    });
  } catch (error) {
    console.error("IE Generate API error:", error);

    if (error instanceof SyntaxError) {
      return new Response(`Bad Request: Invalid JSON - ${error.message}`, {
        status: 400,
      });
    }

    return new Response("Internal Server Error", { status: 500 });
  }
} 