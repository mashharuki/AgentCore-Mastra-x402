import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { google } from "@ai-sdk/google";
import type { LanguageModelV2 } from "@ai-sdk/provider";

// Gemini Model
export const gemini: LanguageModelV2 = google("gemini-2.0-flash");

// Create Amazon Bedrock client
// When running in AWS (ECS, Lambda, etc.), IAM role credentials are used automatically
// For local development, you can optionally provide an API key via AMAZON_BEDROCK_API_KEY
const apiKey = process.env.AMAZON_BEDROCK_API_KEY;
const region = process.env.AWS_REGION || "ap-northeast-1";

console.log(
  `Initializing Bedrock client - Region: ${region}, API Key: ${apiKey ? "set" : "not set (using IAM role)"}`,
);

const bedrock = createAmazonBedrock({
  // Only provide apiKey if explicitly set (for local dev)
  // In AWS, IAM role credentials will be used automatically
  ...(apiKey && { apiKey }),
  region,
});

// Use Claude 3.5 Sonnet v2 - stable and available in ap-northeast-1
export const bedrockModel: LanguageModelV2 = bedrock(
  "us.anthropic/claude-3-5-sonnet-v2",
);
