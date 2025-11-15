"use server";

/**
 * AgentCore Runtime の /invocations エンドポイントを呼び出す
 * @param prompt - ユーザーからのプロンプト
 * @param useGemini - Geminiモデルを使用するか (現在はAgentCore側で決定)
 * @returns AI応答データ
 */
export async function callx402Mcp(prompt: string, useGemini = false) {
  try {
    // AgentCore Runtime のエンドポイント
    const agentCoreUrl = process.env.AGENTCORE_RUNTIME_URL;

    if (!agentCoreUrl) {
      console.error("AGENTCORE_RUNTIME_URL is not set");
      return {
        text: "エラー: AgentCore Runtime URLが設定されていません",
        error: "Configuration error",
      };
    }

    console.log(`Calling AgentCore Runtime: ${agentCoreUrl}/invocations`);
    console.log(`Prompt: ${prompt}`);
    console.log(
      `Use Gemini: ${useGemini} (note: model is configured on AgentCore side)`,
    );

    // AgentCore Runtime の /invocations エンドポイントを呼び出し
    const response = await fetch(`${agentCoreUrl}/invocations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: prompt,
      }),
      // タイムアウト設定（30秒）
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      console.error(
        `AgentCore Runtime returned error: ${response.status} ${response.statusText}`,
      );
      const errorText = await response.text();
      console.error("Error details:", errorText);
      return {
        text: `エラー: AgentCore Runtimeからエラーが返されました (${response.status})`,
        error: errorText,
      };
    }

    const result = await response.json();
    console.log("AgentCore Runtime response:", result);

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
    return {
      text: `エラーが発生しました: ${error instanceof Error ? error.message : "Unknown error"}`,
      steps: 0,
      lastStepType: "error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
