# Finger Shooter

手ジェスチャー（ガンポーズ）で遊ぶブラウザベースのシューティングゲーム。
カメラ映像はすべてクライアントサイドで処理し、サーバー送信は行わない。

## 技術スタック

- Vite + React + TypeScript
- Tailwind CSS v4 + shadcn/ui
- Biome
- Phaser 3
- @mediapipe/tasks-vision

## コマンド

```bash
bun run dev        # 開発サーバー（別シェルで起動済み。重複起動禁止）
bun run build      # TypeScript チェック + Vite ビルド
bun run lint       # Biome check
bun run lint:fix   # Biome check --fix
bun run format     # Biome format --fix
```
