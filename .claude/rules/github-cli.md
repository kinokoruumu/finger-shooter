---
description: GitHub CLI の使い方に関するルール
globs: ""
---

# GitHub CLI

## PR 編集

`gh pr edit` は不安定で落ちるため使用禁止。代わりに `gh api` を使う。

```bash
# タイトル変更
gh api repos/{owner}/{repo}/pulls/{number} -X PATCH -f title="新しいタイトル"

# 本文変更
gh api repos/{owner}/{repo}/pulls/{number} -X PATCH -f body="新しい本文"

# ラベル追加
gh api repos/{owner}/{repo}/issues/{number}/labels -X POST -f labels[]="bug"
```

## PR 作成・その他

- `gh pr create` は問題なく使える
- `gh pr view`, `gh pr list` 等の読み取り系も問題なし
