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
│  └────────────────────────────────────────┘ │
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

Dockerイメージのタグづけとプッシュ

```bash
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# ECRログイン
aws ecr get-login-password --region ap-northeast-1 | \
  docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com

# タグ付け
docker tag agentcore-frontend:latest $AWS_ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com/agentcore-mastra-frontend:latest

# プッシュ
docker push $AWS_ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com/agentcore-mastra-frontend:latest
```

#### 1. MCPサーバーとx402バックエンドをデプロイ

```bash
# MCPをビルド（Lambda用）
pnpm mcp build

# CDKでデプロイ
pnpm cdk run deploy 'AgentCoreMastraX402Stack'
```

#### 2. Mastra AIエージェントをECR/AgentCore Runtimeにデプロイ

```bash
cd pkgs/mastra-agent

# Dockerイメージをビルド（ARM64）
docker buildx build --platform linux/arm64 \
  -t <account-id>.dkr.ecr.<region>.amazonaws.com/agentcore-mastra-agent:latest \
  --push .

# AgentCore Runtimeにデプロイ（CDKスタック更新）
```

#### 3. フロントエンドをECS Fargateにデプロイ

```bash
cd pkgs/frontend

# Dockerイメージをビルド
docker build -t <account-id>.dkr.ecr.<region>.amazonaws.com/agentcore-frontend:latest .
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/agentcore-frontend:latest

# CDKスタック更新
```

### AWSリソースを削除

```bash
pnpm cdk run destroy 'AgentCoreMastraX402Stack' --force
```

## 各パッケージの詳細

- **mastra-agent**: [README](./pkgs/mastra-agent/README.md)
- **mcp**: [README](./pkgs/mcp/README.md)
- **x402server**: [README](./pkgs/x402server/README.md)
- **frontend**: [README](./pkgs/frontend/README.md)
- **cdk**: [README](./pkgs/cdk/README.md)