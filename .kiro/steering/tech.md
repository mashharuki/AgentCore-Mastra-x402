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

## 採用する技術について補足情報

# Mastraについて

## Mastra(マストラ): AIエージェント開発のためのTypeScriptフレームワーク

### 🚀 概要

Mastraは、TypeScript/JavaScriptで開発されたオープンソースのAIエージェント開発フレームワークです。LLM(大規模言語モデル)を活用したインテリジェントなアプリケーションやエージェントを、効率的かつ構造的に構築・デプロイするために必要なコンポーネントと開発環境を包括的に提供します。

| 項目 | 詳細 |
|------|------|
| 開発言語 | TypeScript / JavaScript |
| 特徴 | AIエージェント構築に必要な機能をオールインワンで提供。TypeScriptの型安全性を活かした高い開発者体験(DX)を重視 |
| 対応LLM | OpenAI(GPT-4など)、Anthropic(Claude)、Google(Gemini)など、複数のLLMを統一インターフェースで利用可能 |
| 適用範囲 | 対話型アシスタント、自律的なタスク実行エージェント、情報収集・分析の自動化など、複雑なAIアプリケーション全般 |

### 🛠️ 主要な機能とコンポーネント

Mastraは、AIエージェントの構築・運用を支援する以下の主要なコンポーネントを提供します。

#### 1. Agents(エージェント)

LLMを活用し、特定の目的達成のために自律的にタスクを実行するAIシステムの中核です。

- **機能**: ツール呼び出し(Tool Calling)、メモリ管理、対話履歴の保持などを行い、ユーザーの問い合わせや指示に応じて動的に最適なアクションを実行します
- **構造化出力**: ZodやJSON Schemaを使用して期待される出力形式を定義することで、型安全な構造化データを取得できます

#### 2. Workflows(ワークフロー)

複雑なタスクを複数のステップに分割し、安定的に実行するためのグラフベースのステートマシンです。

- **機能**: 複数のLLM呼び出しやデータ処理ステップをグラフ構造で視覚的に定義・管理できます
- **制御**: 条件分岐、ループ処理、他のワークフローの組み込み、エラーハンドリング(リトライ)、ヒューマン・イン・ザ・ループ(人間による入力待ち)などが可能です
- **耐久性**: 実行時のログやトレース情報が自動で記録され、デバッグや監視(Observability)が容易です

#### 3. RAG(Retrieval-Augmented Generation / 検索拡張生成)

エージェントに外部の知識ベース(ドキュメント、データベースなど)と連携する能力を与え、回答の正確性を向上させる機能です。

- **機能**: ドキュメントの分割、埋め込み(Embedding)、ベクトルデータベースへの保存、クエリ時の関連情報取得、再ランク付けなどを簡易に行えます
- **利用**: 社内ドキュメントやWebスクレイピングで収集したデータなど、アプリケーション固有の知識をエージェントの応答に活用できます

#### 4. Tools(ツール)

エージェントが外部システムと連携するための手段です。

- **機能**: 外部APIやカスタム関数を型安全に定義し、エージェントから呼び出すことができます
- **連携**: エージェントは、タスク実行に必要な情報取得やアクションのために、どのツールをいつ、どのようなパラメータで呼び出すかを自律的に判断します

#### 5. Memory(メモリ)

エージェントの過去の対話や知識を保持し、長期にわたって学習・維持するための仕組みです。

**種類:**

- **ワーキングメモリ**: 現在の対話の文脈を扱う短期記憶
- **セマンティックメモリ**: 過去の対話履歴などをベクトル検索で動的に思い出す長期記憶
- **永続化**: 記憶した内容はLibSQLなどを用いて永続化することが可能です

#### 6. 評価(Evals)

LLMの出力品質を自動でテスト・評価するための機能です。

- **目的**: LLMの応答が、有害性、バイアス、関連性などの基準を満たしているかを客観的に評価し、エージェントの品質向上をサポートします

#### 7. 開発環境とOps

