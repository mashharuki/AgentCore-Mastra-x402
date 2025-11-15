# AgentCore-Mastra-x402
Amazon Bedrock AgentCore Mastra x402でつくる次世代金融AI Agentのサンプル実装です。

## アーキテクチャ

```
┌─────────────────────────────────────────────┐
│ Amazon Bedrock AgentCore Runtime (ARM64)    │
│  ┌────────────────────────────────────────┐ │
│  │  Mastra AI Agent (:8080)               │ │
│  │  - /ping (ヘルスチェック)              │ │
│  │  - /invocations (AI処理)               │ │
│  │  - SSM Parameter Storeから設定を取得   │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ AWS Systems Manager Parameter Store        │
│  - /agentcore/mastra/mcp-server-url        │
└─────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ AWS Lambda + Lambda Web Adapter             │
│  ┌────────────────────────────────────────┐ │
│  │  MCP Server                            │ │
│  │  - Model Context Protocol              │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ ECS Fargate                                 │
│  ┌────────────────────────────────────────┐ │
│  │  x402 Backend Server (:4021)           │ │
│  │  - コンテンツ配信                      │ │
│  │  - x402支払い処理                      │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│ ECS Fargate / App Runner                    │
│  ┌────────────────────────────────────────┐ │
│  │  Next.js Frontend (:3000)              │ │
│  │  - UI                                  │ │
│  │  - AgentCore Runtime APIクライアント   │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### 設定管理

#### Mastra Agent (AgentCore Runtime)

AWS Systems Manager Parameter Storeを使用して実行時の設定を取得:

- **パラメータ名**: `/agentcore/mastra/mcp-server-url`
- **値**: MCP Server Function URL (デプロイ時に自動設定)
- **用途**: AgentCore RuntimeコンテナがMCPサーバーと通信するためのURL

#### Frontend (Next.js)

AWS SDK for BedrockAgentCoreを使用してAgentCore Runtimeを呼び出し:

- **環境変数**: `AGENTCORE_RUNTIME_ARN`
- **形式**: `arn:aws:bedrock-agentcore:{region}:{account}:runtime/{runtime-id}/runtime-endpoint/DEFAULT`
- **用途**: フロントエンドがAgentCore RuntimeのInvokeAgentRuntimeCommand APIを呼び出すためのARN
- **認証**: ECS TaskロールのIAM権限を使用

## プロジェクト構成

```
pkgs/
├── mastra-agent/      # Mastra AIエージェント (AgentCore Runtime)
├── mcp/               # MCPサーバー (Lambda)
├── x402server/        # x402バックエンドサーバー (ECS Fargate)
├── frontend/          # Next.jsフロントエンド (ECS Fargate/App Runner)
└── cdk/               # AWS CDKインフラ定義
```

## 動かし方

### インストール

```bash
pnpm install
```

### ローカル開発

#### 1. x402サーバーの起動

```bash
pnpm x402server dev
```

#### 2. MCPのビルド

```bash
pnpm mcp build
```

#### 3. Mastra AIエージェントの起動

```bash
pnpm mastra-agent dev
```

#### 4. フロントエンドの起動

```bash
pnpm frontend dev
```

### AWSへのデプロイ

#### 事前準備(Mastra AgentのECRリポジトリ作成とコンテナイメージプッシュ)

ECRリポジトリの作成

```bash
aws ecr create-repository --repository-name agentcore-mastra-agent
```

Dockerイメージのビルド

```bash
docker build --platform linux/arm64 -t mastra-agent:latest .
```

Dockerイメージのタグづけとプッシュ

```bash
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# ECRログイン
aws ecr get-login-password --region ap-northeast-1 | \
  docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com

# タグ付け
docker tag mastra-agent:latest $AWS_ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com/agentcore-mastra-agent:latest

# プッシュ
docker push $AWS_ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com/agentcore-mastra-agent:latest
```

#### 事前準備(フロントエンド用のECRリポジトリ作成とコンテナイメージプッシュ)

ECRリポジトリの作成

```bash
aws ecr create-repository --repository-name agentcore-mastra-frontend
```

Dockerイメージのビルドとプッシュ

```bash
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# ECRログイン
aws ecr get-login-password --region ap-northeast-1 | \
  docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com

# linux/amd64プラットフォーム向けにビルド (Fargate x86_64用)
cd pkgs/frontend
docker buildx build --platform linux/amd64 \
  -t $AWS_ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com/agentcore-mastra-frontend:latest \
  --push .

cd ../..
```

#### 1. MCPサーバーとx402バックエンドをデプロイ

```bash
# MCPをビルド（Lambda用）
pnpm mcp build

# CDKでデプロイ
pnpm cdk run deploy 'AgentCoreMastraX402Stack'
```

# CDKスタック更新

### AWSリソースを削除

```bash
pnpm cdk run destroy 'AgentCoreMastraX402Stack' --force
```

### ECRにプッシュしたコンテナイメージは手動で削除が必要

- `x402-backend-api`
- `agentcore-mastra-frontend`
- `agentcore-mastra-agent`

## 各パッケージの詳細

- **mastra-agent**: [README](./pkgs/mastra-agent/README.md)
- **mcp**: [README](./pkgs/mcp/README.md)
- **x402server**: [README](./pkgs/x402server/README.md)
- **frontend**: [README](./pkgs/frontend/README.md)
- **cdk**: [README](./pkgs/cdk/README.md)