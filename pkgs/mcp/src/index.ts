import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import axios from "axios";
import { config } from "dotenv";
import { createSigner, withPaymentInterceptor } from "x402-axios";

config();

const privateKey = process.env.PRIVATE_KEY as string;
const network = process.env.NETWORK as string;
const baseURL = process.env.RESOURCE_SERVER_URL as string; // e.g. https://example.com
const endpointPath = process.env.ENDPOINT_PATH as string; // e.g. /weather

if (!privateKey || !network || !baseURL || !endpointPath) {
  throw new Error(
    "Missing environment variables: PRIVATE_KEY, NETWORK, RESOURCE_SERVER_URL, ENDPOINT_PATH are required",
  );
}

// x402-axios@0.7.x: createSigner returns a Promise, initialize lazily
let paymentClient: ReturnType<typeof axios.create> | null = null;

/**
 * 支払い決済クライアントを取得する。
 * 初回呼び出し時にサインインを行い、以降は同じクライアントを返す。
 * @returns 支払い決済クライアント
 */
async function getPaymentClient(): Promise<ReturnType<typeof axios.create>> {
  if (!paymentClient) {
    const signer = await createSigner(network, privateKey);
    const newClient = withPaymentInterceptor(axios.create({ baseURL }), signer);
    paymentClient = newClient;
    return newClient;
  }
  return paymentClient;
}

// Create an MCP server
const server = new McpServer({
  name: "x402 MCP Client",
  version: "1.0.0",
});

// Add get-weather tool
server.tool(
  "get-data-from-resource-server",
  "Get data from the resource server (in this example, the weather)",
  async () => {
    // 環境変数で渡されたエンドポイントを指定してAPIを実行する
    // ここでx402の支払い処理が自動的に行われる
    const client = await getPaymentClient();
    const res = await client.get(endpointPath);
    return {
      content: [{ type: "text", text: JSON.stringify(res.data) }],
    };
  },
);

const transport = new StdioServerTransport();

(async () => {
  try {
    await server.connect(transport);
  } catch (error) {
    console.error("Failed to connect server:", error);
    process.exit(1);
  }
})();