開発効率と運用管理を支援する機能です。

- **ローカル開発環境 & Playground**: 開発中のエージェントやワークフローの動作をリアルタイムで確認・テストできるブラウザ上のGUIを提供します
- **デプロイ**: Node.js、サーバーレス環境など、多様な環境へのデプロイを容易にします
- **Ops**: エージェントとワークフローのパフォーマンス管理、トレーシング、監視機能を提供します

### 💡 活用事例

Mastraで構築可能なAIエージェントの具体的な応用例には以下のようなものがあります。

- **カスタマーサポートの自動化**: RAG機能を用いてFAQやナレッジベースと連携し、顧客からの問い合わせに自動で回答するチャットボット
- **情報収集・リサーチの自動化**: Webスクレイピングやデータ分析ツールを組み合わせ、市場調査、競合分析、営業リストの作成などを自動実行するエージェント
- **専門ドキュメントの生成・分析**: 大量の技術文書やレポートを解析し、要約・情報抽出を行ったり、設計図やレポートを自動生成したりするアシスタント
- **プログラミング支援**: コードの自動生成、バグ修正提案、コードレビューコメントの作成を行う開発アシスタント
- **マルチエージェント構成**: 役割を分担した複数のエージェント(Web検索エージェント、データ分析エージェントなど)を連携させ、複雑なタスクを協力して実行させるシステム

### 🌟 強みと特徴

- **TypeScript/Webスタックとの親和性**: TypeScriptで完結するため、既存のWeb開発技術やエコシステムとの連携がスムーズです
- **オールインワンフレームワーク**: エージェント、ワークフロー、RAG、評価、デプロイなど、開発から運用に必要な要素が一通り揃っています
- **開発者体験(DX)の重視**: 型安全性、統合された開発環境(Playground)、デバッグ支援機能(トレーシング、Evals)により、高品質なエージェントを効率的に開発できます
- **柔軟な制御と拡張性**: ワークフローによる複雑な処理フローの定義や、ツールによる外部連携が容易であり、高度で自律的なAIアプリケーションの構築に適しています

---

# Amazon Bedrock AgentCoreについて

## Amazon Bedrock AgentCore 概要
Amazon Bedrock AgentCoreは、エンタープライズグレードのセキュリティ、信頼性、ガバナンスを確保しながら、AIエージェントを本番環境で安全にスケール展開するためのフルマネージドサービス群です。

## 🎯 主な特徴

- フレームワーク・モデル非依存: LangGraph、CrewAI、Strands Agentsなど、任意のオープンソースフレームワークと任意のモデルをサポート
- ゼロインフラ管理: インフラストラクチャの管理をAWSが完全に肩代わり
- エンタープライズセキュリティ: セッション隔離、ID管理、ツールアクセス制御が組み込み済み
- 従量課金制: 初期費用や最低料金なしの柔軟な料金体系

## 🛠️ 主要コンポーネント

1. AgentCore Runtime（実行環境）
目的: AIエージェントとツールのセキュアなサーバーレス実行基盤
特徴:
最大8時間の長時間ワークロード対応
高速コールドスタート
完全なセッション分離
マルチモーダルペイロード対応
組み込みアイデンティティ管理

2. AgentCore Identity（認証・認可）
目的: エージェントのアイデンティティとアクセス管理
特徴:
既存のIDプロバイダとの互換性
セキュアなトークンボルト
最小権限アクセス
セキュアな権限委譲

3. AgentCore Memory（記憶管理）
目的: コンテキスト認識エージェントの構築支援
特徴:
短期メモリ（マルチターン会話用）
長期メモリ（エージェント・セッション間共有）
複雑なメモリインフラ管理の排除
業界最高レベルの精度

4. AgentCore Code Interpreter（コード実行）
目的: 隔離されたサンドボックス環境でのセキュアなコード実行
特徴:
Python、JavaScript、TypeScript対応
エンタープライズセキュリティ要件対応
高度な設定サポート
人気フレームワークとのシームレス統合

