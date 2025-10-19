"use server";

import { mastra } from "@/mastra";

/**
 * MCP接続をテストするメソッド
 */
export async function testMCPConnection() {
  try {
    const { testMCPConnection } = await import("@/mastra/tools/x402");
    const result = await testMCPConnection();
    return result;
  } catch (error) {
    console.error("Failed to test MCP connection:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * x402のMCPサーバーを呼び出すメソッド（改善版）
 * @param prompt
 * @returns
 */
export async function callx402Mcp(prompt: string) {
  const agent = await mastra.getAgent("x402Agent");

  try {
    console.log(`Calling agent with prompt: ${prompt}`);

    // generateメソッドを使用して完全な応答を取得
    const result = await agent.generate(`${prompt}`);
    console.log("Agent generate result:", JSON.stringify(result, null, 2));

    // Mastraエージェントの結果を詳細に分析
    let responseText = "";
    let stepsInfo: unknown[] = [];
    let lastStepType = "no-steps";

    // resultの型に応じて適切に処理
    if (typeof result === "string") {
      responseText = result;
    } else if (result && typeof result === "object") {
      // 'text'プロパティを確認
      if ("text" in result) {
        responseText = String(result.text || "");
      }

      // 'steps'プロパティを確認（Promiseの場合もあるため）
      if ("steps" in result) {
        const stepsValue = result.steps;

        // stepsがPromiseの場合は解決
        if (
          stepsValue &&
          typeof stepsValue === "object" &&
          "then" in stepsValue
        ) {
          try {
            console.log("Steps is a Promise, awaiting...");
            const awaitedSteps = await stepsValue;
            console.log("Awaited steps:", awaitedSteps);

            if (Array.isArray(awaitedSteps)) {
              stepsInfo = awaitedSteps;
              if (awaitedSteps.length > 0) {
                const lastStep = awaitedSteps[awaitedSteps.length - 1];
                if (
                  lastStep &&
                  typeof lastStep === "object" &&
                  "stepType" in lastStep
                ) {
                  lastStepType = String(lastStep.stepType);
                }
              }
            }
          } catch (stepError) {
            console.error("Error awaiting steps:", stepError);
          }
        } else if (Array.isArray(stepsValue)) {
          // 既に配列の場合
          stepsInfo = stepsValue;
          if (stepsValue.length > 0) {
            const lastStep = stepsValue[stepsValue.length - 1];
            if (
              lastStep &&
              typeof lastStep === "object" &&
              "stepType" in lastStep
            ) {
              lastStepType = String(lastStep.stepType);
            }
          }
        }
      }

      // 他のプロパティもログ出力してデバッグ
      console.log("Result properties:", Object.keys(result));
      for (const [key, value] of Object.entries(result)) {
        console.log(`${key}:`, typeof value, value);
      }
    }

    const finalResult = {
      text: responseText || "エージェントからの応答を取得できませんでした",
      steps: stepsInfo.length,
      lastStepType,
      rawResult: {
        hasSteps: stepsInfo.length > 0,
        stepsLength: stepsInfo.length,
        hasText: !!responseText,
        resultType: typeof result,
        allSteps: stepsInfo, // デバッグ用にすべてのステップ情報を含める
      },
    };

    console.log("Final result to return:", finalResult);
    return finalResult;
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
