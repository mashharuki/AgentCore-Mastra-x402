import dotenv from "dotenv";
// Load environment variables from .env file
dotenv.config();

import { GetParameterCommand, SSMClient } from "@aws-sdk/client-ssm";
import express, { type Request, type Response } from "express";
import { createx402Agent } from "./mastra/agents";

const app = express();
const PORT = process.env.PORT || 8080;
const HOST = "0.0.0.0";

/**
 * Load configuration from SSM Parameter Store if running in AWS
 * Falls back to environment variables for local development
 */
async function loadConfigFromSSM(): Promise<void> {
  // Check if we're running in AWS (AWS_REGION is set in AWS environments)
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
  const isAws = !!region;

  console.log(`Environment check - AWS_REGION: ${region}, isAws: ${isAws}`);

  if (!isAws) {
    console.log("Not running in AWS - using environment variables");
    return;
  }

  const ssmClient = new SSMClient({ region });

  // Load MCP_SERVER_URL
  if (!process.env.MCP_SERVER_URL) {
    const mcpServerUrlParam = "/agentcore/mastra/mcp-server-url";
    try {
      console.log(
        `Loading MCP_SERVER_URL from SSM Parameter Store: ${mcpServerUrlParam}`,
      );

      const response = await ssmClient.send(
        new GetParameterCommand({
          Name: mcpServerUrlParam,
          WithDecryption: false,
        }),
      );

      const mcpServerUrl = response.Parameter?.Value;
      if (mcpServerUrl) {
        console.log(
          `✅ Successfully loaded MCP_SERVER_URL from SSM: ${mcpServerUrl}`,
        );
        process.env.MCP_SERVER_URL = mcpServerUrl;
      } else {
        console.warn("⚠️  MCP_SERVER_URL parameter returned empty value");
      }
    } catch (error) {
      console.error("Failed to load MCP_SERVER_URL from SSM:");
      console.error(
        `  Error: ${(error as Error).name} - ${(error as Error).message}`,
      );
      console.error(`  Parameter: ${mcpServerUrlParam}`);
      console.error(`  Region: ${region}`);
      console.error("  Falling back to environment variable");
    }
  }

  // Load GOOGLE_GENERATIVE_AI_API_KEY
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    const geminiApiKeyParam = "/agentcore/mastra/gemini-api-key";
    try {
      console.log(
        `Loading GOOGLE_GENERATIVE_AI_API_KEY from SSM Parameter Store: ${geminiApiKeyParam}`,
      );

      const response = await ssmClient.send(
        new GetParameterCommand({
          Name: geminiApiKeyParam,
          WithDecryption: true, // Decrypt SecureString
        }),
      );

      const apiKey = response.Parameter?.Value;
      if (apiKey) {
        console.log(
          "✅ Successfully loaded GOOGLE_GENERATIVE_AI_API_KEY from SSM",
        );
        process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;
      } else {
        console.warn(
          "⚠️  GOOGLE_GENERATIVE_AI_API_KEY parameter returned empty value",
        );
      }
    } catch (error) {
      console.error("Failed to load GOOGLE_GENERATIVE_AI_API_KEY from SSM:");
      console.error(
        `  Error: ${(error as Error).name} - ${(error as Error).message}`,
      );
      console.error(`  Parameter: ${geminiApiKeyParam}`);
      console.error(`  Region: ${region}`);

      if (
        (error as Error).name === "ParameterNotFound" ||
        (error as Error).message?.includes("ParameterNotFound")
      ) {
        console.error("  💡 To create this parameter, run:");
        console.error(
          `     aws ssm put-parameter --name ${geminiApiKeyParam} --value "YOUR_API_KEY" --type SecureString --region ${region}`,
        );
      }

      console.error("  Falling back to environment variable");
    }
  }

  // Final validation
  if (!process.env.MCP_SERVER_URL) {
    console.warn(
      "⚠️  WARNING: MCP_SERVER_URL is not set. Agent functionality will be limited.",
    );
  }

  if (
    !process.env.GOOGLE_GENERATIVE_AI_API_KEY &&
    process.env.USE_GEMINI === "true"
  ) {
    console.warn(
      "⚠️  WARNING: GOOGLE_GENERATIVE_AI_API_KEY is not set but USE_GEMINI=true. Gemini model will fail.",
    );
  }
}

