import type { Agent } from "@mastra/core/agent";
import { createLogger } from "@mastra/core/logger";
import { Mastra } from "@mastra/core/mastra";

import { createx402Agent } from "./agents";

// グローバルなMastraインスタンス
let _mastra: Mastra | null = null;
let _x402Agent: Agent | null = null;
let _currentModelType: "bedrock" | "gemini" = "bedrock";

/**
 * Mastra用のインスタンスを取得（遅延初期化）
 * @param useGemini - trueの場合はGeminiモデルを使用
 */
export const getMastra = async (useGemini = false): Promise<Mastra> => {
  const requestedModelType = useGemini ? "gemini" : "bedrock";

  // モデルが変わる場合は再初期化
  if (_mastra && requestedModelType !== _currentModelType) {
    console.log("Model preference changed, reinitializing Mastra...");
    _mastra = null;
    _x402Agent = null;
  }

  if (_mastra) {
    return _mastra;
  }

  console.log("Initializing Mastra instance...");

  // x402Agentを非同期で作成
  _x402Agent = await createx402Agent(useGemini);
  _currentModelType = requestedModelType;

  _mastra = new Mastra({
    agents: { x402Agent: _x402Agent },
    logger: createLogger({
      name: "Mastra",
      level: "info",
    }),
  });

  console.log("Mastra instance created successfully");
  return _mastra;
};

/**
 * 後方互換性のためのエクスポート
 * @deprecated Use getMastra() instead
 */
export const mastra = {
  async getAgent(name: string, useGemini = false) {
    const instance = await getMastra(useGemini);
    return instance.getAgent(name);
  },
};
