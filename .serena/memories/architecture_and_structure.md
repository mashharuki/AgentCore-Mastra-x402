# アーキテクチャとコードベース構造

## プロジェクト構造
```
AgentCore-Mastra-x402/
├── pkgs/
│   ├── mastra-agent/   # Mastra AIエージェント (AgentCore Runtime)
│   ├── frontend/       # Next.js PWAフロントエンド
│   ├── cdk/            # AWS CDKインフラコード
│   ├── mcp/            # MCPサーバー実装
│   └── x402server/     # x402コンテンツサーバー
├── docs/               # ドキュメント
│   ├── imgs/           # スクリーンショット
│   └── SSM_PARAMETER_TROUBLESHOOTING.md
├── .github/
│   └── workflows/
│       └── ci.yml      # CI/CDパイプライン
├── .vscode/
│   ├── mcp.json        # MCP設定
│   └── settings.json   # VS Code設定
├── package.json        # ルートパッケージ設定
├── pnpm-workspace.yaml # pnpm workspaces設定
├── biome.json          # Biome設定
├── AGENTS.md           # 開発ガイドライン
├── LICENSE
└── README.md           # プロジェクト説明
```

## Mastra Agent (pkgs/mastra-agent/)
### 構造
```
mastra-agent/
├── src/
│   ├── server.ts               # Expressサーバー (AgentCore Runtime対応)
│   └── mastra/
│       ├── index.ts            # Mastraインスタンス管理
│       ├── agents/
│       │   └── index.ts        # x402Agent定義
│       ├── models/
│       │   └── index.ts        # AIモデル設定 (Bedrock, Gemini)
│       └── tools/
│           ├── index.ts
│           └── x402.ts         # MCPクライアント設定
├── Dockerfile                  # ARM64対応Dockerイメージ
├── package.json
└── README.md
```

### 主要機能
- **AgentCore Runtime完全対応**: ポート8080、`/ping` (GET)、`/invocations` (POST)
- **SSM Parameter Store統合**: 環境変数を動的にロード
  - `MCP_SERVER_URL`: MCPサーバーのURL
  - `GOOGLE_GENERATIVE_AI_API_KEY`: Gemini APIキー
- **遅延初期化**: `getMastra()` でMastraインスタンスを遅延初期化
- **モデル切り替え**: Bedrock ⇄ Geminiのランタイム切り替え
- **MCP統合**: `createx402MCPClient()` でMCPクライアント作成
- **ヘルスチェック**: `/ping` エンドポイント
- **エージェント呼び出し**: `/invocations` エンドポイント (POST)

### 主要ファイル
- `server.ts`: Expressサーバー、SSM統合、エンドポイント定義
- `mastra/index.ts`: Mastraインスタンス管理、遅延初期化
- `mastra/agents/index.ts`: x402Agent作成、MCP統合
- `mastra/models/index.ts`: Amazon Bedrock、Google Geminiモデル設定
- `mastra/tools/x402.ts`: MCPクライアント作成、接続テスト

## フロントエンド (pkgs/frontend/)
### 構造
```
frontend/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── page.tsx         # トップページ
│   │   ├── layout.tsx       # ルートレイアウト
│   │   ├── globals.css      # グローバルCSS
│   │   ├── actions.ts       # Server Actions (AgentCore呼び出し)
│   │   ├── api/
│   │   │   └── health/
│   │   │       └── route.ts # ヘルスチェックAPI
│   │   ├── components/
│   │   │   ├── Weather.tsx  # 天気コンポーネント (メイン)
│   │   │   └── ui/          # UIコンポーネント (shadcn/ui)
│   │   │       └── button.tsx
│   │   └── lib/
│   │       └── utils.ts     # ユーティリティ関数
│   └── types/
│       └── next-pwa.d.ts    # PWA型定義
├── public/                  # 静的ファイル
│   ├── manifest.json        # PWA manifest
│   ├── sw.js                # Service Worker
│   ├── workbox-*.js         # Workbox
│   └── icons/               # PWAアイコン
├── Dockerfile               # コンテナイメージ定義
├── next.config.ts           # Next.js設定
├── postcss.config.mjs       # PostCSS設定
├── tailwind.config.ts       # TailwindCSS設定 (v4)
├── components.json          # shadcn/ui設定
└── package.json
```

### 主要機能
- **AgentCore Runtime呼び出し**: `@aws-sdk/client-bedrock-agentcore` の `InvokeAgentRuntimeCommand` 使用
- **Server Actions**: `actions.ts` の `callx402Mcp()` でAgentCore Runtimeを呼び出し
- **Weatherコンポーネント**: チャットインターフェース、モデル選択、ストリーミング対応
- **PWA対応**: next-pwaによるオフライン機能、アイコン、manifest
- **レスポンシブデザイン**: TailwindCSS + Radix UI
- **アニメーション**: tw-animate-css、カスタムアニメーション

