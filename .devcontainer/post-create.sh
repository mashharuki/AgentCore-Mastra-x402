#!/usr/bin/env bash

set -euo pipefail

corepack enable

if ! corepack prepare pnpm@10.7.0 --activate; then
	echo "corepack prepare failed, falling back to npm install -g pnpm@10.7.0"
	npm install -g pnpm@10.7.0
fi

pnpm install

echo "Node: $(node -v)"
echo "pnpm: $(pnpm -v)"
echo "AWS CLI: $(aws --version 2>&1)"