# タスク完了時のチェックリスト

## コード品質チェック
### 1. フォーマット
```bash
bun run biome:format
```
- Biomeで自動フォーマット
- コードスタイルの統一

### 2. リント
```bash
bun run biome:check
```
- Biomeでリント実行
- 問題があれば修正

### 3. Next.jsリント（フロントエンド変更時）
```bash
pnpm frontend lint
```

### 4. MCPサーバーリント（MCP変更時）
```bash
pnpm mcp lint
```

## テスト実行
### CDKテスト（インフラ変更時）
```bash
pnpm cdk test
```

## ビルド確認
### フロントエンド
```bash
pnpm frontend build
```
- ビルドエラーがないか確認
- 型エラーがないか確認

### CDK
```bash
pnpm cdk build
```
- TypeScriptコンパイルエラーがないか確認

### MCP
```bash
pnpm mcp build
```
- バンドルが成功するか確認

### x402サーバー
```bash
pnpm x402server build
```

## デプロイ前チェック（本番環境）
### 1. 差分確認
```bash
cd pkgs/cdk
pnpm cdk diff
```
- CloudFormationの差分を確認
- 意図しない変更がないか確認
- AgentCore Runtimeリソースの変更を確認

### 2. 環境変数確認
- `.env`ファイルが正しく設定されているか
- 秘密情報がハードコードされていないか
- 必要な環境変数がすべて設定されているか
  - `FACILITATOR_URL`
  - `ADDRESS`
  - `NETWORK`
  - `ENDPOINT_PATH`
  - `PRIVATE_KEY`

### 3. Docker イメージ確認（AgentCore Runtime用）
```bash
cd pkgs/mastra-agent
docker build --platform linux/arm64 -t test-agentcore-runtime .
```
- ARM64ビルドが成功するか確認
- ビルド引数（ARG）が正しく設定されているか確認

### 4. セキュリティチェック
- APIキー・パスワードが環境変数管理されているか
- 不要な依存関係がないか
- 脆弱性がないか（pnpm audit）
- IAMロールの権限が最小限か確認

### 5. CDK合成確認
```bash
pnpm cdk synth
```
- CloudFormationテンプレートが正しく生成されるか
- `AWS::BedrockAgentCore::Runtime`リソースが含まれているか確認

## Git操作
### 1. 変更確認
```bash
git status
git diff
```

### 2. コミット
```bash
git add .
git commit -m "feat: 機能の説明"
```
- コンベンショナルコミット形式を使用
- 明確で説明的なメッセージ

### 3. プッシュ
```bash
git push origin <branch-name>
```

## ドキュメント更新
- README.mdの更新が必要か確認
- APIの変更がある場合、ドキュメント更新
- 重要な設計判断はコメントまたはドキュメント化

## 一般的な確認事項
- [ ] コードがフォーマットされている
- [ ] リントエラーがない
- [ ] ビルドが成功する
- [ ] テストが通る（該当する場合）
- [ ] 環境変数が適切に設定されている
- [ ] セキュリティ上の問題がない
- [ ] ドキュメントが更新されている（必要な場合）
- [ ] コミットメッセージが明確
- [ ] 技術的負債が明示的に記録されている（該当する場合）
