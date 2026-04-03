---
description: GitHub CLI の使い方に関するルール
globs: ""
---

# GitHub CLI

## PR 編集

`gh pr edit` は Projects Classic 廃止に起因する GraphQL エラーで失敗する。
PR の編集には必ず `gh api` を使うこと。

```
GraphQL: Projects (classic) is being deprecated in favor of the new Projects experience
```

### gh api での PR 編集例

```bash
# タイトル変更
gh api repos/{owner}/{repo}/pulls/{number} -X PATCH -f title="新しいタイトル"

# 本文変更
gh api repos/{owner}/{repo}/pulls/{number} -X PATCH -f body="新しい本文"

# 複数フィールド同時変更
gh api repos/{owner}/{repo}/pulls/{number} -X PATCH \
  -f title="タイトル" \
  -f body="本文"

# ラベル追加
gh api repos/{owner}/{repo}/issues/{number}/labels -X POST -f labels[]="bug"
```

## PR 作成・その他

- `gh pr create` は問題なく使える
- `gh pr view`, `gh pr list` 等の読み取り系も問題なし

## PR の記述言語

- タイトル・本文ともに **日本語** で書く
