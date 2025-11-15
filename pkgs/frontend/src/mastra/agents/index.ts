import { Agent } from "@mastra/core/agent";
import { bedrockModel, gemini } from "../models";
import { createx402MCPClient, testMCPConnection } from "../tools/x402";

/**
 * x402 Agent を作成する関数
 * @param useGemini - trueの場合はGeminiモデルを使用（デフォルト: false）
 */
export const createx402Agent = async (useGemini = false) => {
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
    const selectedModel = useGemini ? gemini : bedrockModel;
    console.log(`Using model: ${useGemini ? "Gemini" : "Amazon Nova Lite"}`);

    return new Agent({
      name: "x402 Agent",
      instructions: `
        You are a helpful assistant that retrieves information from a resource server using available tools.

        IMPORTANT INSTRUCTIONS:
        1. When a user asks for weather information or any data from the resource server, you MUST use the "get-data-from-resource-server" tool.
        2. Always call the tool first before providing any response.
        3. After receiving the tool's response, format it in a user-friendly way in Japanese.
        4. The tool returns data in JSON format with properties like "weather" and "temperature".
        5. Convert temperature from Fahrenheit to Celsius if needed (°C = (°F - 32) × 5/9).

        Example flow:
        User: "天気を教えて"
        You: [Call get-data-from-resource-server tool]
        Tool returns: {"weather": "sunny", "temperature": 70}
        You respond: "現在の天気情報をお知らせします:\n\n- 天気: 晴れ ☀️\n- 気温: 70°F (約21°C)\n\n良い天気ですね！"

        Never provide made-up information. Always use the tool to get real data.
      `,
      model: selectedModel,
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
