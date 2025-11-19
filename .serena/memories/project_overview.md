# プロジェクト概要

## プロジェクトの目的
Amazon Bedrock AgentCore ✖️ Mastra ✖️ x402でつくる次世代金融AI Agentのサンプル実装プロジェクト

## 主な特徴
- Amazon Bedrock AgentCoreによるAIエージェント機能
- Mastraフレームワークを使用したエージェント管理
- x402 MCP (Model Context Protocol) サーバーの実装
- x402に対応したコンテンツサーバーをFargateでデプロイ
- Next.js製のPWA対応フロントエンド

## プロジェクト構成
### モノレポ構成
pnpm workspacesを使用したモノレポ構造

### パッケージ構成
1. **frontend**: Next.js 15 + React 19 + TailwindCSS + PWA
   - Mastra AI Agentのフロントエンドインターフェース
   - Amazon Bedrock、Google AI統合
   - チャット機能（`/app/api/chat/route.ts`）

2. **cdk**: AWS CDKインフラストラクチャ
   - Amazon Bedrock AgentCoreの設定
   - Fargate ECSでx402バックエンドサーバーをデプロイ
   - Lambda Web Adaptorを使用したMCPサーバーのデプロイ
   
3. **mcp**: Model Context Protocol サーバー実装
   - x402統合用のMCPサーバー
   - Lambda向けにバンドルされた実装

4. **x402server**: x402対応のコンテンツサーバー
   - Honoフレームワークを使用
   - Dockerコンテナ化対応
   - x402プロトコル実装

## テックスタック
- **言語**: TypeScript
- **ランタイム**: Node.js 22.x、Bun
- **パッケージマネージャー**: pnpm (v10.7.0)
- **フレームワーク**:
  - Frontend: Next.js 15.3.1、React 19
  - Backend: Hono
  - Infrastructure: AWS CDK
- **AI/ML**: Amazon Bedrock、Google AI、Mastra Core
- **クラウド**: AWS (Lambda、ECS Fargate、ECR、VPC、ALB)
- **コード品質**: Biome（フォーマッター/リンター）
- **その他**: x402、MCP、PWA

## 開発環境
- OS: macOS (Darwin)
- Shell: zsh
- エンコーディング: UTF-8
