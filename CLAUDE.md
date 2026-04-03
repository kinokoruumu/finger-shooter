# Finger Shooter

手ジェスチャー（ガンポーズ）で遊ぶブラウザベースのシューティングゲーム。
カメラ映像はすべてクライアントサイドで処理し、サーバー送信は行わない。

## 技術スタック

- **ビルド**: Vite
- **UI**: React + TypeScript + Tailwind CSS v4 + shadcn/ui
- **ゲームエンジン**: Phaser 3（transparent: true で Canvas を重ねる）
- **手トラッキング**: @mediapipe/tasks-vision（HandLandmarker, VIDEO モード）
- **Lint/Format**: Biome

## コマンド

```bash
bun run dev        # 開発サーバー（別シェルで起動済み。重複起動禁止）
bun run build      # TypeScript チェック + Vite ビルド
bun run lint       # Biome check
bun run lint:fix   # Biome check --fix
bun run format     # Biome format --fix
```

## アーキテクチャ概要

### レイヤー構成（3層）

1. **最背面**: カメラ映像（`<video>` + `scaleX(-1)` でミラー表示）
2. **中間**: Phaser ゲームCanvas（transparent、ターゲット描画）
3. **最前面**: UI オーバーレイ（照準・スコア等、React）

### MediaPipe と Phaser の分離

- MediaPipe は独自の rAF ループで検出結果を共有状態に書き込む
- Phaser の `update()` で共有状態を読む非同期構造
- 座標のミラー変換（`x = 1 - normalized_x`）はトラッキング層で1箇所のみ行う

## ディレクトリ設計

co-location 方式。詳細は `.claude/rules/` を参照。
