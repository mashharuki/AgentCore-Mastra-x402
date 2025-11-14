# アーキテクチャとコードベース構造

## プロジェクト構造
```
AgentCore-Mastra-x402/
├── pkgs/
│   ├── frontend/       # Next.js PWAフロントエンド
│   ├── cdk/            # AWS CDKインフラコード
│   ├── mcp/            # MCPサーバー実装
│   └── x402server/     # x402コンテンツサーバー
├── package.json        # ルートパッケージ設定
├── pnpm-workspace.yaml # pnpm workspaces設定
├── biome.json          # Biome設定
├── AGENTS.md           # 開発ガイドライン
└── README.md           # プロジェクト説明
```

## フロントエンド (pkgs/frontend/)
### 構造
```
frontend/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── page.tsx         # トップページ
│   │   ├── layout.tsx       # ルートレイアウト
│   │   ├── actions.ts       # Server Actions
│   │   ├── api/
│   │   │   └── chat/        # チャットAPI
│   │   │       └── route.ts
│   │   └── components/
│   │       ├── Weather.tsx  # 天気コンポーネント
│   │       └── ui/          # UIコンポーネント
│   ├── mastra/              # Mastra設定
│   │   ├── index.ts         # Mastraインスタンス
│   │   ├── agents/          # AIエージェント定義
│   │   ├── models/          # AIモデル設定
│   │   └── tools/           # エージェントツール
│   │       ├── getWeather.ts
│   │       └── x402.ts
│   └── types/               # 型定義
└── public/                  # 静的ファイル
    ├── manifest.json        # PWA manifest
    ├── sw.js                # Service Worker
    └── icons/               # PWAアイコン
```

### 主要機能
- **Mastra統合**: `src/mastra/index.ts`でMastraインスタンスを遅延初期化
- **AIエージェント**: x402Agentなどのカスタムエージェント
- **チャットAPI**: `/api/chat/route.ts`でストリーミングチャット対応
- **PWA対応**: next-pwaによるプログレッシブウェブアプリ化

## CDK (pkgs/cdk/)
### 構造
```
cdk/
├── bin/
│   └── cdk.ts              # エントリーポイント
├── lib/
│   └── cdk-stack.ts        # スタック定義
└── test/
    └── cdk.test.ts         # Jestテスト
```

### デプロイリソース
1. **VPC**: 2つのAZ、1つのNATゲートウェイ
2. **ECS Fargate**: x402バックエンドサーバー
   - ECRから最新イメージをプル
   - ALB経由でアクセス
   - ヘルスチェック: `/health`
   - ログ: CloudWatch Logs（1週間保持）
3. **Lambda**: MCPサーバー
   - Lambda Web Adaptor使用
   - Node.js 22.x
   - ローカルバンドリング（esbuild）

## MCP サーバー (pkgs/mcp/)
### 構造
```
mcp/
├── src/
│   ├── index.ts            # MCPサーバーメイン
│   ├── lambda-server.ts    # Lambda用エントリーポイント
│   └── helpers.ts          # ヘルパー関数
├── bundle.js               # バンドル済みコード
├── esbuild.js              # esbuildビルド設定
└── run.sh                  # 実行スクリプト
```

### 特徴
- Model Context Protocolサーバー実装
- x402統合
- Lambda対応（serverless-express使用）
- esbuildでバンドル

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
- Honoフレームワーク使用
- x402プロトコル実装（x402-hono）
- Dockerコンテナ化対応
- ポート: 4021

## 技術スタック詳細
### AI/エージェント
- **Mastra Core**: エージェント管理フレームワーク
- **Amazon Bedrock**: AWS管理型基盤モデル
- **Google AI**: Google AIモデル統合
- **MCP**: Model Context Protocol

### インフラ
- **AWS CDK**: Infrastructure as Code
- **ECS Fargate**: サーバーレスコンテナ
- **Lambda**: サーバーレス関数
- **ALB**: アプリケーションロードバランサー
- **ECR**: コンテナレジストリ

### フロントエンド
- **Next.js 15**: React フレームワーク（App Router）
- **React 19**: UIライブラリ
- **TailwindCSS 4**: ユーティリティファーストCSS
- **PWA**: next-pwaによるPWA対応
- **Radix UI**: アクセシブルなUIコンポーネント

### バックエンド
- **Hono**: 高速軽量Webフレームワーク
- **x402**: コンテンツプロトコル実装

## 開発フロー
1. ローカル開発: `pnpm <package> dev`
2. コード品質チェック: `bun run biome:check`
3. ビルド: `pnpm <package> build`
4. テスト: `pnpm <package> test`
5. CDKデプロイ: `bun cdk run deploy 'AgentCoreMastraX402Stack'`