// Log environment variables for debugging
console.log("Environment variables loaded:");
console.log("- PORT:", PORT);
console.log("- USE_GEMINI:", process.env.USE_GEMINI);
console.log(
  "- GOOGLE_GENERATIVE_AI_API_KEY:",
  process.env.GOOGLE_GENERATIVE_AI_API_KEY ? "set (hidden)" : "not set",
);
console.log("- RESOURCE_SERVER_URL:", process.env.RESOURCE_SERVER_URL);
console.log("- ENDPOINT_PATH:", process.env.ENDPOINT_PATH);
console.log("- AWS_REGION:", process.env.AWS_REGION);

// JSON parsing middleware with raw body support for AgentCore Runtime
app.use(express.json({ limit: "100mb" }));
// Also support raw body parsing for binary payloads from AgentCore Runtime
app.use(express.raw({ type: "application/octet-stream", limit: "100mb" }));
app.use(express.text({ type: "text/plain", limit: "100mb" }));

// Logging middleware
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Agent instance (lazy initialization)
let agentInstance: Awaited<ReturnType<typeof createx402Agent>> | null = null;
let agentInitError: Error | null = null;

/**
 * Initialize agent on startup
 */
async function initializeAgent() {
  try {
    console.log("Initializing x402 Agent...");
    const useGemini = process.env.USE_GEMINI === "true";
    agentInstance = await createx402Agent(useGemini);
    console.log(`Agent initialized with useGemini=${useGemini}`);
    console.log("Agent initialized successfully");
  } catch (error) {
    agentInitError = error as Error;
    console.error("Failed to initialize agent:", error);
  }
}

/**
 * Health check endpoint - Required by AgentCore Runtime
 * GET /ping
 *
 * Returns agent health status
 */
app.get("/ping", (_req: Request, res: Response) => {
  if (agentInstance) {
    res.status(200).json({
      status: "Healthy",
      time_of_last_update: Math.floor(Date.now() / 1000),
    });
  } else if (agentInitError) {
    res.status(503).json({
      status: "Unhealthy",
      error: agentInitError.message,
      time_of_last_update: Math.floor(Date.now() / 1000),
    });
  } else {
    res.status(503).json({
      status: "HealthyBusy",
      message: "Agent is initializing",
      time_of_last_update: Math.floor(Date.now() / 1000),
    });
  }
});

/**
 * Main invocation endpoint - Required by AgentCore Runtime
 * POST /invocations
 *
 * Processes user prompts through the AI agent
 */
