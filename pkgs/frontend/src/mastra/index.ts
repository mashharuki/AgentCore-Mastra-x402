import type { Agent } from "@mastra/core/agent";
import { createLogger } from "@mastra/core/logger";
import { Mastra } from "@mastra/core/mastra";

import { createx402Agent } from "./agents";

// グローバルなMastraインスタンス
let _mastra: Mastra | null = null;
let _x402Agent: Agent | null = null;

/**
 * Mastra用のインスタンスを取得（遅延初期化）
 */
export const getMastra = async (): Promise<Mastra> => {
  if (_mastra) {
    return _mastra;
  }

  console.log("Initializing Mastra instance...");

  // x402Agentを非同期で作成
  _x402Agent = await createx402Agent();

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
  async getAgent(name: string) {
    const instance = await getMastra();
    return instance.getAgent(name);
  },
};
