import * as cdk from "aws-cdk-lib";
import * as agentcore from "aws-cdk-lib/aws-bedrockagentcore";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecr_assets from "aws-cdk-lib/aws-ecr-assets";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
import * as ssm from "aws-cdk-lib/aws-ssm";
import type { Construct } from "constructs";
import * as dotenv from "dotenv";
import { execSync } from "node:child_process";
import * as fs from "node:fs";
import { join } from "node:path";
dotenv.config();

const { FACILITATOR_URL, ADDRESS, NETWORK, ENDPOINT_PATH, PRIVATE_KEY } =
  process.env;

/**
 * Amazon Bedrock AgentCore ✖️ Mastra ✖️ x402 MCP サーバーリソース用のスタック
 *
 * デプロイするリソース
 * 1. Amazon Bedrock AgentCore
 * 2. Mastra製AI Agent
 * 3. x402 MCP サーバー
 * 4. x402 に対応したコンテンツサーバー
 */
export class AgentCoreMastraX402Stack extends cdk.Stack {
  /**
   * コンストラクター
   * @param scope
   * @param id
   * @param props
   */
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC for Fargate service
    const vpc = new ec2.Vpc(this, "AgentCoreMastraX402Vpc", {
      maxAzs: 2,
      natGateways: 1,
    });

    // ===========================================================================
    // Fargateでx402のバックエンドサーバー(コンテンツサーバー)をデプロイ
    //　===========================================================================

    // Create ECR repository reference (assuming it already exists)
    const backendRepo = ecr.Repository.fromRepositoryName(
      this,
      "AgentCoreMastraX402BackendRepo",
      "x402-backend-api",
    );

    // Create ECS cluster
    const cluster = new ecs.Cluster(this, "AgentCoreMastraX402Cluster", {
      vpc,
      clusterName: "x402-cluster",
    });

    // Create Fargate service for backend API
    const backendService =
      new ecsPatterns.ApplicationLoadBalancedFargateService(
        this,
        "AgentCoreMastraX402BackendService",
        {
          cluster,
          serviceName: "x402-backend-api",
          cpu: 512,
          memoryLimitMiB: 1024,
          desiredCount: 1,
          taskImageOptions: {
            image: ecs.ContainerImage.fromEcrRepository(backendRepo, "latest"),
            containerPort: 4021,
            environment: {
              PORT: "4021",
              NODE_ENV: "production",
              // Add other environment variables as needed
              FACILITATOR_URL: FACILITATOR_URL as string,
              ADDRESS: ADDRESS as string,
              NETWORK: NETWORK as string,
            },
            logDriver: ecs.LogDrivers.awsLogs({
              streamPrefix: "x402-backend",
              logGroup: new logs.LogGroup(
                this,
                "AgentCoreMastraX402BackendLogGroup",
                {
                  logGroupName: "/aws/ecs/x402-backend",
                  retention: logs.RetentionDays.ONE_WEEK,
                  removalPolicy: cdk.RemovalPolicy.DESTROY,
                },
              ),
            }),
          },
          publicLoadBalancer: true,
          assignPublicIp: true,
          healthCheckGracePeriod: cdk.Duration.seconds(300),
        },
      );

    // Configure health check for the target group
    backendService.targetGroup.configureHealthCheck({
      path: "/health",
      healthyHttpCodes: "200",
      interval: cdk.Duration.seconds(30),
      timeout: cdk.Duration.seconds(5),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 5,
    });

    // ===========================================================================
    // Lambda Web Adaptor を使って　Lambda上にMCPサーバーをデプロイ
    //　===========================================================================

