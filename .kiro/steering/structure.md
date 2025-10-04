---
inclusion: always
---

# プロジェクト構造

プロジェクト構成は以下のフォルダ構成を参考にしてください。

誰でもわかるように可読性や保守性の高いプロジェクト構造(モノレポ)としてください

```bash
├── README.md               # README.md
├── pkgs
│    ├── cdk  # AWS CDK用のフォルダ
│    └── app  # Next.js + Mastraのフロントエンドアプリケーション用のフォルダ
├── pnpm-workspace.yaml # モノレポ設定ファイル
├── pnpm-lock.yaml
├── biome.json          # Biome設定ファイル
└── .gitignore
```