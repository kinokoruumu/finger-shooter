# スマホ対応 TODO

## P0（必須）

- [ ] `viewport-fit=cover` 追加（index.html）
- [ ] MediaPipe GPU delegate のフォールバック（GPU失敗時にCPUで再初期化）
- [ ] iOS Safari の `100vh` 問題（`h-screen` → `h-dvh`）

## P1（重要）

- [ ] SafeArea の padding 対応（ノッチ/Dynamic Island下のUI回避）
- [ ] Three.js Canvas の `powerPreference: "low-power"`, `antialias: false`
- [ ] カメラ解像度をスマホ向けに調整（portrait時の向き考慮）

## P2（改善）

- [ ] 画面回転時のリサイズ対応
- [ ] 的のスケールが縦長画面で崩れないか再確認
- [ ] ボタンのタッチ遅延対応（onTouchEnd追加）

## P3（あると良い）

- [ ] MediaPipe Wasm のタイムアウト処理（低速ネットワーク対策）
- [ ] パーティクル数をスマホで削減（バッテリー・パフォーマンス）
