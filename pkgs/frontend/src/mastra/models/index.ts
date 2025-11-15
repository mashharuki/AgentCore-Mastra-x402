import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { google } from "@ai-sdk/google";

// Gemini Model
export const gemini = google("gemini-2.0-flash");

// create Amazon Bedrock client
const bedrock = createAmazonBedrock({
  apiKey: process.env.AMAZON_BEDROCK_API_KEY || "",
  region: "ap-northeast-1",
});
// Use Claude 3.5 Sonnet v2 - stable and available in ap-northeast-1
export const bedrockModel = bedrock(
  "us.anthropic.claude-3-5-sonnet-20241022-v2:0",
);
