# よく使うコマンド

## パッケージ管理
### インストール
```bash
pnpm install  # または bun install (ルートで)
```

### 各パッケージでのコマンド実行
```bash
pnpm cdk <command>          # CDKパッケージでコマンド実行
pnpm frontend <command>     # Frontendパッケージでコマンド実行
pnpm mastra-agent <command> # Mastra Agentパッケージでコマンド実行
pnpm mcp <command>          # MCPパッケージでコマンド実行
pnpm x402server <command>   # x402serverパッケージでコマンド実行
```

## コード品質
### フォーマット
```bash
pnpm run biome:format      # Biomeでフォーマット（書き込み）
```

### リント
```bash
pnpm run biome:check       # Biomeでリント・フォーマットチェック（書き込み）
```

## Mastra Agent
### 開発サーバー起動
```bash
pnpm mastra-agent dev         # 開発サーバー起動（ホットリロード）
```

### ビルド・起動
```bash
pnpm mastra-agent build       # TypeScriptビルド
pnpm mastra-agent start       # プロダクションサーバー起動
```

### リント
```bash
pnpm mastra-agent lint        # ESLint実行
```

### Docker
```bash
# ARM64向けにビルド（M1/M2 Macの場合）
docker build --platform linux/arm64 -t mastra-agent:latest ./pkgs/mastra-agent

# ローカルでテスト
docker run -p 8080:8080 \
  --name mastra-agent-test \
  -e MCP_SERVER_URL=<your-mcp-server-url> \
  mastra-agent:latest

# ヘルスチェック
curl http://localhost:8080/ping

# AIエージェント呼び出し
curl -X POST http://localhost:8080/invocations \
  -H "Content-Type: application/json" \
  -d '{"prompt": "天気を教えて"}'
```

### ECRへのプッシュ
```bash
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# ECRリポジトリ作成
aws ecr create-repository --repository-name agentcore-mastra-agent

# ECRログイン
aws ecr get-login-password --region ap-northeast-1 | \
  docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com

# ビルド
docker build --platform linux/arm64 -t mastra-agent:latest ./pkgs/mastra-agent

# タグ付け
docker tag mastra-agent:latest $AWS_ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com/agentcore-mastra-agent:latest

# プッシュ
docker push $AWS_ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com/agentcore-mastra-agent:latest
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

### ECRへのプッシュ
```bash
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# ECRリポジトリ作成
aws ecr create-repository --repository-name agentcore-mastra-frontend

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

## AWS CDK
### デプロイ
```bash
# MCPをビルド（必須）
pnpm mcp build

# デプロイ
cd pkgs/cdk
pnpm cdk deploy
# または
pnpm cdk run deploy 'AgentCoreMastraX402Stack'
```

### 削除
```bash
cd pkgs/cdk
pnpm cdk destroy --force
# または
pnpm cdk run destroy 'AgentCoreMastraX402Stack' --force
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
pnpm mcp dev              # 開発モードで起動 (stdio)
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

# または直接
cd pkgs/x402server
docker build --platform linux/amd64 -t x402-backend-api .
docker run -p 4021:4021 --env-file .env x402-backend-api
```

### ECRへのプッシュ
```bash
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# ECRリポジトリ作成
aws ecr create-repository --repository-name x402-backend-api

# ECRログイン
aws ecr get-login-password --region ap-northeast-1 | \
  docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com

# ビルド
cd pkgs/x402server
docker build --platform linux/amd64 -t x402-backend-api .

# タグ付け
docker tag x402-backend-api:latest $AWS_ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com/x402-backend-api:latest

# プッシュ
docker push $AWS_ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com/x402-backend-api:latest
```

## SSMパラメータストア
### パラメータ設定
```bash
# MCP Server URL（デプロイ後に自動設定されるが、手動でも可能）
aws ssm put-parameter \
  --name /agentcore/mastra/mcp-server-url \
  --value "https://your-lambda-function-url.lambda-url.ap-northeast-1.on.aws/mcp" \
  --type String \
  --region ap-northeast-1

# Google Gemini API Key
aws ssm put-parameter \
  --name /agentcore/mastra/gemini-api-key \
  --value "YOUR_GOOGLE_API_KEY" \
  --type SecureString \
  --region ap-northeast-1
```

### パラメータ確認
```bash
# パラメータ一覧
aws ssm describe-parameters --region ap-northeast-1

# パラメータ値取得
aws ssm get-parameter --name /agentcore/mastra/mcp-server-url --region ap-northeast-1
aws ssm get-parameter --name /agentcore/mastra/gemini-api-key --with-decryption --region ap-northeast-1
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
git log --oneline -10     # コミット履歴表示
```

## AWS CLI
```bash
# アカウント確認
aws sts get-caller-identity

# リージョン設定
export AWS_DEFAULT_REGION=ap-northeast-1

# ECRログイン
aws ecr get-login-password --region ap-northeast-1 | \
  docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com
```

## VS Code MCP設定
`.vscode/mcp.json` を編集してローカルMCPサーバーを設定:
```json
{
  "servers": {
    "x402-mcp-server": {
      "command": "node",
      "args": ["${workspaceFolder}/pkgs/mcp/dist/index.js"],
      "envFile": "${workspaceFolder}/pkgs/mcp/.env"
    }
  }
}
```