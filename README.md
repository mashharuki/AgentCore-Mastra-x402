# AgentCore-Mastra-x402
Amazon Bedrock AgentCore Mastra x402でつくる次世代金融AI Agentのサンプル実装です。

## 動かし方

### インストール

```bash
bun install
```

### CDKでAWSリソースをデプロイ

```bash
bun cdk run deploy 'AgentCoreMastraX402Stack'
```

### AWSリソースを削除

```bash
bun cdk run destroy 'AgentCoreMastraX402Stack' --force
```