import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { LanguageModelV1 } from "ai";

// Supported model identifiers used across AI endpoints
export type SupportedModel =
  | "gpt-4o"
  | "gpt-4.1"
  | "gpt-4.1-mini"
  | "claude-3.5"
  | "claude-3.7"
  | "o3-mini"
  | "gemini-2.5-pro-exp-03-25"
  | null;

// Default model if none supplied
export const DEFAULT_MODEL: SupportedModel = "claude-3.7";

// Factory that returns a LanguageModelV1 instance for the requested model
export const getModelInstance = (model: SupportedModel): LanguageModelV1 => {
  const modelToUse: SupportedModel = model ?? DEFAULT_MODEL;

  switch (modelToUse) {
    case "gpt-4o":
      return openai("gpt-4o");
    case "gpt-4.1":
      return openai("gpt-4.1");
    case "gpt-4.1-mini":
      return openai("gpt-4.1-mini");
    case "o3-mini":
      return openai("o3-mini");
    case "gemini-2.5-pro-exp-03-25":
      return google("gemini-2.5-pro-exp-03-25");
    case "claude-3.7":
      return anthropic("claude-3-7-sonnet-20250219");
    case "claude-3.5":
      return anthropic("claude-3-5-sonnet-20241022");
    default:
      // Fallback – should never happen due to exhaustive switch
      return openai("gpt-4.1");
  }
}; 