### 主要ファイル
- `app/page.tsx`: トップページ、ヘッダー、フッター
- `app/actions.ts`: `callx402Mcp()` でAgentCore Runtime呼び出し
- `app/components/Weather.tsx`: チャット機能、モデル選択
- `app/api/health/route.ts`: ヘルスチェック

## CDK (pkgs/cdk/)
### 構造
```
cdk/
├── bin/
│   └── cdk.ts              # エントリーポイント
├── lib/
│   └── cdk-stack.ts        # スタック定義
├── build/                  # ビルド出力
│   ├── bin/
│   └── lib/
├── test/
│   └── cdk.test.ts         # Jestテスト
├── cdk.json                # CDK設定
├── cdk.context.json        # CDKコンテキスト
├── jest.config.js          # Jest設定
├── tsconfig.json           # TypeScript設定
└── package.json
```

### デプロイリソース
1. **VPC**: 2つのAZ、1つのNATゲートウェイ (`ec2.Vpc`)
2. **x402 Backend (ECS Fargate)**: x402バックエンドサーバー
   - ECR: `x402-backend-api` リポジトリ
   - Service: `ApplicationLoadBalancedFargateService`
   - ALB経由でアクセス
   - ヘルスチェック: `/health`
   - CloudWatch Logs: `/aws/ecs/x402-backend` (1週間保持)
   - 環境変数: `FACILITATOR_URL`, `ADDRESS`, `NETWORK`
3. **MCP Server (Lambda)**: MCPサーバー
   - Lambda Web Adaptor使用
   - Node.js 22.x、ARM64
   - ローカルバンドリング (esbuild)
   - Function URL でアクセス (`/mcp` パス)
   - 環境変数: `PRIVATE_KEY`, `RESOURCE_SERVER_URL`, `ENDPOINT_PATH`
4. **Amazon Bedrock AgentCore Runtime**: ⭐ 正式なCloudFormationリソース
   - `AWS::BedrockAgentCore::Runtime` (`CfnRuntime`)
   - `AWS::BedrockAgentCore::RuntimeEndpoint` (`CfnRuntimeEndpoint`)
   - ARM64 Dockerイメージ（ECR Assets経由）
   - IAMロール: `bedrock-agentcore.amazonaws.com`
   - 必要な権限: ECR、CloudWatch Logs、X-Ray、Bedrock、AgentCore Identity
   - 環境変数: ビルド時に `buildArgs` で注入
     - `MCP_SERVER_URL`, `RESOURCE_SERVER_URL`, `ENDPOINT_PATH`, `PRIVATE_KEY`
   - ネットワークモード: PUBLIC
   - プロトコル: HTTP
5. **Frontend (ECS Fargate)**: Next.js PWAフロントエンド
   - ECR: `agentcore-mastra-frontend` リポジトリ
   - Service: `ApplicationLoadBalancedFargateService`
   - ALB経由でアクセス
   - ヘルスチェック: `/api/health`
   - 環境変数: 
     - `AGENTCORE_RUNTIME_ARN`: AgentCore Runtime ARN
     - `AGENTCORE_RUNTIME_QUALIFIER`: DEFAULT
     - `AWS_REGION`: ap-northeast-1

### CloudFormation Outputs
- `AgentCoreMastraRuntimeArn`: AgentCore Runtime ARN
- `AgentCoreMastraRuntimeId`: AgentCore Runtime ID
- `AgentCoreMastraEndpointArn`: AgentCore Endpoint ARN
- `AgentCoreMastraX402BackendApiUrl`: x402 Backend URL
- `AgentCoreMastraX402MCPServerUrl`: MCP Server Function URL
- `AgentCoreMastraFrontendUrl`: Frontend URL
- `AgentCoreMastraX402VpcId`: VPC ID

## MCP サーバー (pkgs/mcp/)
### 構造
```
mcp/
├── src/
│   ├── index.ts            # MCPサーバーメイン (stdio)
│   ├── lambda-server.ts    # Lambda用エントリーポイント
│   └── helpers.ts          # ヘルパー関数
├── bundle.js               # バンドル済みコード (esbuild)
├── esbuild.js              # esbuildビルド設定
├── run.sh                  # Lambda Web Adaptor用実行スクリプト
└── package.json
```

