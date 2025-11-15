# Amazon Bedrock AgentCore Runtime CDK実装メモ

## 概要
Amazon Bedrock AgentCore Runtimeの正式なCloudFormationリソース(`AWS::BedrockAgentCore::Runtime`)を使用したCDKスタックの実装。

## 実装日
2025年11月15日

## 重要な変更点

### 1. CDKパッケージのアップデート
- `aws-cdk-lib`: 2.195.0 → **2.221.0** (AgentCore Runtime サポート開始)
- `aws-cdk`: 2.1015.0 → **2.1031.2** (最新CLI)
- **AgentCore Runtimeには aws-cdk-lib 2.217.0以上が必須**

### 2. アーキテクチャの変更

#### 以前の誤った実装
```typescript
// ❌ 単なるECS Fargateを使用(AgentCore Runtimeではない)
new ecsPatterns.ApplicationLoadBalancedFargateService()
```

#### 正しい実装
```typescript
// ✅ Amazon Bedrock AgentCore Runtimeの正式リソース
import * as agentcore from "aws-cdk-lib/aws-bedrockagentcore";

new agentcore.CfnRuntime()           // Runtime本体
new agentcore.CfnRuntimeEndpoint()    // Runtimeエンドポイント
```

### 3. 最終的なアーキテクチャ構成

```
Frontend (Next.js on ECS Fargate)
    ↓ AGENTCORE_RUNTIME_ARN
Amazon Bedrock AgentCore Runtime ⭐
    ↓ MCP_SERVER_URL (ビルド時に注入)
MCP Server (Lambda + Function URL)
    ↓ RESOURCE_SERVER_URL
x402 Backend (ECS Fargate)
```

## AgentCore Runtime の実装詳細

### IAM Role設定
```typescript
const agentCoreRole = new iam.Role(this, "BedrockAgentCoreRole", {
  assumedBy: new iam.ServicePrincipal("bedrock-agentcore.amazonaws.com"),
});
```

必要な権限:
- **ECR**: `BatchGetImage`, `GetDownloadUrlForLayer`, `GetAuthorizationToken`
- **CloudWatch Logs**: `CreateLogGroup`, `CreateLogStream`, `PutLogEvents`
- **X-Ray**: `PutTraceSegments`, `PutTelemetryRecords`
- **CloudWatch Metrics**: `PutMetricData` (namespace: bedrock-agentcore)
- **Bedrock**: `InvokeModel`, `InvokeModelWithResponseStream`
- **AgentCore Identity**: `GetWorkloadAccessToken*`

### Docker Image のビルド
```typescript
const agentCoreDockerImage = new ecr_assets.DockerImageAsset(this, "AgentCoreDockerImage", {
  directory: join(__dirname, "../../mastra-agent"),
  file: "Dockerfile",
  platform: ecr_assets.Platform.LINUX_ARM64, // ARM64でコスト最適化
  buildArgs: {
    MCP_SERVER_URL: mcpFunctionUrl.url,
    RESOURCE_SERVER_URL: `http://${backendService.loadBalancer.loadBalancerDnsName}`,
    ENDPOINT_PATH: ENDPOINT_PATH || "/weather",
    PRIVATE_KEY: PRIVATE_KEY || "",
  },
});
```

### Runtime の作成
```typescript
const agentCoreRuntime = new agentcore.CfnRuntime(this, "MastraAgentCoreRuntime", {
  agentRuntimeName: "MastraAgentRuntime",
  agentRuntimeArtifact: {
    containerConfiguration: {
      containerUri: agentCoreDockerImage.imageUri,
      // ⚠️ environmentVariables は未サポート!
      // ビルド時にARGで注入する必要がある
    },
  },
  networkConfiguration: {
    networkMode: "PUBLIC",
  },
  roleArn: agentCoreRole.roleArn,
  protocolConfiguration: "HTTP",
});
```

### Endpoint の作成
```typescript
const agentCoreEndpoint = new agentcore.CfnRuntimeEndpoint(this, "MastraAgentCoreEndpoint", {
  agentRuntimeId: agentCoreRuntime.attrAgentRuntimeId,
  agentRuntimeVersion: agentCoreRuntime.attrAgentRuntimeVersion,
  name: "MastraAgentRuntimeEndpoint",
});
```

## 環境変数の設定方法

### 重要な制約
**AgentCore RuntimeのCfnRuntimeリソースは環境変数の動的設定をサポートしていない**

### 解決方法: Docker Build Args

#### CDK側 (cdk-stack.ts)
```typescript
buildArgs: {
  MCP_SERVER_URL: mcpFunctionUrl.url,
  RESOURCE_SERVER_URL: `http://${backendService.loadBalancer.loadBalancerDnsName}`,
  ENDPOINT_PATH: ENDPOINT_PATH || "/weather",
  PRIVATE_KEY: PRIVATE_KEY || "",
}
```

#### Dockerfile側
```dockerfile
# ビルド時の引数として受け取る
ARG MCP_SERVER_URL=""
ARG RESOURCE_SERVER_URL=""
ARG ENDPOINT_PATH="/weather"
ARG PRIVATE_KEY=""

