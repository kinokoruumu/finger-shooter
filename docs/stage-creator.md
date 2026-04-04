# ステージクリエイター 設計

## 概要

ラウンド内の的・風船・列車の出現パターンをGUIで作成・編集できるツール。
作成したステージは localStorage に保存し、ゲーム開始時に通常/オリジナルを選択可能。

## 画面構成

### 1. ステージ一覧画面 (`/creator`)

- 作成済みステージの一覧（カード形式）
- 新規作成ボタン
- 各ステージに対して: 編集 / 削除 / 複製 / JSON エクスポート
- JSON インポートボタン
- 「ラウンド構成」設定: どのステージをラウンド1/2/3に割り当てるか

### 2. ステージ編集画面 (`/creator/:id`)

#### 2-1. タイムラインバー（画面下部）

- 横軸: 時間（0〜30秒）
- 動画編集ツール風のシーケンスバー
- グループごとに色分けしたブロック表示
- ドラッグで並べ替え、リサイズで duration 変更
- 再生ヘッド（現在位置インジケーター）
- グループ追加/削除ボタン
- 参考: [Remotion](https://github.com/remotion-dev/remotion) のタイムラインUI

#### 2-2. 的エディター（グループ選択時）

- 8x4 のグリッド表示
- 各セルをクリックで的を配置/削除
- 配置済みの的を右クリックまたは長押しで種類変更:
  - 通常(+1) → 金(+3) → ペナルティ(-3) → 削除
- hover 時にセルがハイライト
- 的ごとの出現遅延（delay）をセル上に表示、ドラッグで調整
- visibleDuration スライダー

#### 2-3. 風船エディター（グループ選択時）

- 画面中央に横一列のクリック可能な領域
- クリック位置 = 風船の横位置（nx）
- 「画面下から出現」を視覚的に示すガイド
- 配置済み風船の一覧（タイムライン上にも表示）
- 各風船の速度調整スライダー

#### 2-4. 列車エディター（グループ選択時）

- 画面右半分クリック = 右から出現、左半分 = 左から出現
- hover 時に該当半分が薄赤でハイライト
- 列車の側面ビュー（窓3つ × 3両）
- 各窓の上に的を配置可能（的エディターと同じ操作）
- 速度スライダー
- 的の上下揺れ（slotsOscillate）トグル

#### 2-5. 3Dプレビュー

- 編集中のグループをリアルタイムで3D表示
- 再生ボタンで出現アニメーションをプレビュー

### 3. ゲーム開始画面

- ウェルカム画面に「オリジナルステージで遊ぶ」ボタン追加
- 選択時にラウンド構成を選ぶダイアログ表示

## データ構造

```typescript
type CreatorTarget = {
  gx: number;
  gy: number;
  type: "ground" | "ground-gold" | "ground-penalty";
  delay: number; // ms
  visibleDuration: number; // 秒
};

type CreatorBalloon = {
  nx: number; // 0-1
  delay: number; // ms
  speed: number;
};

type CreatorTrain = {
  direction: 1 | -1;
  speed: number;
  slotsOscillate: boolean;
  slots: Array<{
    index: number; // 0-8 (3両×3窓)
    type: "normal" | "gold" | "penalty";
  }>;
};

type CreatorGroup = {
  id: string;
  type: "targets" | "balloons" | "train";
  targets?: CreatorTarget[];
  balloons?: CreatorBalloon[];
  train?: CreatorTrain;
};

type CreatorStage = {
  id: string;
  name: string;
  groups: CreatorGroup[];
  createdAt: number;
  updatedAt: number;
};

type RoundConfig = {
  round1: string | null; // CreatorStage ID or null (= デフォルト)
  round2: string | null;
  round3: string | null;
};
```

## 保存

- localStorage key: `matate-creator-stages`（ステージ一覧）
- localStorage key: `matate-round-config`（ラウンド構成）
- JSON エクスポート: `CreatorStage` を JSON 文字列に変換してダウンロード
- JSON インポート: ファイル選択 → パース → localStorage に追加

## UI コンポーネント（shadcn）

必要な shadcn コンポーネント:
- Dialog（設定ダイアログ、確認ダイアログ）
- Select（種類選択等）
- Slider（速度、遅延、duration調整）
- Tabs（的/風船/列車の切り替え）
- Input（ステージ名入力）
- Button
- Card（一覧表示）
- DropdownMenu（右クリックメニュー）
- Toast（保存完了通知）

## 実装フェーズ

### Phase 1: 基盤
- データ構造定義
- localStorage CRUD
- ステージ一覧画面
- JSON インポート/エクスポート

### Phase 2: 的エディター
- 8x4 グリッド UI
- クリックで配置/種類変更
- 遅延・duration 設定

### Phase 3: タイムライン
- グループ管理（追加/削除/並べ替え）
- タイムラインバー表示

### Phase 4: 風船・列車エディター
- 風船配置 UI
- 列車エディター（方向、的配置）

### Phase 5: プレビュー
- 3D プレビュー表示
- 再生/停止

### Phase 6: ゲーム統合
- ウェルカム画面にオリジナル選択
- CreatorStage → SpawnEntry[] 変換
- ラウンド構成設定
