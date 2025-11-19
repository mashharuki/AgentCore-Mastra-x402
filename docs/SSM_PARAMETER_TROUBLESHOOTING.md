# SSM Parameter Store アクセス問題のトラブルシューティング

## 問題

AgentCore RuntimeからSSM Parameter Storeの`/agentcore/mastra/mcp-server-url`にアクセスできない:

```
Failed to load MCP_SERVER_URL from SSM: ParameterNotFound: UnknownError
```

## 原因

1. **IAM権限不足**: AgentCore RuntimeのロールにSSMパラメータ読み取り権限が不足
2. **リージョン不一致**: パラメータとランタイムが異なるリージョンに存在
3. **パラメータ未作成**: デプロイ時にパラメータが作成されていない
4. **依存関係の問題**: ランタイムがパラメータ作成前に起動

## 修正内容

### 1. server.ts の改善

より詳細なエラーログとリージョン検出の強化:

```typescript
// リージョンの明示的な検出
const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;

// 詳細なエラーメッセージ
console.error(`Error type: ${(error as Error).name}`);
console.error(`Parameter name: ${parameterName}`);
console.error(`Region: ${region}`);

// エラー種別の判定
if ((error as Error).name === 'AccessDeniedException') {
  console.error('IAM permissions error');
}
if ((error as Error).name === 'ParameterNotFound') {
  console.error('Parameter not found');
}
```

### 2. CDK Stack の改善

#### a. 明示的な権限付与

```typescript
// 特定のパラメータARNへの権限
agentCoreRole.addToPolicy(
  new iam.PolicyStatement({
    actions: [
      "ssm:GetParameter",
      "ssm:GetParameters",
      "ssm:GetParametersByPath",
    ],
    resources: [
      mcpServerUrlParameter.parameterArn,  // 明示的なARN
      `arn:aws:ssm:${region}:${accountId}:parameter/agentcore/mastra/*`,
    ],
  }),
);

// grantRead()メソッドでも権限を付与
mcpServerUrlParameter.grantRead(agentCoreRole);
```

#### b. 依存関係の明示化

```typescript
// パラメータ → ロール → ランタイムの順序を保証
agentCoreRuntime.node.addDependency(agentCoreRole);
agentCoreRuntime.node.addDependency(mcpServerUrlParameter);
```

#### c. デバッグ用Output追加

```typescript
new cdk.CfnOutput(this, "AgentCoreMastraX402MCPServerUrlParameterArn", {
  value: mcpServerUrlParameter.parameterArn,
  description: "SSM Parameter ARN (for IAM permissions verification)",
});

new cdk.CfnOutput(this, "AgentCoreMastraRuntimeRegion", {
  value: region,
  description: "AWS Region for runtime resources",
});
```

## デプロイ後の確認手順

### 1. パラメータの存在確認

```bash
aws ssm get-parameter \
  --name /agentcore/mastra/mcp-server-url \
  --region ap-northeast-1
```

### 2. IAM権限の確認

```bash
# AgentCore Runtimeのロール名を確認
aws iam list-attached-role-policies \
  --role-name <AgentCoreRoleName>

# インラインポリシーを確認
aws iam list-role-policies \
  --role-name <AgentCoreRoleName>

# ポリシーの内容を確認
aws iam get-role-policy \
  --role-name <AgentCoreRoleName> \
  --policy-name <PolicyName>
```

### 3. CloudWatch Logsでエラー確認

```bash
aws logs tail /aws/bedrock-agentcore/runtimes/<runtime-id> \
  --follow \
  --region ap-northeast-1
```

期待されるログ:
```
Environment check - AWS_REGION: ap-northeast-1, isAws: true
MCP_SERVER_URL from env: not set
Running in AWS (region: ap-northeast-1) - attempting to load from SSM Parameter Store
Parameter name: /agentcore/mastra/mcp-server-url
Sending GetParameter request to SSM...
Successfully loaded MCP_SERVER_URL from SSM: https://xxx.lambda-url.ap-northeast-1.on.aws/
```

### 4. リージョンの一致確認

```bash
# CDKスタックのリージョン
aws cloudformation describe-stacks \
  --stack-name AgentCoreMastraX402Stack \
  --query 'Stacks[0].StackRegion' \
  --output text

# パラメータのリージョン確認
aws ssm describe-parameters \
  --filters "Key=Name,Values=/agentcore/mastra/mcp-server-url" \
  --region ap-northeast-1
```

## トラブルシューティング

### エラー: ParameterNotFound

**原因**: パラメータが存在しないか、異なるリージョンを参照

**解決策**:
```bash
# パラメータを手動作成
aws ssm put-parameter \
  --name /agentcore/mastra/mcp-server-url \
  --value "https://your-mcp-function-url.lambda-url.ap-northeast-1.on.aws/" \
  --type String \
  --region ap-northeast-1
```

### エラー: AccessDeniedException

**原因**: IAMロールに権限がない

**解決策**:
```bash
# IAMポリシーを手動追加
aws iam put-role-policy \
  --role-name <AgentCoreRoleName> \
  --policy-name SSMParameterAccess \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Action": [
        "ssm:GetParameter",
        "ssm:GetParameters"
      ],
      "Resource": "arn:aws:ssm:ap-northeast-1:*:parameter/agentcore/mastra/*"
    }]
  }'
```

### リージョン不一致

**確認**:
```bash
# Dockerコンテナ内で環境変数を確認
docker exec <container-id> env | grep AWS_REGION
```

**解決策**: CDKでリージョンを明示的に指定
```typescript
new AgentCoreMastraX402Stack(app, 'AgentCoreMastraX402Stack', {
  env: {
    region: 'ap-northeast-1',
    account: process.env.CDK_DEFAULT_ACCOUNT,
  },
});
```

## 再デプロイ手順

```bash
# 1. コードをビルド
cd pkgs/mastra-agent
pnpm build

# 2. Dockerイメージをビルド
docker build --platform linux/arm64 -t mastra-agent:latest .

# 3. ECRにプッシュ
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
docker tag mastra-agent:latest $AWS_ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com/agentcore-mastra-agent:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com/agentcore-mastra-agent:latest

# 4. CDKデプロイ
cd ../cdk
pnpm cdk deploy --all

# 5. ログ確認
aws logs tail /aws/bedrock-agentcore/runtimes/<runtime-id> --follow
```

## 参考

- [AWS Systems Manager Parameter Store](https://docs.aws.amazon.com/systems-manager/latest/userguide/systems-manager-parameter-store.html)
- [Amazon Bedrock AgentCore IAM Permissions](https://docs.aws.amazon.com/bedrock/latest/userguide/agentcore-permissions.html)
- [AWS CDK SSM Module](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.aws_ssm-readme.html)