5. AgentCore Browser（ブラウザ自動化）
目的: AIエージェントによるWebサイトとの大規模インタラクション
特徴:
高速でセキュアなクラウドベースブラウザランタイム
エンタープライズグレードセキュリティ
包括的な可観測性機能
自動スケーリング

6. AgentCore Gateway（ツール統合）
目的: エージェントがツールを発見・使用するためのセキュアな方法
特徴:
API、Lambda関数、既存サービスのエージェント対応ツール化
数週間のカスタムコード開発を排除
インフラプロビジョニングの自動化
セキュリティ実装の簡素化

7. AgentCore Observability（可観測性）
目的: エージェントのトレース、デバッグ、パフォーマンス監視
特徴:
統一された運用ダッシュボード
OpenTelemetry互換テレメトリサポート
エージェントワークフローの詳細可視化
本番環境での品質基準維持

## 💡 主要な利用シナリオ

1. 組み込みツールと機能の活用
ブラウザ自動化とコード解釈の組み込みツール活用
内部・外部ツールとリソースのシームレス統合
ユーザーとのインタラクションを記憶するエージェント作成

2. セキュアな大規模デプロイ
フレームワーク、プロトコル、モデル選択に関係なく動的AIエージェントとツールをセキュアにデプロイ・スケール
基盤リソースの管理なしでシームレスなエージェントアイデンティティとアクセス管理

3. テストと監視
トークン使用量、レイテンシ、セッション継続時間、エラー率などの運用メトリクスのリアルタイム可視化
エージェントの使用状況と運用メトリクスへの深い洞察

## 🚀 開発者にとってのメリット

- 開発効率の向上: インフラ管理をAWSに委託し、エージェントロジックの開発に集中
- 市場投入時間の短縮: 複雑なセキュリティ要件やスケーリングをAWSが処理
- 柔軟性の確保: 任意のLLM、任意のオープンソースフレームワークを選択可能
- エンタープライズ対応: 本番環境で求められる厳しいガバナンス要件を満たす
Amazon Bedrock AgentCoreは、AIエージェントのプロトタイプから本番環境への移行を劇的に簡素化し、開発者がイノベーションに集中できる環境を提供する、まさに次世代のAIエージェント開発プラットフォームです！

## CDKによるサンプルコード

