#!/usr/bin/env bash

set -euo pipefail

PNPM_VERSION="10.33.0"
CDK_VERSION="2"

export NPM_CONFIG_PREFIX="${HOME}/.local"
export PATH="${NPM_CONFIG_PREFIX}/bin:${HOME}/.local/bin:${PATH}"

if command -v pnpm >/dev/null 2>&1; then
	echo "Using existing pnpm ($(pnpm -v))"
elif command -v corepack >/dev/null 2>&1 && corepack prepare "pnpm@${PNPM_VERSION}" --activate; then
	echo "Using pnpm via corepack (${PNPM_VERSION})"
else
	echo "corepack prepare failed, installing pnpm@${PNPM_VERSION} under $HOME/.local"
	npm install -g "pnpm@${PNPM_VERSION}"
fi

if command -v pnpm >/dev/null 2>&1; then
	pnpm install
	PNPM_VERSION_ACTUAL="$(pnpm -v)"
else
	corepack pnpm install
	PNPM_VERSION_ACTUAL="$(corepack pnpm -v)"
fi

if command -v cdk >/dev/null 2>&1; then
	echo "Using existing AWS CDK ($(cdk --version))"
else
	echo "Installing AWS CDK v${CDK_VERSION} under $HOME/.local"
	npm install -g "aws-cdk@${CDK_VERSION}"
fi

if command -v uv >/dev/null 2>&1; then
	echo "Using existing uv ($(uv --version))"
else
	echo "Installing uv under $HOME/.local/bin"
	if command -v curl >/dev/null 2>&1; then
		curl -fsSL https://astral.sh/uv/install.sh | sh
	elif command -v wget >/dev/null 2>&1; then
		wget -qO- https://astral.sh/uv/install.sh | sh
	else
		echo "Neither curl nor wget is available for installing uv" >&2
		exit 1
	fi
fi

echo "Node: $(node -v)"
echo "pnpm: ${PNPM_VERSION_ACTUAL}"
echo "AWS CLI: $(aws --version 2>&1)"
echo "AWS CDK: $(cdk --version)"
echo "uv: $(uv --version)"
