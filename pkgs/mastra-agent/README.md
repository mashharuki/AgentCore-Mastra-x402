# Mastra AI Agent for Amazon Bedrock AgentCore Runtime

Amazon Bedrock AgentCore Runtimeで動作するMastra製AIエージェント

## 概要

このパッケージは、Amazon Bedrock AgentCore Runtimeの要件を完全に満たすAIエージェントサーバーです。

### 主な特徴

✅ **AgentCore Runtime完全対応**
- ポート8080でリッスン
- `/ping` (GET) - ヘルスチェックエンドポイント
- `/invocations` (POST) - メインのAIエージェント呼び出し
- ARM64アーキテクチャ
- 0.0.0.0ホストバインディング

✅ **Mastra統合**
- Mastra CoreによるAIエージェント実装
- MCPクライアントサポート
- 複数モデル対応（Amazon Bedrock, Google Gemini）

✅ **本番環境最適化**
- マルチステージDockerビルド
- 非rootユーザー実行
- 適切なシグナルハンドリング
- ヘルスチェック統合

## ローカル開発

### 依存関係のインストール

```bash
cd pkgs/mastra-agent
pnpm install
```

### 開発サーバーの起動

```bash
# .env ファイルを作成
cp .env.example .env

# 開発モードで起動（ホットリロード有効）
pnpm dev
```

### 環境変数

```bash
# 必須
PORT=8080
MCP_SERVER_URL=<MCP server URL>

# オプション
USE_GEMINI=false  # trueでGeminiモデルを使用
GOOGLE_GENERATIVE_AI_API_KEY=<Gemini APIキー>
AWS_REGION=us-east-1
```

## Dockerビルドとテスト

### ローカルでのビルド

```bash
# ARM64向けにビルド（M1/M2 Macの場合）
docker build --platform linux/arm64 -t mastra-agent:latest .

# x86_64でビルドしてエミュレート（Intel Macの場合）
docker buildx build --platform linux/arm64 -t mastra-agent:latest .
```

### ローカルでのテスト

```bash
# コンテナを起動
docker run -p 8080:8080 \
  --name mastra-agent-test \
  -e MCP_SERVER_URL=<your-mcp-server-url> \
  mastra-agent:latest

# ヘルスチェック
curl http://localhost:8080/ping

# AIエージェントを呼び出し
curl -X POST http://localhost:8080/invocations \
  -H "Content-Type: application/json" \
  -d '{"prompt": "天気を教えて"}'

# ストリーミングレスポンス
curl -X POST http://localhost:8080/invocations \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{"prompt": "天気を教えて"}'
```

## AWS ECRへのデプロイ

### ECRリポジトリの作成

```bash
aws ecr create-repository \
  --repository-name agentcore-mastra-agent \
  --region ap-northeast-1
```

### イメージのプッシュ

```bash
# ECRにログイン
aws ecr get-login-password --region ap-northeast-1 | \
  docker login --username AWS --password-stdin \
  <account-id>.dkr.ecr.ap-northeast-1.amazonaws.com

# ARM64向けにビルド
docker buildx build --platform linux/arm64 \
  -t <account-id>.dkr.ecr.ap-northeast-1.amazonaws.com/agentcore-mastra-agent:latest \
  --push .
```

## AgentCore Runtimeへのデプロイ

CDKスタックで以下を設定:

```typescript
// AgentCore Runtime用のECRリポジトリ参照
const agentRepo = ecr.Repository.fromRepositoryName(
  this,
  "MastraAgentRepo",
  "agentcore-mastra-agent"
);

// AgentCore Runtimeにデプロイ（詳細はCDKスタック参照）
```

## エンドポイント仕様

### GET /ping

ヘルスチェックエンドポイント

**レスポンス:**
```json
{
  "status": "Healthy",
  "time_of_last_update": 1731650000
}
```

ステータス値:
- `Healthy` - 正常動作中
- `HealthyBusy` - 動作中だがビジー状態
- `Unhealthy` - 異常状態

### POST /invocations

AIエージェント呼び出しエンドポイント

**リクエスト:**
```json
{
  "prompt": "天気を教えて"
}
```

**レスポンス (JSON):**
```json
{
  "response": "現在の天気情報をお知らせします...",
  "status": "success",
  "metadata": {
    "model": "amazon.nova-lite-v1:0",
    "tokens": 150
  }
}
```

**レスポンス (SSE - ストリーミング):**
```
data: {"chunk": "現在の"}
data: {"chunk": "天気情報"}
data: {"done": true}
```

## アーキテクチャ

```
┌─────────────────────────────────────────────┐
│   Amazon Bedrock AgentCore Runtime          │
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │   Mastra Agent Container (ARM64)      │  │
│  │                                       │  │
│  │   ┌─────────────┐   ┌─────────────┐  │  │
│  │   │  Express    │   │   Mastra    │  │  │
│  │   │  Server     │───│   Agent     │  │  │
│  │   │  :8080      │   │             │  │  │
│  │   └─────────────┘   └─────────────┘  │  │
│  │         │                    │        │  │
│  │    /ping  /invocations      MCP      │  │
│  │                              Client   │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │   MCP Server (Lambda) │
        └───────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  x402 Content Server  │
        └───────────────────────┘
```

## トラブルシューティング

### エージェントが起動しない

```bash
# ログを確認
docker logs mastra-agent-test

# MCP接続をテスト
curl $MCP_SERVER_URL
```

### ヘルスチェックが失敗する

```bash
# コンテナ内部で確認
docker exec -it mastra-agent-test sh
curl http://localhost:8080/ping
```

### ARM64ビルドの問題

```bash
# Docker Buildxを確認
docker buildx ls

# 必要に応じてbuilderを作成
docker buildx create --use --name arm64-builder
```

## 参考リンク

- [Amazon Bedrock AgentCore Runtime Documentation](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/agents-tools-runtime.html)
- [HTTP Protocol Contract](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-http-protocol-contract.html)
- [Mastra Documentation](https://mastra.ai)
