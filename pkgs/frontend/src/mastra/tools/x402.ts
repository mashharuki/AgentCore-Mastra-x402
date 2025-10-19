import { ConsoleLogger } from "@mastra/core/logger";
import { MCPClient } from "@mastra/mcp";

/**
 * Create MCP Client for x402 MCP Server
 * @returns MCPClient instance
 */
export const createx402MCPClient = () => {
  // create MCPClient instance
  // this mcp has 3 tools
  const mcpClient = new MCPClient({
    id: "x402-tools",
    servers: {
      x402: {
        // sse: true,
        url: new URL(`${process.env.MCP_SERVER_URL}/mcp`),
        // @ts-expect-error server is not a function
        log: new ConsoleLogger(),
      },
    },
    timeout: 60000, // Timeout: 60 seconds
  });

  return mcpClient;
};

/**
 * Method to get only tools
 */
export const getx402MCPCTools = async () => {
  const x402MCPClient = createx402MCPClient();
  return await x402MCPClient.getTools();
};

/**
 * MCP接続をテストするメソッド
 */
export const testMCPConnection = async () => {
  try {
    console.log("Testing MCP connection...");
    console.log("MCP_SERVER_URL:", process.env.MCP_SERVER_URL);

    const x402MCPClient = createx402MCPClient();
    const tools = await x402MCPClient.getTools();

    console.log("MCP connection successful!");
    console.log("Available tools:", Object.keys(tools));

    return {
      success: true,
      tools: Object.keys(tools),
      serverUrl: process.env.MCP_SERVER_URL,
    };
  } catch (error) {
    console.error("MCP connection failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      serverUrl: process.env.MCP_SERVER_URL,
    };
  }
};