```ts
// lib/agentcore-infrastructure-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class AgentCoreInfrastructureStack extends cdk.Stack {
  public readonly agentCoreExecutionRole: iam.Role;
  public readonly ecrRepository: ecr.Repository;
  public readonly memoryDatabase: rds.ServerlessCluster;
  public readonly agentMemoryTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC設定（AgentCore用）
    const vpc = new ec2.Vpc(this, 'AgentCoreVPC', {
      cidr: '10.0.0.0/16',
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'public',
          cidrMask: 24,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          name: 'private',
          cidrMask: 24,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // AgentCore実行用IAMロール
    this.agentCoreExecutionRole = new iam.Role(this, 'AgentCoreExecutionRole', {
      assumedBy: new iam.ServicePrincipal('bedrock-agentcore.amazonaws.com'),
      description: 'Execution role for Amazon Bedrock AgentCore',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonBedrockFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonRDSDataFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMReadOnlyAccess'),
      ],
    });

    // X-Ray、CloudWatch、ECRアクセス権限を追加
    this.agentCoreExecutionRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'xray:PutTraceSegments',
          'xray:PutTelemetryRecords',
          'xray:GetSamplingRules',
          'xray:GetSamplingTargets',
          'ecr:BatchGetImage',
          'ecr:GetDownloadUrlForLayer',
          'ecr:GetAuthorizationToken',
          'bedrock-agentcore:*',
        ],
        resources: ['*'],
      })
    );

    // ECRリポジトリ（エージェントコンテナ用）
    this.ecrRepository = new ecr.Repository(this, 'AgentCoreRepository', {
      repositoryName: 'agentcore-agents',
      imageScanOnPush: true,
      lifecycleRules: [
        {
          maxImageCount: 10,
          description: 'Keep only 10 latest images',
        },
      ],
    });

    // Aurora Serverless PostgreSQL（Memory用）
    this.memoryDatabase = new rds.ServerlessCluster(this, 'AgentCoreMemoryDB', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_13_13,
      }),
      vpc,
      scaling: {
        minCapacity: rds.AuroraCapacityUnit.ACU_2,
        maxCapacity: rds.AuroraCapacityUnit.ACU_16,
      },
      deletionProtection: false,
      defaultDatabaseName: 'agentcore_memory',
    });

    // DynamoDB（セッション管理用）
    this.agentMemoryTable = new dynamodb.Table(this, 'AgentMemoryTable', {
      partitionKey: {
        name: 'sessionId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'timestamp',
        type: dynamodb.AttributeType.NUMBER,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Secrets Manager（認証情報管理）
    const agentCoreSecrets = new secretsmanager.Secret(this, 'AgentCoreSecrets', {
      description: 'AgentCore authentication and configuration secrets',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'agentcore' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
      },
    });

    // CloudWatch Log Group
    const logGroup = new logs.LogGroup(this, 'AgentCoreLogGroup', {
      logGroupName: '/aws/bedrock-agentcore/agents',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Parameter Store設定
    new ssm.StringParameter(this, 'AgentCoreExecutionRoleArn', {
      parameterName: '/agentcore/execution-role-arn',
      stringValue: this.agentCoreExecutionRole.roleArn,
      description: 'AgentCore execution role ARN',
    });

    new ssm.StringParameter(this, 'AgentCoreECRRepository', {
      parameterName: '/agentcore/ecr-repository-uri',
      stringValue: this.ecrRepository.repositoryUri,
      description: 'AgentCore ECR repository URI',
    });

    new ssm.StringParameter(this, 'AgentCoreMemoryDBEndpoint', {
      parameterName: '/agentcore/memory-db-endpoint',
      stringValue: this.memoryDatabase.clusterEndpoint.hostname,
      description: 'AgentCore memory database endpoint',
    });

    // 出力
    new cdk.CfnOutput(this, 'AgentCoreExecutionRoleArnOutput', {
      value: this.agentCoreExecutionRole.roleArn,
      description: 'AgentCore execution role ARN',
      exportName: 'AgentCoreExecutionRoleArn',
    });

    new cdk.CfnOutput(this, 'ECRRepositoryUriOutput', {
      value: this.ecrRepository.repositoryUri,
      description: 'ECR repository URI for AgentCore agents',
      exportName: 'AgentCoreECRRepositoryUri',
    });

    new cdk.CfnOutput(this, 'MemoryDatabaseEndpointOutput', {
      value: this.memoryDatabase.clusterEndpoint.hostname,
      description: 'Memory database endpoint',
      exportName: 'AgentCoreMemoryDBEndpoint',
    });
  }
}
```

AgentCore Memory リソース作成

