---
description: src/ 配下のディレクトリ構成ルール
globs: "src/**/*.{ts,tsx}"
---

# ディレクトリ構成

co-location 方式。機能に関するコードはできるだけ feature ディレクトリに寄せる。

## `src/features/`

機能別にディレクトリを分割する。

```
src/features/
├─ project/          # 例: プロジェクト機能
│  ├─ components/    # 機能専用コンポーネント
│  ├─ hooks/         # 機能専用カスタムフック
│  ├─ routes/        # ルーティング定義
│  ├─ api/           # API関数とリクエスト/レスポンス型定義
│  ├─ utils/         # 機能専用ユーティリティ
│  └─ constants/     # 機能専用定数
├─ auth/             # 例: 認証機能
│  └─ ...
```

## 共通ディレクトリ

feature に依存しない汎用的なコードを置く。

- `src/components/shared/` — 汎用コンポーネント
- `src/components/layouts/` — レイアウト関連コンポーネント
- `src/components/forms/` — フォーム関連コンポーネント
- `src/components/ui/` — shadcn コンポーネント（このディレクトリのみコンポーネント設計ルールに従わなくてよい）
- `src/hooks/` — 共通カスタムフック
- `src/utils/` — 共通ユーティリティ関数
- `src/types/` — 共通の型定義（肥大化しやすいので、feature に寄せられるものは feature 側に置く）
- `src/constants/` — 共通定数

## 判断基準

- 型定義・ユーティリティ等は **まず feature 内に置く**
- 共通ディレクトリに昇格させるかは **参照数ではなく抽象度で判断する**
  - 特定の feature に紐づく概念なら、他の feature から参照されていても feature 内に留める
  - feature に依存しない汎用的な概念であれば共通ディレクトリに置く
