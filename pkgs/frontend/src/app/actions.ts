"use server";

import {
  BedrockAgentCoreClient,
  InvokeAgentRuntimeCommand,
} from "@aws-sdk/client-bedrock-agentcore";
import { randomBytes } from "node:crypto";

/**
 * AWS SDK を使用して AgentCore Runtime を呼び出す
 * @param prompt - ユーザーからのプロンプト
 * @param useGemini - Geminiモデルを使用するか (現在はAgentCore側で決定)
 * @returns AI応答データ
 */
export async function callx402Mcp(prompt: string, useGemini = false) {
  try {
    // 環境変数から AgentCore Runtime ARN を取得
    const agentRuntimeArn = process.env.AGENTCORE_RUNTIME_ARN;
    const region = process.env.AWS_REGION || "ap-northeast-1";

    if (!agentRuntimeArn) {
      console.error("AGENTCORE_RUNTIME_ARN is not set");
      return {
        text: "エラー: AgentCore Runtime ARNが設定されていません",
        error: "Configuration error",
      };
    }

    console.log(`Calling AgentCore Runtime: ${agentRuntimeArn}`);
    // Previous code lines...

    // Line 30 removed - no console.log for prompt

    // Subsequent code lines...
    console.log(
      `Use Gemini: ${useGemini} (note: model is configured on AgentCore side)`,
    );

    // BedrockAgentCore クライアントを初期化
    const client = new BedrockAgentCoreClient({
      region,
    });

    // プロンプトをバイナリ形式に変換
    const payload = new TextEncoder().encode(prompt);

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
      console.error("No response from AgentCore Runtime");
      return {
        text: "エラー: AgentCore Runtimeからレスポンスがありません",
        error: "No response",
      };
    }

    const textResponse = await response.response.transformToString();
    console.log("AgentCore Runtime raw response:", textResponse);

    // JSON形式でパース (Mastra AgentがJSON形式で返すと仮定)
    let result: {
      response?: string;
      metadata?: { model?: string; tokens?: number };
    };
    try {
      result = JSON.parse(textResponse);
    } catch (parseError) {
      // JSON形式でない場合はテキストとして扱う
      console.warn(
        "Failed to parse response as JSON, treating as plain text:",
        parseError,
      );
      result = { response: textResponse };
    }

    console.log("AgentCore Runtime parsed response:", result);

    // AgentCore Runtimeのレスポンス形式に合わせて処理
    // 期待される形式: { response: string, status: string, metadata: { model: string, tokens: number } }
    if (result.response) {
      return {
        text: result.response,
        steps: 0,
        lastStepType: "agentcore-response",
        rawResult: {
          hasSteps: false,
          stepsLength: 0,
          hasText: true,
        },
        metadata: result.metadata,
      };
    }

    // フォールバック
    return {
      text: typeof result === "string" ? result : JSON.stringify(result),
      steps: 0,
      lastStepType: "unknown",
      rawResult: {
        hasSteps: false,
        stepsLength: 0,
        hasText: true,
      },
    };
  } catch (error) {
    console.error("Error in callx402Mcp:", error);
    throw error;
  }
}
