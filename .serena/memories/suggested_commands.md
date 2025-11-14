# よく使うコマンド

## パッケージ管理
### インストール
```bash
bun install  # または pnpm install
```

### 各パッケージでのコマンド実行
```bash
pnpm cdk <command>        # CDKパッケージでコマンド実行
pnpm frontend <command>   # Frontendパッケージでコマンド実行
pnpm mcp <command>        # MCPパッケージでコマンド実行
pnpm x402server <command> # x402serverパッケージでコマンド実行
```

## コード品質
### フォーマット
```bash
bun run biome:format      # Biomeでフォーマット（書き込み）
```

### リント
```bash
bun run biome:check       # Biomeでリント・フォーマットチェック（書き込み）
```

## フロントエンド (Next.js)
### 開発サーバー起動
```bash
pnpm frontend dev         # 開発サーバー起動（Turbopack）
```

### ビルド・起動
```bash
pnpm frontend build       # プロダクションビルド
pnpm frontend start       # プロダクションサーバー起動
```

### リント
```bash
pnpm frontend lint        # Next.js ESLint実行
```

## AWS CDK
### デプロイ
```bash
bun cdk run deploy 'AgentCoreMastraX402Stack'
# または
pnpm cdk deploy
```

### 削除
```bash
bun cdk run destroy 'AgentCoreMastraX402Stack' --force
# または
pnpm cdk destroy
```

### その他CDKコマンド
```bash
pnpm cdk synth            # CloudFormationテンプレート生成
pnpm cdk diff             # スタックの差分確認
pnpm cdk build            # TypeScriptビルド
pnpm cdk watch            # ウォッチモード
pnpm cdk test             # Jestテスト実行
```

## MCP サーバー
### 開発
```bash
pnpm mcp dev              # 開発モードで起動
```

### ビルド
```bash
pnpm mcp build            # TypeScriptビルド + esbuildバンドル
```

### 起動
```bash
pnpm mcp start            # ビルド済みサーバー起動
pnpm mcp lambda           # Lambda用サーバー起動
```

### コード品質
```bash
pnpm mcp format           # Prettierでフォーマット
pnpm mcp format:check     # フォーマットチェック
pnpm mcp lint             # ESLint実行（修正）
pnpm mcp lint:check       # ESLintチェック
```

## x402 サーバー
### 開発
```bash
pnpm x402server dev       # 開発サーバー起動
```

### ビルド・起動
```bash
pnpm x402server build     # TypeScriptビルド
pnpm x402server start     # プロダクションサーバー起動
```

### Docker
```bash
pnpm x402server docker:build  # Dockerイメージビルド
pnpm x402server docker:run    # Dockerコンテナ起動
```

## macOS (Darwin) システムコマンド
```bash
ls -la                    # ファイル一覧表示
cd <directory>            # ディレクトリ移動
pwd                       # 現在のディレクトリ表示
grep -r "pattern" .       # 再帰的にパターン検索
find . -name "*.ts"       # ファイル検索
git status                # Git状態確認
git add .                 # 変更をステージング
git commit -m "message"   # コミット
git push                  # プッシュ
```
