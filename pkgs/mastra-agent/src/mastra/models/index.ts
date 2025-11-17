import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { google } from "@ai-sdk/google";
import type { LanguageModelV2 } from "@ai-sdk/provider";

// Gemini Model
export const gemini: LanguageModelV2 = google("gemini-2.0-flash");

// create Amazon Bedrock client
const apiKey = process.env.AMAZON_BEDROCK_API_KEY;
if (!apiKey) {
  throw new Error(
    "AMAZON_BEDROCK_API_KEY environment variable is required but not set",
  );
}

const bedrock = createAmazonBedrock({
  apiKey,
  region: "ap-northeast-1",
});
// Use Claude 3.5 Sonnet v2 - stable and available in ap-northeast-1
export const bedrockModel: LanguageModelV2 = bedrock(
  "us.anthropic/claude-3-5-sonnet-v2",
);
