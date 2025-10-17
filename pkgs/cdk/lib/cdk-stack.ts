import * as cdk from "aws-cdk-lib";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as ecsPatterns from "aws-cdk-lib/aws-ecs-patterns";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as logs from "aws-cdk-lib/aws-logs";
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
    const vpc = new ec2.Vpc(this, "X402Vpc", {
      maxAzs: 2,
      natGateways: 1,
    });

    // ===========================================================================
    // Fargateでx402のバックエンドサーバー(コンテンツサーバー)をデプロイ
    //　===========================================================================

    // Create ECR repository reference (assuming it already exists)
    const backendRepo = ecr.Repository.fromRepositoryName(
      this,
      "BackendRepo",
      "x402-backend-api",
    );

    // Create ECS cluster
    const cluster = new ecs.Cluster(this, "X402Cluster", {
      vpc,
      clusterName: "x402-cluster",
    });

    // Create Fargate service for backend API
    const backendService =
      new ecsPatterns.ApplicationLoadBalancedFargateService(
        this,
        "BackendService",
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
              logGroup: new logs.LogGroup(this, "BackendLogGroup", {
                logGroupName: "/aws/ecs/x402-backend",
                retention: logs.RetentionDays.ONE_WEEK,
                removalPolicy: cdk.RemovalPolicy.DESTROY,
              }),
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
      "x402WalrusMCPServerFunction",
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

                  // Copy necessary files (not node_modules)
                  const filesToCopy = [
                    "src",
                    "package.json",
                    "tsconfig.json",
                    "esbuild.js",
                    "bundle.js",
                    "run.sh",
                  ];

                  for (const file of filesToCopy) {
                    const srcPath = join(sourceDir, file);
                    const destPath = join(outputDir, file);
                    if (fs.existsSync(srcPath)) {
                      execSync(`cp -r ${srcPath} ${destPath}`, {
                        stdio: "inherit",
                      });
                    }
                  }

                  // Install dependencies
                  console.log("Installing dependencies...");
                  try {
                    execSync("npm install --no-package-lock --no-save", {
                      cwd: outputDir,
                      stdio: "inherit",
                    });
                  } catch (error) {
                    console.warn("npm install failed, trying with --force");
                    execSync(
                      "npm install --no-package-lock --no-save --force",
                      {
                        cwd: outputDir,
                        stdio: "inherit",
                      },
                    );
                  }

                  // Build the project (tsc + esbuild)
                  console.log("Building project...");
                  execSync("npm run build", {
                    cwd: outputDir,
                    stdio: "inherit",
                  });

                  // Verify bundle.js exists before cleanup
                  const bundlePathBeforeCleanup = join(outputDir, "bundle.js");
                  console.log(
                    `Checking for bundle.js before cleanup: ${bundlePathBeforeCleanup}`,
                  );
                  if (!fs.existsSync(bundlePathBeforeCleanup)) {
                    console.error("bundle.js was not created by build process");
                    // List all files to debug
                    execSync(`find ${outputDir} -name "*.js" -type f`, {
                      stdio: "inherit",
                    });
                    throw new Error(
                      "bundle.js was not created by build process",
                    );
                  }

                  // Clean up files not needed in Lambda (but keep bundle.js and run.sh)
                  console.log("Cleaning up files...");
                  const filesToRemove = [
                    "package.json",
                    "node_modules",
                    "tsconfig.json",
                    "src",
                    "esbuild.js",
                    "dist", // distフォルダも削除（bundle.jsがあるので不要）
                  ];

                  for (const file of filesToRemove) {
                    const filePath = join(outputDir, file);
                    if (fs.existsSync(filePath)) {
                      console.log(`Removing: ${filePath}`);
                      execSync(`rm -rf ${filePath}`, { stdio: "inherit" });
                    }
                  }

                  // Make run.sh executable
                  const runShPath = join(outputDir, "run.sh");
                  if (fs.existsSync(runShPath)) {
                    execSync(`chmod +x ${runShPath}`, {
                      stdio: "inherit",
                    });
                  }

                  // Verify bundle.js still exists after cleanup
                  const bundlePath = join(outputDir, "bundle.js");
                  if (!fs.existsSync(bundlePath)) {
                    throw new Error("bundle.js was removed during cleanup");
                  }
                  console.log(
                    `Bundle file exists after cleanup: ${bundlePath}`,
                  );

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

    // ===========================================================================
    // 成果物
    //　===========================================================================

    new cdk.CfnOutput(this, "BackendApiUrl", {
      value: `http://${backendService.loadBalancer.loadBalancerDnsName}`,
      description: "Backend API Load Balancer URL",
    });

    new cdk.CfnOutput(this, "MCPServerUrl", {
      value: mcpFunctionUrl.url,
      description: "MCP Server Function URL",
    });

    new cdk.CfnOutput(this, "VpcId", {
      value: vpc.vpcId,
      description: "VPC ID",
    });
  }
}
