---
description: TypeScript/React のコーディング規約
globs: "src/**/*.{ts,tsx}"
---

# コーディングスタイル

## TypeScript

- `interface` ではなく `type` を使う
- `any` は使わない。どうしても必要な場合は確認を取る
- `as` キャストに逃げる前に設計を見直す
- 5行以上の型処理が必要なら設計が間違っている可能性を疑う
- Web標準の型が間違っているのではなく、自分の使い方を疑う

## React コンポーネント

- コンポーネントは `const` + arrow function で定義する（`function` ではなく）
- Props の型名は常に `Props`（`ComponentNameProps` ではない）
- className は `cn()` でマージ・条件分岐する

```tsx
// ✅ 良い例
type Props = {
  title: string;
  isActive: boolean;
};

export const MyComponent = ({ title, isActive }: Props) => {
  return (
    <div className={cn("px-4 py-2", isActive && "bg-blue-500")}>
      {title}
    </div>
  );
};
```

## スタイリング

- Tailwind CSS + shadcn/ui のコンポーネント・記法を最大限活用する
- カスタムCSSは最終手段

## インポート

- パスエイリアス `@/` を使う
- Biome の organizeImports に従う
