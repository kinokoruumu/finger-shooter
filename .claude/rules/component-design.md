---
description: コンポーネントの設計・ディレクトリ構成ルール
globs: "src/**/*.tsx"
---

# コンポーネント設計

## 基本ルール

- 1ファイルに1コンポーネントのみ
- コンポーネントは `component-name/index.tsx` に配置する
- コンポーネントを分割したい場合は `./internal/` ディレクトリに配置する
- 必要に応じて `hooks.ts`, `utils.ts` などに切り分ける
- 1ファイルのコード量が多くなる場合はコンポーネント分割を検討する
- これらのルールに従えない場合はユーザーに質問する

## ディレクトリ構造

```
component-a/
├─ index.tsx        # コンポーネント本体
├─ hooks.ts         # 専用カスタムフック
├─ utils.ts         # 専用ユーティリティ
├─ internal/        # 内部実装
│  └─ component-b/
│     ├─ index.tsx
│     ├─ hooks.ts
│     └─ utils.ts
```

## フォームコンポーネント

フォーム関連は以下の4ファイル構成で実装する：

```
component-name/
├── index.tsx      # コンポーネント（UIのみ）
├── hooks.ts       # useForm + onSubmit ロジック
├── utils.ts       # createDefaultValues, 変換関数
└── schema.ts      # zod スキーマ + FormInput 型
```

- `schema.ts`: zod スキーマ定義と `FormInput` 型の export
- `utils.ts`: デフォルト値生成、フォーム入力→API payload の変換
- `hooks.ts`: `useForm` 呼び出し、`onSubmit` ハンドラ
- `index.tsx`: フォームUI（ロジックは hooks に委譲）
