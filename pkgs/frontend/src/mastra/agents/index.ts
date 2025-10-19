import { Agent } from "@mastra/core/agent";
import { bedrockModel } from "../models";
import { createx402MCPClient, testMCPConnection } from "../tools/x402";

/**
 * x402 Agent を作成する関数
 */
export const createx402Agent = async () => {
  try {
    console.log("Testing MCP connection...");
    const connectionTest = await testMCPConnection();

    if (!connectionTest.success) {
      throw new Error(`MCP connection failed: ${connectionTest.error}`);
    }

    console.log("Creating x402 MCP client...");
    const x402MCPClient = createx402MCPClient();

    console.log("Getting tools from MCP client...");
    const tools = await x402MCPClient.getTools();
    console.log("Available tools:", tools);

    console.log("Creating x402 Agent with tools...");
    return new Agent({
      name: "x402 Agent",
      instructions: `
        You are a helpful x402 assistant that provides accurate information.

        Your primary function is to help users get any information details for resource server.
        ex): get weather information from resource server

        Use the x402 tools to fetch any information from the resource server.
        
        When user asks for weather information, use the available tools to get data from the resource server.
      `,
      model: bedrockModel,
      tools: tools,
    });
  } catch (error) {
    console.error("Failed to create x402 Agent:", error);
    // Fallback: エージェントをツールなしで作成
    return new Agent({
      name: "x402 Agent (fallback)",
      instructions: `
        You are a helpful x402 assistant. 
        However, there was an issue connecting to the MCP tools.
        Please inform the user that the weather service is currently unavailable.
      `,
      model: bedrockModel,
      tools: {},
    });
  }
};

/**
 * x402 Agent (後方互換性のため)
 * @deprecated Use createx402Agent() instead
 */
export let x402Agent: Agent;
