# ステージクリエイター 設計 v2

## コンセプト

**実際のゲーム画面上で直感的にステージを作成する。**
クリック = 配置。クリックのタイミング = 出現遅延。
作成体験がゲームプレイに近い。

## 画面構成

### 1. ステージ一覧 (`/creator`)

- 作成済みステージのカード一覧
- 新規作成 / 編集 / 削除 / 複製
- JSON エクスポート/インポート
- ラウンド構成設定（どのステージをどのラウンドに割り当てるか）

### 2. ステージエディター (`/creator/:id`)

#### メインキャンバス（画面中央）
- 実際のゲームと同じ 3D Canvas
  - 同じカメラ設定、ライティング、背景画像
  - 的、風船、列車の 3D モデルも同じものを使用
- クリックで的/風船/列車を配置
- 配置した瞬間に出現アニメーション + 音が再生される
- 8x4 のグリッドガイドを半透明で表示（的モード時）

#### ツールバー（画面上部）
- モード切替: 的 / 風船 / 列車
- 的の種類: 通常(+1) / 金(+3) / ペナ(-3)
- グループ管理: 新規グループ / グループ選択
- 操作: 元に戻す(undo) / 再生 / 停止 / クリア
- ステージ名編集
- 保存 / 一覧に戻る

#### タイムライン（画面下部）
- 横軸: グループ内の時間
- グループごとにタブまたは色分けブロック
- 各イベント（的/風船/列車）が時間軸上にドットやバーで表示
- ドラッグでイベントの delay を微調整
- グループの追加/削除/並べ替え

#### サイドパネル（画面右、展開可能）
- 選択中のイベントの詳細設定
  - 的: 種類、delay、visibleDuration
  - 風船: 横位置(nx)、delay、速度
  - 列車: 方向、速度、slotsOscillate、各窓の的の種類
- グリッド俯瞰ビュー（的の配置を確認）

### 3. 作成モードの操作

#### 的モード
1. Canvas 上をクリック
2. 最も近いグリッドセル (gx, gy) にスナップ
3. 実際の 3D GroundTarget がアニメーション付きで出現
4. 音も再生
5. 「録画開始」からの経過時間が delay として記録
6. 右クリックで種類変更 (+1 → +3 → -3 → 削除)
7. 配置済みの的はクリックで選択 → サイドパネルで詳細編集

#### 風船モード
1. Canvas 下部付近をクリック
2. クリックの横位置 (nx) に風船が出現
3. 実際に上昇アニメーション開始
4. 速度はデフォルト（後からサイドパネルで調整可）

#### 列車モード
1. Canvas の左端 or 右端をクリック
2. クリック位置で方向を決定（左端=左から、右端=右から）
3. 列車が実際に走り始める
4. サイドパネルで窓の的を設定

### 4. 再生モード
- 「再生」ボタンでグループ0から順に再生
- 実際のゲームと同じアニメーション、音、タイミング
- 停止/リセットボタン
- 再生中は配置操作不可

### 5. ゲーム統合
- ウェルカム画面に「オリジナルステージ」ボタン
- ラウンド構成を選択するダイアログ
- CreatorStage → SpawnEntry[] 変換関数

## データ構造

```typescript
type CreatorTarget = {
  gx: number;
  gy: number;
  type: "ground" | "ground-gold" | "ground-penalty";
  delay: number;       // グループ内の相対時間(ms)
  visibleDuration: number; // 秒
};

type CreatorBalloon = {
  nx: number;          // 横位置 0-1
  delay: number;       // ms
  speed: number;
};

type CreatorTrain = {
  direction: 1 | -1;
  speed: number;
  slotsOscillate: boolean;
  goldSlots: number;
  penaltySlots: number;
};

type CreatorGroupType = "targets" | "balloons" | "train";

type CreatorGroup = {
  id: string;
  type: CreatorGroupType;
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
```

## 保存
- localStorage: `matate-creator-stages`, `matate-round-config`
- JSON エクスポート/インポート

## UI コンポーネント（shadcn/Radix）
- Dialog（設定、確認）
- Tabs（モード切替）
- Slider（速度、遅延調整）
- Input（名前入力）
- Card（一覧）
- DropdownMenu（右クリックメニュー）
- Button

## 実装フェーズ

### Phase 1: 基盤 ✅
- データ構造、localStorage CRUD、一覧画面

### Phase 2: 3D キャンバスエディター（やり直し）
- 実際のゲームと同じ Canvas を配置
- グリッドガイド表示
- クリックで的を配置（3Dモデル + アニメーション + 音）
- ツールバー（モード切替、種類選択）

### Phase 3: タイムライン
- グループ管理 UI
- 時間軸上のイベント表示
- ドラッグで delay 調整

### Phase 4: 風船・列車エディター
- 風船: クリックで配置
- 列車: 左右クリックで方向、窓の的設定

### Phase 5: 再生/プレビュー
- 作成したパターンを再生
- 音付き

### Phase 6: サイドパネル・詳細編集
- 選択中イベントの詳細設定
- グリッド俯瞰ビュー

### Phase 7: ゲーム統合
- ウェルカム画面にオリジナル選択
- CreatorStage → SpawnEntry[] 変換