    // Create Lambda function for MCP server (force rebuild v3 - bundle.js fix)
    const mcpLambdaFunction = new lambda.Function(
      this,
      "AgentCoreMastraX402MCPServerFunction",
      {
        runtime: lambda.Runtime.NODEJS_22_X,
        code: lambda.Code.fromAsset(join(__dirname, "../../mcp"), {
          bundling: {
            image: lambda.Runtime.NODEJS_22_X.bundlingImage,
            user: "root",
            command: ["echo", "local bundling"], // Dummy command - local bundling will be used
            local: {
              tryBundle(outputDir: string) {
                try {
                  const sourceDir = join(__dirname, "../../mcp");
                  console.log(
                    `Building MCP Lambda from: ${sourceDir} to: ${outputDir}`,
                  );

                  // Check if bundle.js exists in source directory
                  const sourceBundlePath = join(sourceDir, "bundle.js");
                  if (!fs.existsSync(sourceBundlePath)) {
                    console.error(
                      "bundle.js not found in source directory. Please run 'pnpm mcp build' first.",
                    );
                    throw new Error(
                      "bundle.js not found. Run 'pnpm mcp build' before deploying.",
                    );
                  }

                  // Copy only necessary files for Lambda deployment
                  const filesToCopy = ["bundle.js", "run.sh"];

                  for (const file of filesToCopy) {
                    const srcPath = join(sourceDir, file);
                    const destPath = join(outputDir, file);
                    if (fs.existsSync(srcPath)) {
                      console.log(`Copying: ${file}`);
                      execSync(`cp ${srcPath} ${destPath}`, {
                        stdio: "inherit",
                      });
                    } else {
                      throw new Error(`Required file not found: ${file}`);
                    }
                  }

                  // Make run.sh executable
                  const runShPath = join(outputDir, "run.sh");
                  execSync(`chmod +x ${runShPath}`, {
                    stdio: "inherit",
                  });

                  // Verify bundle.js exists
                  const bundlePath = join(outputDir, "bundle.js");
                  if (!fs.existsSync(bundlePath)) {
                    throw new Error("bundle.js was not copied successfully");
                  }

                  // Get bundle.js file size
                  const bundleStats = fs.statSync(bundlePath);
                  console.log(
                    `Bundle file size: ${(bundleStats.size / 1024 / 1024).toFixed(2)} MB`,
                  );

                  // List final contents
                  console.log("Final Lambda package contents:");
                  execSync(`ls -la ${outputDir}`, { stdio: "inherit" });

                  console.log("Local bundling completed successfully");
                  return true;
                } catch (error) {
                  console.error("Local bundling failed:", error);
                  return false;
                }
              },
            },
          },
        }),
        handler: "run.sh",
        environment: {
          AWS_LAMBDA_EXEC_WRAPPER: "/opt/bootstrap",
          AWS_LAMBDA_INVOKE_MODE: "response_stream",
          RUST_LOG: "info",
          ENDPOINT_PATH: ENDPOINT_PATH || "/weather",
          PRIVATE_KEY: PRIVATE_KEY || "",
          RESOURCE_SERVER_URL: `http://${backendService.loadBalancer.loadBalancerDnsName}`,
        },
        timeout: cdk.Duration.minutes(15), // Lambda maximum timeout is 15 minutes (900 seconds)
        memorySize: 1024,
        architecture: lambda.Architecture.X86_64,
        layers: [
          lambda.LayerVersion.fromLayerVersionArn(
            this,
            "LambdaWebAdapterLayer",
            `arn:aws:lambda:${this.region}:753240598075:layer:LambdaAdapterLayerX86:24`,
          ),
        ],
      },
    );

