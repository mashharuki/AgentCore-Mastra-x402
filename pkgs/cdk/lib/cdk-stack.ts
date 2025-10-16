import * as cdk from "aws-cdk-lib";
import type { Construct } from "constructs";

/**
 * Amazon Bedrock AgentCore ✖️ Mastra ✖️ x402 MCP サーバーリソース用のスタック
 *
 * デプロイするリソース
 * 1. Amazon Bedrock AgentCore
 * 2. Mastra製AI Agent
 * 3. x402 MCP サーバー
 * 4. x402 に対応したコンテンツサーバー
 */
export class CdkStack extends cdk.Stack {
  /**
   * コンストラクター
   * @param scope
   * @param id
   * @param props
   */
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
  }
}
