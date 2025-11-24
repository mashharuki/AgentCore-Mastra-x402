# プロジェクト概要

## プロジェクトの目的
Amazon Bedrock AgentCore ✖️ Mastra ✖️ x402でつくる次世代金融AI Agentのサンプル実装プロジェクト

このプロジェクトは、Amazon Bedrock AgentCore、Mastra AIエージェントフレームワーク、x402決済プロトコルを統合して、AIエージェントがステーブルコイン決済を通じてコンテンツにアクセスする仕組みを実現します。

## 主な特徴
- **Amazon Bedrock AgentCore Runtime**: 正式なCloudFormationリソース (`AWS::BedrockAgentCore::Runtime`) を使用したエージェント実行環境
- **Mastraフレームワーク**: AIエージェントの管理と実行を担当
- **x402プロトコル**: Model Context Protocol (MCP) サーバーによるステーブルコイン決済連携
- **マルチモデル対応**: Amazon Bedrock (Claude 3.5 Sonnet v2)、Google Gemini (gemini-2.0-flash) の切り替え可能
- **Next.js製PWA**: プログレッシブウェブアプリ対応のフロントエンド
- **完全なAWSインフラ**: CDKによるIaC実装

## プロジェクト構成
### モノレポ構成
pnpm workspacesを使用したモノレポ構造

### パッケージ構成
1. **mastra-agent** (`pkgs/mastra-agent/`): Amazon Bedrock AgentCore Runtime用エージェント
   - Mastra CoreによるAIエージェント実装
   - MCPクライアントサポート
   - 複数モデル対応（Amazon Bedrock, Google Gemini）
   - ARM64アーキテクチャ
   - ポート8080、エンドポイント: `/ping`, `/invocations`
   - ECS Fargate or AgentCore Runtimeでデプロイ

2. **frontend** (`pkgs/frontend/`): Next.js 15 + React 19 + TailwindCSS + PWA
   - AWS SDK for BedrockAgentCoreを使用してAgentCore Runtimeを直接呼び出し
   - `InvokeAgentRuntimeCommand` APIによるエージェント呼び出し
   - Weatherコンポーネントによるチャットインターフェース
   - モデル選択機能（Bedrock / Gemini）
   - ECS Fargateでデプロイ

3. **cdk** (`pkgs/cdk/`): AWS CDKインフラストラクチャ
   - **Amazon Bedrock AgentCore Runtime** のデプロイ (`CfnRuntime`, `CfnRuntimeEndpoint`)
   - Fargate ECSでx402バックエンドサーバーをデプロイ
   - Lambda Web Adaptorを使用したMCPサーバーのデプロイ (Function URL)
   - VPC、ALB、ECR、CloudWatch Logs等の設定
   
4. **mcp** (`pkgs/mcp/`): Model Context Protocol サーバー実装
   - x402統合用のMCPサーバー
   - Lambda向けにesbuildでバンドル
   - ツール: `get-data-from-resource-server`
   - Lambda + Lambda Web Adaptor構成

5. **x402server** (`pkgs/x402server/`): x402対応のコンテンツサーバー
   - Honoフレームワークを使用
   - Dockerコンテナ化対応
   - x402プロトコル実装 (x402-hono)
   - エンドポイント: `/weather`, `/health`
   - ECS Fargateでデプロイ

## テックスタック
- **言語**: TypeScript
- **ランタイム**: Node.js 22.x
- **パッケージマネージャー**: pnpm (v10.7.0)
- **フレームワーク**:
  - Frontend: Next.js 15.3.1、React 19
  - Agent Runtime: Express 4.x
  - Backend: Hono 4.x
  - Infrastructure: AWS CDK 2.221.0+
- **AI/ML**: 
  - Amazon Bedrock (`@ai-sdk/amazon-bedrock`) - Claude 3.5 Sonnet v2 (`us.anthropic/claude-3-5-sonnet-v2`)
  - Google AI (`@ai-sdk/google`) - Gemini 2.0 Flash (`gemini-2.0-flash`)
  - Mastra Core (latest)
  - Mastra MCP (`@mastra/mcp`)
- **クラウド**: AWS (Lambda、ECS Fargate、ECR、VPC、ALB、BedrockAgentCore、SSM Parameter Store)
- **コード品質**: Biome（フォーマッター/リンター）
- **その他**: x402、x402-axios、x402-hono、MCP SDK、PWA (next-pwa)

## アーキテクチャフロー
```
Frontend (Next.js on ECS Fargate)
    ↓ AWS SDK (InvokeAgentRuntimeCommand)
    ↓ AGENTCORE_RUNTIME_ARN
Amazon Bedrock AgentCore Runtime ⭐
    ↓ MCP_SERVER_URL (ビルド時に注入)
MCP Server (Lambda + Function URL)
    ↓ x402-axios (ステーブルコイン決済)
    ↓ RESOURCE_SERVER_URL
x402 Backend (ECS Fargate)
    ↓ x402-hono (決済ミドルウェア)
    └ コンテンツ配信 (/weather)
```

## 設定管理

### Mastra Agent (AgentCore Runtime)
AWS Systems Manager Parameter Storeを使用:
- **パラメータ名**: `/agentcore/mastra/mcp-server-url`
  - **値**: MCP Server Function URL (デプロイ時に自動設定)
  - **用途**: AgentCore RuntimeコンテナがMCPサーバーと通信
- **パラメータ名**: `/agentcore/mastra/gemini-api-key`
  - **値**: Google Generative AI API Key (手動設定が必要)
  - **用途**: Geminiモデルを使用する際の認証

### Frontend (Next.js)
環境変数:
- **AGENTCORE_RUNTIME_ARN**: AgentCore Runtime ARN
- **AGENTCORE_RUNTIME_QUALIFIER**: エンドポイント名 (DEFAULT)
- **AWS_REGION**: リージョン (ap-northeast-1)

## 開発環境
- OS: macOS (Darwin)
- Shell: zsh
- エンコーディング: UTF-8
- Node.js: v22.0.0以上
- pnpm: v10.7.0

## 最新の変更 (2025年11月24日時点)
- AgentCore RuntimeにデプロイしたMastra製AI Agentをローカルのフロントエンドから呼び出し成功
- CDKスタックの環境変数設定を追加
- ドキュメントを更新
- コードフォーマッターを適用
- main ブランチに最新コミット (0d5ae12)

## CI/CDパイプライン
GitHub Actionsを使用:
- **実行タイミング**: プルリクエスト、main/develop/update_cdk_stackブランチへのpush
- **実行内容**:
  - Biomeフォーマット・リントチェック
  - TypeScript型チェック (全パッケージ)
  - ビルドテスト
  - ユニットテスト (CDK)
  - Dockerイメージビルドテスト
  - セキュリティ監査