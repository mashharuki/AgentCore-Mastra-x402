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
    // 環境変数から AgentCore Runtime ARN とqualifierを取得
    const agentRuntimeArn = process.env.AGENTCORE_RUNTIME_ARN;
    const qualifier = process.env.AGENTCORE_RUNTIME_QUALIFIER;
    const region = process.env.AWS_REGION || "ap-northeast-1";

    if (!agentRuntimeArn) {
      console.error("AGENTCORE_RUNTIME_ARN is not set");
      return {
        text: "エラー: AgentCore Runtime ARNが設定されていません",
        error: "Configuration error",
      };
    }

    console.log(`Calling AgentCore Runtime: ${agentRuntimeArn}`);
    console.log(`Qualifier: ${qualifier || "none"}`);
    console.log(
      `Use Gemini: ${useGemini} (note: model is configured on AgentCore side)`,
    );

    const runtimeArn = agentRuntimeArn;

    console.log("Runtime configuration:", {
      runtimeArn,
      qualifier,
      useQualifier: !!qualifier,
    });

    // BedrockAgentCore クライアントを初期化
    const client = new BedrockAgentCoreClient({
      region,
    });

    // プロンプトを直接バイナリに変換
    // AgentCore Runtimeはペイロードをそのままエージェントに転送する
    // エージェント側でJSON解析を行う
    const requestBody = JSON.stringify({
      prompt: prompt,
    });
    const payload = new TextEncoder().encode(requestBody);

    // 33文字以上のランダムなセッションIDを生成
    const runtimeSessionId = `session-${randomBytes(16).toString("hex")}`;

    console.log("Request details:", {
      runtimeArn,
      qualifier,
      runtimeSessionId,
      payloadSize: payload.length,
    });

    // InvokeAgentRuntimeCommand を実行
    // qualifierが設定されている場合のみ含める
    const commandParams: {
      runtimeSessionId: string;
      agentRuntimeArn: string;
      qualifier?: string;
      payload: Uint8Array;
    } = {
      runtimeSessionId,
      agentRuntimeArn: runtimeArn,
      payload,
    };

    if (qualifier) {
      commandParams.qualifier = qualifier;
    }

    const command = new InvokeAgentRuntimeCommand(commandParams);

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
    // エラーの詳細情報をログ出力
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }

    // エラーを構造化して返す（クライアントにもエラー情報を送る）
    return {
      text: `エラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
      error: error instanceof Error ? error.message : String(error),
      errorDetails:
        error instanceof Error
          ? {
              name: error.name,
              message: error.message,
              stack: error.stack,
            }
          : undefined,
    };
  }
}
