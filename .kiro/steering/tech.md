---
inclusion: always
---

## 技術スタック

### 全体

- **パッケージマネージャー**: pnpm
- **ランタイム**: Node.js
- **フォーマッター**: biome
- **プロジェクト管理**: モノレポ構成

### フロントエンド

- **フレームワーク**: 
  - Next.js (App Router)
  - Mastra
- **言語**: 
  - TypeScript
- **スタイリング**:
  - TailwindCSS
  - Shadcn/ui
- **ライブラリ**：
  - Vercel AI SDK V4
  - x402-mcp
  - x402-fetch
  - x402-next
- **状態管理**: 
  - useState

### ブロックチェーン

- **baseSepolia**: Baseのテストネット
- **USDC**: x402で扱うステーブルコイン

### インフラ

- **AWS**
  - **リソース管理**: AWS CDK(TypeScript) 
    - x402のバックエンドサーバー
    - AgentCoreのリソース

## 開発ツール設定

### パッケージマネージャー

- **pnpm**: 高速で効率的なパッケージ管理
- `pnpm-workspace.yaml`: モノレポワークスペース設定

### フォーマッター・リンター

- **Biome**: 高速なフォーマッターとリンター
- `biome.json`: 設定ファイル

### Git 設定

- `.gitignore`: 必須除外項目
  - `**/node_modules`
  - `**/.DS_Store`