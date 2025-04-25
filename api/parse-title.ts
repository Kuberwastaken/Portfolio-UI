import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from 'zod';

export const config = {
  runtime: "edge",
};

interface ParseTitleRequest {
  title: string;
}

// Define a Zod schema for the expected output structure
const ParsedTitleSchema = z.object({
  title: z.string().optional().nullable(),
  artist: z.string().optional().nullable(),
  album: z.string().optional().nullable(),
});


export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { title: rawTitle } = (await req.json()) as ParseTitleRequest;

    if (!rawTitle || typeof rawTitle !== "string") {
      return new Response(JSON.stringify({ error: "No title provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Use generateObject from the AI SDK
    const { object: parsedData } = await generateObject({
      model: openai("gpt-4.1-mini"),
      schema: ParsedTitleSchema, // Provide the Zod schema
      system: `You are an expert music metadata parser. Given a raw YouTube video title, extract the song title and artist. If possible, also extract the album name. Respond ONLY with a valid JSON object matching the provided schema. If you cannot determine a field, omit it or set it to null. Example input: "The Beatles - Hey Jude (Official Video)". Example output: {"title": "Hey Jude", "artist": "The Beatles"}. Example input: "Lofi Hip Hop Radio - Beats to Relax/Study to". Example output: {"title": "Lofi Hip Hop Radio - Beats to Relax/Study to", "artist": null}.`,
      prompt: rawTitle,
      temperature: 0.2,
    });

    // The AI SDK's generateObject handles parsing and validation against the schema
    // If it reaches here, parsedData conforms to ParsedTitleSchema

    // Return the parsed data, filling missing fields with the original title if needed
    const result = {
        title: parsedData.title || rawTitle, // Default to raw title if parsing fails for title
        artist: parsedData.artist || undefined, // Default to undefined if no artist found
        album: parsedData.album || undefined, // Default to undefined if no album found
    };


    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error parsing title:", error);

    // Simplified error handling for now, can be enhanced based on AI SDK specifics if needed
    let status = 500;
    let errorMessage = "Error parsing title";
    let errorDetails: string | undefined;

    if (error instanceof Error) {
        errorMessage = error.message;
        // Potentially check for specific AI SDK error types here
        // For example, if the SDK throws structured errors
    }

    // Attempt to get status code if available (might differ with AI SDK)
    // This part might need adjustment depending on how AI SDK surfaces errors
    if (typeof error === 'object' && error !== null && 'status' in error && typeof error.status === 'number') {
        status = error.status;
    }

    return new Response(
      JSON.stringify({
        error: errorMessage,
        details: errorDetails, // Details might be less structured now
      }),
      {
        status: status,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
} 