### 特徴
- **Model Context Protocolサーバー実装**: `@modelcontextprotocol/sdk`
- **x402統合**: `x402-axios` + `withPaymentInterceptor`
- **Lambda対応**: `@vendia/serverless-express` + Lambda Web Adaptor
- **esbuildバンドル**: 単一ファイル (`bundle.js`) にバンドル
- **ツール定義**: `get-data-from-resource-server`
  - x402決済を経由してコンテンツサーバーにアクセス

### 主要ファイル
- `index.ts`: stdio MCPサーバー、ツール定義
- `lambda-server.ts`: Lambda + serverless-express
- `esbuild.js`: バンドル設定
- `run.sh`: Lambda Web Adaptor用起動スクリプト

## x402サーバー (pkgs/x402server/)
### 構造
```
x402server/
├── src/
│   └── index.ts            # Honoサーバー
├── Dockerfile              # コンテナイメージ定義
└── package.json
```

### 特徴
- **Honoフレームワーク使用**: 軽量・高速
- **x402プロトコル実装**: `x402-hono` の `paymentMiddleware`
- **Dockerコンテナ化対応**: amd64アーキテクチャ
- **エンドポイント**:
  - `/health`: ヘルスチェック
  - `/weather`: 決済が必要なコンテンツ
- **ポート**: 4021
- **環境変数**: `FACILITATOR_URL`, `ADDRESS`, `NETWORK`

## 技術スタック詳細

### AI/エージェント
- **Mastra Core**: エージェント管理フレームワーク (latest)
- **Mastra MCP**: MCP統合 (`@mastra/mcp`)
- **Amazon Bedrock**: AWS管理型基盤モデル (`@ai-sdk/amazon-bedrock`)
  - モデル: `us.anthropic/claude-3-5-sonnet-v2`
- **Google AI**: Google AIモデル統合 (`@ai-sdk/google`)
  - モデル: `gemini-2.0-flash`
- **MCP SDK**: Model Context Protocol (`@modelcontextprotocol/sdk`)

### インフラ
- **AWS CDK**: Infrastructure as Code (2.221.0+)
- **ECS Fargate**: サーバーレスコンテナ
- **Lambda**: サーバーレス関数 (Node.js 22.x、ARM64)
- **ALB**: アプリケーションロードバランサー
- **ECR**: コンテナレジストリ
- **VPC**: 仮想プライベートクラウド
- **CloudWatch Logs**: ログ管理
- **SSM Parameter Store**: パラメータ管理
- **BedrockAgentCore**: AgentCore Runtime

### フロントエンド
- **Next.js 15**: React フレームワーク（App Router、Turbopack）
- **React 19**: UIライブラリ
- **TailwindCSS 4**: ユーティリティファーストCSS
- **PWA**: next-pwaによるPWA対応
- **Radix UI**: アクセシブルなUIコンポーネント (`@radix-ui/react-slot`)
- **shadcn/ui**: UIコンポーネントライブラリ
- **lucide-react**: アイコンライブラリ

### バックエンド
- **Hono**: 高速軽量Webフレームワーク (`@hono/node-server`)
- **Express**: Node.js Webフレームワーク (Mastra Agent用)
- **x402**: コンテンツプロトコル実装 (x402、x402-axios、x402-hono)

### その他
- **viem**: Ethereum開発ライブラリ
- **axios**: HTTPクライアント
- **dotenv**: 環境変数管理
- **zod**: スキーマ検証

## 開発フロー
1. **ローカル開発**: 
   - x402server: `pnpm x402server dev`
   - MCP: `pnpm mcp build` → `pnpm mcp dev`
   - Mastra Agent: `pnpm mastra-agent dev`
   - Frontend: `pnpm frontend dev`
2. **コード品質チェック**: `pnpm run biome:check`
3. **ビルド**: 
   - `pnpm cdk build`
   - `pnpm frontend build`
   - `pnpm mastra-agent build`
   - `pnpm mcp build`
   - `pnpm x402server build`
4. **テスト**: `pnpm cdk test`
5. **CDKデプロイ**: 
   - `pnpm mcp build` (必須)
   - `cd pkgs/cdk && pnpm cdk deploy`

## デプロイ前の準備
1. **ECRリポジトリ作成**: `x402-backend-api`, `agentcore-mastra-frontend`, `agentcore-mastra-agent`
2. **Dockerイメージビルド＆プッシュ**: 各サービスのDockerイメージをECRにプッシュ
3. **SSMパラメータ設定** (デプロイ後):
   - `/agentcore/mastra/mcp-server-url`: MCP Server Function URL
   - `/agentcore/mastra/gemini-api-key`: Google Generative AI API Key