```ts
// lib/agentcore-memory-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

export interface AgentCoreMemoryStackProps extends cdk.StackProps {
  executionRoleArn: string;
}

export class AgentCoreMemoryStack extends cdk.Stack {
  public readonly memoryId: string;

  constructor(scope: Construct, id: string, props: AgentCoreMemoryStackProps) {
    super(scope, id, props);

    // AgentCore Memory作成用Lambda関数
    const memoryCreatorFunction = new lambda.Function(this, 'MemoryCreatorFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
import boto3
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    try:
        client = boto3.client('bedrock-agentcore')
        
        request_type = event['RequestType']
        
        if request_type == 'Create':
            # Memory作成
            response = client.create_memory(
                name='AgentCoreMemory',
                description='Memory for AgentCore agents',
                memoryStrategies=[
                    {
                        'type': 'SEMANTIC',
                        'name': 'SemanticMemoryStrategy',
                        'description': 'Semantic memory for long-term storage',
                        'namespaces': ['/agents/{agentId}/semantic']
                    },
                    {
                        'type': 'SUMMARY',
                        'name': 'SummaryMemoryStrategy', 
                        'description': 'Summary memory for conversation summaries',
                        'namespaces': ['/agents/{agentId}/summaries']
                    }
                ]
            )
            
            memory_id = response['id']
            logger.info(f"Created memory with ID: {memory_id}")
            
            return {
                'Status': 'SUCCESS',
                'PhysicalResourceId': memory_id,
                'Data': {'MemoryId': memory_id}
            }
            
        elif request_type == 'Delete':
            memory_id = event['PhysicalResourceId']
            try:
                client.delete_memory(memoryId=memory_id)
                logger.info(f"Deleted memory with ID: {memory_id}")
            except Exception as e:
                logger.warning(f"Failed to delete memory: {e}")
            
            return {
                'Status': 'SUCCESS',
                'PhysicalResourceId': memory_id
            }
            
        else:  # Update
            return {
                'Status': 'SUCCESS',
                'PhysicalResourceId': event['PhysicalResourceId']
            }
            
    except Exception as e:
        logger.error(f"Error: {e}")
        return {
            'Status': 'FAILED',
            'Reason': str(e),
            'PhysicalResourceId': event.get('PhysicalResourceId', 'failed-to-create')
        }
      `),
      timeout: cdk.Duration.minutes(5),
    });

    // Lambda関数にAgentCore権限を付与
    memoryCreatorFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'bedrock-agentcore:CreateMemory',
          'bedrock-agentcore:DeleteMemory',
          'bedrock-agentcore:GetMemory',
          'bedrock-agentcore:ListMemories',
        ],
        resources: ['*'],
      })
    );

    // カスタムリソースでMemory作成
    const memoryResource = new cr.AwsCustomResource(this, 'AgentCoreMemoryResource', {
      onCreate: {
        service: 'Lambda',
        action: 'invoke',
        parameters: {
          FunctionName: memoryCreatorFunction.functionName,
          Payload: JSON.stringify({
            RequestType: 'Create',
            ResourceProperties: {
              ExecutionRoleArn: props.executionRoleArn,
            },
          }),
        },
        physicalResourceId: cr.PhysicalResourceId.fromResponse('Payload'),
      },
      onDelete: {
        service: 'Lambda',
        action: 'invoke',
        parameters: {
          FunctionName: memoryCreatorFunction.functionName,
          Payload: JSON.stringify({
            RequestType: 'Delete',
          }),
        },
      },
      policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
        resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
      }),
    });

    // Memory IDを取得
    this.memoryId = memoryResource.getResponseField('Payload');

    // Parameter Storeに保存
    new cdk.CfnOutput(this, 'MemoryIdOutput', {
      value: this.memoryId,
      description: 'AgentCore Memory ID',
      exportName: 'AgentCoreMemoryId',
    });
  }
}
```

AgentCore Gateway設定

```ts
// lib/agentcore-gateway-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

export interface AgentCoreGatewayStackProps extends cdk.StackProps {
  executionRoleArn: string;
}

export class AgentCoreGatewayStack extends cdk.Stack {
  public readonly gatewayId: string;