# 環境変数として設定(実行時に利用可能)
ENV MCP_SERVER_URL=${MCP_SERVER_URL}
ENV RESOURCE_SERVER_URL=${RESOURCE_SERVER_URL}
ENV ENDPOINT_PATH=${ENDPOINT_PATH}
ENV PRIVATE_KEY=${PRIVATE_KEY}
```

#### アプリケーションコード (x402.ts)
```typescript
const mcpClient = new MCPClient({
  id: "x402-tools",
  servers: {
    x402: {
      url: new URL(`${process.env.MCP_SERVER_URL}/mcp`),
      log: new ConsoleLogger(),
    },
  },
});
```

### メリット
- ビルド時に値が確定するため実行時エラーを削減
- CDKのデプロイフローに完全統合
- AgentCore Runtimeの制約を回避

### 注意点
- **値を変更する場合は再ビルドが必要**
- Lambda Function URLとLoad Balancer DNSはデプロイ時に確定

## CloudFormation Outputs

```typescript
// AgentCore Runtime関連
AgentCoreMastraRuntimeArn         // Runtime ARN
AgentCoreMastraRuntimeId          // Runtime ID  
AgentCoreMastraEndpointArn        // Endpoint ARN

// その他のリソース
AgentCoreMastraX402BackendApiUrl  // x402 Backend URL
AgentCoreMastraX402MCPServerUrl   // MCP Server Function URL
AgentCoreMastraFrontendUrl        // Frontend URL
AgentCoreMastraX402VpcId          // VPC ID
```

## デプロイ手順

### 1. AWS認証確認
```bash
aws sts get-caller-identity
```

### 2. 変更内容のプレビュー
```bash
cd pkgs/cdk
pnpm cdk diff
```

### 3. デプロイ実行
```bash
pnpm cdk deploy AgentCoreMastraX402Stack
```

### 4. デプロイ後の確認
- CloudFormation コンソールでスタックステータス確認
- AgentCore Runtime コンソールで Runtime/Endpoint 確認
- CloudWatch Logs でログ確認

## 参考資料

### 公式ドキュメント
- [AWS CloudFormation - BedrockAgentCore](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/AWS_BedrockAgentCore.html)

### 参考記事
- [CDKでもAgentCoreをデプロイしたい - Qiita](https://qiita.com/Syoitu/items/65fda40c75dd467b5cd7)
- [Amazon Bedrock AgentCore Runtime を AWS CDKで構築しIAMポリシー設定を自動化する - サーバーワークス](https://blog.serverworks.co.jp/bedrock-agentcore-runtime-with-cdk)
- [AgentCore CDK - Zenn](https://zenn.dev/t_kakei/scraps/34097d705909ca)

## トラブルシューティング

### 問題: CDK CLI バージョン不一致
```
Cloud assembly schema version mismatch
```
**解決**: aws-cdk と aws-cdk-lib のバージョンを揃える

### 問題: environmentVariables がサポートされていない
```
Property 'environmentVariables' does not exist in type 'ContainerConfigurationProperty'
```
**解決**: Docker ARG + ENV を使用してビルド時に注入

### 問題: MCP_SERVER_URL が空
**解決**: buildArgs で Lambda Function URL を渡す

## ベストプラクティス

1. **ARM64 を使用**: コスト最適化のため Platform.LINUX_ARM64 を指定
2. **IAM 権限は最小限に**: 必要な権限のみを付与
3. **ログ保持期間を設定**: CloudWatch Logs の保持期間を適切に設定(例: 1週間)
4. **ヘルスチェック**: Dockerfileに HEALTHCHECK を設定
5. **非rootユーザー実行**: セキュリティのため agentuser で実行

## 今後の改善点

- [ ] L2 Construct が提供されたら移行を検討
- [ ] VPCモードの実装(現在はPUBLICモード)
- [ ] マルチリージョン対応
- [ ] CI/CDパイプラインの構築
- [ ] モニタリング・アラート設定の追加
