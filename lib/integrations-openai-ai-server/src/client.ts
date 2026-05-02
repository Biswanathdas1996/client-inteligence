import OpenAI from "openai";

let _singleton: OpenAI | null = null;

function createClient(): OpenAI {
  const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
  if (!baseURL || !apiKey) {
    throw new Error(
      "AI_INTEGRATIONS_OPENAI_API_KEY and AI_INTEGRATIONS_OPENAI_BASE_URL must be set when not using PwC Gen AI (x-pwc-genai-key header).",
    );
  }
  return new OpenAI({ apiKey, baseURL });
}

/** Default OpenAI client; reads env on first use so the API process can boot when only PwC headers are used. */
export function getOpenai(): OpenAI {
  if (!_singleton) _singleton = createClient();
  return _singleton;
}
