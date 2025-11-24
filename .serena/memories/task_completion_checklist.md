# タスク完了時のチェックリスト

## コード品質チェック
### 1. フォーマット
```bash
pnpm run biome:format
```
- Biomeで自動フォーマット
- コードスタイルの統一
- 変更があればコミット前に実行

### 2. リント
```bash
pnpm run biome:check
```
- Biomeでリント実行
- 問題があれば修正
- すべてのパッケージが対象

### 3. 個別パッケージリント
```bash
# Mastra Agent
pnpm mastra-agent lint

# Next.jsフロントエンド
pnpm frontend lint

# MCPサーバー
pnpm mcp lint

# x402サーバー
pnpm x402server lint
```

## テスト実行
### CDKテスト（インフラ変更時）
```bash
pnpm cdk test
```
- Jestテストを実行
- インフラコードの変更時は必須

## ビルド確認
### Mastra Agent
```bash
pnpm mastra-agent build
```
- TypeScriptコンパイルエラーがないか確認
- ビルド出力 (`dist/`) を確認

### フロントエンド
```bash
pnpm frontend build
```
- Next.jsビルドエラーがないか確認
- 型エラーがないか確認
- 本番用ビルドが成功するか確認

### CDK
```bash
pnpm cdk build
```
- TypeScriptコンパイルエラーがないか確認
- `build/` ディレクトリを確認

### MCP
```bash
pnpm mcp build
```
- TypeScriptビルドが成功するか確認
- esbuildバンドルが成功するか確認
- `bundle.js` が生成されているか確認（CDKデプロイ前に必須）

### x402サーバー
```bash
pnpm x402server build
```
- TypeScriptビルドが成功するか確認

## デプロイ前チェック（本番環境）

### 1. 差分確認
```bash
cd pkgs/cdk
pnpm cdk diff
```
- CloudFormationの差分を確認
- 意図しない変更がないか確認
- AgentCore Runtimeリソースの変更を確認
- 削除されるリソースがないか確認

### 2. 環境変数確認
- `.env`ファイルが正しく設定されているか
- 秘密情報がハードコードされていないか
- 必要な環境変数がすべて設定されているか:
  - **x402server**: `FACILITATOR_URL`, `ADDRESS`, `NETWORK`
  - **MCP**: `PRIVATE_KEY`, `RESOURCE_SERVER_URL`, `ENDPOINT_PATH`
  - **Mastra Agent**: `MCP_SERVER_URL` (ビルド時に注入)
  - **Frontend**: `AGENTCORE_RUNTIME_ARN`, `AGENTCORE_RUNTIME_QUALIFIER`, `AWS_REGION`

### 3. Docker イメージ確認

#### Mastra Agent (AgentCore Runtime用)
```bash
cd pkgs/mastra-agent
docker build --platform linux/arm64 -t test-agentcore-runtime .
```
- ARM64ビルドが成功するか確認
- ビルド引数（ARG）が正しく設定されているか確認
- ヘルスチェックが動作するか確認

#### Frontend
```bash
cd pkgs/frontend
docker buildx build --platform linux/amd64 -t test-frontend .
```
- amd64ビルドが成功するか確認

#### x402server
```bash
cd pkgs/x402server
docker build --platform linux/amd64 -t test-x402server .
```
- ビルドが成功するか確認

### 4. ECRイメージプッシュ確認
```bash
# ECRログイン
aws ecr get-login-password --region ap-northeast-1 | \
  docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com

# 各イメージがプッシュされているか確認
aws ecr describe-images --repository-name agentcore-mastra-agent
aws ecr describe-images --repository-name agentcore-mastra-frontend
aws ecr describe-images --repository-name x402-backend-api
```

### 5. MCPビルド確認（CDKデプロイ前に必須）
```bash
cd pkgs/mcp
pnpm build

# bundle.jsが生成されているか確認
ls -lh bundle.js
```
- **重要**: CDKデプロイ前に必ず実行
- `bundle.js` が存在しない場合、CDKデプロイが失敗する

### 6. セキュリティチェック
- APIキー・パスワードが環境変数管理されているか
- 不要な依存関係がないか
- 脆弱性がないか（pnpm audit）
  ```bash
  pnpm audit
  ```
- IAMロールの権限が最小限か確認
- SSM Parameter Storeでセキュアな値が管理されているか