  constructor(scope: Construct, id: string, props: AgentCoreGatewayStackProps) {
    super(scope, id, props);

    // x402決済用Lambda関数
    const x402PaymentFunction = new lambda.Function(this, 'X402PaymentFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
const { BedrockAgentCoreClient } = require('@aws-sdk/client-bedrock-agentcore');

exports.handler = async (event, context) => {
    console.log('X402 Payment Function called:', JSON.stringify(event, null, 2));
    
    const { toolName, input } = event;
    
    try {
        switch (toolName) {
            case 'processPayment':
                return await processPayment(input);
            case 'checkBalance':
                return await checkBalance(input);
            case 'getTransactionHistory':
                return await getTransactionHistory(input);
            default:
                throw new Error(\`Unknown tool: \${toolName}\`);
        }
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

async function processPayment(input) {
    const { amount, currency, recipient, memo } = input;
    
    // x402決済処理のシミュレーション
    const transactionId = \`tx_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`;
    
    return {
        success: true,
        transactionId,
        amount,
        currency,
        recipient,
        memo,
        timestamp: new Date().toISOString(),
        status: 'completed'
    };
}

async function checkBalance(input) {
    const { walletAddress } = input;
    
    // 残高確認のシミュレーション
    return {
        walletAddress,
        balance: '1000.50',
        currency: 'USDC',
        lastUpdated: new Date().toISOString()
    };
}

async function getTransactionHistory(input) {
    const { walletAddress, limit = 10 } = input;
    
    // 取引履歴のシミュレーション
    const transactions = Array.from({ length: Math.min(limit, 5) }, (_, i) => ({
        transactionId: \`tx_\${Date.now() - i * 1000}_\${Math.random().toString(36).substr(2, 9)}\`,
        amount: (Math.random() * 100).toFixed(2),
        currency: 'USDC',
        type: Math.random() > 0.5 ? 'sent' : 'received',
        timestamp: new Date(Date.now() - i * 86400000).toISOString(),
        status: 'completed'
    }));
    
    return {
        walletAddress,
        transactions,
        total: transactions.length
    };
}
      `),
      timeout: cdk.Duration.minutes(1),
    });

    // Lambda関数に必要な権限を付与
    x402PaymentFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'bedrock-agentcore:*',
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: ['*'],
      })
    );

    // Gateway作成用Lambda関数
    const gatewayCreatorFunction = new lambda.Function(this, 'GatewayCreatorFunction', {
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
import boto3
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    try:
        client = boto3.client('bedrock-agentcore')
        
        request_type = event['RequestType']
        
        if request_type == 'Create':
            # Gateway作成
            response = client.create_gateway(
                name='X402PaymentGateway',
                description='Gateway for x402 payment processing'
            )
            
            gateway_id = response['id']
            
            # Lambda targetを追加
            target_response = client.create_target(
                gatewayId=gateway_id,
                name='X402PaymentTarget',
                targetConfiguration={
                    'lambda': {
                        'lambdaArn': event['ResourceProperties']['LambdaArn'],
                        'toolSchema': {
                            'inlinePayload': [
                                {
                                    'name': 'processPayment',
                                    'description': 'Process a payment using x402 protocol',
                                    'inputSchema': {
                                        'type': 'object',
                                        'properties': {
                                            'amount': {'type': 'string', 'description': 'Payment amount'},
                                            'currency': {'type': 'string', 'description': 'Currency (e.g., USDC)'},
                                            'recipient': {'type': 'string', 'description': 'Recipient address'},
                                            'memo': {'type': 'string', 'description': 'Payment memo'}
                                        },
                                        'required': ['amount', 'currency', 'recipient']
                                    }
                                },
                                {
                                    'name': 'checkBalance',
                                    'description': 'Check wallet balance',
                                    'inputSchema': {
                                        'type': 'object',
                                        'properties': {
                                            'walletAddress': {'type': 'string', 'description': 'Wallet address'}
                                        },
                                        'required': ['walletAddress']
                                    }
                                },
                                {
                                    'name': 'getTransactionHistory',
                                    'description': 'Get transaction history',
                                    'inputSchema': {
                                        'type': 'object',
                                        'properties': {
                                            'walletAddress': {'type': 'string', 'description': 'Wallet address'},
                                            'limit': {'type': 'integer', 'description': 'Number of transactions to return'}
                                        },
                                        'required': ['walletAddress']
                                    }
                                }
                            ]
                        }
                    }
                }
            )
            
            logger.info(f"Created gateway with ID: {gateway_id}")
            
            return {
                'Status': 'SUCCESS',
                'PhysicalResourceId': gateway_id,
                'Data': {'GatewayId': gateway_id}
            }
            
        elif request_type == 'Delete':
            gateway_id = event['PhysicalResourceId']
            try:
                client.delete_gateway(gatewayId=gateway_id)
                logger.info(f"Deleted gateway with ID: {gateway_id}")
            except Exception as e:
                logger.warning(f"Failed to delete gateway: {e}")
            
            return {
                'Status': 'SUCCESS',
                'PhysicalResourceId': gateway_id
            }
            
        else:  # Update
            return {
                'Status': 'SUCCESS',
                'PhysicalResourceId': event['PhysicalResourceId']
            }
            
    except Exception as e:
        logger.error(f"Error: {e}")
        return {
            'Status': 'FAILED',
            'Reason': str(e),
            'PhysicalResourceId': event.get('PhysicalResourceId', 'failed-to-create')
        }
      `),
      timeout: cdk.Duration.minutes(5),
    });

    // Gateway作成Lambda関数に権限を付与
    gatewayCreatorFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'bedrock-agentcore:CreateGateway',
          'bedrock-agentcore:DeleteGateway',
          'bedrock-agentcore:CreateTarget',
          'bedrock-agentcore:DeleteTarget',
          'lambda:InvokeFunction',
        ],
        resources: ['*'],
      })
    );

    // 出力
    new cdk.CfnOutput(this, 'X402PaymentFunctionArnOutput', {
      value: x402PaymentFunction.functionArn,
      description: 'X402 Payment Lambda Function ARN',
      exportName: 'X402PaymentFunctionArn',
    });
  }
}
```

メインアプリケーション

```ts
// bin/agentcore-app.ts
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AgentCoreInfrastructureStack } from '../lib/agentcore-infrastructure-stack';
import { AgentCoreMemoryStack } from '../lib/agentcore-memory-stack';
import { AgentCoreGatewayStack } from '../lib/agentcore-gateway-stack';

const app = new cdk.App();

// 基盤インフラストラクチャ
const infraStack = new AgentCoreInfrastructureStack(app, 'AgentCoreInfrastructureStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

// Memory設定
const memoryStack = new AgentCoreMemoryStack(app, 'AgentCoreMemoryStack', {
  executionRoleArn: infraStack.agentCoreExecutionRole.roleArn,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

// Gateway設定
const gatewayStack = new AgentCoreGatewayStack(app, 'AgentCoreGatewayStack', {
  executionRoleArn: infraStack.agentCoreExecutionRole.roleArn,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

// 依存関係設定
memoryStack.addDependency(infraStack);
gatewayStack.addDependency(infraStack);
```

### 💡 x402が実現する応用シナリオ

x402は、以下のような新しいデジタルエコノミーの実現を可能にします。

#### 1. AIエージェント間の自動取引

- **リソースの購入**: AIエージェントが、タスク実行に必要なGPU/CPU時間、専門的なデータ、外部APIサービスなどを、リアルタイムで自律的に購入し、リソースを最適に配分します
- **複雑なタスクの自動実行**: 複数のAIエージェントやサービスを組み合わせた複雑なワークフローにおいて、各ステップでのコストを自動で支払い、人間の承認なしにタスクを最後まで実行します

#### 2. データ・コンテンツの利用高度化

- **動的なコンテンツ課金**: 動画の視聴時間、ニュース記事の閲覧量、ゲームのプレイ時間など、実際の利用量に基づいた柔軟な課金体系(従量課金)が容易に実現します
- **専門情報のオンデマンド購入**: 市場データや気象情報などの専門データサービスを、必要な時だけ、必要な分だけ購入し、AIによる高度な分析・提案に活用できます

#### 3. グローバルな分散型経済

- **摩擦のないグローバル取引**: 地理的な制限や複雑な銀行手続きなしに、インターネット上のすべてのデジタル資産が直接かつ即時に取引可能になります
- **クリエイターへの公平な還元**: 中抜きを減らし、コンテンツの利用量に比例した収益が、クリエイターに直接かつ瞬時に還元されることが期待されます