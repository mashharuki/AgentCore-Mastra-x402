import { randomBytes } from "node:crypto";
import {
  BedrockAgentCoreClient,
  InvokeAgentRuntimeCommand,
} from "@aws-sdk/client-bedrock-agentcore";
import { NextResponse } from "next/server";

/**
 * Chat API Route
 * AWS SDK を使用して AgentCore Runtime を呼び出す
 */
export async function POST(req: Request) {
  try {
    const { city } = await req.json();

    // 環境変数から AgentCore Runtime ARN を取得
    const agentRuntimeArn = process.env.AGENTCORE_RUNTIME_ARN;
    const region = process.env.AWS_REGION || "ap-northeast-1";

    if (!agentRuntimeArn) {
      console.error("AGENTCORE_RUNTIME_ARN is not set");
      return NextResponse.json(
        { error: "AgentCore Runtime ARN is not configured" },
        { status: 500 },
      );
    }

    console.log(`Calling AgentCore Runtime: ${agentRuntimeArn}`);
    console.log(`Query: What's the weather like in ${city}?`);

    // BedrockAgentCore クライアントを初期化
    const client = new BedrockAgentCoreClient({
      region,
    });

    // プロンプトをバイナリ形式に変換
    const inputText = `What's the weather like in ${city}?`;
    const payload = new TextEncoder().encode(inputText);

    // 33文字以上のランダムなセッションIDを生成
    const runtimeSessionId = `session-${randomBytes(16).toString("hex")}`;

    // InvokeAgentRuntimeCommand を実行
    const command = new InvokeAgentRuntimeCommand({
      runtimeSessionId,
      agentRuntimeArn,
      qualifier: "DEFAULT",
      payload,
    });

    console.log("Sending command to AgentCore Runtime...");
    const response = await client.send(command);

    // レスポンスをテキストに変換
    if (!response.response) {
      throw new Error("No response from AgentCore Runtime");
    }

    const textResponse = await response.response.transformToString();
    console.log("AgentCore Runtime response:", textResponse);

    // JSON形式でパース (Mastra AgentがJSON形式で返すと仮定)
    let result;
    try {
      result = JSON.parse(textResponse);
    } catch {
      // JSON形式でない場合はそのまま返す
      result = { response: textResponse };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error calling AgentCore Runtime:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
