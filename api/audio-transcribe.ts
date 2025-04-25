import OpenAI from "openai";

interface OpenAIError {
  status: number;
  message: string;
  error?: {
    message: string;
  };
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const config = {
  runtime: "edge",
};

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;

    if (!audioFile) {
      return new Response(JSON.stringify({ error: "No audio file provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify file type
    if (!audioFile.type.startsWith("audio/")) {
      return new Response(
        JSON.stringify({ error: "Invalid file type. Must be an audio file." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
      language: "en",
    });

    return new Response(JSON.stringify({ text: transcription.text }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error processing audio:", error);
    const openAIError = error as OpenAIError;
    return new Response(
      JSON.stringify({
        error: openAIError.message || "Error processing audio",
        details: openAIError.error?.message,
      }),
      {
        status: openAIError.status || 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