### 7. CDK合成確認
```bash
cd pkgs/cdk
pnpm cdk synth
```
- CloudFormationテンプレートが正しく生成されるか
- `AWS::BedrockAgentCore::Runtime` リソースが含まれているか確認
- `AWS::BedrockAgentCore::RuntimeEndpoint` リソースが含まれているか確認
- OutputsにARNが含まれているか確認

### 8. SSMパラメータ確認（デプロイ後）
```bash
# MCP Server URL
aws ssm get-parameter --name /agentcore/mastra/mcp-server-url --region ap-northeast-1

# Google Gemini API Key
aws ssm get-parameter --name /agentcore/mastra/gemini-api-key --with-decryption --region ap-northeast-1
```
- パラメータが正しく設定されているか確認
- Gemini APIキーが設定されていない場合は設定:
  ```bash
  aws ssm put-parameter \
    --name /agentcore/mastra/gemini-api-key \
    --value "YOUR_GOOGLE_API_KEY" \
    --type SecureString \
    --region ap-northeast-1
  ```

## Git操作
### 1. 変更確認
```bash
git status
git diff
```
- 意図しない変更がないか確認
- 不要なファイルが含まれていないか確認

### 2. コミット
```bash
git add .
git commit -m "feat: 機能の説明"
```
- **コンベンショナルコミット形式を使用**:
  - `feat:` 新機能
  - `fix:` バグ修正
  - `docs:` ドキュメント
  - `test:` テスト
  - `refactor:` リファクタリング
  - `chore:` その他
- 明確で説明的なメッセージ
- 原子的なコミット（単一の変更に焦点）

### 3. プッシュ
```bash
git push origin <branch-name>
```

## ドキュメント更新
- [ ] README.mdの更新が必要か確認
- [ ] APIの変更がある場合、ドキュメント更新
- [ ] 重要な設計判断はコメントまたはドキュメント化
- [ ] 各パッケージのREADME.mdが最新か確認
- [ ] AGENTSmdガイドラインに従っているか確認

## CI/CDパイプライン確認
- [ ] GitHub Actionsワークフローが正常に動作しているか
- [ ] プルリクエスト作成時にCIが実行されるか
- [ ] ビルド、テスト、リントが成功するか

## デプロイ後の確認
### 1. CloudFormation
```bash
aws cloudformation describe-stacks --stack-name AgentCoreMastraX402Stack --region ap-northeast-1
```
- スタックステータスが `CREATE_COMPLETE` または `UPDATE_COMPLETE` か確認

### 2. AgentCore Runtime
- AgentCore Runtimeコンソールで Runtime/Endpoint 確認
- Runtime ARNをフロントエンドの環境変数に設定

### 3. ログ確認
```bash
# Mastra Agent (AgentCore Runtime) ログ
aws logs tail /aws/bedrock-agentcore/runtime/<runtime-id> --follow

# x402 Backend ログ
aws logs tail /aws/ecs/x402-backend --follow

# MCP Lambda ログ
aws logs tail /aws/lambda/AgentCoreMastraX402Stack-AgentCoreMastraX402MCPServerFunctionXXX --follow

# Frontend ログ
aws logs tail /aws/ecs/agentcore-frontend --follow
```

### 4. 動作確認
- フロントエンドにアクセスして正常に動作するか確認
- チャット機能が動作するか確認
- Bedrockモデルが動作するか確認
- Geminiモデルが動作するか確認（APIキー設定後）
- x402決済が正常に行われるか確認

## 一般的な確認事項
- [ ] コードがフォーマットされている (`pnpm run biome:format`)
- [ ] リントエラーがない (`pnpm run biome:check`)
- [ ] ビルドが成功する（全パッケージ）
- [ ] テストが通る（該当する場合）
- [ ] 環境変数が適切に設定されている
- [ ] セキュリティ上の問題がない
- [ ] ドキュメントが更新されている（必要な場合）
- [ ] コミットメッセージが明確（コンベンショナルコミット形式）
- [ ] 技術的負債が明示的に記録されている（該当する場合）
- [ ] ボーイスカウトルールに従っている（コードを見つけた時よりも良い状態に）

## トラブルシューティング
- CDKデプロイエラー: `pnpm mcp build` が実行されているか確認
- AgentCore Runtime起動エラー: CloudWatch Logsでエラーメッセージ確認
- MCP接続エラー: SSM Parameter Storeの `mcp-server-url` が正しいか確認
- Geminiエラー: SSM Parameter Storeの `gemini-api-key` が設定されているか確認