    // Create Function URL for the MCP server
    const mcpFunctionUrl = mcpLambdaFunction.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      cors: {
        allowCredentials: true,
        allowedHeaders: ["*"],
        allowedMethods: [lambda.HttpMethod.ALL],
        allowedOrigins: ["*"],
        maxAge: cdk.Duration.seconds(86400),
      },
    });

    // Store MCP Server URL in SSM Parameter Store for runtime access
    const mcpServerUrlParameter = new ssm.StringParameter(
      this,
      "McpServerUrlParameter",
      {
        parameterName: "/agentcore/mastra/mcp-server-url",
        stringValue: mcpFunctionUrl.url,
        description:
          "MCP Server Function URL for Mastra Agent runtime configuration",
        tier: ssm.ParameterTier.STANDARD,
      },
    );

    // ===========================================================================
    // Amazon Bedrock AgentCore Runtime (正式なCfnRuntimeリソース)
    //　===========================================================================

    // Build Docker image for AgentCore Runtime using ECR Assets
    // Note: Environment variables like MCP_SERVER_URL must be set at runtime
    // since they contain CDK tokens that are resolved during deployment
    const agentCoreDockerImage = new ecr_assets.DockerImageAsset(
      this,
      "AgentCoreDockerImage",
      {
        directory: join(__dirname, "../../mastra-agent"),
        file: "Dockerfile",
        platform: ecr_assets.Platform.LINUX_ARM64, // ARM64 for cost optimization
      },
    );

    // Create IAM role for AgentCore Runtime
    const agentCoreRole = new iam.Role(this, "BedrockAgentCoreRole", {
      assumedBy: new iam.ServicePrincipal("bedrock-agentcore.amazonaws.com"),
      description: "IAM role for Bedrock AgentCore Runtime",
    });

    const region = cdk.Stack.of(this).region;
    const accountId = cdk.Stack.of(this).account;

    // ECR permissions
    agentCoreRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "ECRImageAccess",
        effect: iam.Effect.ALLOW,
        actions: ["ecr:BatchGetImage", "ecr:GetDownloadUrlForLayer"],
        resources: [`arn:aws:ecr:${region}:${accountId}:repository/*`],
      }),
    );

    agentCoreRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "ECRTokenAccess",
        effect: iam.Effect.ALLOW,
        actions: ["ecr:GetAuthorizationToken"],
        resources: ["*"],
      }),
    );

    // CloudWatch Logs permissions
    agentCoreRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["logs:DescribeLogStreams", "logs:CreateLogGroup"],
        resources: [
          `arn:aws:logs:${region}:${accountId}:log-group:/aws/bedrock-agentcore/runtimes/*`,
        ],
      }),
    );

    agentCoreRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["logs:DescribeLogGroups"],
        resources: [`arn:aws:logs:${region}:${accountId}:log-group:*`],
      }),
    );

    agentCoreRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["logs:CreateLogStream", "logs:PutLogEvents"],
        resources: [
          `arn:aws:logs:${region}:${accountId}:log-group:/aws/bedrock-agentcore/runtimes/*:log-stream:*`,
        ],
      }),
    );

    // X-Ray and CloudWatch Metrics permissions
    agentCoreRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords",
          "xray:GetSamplingRules",
          "xray:GetSamplingTargets",
        ],
        resources: ["*"],
      }),
    );

    agentCoreRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["cloudwatch:PutMetricData"],
        resources: ["*"],
        conditions: {
          StringEquals: {
            "cloudwatch:namespace": "bedrock-agentcore",
          },
        },
      }),
    );

    // Bedrock model invocation permissions
    agentCoreRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "BedrockModelInvocation",
        effect: iam.Effect.ALLOW,
        actions: [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream",
        ],
        resources: [
          "arn:aws:bedrock:*::foundation-model/*",
          `arn:aws:bedrock:${region}:${accountId}:*`,
        ],
      }),
    );

    // AgentCore workload identity permissions
    agentCoreRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "GetAgentAccessToken",
        effect: iam.Effect.ALLOW,
        actions: [
          "bedrock-agentcore:GetWorkloadAccessToken",
          "bedrock-agentcore:GetWorkloadAccessTokenForJWT",
          "bedrock-agentcore:GetWorkloadAccessTokenForUserId",
        ],
        resources: [
          `arn:aws:bedrock-agentcore:${region}:${accountId}:workload-identity-directory/default`,
          `arn:aws:bedrock-agentcore:${region}:${accountId}:workload-identity-directory/default/workload-identity/agentName-*`,
        ],
      }),
    );

    // SSM Parameter Store read permissions for runtime configuration
    agentCoreRole.addToPolicy(
      new iam.PolicyStatement({
        sid: "ReadSSMParameters",
        effect: iam.Effect.ALLOW,
        actions: ["ssm:GetParameter", "ssm:GetParameters"],
        resources: [
          `arn:aws:ssm:${region}:${accountId}:parameter/agentcore/mastra/*`,
        ],
      }),
    );

    // Create AgentCore Runtime
    // Note: CfnRuntime does not support direct environment variable configuration
    // The mastra-agent must:
    // 1. Use default/placeholder values for MCP_SERVER_URL during build
    // 2. Allow runtime configuration through external mechanisms (e.g., Parameter Store, Secrets Manager)
    // 3. Or implement a configuration service that reads from AWS resources
    //
    // For now, the MCP_SERVER_URL can be:
    // - Hardcoded if known in advance
    // - Retrieved from Parameter Store at container startup
    // - Passed through a custom runtime configuration endpoint
    //
    // The Dockerfile sets:
    // - PORT=8080 (required by AgentCore)
    // - NODE_ENV=production
    // - USE_GEMINI=true (for Bedrock models)
    const agentCoreRuntime = new agentcore.CfnRuntime(
      this,
      "MastraAgentCoreRuntime",
      {
        agentRuntimeName: "MastraAgentRuntime",
        agentRuntimeArtifact: {
          containerConfiguration: {
            containerUri: agentCoreDockerImage.imageUri,
          },
        },
        networkConfiguration: {
          networkMode: "PUBLIC",
        },
        roleArn: agentCoreRole.roleArn,
        protocolConfiguration: "HTTP",
      },
    );

    agentCoreRuntime.node.addDependency(agentCoreRole);

    // Create AgentCore Runtime Endpoint
    const agentCoreEndpoint = new agentcore.CfnRuntimeEndpoint(
      this,
      "MastraAgentCoreEndpoint",
      {
        agentRuntimeId: agentCoreRuntime.attrAgentRuntimeId,
        agentRuntimeVersion: agentCoreRuntime.attrAgentRuntimeVersion,
        name: "MastraAgentRuntimeEndpoint",
      },
    );

    // ===========================================================================
    // Fargateで Next.js Frontend をデプロイ
    //　===========================================================================

    // Create ECR repository reference for Frontend
    const frontendRepo = ecr.Repository.fromRepositoryName(
      this,
      "AgentCoreMastraFrontendRepo",
      "agentcore-mastra-frontend",
    );

    // Create Fargate service for Frontend
    const frontendService =
      new ecsPatterns.ApplicationLoadBalancedFargateService(
        this,
        "AgentCoreMastraFrontendService",
        {
          cluster,
          serviceName: "agentcore-frontend",
          cpu: 512,
          memoryLimitMiB: 1024,
          desiredCount: 1,
          taskImageOptions: {
            image: ecs.ContainerImage.fromEcrRepository(frontendRepo, "latest"),
            containerPort: 3000,
            environment: {
              PORT: "3000",
              NODE_ENV: "production",
              // Connect to AgentCore Runtime endpoint
              // Note: AgentCore endpoint URL format is: https://<endpoint-id>.agentcore.<region>.amazonaws.com
              AGENTCORE_RUNTIME_ARN: agentCoreRuntime.attrAgentRuntimeArn,
              AGENTCORE_ENDPOINT_NAME: agentCoreEndpoint.name,
            },
            logDriver: ecs.LogDrivers.awsLogs({
              streamPrefix: "agentcore-frontend",
              logGroup: new logs.LogGroup(
                this,
                "AgentCoreMastraFrontendLogGroup",
                {
                  logGroupName: "/aws/ecs/agentcore-frontend",
                  retention: logs.RetentionDays.ONE_WEEK,
                  removalPolicy: cdk.RemovalPolicy.DESTROY,
                },
              ),
            }),
          },
          publicLoadBalancer: true,
          assignPublicIp: true,
          healthCheckGracePeriod: cdk.Duration.seconds(300),
        },
      );

    // Configure health check for Frontend
    frontendService.targetGroup.configureHealthCheck({
      path: "/api/health",
      healthyHttpCodes: "200",
      interval: cdk.Duration.seconds(30),
      timeout: cdk.Duration.seconds(5),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 5,
    });

    // ===========================================================================
    // 成果物
    //　===========================================================================

    new cdk.CfnOutput(this, "AgentCoreMastraX402BackendApiUrl", {
      value: `http://${backendService.loadBalancer.loadBalancerDnsName}`,
      description: "x402 Backend API Load Balancer URL",
    });

    new cdk.CfnOutput(this, "AgentCoreMastraX402MCPServerUrl", {
      value: mcpFunctionUrl.url,
      description: "MCP Server Function URL",
    });

    new cdk.CfnOutput(this, "AgentCoreMastraX402MCPServerUrlParameter", {
      value: mcpServerUrlParameter.parameterName,
      description:
        "SSM Parameter Store name for MCP Server URL (used by AgentCore Runtime)",
    });

    new cdk.CfnOutput(this, "AgentCoreMastraRuntimeArn", {
      value: agentCoreRuntime.attrAgentRuntimeArn,
      description: "Amazon Bedrock AgentCore Runtime ARN",
    });

    new cdk.CfnOutput(this, "AgentCoreMastraRuntimeId", {
      value: agentCoreRuntime.attrAgentRuntimeId,
      description: "Amazon Bedrock AgentCore Runtime ID",
    });

    new cdk.CfnOutput(this, "AgentCoreMastraEndpointArn", {
      value: agentCoreEndpoint.attrAgentRuntimeEndpointArn,
      description: "Amazon Bedrock AgentCore Runtime Endpoint ARN",
    });

    new cdk.CfnOutput(this, "AgentCoreMastraFrontendUrl", {
      value: `http://${frontendService.loadBalancer.loadBalancerDnsName}`,
      description: "Frontend Application Load Balancer URL",
    });

    new cdk.CfnOutput(this, "AgentCoreMastraX402VpcId", {
      value: vpc.vpcId,
      description: "VPC ID",
    });
  }
}
