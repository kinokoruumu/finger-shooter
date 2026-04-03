---
description: コンポーネントの設計・ディレクトリ構成ルール
globs: "src/**/*.{ts,tsx}"
---

# コンポーネント設計

## 基本ルール

- 1ファイルに1コンポーネントのみ
- コンポーネントは `component-name/index.tsx` に配置する
- コンポーネントを分割したい場合は `./internal/` ディレクトリに配置する
- カスタムフックが1つなら `hooks.ts`、複数必要な場合は `use-xxx.ts` のようにフック名のファイルにする（基本1つで済むように設計する）
- 必要に応じて `utils.ts` などに切り分ける
- 1ファイルのコード量が多くなる場合はコンポーネント分割を検討する
- これらのルールに従えない場合はユーザーに質問する

## ディレクトリ構造

```
component-a/
├─ index.tsx           # コンポーネント本体
├─ hooks.ts            # カスタムフック（1つの場合）
├─ use-xxx.ts          # カスタムフック（複数の場合はフック名で分割）
├─ utils.ts            # 専用ユーティリティ
├─ internal/           # 内部実装
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

### schema.ts

zod スキーマ定義と FormInput 型を export する。

```typescript
import { z } from "zod";

export const schemaName = z.object({
  featureName: z.object({
    property1: z.string(),
    property2: z.number(),
  }),
});

export type FormInput = z.infer<typeof schemaName>;
```

### utils.ts

デフォルト値の生成と、フォーム入力から API payload への変換を担う。

```typescript
import type { FormInput } from "./schema";

type CreateDefaultValuesPayload = {
  featureName?: {
    property1?: string;
    property2?: number;
  };
};

export const createDefaultValues = (
  payload?: CreateDefaultValuesPayload,
): FormInput => {
  return {
    featureName: {
      property1: payload?.featureName?.property1 ?? "",
      property2: payload?.featureName?.property2 ?? 0,
    },
  };
};

export const formInputToPayload = ({
  data,
  otherParams,
}: {
  data: FormInput;
  otherParams: string | number;
}) => {
  return {
    ...data.featureName,
    otherParams,
  };
};
```

### hooks.ts

useForm の呼び出しと onSubmit ハンドラを定義する。

```typescript
import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback } from "react";
import { useForm } from "react-hook-form";

import { type FormInput, schemaName } from "./schema";
import { createDefaultValues, formInputToPayload } from "./utils";

export const useComponentName = ({ params }) => {
  const { data: featureData } = useFeatureData(params);

  const values = featureData
    ? createDefaultValues({ featureName: featureData })
    : undefined;

  const form = useForm<FormInput>({
    resolver: zodResolver(schemaName),
    mode: "onSubmit",
    values,
    defaultValues: createDefaultValues(),
  });

  const onSubmit = useCallback(
    async (data: FormInput) => {
      const payload = formInputToPayload({ data, otherParams: params });
      await submitData(payload);
    },
    [params],
  );

  return {
    form,
    onSubmit,
  };
};
```

### index.tsx

UI のみ。ロジックは hooks に委譲する。

```typescript
import { useComponentName } from "./hooks";

type Props = {
  param1: string;
  param2: number;
};

export const ComponentName = ({ param1, param2 }: Props) => {
  const { form, onSubmit } = useComponentName({ param1, param2 });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        {/* フォーム要素 */}
      </form>
    </Form>
  );
};
```