app.post("/invocations", async (req: Request, res: Response) => {
  try {
    // Check if agent is initialized
    if (!agentInstance) {
      return res.status(503).json({
        error: "Agent not initialized",
        details: agentInitError?.message || "Agent is still initializing",
      });
    }

    // Log raw request for debugging
    console.log("Content-Type:", req.headers["content-type"]);
    console.log("Request body type:", typeof req.body);
    console.log(
      "Request body:",
      req.body instanceof Buffer
        ? `Buffer(${req.body.length} bytes)`
        : JSON.stringify(req.body, null, 2),
    );

    // Validate request body
    // AgentCore Runtime sends the payload as binary/JSON, so we need to handle both formats
    let prompt: string | undefined;
    let requestData: { prompt?: string; modelId?: string };

    // Handle Buffer (binary payload from AgentCore Runtime)
    if (req.body instanceof Buffer) {
      try {
        const textData = req.body.toString("utf-8");
        console.log("Decoded buffer:", textData);
        requestData = JSON.parse(textData);
      } catch (parseError) {
        // If JSON parsing fails, treat entire buffer as the prompt
        console.warn("Failed to parse buffer as JSON:", parseError);
        prompt = req.body.toString("utf-8");
        requestData = { prompt };
      }
    } else if (typeof req.body === "string") {
      // If body is a string, try to parse it
      try {
        requestData = JSON.parse(req.body);
      } catch {
        // If parsing fails, treat the entire body as the prompt
        prompt = req.body;
        requestData = { prompt };
      }
    } else if (typeof req.body === "object" && req.body !== null) {
      // Standard JSON object
      requestData = req.body;
    } else {
      return res.status(400).json({
        error: "Invalid request",
        details:
          "Request body must be a string, Buffer, or contain a 'prompt' string field",
        receivedBody: typeof req.body,
      });
    }

    // Extract prompt from requestData
    if (!prompt) {
      prompt = requestData.prompt || "";
    }

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        error: "Invalid request",
        details: "Request must contain a valid 'prompt' string field",
        receivedData: requestData,
      });
    }

    console.log(`Processing prompt: ${prompt.substring(0, 100)}...`);

    // Check if streaming is requested
    const acceptHeader = req.headers.accept || "";
    const isStreaming = acceptHeader.includes("text/event-stream");

    if (isStreaming) {
      // Streaming response (SSE)
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      try {
        const result = await agentInstance.generate(prompt);

        // Simulate streaming for now (proper streaming requires different approach)
        const text = result.text;
        const chunks = text.split(" ");

        for (const chunk of chunks) {
          res.write(`data: ${JSON.stringify({ chunk: `${chunk} ` })}\n\n`);
        }

        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
        res.end();
      } catch (streamError) {
        console.error("Streaming error:", streamError);
        res.write(
          `data: ${JSON.stringify({ error: "Streaming failed", details: (streamError as Error).message })}\n\n`,
        );
        res.end();
      }
    } else {
      // Non-streaming JSON response
      const result = await agentInstance.generate(prompt);

      res.status(200).json({
        response: result.text,
        status: "success",
        metadata: {
          model: "gemini-2.0-flash",
          tokens: result.usage?.totalTokens || 0,
        },
      });
    }
  } catch (error) {
    console.error("Invocation error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: (error as Error).message,
    });
  }
});

/**
 * Root endpoint for basic connectivity test
 */
app.get("/", (_req: Request, res: Response) => {
  res.json({
    service: "Mastra x402 Agent",
    version: "0.1.0",
    status: agentInstance ? "ready" : "initializing",
    endpoints: {
      ping: "GET /ping",
      invocations: "POST /invocations",
    },
  });
});

/**
 * 404 handler
 */
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    error: "Not found",
    message: "The requested endpoint does not exist",
  });
});

/**
 * Global error handler
 */
app.use(
  (
    err: Error,
    _req: Request,
    res: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next: express.NextFunction,
  ) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
      error: "Internal server error",
      details: err.message,
    });
  },
);

/**
 * Start server
 */
async function startServer() {
  // Load configuration from SSM if in AWS environment
  await loadConfigFromSSM();

  console.log("Configuration loaded:");
  console.log("- MCP_SERVER_URL:", process.env.MCP_SERVER_URL || "not set");
  console.log(
    "- GOOGLE_GENERATIVE_AI_API_KEY:",
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ? "set (hidden)" : "not set",
  );
  console.log("- USE_GEMINI:", process.env.USE_GEMINI);

  // Initialize agent before starting server
  await initializeAgent();

  app.listen(Number(PORT), HOST, () => {
    console.log(`🚀 Mastra Agent Server running on http://${HOST}:${PORT}`);
    console.log(`📍 Health check: http://${HOST}:${PORT}/ping`);
    console.log(`📍 Invocations: http://${HOST}:${PORT}/invocations`);
    console.log(
      `🤖 Agent status: ${agentInstance ? "Ready" : "Failed to initialize"}`,
    );
  });
}

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  process.exit(0);
});

// Start the server
startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
