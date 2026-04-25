#!/bin/bash
# CDK_DOCKER wrapper: `docker build` を `docker buildx build --builder multiarch` に転送します
# CDK が --platform linux/arm64 を指定した際にARMイメージをビルドするために使用します。
#
# 使い方:
#   export CDK_DOCKER=/workspaces/AgentCore-Mastra-x402/docker-buildx-wrapper.sh
#   pnpm cdk run deploy 'AgentCoreMastraX402Stack'

if [[ "$1" == "build" ]]; then
  shift
  exec docker buildx build --builder multiarch --load "$@"
fi

exec docker "$@"
