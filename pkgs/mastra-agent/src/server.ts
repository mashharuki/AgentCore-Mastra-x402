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
 * Load MCP_SERVER_URL from SSM Parameter Store if running in AWS
 * Falls back to environment variable for local development
 */
async function loadMcpServerUrl(): Promise<string | undefined> {
  // Check if we're running in AWS (AWS_REGION is set in AWS environments)
  const isAws = !!process.env.AWS_REGION;

  if (isAws && !process.env.MCP_SERVER_URL) {
    try {
      console.log(
        "Running in AWS - attempting to load MCP_SERVER_URL from SSM Parameter Store",
      );
      const ssmClient = new SSMClient({ region: process.env.AWS_REGION });
      const command = new GetParameterCommand({
        Name: "/agentcore/mastra/mcp-server-url",
        WithDecryption: false,
      });
      const response = await ssmClient.send(command);
      const mcpServerUrl = response.Parameter?.Value;

      if (mcpServerUrl) {
        console.log("Successfully loaded MCP_SERVER_URL from SSM");
        process.env.MCP_SERVER_URL = mcpServerUrl;
        return mcpServerUrl;
      }
    } catch (error) {
      console.warn("Failed to load MCP_SERVER_URL from SSM:", error);
      console.warn("Falling back to environment variable");
    }
  }

  return process.env.MCP_SERVER_URL;
}

// Log environment variables for debugging
console.log("Environment variables loaded:");
console.log("- PORT:", PORT);
console.log("- USE_GEMINI:", process.env.USE_GEMINI);
console.log("- RESOURCE_SERVER_URL:", process.env.RESOURCE_SERVER_URL);
console.log("- ENDPOINT_PATH:", process.env.ENDPOINT_PATH);
console.log("- AWS_REGION:", process.env.AWS_REGION);

// JSON parsing middleware
app.use(express.json({ limit: "100mb" }));

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

    // Validate request body
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        error: "Invalid request",
        details: "Request body must contain a 'prompt' string field",
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
          res.write(`data: ${JSON.stringify({ chunk: chunk + " " })}\n\n`);
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
  // Load MCP_SERVER_URL from SSM if in AWS environment
  await loadMcpServerUrl();

  console.log("Configuration loaded:");
  console.log("- MCP_SERVER_URL:", process.env.MCP_SERVER_URL || "not set");

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
