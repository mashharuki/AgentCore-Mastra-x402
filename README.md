# AgentCore-Mastra-x402
Amazon Bedrock AgentCore Mastra x402でつくる次世代金融AI Agentのサンプル実装です。

## 動かし方

### インストール

```bash
pmpm install
```

### MCPのビルド

```bash
pnpm mcp build
```

### x402サーバーの起動

```bash
pnpm x402server dev
```

### CDKでAWSリソースをデプロイ

```bash
pnpm cdk run deploy 'AgentCoreMastraX402Stack'
```

### AWSリソースを削除

```bash
pnpm cdk run destroy 'AgentCoreMastraX402Stack' --force
```